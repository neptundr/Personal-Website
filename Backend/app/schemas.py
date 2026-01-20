from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class ProjectSchema(BaseModel):
    # id: int
    title: str = "Empty Title"
    description: Optional[str] = ""
    type: Optional[str] = "project"
    company: Optional[str] = ""
    location: Optional[str] = ""
    start_date: Optional[date] = date(2025, 1, 1)
    end_date: Optional[date] = date(2026, 1, 1)
    is_current: Optional[bool] = False
    image_url: Optional[str] = ""
    skills: Optional[List[str]] = []
    link: Optional[str] = ""
    github_url: Optional[str] = ""
    order: Optional[int] = 0
    featured: Optional[bool] = False

    class Config:
        from_attributes = True
#
# class ProjectOut(ProjectSchema):
#     id: int

class EducationSchema(BaseModel):
    # id: int
    institution: str
    degree: str
    institution_url: Optional[str]
    field: Optional[str]
    start_year: Optional[str]
    end_year: Optional[str]
    description: Optional[str]
    logo_url: Optional[str]
    type: Optional[str]
    order: Optional[int]

    class Config:
        from_attributes = True

class SiteSettingsSchema(BaseModel):
    available_for_hire: Optional[bool] = True
    hero_name: Optional[str] = "Denis"
    hero_subtitle: Optional[str] = "Subtitle"
    hero_video_url: Optional[str]
    # love_items_text: Optional[str]
    love_items: Optional[List[str]] = []
    linkedin_url: Optional[str]
    github_url: Optional[str]
    email: Optional[str]
    twitter_url: Optional[str]
    resume_url: Optional[str]

    class Config:
        from_attributes = True

class SkillIconSchema(BaseModel):
    # id: int
    skill_name: str
    icon_url: str

    class Config:
        from_attributes = True