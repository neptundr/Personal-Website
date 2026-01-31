import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()
DATABASE_URL = os.environ["DATABASE_URL"]

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker
#
# SQLALCHEMY_DATABASE_URL = "sqlite:///./portfolio.db"
#
# engine = create_engine(
#     SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}  # SQLite only
# )
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)