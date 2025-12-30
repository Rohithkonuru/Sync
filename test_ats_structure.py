import asyncio
from app.services.ats_scorer import calculate_ats_score

async def test_ats_score():
    user_data = {
        "resume_url": "http://example.com/resume.pdf",
        "skills": ["python", "react"],
        "experience": [{"current": True}],
        "education": [{"school": "Test U"}],
        "headline": "Python Developer",
        "bio": "Experienced in React"
    }
    
    # Mock database or ensure it doesn't crash without it if possible
    # ats_scorer uses get_database()... 
    # Actually, calculate_ats_score calls get_database() but doesn't seem to use it in the snippet I read?
    # Let me check the read output of ats_scorer.py again.
    
    # It imports get_database but line 20: db = get_database()
    # But then it doesn't seem to use `db` in the rest of the function!
    # It uses `user` dict passed in.
    
    score_data = await calculate_ats_score(user_data)
    print(f"Score Data Keys: {score_data.keys()}")
    print(f"Score: {score_data['score']}")
    if "breakdown" not in score_data:
        print("SUCCESS: Breakdown not present.")
    else:
        print("FAILURE: Breakdown is still present.")

if __name__ == "__main__":
    # Need to mock get_database if it's called
    import sys
    from unittest.mock import MagicMock
    sys.modules['app.database'] = MagicMock()
    sys.modules['app.database'].get_database = MagicMock(return_value=None)
    
    loop = asyncio.get_event_loop()
    loop.run_until_complete(test_ats_score())
