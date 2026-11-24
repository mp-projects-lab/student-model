import {
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Info,
  Loader2,
  MessageSquare,
  RefreshCw,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useStudentDetail } from '../../hooks/useStudentDetail'
import type {
  RadarMetric,
  StatusFilter,
  StudentListItem,
} from '../../types/student'
import {
  formatDateTime,
  formatNumber,
  formatShortDate,
} from '../../utils/formatters'
import {
  getCourseLabel,
  getEmotionLabel,
  getIntentLabel,
  getRadarDimensionLabel,
} from '../../utils/labels'
import {
  getCognitiveLevelLabel,
  getConsistencyText,
  getHighlightedPost,
  getIntentTeacherDescription,
  getParticipationLevelLabel,
  getTeacherRecommendation,
  getTrendSummary,
  getWellbeingLabel,
} from '../../utils/pedagogical'
import { getStatusInfo } from '../../utils/status'
import { SpiderChart } from '../charts/SpiderChart'
import { TimelineChart } from '../charts/TimelineChart'
import { StatusBadge } from '../students/StatusBadge'
import { ForumPostCard } from './ForumPostCard'

type ModalTab = 'resumen' | 'mensajes'

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

function getCourseAvgByDimension(
  radar: RadarMetric[],
  dimension: string,
): number | undefined {
  return radar.find((metric) => metric.dimension === dimension)?.score
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
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const postCardRefs = useRef<Record<number, HTMLDivElement | null>>({})

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
  const hasMultiplePosts = timeline.length >= 2
  const safePostIdx = selectedPostIdx < timeline.length ? selectedPostIdx : 0

  const filteredPosts = timeline
    .map((post, index) => ({ ...post, originalIndex: index }))
    .filter(
      (post) =>
        !postStatusFilter ||
        getStatusInfo(post.distress_pct).key === postStatusFilter,
    )

  const handleSelectChartPoint = (index: number) => {
    setSelectedPostIdx(index)

    const clickedPost = timeline[index]
    if (
      clickedPost &&
      postStatusFilter &&
      getStatusInfo(clickedPost.distress_pct).key !== postStatusFilter
    ) {
      setPostStatusFilter('')
    }

    window.requestAnimationFrame(() => {
      postCardRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      })
    })
  }

  const courseAvgRadar = student
    ? (courseRadars[student.course_type] ?? courseRadars.ALL ?? [])
    : []

  const behavioral = student?.dimensions.behavioral
  const affective = student?.dimensions.affective
  const cognitive = student?.dimensions.cognitive
  const statusInfo = affective
    ? getStatusInfo(affective.avg_distress_pct)
    : null
  const recommendation =
    statusInfo && behavioral
      ? getTeacherRecommendation(statusInfo.key, behavioral.total_posts)
      : null

  const courseLabel = student ? getCourseLabel(student.course_type) : ''
  const emotionLabel = affective
    ? getEmotionLabel(affective.primary_emotion)
    : ''
  const highlightedPost = getHighlightedPost(timeline)
  const trendSummary = getTrendSummary(timeline)

  const avgStability = getCourseAvgByDimension(
    courseAvgRadar,
    'Affective Stability',
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
                Expediente del estudiante
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
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2
                id="modal-student-id"
                className="text-sm font-bold font-mono-num text-ink break-all"
              >
                ID: {studentId}
              </h2>
              {student && (
                <span
                  className="text-xs text-muted"
                  title={formatDateTime(student.last_updated)}
                >
                  Última actividad:{' '}
                  <span className="font-mono-num text-ink font-medium">
                    {formatShortDate(student.last_updated)}
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

        {/* 2 Pestañas claras orientadas al docente */}
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
            <ClipboardList size={14} strokeWidth={2} />
            <span>Resumen del estudiante</span>
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
              Mensajes y evolución (
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

          {/* ============================================================= */}
          {/* PESTAÑA 1: RESUMEN DEL ESTUDIANTE                             */}
          {/* ============================================================= */}
          {student &&
            behavioral &&
            affective &&
            cognitive &&
            statusInfo &&
            recommendation &&
            activeTab === 'resumen' && (
              <div className="space-y-5">
                {/* 1. Tarjeta de diagnóstico y acción sugerida */}
                <div
                  className={`p-4 rounded-xl border space-y-1.5 ${recommendation.containerClass}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3
                      className={`text-sm font-bold ${recommendation.accentTextClass}`}
                    >
                      {recommendation.title}
                    </h3>
                    <span className="font-mono-num text-xs font-semibold text-ink">
                      Malestar promedio: {affective.avg_distress_pct.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-ink leading-relaxed">
                    {recommendation.description}
                  </p>
                  <p className="text-xs text-ink leading-relaxed pt-1">
                    <strong>Sugerencia:</strong> {recommendation.suggestion}
                  </p>
                </div>

                {/* 2. Tres indicadores claros con barras simples */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  <div className="p-4 rounded-xl border border-line bg-surface flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-ink">
                          Bienestar emocional
                        </span>
                        <span
                          className={`text-xs font-semibold ${statusInfo.textClass}`}
                        >
                          {getWellbeingLabel(affective.affective_stability_pct)}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between font-mono-num text-[11px] text-muted">
                        <span className="text-ink font-semibold text-sm">
                          {affective.affective_stability_pct.toFixed(0)}%
                        </span>
                        {avgStability !== undefined && (
                          <span>Prom. curso: {avgStability.toFixed(0)}%</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${statusInfo.dotClass}`}
                          style={{
                            width: `${Math.min(100, Math.max(0, affective.affective_stability_pct))}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-muted leading-snug">
                        Emoción más frecuente:{' '}
                        <strong className="text-ink">{emotionLabel}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-line bg-surface flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-ink">
                          Participación en el foro
                        </span>
                        <span className="text-xs font-semibold text-ink">
                          {getParticipationLevelLabel(
                            behavioral.engagement_score_pct,
                          )}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between font-mono-num text-[11px] text-muted">
                        <span className="text-ink font-semibold text-sm">
                          {behavioral.engagement_score_pct.toFixed(0)}%
                        </span>
                        {avgEngagement !== undefined && (
                          <span>Prom. curso: {avgEngagement.toFixed(0)}%</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                        <div
                          className="h-full bg-ink rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(0, behavioral.engagement_score_pct))}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-muted leading-snug">
                        {getConsistencyText(
                          behavioral.total_posts,
                          behavioral.unique_active_days,
                          behavioral.active_span_days,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-line bg-surface flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-ink">
                          Profundidad de aportes
                        </span>
                        <span className="text-xs font-semibold text-ink">
                          {getCognitiveLevelLabel(
                            cognitive.cognitive_mastery_pct,
                          )}
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between font-mono-num text-[11px] text-muted">
                        <span className="text-ink font-semibold text-sm">
                          {cognitive.cognitive_mastery_pct.toFixed(0)}%
                        </span>
                        {avgCognitive !== undefined && (
                          <span>Prom. curso: {avgCognitive.toFixed(0)}%</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="w-full h-2 rounded-full bg-line overflow-hidden">
                        <div
                          className="h-full bg-ink rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, Math.max(0, cognitive.cognitive_mastery_pct))}%`,
                          }}
                        />
                      </div>
                      <p className="text-[11px] text-muted leading-snug">
                        {getIntentTeacherDescription(cognitive.primary_intent)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Mensaje destacado visible desde la primera pantalla */}
                <div className="p-4 rounded-xl border border-line bg-surface space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-ink">
                        {highlightedPost
                          ? highlightedPost.reasonLabel
                          : 'Publicación destacada del estudiante'}
                      </h3>
                      <p className="text-[11px] text-muted">
                        Contexto real de lo que escribió el estudiante en el
                        foro
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (highlightedPost) {
                          setSelectedPostIdx(highlightedPost.index)
                        }
                        setActiveTab('mensajes')
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-ink hover:underline cursor-pointer"
                    >
                      <span>
                        {timeline.length > 1
                          ? `Ver todos (${timeline.length})`
                          : 'Ver detalle del mensaje'}
                      </span>
                      <ArrowRight size={13} strokeWidth={2} />
                    </button>
                  </div>

                  {isLoading && !detailedStudent ? (
                    <div className="py-4 flex items-center gap-2 text-xs text-muted">
                      <Loader2 size={14} className="animate-spin text-ink" />
                      <span>Cargando mensaje del estudiante…</span>
                    </div>
                  ) : error && !detailedStudent ? (
                    <div className="py-2 flex items-center justify-between gap-2 text-xs text-risk">
                      <span>No se pudo cargar el mensaje: {error}</span>
                      <button
                        type="button"
                        onClick={refetch}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-risk-border text-risk cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        <span>Reintentar</span>
                      </button>
                    </div>
                  ) : highlightedPost ? (
                    <ForumPostCard
                      post={highlightedPost.post}
                      variant="embedded"
                    />
                  ) : null}
                </div>

                {/* 4. Acordeón opcional: Gráfica comparativa y detalle técnico */}
                <div className="border border-line rounded-xl overflow-hidden">
                  <button
                    type="button"
                    aria-expanded={showTechnicalDetails}
                    onClick={() =>
                      setShowTechnicalDetails((current) => !current)
                    }
                    className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-ink hover:bg-row-hover transition cursor-pointer"
                  >
                    <span>
                      Ver gráfica comparativa y detalle técnico del modelo
                    </span>
                    {showTechnicalDetails ? (
                      <ChevronUp size={15} className="text-muted" />
                    ) : (
                      <ChevronDown size={15} className="text-muted" />
                    )}
                  </button>

                  {showTechnicalDetails && (
                    <div className="p-4 border-t border-line grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
                      <div className="md:col-span-5 border border-line rounded-xl p-4 flex flex-col items-center justify-between">
                        <div className="text-center">
                          <div className="text-xs font-bold text-ink">
                            Comparativa: Alumno vs. Curso
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
                            courseAvgRadar.length > 0
                              ? courseAvgRadar
                              : undefined
                          }
                          variant="comparative"
                          className="my-1"
                        />

                        <div className="w-full grid grid-cols-2 gap-2 pt-3 border-t border-line">
                          {student.radar_chart_data.map((metric, index) => {
                            const avgScore = courseAvgRadar[index]?.score
                            return (
                              <div
                                key={metric.dimension}
                                className="rounded-lg border border-line/70 px-2.5 py-1.5 flex flex-col gap-0.5"
                              >
                                <span className="text-[11px] text-muted leading-tight">
                                  {getRadarDimensionLabel(metric.dimension)}
                                </span>
                                <div className="flex items-baseline gap-1.5 font-mono-num whitespace-nowrap">
                                  <span className="text-xs font-semibold text-ink">
                                    {metric.score.toFixed(1)}%
                                  </span>
                                  {avgScore !== undefined && (
                                    <span className="text-[10px] text-muted">
                                      vs {avgScore.toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      <div className="md:col-span-7 grid grid-cols-2 gap-3 content-start text-xs">
                        <div className="p-3 rounded-xl border border-line">
                          <div className="text-[11px] text-muted">
                            Malestar máximo registrado
                          </div>
                          <div className="font-mono-num font-semibold text-sm text-ink mt-1">
                            {affective.max_distress_pct}%
                          </div>
                        </div>
                        <div className="p-3 rounded-xl border border-line">
                          <div className="text-[11px] text-muted">
                            Total de palabras escritas
                          </div>
                          <div className="font-mono-num font-semibold text-sm text-ink mt-1">
                            {formatNumber(behavioral.total_words)}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl border border-line">
                          <div className="text-[11px] text-muted">
                            Promedio de palabras por mensaje
                          </div>
                          <div className="font-mono-num font-semibold text-sm text-ink mt-1">
                            {behavioral.avg_word_count}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl border border-line">
                          <div className="text-[11px] text-muted">
                            Días activos / Periodo total
                          </div>
                          <div className="font-mono-num font-semibold text-sm text-ink mt-1">
                            {behavioral.unique_active_days}d /{' '}
                            {behavioral.active_span_days}d
                          </div>
                        </div>
                        <div className="p-3 rounded-xl border border-line">
                          <div className="text-[11px] text-muted">
                            Categoría cognitiva (CoI)
                          </div>
                          <div className="font-semibold text-xs text-ink mt-1">
                            {getIntentLabel(cognitive.primary_intent)}
                          </div>
                        </div>
                        <div className="p-3 rounded-xl border border-line">
                          <div className="text-[11px] text-muted">
                            Confianza del modelo cognitivo
                          </div>
                          <div className="font-mono-num font-semibold text-sm text-ink mt-1">
                            {cognitive.avg_intent_confidence_pct}%
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* ============================================================= */}
          {/* PESTAÑA 2: MENSAJES Y EVOLUCIÓN (SIN DUPLICACIÓN)             */}
          {/* ============================================================= */}
          {student && activeTab === 'mensajes' && (
            <div className="space-y-5">
              {isLoading && !detailedStudent ? (
                <div className="border border-line rounded-xl p-10 flex items-center justify-center gap-2 text-xs text-muted">
                  <Loader2 size={16} className="animate-spin text-ink" />
                  <span>Cargando mensajes y evolución…</span>
                </div>
              ) : error && !detailedStudent ? (
                <div className="border border-risk-border bg-risk-soft rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-risk">
                  <span>Error al cargar los mensajes: {error}</span>
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
                  {/* Gráfica de evolución SOLO cuando hay 2+ mensajes */}
                  {hasMultiplePosts ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-ink">
                              Evolución emocional a lo largo del curso
                            </h3>
                            {trendSummary && (
                              <span
                                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${trendSummary.badgeClass}`}
                              >
                                {trendSummary.label}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-0.5">
                            {trendSummary
                              ? `${trendSummary.detail} Haz clic en un punto para resaltarlo en la lista.`
                              : 'Haz clic en un punto para resaltarlo en la lista.'}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-risk" />
                            <span>Prioritario (≥30%)</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-caution" />
                            <span>Atención (15–29%)</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-safe" />
                            <span>Estable (&lt;15%)</span>
                          </span>
                        </div>
                      </div>

                      <div className="border border-line rounded-xl p-4">
                        <TimelineChart
                          timeline={timeline}
                          selectedIndex={safePostIdx}
                          onSelectIndex={handleSelectChartPoint}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl border border-line bg-row-hover flex items-start gap-2.5 text-xs text-muted">
                      <Info size={15} className="text-ink shrink-0 mt-0.5" />
                      <span>
                        Este estudiante cuenta con{' '}
                        <strong className="text-ink">
                          1 sola participación registrada
                        </strong>
                        . La gráfica de evolución aparecerá automáticamente
                        cuando tenga 2 o más mensajes en el foro.
                      </span>
                    </div>
                  )}

                  {/* Lista única de mensajes sincronizada con la gráfica */}
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
                        Publicaciones del estudiante en el foro (
                        <span className="font-mono-num">{timeline.length}</span>)
                      </h3>

                      {hasMultiplePosts && (
                        <label className="flex items-center gap-2 text-xs">
                          <span className="text-muted">Filtrar por estado:</span>
                          <select
                            value={postStatusFilter}
                            onChange={(event) =>
                              setPostStatusFilter(
                                event.target.value as StatusFilter,
                              )
                            }
                            className="px-2.5 py-1 rounded-md border border-line bg-surface text-xs text-ink focus:outline-none focus:border-ink cursor-pointer"
                          >
                            <option value="">Todos los mensajes</option>
                            <option value="risk">Prioritario (≥ 30%)</option>
                            <option value="caution">Atención (15% – 29%)</option>
                            <option value="safe">Estable (&lt; 15%)</option>
                          </select>
                        </label>
                      )}
                    </div>

                    {filteredPosts.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted border border-line rounded-xl">
                        No hay mensajes de este estudiante en este estado.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredPosts.map((post) => (
                          <ForumPostCard
                            key={`${post.created_at}-${post.originalIndex}`}
                            post={post}
                            messageNumber={post.originalIndex + 1}
                            interactive={hasMultiplePosts}
                            isSelected={
                              hasMultiplePosts &&
                              post.originalIndex === safePostIdx
                            }
                            onClick={() => {
                              if (hasMultiplePosts) {
                                setSelectedPostIdx(post.originalIndex)
                              }
                            }}
                            cardRef={(node) => {
                              postCardRefs.current[post.originalIndex] = node
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Pie del Modal */}
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
