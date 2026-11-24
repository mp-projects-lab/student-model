import type { RadarMetric } from '../../types/student'
import { getRadarDimensionLabel } from '../../utils/labels'

interface SpiderChartProps {
  data: RadarMetric[]
  comparisonData?: RadarMetric[]
  variant?: 'compact' | 'comparative'
  className?: string
}

const ANGLES = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]

function getPolygonPoints(
  scores: number[],
  cx: number,
  cy: number,
  maxR: number,
): string {
  return ANGLES.map((angle, index) => {
    const normalized = Math.min(100, Math.max(0, scores[index] ?? 0)) / 100
    const x = cx + Math.cos(angle) * maxR * normalized
    const y = cy + Math.sin(angle) * maxR * normalized
    return `${x},${y}`
  }).join(' ')
}

export function SpiderChart({
  data,
  comparisonData,
  variant = 'compact',
  className = '',
}: SpiderChartProps) {
  const isCompact = variant === 'compact'
  const viewBox = isCompact ? '0 0 240 165' : '0 0 260 215'
  const cx = isCompact ? 120 : 130
  const cy = isCompact ? 83 : 107
  const maxR = isCompact ? 52 : 68
  const levels = isCompact ? [0.33, 0.66, 1] : [0.25, 0.5, 0.75, 1]
  const labelOffsetY = isCompact ? 14 : 18
  const pointRadius = isCompact ? 3 : 3.5

  const primaryScores = ANGLES.map((_, index) => data[index]?.score ?? 0)
  const comparisonScores = comparisonData
    ? ANGLES.map((_, index) => comparisonData[index]?.score ?? 0)
    : null

  return (
    <svg
      viewBox={viewBox}
      className={`w-full h-auto overflow-visible ${
        isCompact ? 'max-w-[225px]' : 'max-w-[235px]'
      } ${className}`}
      role="img"
      aria-label="Gráfica de perfil multidimensional"
    >
      {levels.map((level) => {
        const points = ANGLES.map(
          (angle) =>
            `${cx + Math.cos(angle) * maxR * level},${cy + Math.sin(angle) * maxR * level}`,
        ).join(' ')
        return (
          <polygon
            key={level}
            points={points}
            fill="none"
            stroke="#E0E0E0"
            strokeWidth={1}
          />
        )
      })}

      {ANGLES.map((angle, index) => {
        const x2 = cx + Math.cos(angle) * maxR
        const y2 = cy + Math.sin(angle) * maxR
        const lx = cx + Math.cos(angle) * (maxR + 28)
        const ly = cy + Math.sin(angle) * (maxR + labelOffsetY)
        const item = data[index]
        const label = item ? getRadarDimensionLabel(item.dimension) : ''

        return (
          <g key={item?.dimension ?? index}>
            <line
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke="#E0E0E0"
              strokeWidth={1}
            />
            <text
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#6B6B6B"
              fontSize={isCompact ? 9.5 : 10}
            >
              {label}
              {isCompact && item && (
                <>
                  {' '}
                  <tspan
                    fill="#111111"
                    fontWeight={600}
                    className="font-mono-num"
                  >
                    {item.score.toFixed(0)}%
                  </tspan>
                </>
              )}
            </text>
          </g>
        )
      })}

      {comparisonScores && (
        <polygon
          points={getPolygonPoints(comparisonScores, cx, cy, maxR)}
          fill="none"
          stroke="#6B6B6B"
          strokeWidth={1.25}
          strokeDasharray="3 3"
        />
      )}

      <polygon
        points={getPolygonPoints(primaryScores, cx, cy, maxR)}
        fill="#111111"
        fillOpacity={0.09}
        stroke="#111111"
        strokeWidth={isCompact ? 1.75 : 2}
      />

      {ANGLES.map((angle, index) => {
        const normalized = Math.min(100, Math.max(0, primaryScores[index])) / 100
        const px = cx + Math.cos(angle) * maxR * normalized
        const py = cy + Math.sin(angle) * maxR * normalized
        return (
          <circle
            key={index}
            cx={px}
            cy={py}
            r={pointRadius}
            fill="#111111"
          />
        )
      })}
    </svg>
  )
}
