import {
  Activity,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  MessageSquare,
  RefreshCw,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useStudentDetail } from '../../hooks/useStudentDetail'
import type {
  RadarMetric,
  StatusFilter,
  StudentListItem,
} from '../../types/student'
import { formatDateTime, formatNumber } from '../../utils/formatters'
import {
  getCourseLabel,
  getEmotionLabel,
  getIntentLabel,
  getRadarDimensionLabel,
} from '../../utils/labels'
import { getStatusInfo } from '../../utils/status'
import { SpiderChart } from '../charts/SpiderChart'
import { TimelineChart } from '../charts/TimelineChart'
import { StatusBadge } from '../students/StatusBadge'

type ModalTab = 'resumen' | 'evolucion' | 'mensajes'

interface StudentDetailModalProps {
  studentId: string
  previewStudent: StudentListItem | null
  courseRadars: Record<string, RadarMetric[]>
  currentIndex: number
  totalInPage: number
  onNavigatePrev: () => void
  onNavigateNext: () => void
  onClose: () => void
}

export function StudentDetailModal({
  studentId,
  previewStudent,
  courseRadars,
  currentIndex,
  totalInPage,
  onNavigatePrev,
  onNavigateNext,
  onClose,
}: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = useState<ModalTab>('resumen')
  const [selectedPostIdx, setSelectedPostIdx] = useState(0)
  const [postStatusFilter, setPostStatusFilter] = useState<StatusFilter>('')

  const { student: detailedStudent, isLoading, error, refetch } =
    useStudentDetail(studentId)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const student = detailedStudent ?? previewStudent
  const timeline = detailedStudent?.timeline ?? []
  const safePostIdx =
    selectedPostIdx < timeline.length ? selectedPostIdx : 0
  const selectedPost = timeline[safePostIdx]

  const filteredPosts = timeline
    .map((post, index) => ({ ...post, originalIndex: index + 1 }))
    .filter(
      (post) =>
        !postStatusFilter ||
        getStatusInfo(post.distress_pct).key === postStatusFilter,
    )

  const courseAvgRadar = student
    ? (courseRadars[student.course_type] ?? courseRadars.ALL ?? [])
    : []

  const behavioral = student?.dimensions.behavioral
  const affective = student?.dimensions.affective
  const cognitive = student?.dimensions.cognitive
  const statusInfo = affective
    ? getStatusInfo(affective.avg_distress_pct)
    : null
  const courseLabel = student ? getCourseLabel(student.course_type) : ''
  const emotionLabel = affective
    ? getEmotionLabel(affective.primary_emotion)
    : ''
  const intentLabel = cognitive ? getIntentLabel(cognitive.primary_intent) : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-student-id"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="bg-surface border border-line rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Encabezado */}
        <div className="p-5 border-b border-line flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                Expediente Estudiantil
              </span>
              {affective && (
                <StatusBadge distressPct={affective.avg_distress_pct} />
              )}
              {courseLabel && (
                <span className="px-2.5 py-0.5 rounded-md border border-line text-xs font-medium text-ink">
                  {courseLabel}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-baseline gap-3">
              <h2
                id="modal-student-id"
                className="text-base font-bold font-mono-num text-ink break-all"
              >
                {studentId}
              </h2>
              {student && (
                <span className="text-xs text-muted">
                  Última actualización:{' '}
                  <span className="font-mono-num text-ink font-medium">
                    {formatDateTime(student.last_updated)}
                  </span>
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-xs font-medium text-ink hover:border-ink transition cursor-pointer shrink-0"
          >
            <span>Cerrar</span>
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Pestañas */}
        <div
          className="px-5 border-b border-line flex items-center gap-2 overflow-x-auto bg-surface"
          role="tablist"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'resumen'}
            onClick={() => setActiveTab('resumen')}
            className={`inline-flex items-center gap-1.5 py-3 px-3 text-xs border-b-2 cursor-pointer whitespace-nowrap transition ${
              activeTab === 'resumen'
                ? 'font-bold border-ink text-ink'
                : 'font-medium border-transparent text-muted hover:text-ink'
            }`}
          >
            <Layers size={14} strokeWidth={2} />
            <span>1. Spider Chart y 3 Dimensiones</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'evolucion'}
            onClick={() => setActiveTab('evolucion')}
            className={`inline-flex items-center gap-1.5 py-3 px-3 text-xs border-b-2 cursor-pointer whitespace-nowrap transition ${
              activeTab === 'evolucion'
                ? 'font-bold border-ink text-ink'
                : 'font-medium border-transparent text-muted hover:text-ink'
            }`}
          >
            <Activity size={14} strokeWidth={2} />
            <span>2. Gráfica de Evolución Temporal</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'mensajes'}
            onClick={() => setActiveTab('mensajes')}
            className={`inline-flex items-center gap-1.5 py-3 px-3 text-xs border-b-2 cursor-pointer whitespace-nowrap transition ${
              activeTab === 'mensajes'
                ? 'font-bold border-ink text-ink'
                : 'font-medium border-transparent text-muted hover:text-ink'
            }`}
          >
            <MessageSquare size={14} strokeWidth={2} />
            <span>
              3. Historial de Mensajes (
              <span className="font-mono-num">
                {detailedStudent
                  ? timeline.length
                  : (behavioral?.total_posts ?? 0)}
              </span>
              )
            </span>
          </button>
        </div>

        {/* Contenido */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {!student && isLoading && (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-muted">
              <Loader2 size={20} className="animate-spin text-ink" />
              <span>Cargando expediente del estudiante…</span>
            </div>
          )}

          {!student && error && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-xs">
              <div className="inline-flex items-center gap-2 text-risk font-medium">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={refetch}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink hover:border-ink transition cursor-pointer"
              >
                <RefreshCw size={13} />
                <span>Reintentar</span>
              </button>
            </div>
          )}

          {/* PESTAÑA 1: Spider Chart y 3 Dimensiones */}
          {student &&
            behavioral &&
            affective &&
            cognitive &&
            statusInfo &&
            activeTab === 'resumen' && (
              <div className="space-y-5">
                <div className="p-3.5 rounded-xl border border-line bg-surface text-xs leading-relaxed text-ink">
                  <strong>Síntesis del expediente:</strong> Estudiante del curso
                  de <strong>{courseLabel}</strong> en estado{' '}
                  <strong className={statusInfo.textClass}>
                    {statusInfo.label} ({statusInfo.sublabel})
                  </strong>{' '}
                  con malestar promedio de{' '}
                  <span className="font-mono-num font-semibold">
                    {affective.avg_distress_pct}%
                  </span>{' '}
                  y pico máximo de{' '}
                  <span className="font-mono-num font-semibold">
                    {affective.max_distress_pct}%
                  </span>
                  . Ha participado con{' '}
                  <span className="font-mono-num font-semibold">
                    {formatNumber(behavioral.total_posts)}
                  </span>{' '}
                  mensajes (
                  <span className="font-mono-num">
                    {formatNumber(behavioral.total_words)}
                  </span>{' '}
                  palabras totales en{' '}
                  <span className="font-mono-num">
                    {behavioral.unique_active_days}
                  </span>{' '}
                  días activos), mostrando principalmente{' '}
                  <strong>{emotionLabel.toLowerCase()}</strong> y un enfoque de{' '}
                  <strong>{intentLabel.toLowerCase()}</strong>.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                  <div className="md:col-span-5 border border-line rounded-xl p-4 flex flex-col items-center justify-between">
                    <div className="text-center">
                      <div className="text-xs font-bold text-ink">
                        Spider Chart: Alumno vs. Curso
                      </div>
                      <div className="flex items-center justify-center gap-3 text-[11px] text-muted mt-1">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2.5 h-0.5 bg-ink inline-block" />
                          Estudiante
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2.5 border-b border-dashed border-muted inline-block" />
                          Prom. curso
                        </span>
                      </div>
                    </div>

                    <SpiderChart
                      data={student.radar_chart_data}
                      comparisonData={
                        courseAvgRadar.length > 0 ? courseAvgRadar : undefined
                      }
                      variant="comparative"
                      className="my-1"
                    />

                    <div className="w-full grid grid-cols-2 gap-1.5 text-[11px] pt-2 border-t border-line">
                      {student.radar_chart_data.map((metric, index) => {
                        const avgScore = courseAvgRadar[index]?.score
                        return (
                          <div
                            key={metric.dimension}
                            className="flex items-center justify-between px-1.5 py-0.5 gap-1"
                          >
                            <span className="text-muted truncate">
                              {getRadarDimensionLabel(metric.dimension)}:
                            </span>
                            <span className="font-mono-num font-semibold text-ink shrink-0">
                              {metric.score.toFixed(1)}%
                              {avgScore !== undefined && (
                                <span className="text-[10px] font-normal text-muted">
                                  {' '}
                                  (vs {avgScore.toFixed(0)}%)
                                </span>
                              )}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="md:col-span-7 space-y-3 flex flex-col justify-between">
                    <div className="p-3.5 rounded-xl border border-line space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-ink">
                            Dimensión Afectiva
                          </h3>
                          <p className="text-[11px] text-muted">
                            Malestar emocional, estabilidad y emoción
                            predominante
                          </p>
                        </div>
                        <StatusBadge distressPct={affective.avg_distress_pct} />
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-line text-xs">
                        <div>
                          <div className="text-[11px] text-muted">
                            Malestar prom.
                          </div>
                          <div
                            className={`font-mono-num font-bold text-sm mt-0.5 ${statusInfo.textClass}`}
                          >
                            {affective.avg_distress_pct}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted">
                            Malestar máx.
                          </div>
                          <div className="font-mono-num font-semibold text-sm mt-0.5 text-ink">
                            {affective.max_distress_pct}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted">
                            Estabilidad
                          </div>
                          <div className="font-mono-num font-semibold text-sm mt-0.5 text-ink">
                            {affective.affective_stability_pct}%
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted">
                            Emoción primaria
                          </div>
                          <div className="font-semibold text-xs mt-1 text-ink">
                            {emotionLabel}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-line space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-ink">
                            Dimensión Conductual
                          </h3>
                          <p className="text-[11px] text-muted">
                            Nivel de participación, volumen de palabras y
                            constancia
                          </p>
                        </div>
                        <span className="font-mono-num text-xs font-bold px-2.5 py-0.5 rounded border border-line shrink-0">
                          Engagement: {behavioral.engagement_score_pct}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-line text-xs">
                        <div>
                          <div className="text-[11px] text-muted">
                            Publicaciones
                          </div>
                          <div className="font-mono-num font-semibold text-sm mt-0.5 text-ink">
                            {formatNumber(behavioral.total_posts)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted">
                            Palabras/msj
                          </div>
                          <div className="font-mono-num font-semibold text-sm mt-0.5 text-ink">
                            {behavioral.avg_word_count}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted">
                            Total palabras
                          </div>
                          <div className="font-mono-num font-semibold text-sm mt-0.5 text-ink">
                            {formatNumber(behavioral.total_words)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted">
                            Días activos/Span
                          </div>
                          <div className="font-mono-num font-semibold text-sm mt-0.5 text-ink">
                            {behavioral.unique_active_days}d /{' '}
                            {behavioral.active_span_days}d
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-line space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="text-xs font-bold text-ink">
                            Dimensión Cognitiva
                          </h3>
                          <p className="text-[11px] text-muted">
                            Profundidad cognitiva, enfoque principal y confianza
                          </p>
                        </div>
                        <span className="font-mono-num text-xs font-bold px-2.5 py-0.5 rounded border border-line shrink-0">
                          Mastery: {cognitive.cognitive_mastery_pct}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line text-xs">
                        <div>
                          <div className="text-[11px] text-muted">
                            Enfoque principal
                          </div>
                          <div className="font-semibold text-xs mt-0.5 text-ink">
                            {intentLabel}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] text-muted">
                            Confianza promedio
                          </div>
                          <div className="font-mono-num font-semibold text-sm mt-0.5 text-ink">
                            {cognitive.avg_intent_confidence_pct}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* PESTAÑA 2: Evolución Temporal */}
          {student && activeTab === 'evolucion' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-ink">
                    Evolución de malestar por mensaje
                  </h3>
                  <p className="text-xs text-muted">
                    Haz clic en cualquier punto para inspeccionar el texto y
                    métricas de esa publicación.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-risk" />
                    <span>Prioritario (≥30%)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-caution" />
                    <span>En observación (15–29%)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-safe" />
                    <span>Estable (&lt;15%)</span>
                  </span>
                </div>
              </div>

              {isLoading && !detailedStudent ? (
                <div className="border border-line rounded-xl p-10 flex items-center justify-center gap-2 text-xs text-muted">
                  <Loader2 size={16} className="animate-spin text-ink" />
                  <span>Cargando serie temporal…</span>
                </div>
              ) : error && !detailedStudent ? (
                <div className="border border-risk-border bg-risk-soft rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-risk">
                  <span>Error al cargar timeline: {error}</span>
                  <button
                    type="button"
                    onClick={refetch}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-risk-border bg-surface text-risk font-medium cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Reintentar</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="border border-line rounded-xl p-4">
                    <TimelineChart
                      timeline={timeline}
                      selectedIndex={safePostIdx}
                      onSelectIndex={setSelectedPostIdx}
                    />
                  </div>

                  {selectedPost && (
                    <div className="p-4 rounded-xl border border-ink bg-surface space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-ink">
                            Publicación #{safePostIdx + 1}
                          </span>
                          <span className="font-mono-num text-muted">
                            {formatDateTime(selectedPost.created_at)}
                          </span>
                          <span className="text-muted">
                            ·{' '}
                            <span className="font-mono-num">
                              {selectedPost.word_count}
                            </span>{' '}
                            palabras
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded border border-line text-ink">
                            Emoción:{' '}
                            <strong>
                              {getEmotionLabel(selectedPost.primary_emotion)}
                            </strong>
                          </span>
                          <span className="px-2 py-0.5 rounded border border-line text-ink">
                            {getIntentLabel(selectedPost.cognitive_intent)} (
                            <span className="font-mono-num">
                              {selectedPost.intent_score_pct}%
                            </span>
                            )
                          </span>
                          <StatusBadge distressPct={selectedPost.distress_pct} />
                        </div>
                      </div>
                      <p className="text-xs text-ink leading-relaxed pt-1">
                        “{selectedPost.text_preview}”
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* PESTAÑA 3: Historial de Mensajes */}
          {student && activeTab === 'mensajes' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted">
                  Publicaciones registradas en{' '}
                  <code className="font-mono-num text-ink">timeline</code> con
                  fecha, conteo de palabras, emoción, enfoque y vista previa.
                </p>
                <label className="flex items-center gap-2 text-xs">
                  <span className="text-muted">Filtrar por estado:</span>
                  <select
                    value={postStatusFilter}
                    onChange={(event) =>
                      setPostStatusFilter(event.target.value as StatusFilter)
                    }
                    className="px-2.5 py-1 rounded-md border border-line bg-surface text-xs text-ink focus:outline-none focus:border-ink cursor-pointer"
                  >
                    <option value="">Todos los mensajes</option>
                    <option value="risk">Prioritario (≥ 30%)</option>
                    <option value="caution">En observación (15% – 29%)</option>
                    <option value="safe">Estable (&lt; 15%)</option>
                  </select>
                </label>
              </div>

              {isLoading && !detailedStudent ? (
                <div className="border border-line rounded-xl p-10 flex items-center justify-center gap-2 text-xs text-muted">
                  <Loader2 size={16} className="animate-spin text-ink" />
                  <span>Cargando historial de mensajes…</span>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted border border-line rounded-xl">
                  No hay mensajes de este estudiante en este estado.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPosts.map((post) => {
                    const postStatus = getStatusInfo(post.distress_pct)
                    return (
                      <div
                        key={`${post.created_at}-${post.originalIndex}`}
                        className="p-4 rounded-xl border border-line bg-surface space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono-num font-bold text-ink">
                              Mensaje #{post.originalIndex}
                            </span>
                            <span className="font-mono-num text-muted">
                              {formatDateTime(post.created_at)}
                            </span>
                            <span className="text-muted">
                              ·{' '}
                              <span className="font-mono-num">
                                {post.word_count}
                              </span>{' '}
                              palabras
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2 py-0.5 rounded border border-line text-ink">
                              Emoción: {getEmotionLabel(post.primary_emotion)}
                            </span>
                            <span className="px-2 py-0.5 rounded border border-line text-ink">
                              {getIntentLabel(post.cognitive_intent)} (
                              <span className="font-mono-num">
                                {post.intent_score_pct}%
                              </span>
                              )
                            </span>
                            <StatusBadge distressPct={post.distress_pct} />
                            <span
                              className={`font-mono-num font-bold ${postStatus.textClass}`}
                            >
                              {post.distress_pct}%
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-ink leading-relaxed pt-1.5 border-t border-line">
                          “{post.text_preview}”
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pie del Modal: Navegación entre expedientes */}
        <div className="px-5 py-3 border-t border-line flex items-center justify-between bg-surface text-xs">
          <button
            type="button"
            disabled={currentIndex <= 0}
            onClick={onNavigatePrev}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink hover:border-ink transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={14} strokeWidth={2} />
            <span>Expediente anterior</span>
          </button>

          <span className="font-mono-num text-muted">
            {currentIndex >= 0
              ? `Expediente ${currentIndex + 1} de ${totalInPage}`
              : ''}
          </span>

          <button
            type="button"
            disabled={currentIndex < 0 || currentIndex >= totalInPage - 1}
            onClick={onNavigateNext}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-line text-ink hover:border-ink transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
          >
            <span>Siguiente expediente</span>
            <ChevronRight size={14} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  )
}
