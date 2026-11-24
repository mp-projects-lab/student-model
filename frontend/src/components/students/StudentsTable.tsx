import { AlertCircle, FileText, RefreshCw } from 'lucide-react'
import type { StudentListItem } from '../../types/student'
import { formatShortDate, truncateStudentId } from '../../utils/formatters'
import {
  getCourseLabel,
  getEmotionLabel,
  getIntentLabel,
} from '../../utils/labels'
import { getStatusInfo } from '../../utils/status'
import { StatusBadge } from './StatusBadge'

interface StudentsTableProps {
  students: StudentListItem[]
  isLoading: boolean
  error: string | null
  onSelectStudent: (studentId: string) => void
  onRetry: () => void
}

export function StudentsTable({
  students,
  isLoading,
  error,
  onSelectStudent,
  onRetry,
}: StudentsTableProps) {
  const showSkeleton = isLoading && students.length === 0

  return (
    <div className="overflow-x-auto min-h-[360px]">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-line text-[11px] uppercase tracking-wider text-muted">
            <th className="py-3.5 px-5 font-medium">ID Estudiante</th>
            <th className="py-3.5 px-4 font-medium">Curso</th>
            <th className="py-3.5 px-4 font-medium">Estado del alumno</th>
            <th className="py-3.5 px-4 font-medium">Malestar (Prom / Máx)</th>
            <th className="py-3.5 px-4 font-medium">Emoción</th>
            <th className="py-3.5 px-4 font-medium">
              Participación (Conductual)
            </th>
            <th className="py-3.5 px-4 font-medium">Enfoque (Cognitiva)</th>
            <th className="py-3.5 px-4 font-medium">Última actividad</th>
            <th className="py-3.5 px-5 font-medium text-right">Detalle</th>
          </tr>
        </thead>

        <tbody
          className={`divide-y divide-line text-xs transition-opacity duration-200 ${
            isLoading && students.length > 0 ? 'opacity-55' : 'opacity-100'
          }`}
        >
          {showSkeleton &&
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={index} className="animate-pulse">
                {Array.from({ length: 9 }).map((__, colIndex) => (
                  <td key={colIndex} className="py-4 px-4">
                    <div className="h-3.5 rounded bg-line/80 w-20" />
                  </td>
                ))}
              </tr>
            ))}

          {!showSkeleton && error && students.length === 0 && (
            <tr>
              <td colSpan={9} className="py-16 px-5 text-center">
                <div className="inline-flex flex-col items-center gap-3 text-xs">
                  <div className="inline-flex items-center gap-2 text-risk font-medium">
                    <AlertCircle size={16} />
                    <span>Error al cargar estudiantes: {error}</span>
                  </div>
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-ink font-medium hover:border-ink transition cursor-pointer"
                  >
                    <RefreshCw size={13} />
                    <span>Reintentar</span>
                  </button>
                </div>
              </td>
            </tr>
          )}

          {!showSkeleton && !error && students.length === 0 && (
            <tr>
              <td colSpan={9} className="py-16 text-center text-xs text-muted">
                No se encontraron estudiantes con los filtros seleccionados.
              </td>
            </tr>
          )}

          {!showSkeleton &&
            students.map((student) => {
              const { behavioral, affective, cognitive } = student.dimensions
              const statusInfo = getStatusInfo(affective.avg_distress_pct)

              return (
                <tr
                  key={student.student_id}
                  onClick={() => onSelectStudent(student.student_id)}
                  className="hover:bg-row-hover transition cursor-pointer"
                >
                  <td
                    className="py-4 px-5 font-mono-num font-semibold text-ink"
                    title={student.student_id}
                  >
                    {truncateStudentId(student.student_id)}
                  </td>
                  <td className="py-4 px-4 text-ink">
                    {getCourseLabel(student.course_type)}
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge distressPct={affective.avg_distress_pct} />
                  </td>
                  <td className="py-4 px-4 font-mono-num">
                    <span className={`font-bold ${statusInfo.textClass}`}>
                      {affective.avg_distress_pct.toFixed(1)}%
                    </span>
                    <span className="text-muted">
                      {' '}
                      / {affective.max_distress_pct.toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-ink">
                    {getEmotionLabel(affective.primary_emotion)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-mono-num font-semibold text-ink">
                      {behavioral.engagement_score_pct.toFixed(1)}%
                    </div>
                    <div className="text-[11px] text-muted font-mono-num">
                      {behavioral.total_posts} msjs ·{' '}
                      {behavioral.unique_active_days}d activos
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-mono-num font-semibold text-ink">
                      {cognitive.cognitive_mastery_pct.toFixed(1)}%
                    </div>
                    <div
                      className="text-[11px] text-muted truncate max-w-[160px]"
                      title={getIntentLabel(cognitive.primary_intent)}
                    >
                      {getIntentLabel(cognitive.primary_intent)}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono-num text-muted whitespace-nowrap">
                    {formatShortDate(student.last_updated)}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onSelectStudent(student.student_id)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-semibold text-ink hover:border-ink transition cursor-pointer"
                    >
                      <FileText size={14} strokeWidth={2} className="text-muted" />
                      <span>Expediente</span>
                    </button>
                  </td>
                </tr>
              )
            })}
        </tbody>
      </table>
    </div>
  )
}
