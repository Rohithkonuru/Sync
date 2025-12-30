"""
ATS (Applicant Tracking System) Score Calculator
Calculates resume score based on 100% ATS-optimized blueprint
"""
from typing import Dict, Optional
from app.database import get_database
from app.services.ats_blueprint import ATS_BLUEPRINT, ACTION_VERBS, COMMON_KEYWORDS
from app.services.resume_parser import parse_resume_text, extract_sections
import os
import datetime

def get_resume_path(resume_url: str) -> Optional[str]:
    """Helper to check if resume file exists locally"""
    if not resume_url:
        return None
        
    upload_dir = os.getenv("UPLOAD_DIR", "./uploads")
    filename = resume_url.split("/")[-1]
    
    # Check relative path
    file_path = os.path.join(upload_dir, filename)
    if os.path.exists(file_path):
        return file_path
        
    # Check absolute path
    abs_upload_dir = os.path.abspath(upload_dir)
    file_path = os.path.join(abs_upload_dir, filename)
    if os.path.exists(file_path):
        return file_path
        
    return None

async def calculate_ats_score(user: dict) -> Dict:
    """
    Calculate ATS score for a user's resume based on the blueprint.
    
    Scoring Logic (0-100):
    - Structure match (sections present): 30%
    - Keyword relevance: 30%
    - Experience & impact quality: 20%
    - Skills coverage: 10%
    - Formatting compliance: 10%
    """
    
    # Get user data fields
    resume_url = user.get("resume_url")
    resume_path = get_resume_path(resume_url)
    
    # Parse resume if available
    parsed_text = ""
    parsed_sections = {}
    
    if resume_path:
        print(f"Parsing resume: {resume_path}")
        parsed_text = parse_resume_text(resume_path)
        parsed_sections = extract_sections(parsed_text)
        print(f"Extracted sections: {list(parsed_sections.keys())}")
    else:
        print("No resume file found for scoring.")

    # Fallback to profile data if section is missing in resume
    first_name = user.get("first_name", "")
    last_name = user.get("last_name", "")
    email = user.get("email", "")
    phone = user.get("phone", "")
    location = user.get("location", "")
    headline = user.get("headline", "") # Title
    bio = user.get("bio", "") # Summary
    
    skills = user.get("skills", [])
    experience = user.get("experience", [])
    education = user.get("education", [])
    projects = user.get("projects", [])
    certifications = user.get("certifications", [])
    
    # ---------------------------------------------------------
    # 1. Structure Match (30%) - Based on weighted sections presence
    # ---------------------------------------------------------
    structure_score_raw = 0
    max_structure_score = 100 # Sum of all section weights in blueprint is 100
    
    # Header (10 pts)
    # Check if critical header info is present in profile or parsed text
    # For parsed text, we assume header is at the top or we extracted it
    if (first_name and last_name) or (parsed_text and len(parsed_text) > 50):
        structure_score_raw += ATS_BLUEPRINT["sections"]["header"]["weight"]
        
    # Professional Summary (10 pts)
    if (parsed_sections.get("summary")) or (bio and len(bio) > 20):
        structure_score_raw += ATS_BLUEPRINT["sections"]["summary"]["weight"]
        
    # Skills (20 pts)
    if (parsed_sections.get("skills")) or (skills and len(skills) > 0):
        structure_score_raw += ATS_BLUEPRINT["sections"]["skills"]["weight"]
        
    # Work Experience (25 pts)
    if (parsed_sections.get("experience")) or (experience and len(experience) > 0):
        structure_score_raw += ATS_BLUEPRINT["sections"]["experience"]["weight"]
        
    # Education (10 pts)
    if (parsed_sections.get("education")) or (education and len(education) > 0):
        structure_score_raw += ATS_BLUEPRINT["sections"]["education"]["weight"]
        
    # Projects (10 pts)
    if (parsed_sections.get("projects")) or (projects and len(projects) > 0):
        structure_score_raw += ATS_BLUEPRINT["sections"]["projects"]["weight"]
        
    # Certifications (5 pts)
    # Regex might verify certifications section if we added it, or fallback to profile
    if certifications and len(certifications) > 0:
        structure_score_raw += ATS_BLUEPRINT["sections"]["certifications"]["weight"]
        
    # Additional Sections (10 pts)
    if len(skills) > 5 or len(experience) > 2 or len(projects) > 2 or len(parsed_text) > 2000:
         structure_score_raw += ATS_BLUEPRINT["sections"]["additional"]["weight"]

    structure_component = min(100, structure_score_raw)
    print(f"Structure Score: {structure_component}")
    
    # ---------------------------------------------------------
    # 2. Keyword Relevance (30%)
    # ---------------------------------------------------------
    # Match against COMMON_KEYWORDS + derived from profile role
    
    # Use parsed text if available, otherwise construct from profile
    if parsed_text:
        text_content = parsed_text.lower()
    else:
        text_content = (headline + " " + bio + " " + " ".join(skills)).lower()
        for exp in experience:
            if isinstance(exp, dict):
                text_content += " " + str(exp.get("description", "")).lower()
                text_content += " " + str(exp.get("title", "")).lower()
            
    found_keywords = sum(1 for keyword in COMMON_KEYWORDS if keyword in text_content)
    
    # Target: Find at least 10 relevant keywords for full score in this component
    keyword_component = min(100, (found_keywords / 10) * 100)
    print(f"Keyword Score: {keyword_component} (Found: {found_keywords})")
    
    # ---------------------------------------------------------
    # 3. Experience & Impact Quality (20%)
    # ---------------------------------------------------------
    # Check for action verbs and measurable impact (numbers)
    
    impact_score = 0
    
    # If we have parsed experience section, use it
    exp_text = ""
    if parsed_sections.get("experience"):
        exp_text = str(parsed_sections["experience"]).lower()
    elif experience:
        for exp in experience:
            if isinstance(exp, dict):
                exp_text += " " + str(exp.get("description", "")).lower()
    
    if exp_text:
        verbs_found_count = sum(1 for verb in ACTION_VERBS if verb in exp_text)
        metrics_found_count = sum(1 for char in exp_text if char in ['%', '$'] or char.isdigit())
        
        # Heuristic: Expect at least 5 action verbs and 2 metrics
        verb_score = min(100, (verbs_found_count / 5) * 100)
        metric_score = min(100, (metrics_found_count / 2) * 100)
        
        impact_score = (verb_score + metric_score) / 2
    
    impact_component = round(impact_score)
    print(f"Impact Score: {impact_component}")
    
    # ---------------------------------------------------------
    # 4. Skills Coverage (10%)
    # ---------------------------------------------------------
    # Quantity and formatting (list)
    skills_component = 0
    
    skill_count = 0
    if parsed_sections.get("skills"):
        # If it's a list
        if isinstance(parsed_sections["skills"], list):
            skill_count = len(parsed_sections["skills"])
        else:
            # Estimate count by commas if string
            skill_count = parsed_sections["skills"].count(',') + 1
    elif skills:
        skill_count = len(skills)
        
    if skill_count >= 5:
        skills_component = 100
    else:
        skills_component = (skill_count / 5) * 100
    print(f"Skills Score: {skills_component}")
            
    # ---------------------------------------------------------
    # 5. Formatting Compliance (10%)
    # ---------------------------------------------------------
    formatting_component = 0
    
    if resume_path:
        ext = os.path.splitext(resume_path)[1].lower()
        if ext in ATS_BLUEPRINT["formatting_rules"]["file_types"]:
            formatting_component = 100
        else:
            formatting_component = 50 
    elif resume_url:
         if resume_url.lower().endswith(tuple(ATS_BLUEPRINT["formatting_rules"]["file_types"])):
             formatting_component = 100
         else:
             formatting_component = 50
    else:
        formatting_component = 0
    print(f"Formatting Score: {formatting_component}")

    # ---------------------------------------------------------
    # Calculate Final Weighted Score
    # ---------------------------------------------------------
    overall_score = (
        structure_component * (ATS_BLUEPRINT["scoring_logic"]["structure"]["weight"] / 100) +
        keyword_component * (ATS_BLUEPRINT["scoring_logic"]["keywords"]["weight"] / 100) +
        impact_component * (ATS_BLUEPRINT["scoring_logic"]["experience_impact"]["weight"] / 100) +
        skills_component * (ATS_BLUEPRINT["scoring_logic"]["skills_coverage"]["weight"] / 100) +
        formatting_component * (ATS_BLUEPRINT["scoring_logic"]["formatting"]["weight"] / 100)
    )
    
    print(f"Overall Score: {overall_score}")
    
    # Get last updated timestamp safely
    last_updated = datetime.datetime.utcnow().isoformat()

    # Generate Feedback
    feedback = []
    if structure_component < 80:
        feedback.append("Ensure your resume has clear sections: Summary, Skills, Experience, Education.")
    if keyword_component < 70:
        feedback.append("Add more industry-standard keywords to your Summary and Skills sections.")
    if impact_component < 70:
        feedback.append("Use strong action verbs and quantify your achievements (e.g., 'Improved by 20%').")
    if skills_component < 80:
        feedback.append("List at least 5 key technical or hard skills.")
    if formatting_component < 100:
        feedback.append("Use a standard file format (PDF or DOCX) to ensure readability.")

    return {
        "score": round(overall_score),
        "verified": resume_path is not None,
        "last_updated": last_updated,
        "breakdown": {
            "structure": structure_component,
            "keywords": keyword_component,
            "impact": impact_component,
            "skills": skills_component,
            "formatting": formatting_component
        },
        "feedback": feedback
    }
