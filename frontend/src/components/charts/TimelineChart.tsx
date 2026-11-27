import type { TimelineEntry } from '../../types/student'
import { getStatusInfo } from '../../utils/status'

interface TimelineChartProps {
  timeline: TimelineEntry[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
}

const WIDTH = 660
const HEIGHT = 205
const PAD_L = 44
const PAD_R = 24
const PAD_T = 26
const PAD_B = 32
const INNER_X = 22
const PLOT_W = WIDTH - PAD_L - PAD_R
const PLOT_H = HEIGHT - PAD_T - PAD_B

export function TimelineChart({
  timeline,
  selectedIndex,
  onSelectIndex,
}: TimelineChartProps) {
  const count = timeline.length
  const usableW = PLOT_W - INNER_X * 2

  const getX = (index: number) =>
    count <= 1
      ? PAD_L + PLOT_W / 2
      : PAD_L + INNER_X + (index / (count - 1)) * usableW

  const getY = (value: number) =>
    PAD_T + PLOT_H - (Math.min(100, Math.max(0, value)) / 100) * PLOT_H

  const y0 = getY(0)
  const y30 = getY(30)
  const y100 = getY(100)
  const labelStep = count > 10 ? Math.ceil(count / 8) : 1

  const coords = timeline.map((entry, index) => ({
    x: getX(index),
    y: getY(entry.distress_pct),
    entry,
    index,
  }))

  const polylinePoints =
    count > 1 ? coords.map((pt) => `${pt.x},${pt.y}`).join(' ') : ''

  const areaPath =
    count > 1
      ? `M ${coords[0].x},${y0} ` +
        coords.map((pt) => `L ${pt.x},${pt.y}`).join(' ') +
        ` L ${coords[count - 1].x},${y0} Z`
      : ''

  const selectedPt = coords[selectedIndex]

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full h-auto overflow-visible select-none"
      role="img"
      aria-label="Evolución de malestar emocional por mensaje"
    >
      <defs>
        <linearGradient id="timeline-area-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#111111" stopOpacity="0.09" />
          <stop offset="100%" stopColor="#111111" stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* Zona suave de malestar prioritario (>= 30%) */}
      <rect
        x={PAD_L}
        y={y100}
        width={PLOT_W}
        height={y30 - y100}
        fill="#C2452D"
        fillOpacity={0.035}
        rx={4}
      />

      {/* Líneas horizontales de referencia */}
      {[0, 50, 100].map((val) => {
        const y = getY(val)
        return (
          <g key={val}>
            <line
              x1={PAD_L}
              y1={y}
              x2={WIDTH - PAD_R}
              y2={y}
              stroke="#E6E6E6"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 10}
              y={y + 3.5}
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

      {/* Línea de umbral prioritario (30%) con etiqueta en el eje Y */}
      <line
        x1={PAD_L}
        y1={y30}
        x2={WIDTH - PAD_R}
        y2={y30}
        stroke="#C2452D"
        strokeWidth={1.25}
        strokeDasharray="4 4"
        strokeOpacity={0.8}
      />
      <text
        x={PAD_L - 10}
        y={y30 + 3.5}
        textAnchor="end"
        fill="#C2452D"
        fontSize={9.5}
        fontWeight={600}
        className="font-mono-num"
      >
        30%
      </text>

      {/* Área suave bajo la curva */}
      {count > 1 && <path d={areaPath} fill="url(#timeline-area-grad)" />}

      {/* Guía vertical del punto seleccionado */}
      {selectedPt && (
        <line
          x1={selectedPt.x}
          y1={selectedPt.y}
          x2={selectedPt.x}
          y2={y0}
          stroke="#111111"
          strokeOpacity={0.18}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}

      {/* Línea principal */}
      {count > 1 && (
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="#111111"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}

      {/* Puntos interactivos y etiquetas X */}
      {coords.map(({ x, y, entry, index }) => {
        const status = getStatusInfo(entry.distress_pct)
        const isSelected = index === selectedIndex
        const showLabel =
          count <= 10 ||
          index === 0 ||
          index === count - 1 ||
          index % labelStep === 0
        const xLabel = count <= 7 ? `Mensaje #${index + 1}` : `#${index + 1}`

        return (
          <g key={`${entry.created_at}-${index}`}>
            {isSelected && (
              <>
                <circle
                  cx={x}
                  cy={y}
                  r={9.5}
                  fill={status.hex}
                  fillOpacity={0.14}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={8}
                  fill="none"
                  stroke="#111111"
                  strokeWidth={1.5}
                />
              </>
            )}

            <circle
              cx={x}
              cy={y}
              r={count > 40 ? 4 : isSelected ? 5.5 : 5}
              fill={status.hex}
              stroke="#FFFFFF"
              strokeWidth={2}
              onClick={() => onSelectIndex(index)}
              className="cursor-pointer"
            >
              <title>{`Mensaje #${index + 1} · Malestar: ${entry.distress_pct}%`}</title>
            </circle>

            {showLabel && (
              <text
                x={x}
                y={HEIGHT - 10}
                textAnchor="middle"
                fill={isSelected ? '#111111' : '#6B6B6B'}
                fontSize={10}
                fontWeight={isSelected ? 700 : 400}
                className="font-mono-num"
              >
                {xLabel}
              </text>
            )}
          </g>
        )
      })}

      {/* Etiqueta flotante limpia del valor seleccionado */}
      {selectedPt && (() => {
        const pillText = `${selectedPt.entry.distress_pct.toFixed(0)}%`
        const pillW = 36
        const pillH = 18
        const showBelow = selectedPt.entry.distress_pct >= 84
        const pillY = showBelow ? selectedPt.y + 13 : selectedPt.y - pillH - 12
        return (
          <g className="pointer-events-none">
            <rect
              x={selectedPt.x - pillW / 2}
              y={pillY}
              width={pillW}
              height={pillH}
              rx={5}
              fill="#111111"
            />
            <text
              x={selectedPt.x}
              y={pillY + 12.5}
              textAnchor="middle"
              fill="#FFFFFF"
              fontSize={9.5}
              fontWeight={600}
              className="font-mono-num"
            >
              {pillText}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
