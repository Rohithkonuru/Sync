import sys
sys.path.append('backend')
from app.database import connect_to_mongo, get_database
import asyncio

async def test():
    await connect_to_mongo()
    db = get_database()
    user = await db.users.find_one({'email': 'test@example.com'})
    print('User found:', user is not None)
    if user:
        print('Password hash:', user.get('password'))
        print('User data:', {k: v for k, v in user.items() if k != 'password'})

asyncio.run(test())
