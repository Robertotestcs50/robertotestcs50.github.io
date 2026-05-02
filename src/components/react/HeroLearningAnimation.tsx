import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useReducedMotion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NodeData {
  id: string
  px: number // 0-1 fraction of container width
  py: number // 0-1 fraction of container height
  addedAt: number
  drawn: boolean
}

interface ConnectionData {
  id: string
  x1: number; y1: number
  x2: number; y2: number
  length: number
  drawn: boolean
}

interface Dims { w: number; h: number }

// Predefined node positions — designed to avoid the large hero title
const NODE_POSITIONS: { x: number; y: number }[] = [
  { x: 0.18, y: 0.42 },
  { x: 0.72, y: 0.38 },
  { x: 0.32, y: 0.78 },
  { x: 0.58, y: 0.82 },
  { x: 0.84, y: 0.62 },
  { x: 0.12, y: 0.68 },
  { x: 0.46, y: 0.30 },
  { x: 0.66, y: 0.72 },
  { x: 0.28, y: 0.55 },
]

const MAX_NODES = 28
const FIGURE_Y_FRACTION = 0.5  // walk along vertical midpoint
const WALK_SPEED = 70           // px/sec
const INSPIRATION_X = 0.32     // fraction: near "Learning..." text

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

// ─── Memoised network layer ───────────────────────────────────────────────────

const NetworkLayer = React.memo(function NetworkLayer({
  nodes,
  connections,
  dims,
}: {
  nodes: NodeData[]
  connections: ConnectionData[]
  dims: Dims
}) {
  return (
    <g>
      {/* Connection lines */}
      {connections.map((c) => (
        <line
          key={c.id}
          x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
          stroke="rgba(255,92,0,0.15)"
          strokeWidth={0.6}
          strokeDasharray={c.drawn ? 'none' : c.length}
          strokeDashoffset={c.drawn ? 0 : c.length}
          style={
            c.drawn
              ? undefined
              : { transition: 'stroke-dashoffset 0.5s ease', strokeDashoffset: 0 }
          }
        />
      ))}

      {/* Node glows (behind dots) */}
      {nodes.map((n) => {
        const nx = n.px * dims.w
        const ny = n.py * dims.h
        return (
          <circle
            key={`glow-${n.id}`}
            cx={nx} cy={ny} r={8}
            fill="rgba(255,92,0,0.12)"
            style={{ filter: 'blur(4px)' }}
          />
        )
      })}

      {/* Node dots */}
      {nodes.map((n) => {
        const nx = n.px * dims.w
        const ny = n.py * dims.h
        return (
          <circle
            key={`node-${n.id}`}
            cx={nx} cy={ny} r={3}
            fill="rgba(255,255,255,0.9)"
            style={{
              animation: 'node-pulse 2s ease-in-out infinite',
              animationDelay: `${(n.addedAt % 2000) / 1000}s`,
            }}
          />
        )
      })}
    </g>
  )
})

// ─── Figure component ─────────────────────────────────────────────────────────

function Figure({
  x,
  y,
  walking,
  legPhase,
}: {
  x: number
  y: number
  walking: boolean
  legPhase: number
}) {
  const swing = Math.sin(legPhase * Math.PI * 2) * 7
  const bob = walking ? Math.abs(Math.sin(legPhase * Math.PI * 2)) * 1.2 : 0
  const S = 'rgba(255,255,255,0.55)'
  const sw = 1.2

  return (
    <g transform={`translate(${x},${y + bob})`} aria-hidden="true">
      {/* Head */}
      <circle cx={0} cy={-32} r={4} fill="none" stroke={S} strokeWidth={sw} />
      {/* Body */}
      <line x1={0} y1={-28} x2={0} y2={-14} stroke={S} strokeWidth={sw} strokeLinecap="round" />
      {/* Arms */}
      <line x1={-9} y1={-23} x2={9} y2={-23} stroke={S} strokeWidth={sw} strokeLinecap="round" />
      {/* Left leg */}
      <line x1={0} y1={-14} x2={-swing} y2={0} stroke={S} strokeWidth={sw} strokeLinecap="round" />
      {/* Right leg */}
      <line x1={0} y1={-14} x2={swing} y2={0} stroke={S} strokeWidth={sw} strokeLinecap="round" />
    </g>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HeroLearningAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const prefersReduced = useReducedMotion()

  const [dims, setDims] = useState<Dims>({ w: 0, h: 0 })
  const [nodes, setNodes] = useState<NodeData[]>([])
  const [connections, setConnections] = useState<ConnectionData[]>([])
  const [figX, setFigX] = useState(-60)
  const [figY, setFigY] = useState(0)
  const [walking, setWalking] = useState(false)
  const [legPhase, setLegPhase] = useState(0)

  // Refs for animation loop / sequence
  const nodeCounterRef = useRef(0)
  const animCancelRef = useRef(false)
  const legRafRef = useRef(0)
  const legPhaseRef = useRef(0)
  const walkingRef = useRef(false)
  const figXRef = useRef(-60)
  const dimsRef = useRef<Dims>({ w: 0, h: 0 })
  const nodesRef = useRef<NodeData[]>([])

  // ── Resize observer ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const d = { w: width, h: height }
      setDims(d)
      dimsRef.current = d
      setFigY(height * FIGURE_Y_FRACTION)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // ── Leg animation RAF ────────────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReduced) return
    let lastT = 0
    const tick = (t: number) => {
      const dt = Math.min((t - lastT) / 1000, 0.05)
      lastT = t
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
  const delay = (ms: number) =>
    new Promise<void>((res) => {
      if (animCancelRef.current) { res(); return }
      const t = setTimeout(() => {
        if (!animCancelRef.current) res()
        else res()
      }, ms)
      return t
    })

  const moveFigureTo = useCallback((targetX: number, targetY: number): Promise<void> => {
    const dx = targetX - figXRef.current
    const dy = targetY - figY
    const distance = Math.sqrt(dx * dx + dy * dy)
    const duration = (distance / WALK_SPEED) * 1000

    figXRef.current = targetX
    walkingRef.current = true
    setWalking(true)
    setFigX(targetX)

    return new Promise<void>((res) => {
      const t = setTimeout(() => {
        walkingRef.current = false
        setWalking(false)
        res()
      }, duration + 80)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [figY])

  const addNode = useCallback((pxFrac: number, pyFrac: number) => {
    const id = `n${nodeCounterRef.current++}`
    const newNode: NodeData = { id, px: pxFrac, py: pyFrac, addedAt: Date.now(), drawn: false }

    setNodes((prev) => {
      const updated = [...prev, newNode].slice(-MAX_NODES)
      nodesRef.current = updated

      // Build connections from new node to all existing
      const nx = pxFrac * dimsRef.current.w
      const ny = pyFrac * dimsRef.current.h
      const newConns: ConnectionData[] = prev.slice(-MAX_NODES).map((existing) => {
        const ex = existing.px * dimsRef.current.w
        const ey = existing.py * dimsRef.current.h
        const length = dist(nx, ny, ex, ey)
        return {
          id: `c-${id}-${existing.id}`,
          x1: nx, y1: ny,
          x2: ex, y2: ey,
          length,
          drawn: false,
        }
      })

      if (newConns.length > 0) {
        setConnections((prevC) => {
          const all = [...prevC, ...newConns]
          // Trigger draw animation on next tick
          requestAnimationFrame(() => {
            setConnections((c) =>
              c.map((conn) =>
                newConns.some((nc) => nc.id === conn.id)
                  ? { ...conn, drawn: true }
                  : conn
              )
            )
          })
          return all
        })
      }

      return updated
    })

    // Trigger node appearance animation
    requestAnimationFrame(() => {
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, drawn: true } : n)))
    })
  }, [])

  // ── Reduced motion fallback ──────────────────────────────────────────────────
  useEffect(() => {
    if (!prefersReduced || dimsRef.current.w === 0) return
    // Instantly show all 9 nodes and all connections
    const ns: NodeData[] = NODE_POSITIONS.map((pos, i) => ({
      id: `n${i}`,
      px: pos.x,
      py: pos.y,
      addedAt: Date.now(),
      drawn: true,
    }))
    const cs: ConnectionData[] = []
    for (let a = 0; a < ns.length; a++) {
      for (let b = a + 1; b < ns.length; b++) {
        const x1 = ns[a].px * dimsRef.current.w
        const y1 = ns[a].py * dimsRef.current.h
        const x2 = ns[b].px * dimsRef.current.w
        const y2 = ns[b].py * dimsRef.current.h
        cs.push({
          id: `c-${a}-${b}`,
          x1, y1, x2, y2,
          length: dist(x1, y1, x2, y2),
          drawn: true,
        })
      }
    }
    setNodes(ns)
    setConnections(cs)
  }, [prefersReduced, dims])

  // ── Main animation sequence ──────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReduced || dims.w === 0) return

    animCancelRef.current = false
    figXRef.current = -60

    const run = async () => {
      // Initial delay — let user read the name first
      await delay(600)
      if (animCancelRef.current) return

      const heroMidY = dims.h * FIGURE_Y_FRACTION
      setFigY(heroMidY)

      // Walk in from left, pause near "Learning..." (about 30% in)
      const inspireX = dims.w * INSPIRATION_X
      await moveFigureTo(inspireX, heroMidY)
      await delay(620)
      if (animCancelRef.current) return

      // Walk to each node and place it
      for (let i = 0; i < NODE_POSITIONS.length; i++) {
        if (animCancelRef.current) return
        const targetX = NODE_POSITIONS[i].x * dims.w
        await moveFigureTo(targetX, heroMidY)

        // Brief arm-extend pause, then place node
        setWalking(false)
        walkingRef.current = false
        await delay(320)
        addNode(NODE_POSITIONS[i].x, NODE_POSITIONS[i].y)
        await delay(380)
      }

      if (animCancelRef.current) return

      // Walk off right edge
      await moveFigureTo(dims.w + 70, heroMidY)
      walkingRef.current = false
      setWalking(false)

      // Autonomous mode: add one node every 4-6 seconds
      let autonomousRunning = true
      const autonomousStep = async () => {
        while (!animCancelRef.current && autonomousRunning) {
          const waitMs = 4000 + Math.random() * 2000
          await delay(waitMs)
          if (animCancelRef.current) break

          // Pick a random position (slightly varied from initial set)
          const basePos = NODE_POSITIONS[Math.floor(Math.random() * NODE_POSITIONS.length)]
          const jitter = 0.06
          const px = Math.max(0.06, Math.min(0.94, basePos.x + (Math.random() - 0.5) * jitter))
          const py = Math.max(0.12, Math.min(0.92, basePos.y + (Math.random() - 0.5) * jitter))
          addNode(px, py)
        }
      }
      autonomousStep()

      return () => { autonomousRunning = false }
    }

    run()

    return () => {
      animCancelRef.current = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dims.w, dims.h, prefersReduced])

  // ── Intersection observer — pause leg RAF when off screen ────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { walkingRef.current = entry.isIntersecting && walking },
      { threshold: 0 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [walking])

  if (dims.w === 0) {
    // Server / pre-hydration: render empty placeholder
    return <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true" />
  }

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden="true"
    >
      <style>{`
        @keyframes node-pulse {
          0%,100% { r: 3; opacity: 0.9; }
          50%      { r: 3.6; opacity: 1; }
        }
      `}</style>

      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <filter id="hero-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <NetworkLayer nodes={nodes} connections={connections} dims={dims} />

        {!prefersReduced && (
          <Figure
            x={figX}
            y={figY}
            walking={walking}
            legPhase={legPhase}
          />
        )}
      </svg>
    </div>
  )
}
