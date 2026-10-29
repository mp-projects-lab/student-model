import os
import json
from typing import Optional
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Learning Analytics Dashboard API",
    description="Serves Behavioral, Affective, and Cognitive Student Models"
)

# Allow React/Vite frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BASE_DIR)

_PROFILES_CACHE: list = []
_PROFILES_BY_ID: dict = {}
_CACHE_MTIME: float = 0.0


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


def load_profiles() -> list:
    """Loads student profiles into memory and refreshes only if the file changes on disk."""
    global _PROFILES_CACHE, _PROFILES_BY_ID, _CACHE_MTIME
    path = get_profiles_path()
    if not os.path.exists(path):
        return []
    mtime = os.path.getmtime(path)
    if not _PROFILES_CACHE or mtime != _CACHE_MTIME:
        with open(path, "r", encoding="utf-8") as f:
            _PROFILES_CACHE = json.load(f)
        _PROFILES_BY_ID = {p["student_id"]: p for p in _PROFILES_CACHE}
        _CACHE_MTIME = mtime
    return _PROFILES_CACHE


@app.on_event("startup")
def preload_profiles():
    load_profiles()


@app.get("/")
def read_root():
    return {"mensaje": "API del Student Model funcionando correctamente"}


@app.get("/api/summary")
def get_dashboard_summary():
    """Returns high-level KPI cards for the top of the React Dashboard."""
    profiles = load_profiles()
    if not profiles:
        return {
            "total_students": 0,
            "high_distress_count": 0,
            "high_distress_rate_pct": 0.0,
            "courses_breakdown": {}
        }

    high_distress = sum(1 for p in profiles if p["high_distress_flag"])
    courses = {}
    for p in profiles:
        c = p["course_type"]
        courses[c] = courses.get(c, 0) + 1

    return {
        "total_students": len(profiles),
        "high_distress_count": high_distress,
        "high_distress_rate_pct": round((high_distress / len(profiles)) * 100, 2),
        "courses_breakdown": courses
    }


@app.get("/api/students")
def list_students(
    course_type: Optional[str] = Query(None, description="Filter by Education, Medicine, or Humanities"),
    high_distress_only: bool = Query(False, description="Filter only at-risk students"),
    min_posts: int = Query(1, description="Minimum posts (set to 2+ for richer timelines)"),
    limit: int = Query(50, le=500)
):
    """Returns the list of students for the interactive table."""
    profiles = load_profiles()
    filtered = [
        p for p in profiles
        if (not course_type or p["course_type"].lower() == course_type.lower())
        and (not high_distress_only or p["high_distress_flag"])
        and (p["dimensions"]["behavioral"]["total_posts"] >= min_posts)
    ]
    return filtered[:limit]


@app.get("/api/students/{student_id}")
def get_student_detail(student_id: str):
    """Returns a single student's 3 dimensions, radar_chart_data, and time-series timeline."""
    load_profiles()
    student = _PROFILES_BY_ID.get(student_id)
    if student is not None:
        return student
    raise HTTPException(status_code=404, detail="Student not found")
