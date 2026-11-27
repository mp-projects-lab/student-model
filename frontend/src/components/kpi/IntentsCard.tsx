import { MousePointerClick } from 'lucide-react'
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
    <div className="border border-line rounded-xl bg-surface p-4 flex flex-col justify-between gap-3 min-h-[255px]">
      {/* Encabezado */}
      <div>
        <h3 className="text-sm font-bold text-ink leading-snug">
          Enfoque de participación
        </h3>
        <div className="mt-0.5 text-[11px] text-muted">Dimensión cognitiva</div>
      </div>

      {/* Barras interactivas */}
      <div className="space-y-1.5 my-auto text-xs">
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
                className={`w-full text-left space-y-1 px-2 py-1.5 -mx-2 rounded-lg transition cursor-pointer ${
                  isSelected
                    ? 'bg-filter-hover ring-1 ring-ink/20'
                    : 'hover:bg-filter-hover'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ink font-medium truncate">{label}</span>
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

      {/* Pie informativo */}
      <div className="pt-2.5 border-t border-line/70 flex items-center gap-1.5 text-[11px] text-muted">
        <MousePointerClick size={12} strokeWidth={2} className="shrink-0" />
        <span className="truncate">Haz clic en un enfoque para filtrar</span>
      </div>
    </div>
  )
}
