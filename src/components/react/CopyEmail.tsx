import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  email: string;
}

export default function CopyEmail({ email }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-4 group">
      <a
        href={`mailto:${email}`}
        className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground hover:text-accent transition-colors duration-300"
        aria-label={`Send email to ${email}`}
      >
        {email}
      </a>
      <button
        onClick={copy}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2 rounded-lg border border-border hover:border-foreground/30 text-muted hover:text-foreground"
        aria-label={copied ? 'Email copied!' : 'Copy email address'}
      >
        {copied ? <Check size={18} className="text-accent" /> : <Copy size={18} />}
      </button>
    </div>
  );
}
