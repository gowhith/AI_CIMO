"""Wrapper around IBM watsonx.ai. Falls back to a deterministic stub when disabled
or when the live call fails. The stub keeps the system fully runnable without
watsonx credentials so local dev, CI, and demos work out of the box.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass

from app.core.config import get_settings
from app.core.logging import get_logger

log = get_logger(__name__)


@dataclass
class RCAResult:
    summary: str
    root_cause: str
    recommended_steps: str
    confidence: float
    model_used: str


PROMPT_TEMPLATE = """<|system|>
You are a senior Site Reliability Engineer. Diagnose production incidents.
Output ONLY a single JSON object — no prose before or after — with exactly these keys:
  "summary"            (string, one paragraph)
  "root_cause"         (string, one paragraph)
  "recommended_steps"  (string, numbered list separated by newlines)
  "confidence"         (number between 0 and 1)
<|user|>
Service: {service_name}
Most recent deployment: {deployment}
Recent ERROR/CRITICAL logs (newest first):
{errors}

Produce the JSON now.
<|assistant|>
"""


def _stub_rca(service_name: str, errors: list[str], deployment: str) -> RCAResult:
    joined = " | ".join(errors[:5]).lower()

    if "connection" in joined and (
        "timeout" in joined or "pool" in joined or "refused" in joined
    ):
        cause = (
            f"The {service_name} appears unable to reach its database. "
            "Connection pool exhaustion or a network partition is the most likely cause."
        )
        steps = (
            "1. Check database container health and connectivity.\n"
            "2. Verify DB connection pool size & idle timeouts.\n"
            "3. Review the most recent deployment for config changes.\n"
            "4. Check service env vars (DB host/port/credentials).\n"
            "5. Restart the service if the database is healthy."
        )
    elif "memory" in joined or "oom" in joined:
        cause = f"{service_name} is running out of memory."
        steps = (
            "1. Check container memory limits & current usage.\n"
            "2. Look for memory leaks in recent commits.\n"
            "3. Scale horizontally or raise container memory limit.\n"
            "4. Roll back if a recent deploy correlates."
        )
    elif "401" in joined or "403" in joined or "unauthorized" in joined or "forbidden" in joined:
        cause = (
            f"{service_name} is rejecting requests due to authentication / authorization failures."
        )
        steps = (
            "1. Verify token/JWT signing keys are correctly distributed.\n"
            "2. Check RBAC policy and recent auth code changes.\n"
            "3. Inspect upstream identity provider availability."
        )
    elif "500" in joined or "internal server error" in joined:
        cause = f"{service_name} is throwing unhandled exceptions in request handlers."
        steps = (
            "1. Look at stack traces in the logs.\n"
            "2. Identify the failing endpoint(s).\n"
            "3. Roll back if a recent deploy correlates.\n"
            "4. Add error handling around the failing call site."
        )
    else:
        cause = f"{service_name} is producing repeated errors. Manual log review recommended."
        steps = (
            "1. Review the most recent error logs for stack traces.\n"
            "2. Correlate with the last deployment.\n"
            "3. Check downstream dependency health.\n"
            "4. Roll back if a recent deploy correlates."
        )

    summary = (
        f"The {service_name} service is producing repeated errors "
        f"({len(errors)} recent error log(s)). Most recent deployment: {deployment}."
    )
    return RCAResult(
        summary=summary,
        root_cause=cause,
        recommended_steps=steps,
        confidence=0.55,
        model_used="rule-based-stub-v1",
    )


def _extract_json(text: str) -> dict:
    """Pull a JSON object out of free-form model output."""
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.MULTILINE)
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        raise ValueError("no JSON object in model output")
    return json.loads(match.group(0))


def _build_model():
    """Build a watsonx.ai ModelInference. Raises if SDK / creds are missing."""
    from ibm_watsonx_ai import Credentials
    from ibm_watsonx_ai.foundation_models import ModelInference

    settings = get_settings()
    if not settings.watsonx_api_key:
        raise RuntimeError("WATSONX_API_KEY is not set")
    if not settings.watsonx_project_id:
        raise RuntimeError("WATSONX_PROJECT_ID is not set")

    creds = Credentials(url=settings.watsonx_url, api_key=settings.watsonx_api_key)
    return ModelInference(
        model_id=settings.watsonx_model_id,
        credentials=creds,
        project_id=settings.watsonx_project_id,
        params={
            "decoding_method": "greedy",
            "max_new_tokens": 700,
            "min_new_tokens": 50,
            "repetition_penalty": 1.05,
            "stop_sequences": ["<|user|>", "<|system|>"],
        },
    )


def ping() -> dict:
    """Lightweight reachability check used by /ai/health."""
    settings = get_settings()
    if not settings.watsonx_enabled:
        return {"enabled": False, "ok": False, "reason": "WATSONX_ENABLED=false"}
    if not settings.watsonx_api_key or not settings.watsonx_project_id:
        return {"enabled": True, "ok": False, "reason": "missing api_key or project_id"}
    try:
        model = _build_model()
        out = model.generate_text(prompt="Respond with the single word: ok")
        text = out if isinstance(out, str) else out.get("results", [{}])[0].get(
            "generated_text", ""
        )
        return {
            "enabled": True,
            "ok": True,
            "url": settings.watsonx_url,
            "model": settings.watsonx_model_id,
            "sample": text.strip()[:80],
        }
    except Exception as e:
        return {"enabled": True, "ok": False, "reason": f"{type(e).__name__}: {e}"}


def analyze(service_name: str, errors: list[str], deployment: str) -> RCAResult:
    settings = get_settings()
    if not settings.watsonx_enabled:
        return _stub_rca(service_name, errors, deployment)
    if not settings.watsonx_api_key or not settings.watsonx_project_id:
        log.warning("watsonx_missing_creds_falling_back")
        return _stub_rca(service_name, errors, deployment)

    prompt = PROMPT_TEMPLATE.format(
        service_name=service_name,
        deployment=deployment,
        errors="\n".join(f"- {e}" for e in errors[:20]) or "- (no recent errors captured)",
    )
    try:
        model = _build_model()
        raw = model.generate_text(prompt=prompt)
        text = raw if isinstance(raw, str) else raw.get("results", [{}])[0].get(
            "generated_text", ""
        )
        log.info("watsonx_response_received", chars=len(text))
        data = _extract_json(text)
        return RCAResult(
            summary=str(data.get("summary", "")).strip() or "No summary returned",
            root_cause=str(data.get("root_cause", "")).strip(),
            recommended_steps=str(data.get("recommended_steps", "")).strip(),
            confidence=float(data.get("confidence", 0.6)),
            model_used=settings.watsonx_model_id,
        )
    except Exception as e:
        log.warning("watsonx_call_failed", error=f"{type(e).__name__}: {e}")
        result = _stub_rca(service_name, errors, deployment)
        result.model_used = f"{result.model_used} (watsonx failed)"
        return result
