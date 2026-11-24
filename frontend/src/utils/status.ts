import type { DistressStatus } from '../types/student'

export interface StatusInfo {
  key: DistressStatus
  label: string
  sublabel: string
  hex: string
  badgeClass: string
  dotClass: string
  textClass: string
}

const STATUS_MAP: Record<DistressStatus, StatusInfo> = {
  risk: {
    key: 'risk',
    label: 'Prioritario',
    sublabel: 'Requiere apoyo',
    hex: '#C2452D',
    badgeClass: 'bg-risk-soft text-risk border border-risk-border',
    dotClass: 'bg-risk',
    textClass: 'text-risk',
  },
  caution: {
    key: 'caution',
    label: 'En observación',
    sublabel: 'Seguimiento',
    hex: '#B7861F',
    badgeClass: 'bg-caution-soft text-caution border border-caution-border',
    dotClass: 'bg-caution',
    textClass: 'text-caution',
  },
  safe: {
    key: 'safe',
    label: 'Estable',
    sublabel: 'Sin alerta',
    hex: '#2E8B57',
    badgeClass: 'bg-safe-soft text-safe border border-safe-border',
    dotClass: 'bg-safe',
    textClass: 'text-safe',
  },
}

export function getStatusInfo(distressPct: number): StatusInfo {
  if (distressPct >= 30) return STATUS_MAP.risk
  if (distressPct >= 15) return STATUS_MAP.caution
  return STATUS_MAP.safe
}

export function getStatusInfoByKey(status: DistressStatus): StatusInfo {
  return STATUS_MAP[status]
}
