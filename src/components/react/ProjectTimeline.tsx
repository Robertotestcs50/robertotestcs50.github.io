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
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  })
}

// ─── Project node ─────────────────────────────────────────────────────────────

function ProjectNode({
  project,
  above,
  isFirst,
  prefersReduced,
}: {
  project: ProjectData
  above: boolean
  isFirst: boolean
  prefersReduced: boolean
}) {
  const [hovered, setHovered] = useState(false)

  const nodeVariants = {
    rest: { scale: 1 },
    hover: { scale: prefersReduced ? 1 : 1.5 },
  }

  const thumbVariants = {
    rest: { scale: 1, boxShadow: '0 0 0 rgba(0,0,0,0)' },
    hover: {
      scale: prefersReduced ? 1 : 1.04,
      boxShadow: prefersReduced ? '0 0 0' : '0 8px 32px rgba(0,0,0,0.6)',
    },
  }

  const dotPulse = prefersReduced
    ? {}
    : {
        animate: hovered
          ? {
              boxShadow: [
                '0 0 0 0 rgba(255,92,0,0.6)',
                '0 0 0 8px rgba(255,92,0,0)',
                '0 0 0 0 rgba(255,92,0,0)',
              ],
            }
          : {},
        transition: { duration: 1.5, repeat: Infinity },
      }

  const content = (
    <a
      href={`/projects/${project.slug}`}
      style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        variants={{ rest: {}, hover: {} }}
        initial="rest"
        animate={hovered ? 'hover' : 'rest'}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: 190,
          gap: '0.6rem',
          cursor: 'pointer',
        }}
      >
        {/* Thumbnail */}
        <motion.div
          variants={thumbVariants}
          transition={{ duration: prefersReduced ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
          style={{
            width: 160,
            height: 90,
            borderRadius: '0.5rem',
            overflow: 'hidden',
            flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <img
            src={project.cover}
            alt={project.title}
            width={160}
            height={90}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            loading="lazy"
            decoding="async"
          />
        </motion.div>

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
              color: hovered ? '#FF5C00' : '#FAFAFA',
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
      </motion.div>
    </a>
  )

  // Above: thumb + text above the axis
  // Below: thumb + text below the axis
  const STEM_H = 40 // px from axis line to node dot

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
          {/* Content above */}
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
          {/* Stem */}
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
            <div
              style={{
                width: 1,
                flex: 1,
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(255,255,255,0.12))',
              }}
            />
            {/* Node dot */}
            <motion.div
              variants={nodeVariants}
              animate={hovered ? 'hover' : 'rest'}
              transition={{ duration: prefersReduced ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] }}
              {...dotPulse}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: hovered ? '#FF5C00' : '#FF5C00',
                boxShadow: hovered
                  ? '0 0 12px rgba(255,92,0,0.7)'
                  : '0 0 6px rgba(255,92,0,0.35)',
                flexShrink: 0,
                marginBottom: -6,
                position: 'relative',
                zIndex: 2,
              }}
            />
          </div>
        </>
      ) : (
        <>
          {/* Node dot + stem */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              height: STEM_H,
            }}
          >
            <motion.div
              variants={nodeVariants}
              animate={hovered ? 'hover' : 'rest'}
              transition={{ duration: prefersReduced ? 0 : 0.2, ease: [0.4, 0, 0.2, 1] }}
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#FF5C00',
                boxShadow: hovered
                  ? '0 0 12px rgba(255,92,0,0.7)'
                  : '0 0 6px rgba(255,92,0,0.35)',
                flexShrink: 0,
                marginTop: -6,
                position: 'relative',
                zIndex: 2,
              }}
            />
            <div
              style={{
                width: 1,
                flex: 1,
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0.12), rgba(255,255,255,0.05))',
              }}
            />
          </div>
          {/* Content below */}
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

// ─── Timeline component ───────────────────────────────────────────────────────

export default function ProjectTimeline({ projects }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)
  const [showHint, setShowHint] = useState(true)
  const isMobile =
    typeof window !== 'undefined' && window.innerWidth < 768
  const prefersReduced = useReducedMotion() ?? false

  // Sort chronologically ascending
  const sorted = [...projects].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  )

  // Compute year boundaries
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

  // Column width + gap
  const COL_W = 190
  const GAP = 88
  const AXIS_H = 1 // height of the axis line in px
  // The axis sits at the vertical midpoint. We allocate vertical space for items above + below.
  const ABOVE_H = 280 // px for content above axis
  const BELOW_H = 280 // px for content below axis
  const TOTAL_H = ABOVE_H + AXIS_H + BELOW_H

  if (isMobile) {
    // Vertical layout on mobile
    return (
      <div
        style={{
          overflowY: 'auto',
          height: '100%',
          padding: '2rem 1.5rem',
          position: 'relative',
        }}
      >
        {/* Vertical axis */}
        <div
          style={{
            position: 'absolute',
            left: '2rem',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'rgba(255,255,255,0.08)',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingLeft: '3rem' }}>
          {sorted.map((project, i) => (
            <div key={project.slug} style={{ position: 'relative' }}>
              {/* Node dot */}
              <div
                style={{
                  position: 'absolute',
                  left: '-3.4rem',
                  top: 4,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#FF5C00',
                  boxShadow: '0 0 6px rgba(255,92,0,0.4)',
                }}
              />
              {/* Year label if first of year */}
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
              <a
                href={`/projects/${project.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.07em',
                    color: '#71717A',
                    textTransform: 'uppercase',
                    marginBottom: '0.3rem',
                  }}
                >
                  {getMonthYear(project.date)}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '15px',
                    fontWeight: 500,
                    color: '#FAFAFA',
                    marginBottom: '0.25rem',
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
                    marginBottom: '0.75rem',
                  }}
                >
                  {project.subtitle}
                </div>
                <img
                  src={project.cover}
                  alt={project.title}
                  style={{
                    width: '100%',
                    borderRadius: '0.5rem',
                    display: 'block',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                  loading="lazy"
                />
              </a>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Desktop: horizontal scroll ─────────────────────────────────────────────

  const totalItems = sorted.length
  const totalWidth = totalItems * (COL_W + GAP) + 160 // extra padding

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {/* Left fade mask */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 80,
          background: 'linear-gradient(to right, #0A0A0A, transparent)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />
      {/* Right fade mask */}
      <div
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: 80,
          background: 'linear-gradient(to left, #0A0A0A, transparent)',
          zIndex: 5,
          pointerEvents: 'none',
        }}
      />

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

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '100%',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
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
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: '50%',
              height: AXIS_H,
              background: 'rgba(255,255,255,0.08)',
              transform: 'translateY(-50%)',
            }}
          />

          {/* Year markers */}
          {Object.entries(yearPositions).map(([year, itemIdx]) => {
            const xPos = 120 + itemIdx * (COL_W + GAP) - GAP / 2
            return (
              <div
                key={year}
                style={{
                  position: 'absolute',
                  left: xPos,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  borderLeft: '1px dashed rgba(255,255,255,0.06)',
                  zIndex: 0,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '1.5rem',
                    left: '0.5rem',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    letterSpacing: '0.08em',
                    color: 'rgba(255,255,255,0.18)',
                    textTransform: 'uppercase',
                  }}
                >
                  {year}
                </div>
              </div>
            )
          })}

          {/* Project nodes */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: GAP,
              position: 'relative',
              zIndex: 1,
              height: TOTAL_H,
            }}
          >
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
                  {above ? (
                    // Content in the top half + node at center
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingBottom: BELOW_H,
                      }}
                    >
                      <ProjectNode
                        project={project}
                        above={true}
                        isFirst={i === 0}
                        prefersReduced={prefersReduced ?? false}
                      />
                    </div>
                  ) : (
                    // Node at center + content in bottom half
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        paddingTop: ABOVE_H,
                      }}
                    >
                      <ProjectNode
                        project={project}
                        above={false}
                        isFirst={i === 0}
                        prefersReduced={prefersReduced ?? false}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
