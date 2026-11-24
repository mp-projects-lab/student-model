import type { DistressStatus, TimelineEntry } from '../types/student'
import { formatNumber } from './formatters'
import { getIntentLabel } from './labels'

export interface TeacherRecommendation {
  title: string
  description: string
  suggestion: string
  containerClass: string
  accentTextClass: string
}

export interface TrendSummary {
  key: 'improving' | 'steady' | 'worsening'
  label: string
  detail: string
  badgeClass: string
}

export interface HighlightedPost {
  post: TimelineEntry
  index: number
  isOnlyPost: boolean
  reasonLabel: string
}

const POSITIVE_OR_NEUTRAL_EMOTIONS = new Set([
  'neutral',
  'gratitude',
  'approval',
  'admiration',
  'optimism',
  'joy',
  'love',
  'caring',
  'curiosity',
  'amusement',
  'excitement',
  'pride',
  'relief',
  'realization',
])

export function getTeacherRecommendation(
  status: DistressStatus,
  totalPosts: number,
): TeacherRecommendation {
  if (status === 'risk') {
    return {
      title: 'Requiere acompañamiento prioritario',
      description:
        totalPosts === 1
          ? 'Su participación en el foro refleja un nivel alto de confusión o malestar.'
          : 'Sus participaciones reflejan señales frecuentes de confusión o frustración.',
      suggestion:
        'Revisar su mensaje con mayor malestar y ofrecerle orientación directa o material de apoyo.',
      containerClass: 'border-risk-border bg-risk-soft',
      accentTextClass: 'text-risk',
    }
  }

  if (status === 'caution') {
    return {
      title: 'Seguimiento preventivo recomendado',
      description:
        totalPosts === 1
          ? 'Su mensaje muestra dudas o un nivel moderado de preocupación.'
          : 'Presenta dudas puntuales con señales moderadas de malestar en el foro.',
      suggestion:
        'Dar seguimiento cercano en sus próximas participaciones para resolver dudas a tiempo.',
      containerClass: 'border-caution-border bg-caution-soft',
      accentTextClass: 'text-caution',
    }
  }

  return {
    title: 'Evolución estable sin alertas',
    description:
      'Participa con normalidad y mantiene un tono emocional tranquilo en el foro.',
    suggestion:
      'No requiere intervención inmediata; continuar con el acompañamiento habitual.',
    containerClass: 'border-safe-border bg-safe-soft',
    accentTextClass: 'text-safe',
  }
}

export function getWellbeingLabel(stabilityPct: number): string {
  if (stabilityPct > 85) return 'Bueno'
  if (stabilityPct >= 70) return 'Moderado'
  return 'Bajo'
}

export function getParticipationLevelLabel(engagementPct: number): string {
  if (engagementPct >= 70) return 'Alta'
  if (engagementPct >= 40) return 'Media'
  return 'Baja'
}

export function getCognitiveLevelLabel(masteryPct: number): string {
  if (masteryPct >= 75) return 'Avanzado'
  if (masteryPct >= 55) return 'Intermedio'
  return 'Inicial'
}

export function getIntentTeacherDescription(intent: string): string {
  switch (intent) {
    case 'Triggering (Questioning)':
    case 'Seeking Clarification':
      return 'Principalmente hace preguntas y plantea dudas'
    case 'Exploration (Discussion)':
    case 'Conceptual Discussion':
      return 'Comparte reflexiones y debate ideas del tema'
    case 'Integration (Synthesis)':
      return 'Conecta conceptos, propone soluciones y explica'
    case 'Course Logistics & Social':
    case 'Course Logistics':
    case 'Peer Support':
      return 'Consulta aspectos prácticos del curso o interactúa socialmente'
    default:
      return getIntentLabel(intent)
  }
}

export function getIntentShortAction(intent: string): string {
  switch (intent) {
    case 'Triggering (Questioning)':
    case 'Seeking Clarification':
      return 'Haciendo preguntas'
    case 'Exploration (Discussion)':
    case 'Conceptual Discussion':
      return 'Debatiendo ideas'
    case 'Integration (Synthesis)':
      return 'Explicando o sintetizando'
    case 'Course Logistics & Social':
    case 'Course Logistics':
      return 'Logística o saludo'
    case 'Peer Support':
      return 'Apoyando a compañeros'
    default:
      return getIntentLabel(intent)
  }
}

export function getConsistencyText(
  totalPosts: number,
  uniqueDays: number,
  spanDays: number,
): string {
  if (totalPosts === 1) {
    return '1 participación registrada'
  }
  if (uniqueDays <= 1) {
    return `${formatNumber(totalPosts)} mensajes en 1 solo día`
  }
  if (spanDays <= 1) {
    return `${formatNumber(totalPosts)} mensajes en ${uniqueDays} días activos`
  }
  return `${formatNumber(totalPosts)} mensajes en ${uniqueDays} días activos (en ${spanDays} días)`
}

export function getTrendSummary(timeline: TimelineEntry[]): TrendSummary | null {
  if (timeline.length < 2) return null

  const midpoint = Math.floor(timeline.length / 2)
  const firstHalf = timeline.slice(0, midpoint)
  const secondHalf = timeline.slice(midpoint)

  const avg = (items: TimelineEntry[]) =>
    items.reduce((sum, item) => sum + item.distress_pct, 0) / items.length

  const delta = avg(secondHalf) - avg(firstHalf)

  if (delta <= -8) {
    return {
      key: 'improving',
      label: 'Tendencia favorable',
      detail: 'El nivel de malestar ha disminuido en sus mensajes recientes.',
      badgeClass: 'bg-safe-soft text-safe border border-safe-border',
    }
  }

  if (delta >= 8) {
    return {
      key: 'worsening',
      label: 'Malestar en aumento',
      detail: 'El nivel de malestar ha subido en sus mensajes más recientes.',
      badgeClass: 'bg-risk-soft text-risk border border-risk-border',
    }
  }

  return {
    key: 'steady',
    label: 'Sin cambios bruscos',
    detail: 'Su nivel emocional se ha mantenido constante a lo largo del curso.',
    badgeClass: 'bg-surface text-ink border border-line',
  }
}

export function getHighlightedPost(
  timeline: TimelineEntry[],
): HighlightedPost | null {
  if (timeline.length === 0) return null

  if (timeline.length === 1) {
    return {
      post: timeline[0],
      index: 0,
      isOnlyPost: true,
      reasonLabel: 'Única publicación registrada en el foro',
    }
  }

  let highestIndex = 0
  for (let i = 1; i < timeline.length; i += 1) {
    if (timeline[i].distress_pct >= timeline[highestIndex].distress_pct) {
      highestIndex = i
    }
  }

  const highestPost = timeline[highestIndex]
  if (highestPost.distress_pct >= 15) {
    return {
      post: highestPost,
      index: highestIndex,
      isOnlyPost: false,
      reasonLabel: `Mensaje con mayor señal de malestar (#${highestIndex + 1})`,
    }
  }

  const latestIndex = timeline.length - 1
  return {
    post: timeline[latestIndex],
    index: latestIndex,
    isOnlyPost: false,
    reasonLabel: `Publicación más reciente (#${latestIndex + 1})`,
  }
}

export function shouldExplainMixedEmotion(
  primaryEmotion: string,
  distressPct: number,
): boolean {
  return (
    distressPct >= 15 &&
    POSITIVE_OR_NEUTRAL_EMOTIONS.has(primaryEmotion.toLowerCase())
  )
}
