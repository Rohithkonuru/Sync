import socketio
from jose import jwt
from app.config import settings
import logging

logger = logging.getLogger(__name__)

sio = socketio.AsyncServer(cors_allowed_origins="*", async_mode='asgi')
socket_manager = socketio.ASGIApp(sio)

# Store user_id to sid mapping
user_sessions = {}  # {user_id: [sid1, sid2, ...]}

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
        await sio.emit("notification", notification_data, room=user_id)
        logger.info(f"Notification sent to user {user_id}")
    except Exception as e:
        logger.error(f"Error sending notification: {e}")

async def send_message(user_id: str, message_data: dict):
    """Send message to a specific user"""
    try:
        await sio.emit("new_message", message_data, room=user_id)
        logger.info(f"Message sent to user {user_id}")
    except Exception as e:
        logger.error(f"Error sending message: {e}")

async def send_application_status_update(user_id: str, status_data: dict):
    """Send application status update to applicant"""
    try:
        await sio.emit("application_status_update", status_data, room=user_id)
        logger.info(f"Application status update sent to user {user_id}")
    except Exception as e:
        logger.error(f"Error sending application status update: {e}")

async def broadcast_post(post_data: dict):
    """Broadcast new post to all connected users"""
    try:
        await sio.emit("new_post", post_data)
    except Exception as e:
        logger.error(f"Error broadcasting post: {e}")

