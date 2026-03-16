#!/usr/bin/env python
import asyncio
import sys
sys.path.insert(0, 'e:\\Sync\\backend')

from app.database import get_database

async def clear_feed():
    try:
        db = get_database()
        result = await db.posts.delete_many({})
        print(f'✅ Deleted {result.deleted_count} posts from feed')
    except Exception as e:
        print(f'❌ Error: {e}')

if __name__ == '__main__':
    asyncio.run(clear_feed())
