import type { RadarMetric } from '../../types/student'
import { formatNumber } from '../../utils/formatters'
import { SpiderChart } from '../charts/SpiderChart'

interface MultidimensionalProfileCardProps {
  totalPosts: number
  radarAvg: RadarMetric[]
}

export function MultidimensionalProfileCard({
  totalPosts,
  radarAvg,
}: MultidimensionalProfileCardProps) {
  return (
    <div className="border border-line rounded-xl bg-surface p-4 flex flex-col justify-between gap-2 min-h-[255px]">
      {/* Encabezado */}
      <div>
        <h3 className="text-sm font-bold text-ink leading-snug">
          Perfil multidimensional
        </h3>
        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="font-mono-num text-xs font-semibold text-ink">
            {formatNumber(totalPosts)}
          </span>
          <span className="text-[11px] text-muted">mensajes analizados</span>
        </div>
      </div>

      {/* Gráfica */}
      <div className="flex items-center justify-center my-auto">
        <SpiderChart data={radarAvg} variant="compact" />
      </div>

      {/* Pie informativo */}
      <div className="pt-2.5 border-t border-line/70 text-[11px] text-muted truncate">
        Promedio del curso (0–100%)
      </div>
    </div>
  )
}
