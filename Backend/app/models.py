from sqlalchemy import Column, Integer, String, Boolean, Date, Text, ARRAY
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    type = Column(String, default="project")  # "work", "project", "achievement"
    company = Column(String)
    location = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    is_current = Column(Boolean, default=False)
    image_url = Column(String)
    skills = Column(ARRAY(String))
    link = Column(String)
    github_url = Column(String)
    order = Column(Integer)
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
    love_items = Column(ARRAY(String))
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