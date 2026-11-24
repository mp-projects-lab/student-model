import type { TimelineEntry } from '../../types/student'
import { getStatusInfo } from '../../utils/status'

interface TimelineChartProps {
  timeline: TimelineEntry[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
}

const WIDTH = 640
const HEIGHT = 185
const PAD_L = 38
const PAD_R = 22
const PAD_T = 18
const PAD_B = 30
const PLOT_W = WIDTH - PAD_L - PAD_R
const PLOT_H = HEIGHT - PAD_T - PAD_B

export function TimelineChart({
  timeline,
  selectedIndex,
  onSelectIndex,
}: TimelineChartProps) {
  const count = timeline.length
  const getX = (index: number) =>
    count <= 1 ? PAD_L + PLOT_W / 2 : PAD_L + (index / (count - 1)) * PLOT_W
  const getY = (value: number) =>
    PAD_T + PLOT_H - (Math.min(100, Math.max(0, value)) / 100) * PLOT_H

  const y30 = getY(30)
  const labelStep = count > 10 ? Math.ceil(count / 8) : 1

  const polylinePoints =
    count > 1
      ? timeline
          .map((entry, index) => `${getX(index)},${getY(entry.distress_pct)}`)
          .join(' ')
      : ''

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-auto overflow-visible"
      role="img"
      aria-label="Evolución de malestar emocional por mensaje"
    >
      {[0, 50, 100].map((val) => {
        const y = getY(val)
        return (
          <g key={val}>
            <line
              x1={PAD_L}
              y1={y}
              x2={WIDTH - PAD_R}
              y2={y}
              stroke="#E0E0E0"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 8}
              y={y + 3}
              textAnchor="end"
              fill="#6B6B6B"
              fontSize={10}
              className="font-mono-num"
            >
              {val}%
            </text>
          </g>
        )
      })}

      <line
        x1={PAD_L}
        y1={y30}
        x2={WIDTH - PAD_R}
        y2={y30}
        stroke="#C2452D"
        strokeWidth={1}
        strokeDasharray="4 4"
      />
      <text
        x={WIDTH - PAD_R}
        y={y30 - 5}
        textAnchor="end"
        fill="#C2452D"
        fontSize={9}
        fontWeight={600}
      >
        Umbral Prioritario (30%)
      </text>

      {count > 1 && (
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#111111"
          strokeWidth={1.75}
        />
      )}

      {timeline.map((entry, index) => {
        const x = getX(index)
        const y = getY(entry.distress_pct)
        const status = getStatusInfo(entry.distress_pct)
        const isSelected = index === selectedIndex
        const showLabel =
          count <= 10 || index === 0 || index === count - 1 || index % labelStep === 0

        return (
          <g key={`${entry.created_at}-${index}`}>
            {isSelected && (
              <circle
                cx={x}
                cy={y}
                r={8}
                fill="none"
                stroke="#111111"
                strokeWidth={1.5}
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={count > 40 ? 4 : 5}
              fill={status.hex}
              stroke="#FFFFFF"
              strokeWidth={1.5}
              onClick={() => onSelectIndex(index)}
              className="cursor-pointer"
            >
              <title>{`Msj #${index + 1} · Malestar: ${entry.distress_pct}%`}</title>
            </circle>
            {showLabel && (
              <text
                x={x}
                y={HEIGHT - 8}
                textAnchor="middle"
                fill="#6B6B6B"
                fontSize={10}
                className="font-mono-num"
              >
                Msj #{index + 1}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
