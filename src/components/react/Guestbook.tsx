/**
 * GUESTBOOK BACKEND
 *
 * Entries are stored in a Cloudflare Worker + KV.
 *
 * Setup (one-time):
 *   1. Deploy the Worker — see /cloudflare-worker/README.md
 *   2. Replace WORKER_URL below with your Worker's URL
 *
 * Free tier limits (impossible to hit for a portfolio):
 *   - 100,000 reads per day
 *   - 1,000 writes per day
 *   - Storage: 1 GB
 *
 * View entries:
 *   Cloudflare Dashboard → Workers & Pages → KV → guestbook-entries
 *
 * Spam protection:
 *   - Rate limit: 3 submissions per IP per hour (handled in Worker)
 *   - Honeypot field: bots fill it, humans don't
 *   - Max name 30 chars, max message 80 chars
 */

// ─── UPDATE THIS after deploying the Worker ────────────────────────────────
const WORKER_URL = 'https://guestbook.robertozuca27.workers.dev'
// ──────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'

interface Entry {
  name: string
  country: string
  message: string
  date: string
}

const LOCAL_KEY = 'guestbook-local'
const MAX_DISPLAY = 50

// ─── Country picker data ──────────────────────────────────────────────────────
const COUNTRIES = [
  { flag: '🌍', label: 'Worldwide' },
  { flag: '🇪🇸', label: 'Spain' },
  { flag: '🇺🇸', label: 'USA' },
  { flag: '🇬🇧', label: 'UK' },
  { flag: '🇫🇷', label: 'France' },
  { flag: '🇩🇪', label: 'Germany' },
  { flag: '🇮🇹', label: 'Italy' },
  { flag: '🇵🇹', label: 'Portugal' },
  { flag: '🇮🇪', label: 'Ireland' },
  { flag: '🇳🇱', label: 'Netherlands' },
  { flag: '🇧🇪', label: 'Belgium' },
  { flag: '🇨🇿', label: 'Czech Republic' },
  { flag: '🇦🇹', label: 'Austria' },
  { flag: '🇭🇺', label: 'Hungary' },
  { flag: '🇭🇷', label: 'Croatia' },
  { flag: '🇯🇵', label: 'Japan' },
  { flag: '🇨🇳', label: 'China' },
  { flag: '🇰🇷', label: 'South Korea' },
  { flag: '🇮🇳', label: 'India' },
  { flag: '🇧🇷', label: 'Brazil' },
  { flag: '🇲🇽', label: 'Mexico' },
  { flag: '🇨🇦', label: 'Canada' },
  { flag: '🇦🇺', label: 'Australia' },
  { flag: '🇳🇿', label: 'New Zealand' },
  { flag: '🇯🇴', label: 'Jordan' },
  { flag: '🇸🇦', label: 'Saudi Arabia' },
  { flag: '🇳🇬', label: 'Nigeria' },
  { flag: '🇿🇦', label: 'South Africa' },
  { flag: '🇲🇦', label: 'Morocco' },
]

function readLocal(): Entry[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') } catch { return [] }
}

function writeLocal(entries: Entry[]) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(entries.slice(0, 20))) } catch {}
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  } catch { return iso }
}

function mergeEntries(remote: Entry[], local: Entry[]): Entry[] {
  const combined = [...remote, ...local]
  const seen = new Set<string>()
  return combined
    .filter(e => {
      const k = `${e.date}|${e.name}|${e.message}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_DISPLAY)
}

// ─── Custom country dropdown ──────────────────────────────────────────────────
function CountryPicker({
  value,
  onChange,
}: {
  value: typeof COUNTRIES[0]
  onChange: (c: typeof COUNTRIES[0]) => void
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Click-outside closes dropdown
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const BTN: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '0.5rem',
    padding: '0.375rem 0.5rem',
    color: '#FAFAFA',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.2rem',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button type="button" onClick={() => setOpen(v => !v)} style={BTN}
        aria-haspopup="listbox" aria-expanded={open}
      >
        {value.flag} <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '1px' }}>▾</span>
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            zIndex: 200,
            background: 'rgba(18,18,18,0.98)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: '0.5rem',
            padding: '0.25rem',
            minWidth: '180px',
            maxHeight: '220px',
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
        >
          {COUNTRIES.map(c => (
            <button
              key={c.label}
              type="button"
              role="option"
              aria-selected={c.flag === value.flag}
              onClick={() => { onChange(c); setOpen(false) }}
              style={{
                width: '100%',
                textAlign: 'left',
                background: c.flag === value.flag ? 'rgba(200,230,255,0.12)' : 'transparent',
                border: 'none',
                padding: '0.45rem 0.625rem',
                borderRadius: '0.375rem',
                color: '#FAFAFA',  /* always visible */
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = c.flag === value.flag ? 'rgba(200,230,255,0.12)' : 'transparent')}
            >
              <span style={{ fontSize: '15px', flexShrink: 0 }}>{c.flag}</span>
              <span style={{ color: '#FAFAFA' }}>{c.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Guestbook() {
  const prefersReduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(false)
  const [offline, setOffline] = useState(false)

  const [nameInput, setNameInput] = useState('')
  const [country, setCountry] = useState(COUNTRIES[0])
  const [msgInput, setMsgInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formError, setFormError] = useState('')

  // Load from Worker when panel opens
  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setOffline(false)

    async function load() {
      try {
        const res = await fetch(WORKER_URL, { method: 'GET' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: { entries: Entry[] } = await res.json()
        if (cancelled) return
        setEntries(mergeEntries(data.entries, readLocal()))
      } catch {
        if (!cancelled) {
          setOffline(true)
          setEntries(mergeEntries([], readLocal()))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [open])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    const name = nameInput.trim()
    const message = msgInput.trim()
    if (!name || !message) { setFormError('Name and message required.'); return }
    setFormError('')
    setSubmitting(true)

    const newEntry: Entry & { website: string } = {
      name: name.slice(0, 30),
      country: country.flag,
      message: message.slice(0, 80),
      date: new Date().toISOString().slice(0, 10),
      website: '', // honeypot — must stay empty
    }

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setFormError(
          res.status === 429
            ? 'Too many submissions. Try again in an hour.'
            : (data.error || 'Could not save. Please try again.'),
        )
        setSubmitting(false)
        return
      }
    } catch {
      setFormError('Network error — saving locally as backup.')
    }

    const { website: _w, ...stored } = newEntry
    const updated = [stored, ...readLocal()]
    writeLocal(updated)
    setEntries(prev => [stored, ...prev])
    setNameInput(''); setMsgInput(''); setCountry(COUNTRIES[0])
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 1500)
    setSubmitting(false)
  }, [nameInput, country, msgInput, submitting])

  const EASE = prefersReduced ? 'none' : 'all 250ms cubic-bezier(0.4,0,0.2,1)'
  const INPUT: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: '0.375rem',
    padding: '0.375rem 0.5rem',
    color: '#FAFAFA',
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    outline: 'none',
  }

  return (
    <div style={{ position: 'relative' }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: '2.5rem', left: 0,
          width: 'min(320px, 90vw)', maxHeight: '72vh',
          background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '1rem',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          zIndex: 50,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
              Visitors
              {offline && <span style={{ color: '#C8E6FF', marginLeft: '0.5rem' }}>OFFLINE</span>}
            </span>
            <button onClick={() => setOpen(false)} aria-label="Close guestbook"
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '16px', padding: '0 0.25rem', lineHeight: 1 }}>
              ×
            </button>
          </div>

          {/* Entry list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 1rem' }}>
            {loading ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', padding: '1.5rem 0', textAlign: 'center', letterSpacing: '0.06em' }}>
                Loading entries…
              </div>
            ) : entries.length === 0 ? (
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-muted, #71717A)', padding: '2rem 0', textAlign: 'center' }}>
                Be the first to leave a mark.
              </div>
            ) : (
              entries.map((e, i) => (
                <div key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.4 }}>
                    {e.country} <strong style={{ color: '#fff' }}>{e.name}</strong> — {e.message}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '9px', color: 'rgba(255,255,255,0.28)', marginTop: '0.15rem', letterSpacing: '0.04em' }}>
                    {fmtDate(e.date)}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '0.75rem 1rem', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, position: 'relative' }}>
            {/* Honeypot — invisible to humans, bots fill it */}
            <input type="text" name="website" defaultValue="" tabIndex={-1}
              autoComplete="off" aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
            />

            {submitted ? (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#C8E6FF', textAlign: 'center', padding: '0.5rem 0', letterSpacing: '0.08em' }}>
                ✓ Marked.
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value.slice(0, 30))}
                    placeholder="Name" maxLength={30} required
                    style={{ ...INPUT, flex: 1 }}
                  />
                  <CountryPicker value={country} onChange={setCountry} />
                </div>

                <input
                  value={msgInput}
                  onChange={e => setMsgInput(e.target.value.slice(0, 80))}
                  placeholder="Leave a mark… (max 80 chars)" maxLength={80} required
                  style={{ ...INPUT, width: '100%', boxSizing: 'border-box', marginBottom: '0.5rem' }}
                />

                {formError && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#C8E6FF', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
                    {formError}
                  </div>
                )}

                <button type="submit" disabled={submitting} style={{
                  display: 'block', width: '100%', padding: '0.4rem 1rem',
                  background: submitting ? 'rgba(200,230,255,0.3)' : '#C8E6FF',
                  color: '#0A0A0A', border: 'none', borderRadius: '9999px',
                  fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 600,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: submitting ? 'default' : 'pointer', transition: EASE,
                }}>
                  {submitting ? '…' : 'Sign'}
                </button>
              </>
            )}
          </form>
        </div>
      )}

      {/* Trigger pill */}
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(10,10,10,0.82)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '9999px',
          padding: '0.35rem 0.875rem', cursor: 'pointer',
          fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em',
          color: '#C8E6FF', textTransform: 'uppercase', whiteSpace: 'nowrap',
          transition: EASE,
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C8E6FF', flexShrink: 0, animation: 'dmPulse 2s ease-in-out infinite' }} />
        + Leave a mark
      </button>
    </div>
  )
}
