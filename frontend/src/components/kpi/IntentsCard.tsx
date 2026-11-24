import type { IntentStat } from '../../types/student'
import { formatNumber } from '../../utils/formatters'
import { getIntentLabel } from '../../utils/labels'

interface IntentsCardProps {
  intents: IntentStat[]
  activeIntent: string
  onToggleIntent: (intent: string) => void
}

export function IntentsCard({
  intents,
  activeIntent,
  onToggleIntent,
}: IntentsCardProps) {
  return (
    <div className="border border-line rounded-xl bg-surface p-4 flex flex-col justify-between min-h-[235px]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-ink">
            Enfoque de participación
          </h3>
          <span className="text-[11px] text-muted shrink-0">Cognitiva</span>
        </div>
        <p className="text-[11px] text-muted mt-0.5">
          Orientación principal de sus aportes al foro
        </p>
      </div>

      <div className="space-y-1.5 my-auto pt-2 text-xs">
        {intents.length === 0 ? (
          <p className="text-muted text-center py-6">Sin datos disponibles</p>
        ) : (
          intents.map((item) => {
            const label = getIntentLabel(item.intent)
            const isSelected = activeIntent === item.intent
            return (
              <button
                key={item.intent}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggleIntent(item.intent)}
                className={`w-full text-left space-y-1 px-1.5 py-1 -mx-1.5 rounded-md transition cursor-pointer ${
                  isSelected
                    ? 'bg-filter-hover ring-1 ring-ink/20'
                    : 'hover:bg-filter-hover'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink truncate">{label}</span>
                  <span className="font-mono-num text-[11px] text-muted shrink-0">
                    {formatNumber(item.count)} ({item.pct}%)
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full bg-ink rounded-full transition-all duration-300"
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
