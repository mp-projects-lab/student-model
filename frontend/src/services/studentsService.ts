import type {
  CourseAnalyticsResponse,
  CourseFilter,
  DashboardSummaryResponse,
  PaginatedStudentsResponse,
  StudentDetailResponse,
  StudentsQueryParams,
} from '../types/student'
import { apiGet, buildQueryString } from './api'

export function fetchDashboardSummary(
  signal?: AbortSignal,
): Promise<DashboardSummaryResponse> {
  return apiGet<DashboardSummaryResponse>('/api/summary', signal)
}

export function fetchCourseAnalytics(
  course: CourseFilter,
  signal?: AbortSignal,
): Promise<CourseAnalyticsResponse> {
  const query = buildQueryString({
    course_type: course === 'ALL' ? undefined : course,
  })
  return apiGet<CourseAnalyticsResponse>(`/api/analytics${query}`, signal)
}

export function fetchStudents(
  params: StudentsQueryParams,
  signal?: AbortSignal,
): Promise<PaginatedStudentsResponse> {
  const query = buildQueryString({
    course_type: params.course_type,
    status: params.status,
    intent: params.intent,
    high_distress_only: params.high_distress_only,
    min_posts: params.min_posts,
    search: params.search,
    sort_by: params.sort_by,
    sort_order: params.sort_order,
    limit: params.limit,
    offset: params.offset,
    include_timeline: params.include_timeline,
  })
  return apiGet<PaginatedStudentsResponse>(`/api/students${query}`, signal)
}

export function fetchStudentDetail(
  studentId: string,
  signal?: AbortSignal,
): Promise<StudentDetailResponse> {
  const encodedId = encodeURIComponent(studentId)
  return apiGet<StudentDetailResponse>(`/api/students/${encodedId}`, signal)
}
