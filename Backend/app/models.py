from datetime import datetime
from datetime import date
from sqlalchemy import Column, Integer, String, Boolean, Date, Text
from sqlalchemy.types import JSON
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, default="Empty Title")
    description = Column(Text, nullable=False, default="Empty Description")
    type = Column(String, default="project")
    company = Column(String, default="Empty Company")
    location = Column(String, default="Empty Location")
    start_date = Column(Date, default=date(2025, 1, 1))
    end_date = Column(Date, default=date(2026, 1, 1))
    is_current = Column(Boolean, default=False)
    image_url = Column(String,default="")
    skills = Column(JSON)  # list[str]
    link = Column(String,default="")
    github_url = Column(String,default="")
    order = Column(Integer, default=0)
    featured = Column(Boolean, default=False)

class Education(Base):
    __tablename__ = "education"
    id = Column(Integer, primary_key=True, index=True)
    institution = Column(String, nullable=False)
    institution_url = Column(String)
    degree = Column(String, nullable=False)
    field = Column(String)
    start_year = Column(String)
    end_year = Column(String)
    description = Column(Text)
    logo_url = Column(String)
    type = Column(String)  # school / university
    order = Column(Integer)

class SiteSettings(Base):
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)
    available_for_hire = Column(Boolean, default=True)
    hero_name = Column(String, default="Denis")
    hero_subtitle = Column(String)
    hero_video_url = Column(String)
    love_items = Column(JSON)  # list[str]
    linkedin_url = Column(String)
    github_url = Column(String)
    email = Column(String)
    twitter_url = Column(String)
    resume_url = Column(String)

class SkillIcon(Base):
    __tablename__ = "skill_icons"
    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String, nullable=False)
    icon_url = Column(String, nullable=False)