"""
ATS Optimized Resume Blueprint
Acts as the reference standard for ATS score calculation.
"""

ATS_BLUEPRINT = {
    "sections": {
        "header": {
            "name": "Header",
            "mandatory": True,
            "weight": 10,
            "fields": ["full_name", "title", "email", "phone", "location", "linkedin"],
            "rules": ["no_icons", "plain_text"]
        },
        "summary": {
            "name": "Professional Summary",
            "mandatory": True,
            "weight": 10,
            "min_lines": 2,
            "max_lines": 4,
            "content": ["role", "years_experience", "core_skills", "industry_keywords"]
        },
        "skills": {
            "name": "Skills",
            "mandatory": True,
            "weight": 20,
            "format": "list", # bullet or comma-separated
            "content": ["technical_skills", "tools", "frameworks", "soft_skills"]
        },
        "experience": {
            "name": "Work Experience",
            "mandatory": True,
            "weight": 25,
            "fields": ["title", "company", "location", "dates", "description"],
            "rules": ["action_verbs", "measurable_impact"]
        },
        "education": {
            "name": "Education",
            "mandatory": True,
            "weight": 10,
            "fields": ["degree", "institution", "year", "specialization"]
        },
        "projects": {
            "name": "Projects",
            "mandatory": False,
            "weight": 10,
            "fields": ["name", "tools", "description"]
        },
        "certifications": {
            "name": "Certifications",
            "mandatory": False,
            "weight": 5,
            "fields": ["name", "issuer", "year"]
        },
        "additional": {
            "name": "Additional Sections",
            "mandatory": False,
            "weight": 10, # max
            "examples": ["achievements", "publications", "volunteering"]
        }
    },
    "scoring_logic": {
        "structure": {
            "weight": 30, # 30%
            "description": "Structure match (sections present)"
        },
        "keywords": {
            "weight": 30, # 30%
            "description": "Keyword relevance"
        },
        "experience_impact": {
            "weight": 20, # 20%
            "description": "Experience & impact quality"
        },
        "skills_coverage": {
            "weight": 10, # 10%
            "description": "Skills coverage"
        },
        "formatting": {
            "weight": 10, # 10%
            "description": "Formatting compliance"
        }
    },
    "formatting_rules": {
        "file_types": [".pdf", ".docx"],
        "fonts": ["Arial", "Calibri", "Times New Roman"],
        "font_size_min": 10,
        "font_size_max": 12,
        "headings": ["SUMMARY", "SKILLS", "EXPERIENCE", "EDUCATION", "PROJECTS", "CERTIFICATIONS"]
    }
}

ACTION_VERBS = [
    "developed", "designed", "implemented", "managed", "led", "created", "built",
    "improved", "increased", "reduced", "optimized", "analyzed", "resolved",
    "collaborated", "engineered", "architected", "deployed", "maintained",
    "coordinated", "delivered", "established", "integrated", "negotiated",
    "orchestrated", "spearheaded", "streamlined", "supervised", "transformed"
]

COMMON_KEYWORDS = [
    "software", "engineer", "developer", "full-stack", "frontend", "backend",
    "react", "node.js", "python", "java", "javascript", "sql", "database",
    "cloud", "aws", "azure", "docker", "kubernetes", "ci/cd", "agile",
    "scrum", "rest", "api", "graphql", "microservices", "system", "design"
]
