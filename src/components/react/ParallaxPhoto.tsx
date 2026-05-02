import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export default function ParallaxPhoto({ src, alt, width, height }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '12%']);

  return (
    <div
      ref={ref}
      style={{
        maxWidth: '1400px',
        margin: '0 auto',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        height: 'clamp(320px, 48vw, 620px)',
        position: 'relative',
      }}
    >
      <motion.img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        style={{
          width: '100%',
          height: '110%',
          objectFit: 'cover',
          objectPosition: 'center 40%',
          display: 'block',
          y: prefersReducedMotion ? 0 : y,
        }}
      />
    </div>
  );
}
