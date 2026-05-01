import { useEffect, useRef, useState } from 'react';

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isPointer, setIsPointer] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const pos = useRef({ x: -100, y: -100 });
  const raf = useRef<number>(0);

  useEffect(() => {
    // Only on devices with fine pointer (mouse)
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    if (!mq.matches) return;

    // Respect reduced motion
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (rm.matches) return;

    setIsVisible(true);

    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        const computed = window.getComputedStyle(el);
        const isInteractive =
          el.tagName === 'A' ||
          el.tagName === 'BUTTON' ||
          computed.cursor === 'pointer' ||
          el.closest('a') !== null ||
          el.closest('button') !== null;
        setIsPointer(isInteractive);
      }
    };

    const loop = () => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x - (isPointer ? 16 : 4)}px, ${pos.current.y - (isPointer ? 16 : 4)}px)`;
      }
      raf.current = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove);
    raf.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf.current);
    };
  }, [isPointer]);

  if (!isVisible) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        width: isPointer ? '32px' : '8px',
        height: isPointer ? '32px' : '8px',
        borderRadius: '50%',
        backgroundColor: isPointer ? 'transparent' : 'var(--color-foreground)',
        border: isPointer ? '1.5px solid var(--color-foreground)' : 'none',
        opacity: isPointer ? 0.6 : 1,
        transition: 'width 0.25s ease, height 0.25s ease, opacity 0.25s ease, background-color 0.25s ease, border 0.25s ease',
        willChange: 'transform',
      }}
    />
  );
}
