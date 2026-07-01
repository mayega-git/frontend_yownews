'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

type RedacteurRequest = { id: string; email: string; nom: string; prenom: string; createdAt?: string | null };

const td: React.CSSProperties = { padding: '12px 16px', fontSize: 14, color: 'var(--gray-800)', borderTop: '1px solid var(--gray-100)' };
const th: React.CSSProperties = { textAlign: 'left', padding: '12px 16px', fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '.5px' };

export default function RedacteurRequestsModeration() {
  const [items, setItems] = useState<RedacteurRequest[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setItems(null);
    try { setItems(await apiFetch<RedacteurRequest[]>('/api/newsletter/admin/redacteurs/pending')); } catch { setItems([]); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API au montage.
  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    setBusyId(id); setError(null);
    try {
      await apiFetch(`/api/newsletter/admin/redacteurs/${id}/approve`, { method: 'POST' });
      setItems((prev) => prev?.filter((i) => i.id !== id) ?? prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de l’approbation');
    } finally { setBusyId(null); }
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Raison du rejet (optionnel) :') ?? '';
    setBusyId(id); setError(null);
    try {
      await apiFetch(`/api/newsletter/admin/redacteurs/${id}/reject`, { method: 'POST', body: { reason } });
      setItems((prev) => prev?.filter((i) => i.id !== id) ?? prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec du rejet');
    } finally { setBusyId(null); }
  };

  return (
    <div>
      {error && <div style={{ padding: '10px 14px', background: '#FEF2F2', color: '#DC2626', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>{error}</div>}
      <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)' }}>
              <th style={th}>Nom</th>
              <th style={th}>Email</th>
              <th style={{ ...th, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items === null ? (
              <tr><td style={td} colSpan={3}>Chargement…</td></tr>
            ) : items.length === 0 ? (
              <tr><td style={{ ...td, color: 'var(--gray-400)' }} colSpan={3}>Aucune demande en attente.</td></tr>
            ) : items.map((r) => (
              <tr key={r.id} style={{ opacity: busyId === r.id ? 0.5 : 1 }}>
                <td style={{ ...td, fontWeight: 600 }}>{[r.prenom, r.nom].filter(Boolean).join(' ') || '—'}</td>
                <td style={td}>{r.email}</td>
                <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button type="button" disabled={busyId === r.id} onClick={() => approve(r.id)} style={{ border: 'none', borderRadius: 7, padding: '6px 14px', background: '#16A34A', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', marginRight: 8 }}>Approuver</button>
                  <button type="button" disabled={busyId === r.id} onClick={() => reject(r.id)} style={{ border: 'none', borderRadius: 7, padding: '6px 14px', background: '#DC2626', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Rejeter</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
