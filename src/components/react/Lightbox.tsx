import { useEffect, useState, useRef } from 'react';

interface LightboxImage {
  src: string;
  alt: string;
}

interface LightboxProps {
  images: LightboxImage[];
}

export default function Lightbox({ images }: LightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  // Open lightbox when any element with data-lightbox-index is clicked
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const trigger = target.closest('[data-lightbox-index]') as HTMLElement | null;
      if (!trigger) return;
      e.preventDefault();
      const idx = parseInt(trigger.dataset.lightboxIndex || '0', 10);
      setActiveIndex(idx);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // Keyboard: Escape closes, arrows navigate
  useEffect(() => {
    if (activeIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveIndex(null);
      } else if (e.key === 'ArrowRight') {
        setActiveIndex(prev => prev === null ? null : Math.min(prev + 1, images.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setActiveIndex(prev => prev === null ? null : Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [activeIndex, images.length]);

  // Touch swipe navigation
  useEffect(() => {
    if (activeIndex === null) return;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (Math.abs(diff) < 50) return;
      if (diff > 0 && activeIndex < images.length - 1) {
        setActiveIndex(activeIndex + 1);
      } else if (diff < 0 && activeIndex > 0) {
        setActiveIndex(activeIndex - 1);
      }
    };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeIndex, images.length]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = activeIndex !== null ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeIndex]);

  if (activeIndex === null) return null;

  const current = images[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < images.length - 1;

  const btnBase: React.CSSProperties = {
    borderRadius: '9999px',
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: 'rgba(255, 255, 255, 0.9)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(8px)',
    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) setActiveIndex(null); }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.96)',
        backdropFilter: 'blur(20px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'lightbox-fade-in 220ms ease-out',
      }}
    >
      {/* Close */}
      <button
        onClick={() => setActiveIndex(null)}
        aria-label="Close"
        style={{
          ...btnBase,
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          width: '2.5rem',
          height: '2.5rem',
          fontSize: '1.25rem',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        ✕
      </button>

      {/* Counter */}
      {images.length > 1 && (
        <div style={{
          position: 'absolute',
          top: '1.75rem',
          left: '1.5rem',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
          fontSize: '11px',
          letterSpacing: '0.1em',
          color: 'rgba(255, 255, 255, 0.5)',
        }}>
          {String(activeIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
        </div>
      )}

      {/* Prev */}
      {hasPrev && (
        <button
          onClick={() => setActiveIndex(activeIndex - 1)}
          aria-label="Previous image"
          style={{
            ...btnBase,
            position: 'absolute',
            left: '1.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '3rem',
            height: '3rem',
            fontSize: '1.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          }}
        >
          ‹
        </button>
      )}

      {/* Next */}
      {hasNext && (
        <button
          onClick={() => setActiveIndex(activeIndex + 1)}
          aria-label="Next image"
          style={{
            ...btnBase,
            position: 'absolute',
            right: '1.5rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '3rem',
            height: '3rem',
            fontSize: '1.5rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
          }}
        >
          ›
        </button>
      )}

      {/* Image */}
      <img
        key={activeIndex}
        src={current.src}
        alt={current.alt}
        style={{
          maxWidth: '92vw',
          maxHeight: '88vh',
          objectFit: 'contain',
          borderRadius: '0.5rem',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'lightbox-image-in 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Hint */}
      <div style={{
        position: 'absolute',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        fontSize: '10px',
        letterSpacing: '0.1em',
        color: 'rgba(255, 255, 255, 0.35)',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>
        ← → navigate · ESC close
      </div>
    </div>
  );
}
