import asyncio
from app.services.ats_scorer import calculate_ats_score

async def test_blueprint_scoring():
    # Test Case 1: Perfect Profile (or near perfect)
    perfect_user = {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "location": "New York, USA",
        "headline": "Senior Software Engineer",
        "bio": "Experienced Software Engineer with 5+ years in full-stack development. Skilled in Python, React, and Cloud Architecture.",
        "skills": ["Python", "React", "AWS", "Docker", "Kubernetes", "SQL", "FastAPI"],
        "experience": [
            {
                "title": "Senior Engineer",
                "company": "Tech Corp",
                "description": "Led a team of 5 developers. Implemented microservices architecture which increased system reliability by 99%. Developed REST APIs using Python."
            },
            {
                "title": "Software Developer",
                "company": "StartUp Inc",
                "description": "Designed frontend components using React. Optimized database queries improving performance by 50%."
            }
        ],
        "education": [{"degree": "BS CS", "institution": "University"}],
        "projects": [{"name": "Project A", "tools": ["Python"]}],
        "certifications": [{"name": "AWS Certified"}],
        "resume_url": "http://example.com/resume.pdf"
    }

    # Test Case 2: Poor Profile
    poor_user = {
        "first_name": "Jane",
        # Missing last name, email, etc for structure penalty
        "skills": ["Word"],
        "experience": [], # Missing experience
        "resume_url": None
    }

    print("--- Testing Perfect Profile ---")
    score_perfect = await calculate_ats_score(perfect_user)
    print(f"Perfect Score: {score_perfect['score']}")
    
    print("\n--- Testing Poor Profile ---")
    score_poor = await calculate_ats_score(poor_user)
    print(f"Poor Score: {score_poor['score']}")

if __name__ == "__main__":
    # Mocking environment variables or dependencies if needed
    import sys
    from unittest.mock import MagicMock
    sys.modules['app.database'] = MagicMock()
    
    loop = asyncio.get_event_loop()
    loop.run_until_complete(test_blueprint_scoring())
