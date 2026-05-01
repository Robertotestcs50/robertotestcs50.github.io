import { useRef, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  href: string;
  className?: string;
  'aria-label'?: string;
}

export default function MagneticButton({ children, href, className = '', 'aria-label': ariaLabel }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;

    const rect = ref.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.1;
    const dy = (e.clientY - cy) * 0.1;
    ref.current!.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const handleMouseLeave = () => {
    if (ref.current) {
      ref.current.style.transform = 'translate(0, 0)';
    }
  };

  return (
    <a
      ref={ref}
      href={href}
      className={className}
      aria-label={ariaLabel}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)', display: 'inline-block' }}
    >
      {children}
    </a>
  );
}
