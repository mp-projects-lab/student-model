import type { EmotionStat } from '../../types/student'
import { formatNumber } from '../../utils/formatters'
import { getEmotionLabel } from '../../utils/labels'

interface EmotionsCardProps {
  emotions: EmotionStat[]
}

export function EmotionsCard({ emotions }: EmotionsCardProps) {
  const maxPct = Math.max(...emotions.map((item) => item.pct), 1)

  return (
    <div className="border border-line rounded-xl bg-surface p-4 flex flex-col justify-between min-h-[235px]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-ink">
            Emociones predominantes
          </h3>
          <span className="text-[11px] text-muted shrink-0">Afectiva</span>
        </div>
        <p className="text-[11px] text-muted mt-0.5">
          Emoción principal por estudiante en el foro
        </p>
      </div>

      <div className="space-y-2 my-auto pt-2 text-xs">
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
                <span className="col-span-4 truncate text-ink">{label}</span>
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
    </div>
  )
}
