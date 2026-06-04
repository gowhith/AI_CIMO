from app.ai_analysis.watsonx_client import _stub_rca


def test_stub_rca_detects_db_connection_pattern():
    r = _stub_rca("payment-service", ["DB connection timeout"], "v1.0")
    assert "database" in r.root_cause.lower()
    assert r.confidence > 0
    assert "1." in r.recommended_steps


def test_stub_rca_detects_oom_pattern():
    r = _stub_rca("api", ["OOM killed", "out of memory"], "v2")
    assert "memory" in r.root_cause.lower()


def test_stub_rca_generic_fallback():
    r = _stub_rca("svc", ["random error"], "v1")
    assert r.summary
    assert r.recommended_steps
