import asyncio
import os
import sys
from unittest.mock import MagicMock, patch

# Add backend directory to sys.path
sys.path.append(os.getcwd())

# Mock dependencies that might require DB or external libs if not present
sys.modules["app.database"] = MagicMock()
sys.modules["app.models.user"] = MagicMock()

# Import the modules to test
from app.services.ats_scorer import calculate_ats_score
from app.services.resume_parser import extract_sections

# Sample Resume Text (Strong)
STRONG_RESUME = """
John Doe
Software Engineer
Email: john@example.com

SUMMARY
Experienced Software Engineer with 5 years of experience in Python, JavaScript, and Cloud Computing.
Proven track record of delivering scalable applications.

SKILLS
Python, JavaScript, React, Node.js, AWS, Docker, Kubernetes, SQL, NoSQL, Git, CI/CD.

EXPERIENCE
Senior Software Engineer | Tech Corp | 2020 - Present
- Developed and maintained microservices architecture using Python and FastAPI.
- Improved system performance by 20% through code optimization.
- Managed a team of 5 engineers and led agile sprints.

Software Developer | Startup Inc | 2018 - 2020
- Built full-stack web applications using React and Node.js.
- Integrated payment gateways and reduced transaction errors by 15%.

EDUCATION
Bachelor of Science in Computer Science | University of Technology | 2014 - 2018

PROJECTS
- E-commerce Platform: Built a scalable e-commerce platform handling 10k+ daily users.
- Chat Application: Real-time chat app using WebSocket.
"""

# Sample Resume Text (Weak)
WEAK_RESUME = """
Jane Doe
Student

About Me
I am a student looking for a job. I like computers.

Work History
I worked at a shop for a summer.

School
High School Diploma.
"""

async def test_ats_logic():
    print("--- Testing ATS Scoring Logic ---")

    # 1. Test Section Extraction
    print("\n[Test 1] Section Extraction (Strong Resume)")
    sections = extract_sections(STRONG_RESUME)
    required_sections = ["summary", "skills", "experience", "education", "projects"]
    for sec in required_sections:
        if sections.get(sec):
            print(f"  [PASS] Found section: {sec}")
        else:
            print(f"  [FAIL] Missing section: {sec}")

    # 2. Test Scoring (Strong Resume)
    print("\n[Test 2] Scoring (Strong Resume)")
    # Mock parse_resume_text to return STRONG_RESUME
    with patch("app.services.ats_scorer.parse_resume_text", return_value=STRONG_RESUME) as mock_parser:
        # Mock get_resume_path to return a dummy path so it attempts to parse
        with patch("app.services.ats_scorer.get_resume_path", return_value="dummy_path.pdf"):
            user_data = {
                "resume_url": "/uploads/dummy.pdf",
                "first_name": "John",
                "last_name": "Doe",
                "email": "john@example.com"
            }
            score_data = await calculate_ats_score(user_data)
            print(f"  Score: {score_data['score']}")
            print(f"  Breakdown (Logs above should show details)")
            
            if score_data['score'] > 70:
                print("  [PASS] Score is high as expected.")
            else:
                print(f"  [FAIL] Score is too low: {score_data['score']}")

    # 3. Test Scoring (Weak Resume)
    print("\n[Test 3] Scoring (Weak Resume)")
    with patch("app.services.ats_scorer.parse_resume_text", return_value=WEAK_RESUME) as mock_parser:
        with patch("app.services.ats_scorer.get_resume_path", return_value="dummy_path.pdf"):
            user_data = {
                "resume_url": "/uploads/dummy_weak.pdf",
                "first_name": "Jane",
                "last_name": "Doe"
            }
            score_data = await calculate_ats_score(user_data)
            print(f"  Score: {score_data['score']}")
            
            if score_data['score'] < 50:
                print("  [PASS] Score is low as expected.")
            else:
                print(f"  [FAIL] Score is too high: {score_data['score']}")

if __name__ == "__main__":
    asyncio.run(test_ats_logic())
