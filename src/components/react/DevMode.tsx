import { useEffect, useRef, lazy, Suspense, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { JOURNEY } from '../../lib/travel-journey'

const ProjectGlobe = lazy(() => import('./ProjectGlobe'))
const ProjectTimeline = lazy(() => import('./ProjectTimeline'))
const Guestbook = lazy(() => import('./Guestbook'))

interface ProjectData {
  slug: string
  title: string
  subtitle: string
  date: string
  location: { city: string; country: string; lat: number; lng: number } | null
  cover: string
}

type ViewMode = 'globe' | 'timeline'

interface Props {
  projects: ProjectData[]
  visible: boolean
  onClose: () => void
  activeView: ViewMode
  onViewChange: (v: ViewMode) => void
}

// ─── Loading spinner ──────────────────────────────────────────────────────────

function LoadingSpinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <div style={{
        width: 20, height: 20,
        border: '2px solid rgba(255,255,255,0.08)',
        borderTopColor: '#C8E6FF',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Sub-toggle ───────────────────────────────────────────────────────────────

function SubToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div role="group" aria-label="Visualization mode" style={{
      display: 'inline-flex', alignItems: 'center',
      borderRadius: '9999px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      padding: '3px', gap: '2px',
    }}>
      {(['globe', 'timeline'] as ViewMode[]).map((v) => {
        const active = view === v
        return (
          <button key={v} aria-pressed={active} onClick={() => onChange(v)} style={{
            padding: '0.3rem 0.875rem', borderRadius: '9999px', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'background 180ms ease, color 180ms ease',
            background: active ? 'rgba(255,255,255,0.95)' : 'transparent',
            color: active ? '#0A0A0A' : 'rgba(255,255,255,0.45)',
          }}>
            {v}
          </button>
        )
      })}
    </div>
  )
}

// ─── DevMode overlay ──────────────────────────────────────────────────────────

export default function DevMode({ projects, visible, onClose, activeView, onViewChange }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const prevFocusRef = useRef<HTMLElement | null>(null)
  const prefersReduced = useReducedMotion()

  // ── Issue 4: Dynamic stats ────────────────────────────────────────────────
  const projectCount = projects.length

  // Countries from both project locations AND full JOURNEY
  const projectCountries = new Set(
    projects.filter((p) => p.location).map((p) => p.location!.country)
  )
  const journeyCountries = new Set(JOURNEY.map((s) => s.country))
  const countryCount = new Set([...projectCountries, ...journeyCountries]).size

  // Age calculated from birth date (March 2004)
  const birthDate = new Date('2004-03-15')
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const bm = today.getMonth() - birthDate.getMonth()
  if (bm < 0 || (bm === 0 && today.getDate() < birthDate.getDate())) age--

  // Body scroll lock + focus management
  useEffect(() => {
    if (visible) {
      prevFocusRef.current = document.activeElement as HTMLElement
      document.body.dataset.devmode = 'open'
      const t = setTimeout(() => {
        const first = overlayRef.current?.querySelector<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        )
        first?.focus()
      }, 200)
      return () => clearTimeout(t)
    } else {
      delete document.body.dataset.devmode
      prevFocusRef.current?.focus()
    }
  }, [visible])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const el = overlayRef.current
    if (!el) return
    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }, [])

  const motionProps = prefersReduced
    ? { initial: {}, animate: {}, exit: {} }
    : { initial: { opacity: 0, scale: 0.985 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0 } }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={overlayRef}
          role="dialog" aria-modal="true" aria-label="Developer view of projects"
          onKeyDown={handleKeyDown}
          {...motionProps}
          transition={prefersReduced ? { duration: 0 } : { duration: 0.2 }}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: '#0A0A0A', display: 'flex', flexDirection: 'column' }}
        >
          {/* Top bar */}
          <div style={{
            height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 1.5rem', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%', background: '#C8E6FF', flexShrink: 0,
                animation: prefersReduced ? 'none' : 'dmPulse 2s ease-in-out infinite',
              }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.12em', color: '#C8E6FF', textTransform: 'uppercase' }}>
                Dev Mode
              </span>
            </div>

            <SubToggle view={activeView} onChange={onViewChange} />

            <div style={{ width: 80 }} />
          </div>

          {/* Main canvas area */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait">
              {activeView === 'globe' ? (
                <motion.div key="globe"
                  initial={prefersReduced ? {} : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReduced ? {} : { opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProjectGlobe projects={projects} onSwitchToTimeline={() => onViewChange('timeline')} />
                  </Suspense>
                </motion.div>
              ) : (
                <motion.div key="timeline"
                  initial={prefersReduced ? {} : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReduced ? {} : { opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ position: 'absolute', inset: 0 }}
                >
                  <Suspense fallback={<LoadingSpinner />}>
                    <ProjectTimeline projects={projects} />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Issue 3: Guestbook — floating bottom-left */}
            <div style={{ position: 'absolute', bottom: '1rem', left: '1.5rem', zIndex: 20 }}>
              <Suspense fallback={null}>
                <Guestbook />
              </Suspense>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{
            height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 1.5rem', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            {/* Issue 4: dynamic stats */}
            <div className="devmode-overlay-content" style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              letterSpacing: '0.08em', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
            }}>
              {projectCount} Projects&nbsp;·&nbsp;{countryCount} Countries&nbsp;·&nbsp;{age} Years
            </div>

            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: '10px',
              letterSpacing: '0.08em', color: 'rgba(255,255,255,0.18)', textTransform: 'uppercase',
            }}>
              ESC to exit
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
