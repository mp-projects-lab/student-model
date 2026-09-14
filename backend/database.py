import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 1. Fetch the connection string injected by Docker Compose
# If it doesn't find it, it defaults to a local SQLite fallback (good for testing)
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./sql_app.db"
)

# 2. Create the Engine (The core that actually talks to PostgreSQL)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. Create a Session Factory (Generates isolated database transactions)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. Create the Base Class (All your future data models will inherit from this)
Base = declarative_base()

# 5. The Dependency Injection function for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db # Gives the connection to the API endpoint
    finally:
        db.close() # Safely closes the connection when the endpoint finishes