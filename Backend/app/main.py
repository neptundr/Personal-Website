from fastapi import FastAPI, HTTPException, Depends
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
import uuid
import os
import shutil
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app import models, schemas

from app.models import Project, SiteSettings, Education, SkillIcon
from app.schemas import ProjectSchema, SiteSettingsSchema, EducationSchema, SkillIconSchema

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Portfolio Backend")

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

UPLOAD_DIR = "uploads"
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}
DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx"}

origins = [
    "http://localhost:3000",  # Depends.js dev
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


# Site Settings
@app.get("/settings")
def read_settings(db: Session = Depends(get_db)):
    return db.query(SiteSettings).first()


@app.post("/settings")
def create_settings(settings: SiteSettingsSchema, db: Session = Depends(get_db)):
    db_settings = SiteSettings(**settings.dict())
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings


@app.put("/settings/{id}")
def update_settings(id: int, settings: SiteSettingsSchema, db: Session = Depends(get_db)):
    db_settings = db.query(SiteSettings).filter(SiteSettings.id == id).first()
    if not db_settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    for key, value in settings.dict(exclude_unset=True).items():
        setattr(db_settings, key, value)
    db.commit()
    db.refresh(db_settings)
    return db_settings


# Project

@app.get("/projects")
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.order).all()


@app.post("/projects")
def create_project(project: ProjectSchema, db: Session = Depends(get_db)):
    db_project = Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.put("/projects/{id}")
def update_project(id: int, project: ProjectSchema, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in project.dict(exclude_unset=True).items():
        setattr(db_project, key, value)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.delete("/projects/{id}")
def delete_project(id: int, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(db_project)
    db.commit()
    return {"ok": True}


# Education

@app.get("/education")
def list_education(db: Session = Depends(get_db)):
    return db.query(Education).order_by(Education.order).all()


@app.post("/education")
def create_education(edu: EducationSchema, db: Session = Depends(get_db)):
    db_edu = Education(**edu.dict())
    db.add(db_edu)
    db.commit()
    db.refresh(db_edu)
    return db_edu


@app.put("/education/{id}")
def update_education(id: int, edu: EducationSchema, db: Session = Depends(get_db)):
    db_edu = db.query(Education).filter(Education.id == id).first()
    if not db_edu:
        raise HTTPException(status_code=404, detail="Education not found")
    for key, value in edu.dict(exclude_unset=True).items():
        setattr(db_edu, key, value)
    db.commit()
    db.refresh(db_edu)
    return db_edu


@app.delete("/education/{id}")
def delete_education(id: int, db: Session = Depends(get_db)):
    db_edu = db.query(Education).filter(Education.id == id).first()
    if not db_edu:
        raise HTTPException(status_code=404, detail="Education not found")
    db.delete(db_edu)
    db.commit()
    return {"ok": True}


# Skill Icons

@app.get("/skills")
def list_skills(db: Session = Depends(get_db)):
    return db.query(SkillIcon).all()


@app.post("/skills")
def create_skill(skill: SkillIconSchema, db: Session = Depends(get_db)):
    db_skill = SkillIcon(**skill.dict())
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill


@app.delete("/skills/{id}")
def delete_skill(id: int, db: Session = Depends(get_db)):
    db_skill = db.query(SkillIcon).filter(SkillIcon.id == id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(db_skill)
    db.commit()
    return {"ok": True}


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    ext = os.path.splitext(file.filename)[1].lower()

    # Decide folder
    if ext in IMAGE_EXTENSIONS:
        subdir = "images"
    elif ext in VIDEO_EXTENSIONS:
        subdir = "videos"
    elif ext in DOCUMENT_EXTENSIONS:
        subdir = "documents"
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}"
        )

    filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join("uploads", subdir, filename)

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {
        "file_url": f"/uploads/{subdir}/{filename}",
        "file_type": subdir
    }
