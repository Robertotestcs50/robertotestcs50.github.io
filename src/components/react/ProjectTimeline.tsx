// === ADDING NEW PROJECTS ===
// 1. Create a new MDX file in src/content/projects/
// 2. (Optional) Add a location field — not required for the timeline
// 3. Set the order field to control sort on /work
// 4. Set featured: true to include on the home page (max 4)
// No code changes needed here — the timeline adapts automatically.

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ProjectData {
  slug: string
  title: string
  subtitle: string
  date: string
  location: { city: string; country: string; lat: number; lng: number } | null
  cover: string
}

interface Props {
  projects: ProjectData[]
}

function getYear(iso: string) {
  return new Date(iso).getFullYear()
}

function getMonthYear(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// Bug 2: clear devMode session before navigating from timeline
function navigateToProject(slug: string) {
  sessionStorage.removeItem('devMode')
  window.location.href = `/projects/${slug}`
}

// ─── Project node ─────────────────────────────────────────────────────────────

function ProjectNode({
  project,
  above,
  prefersReduced,
}: {
  project: ProjectData
  above: boolean
  prefersReduced: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const content = (
    <div
      onClick={() => navigateToProject(project.slug)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', width: 190, gap: '0.6rem' }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 160,
          height: 90,
          borderRadius: '0.5rem',
          overflow: 'hidden',
          flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.07)',
          transform: hovered && !prefersReduced ? 'scale(1.04)' : 'scale(1)',
          transition: prefersReduced ? 'none' : 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <img
          src={project.cover}
          alt={project.title}
          width={160}
          height={90}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Text */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.08em',
            color: '#71717A',
            textTransform: 'uppercase',
            marginBottom: '0.25rem',
          }}
        >
          {getMonthYear(project.date)}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px',
            fontWeight: 500,
            color: hovered ? '#C8E6FF' : '#FAFAFA',
            transition: prefersReduced ? 'none' : 'color 0.2s ease',
            lineHeight: 1.25,
            marginBottom: '0.2rem',
          }}
        >
          {project.title}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: '#71717A',
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            maxWidth: 190,
          }}
        >
          {project.subtitle}
        </div>
      </div>
    </div>
  )

  const STEM_H = 40
  const dotStyle: React.CSSProperties = {
    width: 12,
    height: 12,
    borderRadius: '50%',
    background: '#C8E6FF',
    boxShadow: hovered ? '0 0 12px rgba(200,230,255,0.7)' : '0 0 6px rgba(200,230,255,0.35)',
    flexShrink: 0,
    position: 'relative',
    zIndex: 2,
    transform: hovered && !prefersReduced ? 'scale(1.5)' : 'scale(1)',
    transition: prefersReduced ? 'none' : 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
  }
  const stemStyle: React.CSSProperties = {
    width: 1,
    flex: 1,
    background: 'rgba(255,255,255,0.1)',
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        width: 190,
      }}
    >
      {above ? (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column-reverse',
              alignItems: 'center',
              gap: '0.6rem',
              paddingBottom: STEM_H,
            }}
          >
            {content}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              height: STEM_H,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
            }}
          >
            <div style={stemStyle} />
            <div style={{ ...dotStyle, marginBottom: -6 }} />
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: STEM_H }}>
            <div style={{ ...dotStyle, marginTop: -6 }} />
            <div style={stemStyle} />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.6rem',
              paddingTop: '0.5rem',
            }}
          >
            {content}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

export default function ProjectTimeline({ projects }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const prefersReduced = useReducedMotion() ?? false
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  const sorted = [...projects].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const yearPositions: Record<number, number> = {}
  sorted.forEach((p, i) => {
    const yr = getYear(p.date)
    if (!(yr in yearPositions)) yearPositions[yr] = i
  })

  const handleScroll = useCallback(() => {
    if (!scrolled) {
      setScrolled(true)
      setTimeout(() => setShowHint(false), 600)
    }
  }, [scrolled])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Bug 4: convert vertical mouse-wheel to horizontal scroll (non-passive so we can preventDefault)
  useEffect(() => {
    const el = scrollRef.current
    if (!el || isMobile) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault()
        el.scrollLeft += e.deltaY
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [isMobile])

  const COL_W = 190
  const GAP = 88
  const ABOVE_H = 280
  const BELOW_H = 280
  const TOTAL_H = ABOVE_H + 1 + BELOW_H
  const totalWidth = sorted.length * (COL_W + GAP) + 160

  if (isMobile) {
    return (
      <div style={{ overflowY: 'auto', height: '100%', padding: '2rem 1.5rem', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '2rem', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingLeft: '3rem' }}>
          {sorted.map((project, i) => (
            <div key={project.slug} style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '-3.4rem',
                  top: 4,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#C8E6FF',
                  boxShadow: '0 0 6px rgba(200,230,255,0.4)',
                }}
              />
              {yearPositions[getYear(project.date)] === i && (
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.2)',
                    textTransform: 'uppercase',
                    marginBottom: '0.5rem',
                  }}
                >
                  {getYear(project.date)}
                </div>
              )}
              <div onClick={() => navigateToProject(project.slug)} style={{ cursor: 'pointer' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.07em', color: '#71717A', textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                  {getMonthYear(project.date)}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '15px', fontWeight: 500, color: '#FAFAFA', marginBottom: '0.25rem' }}>
                  {project.title}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#71717A', lineHeight: 1.4, marginBottom: '0.75rem' }}>
                  {project.subtitle}
                </div>
                <img
                  src={project.cover}
                  alt={project.title}
                  style={{ width: '100%', borderRadius: '0.5rem', display: 'block', border: '1px solid rgba(255,255,255,0.07)' }}
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {/* Left fade */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to right, #0A0A0A, transparent)', zIndex: 5, pointerEvents: 'none' }} />
      {/* Right fade */}
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(to left, #0A0A0A, transparent)', zIndex: 5, pointerEvents: 'none' }} />

      {/* Scroll hint */}
      {showHint && !prefersReduced && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: scrolled ? 0 : 0.65, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-mono)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          ← scroll →
        </motion.div>
      )}

      {/* Scrollable strip — Bug 4: WebkitOverflowScrolling for iOS */}
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        } as React.CSSProperties}
      >
        <div
          style={{
            width: totalWidth,
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 120,
            paddingRight: 120,
          }}
        >
          {/* Axis line */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(255,255,255,0.08)', transform: 'translateY(-50%)' }} />

          {/* Year markers */}
          {Object.entries(yearPositions).map(([year, itemIdx]) => {
            const xPos = 120 + itemIdx * (COL_W + GAP) - GAP / 2
            return (
              <div
                key={year}
                style={{ position: 'absolute', left: xPos, top: 0, bottom: 0, width: 1, borderLeft: '1px dashed rgba(255,255,255,0.06)', zIndex: 0 }}
              >
                <div style={{ position: 'absolute', top: '1.5rem', left: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '10px', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase' }}>
                  {year}
                </div>
              </div>
            )
          })}

          {/* Project nodes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: GAP, position: 'relative', zIndex: 1, height: TOTAL_H }}>
            {sorted.map((project, i) => {
              const above = i % 2 === 0
              return (
                <div
                  key={project.slug}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: above ? 'flex-end' : 'flex-start',
                    height: TOTAL_H,
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      alignItems: 'center',
                      justifyContent: above ? 'flex-end' : 'flex-start',
                      paddingBottom: above ? BELOW_H : 0,
                      paddingTop: above ? 0 : ABOVE_H,
                    }}
                  >
                    <ProjectNode
                      project={project}
                      above={above}
                      prefersReduced={prefersReduced}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
