import os

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# 1. Fetch the connection string injected by Docker Compose
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL"
)
# 2. Crash if the database URL is missing
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable missing. Check docker-compose.yml")

# 3. Create the Engine (The core that actually talks to PostgreSQL)
# pool_pre_ping=True verifies connections are alive before using them
engine = create_engine(SQLALCHEMY_DATABASE_URL, pool_pre_ping=True)

# 4. Create a Session Factory (Generates isolated database transactions)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# 5. Create the Base Class using SQLAlchemy 2.0 DeclarativeBase
class Base(DeclarativeBase):
    pass


# 6. The Dependency Injection function for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db  # Gives the connection to the API endpoint
    finally:
        db.close()  # Safely closes the connection when the endpoint finishes
