import json
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from app.services.auth import get_user_by_id, verify_token
from app.services.notifications import mark_notification_read
from app.services.socket_manager import websocket_manager

router = APIRouter()


def _extract_token(websocket: WebSocket) -> Optional[str]:
    query_token = websocket.query_params.get("token")
    if query_token:
        return query_token

    auth_header = websocket.headers.get("Authorization") or websocket.headers.get("authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header.split(" ", 1)[1]

    return None


async def _authenticate(websocket: WebSocket, user_id: str) -> Optional[dict]:
    token = _extract_token(websocket)
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing token")
        return None

    payload = verify_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return None

    subject = payload.get("sub")
    if not subject or subject != user_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Unauthorized user")
        return None

    user = await get_user_by_id(subject)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="User not found")
        return None

    return user


@router.websocket("/ws/{user_id}")
async def realtime_ws(websocket: WebSocket, user_id: str):
    user = await _authenticate(websocket, user_id)
    if not user:
        return

    await websocket_manager.connect(user_id, websocket)

    initial_payload = json.dumps(
        {
            "type": "connected",
            "payload": {
                "user_id": user_id,
                "role": user.get("user_type"),
            },
        }
    )

    await websocket.send_text(initial_payload)

    try:
        while True:
            raw_message = await websocket.receive_text()
            try:
                message = json.loads(raw_message)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"type": "error", "payload": "Invalid message"}))
                continue

            event_type = message.get("type")
            payload = message.get("payload", {})

            if event_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            elif event_type == "mark_notification_read":
                notification_id = payload.get("id")
                if notification_id:
                    await mark_notification_read(notification_id, str(user.get("_id")))
            else:
                # For unsupported events, acknowledge without action
                await websocket.send_text(json.dumps({"type": "ack", "payload": {"event": event_type}}))
    except WebSocketDisconnect:
        pass
    except Exception:
        raise
    finally:
        await websocket_manager.disconnect(user_id, websocket)