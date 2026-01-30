from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Request, Response, Cookie
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
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import jwt
from app.auth import (
    pwd_context,
    SECRET_KEY,
    ALGORITHM,
    ADMIN_USERNAME,
    ADMIN_PASSWORD_HASH,
    TOKEN_EXPIRE_MINUTES,
)

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

def require_admin(admin_token: str | None = Cookie(default=None)):
    if not admin_token:
        raise HTTPException(status_code=403)
    try:
        payload = jwt.decode(admin_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") != "admin":
            raise HTTPException(status_code=403)
    except JWTError:
        raise HTTPException(status_code=403)

# Site Settings
@app.get("/settings", dependencies=[Depends(require_admin)])
def read_settings(db: Session = Depends(get_db)):
    return db.query(SiteSettings).first()


@app.post("/settings", dependencies=[Depends(require_admin)])
def create_settings(settings: SiteSettingsSchema, db: Session = Depends(get_db)):
    db_settings = SiteSettings(**settings.dict())
    db.add(db_settings)
    db.commit()
    db.refresh(db_settings)
    return db_settings


@app.put("/settings/{id}", dependencies=[Depends(require_admin)])
def update_settings(id: int, settings: SiteSettingsSchema, db: Session = Depends(get_db)):
    db_settings = db.query(SiteSettings).filter(SiteSettings.id == id).first()
    if not db_settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    for key, value in settings.dict(exclude_unset=True).items():
        setattr(db_settings, key, value)
    db.commit()
    db.refresh(db_settings)
    return db_settings


# Projects
@app.get("/projects", dependencies=[Depends(require_admin)])
def list_projects(db: Session = Depends(get_db)):
    return db.query(Project).order_by(Project.order).all()


@app.post("/projects", dependencies=[Depends(require_admin)])
def create_project(project: ProjectSchema, db: Session = Depends(get_db)):
    db_project = Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.put("/projects/{id}", dependencies=[Depends(require_admin)])
def update_project(id: int, project: ProjectSchema, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    for key, value in project.dict(exclude_unset=True).items():
        setattr(db_project, key, value)
    db.commit()
    db.refresh(db_project)
    return db_project


@app.delete("/projects/{id}", dependencies=[Depends(require_admin)])
def delete_project(id: int, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(db_project)
    db.commit()
    return {"ok": True}


# Education
@app.get("/education", dependencies=[Depends(require_admin)])
def list_education(db: Session = Depends(get_db)):
    return db.query(Education).order_by(Education.order).all()


@app.post("/education", dependencies=[Depends(require_admin)])
def create_education(edu: EducationSchema, db: Session = Depends(get_db)):
    db_edu = Education(**edu.dict())
    db.add(db_edu)
    db.commit()
    db.refresh(db_edu)
    return db_edu


@app.put("/education/{id}", dependencies=[Depends(require_admin)])
def update_education(id: int, edu: EducationSchema, db: Session = Depends(get_db)):
    db_edu = db.query(Education).filter(Education.id == id).first()
    if not db_edu:
        raise HTTPException(status_code=404, detail="Education not found")
    for key, value in edu.dict(exclude_unset=True).items():
        setattr(db_edu, key, value)
    db.commit()
    db.refresh(db_edu)
    return db_edu


@app.delete("/education/{id}", dependencies=[Depends(require_admin)])
def delete_education(id: int, db: Session = Depends(get_db)):
    db_edu = db.query(Education).filter(Education.id == id).first()
    if not db_edu:
        raise HTTPException(status_code=404, detail="Education not found")
    db.delete(db_edu)
    db.commit()
    return {"ok": True}


# Skill Icons

@app.get("/skills", dependencies=[Depends(require_admin)])
def list_skills(db: Session = Depends(get_db)):
    return db.query(SkillIcon).all()


@app.post("/skills", dependencies=[Depends(require_admin)])
def create_skill(skill: SkillIconSchema, db: Session = Depends(get_db)):
    db_skill = SkillIcon(**skill.dict())
    db.add(db_skill)
    db.commit()
    db.refresh(db_skill)
    return db_skill


@app.delete("/skills/{id}", dependencies=[Depends(require_admin)])
def delete_skill(id: int, db: Session = Depends(get_db)):
    db_skill = db.query(SkillIcon).filter(SkillIcon.id == id).first()
    if not db_skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(db_skill)
    db.commit()
    return {"ok": True}


@app.post("/upload", dependencies=[Depends(require_admin)])
async def upload_file(request: Request, file: UploadFile = File(...)):
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
        "file_url": str(request.base_url) + f"uploads/{subdir}/{filename}",
        "file_type": subdir
    }

# Auth
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/admin/login")
def admin_login(data: LoginRequest, response: Response):
    if data.username != ADMIN_USERNAME:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not pwd_context.verify(data.password, ADMIN_PASSWORD_HASH):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    payload = {
        "sub": "admin",
        "exp": datetime.utcnow() + timedelta(minutes=TOKEN_EXPIRE_MINUTES),
    }

    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    response.set_cookie(
        key="admin_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/",
    )

    return {"ok": True}

@app.post("/logout")
def admin_logout(response: Response):
    response.delete_cookie("admin_token")
    return {"ok": True}