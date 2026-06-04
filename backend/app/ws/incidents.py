import asyncio
import json

import redis.asyncio as aioredis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.redis_client import redis_client

log = get_logger(__name__)
router = APIRouter()

CHANNEL = "incidents:new"
_settings = get_settings()


class ConnectionManager:
    def __init__(self) -> None:
        self.active: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        async with self._lock:
            self.active.add(ws)
        log.info("ws_client_connected", total=len(self.active))

    async def disconnect(self, ws: WebSocket) -> None:
        async with self._lock:
            self.active.discard(ws)
        log.info("ws_client_disconnected", total=len(self.active))

    async def broadcast(self, message: str) -> None:
        dead: list[WebSocket] = []
        for ws in list(self.active):
            try:
                await ws.send_text(message)
            except Exception:
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)


manager = ConnectionManager()


async def _pubsub_loop() -> None:
    """Subscribe to the Redis channel and broadcast each message to all WS clients."""
    while True:
        try:
            client = aioredis.from_url(_settings.redis_url, decode_responses=True)
            pubsub = client.pubsub()
            await pubsub.subscribe(CHANNEL)
            log.info("ws_pubsub_subscribed", channel=CHANNEL)
            async for msg in pubsub.listen():
                if msg.get("type") == "message":
                    await manager.broadcast(msg["data"])
        except Exception as e:
            log.warning("ws_pubsub_error", error=f"{type(e).__name__}: {e}")
            await asyncio.sleep(2)  # backoff before reconnect


def publish_incident(incident_id: int, service_id: int, title: str) -> None:
    """Publish a new-incident event to the Redis channel (sync — called from API/Celery)."""
    try:
        redis_client.publish(
            CHANNEL,
            json.dumps({"incident_id": incident_id, "service_id": service_id, "title": title}),
        )
    except Exception as e:
        log.warning("publish_incident_failed", error=str(e))


@router.websocket("/ws/incidents")
async def ws_incidents(ws: WebSocket) -> None:
    await manager.connect(ws)
    try:
        await ws.send_text(json.dumps({"event": "connected"}))
        while True:
            # Server-driven heartbeat; the client doesn't need to send anything.
            await asyncio.sleep(20)
            try:
                await ws.send_text(json.dumps({"event": "ping"}))
            except Exception:
                break
    except WebSocketDisconnect:
        pass
    finally:
        await manager.disconnect(ws)
