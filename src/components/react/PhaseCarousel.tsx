import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReducedMotion } from 'framer-motion';

interface ImageData {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

interface Props {
  title: string;
  images: ImageData[];
  autoPlayInterval?: number;
}

export default function PhaseCarousel({ title, images, autoPlayInterval = 3000 }: Props) {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [fading, setFading] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const paused = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (index: number) => {
      const next = (index + images.length) % images.length;
      if (next === current) return;
      if (!prefersReducedMotion) {
        setPrev(current);
        setFading(true);
        setTimeout(() => {
          setCurrent(next);
          setPrev(null);
          setFading(false);
        }, 300);
      } else {
        setCurrent(next);
      }
    },
    [current, images.length, prefersReducedMotion]
  );

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    intervalRef.current = setInterval(() => {
      if (!paused.current) goNext();
    }, autoPlayInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [goNext, autoPlayInterval, prefersReducedMotion]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goPrev();
    if (e.key === 'ArrowRight') goNext();
  };

  const total = images.length;
  const pad = (n: number) => String(n + 1).padStart(2, '0');

  return (
    <div
      role="region"
      aria-label={title}
      style={{
        background: 'var(--color-subtle, #18181B)',
        borderRadius: '1rem',
        overflow: 'hidden',
        userSelect: 'none',
      }}
      onMouseEnter={() => { paused.current = true; }}
      onMouseLeave={() => { paused.current = false; }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={containerRef}
    >
      {/* Phase label */}
      <div style={{ padding: '1rem 1rem 0.5rem' }}>
        <p
          style={{
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--color-accent, #FF5C00)',
            margin: 0,
          }}
        >
          {title}
        </p>
      </div>

      {/* Image area */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
        {/* Outgoing (fading out) */}
        {!prefersReducedMotion && fading && prev !== null && (
          <img
            src={images[prev].src}
            alt={images[prev].alt ?? `${title} — image ${prev + 1}`}
            width={images[prev].width}
            height={images[prev].height}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Current */}
        <img
          src={images[current].src}
          alt={images[current].alt ?? `${title} — image ${current + 1}`}
          width={images[current].width}
          height={images[current].height}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: fading && !prefersReducedMotion ? 0 : 1,
            transition: prefersReducedMotion ? 'none' : 'opacity 0.3s ease',
          }}
        />

        {/* Slide counter */}
        <div
          aria-live="polite"
          style={{
            position: 'absolute',
            top: '0.75rem',
            right: '0.75rem',
            fontFamily: 'var(--font-geist-mono, monospace)',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.5)',
            background: 'rgba(0,0,0,0.4)',
            padding: '2px 8px',
            borderRadius: '999px',
            lineHeight: 1.8,
          }}
        >
          {pad(current)} / {pad(total - 1)}
        </div>

        {/* Arrow buttons */}
        <button
          onClick={goPrev}
          aria-label="Previous image"
          style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
          className="carousel-arrow"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={goNext}
          aria-label="Next image"
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
          className="carousel-arrow"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Dot indicators */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          padding: '0.875rem',
        }}
        role="tablist"
        aria-label="Slide navigation"
      >
        {images.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === current}
            aria-label={`Go to image ${i + 1}`}
            onClick={() => goTo(i)}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              background: i === current ? 'var(--color-accent, #FF5C00)' : 'rgba(255,255,255,0.3)',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      <style>{`
        [role="region"]:hover .carousel-arrow,
        [role="region"]:focus-within .carousel-arrow {
          opacity: 1 !important;
        }
        @media (max-width: 640px) {
          .carousel-arrow { display: none !important; }
        }
      `}</style>
    </div>
  );
}
