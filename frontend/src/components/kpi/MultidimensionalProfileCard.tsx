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
    <div className="border border-line rounded-xl bg-surface p-4 flex flex-col justify-between min-h-[235px]">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-ink">
            Perfil multidimensional
          </h3>
          <span className="font-mono-num text-xs text-muted shrink-0">
            {formatNumber(totalPosts)} msjs
          </span>
        </div>
        <p className="text-[11px] text-muted mt-0.5">
          Spider chart promedio del curso (0–100%)
        </p>
      </div>

      <div className="flex items-center justify-center my-auto pt-1">
        <SpiderChart data={radarAvg} variant="compact" />
      </div>
    </div>
  )
}
