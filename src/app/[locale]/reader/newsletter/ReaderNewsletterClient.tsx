'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

type Categorie = { id: string; nom: string; description?: string | null };
type FollowedRedacteur = { id: string; email: string; nom: string; prenom: string };

const label: React.CSSProperties = { fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' };
const input: React.CSSProperties = { width: '100%', border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' };

export default function ReaderNewsletterClient({ email: initialEmail }: { email: string }) {
  const [allCategories, setAllCategories] = useState<Categorie[]>([]);
  const [subscribed, setSubscribed] = useState<Categorie[] | null>(null);
  const [followed, setFollowed] = useState<FollowedRedacteur[] | null>(null);
  const [email, setEmail] = useState(initialEmail);
  const [bannerSelected, setBannerSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSubscribed = async () => {
    try { setSubscribed(await apiFetch<Categorie[]>('/api/newsletter/subscriptions/categories')); } catch { setSubscribed([]); }
  };
  const loadFollowed = async () => {
    try { setFollowed(await apiFetch<FollowedRedacteur[]>('/api/newsletter/subscriptions/redacteurs')); } catch { setFollowed([]); }
  };

  // `loadSubscribed`/`loadFollowed` sont réutilisés après (dés)abonnement, pas seulement au montage.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    apiFetch<Categorie[]>('/api/newsletter/categories').then(setAllCategories).catch(() => {});
    loadSubscribed();
    loadFollowed();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const subscribeBanner = async () => {
    if (!email.trim() || bannerSelected.length === 0 || busy) return;
    setBusy(true); setMessage(null);
    try {
      for (const categorieId of bannerSelected) {
        await apiFetch(`/api/newsletter/subscriptions/categories/${categorieId}`, { method: 'POST', body: { email: email.trim() } });
      }
      setMessage('Abonnement enregistré !');
      setBannerSelected([]);
      loadSubscribed();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Échec de l’abonnement');
    } finally { setBusy(false); }
  };

  const unsubscribeCategory = async (id: string) => {
    setSubscribed((prev) => prev?.filter((c) => c.id !== id) ?? prev);
    try { await apiFetch(`/api/newsletter/subscriptions/categories/${id}`, { method: 'DELETE' }); } catch { loadSubscribed(); }
  };

  const unsubscribeRedacteur = async (id: string) => {
    setFollowed((prev) => prev?.filter((r) => r.id !== id) ?? prev);
    try { await apiFetch(`/api/newsletter/subscriptions/redacteurs/${id}`, { method: 'DELETE' }); } catch { loadFollowed(); }
  };

  const subscribedIds = new Set((subscribed ?? []).map((c) => c.id));
  const showBanner = subscribed !== null && subscribed.length === 0;

  return (
    <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {showBanner && (
        <div style={{ border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '14px', padding: '22px 24px', background: 'linear-gradient(135deg, rgba(239,68,68,.06), rgba(37,99,235,.06))' }}>
          <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '17px', fontWeight: 700, margin: '0 0 6px' }}>Abonnez-vous à la newsletter</h2>
          <p style={{ fontSize: '13px', color: 'var(--gray-600, #4b5563)', margin: '0 0 16px' }}>
            Choisissez vos catégories préférées pour recevoir uniquement les newsletters qui vous intéressent.
          </p>
          {message && <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--accent)' }}>{message}</div>}
          <div style={{ marginBottom: '14px' }}>
            <label style={label}>Email de réception</label>
            <input style={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
            {allCategories.map((c) => (
              <button key={c.id} type="button" onClick={() => setBannerSelected((prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id])} style={{
                border: '1px solid', borderColor: bannerSelected.includes(c.id) ? 'var(--accent)' : 'var(--gray-200, #e5e7eb)',
                background: bannerSelected.includes(c.id) ? 'rgba(239,68,68,.08)' : '#fff',
                color: bannerSelected.includes(c.id) ? 'var(--accent)' : 'var(--gray-700, #374151)',
                borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>{c.nom}</button>
            ))}
          </div>
          <button type="button" onClick={subscribeBanner} disabled={busy} style={{
            border: 'none', borderRadius: '8px', padding: '10px 22px', background: 'var(--accent)',
            color: '#fff', fontWeight: 700, fontSize: '14px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1,
          }}>{busy ? 'Envoi…' : 'S’abonner'}</button>
        </div>
      )}

      <div>
        <h3 style={{ fontFamily: 'var(--font-d)', fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>Mes catégories abonnées</h3>
        {subscribed === null ? (
          <p style={{ color: 'var(--gray-400, #9ca3af)', fontSize: '13px' }}>Chargement…</p>
        ) : subscribed.length === 0 ? (
          <p style={{ color: 'var(--gray-400, #9ca3af)', fontSize: '13px' }}>Aucune catégorie abonnée.</p>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {subscribed.map((c) => (
              <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '20px', padding: '6px 8px 6px 14px', fontSize: '13px', fontWeight: 600, color: 'var(--gray-700, #374151)' }}>
                {c.nom}
                <button type="button" onClick={() => unsubscribeCategory(c.id)} title="Se désabonner" style={{ border: 'none', background: 'var(--gray-100, #f3f4f6)', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', color: 'var(--gray-500, #6b7280)', fontSize: '12px', lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
        )}
        {!showBanner && allCategories.some((c) => !subscribedIds.has(c.id)) && (
          <p style={{ fontSize: '12px', color: 'var(--gray-400, #9ca3af)', marginTop: '10px' }}>
            D&apos;autres catégories sont disponibles — désabonnez-vous d&apos;une catégorie ci-dessus pour revoir la bannière d&apos;abonnement.
          </p>
        )}
      </div>

      <div>
        <h3 style={{ fontFamily: 'var(--font-d)', fontSize: '15px', fontWeight: 700, margin: '0 0 12px' }}>Rédacteurs suivis</h3>
        {followed === null ? (
          <p style={{ color: 'var(--gray-400, #9ca3af)', fontSize: '13px' }}>Chargement…</p>
        ) : followed.length === 0 ? (
          <p style={{ color: 'var(--gray-400, #9ca3af)', fontSize: '13px' }}>Vous ne suivez aucun rédacteur pour l&apos;instant.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {followed.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '10px', padding: '10px 14px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{[r.prenom, r.nom].filter(Boolean).join(' ') || r.email}</span>
                <button type="button" onClick={() => unsubscribeRedacteur(r.id)} style={{ border: 'none', background: 'none', color: 'var(--accent)', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                  Se désabonner
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
