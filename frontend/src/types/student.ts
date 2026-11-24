export type CourseType = 'Education' | 'Medicine' | 'Humanities'
export type CourseFilter = 'ALL' | CourseType
export type DistressStatus = 'risk' | 'caution' | 'safe'
export type StatusFilter = '' | DistressStatus
export type SortField = 'total_posts' | 'last_updated' | 'student_id' | 'avg_distress'
export type SortOrder = 'asc' | 'desc'

export interface RadarMetric {
  dimension: string
  score: number
  fullMark: number
}

export interface BehavioralDimension {
  engagement_score_pct: number
  total_posts: number
  avg_word_count: number
  total_words: number
  unique_active_days: number
  active_span_days: number
}

export interface AffectiveDimension {
  avg_distress_pct: number
  max_distress_pct: number
  affective_stability_pct: number
  primary_emotion: string
  high_distress_flag: boolean
}

export interface CognitiveDimension {
  cognitive_mastery_pct: number
  primary_intent: string
  avg_intent_confidence_pct: number
}

export interface StudentDimensions {
  behavioral: BehavioralDimension
  affective: AffectiveDimension
  cognitive: CognitiveDimension
}

export interface TimelineEntry {
  created_at: string
  word_count: number
  primary_emotion: string
  distress_pct: number
  cognitive_intent: string
  intent_score_pct: number
  text_preview: string
}

export interface StudentListItem {
  student_id: string
  course_type: CourseType
  last_updated: string
  high_distress_flag: boolean
  radar_chart_data: RadarMetric[]
  dimensions: StudentDimensions
  timeline?: TimelineEntry[]
}

export interface PaginatedStudentsResponse {
  total_matching: number
  limit: number
  offset: number
  items: StudentListItem[]
}

export interface StudentDetailResponse extends StudentListItem {
  timeline: TimelineEntry[]
}

export interface DashboardSummaryResponse {
  total_students: number
  high_distress_count: number
  high_distress_rate_pct: number
  courses_breakdown: Record<string, number>
}

export interface StatusBreakdown {
  risk: number
  risk_pct: number
  caution: number
  caution_pct: number
  safe: number
  safe_pct: number
}

export interface EmotionStat {
  emotion: string
  count: number
  pct: number
}

export interface IntentStat {
  intent: string
  count: number
  pct: number
}

export interface CourseAnalyticsResponse {
  course_type: CourseType | null
  total_students: number
  total_posts: number
  status_breakdown: StatusBreakdown
  radar_avg: RadarMetric[]
  top_emotions: EmotionStat[]
  intents: IntentStat[]
  course_radars: Record<string, RadarMetric[]>
}

export interface StudentsQueryParams {
  course_type?: CourseType
  status?: DistressStatus
  intent?: string
  high_distress_only?: boolean
  min_posts?: number
  search?: string
  sort_by?: SortField
  sort_order?: SortOrder
  limit?: number
  offset?: number
  include_timeline?: boolean
}
