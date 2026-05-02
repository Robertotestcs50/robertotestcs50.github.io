import { useState, useEffect, useCallback, lazy, Suspense, useRef } from 'react'
import { Eye, Code2 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

const DevMode = lazy(() => import('./DevMode'))

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

export default function DevModeToggle({ projects }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [everOpened, setEverOpened] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hovered, setHovered] = useState<'eye' | 'code' | null>(null)
  const pillRef = useRef<HTMLDivElement>(null)

  // Restore state from sessionStorage + first-visit hint
  useEffect(() => {
    const stored = sessionStorage.getItem('devMode')
    if (stored === 'true') {
      setEverOpened(true)
      setIsOpen(true)
    }

    const hintShown = localStorage.getItem('devModeHintShown')
    if (!hintShown) {
      const t1 = setTimeout(() => {
        setShowHint(true)
        const t2 = setTimeout(() => {
          setShowHint(false)
          localStorage.setItem('devModeHintShown', 'true')
        }, 4000)
        return () => clearTimeout(t2)
      }, 2000)
      return () => clearTimeout(t1)
    }
  }, [])

  const openDevMode = useCallback(() => {
    setEverOpened(true)
    setIsOpen(true)
    sessionStorage.setItem('devMode', 'true')
  }, [])

  const closeDevMode = useCallback(() => {
    setIsOpen(false)
    sessionStorage.setItem('devMode', 'false')
  }, [])

  // Global keyboard shortcut: D toggles dev mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      )
        return
      if (e.key === 'd' || e.key === 'D') {
        if (isOpen) closeDevMode()
        else openDevMode()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, openDevMode, closeDevMode])

  return (
    <>
      {/* Toggle pill */}
      <div
        ref={pillRef}
        role="group"
        aria-label="View mode"
        style={{
          position: 'fixed',
          top: 'clamp(1rem, 2vw, 1.25rem)',
          right: 'clamp(1rem, 2vw, 1.25rem)',
          zIndex: 300,
        }}
      >
        {/* Keyboard shortcut hint (first visit) */}
        <AnimatePresence>
          {showHint && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: 'rgba(18, 18, 18, 0.96)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem',
                padding: '0.375rem 0.75rem',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
                pointerEvents: 'none',
              }}
            >
              Press D for dev mode
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hover tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              key={hovered}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: '50%',
                transform: 'translateX(50%)',
                background: 'rgba(18, 18, 18, 0.96)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.625rem',
                whiteSpace: 'nowrap',
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.6)',
                pointerEvents: 'none',
              }}
            >
              {hovered === 'eye' ? 'Site view' : 'Dev view'}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: 72,
            height: 36,
            borderRadius: '9999px',
            background: 'rgba(20, 20, 20, 0.82)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '4px',
            gap: '4px',
          }}
        >
          {/* Eye — standard site */}
          <button
            aria-pressed={!isOpen}
            aria-label="Switch to standard view"
            onClick={closeDevMode}
            onMouseEnter={() => setHovered('eye')}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              background: !isOpen ? 'rgba(255,255,255,0.95)' : 'transparent',
              transition: 'background 200ms cubic-bezier(0.4,0,0.2,1)',
              flexShrink: 0,
            }}
          >
            <Eye
              size={13}
              style={{
                color: !isOpen
                  ? '#0A0A0A'
                  : hovered === 'eye'
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.45)',
                transition: 'color 200ms cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </button>

          {/* Code — dev mode */}
          <button
            aria-pressed={isOpen}
            aria-label="Switch to developer view"
            onClick={openDevMode}
            onMouseEnter={() => setHovered('code')}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              background: isOpen ? 'rgba(255,255,255,0.95)' : 'transparent',
              transition: 'background 200ms cubic-bezier(0.4,0,0.2,1)',
              flexShrink: 0,
            }}
          >
            <Code2
              size={13}
              style={{
                color: isOpen
                  ? '#0A0A0A'
                  : hovered === 'code'
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.45)',
                transition: 'color 200ms cubic-bezier(0.4,0,0.2,1)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Dev mode overlay — mounted once, visibility controlled via prop */}
      {everOpened && (
        <Suspense fallback={null}>
          <DevMode projects={projects} visible={isOpen} onClose={closeDevMode} />
        </Suspense>
      )}
    </>
  )
}
