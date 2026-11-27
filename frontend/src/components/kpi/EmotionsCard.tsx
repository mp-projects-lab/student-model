import type { EmotionStat } from '../../types/student'
import { formatNumber } from '../../utils/formatters'
import { getEmotionLabel } from '../../utils/labels'

interface EmotionsCardProps {
  emotions: EmotionStat[]
}

export function EmotionsCard({ emotions }: EmotionsCardProps) {
  const maxPct = Math.max(...emotions.map((item) => item.pct), 1)

  return (
    <div className="border border-line rounded-xl bg-surface p-4 flex flex-col justify-between gap-3 min-h-[255px]">
      {/* Encabezado */}
      <div>
        <h3 className="text-sm font-bold text-ink leading-snug">
          Emociones predominantes
        </h3>
        <div className="mt-0.5 text-[11px] text-muted">Dimensión afectiva</div>
      </div>

      {/* Barras */}
      <div className="space-y-2.5 my-auto text-xs">
        {emotions.length === 0 ? (
          <p className="text-muted text-center py-6">Sin datos disponibles</p>
        ) : (
          emotions.map((item) => {
            const label = getEmotionLabel(item.emotion)
            const barWidth = Math.round((item.pct / maxPct) * 100)
            return (
              <div
                key={item.emotion}
                className="grid grid-cols-12 items-center gap-2"
                title={`${label}: ${formatNumber(item.count)} estudiantes (${item.pct}%)`}
              >
                <span className="col-span-4 truncate text-ink font-medium">
                  {label}
                </span>
                <div className="col-span-5 h-1.5 rounded-full bg-line overflow-hidden">
                  <div
                    className="h-full bg-ink rounded-full transition-all duration-300"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
                <span className="col-span-3 text-right font-mono-num text-[11px] text-muted">
                  {item.pct}%
                </span>
              </div>
            )
          })
        )}
      </div>

      {/* Pie informativo */}
      <div className="pt-2.5 border-t border-line/70 text-[11px] text-muted truncate">
        Emoción principal por estudiante
      </div>
    </div>
  )
}
