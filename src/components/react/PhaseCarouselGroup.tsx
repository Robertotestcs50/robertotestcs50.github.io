import { useEffect, useRef, useState } from 'react';
import PhaseCarousel from './PhaseCarousel';

interface ImageData {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

interface CarouselData {
  title: string;
  images: ImageData[];
}

interface Props {
  carousels: CarouselData[];
}

function CarouselWithReveal({ carousel, delay }: { carousel: CarouselData; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <PhaseCarousel title={carousel.title} images={carousel.images} />
    </div>
  );
}

export default function PhaseCarouselGroup({ carousels }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
      {carousels.map((carousel, i) => (
        <CarouselWithReveal key={i} carousel={carousel} delay={i * 100} />
      ))}
    </div>
  );
}
