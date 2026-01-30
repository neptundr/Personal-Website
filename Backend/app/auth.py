import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from passlib.context import CryptContext

load_dotenv()

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

SECRET_KEY = os.environ["SECRET_KEY"]
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = 60 * 12

ADMIN_USERNAME = os.environ["ADMIN_USERNAME"]
ADMIN_PASSWORD_HASH = os.environ["ADMIN_PASSWORD_HASH"]

