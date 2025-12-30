"""
Demo feed data service for when no real posts exist
"""
from typing import List, Dict
from datetime import datetime, timedelta
import random

# Demo feed data by user type
DEMO_FEED_DATA = {
    "student": [
        {
            "content": "Just landed my first internship at Google! The interview process was intense but so worth it. Tips for fellow students: focus on data structures and algorithms, and don't forget to network!",
            "images": ["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400"],
            "user_name": "Sarah Chen",
            "user_type": "Student",
            "likes": 24,
            "comments": 8,
            "shares": 3,
            "category": "career"
        },
        {
            "content": "Completed my capstone project on AI ethics. The future of tech depends on responsible development. What are your thoughts on AI regulation?",
            "images": [],
            "user_name": "Marcus Rodriguez",
            "user_type": "Student",
            "likes": 18,
            "comments": 12,
            "shares": 2,
            "category": "education"
        },
        {
            "content": "Mock interview tomorrow - any last-minute tips? I'm applying for software engineering roles. #InterviewPrep #CareerAdvice",
            "images": [],
            "user_name": "Priya Patel",
            "user_type": "Student",
            "likes": 15,
            "comments": 22,
            "shares": 1,
            "category": "career"
        },
        {
            "content": "Just finished reading 'Clean Code' by Robert Martin. Game-changer for my coding practices. Highly recommend to all CS students!",
            "images": ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400"],
            "user_name": "Alex Thompson",
            "user_type": "Student",
            "likes": 31,
            "comments": 6,
            "shares": 5,
            "category": "education"
        },
        {
            "content": "Participated in my first hackathon this weekend. Built a mental health app with my team. The experience was incredible! #Hackathon #TeamWork",
            "images": ["https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400"],
            "user_name": "Emma Wilson",
            "user_type": "Student",
            "likes": 28,
            "comments": 9,
            "shares": 4,
            "category": "career"
        }
    ],
    "job_seeker": [
        {
            "content": "After 6 months of job hunting, I finally got an offer! Key lessons: customize your resume for each application, practice coding interviews daily, and never give up. To all job seekers out there - your breakthrough is coming!",
            "images": [],
            "user_name": "David Kim",
            "user_type": "Job Seeker",
            "likes": 45,
            "comments": 15,
            "shares": 8,
            "category": "career"
        },
        {
            "content": "Resume tip: Use action verbs and quantify your achievements. Instead of 'Responsible for team projects', say 'Led cross-functional team of 5 on projects delivering 30% efficiency improvement'",
            "images": [],
            "user_name": "Lisa Zhang",
            "user_type": "Job Seeker",
            "likes": 67,
            "comments": 23,
            "shares": 12,
            "category": "career"
        },
        {
            "content": "Just completed a LinkedIn Learning course on 'Advanced React Development'. The instructor was amazing and I learned so many new techniques. Highly recommend!",
            "images": ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400"],
            "user_name": "James Mitchell",
            "user_type": "Job Seeker",
            "likes": 22,
            "comments": 7,
            "shares": 3,
            "category": "education"
        },
        {
            "content": "Networking event success! Connected with 3 hiring managers and got 2 informational interviews lined up. Remember: it's not just about quantity, but quality connections.",
            "images": ["https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400"],
            "user_name": "Rachel Green",
            "user_type": "Job Seeker",
            "likes": 33,
            "comments": 11,
            "shares": 6,
            "category": "networking"
        },
        {
            "content": "Portfolio website is live! Check it out and let me know what you think. Built with React, Node.js, and deployed on Vercel. #WebDevelopment #Portfolio",
            "images": ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400"],
            "user_name": "Michael Brown",
            "user_type": "Job Seeker",
            "likes": 19,
            "comments": 8,
            "shares": 4,
            "category": "career"
        }
    ],
    "professional": [
        {
            "content": "Excited to announce my promotion to Senior Software Engineer at Microsoft! 3 years of growth, countless late nights, and amazing mentors made this possible. Grateful for the journey.",
            "images": ["https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400"],
            "user_name": "Jennifer Davis",
            "user_type": "Professional",
            "likes": 89,
            "comments": 34,
            "shares": 15,
            "category": "career"
        },
        {
            "content": "Industry insight: The future of work is hybrid. Companies that embrace flexibility will attract and retain top talent. What's your company's remote work policy?",
            "images": [],
            "user_name": "Robert Johnson",
            "user_type": "Professional",
            "likes": 56,
            "comments": 28,
            "shares": 9,
            "category": "industry"
        },
        {
            "content": "Mentored 3 junior developers this quarter. Seeing their growth and confidence build has been incredibly rewarding. If you're experienced, consider giving back through mentorship.",
            "images": ["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400"],
            "user_name": "Amanda White",
            "user_type": "Professional",
            "likes": 42,
            "comments": 16,
            "shares": 7,
            "category": "mentorship"
        },
        {
            "content": "Just published an article on 'Scaling Microservices Architecture' in TechCrunch. Link in comments. Would love to hear your thoughts on distributed systems!",
            "images": [],
            "user_name": "Kevin Lee",
            "user_type": "Professional",
            "likes": 38,
            "comments": 12,
            "shares": 11,
            "category": "industry"
        },
        {
            "content": "Team building success! Our offsite retreat resulted in 40% improvement in team collaboration metrics. Sometimes the best investments are in people, not just technology.",
            "images": ["https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400"],
            "user_name": "Sarah Martinez",
            "user_type": "Professional",
            "likes": 51,
            "comments": 19,
            "shares": 8,
            "category": "leadership"
        }
    ],
    "recruiter": [
        {
            "content": "Hiring 5 Senior Full-Stack Developers for our fintech startup! We're building the future of digital banking. Remote-first, equity package, competitive salary. DM me if interested!",
            "images": ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400"],
            "user_name": "Tom Anderson",
            "user_type": "Recruiter",
            "likes": 23,
            "comments": 45,
            "shares": 18,
            "category": "hiring"
        },
        {
            "content": "Talent acquisition insights: The war for tech talent is heating up. Companies offering remote work, learning stipends, and strong cultures are winning. What's your company's biggest talent challenge?",
            "images": [],
            "user_name": "Maria Garcia",
            "user_type": "Recruiter",
            "likes": 34,
            "comments": 22,
            "shares": 6,
            "category": "industry"
        },
        {
            "content": "Just closed our biggest hire yet - a Principal Engineer from FAANG. The candidate journey took 3 months but was worth every minute. Quality over speed always wins.",
            "images": [],
            "user_name": "Chris Wilson",
            "user_type": "Recruiter",
            "likes": 28,
            "comments": 9,
            "shares": 4,
            "category": "hiring"
        },
        {
            "content": "Diversity in tech matters. Our latest report shows teams with diverse backgrounds perform 35% better. How is your company approaching DEI in hiring?",
            "images": ["https://images.unsplash.com/photo-1552664730-d307ca884978?w=400"],
            "user_name": "Nina Patel",
            "user_type": "Recruiter",
            "likes": 41,
            "comments": 31,
            "shares": 13,
            "category": "industry"
        },
        {
            "content": "Campus recruiting season is here! Visiting 5 universities this month. The next generation of talent is impressive. Students - polish your LinkedIn and GitHub profiles!",
            "images": ["https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400"],
            "user_name": "David Chen",
            "user_type": "Recruiter",
            "likes": 37,
            "comments": 14,
            "shares": 7,
            "category": "recruiting"
        }
    ]
}

def get_demo_feed(user_type: str, limit: int = 10) -> List[Dict]:
    """
    Get demo feed posts for a specific user type
    """
    if user_type not in DEMO_FEED_DATA:
        user_type = "professional"  # default fallback

    posts = DEMO_FEED_DATA[user_type].copy()

    # Shuffle for variety
    random.shuffle(posts)

    # Take requested limit
    posts = posts[:limit]

    # Add demo metadata
    for i, post in enumerate(posts):
        # Generate fake IDs and timestamps
        post.update({
            "id": f"demo_{user_type}_{i+1}",
            "user_id": f"demo_user_{i+1}",
            "user_picture": f"https://api.dicebear.com/7.x/avataaars/svg?seed=demo{i+1}",
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            "updated_at": datetime.utcnow() - timedelta(days=random.randint(0, 7)),
            "is_demo": True,  # Mark as demo content
            "likes": [f"demo_like_{j}" for j in range(post.get("likes", 0))],
            "comments": [
                {
                    "id": f"demo_comment_{j}",
                    "user_id": f"demo_commenter_{j}",
                    "user_name": f"Demo User {j}",
                    "user_picture": f"https://api.dicebear.com/7.x/avataaars/svg?seed=comment{j}",
                    "content": f"Great post! This is very helpful. #{post.get('category', 'general')}",
                    "created_at": datetime.utcnow() - timedelta(hours=random.randint(1, 24))
                }
                for j in range(min(post.get("comments", 0), 3))  # Limit demo comments
            ]
        })

    return posts

def should_show_demo_feed(real_posts_count: int, user_type: str) -> bool:
    """
    Determine if demo feed should be shown
    """
    # Show demo if no real posts exist
    return real_posts_count == 0
