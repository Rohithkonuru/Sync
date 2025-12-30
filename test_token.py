import sys
sys.path.append('backend')
from app.models.user import Token

token_dict = {
    'access_token': 'test_token',
    'token_type': 'bearer',
    'user': {
        'id': 'test',
        'email': 'test@example.com',
        'first_name': 'Test',
        'last_name': 'User',
        'user_type': 'professional',
        'created_at': '2023-01-01T00:00:00',
        'updated_at': '2023-01-01T00:00:00',
        'connections': [],
        'connection_requests': [],
        'skills': [],
        'education': [],
        'experience': [],
        'certifications': []
    }
}

try:
    token_response = Token(**token_dict)
    print('Token validation works')
except Exception as e:
    print('Token validation error:', e)
