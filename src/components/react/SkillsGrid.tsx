import ScrollReveal from './ScrollReveal';

interface Column {
  heading: string;
  items: string[];
}

interface Props {
  columns: Column[];
}

export default function SkillsGrid({ columns }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
      {columns.map((col, i) => (
        <ScrollReveal key={col.heading} delay={i * 0.1}>
          <div>
            <h3 className="font-mono text-xs uppercase tracking-widest text-muted mb-4">
              {col.heading}
            </h3>
            <ul className="space-y-2">
              {col.items.map((item) => (
                <li key={item} className="text-foreground text-sm leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      ))}
    </div>
  );
}
