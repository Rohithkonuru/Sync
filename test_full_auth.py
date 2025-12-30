import sys
sys.path.append('backend')
from app.database import connect_to_mongo
from app.services.auth import authenticate_user, create_access_token, user_to_dict
from app.models.user import Token
from datetime import timedelta
import asyncio

async def test():
    await connect_to_mongo()
    user = await authenticate_user('test@example.com', 'test123')
    print('Auth result:', user is not None)
    if user:
        print('User ID:', str(user['_id']))
        # Create token
        access_token = create_access_token(data={"sub": str(user["_id"])})
        print('Token created:', access_token is not None)
        
        # Convert user to dict
        user_response = user_to_dict(user)
        print('User dict created:', user_response is not None)
        
        # Create Token response
        token_response = {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }
        
        try:
            token_obj = Token(**token_response)
            print('Token object created successfully')
        except Exception as e:
            print('Token object creation error:', e)

asyncio.run(test())
