import sys
sys.path.append('backend')
from app.database import connect_to_mongo, get_database
from app.services.auth import create_user
import asyncio

async def test():
    await connect_to_mongo()
    try:
        user = await create_user({
            'email': 'test@example.com',
            'password': 'test123',
            'first_name': 'Test',
            'last_name': 'User',
            'user_type': 'professional',
            'location': 'Test City'
        })
        print('User created successfully:', user is not None)
        if user:
            print('User ID:', user.get('_id'))
            print('User email:', user.get('email'))
    except Exception as e:
        print('Error creating user:', e)

asyncio.run(test())
