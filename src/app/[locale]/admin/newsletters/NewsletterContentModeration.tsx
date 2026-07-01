'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

type StatutNewsletter = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
type NewsletterItem = { id: string; titre: string; statut: StatutNewsletter; redacteurNom?: string | null; createdAt?: string | null };

const TABS: { key: StatutNewsletter; label: string }[] = [
  { key: 'SUBMITTED', label: 'En attente de validation' },
  { key: 'APPROVED', label: 'Approuvées (à publier)' },
  { key: 'PUBLISHED', label: 'Publiées' },
];

const td: React.CSSProperties = { padding: '12px 16px', fontSize: 14, color: 'var(--gray-800)', borderTop: '1px solid var(--gray-100)' };
const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px' };

export default function NewsletterContentModeration() {
  const [tab, setTab] = useState<StatutNewsletter>('SUBMITTED');
  const [items, setItems] = useState<NewsletterItem[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setItems(null);
    try { setItems(await apiFetch<NewsletterItem[]>(`/api/newsletter/newsletters?statut=${tab}`)); } catch { setItems([]); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- rechargement à chaque changement d'onglet.
  useEffect(() => { load(); }, [tab]);

  const act = async (id: string, action: 'validate' | 'reject' | 'publish') => {
    setBusyId(id); setError(null);
    try {
      await apiFetch(`/api/newsletter/admin/newsletters/${id}/${action}`, { method: 'POST' });
      setItems((prev) => prev?.filter((i) => i.id !== id) ?? prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de l’action');
    } finally { setBusyId(null); }
  };

  return (
    <div>
      {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', color: '#DC2626', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} style={{
            padding: '8px 16px', borderRadius: 20,
            border: `1px solid ${tab === t.key ? 'var(--blue)' : 'var(--gray-200)'}`,
            background: tab === t.key ? 'var(--blue)' : '#fff',
            color: tab === t.key ? '#fff' : 'var(--gray-600)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)' }}>
              <th style={th}>Titre</th>
              <th style={th}>Rédacteur</th>
              <th style={{ ...th, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items === null ? (
              <tr><td style={td} colSpan={3}>Chargement…</td></tr>
            ) : items.length === 0 ? (
              <tr><td style={{ ...td, color: 'var(--gray-400)' }} colSpan={3}>Aucune newsletter ici.</td></tr>
            ) : items.map((n) => (
              <tr key={n.id} style={{ opacity: busyId === n.id ? 0.5 : 1 }}>
                <td style={{ ...td, fontWeight: 600 }}>{n.titre}</td>
                <td style={td}>{n.redacteurNom ?? '—'}</td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {tab === 'SUBMITTED' && (
                    <>
                      <button type="button" disabled={busyId === n.id} onClick={() => act(n.id, 'validate')} style={{ border: 'none', borderRadius: 7, padding: '6px 14px', background: '#16A34A', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', marginRight: 8 }}>Approuver</button>
                      <button type="button" disabled={busyId === n.id} onClick={() => act(n.id, 'reject')} style={{ border: 'none', borderRadius: 7, padding: '6px 14px', background: '#DC2626', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Rejeter</button>
                    </>
                  )}
                  {tab === 'APPROVED' && (
                    <button type="button" disabled={busyId === n.id} onClick={() => act(n.id, 'publish')} style={{ border: 'none', borderRadius: 7, padding: '6px 14px', background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Publier</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
