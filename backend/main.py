import os
import json
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, defer
from sqlalchemy import func

from database import engine, SessionLocal, Base, get_db
from models import StudentProfile
from schemas import (
    CourseType,
    SortField,
    SortOrder,
    DashboardSummaryResponse,
    PaginatedStudentsResponse,
    StudentDetailResponse,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)


def get_profiles_path() -> str:
    """Finds student_profiles.json whether uvicorn is run from root or backend/."""
    candidates = [
        "student_profiles.json",
        os.path.join(ROOT_DIR, "student_profiles.json"),
        os.path.join(BASE_DIR, "student_profiles.json"),
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return "student_profiles.json"


def profile_to_dict(s: StudentProfile, include_timeline: bool = True) -> dict:
    """Serializa el modelo SQLAlchemy al mismo formato JSON que espera el frontend."""
    data = {
        "student_id": s.student_id,
        "course_type": s.course_type,
        "last_updated": s.last_updated,
        "high_distress_flag": s.high_distress_flag,
        "radar_chart_data": s.radar_chart_data,
        "dimensions": s.dimensions,
    }
    if include_timeline:
        data["timeline"] = s.timeline
    return data


def seed_database():
    # 1. Crea la tabla student_profiles en PostgreSQL si no existe
    Base.metadata.create_all(bind=engine)

    # 2. Verifica si ya hay registros cargados
    db = SessionLocal()
    try:
        existing_count = db.query(func.count(StudentProfile.student_id)).scalar() or 0
        if existing_count > 0:
            print(f"Base de datos ya contiene {existing_count} perfiles. Omitiendo volcado.", flush=True)
            return

        path = get_profiles_path()
        if not os.path.exists(path):
            print(f"No se encontró {path} para el volcado inicial.", flush=True)
            return

        with open(path, "r", encoding="utf-8") as f:
            raw_profiles = json.load(f)

        objects = [
            StudentProfile(
                student_id=p["student_id"],
                course_type=p["course_type"],
                last_updated=p["last_updated"],
                high_distress_flag=p["high_distress_flag"],
                total_posts=p["dimensions"]["behavioral"]["total_posts"],
                radar_chart_data=p["radar_chart_data"],
                dimensions=p["dimensions"],
                timeline=p["timeline"],
            )
            for p in raw_profiles
        ]

        db.bulk_save_objects(objects)
        db.commit()
        print(f"Se volcaron {len(objects)} perfiles a PostgreSQL exitosamente.", flush=True)
    except Exception as exc:
        db.rollback()
        print(f"Error durante el volcado inicial, se aplicó rollback: {exc}", flush=True)
        raise
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_database()
    yield
    engine.dispose()


app = FastAPI(
    title="Learning Analytics Dashboard API",
    description="Serves Behavioral, Affective, and Cognitive Student Models",
    lifespan=lifespan,
)

# Orígenes permitidos para el frontend React/Vite (configurable por variable de entorno)
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"mensaje": "API del Student Model funcionando correctamente con PostgreSQL"}


@app.get("/api/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Returns high-level KPI cards for the top of the React Dashboard in a single SQL query."""
    rows = (
        db.query(
            StudentProfile.course_type,
            func.count(StudentProfile.student_id).label("total"),
            func.count(StudentProfile.student_id)
            .filter(StudentProfile.high_distress_flag.is_(True))
            .label("distress_count"),
        )
        .group_by(StudentProfile.course_type)
        .all()
    )

    if not rows:
        return {
            "total_students": 0,
            "high_distress_count": 0,
            "high_distress_rate_pct": 0.0,
            "courses_breakdown": {},
        }

    courses = {row.course_type: row.total for row in rows}
    total_students = sum(courses.values())
    high_distress = sum(row.distress_count for row in rows)

    return {
        "total_students": total_students,
        "high_distress_count": high_distress,
        "high_distress_rate_pct": round((high_distress / total_students) * 100, 2),
        "courses_breakdown": courses,
    }


SORT_COLUMNS = {
    "total_posts": StudentProfile.total_posts,
    "last_updated": StudentProfile.last_updated,
    "student_id": StudentProfile.student_id,
}


@app.get(
    "/api/students",
    response_model=PaginatedStudentsResponse,
    response_model_exclude_none=True,
)
def list_students(
    course_type: Optional[CourseType] = Query(None, description="Filter by Education, Medicine, or Humanities"),
    high_distress_only: bool = Query(False, description="Filter only at-risk students"),
    min_posts: int = Query(1, ge=0, description="Minimum posts (set to 2+ for richer timelines)"),
    search: Optional[str] = Query(None, min_length=1, description="Search student by student_id (partial or exact)"),
    sort_by: SortField = Query("total_posts", description="Column to sort by"),
    sort_order: SortOrder = Query("desc", description="Sort direction (asc or desc)"),
    limit: int = Query(50, ge=1, le=500, description="Number of students per page"),
    offset: int = Query(0, ge=0, description="Number of students to skip for pagination"),
    include_timeline: bool = Query(False, description="Include full post-by-post timeline in list response"),
    db: Session = Depends(get_db),
):
    """Returns paginated students and total matching count for the interactive table."""
    query = db.query(StudentProfile).filter(StudentProfile.total_posts >= min_posts)

    if course_type:
        query = query.filter(StudentProfile.course_type == course_type)

    if high_distress_only:
        query = query.filter(StudentProfile.high_distress_flag.is_(True))

    cleaned_search = search.strip() if search else ""
    if cleaned_search:
        # Escapa comodines SQL (\, %, _) para que se busquen como texto literal
        escaped_search = (
            cleaned_search.replace("\\", "\\\\")
            .replace("%", "\\%")
            .replace("_", "\\_")
        )
        query = query.filter(StudentProfile.student_id.ilike(f"%{escaped_search}%", escape="\\"))

    # Conteo total de estudiantes que cumplen los filtros activos (para paginación en el frontend)
    total_matching = query.count()

    if not include_timeline:
        # Evita que PostgreSQL lea y transfiera la columna pesada 'timeline' si no se pide
        query = query.options(defer(StudentProfile.timeline))

    sort_col = SORT_COLUMNS[sort_by]
    primary_order = sort_col.asc() if sort_order == "asc" else sort_col.desc()

    students = (
        query.order_by(primary_order, StudentProfile.student_id.asc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return {
        "total_matching": total_matching,
        "limit": limit,
        "offset": offset,
        "items": [profile_to_dict(s, include_timeline=include_timeline) for s in students],
    }


@app.get("/api/students/{student_id}", response_model=StudentDetailResponse)
def get_student_detail(student_id: str, db: Session = Depends(get_db)):
    """Returns a single student's 3 dimensions, radar_chart_data, and time-series timeline."""
    normalized_id = student_id.strip().upper()
    student = db.query(StudentProfile).filter(StudentProfile.student_id == normalized_id).first()
    if student is not None:
        return profile_to_dict(student, include_timeline=True)
    raise HTTPException(status_code=404, detail="Student not found")
