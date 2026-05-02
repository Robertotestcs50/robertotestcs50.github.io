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
  const [containerHovered, setContainerHovered] = useState(false);
  const [playBtnHovered, setPlayBtnHovered] = useState(false);
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

  // Set playsInline programmatically (required on some older iOS versions)
  useEffect(() => {
    const v = videoRef.current;
    if (v) { v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', 'true'); }
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(err => console.error('Play failed:', err)); }
    else { v.pause(); }
    bringUpControls();
  }, [bringUpControls]);

  // Container-level click: play/pause everywhere, skip control buttons
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.vp-ctrl')) return;
    togglePlay();
  }, [togglePlay]);

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
        color: 'var(--color-accent, #C8E6FF)',
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
        onMouseEnter={() => { setContainerHovered(true); bringUpControls(); }}
        onMouseLeave={() => { setContainerHovered(false); if (playing && !isMobile) setShowControls(false); }}
        onClick={handleContainerClick}
        onTouchStart={(e) => {
          // On iOS, ensure tap fires the click handler for initial play
          if (!started) { e.preventDefault(); togglePlay(); }
        }}
        style={{
          position: 'relative',
          background: '#0A0A0A',
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          aspectRatio,
          outline: 'none',
          cursor: 'pointer',
          touchAction: 'manipulation',
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
            cursor: 'pointer',
            pointerEvents: 'none', /* clicks handled by container */
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
              background: 'var(--color-accent, #C8E6FF)',
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

        {/* Premium play button overlay — hidden while playing */}
        {ready && !error && (
          <div
            className="vp-ctrl"
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            onMouseEnter={() => setPlayBtnHovered(true)}
            onMouseLeave={() => setPlayBtnHovered(false)}
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              pointerEvents: 'auto',
              opacity: playing ? 0 : 1,
              transition: reduceMotion ? 'none' : 'opacity 200ms ease',
              zIndex: 2,
            }}
          >
            <div style={{
              width: isMobile ? 96 : 80,
              height: isMobile ? 96 : 80,
              borderRadius: '50%',
              background: playBtnHovered ? 'rgba(200,230,255,0.85)' : 'rgba(10,10,10,0.65)',
              backdropFilter: 'blur(16px)',
              border: playBtnHovered
                ? '1.5px solid rgba(200,230,255,0.9)'
                : '1.5px solid rgba(255,255,255,0.4)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: playBtnHovered ? 'scale(1.1)' : 'scale(1)',
              animation: playing || playBtnHovered ? 'none' : 'vp-btn-pulse 2s ease-in-out infinite',
              transition: reduceMotion ? 'none'
                : 'background 250ms cubic-bezier(0.4,0,0.2,1), border-color 250ms cubic-bezier(0.4,0,0.2,1), transform 250ms cubic-bezier(0.4,0,0.2,1)',
            }}>
              <svg width="28" height="32" viewBox="0 0 28 32" fill="none" style={{ marginLeft: 3 }} aria-hidden="true">
                <path d="M0 0L28 16L0 32V0Z" fill="#FFFFFF" />
              </svg>
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
            className="vp-ctrl"
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
                  background: 'var(--color-accent, #C8E6FF)',
                  borderRadius: 2,
                  transition: dragging.current ? 'none' : 'width 0.1s linear',
                }} />
                {/* Thumb */}
                <div style={{
                  position: 'absolute', top: '50%',
                  left: `${progress}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'var(--color-accent, #C8E6FF)',
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
          @keyframes vp-btn-pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.06); }
          }
        `}</style>
      </div>
    </div>
  );
}
