'use client';
import { useEffect, useRef, useState } from 'react';

export type MenuItem = { label: string; onClick: () => void; danger?: boolean };

// Menu d'actions « ⋮ » par ligne de table — partagé entre l'espace Rédacteur et la gestion admin.
export default function RowMenu({ items, disabled }: { items: MenuItem[]; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} aria-label="Actions" style={{
        border: 'none', background: 'none', cursor: disabled ? 'default' : 'pointer', fontSize: '20px',
        lineHeight: 1, padding: '4px 10px', color: 'var(--gray-500, #6b7280)', borderRadius: '6px',
      }}>⋮</button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 60, background: '#fff',
          border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,.12)',
          minWidth: '170px', overflow: 'hidden',
        }}>
          {items.map((it) => (
            <button key={it.label} type="button" onClick={() => { setOpen(false); it.onClick(); }} style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', fontSize: '13px',
              border: 'none', background: 'none', cursor: 'pointer', color: it.danger ? '#B91C1C' : 'var(--gray-700, #374151)',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--gray-50, #f9fafb)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >{it.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
