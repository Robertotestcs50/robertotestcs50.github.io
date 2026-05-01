import { useState } from 'react';
import { motion } from 'framer-motion';

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
    <div>
      {/* Year filter chips */}
      <div
        role="group"
        aria-label="Filter by year"
        className="flex flex-wrap gap-2 mb-16"
      >
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
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
      >
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
              className="group block"
              aria-label={`View ${project.title} — ${project.subtitle}`}
            >
              <div className="relative overflow-hidden rounded-2xl bg-subtle aspect-video mb-4">
                <img
                  src={project.cover}
                  alt={project.coverAlt || project.title}
                  width={project.coverWidth}
                  height={project.coverHeight}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.04]"
                />
                {/* Meta reveal on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 flex items-end p-6">
                  <p className="font-mono text-xs uppercase tracking-widest text-foreground/80">
                    {project.year}
                  </p>
                </div>
              </div>
              <div className="px-1">
                <h2 className="text-lg font-semibold tracking-tight text-foreground group-hover:text-accent transition-colors duration-300">
                  {project.title}
                </h2>
                <p className="font-mono text-xs uppercase tracking-widest text-muted mt-1">
                  {project.subtitle}
                </p>
              </div>
            </a>
          </motion.article>
        ))}
      </motion.div>
    </div>
  );
}
