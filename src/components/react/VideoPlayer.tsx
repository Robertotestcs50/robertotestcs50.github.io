import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, AlertCircle } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title: string;
  aspectRatio?: string;
}

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({ src, poster, title, aspectRatio = '16/9' }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [started, setStarted] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const dragging = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Double-tap seek
  const [seekHint, setSeekHint] = useState<'+5' | '-5' | null>(null);
  const lastTap = useRef(0);
  const lastTapSide = useRef<'left' | 'right' | null>(null);

  useEffect(() => {
    setIsMobile(window.matchMedia('(hover: none)').matches);
  }, []);

  // Show/hide controls with timer
  const bringUpControls = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (!isMobile) {
      hideTimer.current = setTimeout(() => {
        if (playing) setShowControls(false);
      }, 2500);
    }
  }, [playing, isMobile]);

  // Video events
  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || dragging.current) return;
    setCurrentTime(v.currentTime);
    setSeekValue(v.currentTime);
  };

  const onLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setReady(true);
  };

  const onPlay = () => { setPlaying(true); setStarted(true); };
  const onPause = () => setPlaying(false);
  const onEnded = () => { setPlaying(false); setShowControls(true); };
  const onError = () => setError(true);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); } else { v.pause(); }
    bringUpControls();
  }, [bringUpControls]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  useEffect(() => {
    const onFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Keyboard handler
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
    if (e.code === 'ArrowRight') seek(5);
    if (e.code === 'ArrowLeft') seek(-5);
    if (e.code === 'KeyM') toggleMute();
    if (e.code === 'KeyF') toggleFullscreen();
  };

  const seek = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
  };

  // Progress bar interaction
  const posToTime = (clientX: number): number => {
    const bar = progressRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * duration;
  };

  const onProgressPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    const t = posToTime(e.clientX);
    setSeekValue(t);
    setCurrentTime(t);
  };

  const onProgressPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const t = posToTime(e.clientX);
    setSeekValue(t);
    setCurrentTime(t);
  };

  const onProgressPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    const t = posToTime(e.clientX);
    const v = videoRef.current;
    if (v) v.currentTime = t;
    setSeekValue(t);
  };

  // Double-tap seek on mobile
  const onVideoTap = (e: React.MouseEvent) => {
    const now = Date.now();
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const side = e.clientX - rect.left < rect.width / 2 ? 'left' : 'right';

    if (now - lastTap.current < 350 && lastTapSide.current === side) {
      const delta = side === 'right' ? 5 : -5;
      seek(delta);
      setSeekHint(delta > 0 ? '+5' : '-5');
      setTimeout(() => setSeekHint(null), 700);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
      lastTapSide.current = side;
    }
  };

  const progress = duration > 0 ? (seekValue / duration) * 100 : 0;

  const transition = reduceMotion ? 'none' : 'opacity 0.2s ease';
  const controlsVisible = isMobile || showControls || !playing;

  return (
    <div style={{ marginBottom: '0.5rem' }}>
      {/* Title */}
      <p style={{
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '11px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: 'var(--color-accent, #FF5C00)',
        marginBottom: '0.75rem',
      }}>
        {title}
      </p>

      {/* Player container */}
      <div
        ref={containerRef}
        tabIndex={0}
        role="region"
        aria-label={`Video player: ${title}`}
        onKeyDown={onKeyDown}
        onMouseMove={bringUpControls}
        onMouseEnter={bringUpControls}
        onMouseLeave={() => { if (playing && !isMobile) setShowControls(false); }}
        onClick={onVideoTap}
        style={{
          position: 'relative',
          background: '#0A0A0A',
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          aspectRatio,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoaded}
          onPlay={onPlay}
          onPause={onPause}
          onEnded={onEnded}
          onError={onError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            background: '#0A0A0A',
          }}
        />

        {/* Loading spinner */}
        {!ready && !error && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: 'var(--color-accent, #FF5C00)',
              animation: 'vp-pulse 1.5s ease-in-out infinite',
            }} />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            color: 'rgba(255,255,255,0.5)',
          }}>
            <AlertCircle size={24} />
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '12px' }}>
              Video unavailable
            </span>
          </div>
        )}

        {/* Big play button (shown when ready and not started, or paused) */}
        {ready && !error && (!started || !playing) && (
          <div
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'auto',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: reduceMotion ? 'none' : 'background 0.2s, transform 0.2s',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
            >
              <Play size={24} color="#fff" style={{ marginLeft: 2 }} />
            </div>
          </div>
        )}

        {/* Double-tap seek hint */}
        {seekHint && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            display: 'flex', alignItems: 'center',
            justifyContent: seekHint === '+5' ? 'flex-end' : 'flex-start',
            padding: '0 24px',
          }}>
            <span style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px', color: '#fff',
              background: 'rgba(0,0,0,0.5)',
              padding: '4px 10px', borderRadius: 6,
            }}>
              {seekHint === '+5' ? '+5s' : '−5s'}
            </span>
          </div>
        )}

        {/* Controls bar */}
        {ready && !error && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              height: 56,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0 16px',
              opacity: controlsVisible ? 1 : 0,
              transition,
              pointerEvents: controlsVisible ? 'auto' : 'none',
            }}
          >
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              aria-label={playing ? 'Pause' : 'Play'}
              style={{
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', color: '#fff',
                minWidth: 44, minHeight: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {playing ? <Pause size={18} /> : <Play size={18} />}
            </button>

            {/* Timestamp */}
            <span style={{
              fontFamily: 'var(--font-mono, monospace)', fontSize: '11px',
              color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap', flexShrink: 0,
            }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Progress bar */}
            <div
              ref={progressRef}
              onPointerDown={onProgressPointerDown}
              onPointerMove={onProgressPointerMove}
              onPointerUp={onProgressPointerUp}
              style={{
                flex: 1, height: 20, cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                touchAction: 'none',
              }}
            >
              <div style={{
                position: 'relative', width: '100%', height: 3,
                background: 'rgba(255,255,255,0.15)', borderRadius: 2,
              }}>
                {/* Filled */}
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${progress}%`,
                  background: 'var(--color-accent, #FF5C00)',
                  borderRadius: 2,
                  transition: dragging.current ? 'none' : 'width 0.1s linear',
                }} />
                {/* Thumb */}
                <div style={{
                  position: 'absolute', top: '50%',
                  left: `${progress}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'var(--color-accent, #FF5C00)',
                  opacity: showControls || isMobile ? 1 : 0,
                  transition: reduceMotion ? 'none' : 'opacity 0.2s',
                }} />
              </div>
            </div>

            {/* Mute */}
            <button
              onClick={toggleMute}
              aria-label={muted ? 'Unmute' : 'Mute'}
              style={{
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', color: '#fff',
                minWidth: 44, minHeight: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              aria-label={fullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              style={{
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', color: '#fff',
                minWidth: 44, minHeight: 44,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        )}

        <style>{`
          @keyframes vp-pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.4); }
          }
        `}</style>
      </div>
    </div>
  );
}
