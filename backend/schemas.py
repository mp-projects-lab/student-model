from typing import Literal, Optional
from pydantic import BaseModel

CourseType = Literal["Education", "Medicine", "Humanities"]
DistressStatus = Literal["risk", "caution", "safe"]
SortField = Literal["total_posts", "last_updated", "student_id", "avg_distress"]
SortOrder = Literal["asc", "desc"]


class RadarMetric(BaseModel):
    dimension: str
    score: float
    fullMark: int


class BehavioralDimension(BaseModel):
    engagement_score_pct: float
    total_posts: int
    avg_word_count: float
    total_words: int
    unique_active_days: int
    active_span_days: int


class AffectiveDimension(BaseModel):
    avg_distress_pct: float
    max_distress_pct: float
    affective_stability_pct: float
    primary_emotion: str
    high_distress_flag: bool


class CognitiveDimension(BaseModel):
    cognitive_mastery_pct: float
    primary_intent: str
    avg_intent_confidence_pct: float


class StudentDimensions(BaseModel):
    behavioral: BehavioralDimension
    affective: AffectiveDimension
    cognitive: CognitiveDimension


class TimelineEntry(BaseModel):
    created_at: str
    word_count: int
    primary_emotion: str
    distress_pct: float
    cognitive_intent: str
    intent_score_pct: float
    text_preview: str


class StudentListItem(BaseModel):
    student_id: str
    course_type: CourseType
    last_updated: str
    high_distress_flag: bool
    radar_chart_data: list[RadarMetric]
    dimensions: StudentDimensions
    timeline: Optional[list[TimelineEntry]] = None


class PaginatedStudentsResponse(BaseModel):
    total_matching: int
    limit: int
    offset: int
    items: list[StudentListItem]


class StudentDetailResponse(StudentListItem):
    timeline: list[TimelineEntry]


class DashboardSummaryResponse(BaseModel):
    total_students: int
    high_distress_count: int
    high_distress_rate_pct: float
    courses_breakdown: dict[str, int]


class StatusBreakdown(BaseModel):
    risk: int
    risk_pct: float
    caution: int
    caution_pct: float
    safe: int
    safe_pct: float


class EmotionStat(BaseModel):
    emotion: str
    count: int
    pct: float


class IntentStat(BaseModel):
    intent: str
    count: int
    pct: float


class CourseAnalyticsResponse(BaseModel):
    course_type: Optional[CourseType] = None
    total_students: int
    total_posts: int
    status_breakdown: StatusBreakdown
    radar_avg: list[RadarMetric]
    top_emotions: list[EmotionStat]
    intents: list[IntentStat]
    course_radars: dict[str, list[RadarMetric]]
