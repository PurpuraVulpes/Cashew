import { useEffect, useRef, useState } from 'react'
import { fmtCompact, fmtMoney, parseISO } from '../utils.js'

function useWidth() {
  const ref = useRef(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width)
    })
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, width]
}

function smoothPath(points) {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] || p2
    const c1x = p1.x + (p2.x - p0.x) / 6
    const c1y = p1.y + (p2.y - p0.y) / 6
    const c2x = p2.x - (p3.x - p1.x) / 6
    const c2y = p2.y - (p3.y - p1.y) / 6
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`
  }
  return d
}

const MONTHS_SHORT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export function LineChart({ points, currency, height = 210 }) {
  const [ref, width] = useWidth()
  const padL = 58
  const padR = 14
  const padT = 14
  const padB = 28
  const w = Math.max(width, 280)
  const h = height
  const values = points.map((p) => p.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  min -= span * 0.08
  max += span * 0.08

  const xAt = (i) => padL + (i / (points.length - 1)) * (w - padL - padR)
  const yAt = (v) => padT + (1 - (v - min) / (max - min)) * (h - padT - padB)
  const coords = points.map((p, i) => ({ x: xAt(i), y: yAt(p.value) }))
  const line = smoothPath(coords)
  const area = `${line} L ${coords[coords.length - 1].x} ${h - padB} L ${coords[0].x} ${h - padB} Z`

  const gridCount = 4
  const ticks = Array.from({ length: gridCount + 1 }, (_, i) => min + ((max - min) * i) / gridCount)

  const xLabelIdx = points.length <= 10
    ? points.map((_, i) => i).filter((i) => i % Math.ceil(points.length / 5) === 0)
    : [0, Math.floor(points.length * 0.33), Math.floor(points.length * 0.66), points.length - 1]

  return (
    <div ref={ref} style={{ width: '100%', minHeight: h }}>
      {width > 0 && (
        <svg className="chart-svg" viewBox={`0 0 ${w} ${h}`} style={{ height }}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {ticks.map((t, i) => {
            const y = yAt(t)
            return (
              <g key={i}>
                <line
                  x1={padL}
                  x2={w - padR}
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1.5"
                  strokeDasharray="2 7"
                  strokeLinecap="round"
                />
                <text
                  x={padL - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fontWeight="800"
                  fill="var(--text-faint)"
                  fontFamily="var(--font)"
                >
                  {fmtCompact(t, currency)}
                </text>
              </g>
            )
          })}

          {xLabelIdx.map((i) => {
            const d = parseISO(points[i].date)
            return (
              <text
                key={i}
                x={xAt(i)}
                y={h - 6}
                textAnchor="middle"
                fontSize="12"
                fontWeight="700"
                fill="var(--text-dim)"
                fontFamily="var(--font)"
              >
                {`${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`}
              </text>
            )
          })}

          <path d={area} fill="url(#areaFill)" />
          <path
            d={line}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {(() => {
            const last = coords[coords.length - 1]
            return (
              <>
                <circle cx={last.x} cy={last.y} r="8" fill="var(--accent)" opacity="0.25" />
                <circle cx={last.x} cy={last.y} r="4" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
              </>
            )
          })()}
        </svg>
      )}
    </div>
  )
}

export function Donut({ data, currency, centerLabel = 'Total' }) {
  const size = 200
  const cx = size / 2
  const cy = size / 2
  const r = 78
  const thickness = 30
  const C = 2 * Math.PI * r
  const total = data.reduce((s, d) => s + d.value, 0)
  let acc = 0

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--track)" strokeWidth={thickness} />
        {total > 0 &&
          data
            .filter((d) => d.value > 0)
            .map((d, i) => {
              const frac = d.value / total
              const len = Math.max(frac * C - 3, 0.5)
              const offset = -acc * C
              acc += frac
              return (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${len} ${C - len}`}
                  strokeDashoffset={offset}
                  style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
                />
              )
            })}
        <g transform={`rotate(90 ${cx} ${cy})`}>
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            className="donut-center-label"
          >
            {centerLabel}
          </text>
          <text x={cx} y={cy + 18} textAnchor="middle" className="donut-center-value">
            {fmtMoney(total, currency)}
          </text>
        </g>
      </svg>
    </div>
  )
}
