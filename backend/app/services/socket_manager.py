import asyncio
import json
import logging
from collections import defaultdict
from datetime import datetime
from typing import Dict, Iterable, Optional, Set

from bson import ObjectId
from fastapi import WebSocket
import socketio
from jose import jwt

from app.config import settings

logger = logging.getLogger(__name__)

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode='asgi')
socket_manager = socketio.ASGIApp(sio)

# Store user_id to sid mapping
user_sessions = {}  # {user_id: [sid1, sid2, ...]}

class WebSocketConnectionManager:
    """Lightweight manager to track and message FastAPI WebSocket clients."""

    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections[user_id].add(websocket)
        logger.info("WebSocket connected for user %s", user_id)

    async def disconnect(self, user_id: str, websocket: WebSocket):
        async with self._lock:
            connections = self.active_connections.get(user_id)
            if connections and websocket in connections:
                connections.remove(websocket)
                if not connections:
                    self.active_connections.pop(user_id, None)
        logger.info("WebSocket disconnected for user %s", user_id)

    async def send_personal_message(self, user_id: str, message: str):
        async with self._lock:
            connections = list(self.active_connections.get(user_id, set()))
        for connection in connections:
            try:
                await connection.send_text(message)
            except Exception:
                await self.disconnect(user_id, connection)

    async def broadcast(self, message: str):
        async with self._lock:
            pairs = [(user_id, list(conns)) for user_id, conns in self.active_connections.items()]
        for user_id, connections in pairs:
            for connection in connections:
                try:
                    await connection.send_text(message)
                except Exception:
                    await self.disconnect(user_id, connection)

websocket_manager = WebSocketConnectionManager()

def _json_default(value):
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, ObjectId):
        return str(value)
    raise TypeError(f"Type {type(value)} not serializable")

def _prepare_payload(payload: dict) -> dict:
    try:
        return json.loads(json.dumps(payload, default=_json_default))
    except TypeError:
        # As a fallback, stringify everything
        return json.loads(json.dumps(payload, default=str))

async def emit_event(event_type: str, payload: dict, user_ids: Optional[Iterable[str]] = None):
    """Emit an event to Socket.IO clients and native WebSocket subscribers."""
    safe_payload = _prepare_payload(payload)
    envelope = json.dumps(
        {
            "type": event_type,
            "payload": safe_payload,
            "timestamp": datetime.utcnow().isoformat(),
        }
    )

    if user_ids:
        for user_id in user_ids:
            await sio.emit(event_type, safe_payload, room=user_id)
            await websocket_manager.send_personal_message(user_id, envelope)
    else:
        await sio.emit(event_type, safe_payload)
        await websocket_manager.broadcast(envelope)
@sio.event
async def connect(sid, environ):
    """Handle client connection"""
    try:
        # Get token from query string or headers
        query_string = environ.get('QUERY_STRING', '')
        token = None
        
        # Try to get token from query string
        if 'token=' in query_string:
            token = query_string.split('token=')[1].split('&')[0]
        else:
            # Try to get from headers
            headers = environ.get('HTTP_AUTHORIZATION', '')
            if headers.startswith('Bearer '):
                token = headers[7:]
        
        if token:
            try:
                payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
                user_id = payload.get("sub")
                if user_id:
                    # Join user's room
                    await sio.enter_room(sid, user_id)
                    if user_id not in user_sessions:
                        user_sessions[user_id] = []
                    user_sessions[user_id].append(sid)
                    logger.info(f"User {user_id} connected with sid {sid}")
                    await sio.emit("connected", {"message": "Connected successfully"}, room=sid)
            except Exception as e:
                logger.warning(f"Invalid token for connection {sid}: {e}")
        else:
            logger.warning(f"Connection {sid} without token")
    except Exception as e:
        logger.error(f"Error in connect handler: {e}")

@sio.event
async def disconnect(sid):
    """Handle client disconnection"""
    try:
        # Remove from user_sessions
        for user_id, sessions in list(user_sessions.items()):
            if sid in sessions:
                sessions.remove(sid)
                if not sessions:
                    del user_sessions[user_id]
                logger.info(f"User {user_id} disconnected (sid: {sid})")
                break
    except Exception as e:
        logger.error(f"Error in disconnect handler: {e}")

@sio.event
async def join_room(sid, data):
    """Join a room (e.g., user_id for private messages)"""
    room = data.get("room")
    if room:
        await sio.enter_room(sid, room)
        await sio.emit("joined_room", {"room": room}, room=sid)

@sio.event
async def leave_room(sid, data):
    """Leave a room"""
    room = data.get("room")
    if room:
        await sio.leave_room(sid, room)
        await sio.emit("left_room", {"room": room}, room=sid)

@sio.event
async def typing_start(sid, data):
    """Handle typing indicator start"""
    receiver_id = data.get("receiver_id")
    sender_id = data.get("sender_id")
    if receiver_id and sender_id:
        await sio.emit("typing", {"sender_id": sender_id, "typing": True, "user_id": sender_id}, room=receiver_id)
        logger.info(f"User {sender_id} is typing to {receiver_id}")

@sio.event
async def typing_stop(sid, data):
    """Handle typing indicator stop"""
    receiver_id = data.get("receiver_id")
    sender_id = data.get("sender_id")
    if receiver_id and sender_id:
        await sio.emit("typing", {"sender_id": sender_id, "typing": False, "user_id": sender_id}, room=receiver_id)
        logger.info(f"User {sender_id} stopped typing to {receiver_id}")

async def send_notification(user_id: str, notification_data: dict):
    """Send notification to a specific user"""
    try:
        await emit_event("new_notification", notification_data, [user_id])
        logger.info(f"Notification sent to user {user_id}")
    except Exception as e:
        logger.error(f"Error sending notification: {e}")

async def send_message(user_id: str, message_data: dict):
    """Send message to a specific user"""
    try:
        await emit_event("new_message", message_data, [user_id])
        logger.info(f"Message sent to user {user_id}")
    except Exception as e:
        logger.error(f"Error sending message: {e}")

async def send_application_status_update(user_id: str, status_data: dict):
    """Send application status update to applicant"""
    try:
        await emit_event("application_status_update", status_data, [user_id])
        logger.info(f"Application status update sent to user {user_id}")
    except Exception as e:
        logger.error(f"Error sending application status update: {e}")

async def broadcast_post(post_data: dict):
    """Broadcast new post to all connected users"""
    try:
        await emit_event("new_post", post_data)
    except Exception as e:
        logger.error(f"Error broadcasting post: {e}")

