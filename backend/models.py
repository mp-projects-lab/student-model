from sqlalchemy import Column, String, Boolean, Integer
from sqlalchemy.dialects.postgresql import JSONB
from database import Base


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    # Columnas simples (escalares) para filtrado y búsqueda rápida
    # primary_key=True ya genera automáticamente un índice único B-Tree en PostgreSQL
    student_id = Column(String, primary_key=True)
    course_type = Column(String, index=True, nullable=False)
    last_updated = Column(String, nullable=False)
    high_distress_flag = Column(Boolean, default=False, index=True, nullable=False)
    total_posts = Column(Integer, default=0, index=True, nullable=False)

    # Columnas JSONB para conservar la estructura anidada de student_profiles.json
    radar_chart_data = Column(JSONB, nullable=False)
    dimensions = Column(JSONB, nullable=False)
    timeline = Column(JSONB, nullable=False)
