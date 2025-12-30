import sys
sys.path.append('backend')
from app.database import connect_to_mongo, get_database
from app.services.auth import authenticate_user
import asyncio

async def test():
    await connect_to_mongo()
    try:
        user = await authenticate_user('test@example.com', 'test123')
        print('Authentication successful:', user is not None)
        if user:
            print('User ID:', user.get('_id'))
            print('User email:', user.get('email'))
    except Exception as e:
        print('Error authenticating user:', e)

asyncio.run(test())
