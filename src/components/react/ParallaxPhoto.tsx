import { useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface Props {
  src: string;
  alt: string;
  width: number;
  height: number;
  objectPosition?: string;
  aspectRatio?: string;
}

export default function ParallaxPhoto({
  src,
  alt,
  width,
  height,
  objectPosition = 'center 40%',
  aspectRatio,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);

  const containerStyle: React.CSSProperties = aspectRatio
    ? {
        aspectRatio,
        width: '100%',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        position: 'relative',
      }
    : {
        maxWidth: '1400px',
        margin: '0 auto',
        borderRadius: '1.5rem',
        overflow: 'hidden',
        height: 'clamp(320px, 48vw, 620px)',
        position: 'relative',
      };

  return (
    <div ref={ref} style={containerStyle}>
      <motion.img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        style={{
          width: '100%',
          height: '130%',
          marginTop: '-8%',
          objectFit: 'cover',
          objectPosition,
          display: 'block',
          y: prefersReducedMotion ? 0 : y,
        }}
      />
    </div>
  );
}
