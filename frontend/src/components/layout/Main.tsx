import { useState } from 'react'
import { useCourseAnalytics } from '../../hooks/useCourseAnalytics'
import { useDebounce } from '../../hooks/useDebounce'
import { useStudents } from '../../hooks/useStudents'
import type {
  CourseFilter,
  DistressStatus,
  StatusFilter,
} from '../../types/student'
import { CoursePills } from '../filters/CoursePills'
import { StudentsFilterBar } from '../filters/StudentsFilterBar'
import { CourseOverviewGrid } from '../kpi/CourseOverviewGrid'
import { StudentDetailModal } from '../modals/StudentDetailModal'
import { StudentsPagination } from '../students/StudentsPagination'
import { StudentsTable } from '../students/StudentsTable'

const PAGE_SIZE = 10

function Main() {
  const [course, setCourse] = useState<CourseFilter>('ALL')
  const [status, setStatus] = useState<StatusFilter>('')
  const [intent, setIntent] = useState('')
  const [minPosts, setMinPosts] = useState(1)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null)

  const debouncedSearch = useDebounce(search, 300)

  const {
    analytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics,
  } = useCourseAnalytics(course)

  const {
    students,
    totalMatching,
    totalPages,
    isLoading: isStudentsLoading,
    error: studentsError,
    refetch: refetchStudents,
  } = useStudents({
    course,
    status,
    intent,
    minPosts,
    search: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
    sortBy: 'avg_distress',
    sortOrder: 'desc',
  })

  const effectivePage = Math.min(page, totalPages)
  const availableIntents =
    analytics?.intents.map((item) => item.intent) ?? []

  const handleSelectCourse = (nextCourse: CourseFilter) => {
    setCourse(nextCourse)
    setPage(1)
  }

  const handleToggleStatus = (clickedStatus: DistressStatus) => {
    setStatus((current) => (current === clickedStatus ? '' : clickedStatus))
    setPage(1)
  }

  const handleToggleIntent = (clickedIntent: string) => {
    setIntent((current) => (current === clickedIntent ? '' : clickedIntent))
    setPage(1)
  }

  const handleStatusChange = (nextStatus: StatusFilter) => {
    setStatus(nextStatus)
    setPage(1)
  }

  const handleIntentChange = (nextIntent: string) => {
    setIntent(nextIntent)
    setPage(1)
  }

  const handleMinPostsChange = (nextMinPosts: number) => {
    setMinPosts(nextMinPosts)
    setPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleResetFilters = () => {
    setSearch('')
    setStatus('')
    setIntent('')
    setMinPosts(1)
    setPage(1)
  }

  const activeIndex = activeStudentId
    ? students.findIndex((item) => item.student_id === activeStudentId)
    : -1
  const previewStudent = activeIndex >= 0 ? students[activeIndex] : null

  return (
    <main className="max-w-[1180px] mx-auto px-6 py-7 space-y-6">
      {/* Sección 1: Datos generales del curso + Píldoras + 4 Tarjetas */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-ink leading-snug">
            Datos generales del curso
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Haz clic en cualquier tarjeta o fila para filtrar o ver el
            expediente del alumno
          </p>
        </div>

        <CoursePills
          selectedCourse={course}
          onSelectCourse={handleSelectCourse}
        />

        <CourseOverviewGrid
          analytics={analytics}
          isLoading={isAnalyticsLoading}
          error={analyticsError}
          activeStatus={status}
          activeIntent={intent}
          onToggleStatus={handleToggleStatus}
          onToggleIntent={handleToggleIntent}
          onRetry={refetchAnalytics}
        />
      </section>

      {/* Sección 2: Tabla principal de estudiantes */}
      <section className="border border-line rounded-2xl bg-surface overflow-hidden">
        <StudentsFilterBar
          search={search}
          status={status}
          intent={intent}
          minPosts={minPosts}
          availableIntents={availableIntents}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onIntentChange={handleIntentChange}
          onMinPostsChange={handleMinPostsChange}
          onResetFilters={handleResetFilters}
        />

        <StudentsTable
          students={students}
          courseRadars={analytics?.course_radars ?? {}}
          isLoading={isStudentsLoading}
          error={studentsError}
          onSelectStudent={setActiveStudentId}
          onRetry={refetchStudents}
        />

        <StudentsPagination
          page={effectivePage}
          totalPages={totalPages}
          totalMatching={totalMatching}
          onPageChange={setPage}
        />
      </section>

      {/* Modal de Expediente Estudiantil */}
      {activeStudentId && (
        <StudentDetailModal
          key={activeStudentId}
          studentId={activeStudentId}
          previewStudent={previewStudent}
          courseRadars={analytics?.course_radars ?? {}}
          currentIndex={activeIndex}
          totalInPage={students.length}
          onNavigatePrev={() => {
            if (activeIndex > 0) {
              setActiveStudentId(students[activeIndex - 1].student_id)
            }
          }}
          onNavigateNext={() => {
            if (activeIndex >= 0 && activeIndex < students.length - 1) {
              setActiveStudentId(students[activeIndex + 1].student_id)
            }
          }}
          onClose={() => setActiveStudentId(null)}
        />
      )}
    </main>
  )
}

export default Main
