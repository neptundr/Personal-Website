from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./portfolio.db"  # use PostgreSQL in production

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}  # SQLite only
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)