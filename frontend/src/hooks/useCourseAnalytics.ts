import { useCallback, useEffect, useState } from 'react'
import { fetchCourseAnalytics } from '../services/studentsService'
import type { CourseAnalyticsResponse, CourseFilter } from '../types/student'

interface AnalyticsState {
  loadedKey: string | null
  data: CourseAnalyticsResponse | null
  error: string | null
}

export function useCourseAnalytics(course: CourseFilter) {
  const [reloadCount, setReloadCount] = useState(0)
  const requestKey = `${course}:${reloadCount}`

  const [state, setState] = useState<AnalyticsState>({
    loadedKey: null,
    data: null,
    error: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    fetchCourseAnalytics(course, controller.signal)
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
            : 'No se pudieron cargar las métricas del curso.'
        setState((prev) => ({
          loadedKey: requestKey,
          data: prev.data,
          error: message,
        }))
      })

    return () => {
      controller.abort()
    }
  }, [course, requestKey])

  const refetch = useCallback(() => {
    setReloadCount((count) => count + 1)
  }, [])

  return {
    analytics: state.data,
    isLoading: state.loadedKey !== requestKey,
    error: state.error,
    refetch,
  }
}
