import { AlertCircle, FileText, RefreshCw } from 'lucide-react'
import type { RadarMetric, StudentListItem } from '../../types/student'
import {
  getCourseLabel,
  getEmotionLabel,
  getIntentLabel,
} from '../../utils/labels'
import { getStatusInfo } from '../../utils/status'
import { StatusBadge } from './StatusBadge'

interface StudentsTableProps {
  students: StudentListItem[]
  courseRadars: Record<string, RadarMetric[]>
  isLoading: boolean
  error: string | null
  onSelectStudent: (studentId: string) => void
  onRetry: () => void
}

function getCourseAvgByDimension(
  radar: RadarMetric[],
  dimension: string,
): number | undefined {
  return radar.find((metric) => metric.dimension === dimension)?.score
}

export function StudentsTable({
  students,
  courseRadars,
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
            <th className="py-3.5 px-4 font-medium whitespace-nowrap">
              ID Estudiante
            </th>
            <th className="py-3.5 px-3 font-medium whitespace-nowrap">Curso</th>
            <th className="py-3.5 px-3 font-medium whitespace-nowrap">
              Prioridad
            </th>
            <th
              className="py-3.5 px-3 font-medium whitespace-nowrap"
              title="Porcentaje del alumno / promedio de su grupo"
            >
              Malestar
            </th>
            <th className="py-3.5 px-3 font-medium whitespace-nowrap">
              Emoción
            </th>
            <th
              className="py-3.5 px-3 font-medium whitespace-nowrap"
              title="Porcentaje del alumno / promedio de su grupo"
            >
              Participación
            </th>
            <th
              className="py-3.5 px-3 font-medium whitespace-nowrap"
              title="Porcentaje del alumno / promedio de su grupo"
            >
              Enfoque
            </th>
            <th className="py-3.5 px-4 font-medium text-right whitespace-nowrap">
              Detalle
            </th>
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
                {Array.from({ length: 8 }).map((__, colIndex) => (
                  <td key={colIndex} className="py-4 px-4">
                    <div className="h-3.5 rounded bg-line/80 w-20" />
                  </td>
                ))}
              </tr>
            ))}

          {!showSkeleton && error && students.length === 0 && (
            <tr>
              <td colSpan={8} className="py-16 px-5 text-center">
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
              <td colSpan={8} className="py-16 text-center text-xs text-muted">
                No se encontraron estudiantes con los filtros seleccionados.
              </td>
            </tr>
          )}

          {!showSkeleton &&
            students.map((student) => {
              const { behavioral, affective, cognitive } = student.dimensions
              const statusInfo = getStatusInfo(affective.avg_distress_pct)
              const courseAvgRadar =
                courseRadars[student.course_type] ?? courseRadars.ALL ?? []

              const avgDistress = getCourseAvgByDimension(
                courseAvgRadar,
                'Distress Risk',
              )
              const avgEngagement = getCourseAvgByDimension(
                courseAvgRadar,
                'Behavioral Engagement',
              )
              const avgCognitive = getCourseAvgByDimension(
                courseAvgRadar,
                'Cognitive Depth',
              )

              return (
                <tr
                  key={student.student_id}
                  onClick={() => onSelectStudent(student.student_id)}
                  className="hover:bg-row-hover transition cursor-pointer"
                >
                  <td
                    className="py-4 px-4 font-mono-num text-[11px] font-semibold text-ink whitespace-nowrap"
                    title={student.student_id}
                  >
                    {student.student_id}
                  </td>
                  <td className="py-4 px-3 text-ink whitespace-nowrap">
                    {getCourseLabel(student.course_type)}
                  </td>
                  <td className="py-4 px-3 whitespace-nowrap">
                    <StatusBadge distressPct={affective.avg_distress_pct} />
                  </td>
                  <td
                    className="py-4 px-3 font-mono-num whitespace-nowrap"
                    title={
                      avgDistress !== undefined
                        ? `Alumno: ${affective.avg_distress_pct.toFixed(1)}% · Promedio del grupo: ${avgDistress.toFixed(0)}%`
                        : `Malestar del alumno: ${affective.avg_distress_pct.toFixed(1)}%`
                    }
                  >
                    <span className={`font-bold ${statusInfo.textClass}`}>
                      {affective.avg_distress_pct.toFixed(1)}%
                    </span>
                    {avgDistress !== undefined && (
                      <span className="text-muted">
                        {' '}
                        / {avgDistress.toFixed(0)}%
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 text-ink whitespace-nowrap">
                    {getEmotionLabel(affective.primary_emotion)}
                  </td>
                  <td
                    className="py-4 px-3 font-mono-num whitespace-nowrap"
                    title={
                      avgEngagement !== undefined
                        ? `Alumno: ${behavioral.engagement_score_pct.toFixed(1)}% (${behavioral.total_posts} mensajes · ${behavioral.unique_active_days} días) · Promedio del grupo: ${avgEngagement.toFixed(0)}%`
                        : `${behavioral.total_posts} mensajes · ${behavioral.unique_active_days} días activos`
                    }
                  >
                    <span className="font-semibold text-ink">
                      {behavioral.engagement_score_pct.toFixed(1)}%
                    </span>
                    {avgEngagement !== undefined && (
                      <span className="text-muted">
                        {' '}
                        / {avgEngagement.toFixed(0)}%
                      </span>
                    )}
                  </td>
                  <td
                    className="py-4 px-3 font-mono-num whitespace-nowrap"
                    title={
                      avgCognitive !== undefined
                        ? `Alumno: ${cognitive.cognitive_mastery_pct.toFixed(1)}% (${getIntentLabel(cognitive.primary_intent)}) · Promedio del grupo: ${avgCognitive.toFixed(0)}%`
                        : getIntentLabel(cognitive.primary_intent)
                    }
                  >
                    <span className="font-semibold text-ink">
                      {cognitive.cognitive_mastery_pct.toFixed(1)}%
                    </span>
                    {avgCognitive !== undefined && (
                      <span className="text-muted">
                        {' '}
                        / {avgCognitive.toFixed(0)}%
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        onSelectStudent(student.student_id)
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-semibold text-ink hover:border-ink transition cursor-pointer"
                    >
                      <FileText
                        size={14}
                        strokeWidth={2}
                        className="text-muted"
                      />
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
