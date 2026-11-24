import { useCallback, useEffect, useState } from 'react'
import { fetchStudents } from '../services/studentsService'
import type {
  CourseFilter,
  PaginatedStudentsResponse,
  SortField,
  SortOrder,
  StatusFilter,
} from '../types/student'

export interface UseStudentsOptions {
  course: CourseFilter
  status: StatusFilter
  intent: string
  search: string
  page: number
  pageSize: number
  sortBy?: SortField
  sortOrder?: SortOrder
}

interface StudentsState {
  loadedKey: string | null
  data: PaginatedStudentsResponse | null
  error: string | null
}

export function useStudents({
  course,
  status,
  intent,
  search,
  page,
  pageSize,
  sortBy = 'avg_distress',
  sortOrder = 'desc',
}: UseStudentsOptions) {
  const [reloadCount, setReloadCount] = useState(0)
  const offset = (page - 1) * pageSize
  const trimmedSearch = search.trim()

  const requestKey = [
    course,
    status,
    intent,
    trimmedSearch,
    page,
    pageSize,
    sortBy,
    sortOrder,
    reloadCount,
  ].join('|')

  const [state, setState] = useState<StudentsState>({
    loadedKey: null,
    data: null,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    fetchStudents(
      {
        course_type: course === 'ALL' ? undefined : course,
        status: status || undefined,
        intent: intent || undefined,
        search: trimmedSearch || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: pageSize,
        offset,
        include_timeline: false,
      },
      controller.signal,
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ loadedKey: requestKey, data, error: null })
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo cargar el listado de estudiantes.'
        setState((prev) => ({
          loadedKey: requestKey,
          data: prev.data,
          error: message,
        }))
      })

    return () => {
      controller.abort()
    }
  }, [
    course,
    status,
    intent,
    trimmedSearch,
    pageSize,
    offset,
    sortBy,
    sortOrder,
    requestKey,
  ])

  const refetch = useCallback(() => {
    setReloadCount((count) => count + 1)
  }, [])

  const totalMatching = state.data?.total_matching ?? 0
  const totalPages = Math.max(1, Math.ceil(totalMatching / pageSize))

  return {
    students: state.data?.items ?? [],
    totalMatching,
    totalPages,
    isLoading: state.loadedKey !== requestKey,
    error: state.error,
    refetch,
  }
}
