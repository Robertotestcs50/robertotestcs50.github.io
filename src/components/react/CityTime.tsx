import { useState, useEffect } from 'react';

interface Props {
  timezone: string;
  city: string;
  country: string;
  postal: string;
}

export default function CityTime({ timezone, city, country, postal }: Props) {
  const [time, setTime] = useState('');

  const update = () => {
    const now = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date());
    setTime(now);
  };

  useEffect(() => {
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [timezone]);

  return (
    <div>
      <p className="text-2xl font-semibold tracking-tight text-foreground">
        {city}
      </p>
      <p className="font-mono text-xs uppercase tracking-widest text-muted mt-1">
        {country} · {postal}
      </p>
      <p className="font-mono text-sm text-muted/70 mt-2" aria-live="polite" aria-atomic="true">
        {time}
      </p>
    </div>
  );
}
