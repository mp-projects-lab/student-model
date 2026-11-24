import { useCallback, useEffect, useState } from 'react'
import { fetchStudentDetail } from '../services/studentsService'
import type { StudentDetailResponse } from '../types/student'

const detailCache = new Map<string, StudentDetailResponse>()

interface StudentDetailState {
  loadedKey: string | null
  data: StudentDetailResponse | null
  error: string | null
}

export function useStudentDetail(studentId: string | null) {
  const [reloadCount, setReloadCount] = useState(0)
  const requestKey = studentId ? `${studentId}:${reloadCount}` : null

  const [state, setState] = useState<StudentDetailState>({
    loadedKey: null,
    data: null,
    error: null,
  })

  useEffect(() => {
    if (!studentId || !requestKey) return

    const cached = detailCache.get(studentId)
    if (cached && reloadCount === 0) {
      return
    }

    const controller = new AbortController()

    fetchStudentDetail(studentId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          detailCache.set(studentId, data)
          setState({ loadedKey: requestKey, data, error: null })
        }
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        const message =
          err instanceof Error
            ? err.message
            : 'No se pudo cargar el expediente del estudiante.'
        setState({
          loadedKey: requestKey,
          data: null,
          error: message,
        })
      })

    return () => {
      controller.abort()
    }
  }, [studentId, requestKey, reloadCount])

  const refetch = useCallback(() => {
    if (studentId) {
      detailCache.delete(studentId)
    }
    setReloadCount((count) => count + 1)
  }, [studentId])

  const cachedStudent = studentId ? detailCache.get(studentId) ?? null : null
  const activeStudent =
    cachedStudent ?? (state.loadedKey === requestKey ? state.data : null)
  const isLoading =
    Boolean(studentId) &&
    !cachedStudent &&
    state.loadedKey !== requestKey
  const error =
    Boolean(studentId) && !cachedStudent && state.loadedKey === requestKey
      ? state.error
      : null

  return {
    student: activeStudent,
    isLoading,
    error,
    refetch,
  }
}
