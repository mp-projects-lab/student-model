import type { CourseType } from '../types/student'

export const COURSE_LABELS: Record<CourseType, string> = {
  Education: 'Educación',
  Medicine: 'Medicina',
  Humanities: 'Humanidades',
}

export const EMOTION_LABELS: Record<string, string> = {
  neutral: 'Neutral',
  confusion: 'Confusión',
  approval: 'Aprobación',
  gratitude: 'Gratitud',
  curiosity: 'Curiosidad',
  admiration: 'Admiración',
  optimism: 'Optimismo',
  annoyance: 'Molestia',
  disapproval: 'Desaprobación',
  disappointment: 'Decepción',
  remorse: 'Remordimiento',
  realization: 'Comprensión',
  surprise: 'Sorpresa',
  joy: 'Alegría',
  love: 'Entusiasmo',
  sadness: 'Tristeza',
  amusement: 'Diversión',
  anger: 'Enojo',
  caring: 'Empatía',
  desire: 'Interés',
  disgust: 'Desagrado',
  embarrassment: 'Vergüenza',
  excitement: 'Emoción',
  fear: 'Miedo',
  nervousness: 'Nerviosismo',
  pride: 'Orgullo',
  relief: 'Alivio',
}

export const INTENT_LABELS: Record<string, string> = {
  // Taxonomía Community of Inquiry (CoI) actual en BD
  'Triggering (Questioning)': 'Indagación (Preguntas)',
  'Exploration (Discussion)': 'Exploración (Debate)',
  'Integration (Synthesis)': 'Integración (Síntesis)',
  'Course Logistics & Social': 'Logística y social',
  // Etiquetas heredadas (compatibilidad)
  'Conceptual Discussion': 'Debate conceptual',
  'Seeking Clarification': 'Búsqueda de aclaración',
  'Peer Support': 'Apoyo a compañeros',
  'Course Logistics': 'Logística del curso',
}

export const DEFAULT_INTENT_OPTIONS: string[] = [
  'Triggering (Questioning)',
  'Integration (Synthesis)',
  'Exploration (Discussion)',
  'Course Logistics & Social',
]

export const RADAR_DIMENSION_LABELS: Record<string, string> = {
  'Behavioral Engagement': 'Participación',
  'Cognitive Depth': 'Cognitiva',
  'Affective Stability': 'Estabilidad',
  'Distress Risk': 'Malestar',
}

export function getCourseLabel(course: string): string {
  return COURSE_LABELS[course as CourseType] ?? course
}

export function getEmotionLabel(emotion: string): string {
  return EMOTION_LABELS[emotion.toLowerCase()] ?? emotion
}

export function getIntentLabel(intent: string): string {
  return INTENT_LABELS[intent] ?? intent
}

export function getRadarDimensionLabel(dimension: string): string {
  return RADAR_DIMENSION_LABELS[dimension] ?? dimension
}
