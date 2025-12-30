import asyncio
import os
import sys
from unittest.mock import MagicMock, patch

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'app'))

# Mock database since we don't want to connect to real DB
sys.modules['app.database'] = MagicMock()

# Import the scorer
from app.services.ats_scorer import calculate_ats_score

async def test_ats_flow():
    print("Starting ATS Flow Test...")

    # Mock user data
    user = {
        "resume_url": "/uploads/test_resume.pdf",
        "user_type": "job_seeker",
        "skills": ["Python", "React", "FastAPI"],  # User's claimed skills
        "experience": [
            {
                "title": "Senior Software Engineer",
                "description": "Led a team of 5 developers. Improved performance by 50%."
            }
        ]
    }

    # Mock parsed text representing a good resume
    mock_resume_text = """
    John Doe
    Software Engineer
    
    SUMMARY
    Experienced Software Engineer with 5 years of experience in Python and React.
    
    SKILLS
    Python, React, FastAPI, Docker, Kubernetes, SQL, NoSQL.
    
    EXPERIENCE
    Senior Software Engineer | Tech Corp
    - Led a team of 5 developers to build a scalable web application.
    - Improved system performance by 50% using async techniques.
    - Implemented CI/CD pipelines using Docker and Jenkins.
    
    EDUCATION
    Bachelor of Science in Computer Science
    """

    print("\n--- Testing with GOOD Resume Content ---")
    
    # Patch the dependencies
    with patch('app.services.ats_scorer.get_resume_path') as mock_path:
        mock_path.return_value = "dummy/path/test_resume.pdf"
        
        with patch('app.services.ats_scorer.parse_resume_text') as mock_parser:
            mock_parser.return_value = mock_resume_text
            
            # Run calculation
            score_data = await calculate_ats_score(user)
            
            print(f"ATS Score: {score_data['score']}")
            print(f"Breakdown: {score_data['breakdown']}")
            print(f"Feedback: {score_data['feedback'][:2]}") # Print first 2 feedback items
            
            # Assertions
            if score_data['score'] > 70:
                print("✅ Score calculation looks correct for good resume.")
            else:
                print("❌ Score seems too low for good resume.")

    # Test with POOR resume content
    mock_poor_resume = """
    John Doe
    
    Just a guy looking for a job.
    I know some coding.
    """
    
    print("\n--- Testing with POOR Resume Content ---")
    
    with patch('app.services.ats_scorer.get_resume_path') as mock_path:
        mock_path.return_value = "dummy/path/poor_resume.pdf"
        
        with patch('app.services.ats_scorer.parse_resume_text') as mock_parser:
            mock_parser.return_value = mock_poor_resume
            
            score_data = await calculate_ats_score(user)
            
            print(f"ATS Score: {score_data['score']}")
            print(f"Breakdown: {score_data['breakdown']}")
            
            if score_data['score'] < 50:
                print("✅ Score calculation looks correct for poor resume.")
            else:
                print("❌ Score seems too high for poor resume.")

if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    loop.run_until_complete(test_ats_flow())
