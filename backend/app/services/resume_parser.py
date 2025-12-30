import pdfplumber
import docx
import os
import re
from typing import Dict, List, Any

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file"""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
    return text

def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file"""
    text = ""
    try:
        doc = docx.Document(file_path)
        paragraphs = []
        for para in doc.paragraphs:
            if para.text.strip():
                paragraphs.append(para.text)
        text = "\n".join(paragraphs)
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
    return text

def parse_resume_text(file_path: str) -> str:
    """Parse resume file and return raw text"""
    if not os.path.exists(file_path):
        return ""
        
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext == ".docx":
        return extract_text_from_docx(file_path)
    # .doc support is difficult without external tools (antiword, catdoc)
    
    return ""

def extract_sections(text: str) -> Dict[str, Any]:
    """
    Extract sections from resume text using regex patterns.
    Returns a dictionary with extracted content for each section.
    """
    sections = {
        "summary": "",
        "skills": [],
        "experience": [],
        "education": [],
        "projects": [],
        "raw_text": text
    }
    
    if not text:
        return sections

    # Define section headers regex patterns
    # We look for lines that look like headers (uppercase, distinct)
    patterns = {
        "summary": r"(?i)(summary|profile|objective|about me)",
        "skills": r"(?i)(skills|technologies|technical skills|core competencies)",
        "experience": r"(?i)(experience|employment|work history|professional experience)",
        "education": r"(?i)(education|academic|qualifications)",
        "projects": r"(?i)(projects|portfolio)"
    }
    
    # Find start indices of each section
    section_indices = []
    text_lines = text.split('\n')
    
    for section, pattern in patterns.items():
        for i, line in enumerate(text_lines):
            # Check if line is a likely header (short, matches pattern)
            if len(line.strip()) < 50 and re.search(pattern, line):
                section_indices.append((i, section))
                break # Assume first match is the main header
    
    # Sort by line number
    section_indices.sort(key=lambda x: x[0])
    
    # Extract content between indices
    for i in range(len(section_indices)):
        start_idx, section_name = section_indices[i]
        
        if i < len(section_indices) - 1:
            end_idx = section_indices[i+1][0]
        else:
            end_idx = len(text_lines)
            
        content_lines = text_lines[start_idx+1:end_idx]
        content = "\n".join([line.strip() for line in content_lines if line.strip()])
        
        if section_name == "skills":
            # Try to split skills into a list
            # Common delimiters: comma, bullet points, pipes
            clean_content = re.sub(r'[•·▪-]', '', content) # Remove bullets
            if ',' in clean_content:
                sections[section_name] = [s.strip() for s in clean_content.split(',') if s.strip()]
            else:
                sections[section_name] = [s.strip() for s in clean_content.split('\n') if s.strip()]
        elif section_name == "experience":
             # Keep as list of strings/blocks for now, hard to structure without sophisticated parsing
             sections[section_name] = [line for line in content_lines if line.strip()]
        elif section_name == "education":
             sections[section_name] = [line for line in content_lines if line.strip()]
        elif section_name == "projects":
             sections[section_name] = [line for line in content_lines if line.strip()]
        else:
            sections[section_name] = content

    return sections
