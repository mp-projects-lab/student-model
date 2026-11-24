import type { DistressStatus } from '../../types/student'
import { getStatusInfo, getStatusInfoByKey } from '../../utils/status'

interface StatusBadgeProps {
  distressPct?: number
  status?: DistressStatus
}

export function StatusBadge({ distressPct, status }: StatusBadgeProps) {
  const info = status
    ? getStatusInfoByKey(status)
    : getStatusInfo(distressPct ?? 0)

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold whitespace-nowrap ${info.badgeClass}`}
      title={info.sublabel}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${info.dotClass}`} />
      <span>{info.label}</span>
    </span>
  )
}
