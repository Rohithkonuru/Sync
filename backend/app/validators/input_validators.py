"""
Input validators and validation utilities
"""

import re
from typing import Optional, List, Dict, Any
from pydantic import validator, EmailStr, Field
from fastapi import HTTPException, status
from datetime import datetime, date
from bson import ObjectId

# Custom validators
class ObjectIdValidator:
    @staticmethod
    def validate_object_id(value: str) -> str:
        """Validate MongoDB ObjectId"""
        if not ObjectId.is_valid(value):
            raise ValueError("Invalid ObjectId format")
        return value

class PasswordValidator:
    @staticmethod
    def validate_password(password: str) -> str:
        """Validate password strength"""
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        if not re.search(r"[A-Z]", password):
            raise ValueError("Password must contain at least one uppercase letter")
        
        if not re.search(r"[a-z]", password):
            raise ValueError("Password must contain at least one lowercase letter")
        
        if not re.search(r"\d", password):
            raise ValueError("Password must contain at least one digit")
        
        return password

class PhoneValidator:
    @staticmethod
    def validate_phone(phone: str) -> str:
        """Validate phone number format"""
        # Remove all non-digit characters
        cleaned = re.sub(r"[^\d]", "", phone)
        
        if len(cleaned) < 10:
            raise ValueError("Phone number must have at least 10 digits")
        
        if len(cleaned) > 15:
            raise ValueError("Phone number cannot have more than 15 digits")
        
        return cleaned

class URLValidator:
    @staticmethod
    def validate_url(url: Optional[str]) -> Optional[str]:
        """Validate URL format"""
        if url is None:
            return None
        
        url_pattern = re.compile(
            r'^https?://'  # http:// or https://
            r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
            r'localhost|'  # localhost...
            r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
            r'(?::\d+)?'  # optional port
            r'(?:/?|[/?]\S+)$', re.IGNORECASE)
        
        if not url_pattern.match(url):
            raise ValueError("Invalid URL format")
        
        return url

class FileValidator:
    @staticmethod
    def validate_file_size(size: int, max_size_mb: int = 5) -> int:
        """Validate file size"""
        max_size_bytes = max_size_mb * 1024 * 1024
        
        if size > max_size_bytes:
            raise ValueError(f"File size cannot exceed {max_size_mb}MB")
        
        return size

    @staticmethod
    def validate_file_type(file_type: str, allowed_types: List[str]) -> str:
        """Validate file type"""
        if file_type not in allowed_types:
            raise ValueError(f"File type {file_type} is not allowed")
        
        return file_type

class DateValidator:
    @staticmethod
    def validate_date_range(start_date: Optional[date], end_date: Optional[date]) -> None:
        """Validate date range"""
        if start_date and end_date and start_date > end_date:
            raise ValueError("Start date cannot be after end date")

    @staticmethod
    def validate_future_date(date_value: date) -> date:
        """Validate date is not in the past"""
        if date_value < date.today():
            raise ValueError("Date cannot be in the past")
        
        return date_value

class TextValidator:
    @staticmethod
    def validate_text_length(text: str, min_length: int = 1, max_length: int = 1000) -> str:
        """Validate text length"""
        if len(text) < min_length:
            raise ValueError(f"Text must be at least {min_length} characters long")
        
        if len(text) > max_length:
            raise ValueError(f"Text cannot exceed {max_length} characters")
        
        return text

    @staticmethod
    def sanitize_text(text: str) -> str:
        """Sanitize text input"""
        # Remove potentially harmful characters
        text = re.sub(r'[<>"\']', '', text)
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text

class SkillValidator:
    @staticmethod
    def validate_skills(skills: List[str]) -> List[str]:
        """Validate skills list"""
        if len(skills) > 50:
            raise ValueError("Cannot have more than 50 skills")
        
        validated_skills = []
        for skill in skills:
            skill = skill.strip().lower()
            if len(skill) < 2:
                raise ValueError("Skill name must be at least 2 characters long")
            if len(skill) > 50:
                raise ValueError("Skill name cannot exceed 50 characters")
            if skill not in validated_skills:
                validated_skills.append(skill)
        
        return validated_skills

class SalaryValidator:
    @staticmethod
    def validate_salary_range(min_salary: Optional[int], max_salary: Optional[int]) -> None:
        """Validate salary range"""
        if min_salary and max_salary and min_salary > max_salary:
            raise ValueError("Minimum salary cannot be greater than maximum salary")
        
        if min_salary and min_salary < 0:
            raise ValueError("Minimum salary cannot be negative")
        
        if max_salary and max_salary < 0:
            raise ValueError("Maximum salary cannot be negative")

class ExperienceValidator:
    @staticmethod
    def validate_experience_years(years: Optional[int]) -> Optional[int]:
        """Validate experience years"""
        if years is None:
            return None
        
        if years < 0:
            raise ValueError("Experience years cannot be negative")
        
        if years > 100:
            raise ValueError("Experience years cannot exceed 100")
        
        return years

# Validation decorators
def validate_user_input(func):
    """Decorator to validate user input"""
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Validation failed"
            )
    return wrapper

# Request validation functions
def validate_job_creation_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate job creation data"""
    errors = {}
    
    # Required fields
    required_fields = ["title", "description", "requirements", "responsibilities", "location"]
    for field in required_fields:
        if not data.get(field) or not str(data[field]).strip():
            errors[field] = f"{field.replace('_', ' ').title()} is required"
    
    # Title validation
    title = data.get("title", "")
    if len(title) < 3:
        errors["title"] = "Title must be at least 3 characters long"
    elif len(title) > 100:
        errors["title"] = "Title cannot exceed 100 characters"
    
    # Description validation
    description = data.get("description", "")
    if len(description) < 50:
        errors["description"] = "Description must be at least 50 characters long"
    elif len(description) > 5000:
        errors["description"] = "Description cannot exceed 5000 characters"
    
    # Salary validation
    min_salary = data.get("salary_min")
    max_salary = data.get("salary_max")
    try:
        SalaryValidator.validate_salary_range(min_salary, max_salary)
    except ValueError as e:
        errors["salary"] = str(e)
    
    # Experience validation
    experience_years = data.get("experience_years")
    try:
        ExperienceValidator.validate_experience_years(experience_years)
    except ValueError as e:
        errors["experience_years"] = str(e)
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Validation failed", "errors": errors}
        )
    
    return data

def validate_application_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate application data"""
    errors = {}
    
    # Email validation
    email = data.get("email", "")
    if not email:
        errors["email"] = "Email is required"
    elif not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        errors["email"] = "Invalid email format"
    
    # Phone validation
    phone = data.get("contact_phone", "")
    if phone:
        try:
            PhoneValidator.validate_phone(phone)
        except ValueError as e:
            errors["contact_phone"] = str(e)
    
    # Skills validation
    skills = data.get("skills", [])
    if skills:
        try:
            SkillValidator.validate_skills(skills)
        except ValueError as e:
            errors["skills"] = str(e)
    
    # Experience years validation
    experience_years = data.get("experience_years")
    try:
        ExperienceValidator.validate_experience_years(experience_years)
    except ValueError as e:
        errors["experience_years"] = str(e)
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Validation failed", "errors": errors}
        )
    
    return data

def validate_user_profile_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate user profile data"""
    errors = {}
    
    # Name validation
    first_name = data.get("first_name", "")
    if len(first_name) < 2:
        errors["first_name"] = "First name must be at least 2 characters long"
    elif len(first_name) > 50:
        errors["first_name"] = "First name cannot exceed 50 characters"
    
    last_name = data.get("last_name", "")
    if len(last_name) < 2:
        errors["last_name"] = "Last name must be at least 2 characters long"
    elif len(last_name) > 50:
        errors["last_name"] = "Last name cannot exceed 50 characters"
    
    # Phone validation
    phone = data.get("phone", "")
    if phone:
        try:
            PhoneValidator.validate_phone(phone)
        except ValueError as e:
            errors["phone"] = str(e)
    
    # Bio validation
    bio = data.get("bio", "")
    if bio and len(bio) > 500:
        errors["bio"] = "Bio cannot exceed 500 characters"
    
    # Skills validation
    skills = data.get("skills", [])
    if skills:
        try:
            SkillValidator.validate_skills(skills)
        except ValueError as e:
            errors["skills"] = str(e)
    
    if errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"message": "Validation failed", "errors": errors}
        )
    
    return data

# Search and filter validation
def validate_search_params(params: Dict[str, Any]) -> Dict[str, Any]:
    """Validate search parameters"""
    validated_params = {}
    
    # Pagination
    skip = params.get("skip", 0)
    if isinstance(skip, str):
        try:
            skip = int(skip)
        except ValueError:
            skip = 0
    
    if skip < 0:
        skip = 0
    
    validated_params["skip"] = skip
    
    limit = params.get("limit", 20)
    if isinstance(limit, str):
        try:
            limit = int(limit)
        except ValueError:
            limit = 20
    
    if limit < 1:
        limit = 1
    elif limit > 100:
        limit = 100
    
    validated_params["limit"] = limit
    
    # Sort field
    sort_field = params.get("sort_field", "created_at")
    allowed_sort_fields = ["created_at", "updated_at", "sync_score", "growth_score", "ats_score"]
    if sort_field not in allowed_sort_fields:
        sort_field = "created_at"
    
    validated_params["sort_field"] = sort_field
    
    # Sort direction
    sort_direction = params.get("sort_direction", -1)
    if isinstance(sort_direction, str):
        try:
            sort_direction = int(sort_direction)
        except ValueError:
            sort_direction = -1
    
    if sort_direction not in [1, -1]:
        sort_direction = -1
    
    validated_params["sort_direction"] = sort_direction
    
    return validated_params
