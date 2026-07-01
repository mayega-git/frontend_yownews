'use client';
import { useEffect, useRef, useState } from 'react';

type Stat = {
  target: number;
  label: string;
  bg: string;
  icon: React.ReactNode;
};

const STATS: Stat[] = [
  {
    target: 8500, label: 'Apprenants', bg: '#EEF4FF',
    icon: <svg width="18" height="18" fill="none" stroke="#1565C0" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  },
  {
    target: 1200, label: 'Contenus', bg: '#FFF4EE',
    icon: <svg width="18" height="18" fill="none" stroke="#FF6B35" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>,
  },
  {
    target: 90, label: 'Cours', bg: '#F0FDF4',
    icon: <svg width="18" height="18" fill="none" stroke="#22C55E" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>,
  },
  {
    target: 12, label: 'Pays africains', bg: '#FFFBEB',
    icon: <svg width="18" height="18" fill="none" stroke="#F59E0B" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /></svg>,
  },
];

function fmt(n: number, t: number): string {
  if (t >= 1000) return n.toLocaleString('fr-FR') + '+';
  return n + (t >= 90 ? '+' : '');
}

function Counter({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 1600;
          const start = performance.now();
          const step = (now: number) => {
            const p = Math.min((now - start) / duration, 1);
            const e = 1 - Math.pow(1 - p, 3);
            setValue(Math.floor(e * target));
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return <div className="s-num" ref={ref}>{fmt(value, target)}</div>;
}

export function StatsBar() {
  return (
    <section className="stats-bar" id="stats" aria-label="Statistiques clés">
      <div className="container">
        <div className="stats-inner">
          {STATS.map((stat) => (
            <div className="s-item" key={stat.label}>
              <div className="s-ico" style={{ background: stat.bg }}>{stat.icon}</div>
              <Counter target={stat.target} />
              <div className="s-lbl">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
