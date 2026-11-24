import os
import json
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, defer
from sqlalchemy import Float, and_, cast, func

from database import engine, SessionLocal, Base, get_db
from models import StudentProfile
from schemas import (
    CourseType,
    DistressStatus,
    SortField,
    SortOrder,
    DashboardSummaryResponse,
    CourseAnalyticsResponse,
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


COI_LABELS = {
    "Course Logistics & Social",
    "Triggering (Questioning)",
    "Exploration (Discussion)",
    "Integration (Synthesis)",
}


def seed_database():
    # 1. Crea la tabla student_profiles en PostgreSQL si no existe
    Base.metadata.create_all(bind=engine)

    # 2. Verifica si ya hay registros cargados y si tienen la taxonomía CoI actualizada
    db = SessionLocal()
    try:
        path = get_profiles_path()
        existing_count = db.query(func.count(StudentProfile.student_id)).scalar() or 0
        if existing_count > 0:
            sample = db.query(StudentProfile).first()
            db_intent = (
                sample.dimensions.get("cognitive", {}).get("primary_intent")
                if sample and isinstance(sample.dimensions, dict)
                else None
            )
            if db_intent in COI_LABELS:
                print(f"Base de datos ya contiene {existing_count} perfiles actualizados (CoI). Omitiendo volcado.", flush=True)
                return

            # Check if the JSON file on disk has been upgraded to CoI labels
            if os.path.exists(path):
                with open(path, "r", encoding="utf-8") as f:
                    raw_profiles = json.load(f)
                json_intent = (
                    raw_profiles[0].get("dimensions", {}).get("cognitive", {}).get("primary_intent")
                    if raw_profiles
                    else None
                )
                if json_intent in COI_LABELS:
                    print("Detectada actualización a taxonomía CoI en student_profiles.json. Actualizando PostgreSQL...", flush=True)
                    db.query(StudentProfile).delete()
                    db.commit()
                else:
                    print(f"Base de datos ya contiene {existing_count} perfiles. Omitiendo volcado.", flush=True)
                    return
            else:
                return
        else:
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


AVG_DISTRESS_EXPR = cast(
    StudentProfile.dimensions["affective"]["avg_distress_pct"].astext, Float
)
ENGAGEMENT_EXPR = cast(
    StudentProfile.dimensions["behavioral"]["engagement_score_pct"].astext, Float
)
COGNITIVE_EXPR = cast(
    StudentProfile.dimensions["cognitive"]["cognitive_mastery_pct"].astext, Float
)
STABILITY_EXPR = cast(
    StudentProfile.dimensions["affective"]["affective_stability_pct"].astext, Float
)
PRIMARY_EMOTION_EXPR = StudentProfile.dimensions["affective"]["primary_emotion"].astext
PRIMARY_INTENT_EXPR = StudentProfile.dimensions["cognitive"]["primary_intent"].astext


def _build_radar_metrics(
    engagement: float, cognitive: float, stability: float, distress: float
) -> list[dict]:
    return [
        {"dimension": "Behavioral Engagement", "score": round(engagement, 1), "fullMark": 100},
        {"dimension": "Cognitive Depth", "score": round(cognitive, 1), "fullMark": 100},
        {"dimension": "Affective Stability", "score": round(stability, 1), "fullMark": 100},
        {"dimension": "Distress Risk", "score": round(distress, 1), "fullMark": 100},
    ]


@app.get("/api/analytics", response_model=CourseAnalyticsResponse)
def get_course_analytics(
    course_type: Optional[CourseType] = Query(
        None, description="Optional filter by Education, Medicine, or Humanities"
    ),
    db: Session = Depends(get_db),
):
    """Returns per-course or global aggregates for the 4 dashboard cards directly from PostgreSQL."""
    course_rows = (
        db.query(
            StudentProfile.course_type.label("course_type"),
            func.count(StudentProfile.student_id).label("total_students"),
            func.coalesce(func.sum(StudentProfile.total_posts), 0).label("total_posts"),
            func.count(StudentProfile.student_id)
            .filter(AVG_DISTRESS_EXPR >= 30.0)
            .label("risk"),
            func.count(StudentProfile.student_id)
            .filter(and_(AVG_DISTRESS_EXPR >= 15.0, AVG_DISTRESS_EXPR < 30.0))
            .label("caution"),
            func.count(StudentProfile.student_id)
            .filter(AVG_DISTRESS_EXPR < 15.0)
            .label("safe"),
            func.coalesce(func.sum(ENGAGEMENT_EXPR), 0.0).label("sum_engagement"),
            func.coalesce(func.sum(COGNITIVE_EXPR), 0.0).label("sum_cognitive"),
            func.coalesce(func.sum(STABILITY_EXPR), 0.0).label("sum_stability"),
            func.coalesce(func.sum(AVG_DISTRESS_EXPR), 0.0).label("sum_distress"),
        )
        .group_by(StudentProfile.course_type)
        .all()
    )

    if not course_rows:
        empty_radar = _build_radar_metrics(0.0, 0.0, 0.0, 0.0)
        return {
            "course_type": course_type,
            "total_students": 0,
            "total_posts": 0,
            "status_breakdown": {
                "risk": 0,
                "risk_pct": 0.0,
                "caution": 0,
                "caution_pct": 0.0,
                "safe": 0,
                "safe_pct": 0.0,
            },
            "radar_avg": empty_radar,
            "top_emotions": [],
            "intents": [],
            "course_radars": {"ALL": empty_radar},
        }

    course_radars: dict[str, list[dict]] = {}
    all_students = 0
    all_eng = 0.0
    all_cog = 0.0
    all_stab = 0.0
    all_dist = 0.0

    for row in course_rows:
        cnt = row.total_students or 0
        all_students += cnt
        all_eng += float(row.sum_engagement or 0.0)
        all_cog += float(row.sum_cognitive or 0.0)
        all_stab += float(row.sum_stability or 0.0)
        all_dist += float(row.sum_distress or 0.0)
        if cnt > 0:
            course_radars[row.course_type] = _build_radar_metrics(
                float(row.sum_engagement) / cnt,
                float(row.sum_cognitive) / cnt,
                float(row.sum_stability) / cnt,
                float(row.sum_distress) / cnt,
            )

    course_radars["ALL"] = (
        _build_radar_metrics(
            all_eng / all_students,
            all_cog / all_students,
            all_stab / all_students,
            all_dist / all_students,
        )
        if all_students > 0
        else _build_radar_metrics(0.0, 0.0, 0.0, 0.0)
    )

    target_rows = (
        [r for r in course_rows if r.course_type == course_type]
        if course_type
        else course_rows
    )

    total_students = sum(r.total_students for r in target_rows)
    total_posts = sum(int(r.total_posts or 0) for r in target_rows)
    risk = sum(r.risk for r in target_rows)
    caution = sum(r.caution for r in target_rows)
    safe = sum(r.safe for r in target_rows)

    def _pct(part: int, whole: int) -> float:
        return round((part / whole) * 100, 1) if whole > 0 else 0.0

    selected_radar = course_radars.get(
        course_type if course_type else "ALL",
        _build_radar_metrics(0.0, 0.0, 0.0, 0.0),
    )

    emotion_query = db.query(
        PRIMARY_EMOTION_EXPR.label("emotion"),
        func.count(StudentProfile.student_id).label("count"),
    )
    intent_query = db.query(
        PRIMARY_INTENT_EXPR.label("intent"),
        func.count(StudentProfile.student_id).label("count"),
    )
    if course_type:
        emotion_query = emotion_query.filter(StudentProfile.course_type == course_type)
        intent_query = intent_query.filter(StudentProfile.course_type == course_type)

    emotion_rows = (
        emotion_query.group_by(PRIMARY_EMOTION_EXPR)
        .order_by(func.count(StudentProfile.student_id).desc())
        .limit(5)
        .all()
    )
    intent_rows = (
        intent_query.group_by(PRIMARY_INTENT_EXPR)
        .order_by(func.count(StudentProfile.student_id).desc())
        .all()
    )

    return {
        "course_type": course_type,
        "total_students": total_students,
        "total_posts": total_posts,
        "status_breakdown": {
            "risk": risk,
            "risk_pct": _pct(risk, total_students),
            "caution": caution,
            "caution_pct": _pct(caution, total_students),
            "safe": safe,
            "safe_pct": _pct(safe, total_students),
        },
        "radar_avg": selected_radar,
        "top_emotions": [
            {
                "emotion": row.emotion,
                "count": row.count,
                "pct": _pct(row.count, total_students),
            }
            for row in emotion_rows
            if row.emotion
        ],
        "intents": [
            {
                "intent": row.intent,
                "count": row.count,
                "pct": _pct(row.count, total_students),
            }
            for row in intent_rows
            if row.intent
        ],
        "course_radars": course_radars,
    }


SORT_COLUMNS = {
    "total_posts": StudentProfile.total_posts,
    "last_updated": StudentProfile.last_updated,
    "student_id": StudentProfile.student_id,
    "avg_distress": AVG_DISTRESS_EXPR,
}


@app.get(
    "/api/students",
    response_model=PaginatedStudentsResponse,
    response_model_exclude_none=True,
)
def list_students(
    course_type: Optional[CourseType] = Query(None, description="Filter by Education, Medicine, or Humanities"),
    status: Optional[DistressStatus] = Query(None, description="Filter by risk (>=30%), caution (15%-29.9%), or safe (<15%)"),
    intent: Optional[str] = Query(None, min_length=1, description="Filter by cognitive primary_intent"),
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

    if status == "risk":
        query = query.filter(AVG_DISTRESS_EXPR >= 30.0)
    elif status == "caution":
        query = query.filter(and_(AVG_DISTRESS_EXPR >= 15.0, AVG_DISTRESS_EXPR < 30.0))
    elif status == "safe":
        query = query.filter(AVG_DISTRESS_EXPR < 15.0)
    elif high_distress_only:
        query = query.filter(StudentProfile.high_distress_flag.is_(True))

    cleaned_intent = intent.strip() if intent else ""
    if cleaned_intent:
        query = query.filter(PRIMARY_INTENT_EXPR == cleaned_intent)

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
