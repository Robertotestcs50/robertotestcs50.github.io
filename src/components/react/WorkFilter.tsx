import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface Project {
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  year: string;
  order: number;
  cover: string;
  coverAlt: string;
  coverWidth: number;
  coverHeight: number;
}

interface Props {
  projects: Project[];
}

const YEARS = ['All', '2026', '2025', '2024', '2023'];

export default function WorkFilter({ projects }: Props) {
  const [active, setActive] = useState('All');

  const filtered =
    active === 'All' ? projects : projects.filter((p) => p.year === active);

  return (
    <>
      <style>{`
        .proj-card .card-arrow {
          opacity: 0;
          transform: translate(-8px, 8px) rotate(-12deg);
          transition: opacity 400ms cubic-bezier(0.4,0,0.2,1),
                      transform 400ms cubic-bezier(0.4,0,0.2,1);
        }
        .proj-card:hover .card-arrow {
          opacity: 1;
          transform: translate(0,0) rotate(0deg);
        }
        @keyframes arrowNudge {
          0%,100% { transform: translate(0,0); }
          50%      { transform: translate(2px,-2px); }
        }
        .proj-card:hover .card-arrow svg {
          animation: arrowNudge 1.4s ease-in-out infinite;
        }
        .proj-card .card-title {
          transform: translateY(0);
          opacity: 1;
          transition: transform 500ms cubic-bezier(0.4,0,0.2,1),
                      opacity 300ms ease;
        }
        .proj-card .card-subtitle {
          transform: translateY(100%);
          opacity: 0;
          transition: transform 500ms cubic-bezier(0.4,0,0.2,1),
                      opacity 300ms ease;
        }
        .proj-card:hover .card-title {
          transform: translateY(-100%);
          opacity: 0;
        }
        .proj-card:hover .card-subtitle {
          transform: translateY(0);
          opacity: 1;
        }
        @media (hover: none) {
          .proj-card .card-title { transform: none !important; opacity: 1 !important; }
          .proj-card .card-subtitle {
            position: static !important;
            transform: none !important;
            white-space: normal !important;
            text-overflow: clip !important;
            /* hidden by default — active-card-observer adds .is-active to show it */
            opacity: 0 !important;
            max-height: 0 !important;
            overflow: hidden !important;
            margin-top: 0 !important;
            transition: opacity 350ms cubic-bezier(0.4, 0, 0.2, 1),
                        max-height 350ms cubic-bezier(0.4, 0, 0.2, 1),
                        margin-top 350ms cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          .proj-card.is-active .card-subtitle {
            opacity: 0.85 !important;
            max-height: 5rem !important;
            margin-top: 0.25rem !important;
          }
          .card-text-stack { height: auto !important; overflow: visible !important; }
          /* Arrow: dim by default, bright + animated on active card */
          .proj-card .card-arrow { opacity: 0.4 !important; transform: none !important;
            transition: opacity 350ms cubic-bezier(0.4,0,0.2,1) !important; }
          .proj-card.is-active .card-arrow { opacity: 1 !important;
            background: rgba(255,255,255,0.18) !important;
            border-color: rgba(255,255,255,0.28) !important; }
          .proj-card.is-active .card-arrow svg { animation: arrowNudge 1.6s ease-in-out infinite; }
          .proj-card:hover .card-arrow svg { animation: none !important; }
        }
        @media (prefers-reduced-motion: reduce) {
          .proj-card .card-title, .proj-card .card-subtitle,
          .proj-card .card-arrow, .proj-card:hover .card-title,
          .proj-card:hover .card-subtitle {
            transition-duration: 0ms !important;
            animation: none !important;
          }
        }
      `}</style>

      {/* Year filter chips */}
      <div role="group" aria-label="Filter by year" className="flex flex-wrap gap-2 mb-16">
        {YEARS.map((year) => (
          <button
            key={year}
            onClick={() => setActive(year)}
            className={`font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-full border transition-all duration-300 ${
              active === year
                ? 'border-foreground text-foreground bg-subtle'
                : 'border-border text-muted hover:border-foreground/30 hover:text-foreground'
            }`}
            aria-pressed={active === year}
          >
            {year}
          </button>
        ))}
      </div>

      {/* Grid */}
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {filtered.map((project, i) => (
          <motion.article
            key={project.slug}
            layout
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          >
            <a
              href={`/projects/${project.slug}`}
              className="proj-card block cursor-pointer"
              data-project-card
              aria-label={`View ${project.title} — ${project.subtitle}`}
            >
              {/* Image wrap */}
              <div
                className="relative overflow-hidden rounded-2xl bg-subtle mb-4"
                style={{ aspectRatio: '4/3' }}
              >
                <img
                  src={project.cover}
                  alt={project.coverAlt || project.title}
                  width={project.coverWidth}
                  height={project.coverHeight}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  style={{ transition: 'transform 700ms cubic-bezier(0.4,0,0.2,1)' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
                {/* Arrow badge */}
                <div
                  className="card-arrow absolute"
                  style={{
                    top: '1rem', right: '1rem',
                    width: 40, height: 40,
                    background: 'rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '9999px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <ArrowUpRight size={18} />
                </div>
              </div>

              {/* Text slide-swap */}
              <div
                className="card-text-stack px-1"
                style={{ position: 'relative', height: '1.75rem', overflow: 'hidden' }}
              >
                <span
                  className="card-title"
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    display: 'block',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 500,
                    fontSize: '1.125rem',
                    color: 'var(--color-foreground)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {project.title}
                </span>
                <span
                  className="card-subtitle"
                  style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    display: 'block',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 400,
                    fontSize: '0.95rem',
                    color: 'var(--color-foreground)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {project.subtitle}
                </span>
              </div>
            </a>
          </motion.article>
        ))}
      </motion.div>
    </>
  );
}
