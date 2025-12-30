import sys
sys.path.append('backend')
from app.models.user import UserResponse
import datetime

user_dict = {
    'id': 'test',
    'email': 'test@example.com',
    'first_name': 'Test',
    'last_name': 'User',
    'user_type': 'professional',
    'created_at': datetime.datetime.now(),
    'updated_at': datetime.datetime.now(),
    'connections': [],
    'connection_requests': [],
    'skills': [],
    'education': [],
    'experience': [],
    'certifications': []
}

try:
    user_response = UserResponse(**user_dict)
    print('UserResponse validation works')
except Exception as e:
    print('UserResponse validation error:', e)
