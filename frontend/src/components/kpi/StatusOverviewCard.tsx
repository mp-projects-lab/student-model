import { MousePointerClick } from 'lucide-react'
import type {
  DistressStatus,
  StatusBreakdown,
  StatusFilter,
} from '../../types/student'
import { formatNumber } from '../../utils/formatters'

interface StatusOverviewCardProps {
  totalStudents: number
  breakdown: StatusBreakdown
  activeStatus: StatusFilter
  onToggleStatus: (status: DistressStatus) => void
}

interface StatusRowConfig {
  key: DistressStatus
  label: string
  count: number
  pct: number
  textClass: string
  dotClass: string
}

export function StatusOverviewCard({
  totalStudents,
  breakdown,
  activeStatus,
  onToggleStatus,
}: StatusOverviewCardProps) {
  const rows: StatusRowConfig[] = [
    {
      key: 'risk',
      label: 'Prioritario (≥30%)',
      count: breakdown.risk,
      pct: breakdown.risk_pct,
      textClass: 'text-risk',
      dotClass: 'bg-risk',
    },
    {
      key: 'caution',
      label: 'Atención (15–29%)',
      count: breakdown.caution,
      pct: breakdown.caution_pct,
      textClass: 'text-caution',
      dotClass: 'bg-caution',
    },
    {
      key: 'safe',
      label: 'Estable (<15%)',
      count: breakdown.safe,
      pct: breakdown.safe_pct,
      textClass: 'text-safe',
      dotClass: 'bg-safe',
    },
  ]

  return (
    <div className="border border-line rounded-xl bg-surface p-4 flex flex-col justify-between gap-3 min-h-[255px]">
      {/* Encabezado */}
      <div>
        <h3 className="text-sm font-bold text-ink leading-snug">
          Estado de los estudiantes
        </h3>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-mono-num text-xs font-semibold text-ink">
            {formatNumber(totalStudents)}
          </span>
          <span className="text-[11px] text-muted">alumnos en total</span>
        </div>
      </div>

      {/* Distribución */}
      <div className="space-y-3 my-auto">
        <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-line">
          <div
            className="h-full bg-risk transition-all duration-300"
            style={{ width: `${breakdown.risk_pct}%` }}
            title={`Prioritario: ${breakdown.risk_pct}%`}
          />
          <div
            className="h-full bg-caution transition-all duration-300"
            style={{ width: `${breakdown.caution_pct}%` }}
            title={`Atención: ${breakdown.caution_pct}%`}
          />
          <div
            className="h-full bg-safe transition-all duration-300"
            style={{ width: `${breakdown.safe_pct}%` }}
            title={`Estable: ${breakdown.safe_pct}%`}
          />
        </div>

        <div className="space-y-1 text-[11px]">
          {rows.map((row) => {
            const isSelected = activeStatus === row.key
            return (
              <button
                key={row.key}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggleStatus(row.key)}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-filter-hover ring-1 ring-ink/20'
                    : 'hover:bg-filter-hover'
                }`}
              >
                <span
                  className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap shrink-0 ${row.textClass}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${row.dotClass}`}
                  />
                  {row.label}
                </span>
                <span
                  className={`font-mono-num font-semibold whitespace-nowrap shrink-0 ${row.textClass}`}
                >
                  {formatNumber(row.count)} ({row.pct}%)
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Pie informativo */}
      <div className="pt-2.5 border-t border-line/70 flex items-center gap-1.5 text-[11px] text-muted">
        <MousePointerClick size={12} strokeWidth={2} className="shrink-0" />
        <span className="truncate">Haz clic en un estado para filtrar</span>
      </div>
    </div>
  )
}
