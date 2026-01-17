from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models, schemas

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Portfolio Backend")

origins = [
    "http://localhost:3000",  # Next.js dev
    # "https://your-production-domain.com",  # Add production URL later
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/projects", response_model=list[schemas.ProjectSchema])
def read_projects(db: Session = Depends(get_db)):
    projects = db.query(models.Project).all()
    return projects

@app.put("/projects/{project_id}", response_model=schemas.ProjectSchema)
def update_project(project_id: int, data: schemas.ProjectSchema, db: Session = Depends(get_db)):
    project = db.query(models.Project).get(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project

# Education
@app.get("/education", response_model=list[schemas.EducationSchema])
def list_education(db: Session = Depends(get_db)):
    return db.query(models.Education).order_by(models.Education.order).all()

@app.put("/education/{edu_id}", response_model=schemas.EducationSchema)
def update_education(edu_id: int, data: schemas.EducationSchema, db: Session = Depends(get_db)):
    edu = db.query(models.Education).get(edu_id)
    if not edu:
        raise HTTPException(status_code=404, detail="Education entry not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(edu, key, value)
    db.commit()
    db.refresh(edu)
    return edu

# SiteSettings
@app.get("/settings", response_model=schemas.SiteSettingsSchema)
def get_settings(db: Session = Depends(get_db)):
    return db.query(models.SiteSettings).first()

@app.put("/settings/{setting_id}", response_model=schemas.SiteSettingsSchema)
def update_settings(setting_id: int, data: schemas.SiteSettingsSchema, db: Session = Depends(get_db)):
    settings = db.query(models.SiteSettings).get(setting_id)
    if not settings:
        raise HTTPException(status_code=404, detail="SiteSettings not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(settings, key, value)
    db.commit()
    db.refresh(settings)
    return settings

# SkillIcons
@app.get("/skills", response_model=list[schemas.SkillIconSchema])
def list_skills(db: Session = Depends(get_db)):
    return db.query(models.SkillIcon).all()

@app.put("/skills/{skill_id}", response_model=schemas.SkillIconSchema)
def update_skill(skill_id: int, data: schemas.SkillIconSchema, db: Session = Depends(get_db)):
    skill = db.query(models.SkillIcon).get(skill_id)
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(skill, key, value)
    db.commit()
    db.refresh(skill)
    return skill