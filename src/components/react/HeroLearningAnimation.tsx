// Hero Learning Animation — single RAF loop, direct DOM for figure,
// React state only for discrete events (node added, connection added).
// Persists to sessionStorage so the network survives page navigation.

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useReducedMotion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pt { x: number; y: number }
interface Dims { w: number; h: number }

interface NodeData {
  id: string
  xPct: number    // 0-1 fraction of container width
  yPct: number    // 0-1 fraction of container height
  pulseDelay: number  // CSS animation-delay for pulse
  appearing: boolean  // true during 2s fade-in
}

interface ConnData {
  id: string
  aIdx: number    // index into nodes array
  bIdx: number
  drawn: boolean  // false → hidden, true → CSS transition draws line
}

interface PendNode {
  wpIdx: number
  xPct: number
  yPct: number
  timer: number       // counts down: NODE_APPEAR_DELAY → 0 → then node added to state
  fadeElapsed: number // time elapsed since node was added (for appearing → pulsing switch)
  nodeId: string
  nodeIdx: number     // position in nodes array; -1 until assigned
  appearing: boolean  // true once added to React state
  connected: boolean  // true once connections have been added
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WALK_SPEED      = 35    // px / sec
const PAUSE_DUR       = 3.0   // s
const NODE_DELAY      = 1.0   // s after departure before node fades in
const NODE_FADE_DUR   = 2.0   // s for node appearance animation
const MAX_WP          = 12
const STALE_MS        = 30 * 60 * 1000
const STORAGE_KEY     = 'hero-anim-state'

// All waypoints as fractions of container — avoids the large title zone
const WAYPOINTS: Pt[] = [
  { x: 0.18, y: 0.42 }, { x: 0.72, y: 0.38 }, { x: 0.32, y: 0.78 },
  { x: 0.58, y: 0.82 }, { x: 0.84, y: 0.62 }, { x: 0.12, y: 0.68 },
  { x: 0.46, y: 0.30 }, { x: 0.66, y: 0.72 }, { x: 0.28, y: 0.55 },
  { x: 0.90, y: 0.45 }, { x: 0.38, y: 0.20 }, { x: 0.76, y: 0.58 },
]

// ─── Bezier helpers ───────────────────────────────────────────────────────────

function bPt(t: number, p0: Pt, p1: Pt, p2: Pt): Pt {
  const u = 1 - t
  return { x: u*u*p0.x + 2*u*t*p1.x + t*t*p2.x, y: u*u*p0.y + 2*u*t*p1.y + t*t*p2.y }
}

function bLen(p0: Pt, p1: Pt, p2: Pt, n = 16): number {
  let len = 0, prev = p0
  for (let i = 1; i <= n; i++) {
    const cur = bPt(i / n, p0, p1, p2)
    len += Math.hypot(cur.x - prev.x, cur.y - prev.y)
    prev = cur
  }
  return len
}

function ctrlPt(p0: Pt, p2: Pt, side: number): Pt {
  const dx = p2.x - p0.x, dy = p2.y - p0.y
  const len = Math.hypot(dx, dy) || 1
  const off = 40 + Math.random() * 20
  return {
    x: (p0.x + p2.x) / 2 + (-dy / len) * off * side,
    y: (p0.y + p2.y) / 2 + (dx / len) * off * side,
  }
}

// ─── Persistence ─────────────────────────────────────────────────────────────

interface Saved {
  nodes: Pick<NodeData, 'xPct' | 'yPct' | 'pulseDelay'>[]
  conns: { aIdx: number; bIdx: number }[]
  visited: number[]
  wpIdx: number
  savedAt: number
}

function loadSaved(): Saved | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const s: Saved = JSON.parse(raw)
    if (Date.now() - s.savedAt > STALE_MS) { sessionStorage.removeItem(STORAGE_KEY); return null }
    return s
  } catch { return null }
}

function writeSaved(s: Saved) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch {}
}

// ─── Memoised node ────────────────────────────────────────────────────────────

const NodeDot = React.memo(function NodeDot({
  n, dims,
}: { n: NodeData; dims: Dims }) {
  const cx = n.xPct * dims.w
  const cy = n.yPct * dims.h
  return (
    <g>
      <circle cx={cx} cy={cy} r={9}
        fill="rgba(200,230,255,0.1)"
        style={{ filter: 'blur(5px)', transformOrigin: `${cx}px ${cy}px` }}
      />
      <circle cx={cx} cy={cy} r={3}
        fill="rgba(255,255,255,0.9)"
        className={n.appearing ? 'ha-node-appear' : 'ha-node-pulse'}
        style={{
          transformOrigin: `${cx}px ${cy}px`,
          animationDelay: n.appearing ? '0s' : `${n.pulseDelay}s`,
        }}
      />
    </g>
  )
})

// ─── Memoised connection ──────────────────────────────────────────────────────

const ConnLine = React.memo(function ConnLine({
  c, nodes, dims,
}: { c: ConnData; nodes: NodeData[]; dims: Dims }) {
  const a = nodes[c.aIdx], b = nodes[c.bIdx]
  if (!a || !b) return null
  const x1 = a.xPct * dims.w, y1 = a.yPct * dims.h
  const x2 = b.xPct * dims.w, y2 = b.yPct * dims.h
  const len = Math.hypot(x2 - x1, y2 - y1)

  // Local offset that starts at len (hidden) and transitions to 0 when drawn
  const [off, setOff] = useState(len)
  useEffect(() => {
    if (c.drawn) { const id = requestAnimationFrame(() => setOff(0)); return () => cancelAnimationFrame(id) }
  }, [c.drawn, len])

  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
      stroke="rgba(200,230,255,0.18)" strokeWidth={0.7}
      strokeDasharray={len} strokeDashoffset={off}
      style={{ transition: c.drawn ? 'stroke-dashoffset 1.5s cubic-bezier(0.65,0,0.35,1)' : 'none' }}
    />
  )
})

// ─── Main component ───────────────────────────────────────────────────────────

export default function HeroLearningAnimation() {
  const containerRef  = useRef<HTMLDivElement>(null)
  const figGroupRef   = useRef<SVGGElement>(null)
  const leftArmRef    = useRef<SVGLineElement>(null)
  const rafRef        = useRef(0)
  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isVisRef      = useRef(true)
  const dimsRef       = useRef<Dims>({ w: 0, h: 0 })
  const prefersReduced = useReducedMotion()

  // Mirror refs — keep in sync with React state so RAF closure can read latest
  const nodesRef = useRef<NodeData[]>([])
  const connsRef = useRef<ConnData[]>([])

  const [nodes, setNodes]   = useState<NodeData[]>([])
  const [conns, setConns]   = useState<ConnData[]>([])
  const [dims,  setDims]    = useState<Dims>({ w: 0, h: 0 })

  // ── Discrete state mutators (called from RAF, safe because functional) ──────
  const addNode = useCallback((nd: NodeData): number => {
    nodesRef.current = [...nodesRef.current, nd]
    setNodes([...nodesRef.current])
    return nodesRef.current.length - 1
  }, [])

  const markNodePulsing = useCallback((id: string) => {
    nodesRef.current = nodesRef.current.map(n => n.id === id ? { ...n, appearing: false } : n)
    setNodes([...nodesRef.current])
  }, [])

  const addConns = useCallback((cs: ConnData[]) => {
    connsRef.current = [...connsRef.current, ...cs]
    setConns([...connsRef.current])
    const ids = new Set(cs.map(c => c.id))
    requestAnimationFrame(() => {
      connsRef.current = connsRef.current.map(c => ids.has(c.id) ? { ...c, drawn: true } : c)
      setConns([...connsRef.current])
    })
  }, [])

  // ── Debounced session save ────────────────────────────────────────────────────
  const scheduleSave = useCallback((wpIdx: number, visited: number[]) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      writeSaved({
        nodes: nodesRef.current.map(n => ({ xPct: n.xPct, yPct: n.yPct, pulseDelay: n.pulseDelay })),
        conns: connsRef.current.map(c => ({ aIdx: c.aIdx, bIdx: c.bIdx })),
        visited,
        wpIdx,
        savedAt: Date.now(),
      })
    }, 100)
  }, [])

  // ── Main effect ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (prefersReduced) return

    const container = containerRef.current
    if (!container) return

    // ── ResizeObserver ──
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      dimsRef.current = { w: width, h: height }
      setDims({ w: width, h: height })
    })
    ro.observe(container)

    // ── IntersectionObserver ──
    const io = new IntersectionObserver(([e]) => { isVisRef.current = e.isIntersecting }, { threshold: 0 })
    io.observe(container)

    // ── Visibility change (pause when tab hidden) ──
    const onVisChange = () => {
      if (document.hidden) cancelAnimationFrame(rafRef.current)
      else rafRef.current = requestAnimationFrame(loop)
    }
    document.addEventListener('visibilitychange', onVisChange)

    // ── Restore or fresh start ──
    const saved = loadSaved()
    let visitedSet = new Set<number>()
    let startWpIdx = 0

    if (saved && saved.nodes.length > 0) {
      const restored: NodeData[] = saved.nodes.map((n, i) => ({
        id: `rn${i}`, xPct: n.xPct, yPct: n.yPct, pulseDelay: n.pulseDelay, appearing: false,
      }))
      nodesRef.current = restored
      setNodes([...restored])

      const restoredConns: ConnData[] = saved.conns.map(c => ({
        id: `rc-${c.aIdx}-${c.bIdx}`, aIdx: c.aIdx, bIdx: c.bIdx, drawn: true,
      }))
      connsRef.current = restoredConns
      setConns([...restoredConns])

      visitedSet = new Set(saved.visited)
      startWpIdx = saved.wpIdx % WAYPOINTS.length
    }

    // ── Mutable animation state (NOT React state) ──
    const st = {
      phase: 'pausing' as 'walking' | 'pausing',
      phaseElapsed: PAUSE_DUR,  // start by immediately leaving to next waypoint
      wpIdx: startWpIdx,        // current waypoint (we're here or leaving from here)

      // Bezier path
      p0: { x: 0, y: 0 } as Pt,
      p1: { x: 0, y: 0 } as Pt,
      p2: { x: 0, y: 0 } as Pt,
      pathT: 0,
      pathDur: 1,
      figX: 0,
      figY: 0,

      // Leg / body
      legPhase: 0,
      breathPhase: 0,
      swayPhase: 0,
      armAngle: 0,
      pauseCount: visitedSet.size,

      // Visited tracking
      visitedSet,

      // Pending nodes
      pending: [] as PendNode[],

      // Control point side alternation
      ctrlSide: 1 as 1 | -1,

      // Timing
      lastSaveTimer: 0,
      prevTimestamp: 0,
    }

    // Position figure at start waypoint
    const initD = dimsRef.current
    st.figX = WAYPOINTS[startWpIdx].x * (initD.w || 800)
    st.figY = WAYPOINTS[startWpIdx].y * (initD.h || 500)

    // ── DOM updater (called every frame, no React) ──
    const updateFigDOM = () => {
      const fig = figGroupRef.current
      if (!fig) return

      const breathScale = st.phase === 'pausing'
        ? 1 + 0.02 * Math.sin(st.breathPhase * Math.PI * 2) : 1
      const sway = st.phase === 'pausing'
        ? Math.sin(st.swayPhase * Math.PI * 2) : 0
      const swX = st.figX + sway
      const swY = st.figY

      fig.setAttribute('transform', `translate(${swX},${swY}) scale(${breathScale})`)

      // Legs
      const swing = Math.sin(st.legPhase * Math.PI * 2) * 6
      const legL = fig.querySelector<SVGLineElement>('.ha-leg-l')
      const legR = fig.querySelector<SVGLineElement>('.ha-leg-r')
      if (legL) { legL.setAttribute('x2', String(-swing)); legL.setAttribute('y2', '0') }
      if (legR) { legR.setAttribute('x2', String(swing)); legR.setAttribute('y2', '0') }

      // Arm (raises at every 3rd pause, during the middle of the pause)
      const lArm = leftArmRef.current
      if (lArm) {
        const rad = (st.armAngle * Math.PI) / 180
        lArm.setAttribute('x2', String(-9 * Math.cos(rad)))
        lArm.setAttribute('y2', String(-9 * Math.sin(rad) - 23))
      }
    }

    // ── Transition to walking state ──
    const startWalking = () => {
      const d = dimsRef.current
      const leavingIdx = st.wpIdx   // the waypoint we're about to leave
      const wp = WAYPOINTS[leavingIdx]
      const toIdx = (leavingIdx + 1) % WAYPOINTS.length
      const to = WAYPOINTS[toIdx]

      // Node for the waypoint we're LEAVING — countdown starts NOW (figure just left)
      const isNew = !st.visitedSet.has(leavingIdx) && nodesRef.current.length < MAX_WP
      if (isNew) {
        st.visitedSet.add(leavingIdx)
        st.pending.push({
          wpIdx: leavingIdx,
          xPct: wp.x, yPct: wp.y,
          timer: NODE_DELAY,   // 1.0s from this exact moment
          fadeElapsed: 0,
          nodeId: `n${Date.now()}-${leavingIdx}`,
          nodeIdx: -1,
          appearing: false,
          connected: false,
        })
      }

      st.p0 = { x: wp.x * d.w, y: wp.y * d.h }
      st.p2 = { x: to.x * d.w, y: to.y * d.h }
      st.p1 = ctrlPt(st.p0, st.p2, st.ctrlSide)
      st.ctrlSide = -st.ctrlSide as 1 | -1
      st.pathT = 0
      st.pathDur = bLen(st.p0, st.p1, st.p2) / WALK_SPEED
      st.wpIdx = toIdx
      st.phase = 'walking'
      st.phaseElapsed = 0
    }

    // ── Arrive at waypoint ──
    const arriveAtWaypoint = () => {
      st.phase = 'pausing'
      st.phaseElapsed = 0
      st.legPhase = 0
      st.armAngle = 0
      st.pauseCount++

      const d = dimsRef.current
      const wp = WAYPOINTS[st.wpIdx]

      // Snap figure to exact waypoint (node creation deferred until startWalking)
      st.figX = wp.x * d.w
      st.figY = wp.y * d.h
    }

    // ── Advance pending nodes ──
    const advancePending = (dt: number) => {
      for (const p of st.pending) {
        if (!p.appearing) {
          p.timer -= dt
          if (p.timer <= 0) {
            // Add node to React state
            p.nodeIdx = addNode({
              id: p.nodeId,
              xPct: p.xPct, yPct: p.yPct,
              pulseDelay: Math.random() * 3,
              appearing: true,
            })
            p.appearing = true
          }
        } else if (!p.connected) {
          p.fadeElapsed += dt
          if (p.fadeElapsed >= NODE_FADE_DUR) {
            // Node fully appeared — switch to pulsing, add connections
            markNodePulsing(p.nodeId)
            if (p.nodeIdx > 0) {
              const cs: ConnData[] = []
              for (let i = 0; i < p.nodeIdx; i++) {
                const key = `c-${Math.min(i, p.nodeIdx)}-${Math.max(i, p.nodeIdx)}`
                if (!connsRef.current.some(c => c.id === key)) {
                  cs.push({ id: key, aIdx: i, bIdx: p.nodeIdx, drawn: false })
                }
              }
              if (cs.length > 0) addConns(cs)
            }
            p.connected = true
          }
        }
      }
      // Clean up fully processed pending nodes
      st.pending = st.pending.filter(p => !p.connected)
    }

    // ── Main animation loop ──
    let totalElapsed = 0

    const loop = (ts: DOMHighResTimeStamp) => {
      if (document.hidden) { rafRef.current = requestAnimationFrame(loop); return }

      const dt = st.prevTimestamp === 0 ? 0 : Math.min((ts - st.prevTimestamp) / 1000, 0.05)
      st.prevTimestamp = ts
      totalElapsed += dt

      if (!isVisRef.current) {
        // Tab visible but component scrolled out — keep RAF alive, skip updates
        rafRef.current = requestAnimationFrame(loop)
        return
      }

      const d = dimsRef.current
      if (d.w === 0) { rafRef.current = requestAnimationFrame(loop); return }

      // ── Advance phase ──
      if (st.phase === 'walking') {
        st.legPhase = (st.legPhase + dt / 0.6) % 1  // step every 0.6s
        st.phaseElapsed += dt
        st.pathT = Math.min(1, st.pathT + dt / st.pathDur)

        const pos = bPt(st.pathT, st.p0, st.p1, st.p2)
        st.figX = pos.x
        st.figY = pos.y

        if (st.pathT >= 1) arriveAtWaypoint()

      } else {
        // Pausing — breathing + sway + arm
        st.phaseElapsed += dt
        st.breathPhase += dt / 3
        st.swayPhase   += dt / 4

        // Arm raise at every 3rd pause (0-indexed), during middle of pause
        const doArm = st.pauseCount % 3 === 2
        if (doArm) {
          const t = st.phaseElapsed
          if (t >= 0.9 && t < 1.5) {
            st.armAngle = ((t - 0.9) / 0.6) * 30
          } else if (t >= 1.5 && t < 2.1) {
            st.armAngle = (1 - (t - 1.5) / 0.6) * 30
          } else {
            st.armAngle = 0
          }
        }

        if (st.phaseElapsed >= PAUSE_DUR) startWalking()
      }

      // ── Advance pending node timers ──
      advancePending(dt)

      // ── Direct DOM update for figure ──
      updateFigDOM()

      // ── Debounced persistence save every 2s ──
      st.lastSaveTimer += dt
      if (st.lastSaveTimer >= 2) {
        st.lastSaveTimer = 0
        scheduleSave(st.wpIdx, Array.from(st.visitedSet))
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    // Save on page unload
    const onUnload = () => scheduleSave(st.wpIdx, Array.from(st.visitedSet))
    window.addEventListener('beforeunload', onUnload)

    rafRef.current = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafRef.current)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisChange)
      window.removeEventListener('beforeunload', onUnload)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReduced])

  // ── Reduced motion: static full network ──────────────────────────────────────
  if (prefersReduced) {
    return (
      <div
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
        aria-hidden="true"
      >
        <StaticNetwork />
      </div>
    )
  }

  // ── Normal render ─────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
      aria-hidden="true"
    >
      {dims.w > 0 && (
        <svg
          width={dims.w} height={dims.h}
          style={{ display: 'block', overflow: 'visible' }}
        >
          {/* Connections (below nodes) */}
          {conns.map(c => (
            <ConnLine key={c.id} c={c} nodes={nodes} dims={dims} />
          ))}

          {/* Nodes */}
          {nodes.map(n => (
            <NodeDot key={n.id} n={n} dims={dims} />
          ))}

          {/* Walking figure — position driven by direct DOM manipulation */}
          <g ref={figGroupRef}>
            <circle r={4} cy={-32} fill="none" stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} />
            <line x1={0} y1={-28} x2={0} y2={-14} stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} strokeLinecap="round" />
            <line ref={leftArmRef} x1={0} y1={-23} x2={-9} y2={-23} stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} strokeLinecap="round" />
            <line x1={0} y1={-23} x2={9} y2={-23} stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} strokeLinecap="round" />
            <line className="ha-leg-l" x1={0} y1={-14} x2={-6} y2={0} stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} strokeLinecap="round" />
            <line className="ha-leg-r" x1={0} y1={-14} x2={6} y2={0} stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} strokeLinecap="round" />
          </g>
        </svg>
      )}
    </div>
  )
}

// ─── Reduced-motion static fallback ──────────────────────────────────────────

function StaticNetwork() {
  const [dims, setDims] = useState<Dims>({ w: 0, h: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      setDims({ w: e.contentRect.width, h: e.contentRect.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (dims.w === 0) return <div ref={ref} style={{ position: 'absolute', inset: 0 }} />

  const nodes = WAYPOINTS.map((wp, i) => ({
    cx: wp.x * dims.w, cy: wp.y * dims.h,
  }))

  return (
    <div ref={ref} style={{ position: 'absolute', inset: 0 }}>
      <svg width={dims.w} height={dims.h} style={{ display: 'block' }}>
        {nodes.map((a, i) => nodes.slice(i + 1).map((b, j) => (
          <line key={`s-${i}-${j}`}
            x1={a.cx} y1={a.cy} x2={b.cx} y2={b.cy}
            stroke="rgba(200,230,255,0.18)" strokeWidth={0.7}
          />
        )))}
        {nodes.map((n, i) => (
          <g key={`sn-${i}`}>
            <circle cx={n.cx} cy={n.cy} r={9} fill="rgba(200,230,255,0.1)" style={{ filter: 'blur(5px)' }} />
            <circle cx={n.cx} cy={n.cy} r={3} fill="rgba(255,255,255,0.9)" />
          </g>
        ))}
        {/* Static figure at first waypoint */}
        <g transform={`translate(${WAYPOINTS[0].x * dims.w},${WAYPOINTS[0].y * dims.h})`}>
          <circle r={4} cy={-32} fill="none" stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} />
          <line x1={0} y1={-28} x2={0} y2={-14} stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} />
          <line x1={-9} y1={-23} x2={9} y2={-23} stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} />
          <line x1={0} y1={-14} x2={-6} y2={0} stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} />
          <line x1={0} y1={-14} x2={6} y2={0} stroke="rgba(255,255,255,0.48)" strokeWidth={1.2} />
        </g>
      </svg>
    </div>
  )
}
