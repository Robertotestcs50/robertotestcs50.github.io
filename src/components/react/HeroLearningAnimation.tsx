import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Dims { w: number; h: number }

const FIGURE_Y_FRACTION = 0.5
const WALK_SPEED = 65 // px / sec

// Waypoints as fractions of container width — left-to-right pass
const FWD_STOPS = [0.28, 0.50, 0.68]
// Right-to-left pass
const REV_STOPS = [0.63, 0.38]

// ─── Stick figure ─────────────────────────────────────────────────────────────

function Figure({
  x,
  y,
  walking,
  thinking,
  legPhase,
  facingLeft,
}: {
  x: number
  y: number
  walking: boolean
  thinking: boolean
  legPhase: number
  facingLeft: boolean
}) {
  const swing = Math.sin(legPhase * Math.PI * 2) * 7
  const bob = walking ? Math.abs(Math.sin(legPhase * Math.PI * 2)) * 1.2 : 0
  const S = 'rgba(255,255,255,0.48)'
  const sw = 1.2
  const scale = facingLeft ? -1 : 1

  return (
    <g
      transform={`translate(${x},${y + bob}) scale(${scale},1)`}
      aria-hidden="true"
    >
      {/* Head */}
      <circle cx={0} cy={-32} r={4} fill="none" stroke={S} strokeWidth={sw} />
      {/* Body */}
      <line x1={0} y1={-28} x2={0} y2={-14} stroke={S} strokeWidth={sw} strokeLinecap="round" />
      {/* Right arm — always horizontal */}
      <line x1={0} y1={-23} x2={9} y2={-23} stroke={S} strokeWidth={sw} strokeLinecap="round" />
      {/* Left arm — raises when thinking */}
      <motion.line
        x1={0}
        y1={-23}
        x2={-9}
        animate={{ y2: thinking ? -31 : -23 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        stroke={S}
        strokeWidth={sw}
        strokeLinecap="round"
      />
      {/* Legs */}
      <line x1={0} y1={-14} x2={-swing} y2={0} stroke={S} strokeWidth={sw} strokeLinecap="round" />
      <line x1={0} y1={-14} x2={swing} y2={0} stroke={S} strokeWidth={sw} strokeLinecap="round" />
    </g>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HeroLearningAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const [dims, setDims] = useState<Dims>({ w: 0, h: 0 })
  const [figX, setFigX] = useState(-70)
  const [figY, setFigY] = useState(0)
  const [walking, setWalking] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [legPhase, setLegPhase] = useState(0)
  const [facingLeft, setFacingLeft] = useState(false)

  const animCancelRef = useRef(false)
  const legRafRef = useRef(0)
  const legPhaseRef = useRef(0)
  const walkingRef = useRef(false)
  const figXRef = useRef(-70)
  const dimsRef = useRef<Dims>({ w: 0, h: 0 })

  // ── Resize observer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      dimsRef.current = { w: width, h: height }
      setDims({ w: width, h: height })
      setFigY(height * FIGURE_Y_FRACTION)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Leg animation RAF ────────────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReduced) return
    let last = 0
    const tick = (t: number) => {
      const dt = Math.min((t - last) / 1000, 0.05)
      last = t
      if (walkingRef.current) {
        legPhaseRef.current = (legPhaseRef.current + dt * 3) % 1
        setLegPhase(legPhaseRef.current)
      }
      legRafRef.current = requestAnimationFrame(tick)
    }
    legRafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(legRafRef.current)
  }, [prefersReduced])

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const delay = useCallback((ms: number): Promise<void> =>
    new Promise((res) => {
      if (animCancelRef.current) { res(); return }
      setTimeout(res, ms)
    }), [])

  const walkTo = useCallback((targetX: number): Promise<void> => {
    const dist = Math.abs(targetX - figXRef.current)
    const duration = (dist / WALK_SPEED) * 1000
    figXRef.current = targetX
    walkingRef.current = true
    setWalking(true)
    setFigX(targetX)
    return new Promise((res) => {
      setTimeout(() => {
        walkingRef.current = false
        setWalking(false)
        res()
      }, duration + 80)
    })
  }, [])

  const think = useCallback(async (ms: number): Promise<void> => {
    setThinking(true)
    await delay(ms)
    setThinking(false)
  }, [delay])

  // ── Animation sequence ───────────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReduced || dims.w === 0) return

    animCancelRef.current = false
    figXRef.current = -70

    const W = dimsRef.current.w
    const Y = dimsRef.current.h * FIGURE_Y_FRACTION

    const run = async () => {
      await delay(700)
      if (animCancelRef.current) return
      setFigY(Y)

      // ── Perpetual loop ─────────────────────────────────────────────────────
      while (!animCancelRef.current) {
        // Pass 1: left → right
        setFacingLeft(false)
        figXRef.current = -70
        setFigX(-70)
        await delay(50)

        // Walk in and hit each waypoint
        for (const wp of FWD_STOPS) {
          if (animCancelRef.current) return
          await walkTo(wp * W)
          await delay(80)
          await think(500 + Math.random() * 300)
          await delay(120)
        }

        if (animCancelRef.current) return

        // Walk off right edge
        await walkTo(W + 80)
        setWalking(false)
        walkingRef.current = false

        // Rest off-screen
        const restFwd = 8000 + Math.random() * 4000
        await delay(restFwd)
        if (animCancelRef.current) return

        // Pass 2: right → left
        setFacingLeft(true)
        figXRef.current = W + 80
        setFigX(W + 80)
        await delay(50)

        for (const wp of REV_STOPS) {
          if (animCancelRef.current) return
          await walkTo(wp * W)
          await delay(80)
          await think(450 + Math.random() * 250)
          await delay(100)
        }

        if (animCancelRef.current) return

        // Walk off left edge
        await walkTo(-80)
        setWalking(false)
        walkingRef.current = false

        const restRev = 8000 + Math.random() * 4000
        await delay(restRev)
      }
    }

    run()
    return () => { animCancelRef.current = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.w, dims.h, prefersReduced])

  if (dims.w === 0) {
    return (
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden="true"
    >
      {!prefersReduced && (
        <svg
          width={dims.w}
          height={dims.h}
          style={{ display: 'block', overflow: 'visible' }}
        >
          <Figure
            x={figX}
            y={figY}
            walking={walking}
            thinking={thinking}
            legPhase={legPhase}
            facingLeft={facingLeft}
          />
        </svg>
      )}
    </div>
  )
}
