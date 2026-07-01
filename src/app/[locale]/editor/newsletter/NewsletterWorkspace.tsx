'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api-client';

type RedacteurStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type StatutNewsletter = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';

type RedacteurRequest = { id: string; status: RedacteurStatus; rejectionReason?: string | null };
type Categorie = { id: string; nom: string; description?: string | null };
type NewsletterItem = { id: string; titre: string; contenu: string; statut: StatutNewsletter; categories?: Categorie[] | null; createdAt?: string | null };

const STATUT_LABELS: Record<StatutNewsletter, string> = {
  DRAFT: 'Brouillon', SUBMITTED: 'Soumise', APPROVED: 'Approuvée', REJECTED: 'Rejetée', PUBLISHED: 'Publiée',
};

const label: React.CSSProperties = { fontSize: '13px', fontWeight: 600, marginBottom: '6px', display: 'block' };
const input: React.CSSProperties = { width: '100%', border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' };

// ── Formulaire de demande de création de newsletter (= demande rédacteur) ──
function RequestForm({ email: initialEmail, onSubmitted }: { email: string; onSubmitted: () => void }) {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [useCustom, setUseCustom] = useState(false);
  const [customNames, setCustomNames] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Categorie[]>('/api/newsletter/categories').then(setCategories).catch(() => {});
  }, []);

  const toggle = (nom: string) => {
    setSelected((prev) => prev.includes(nom) ? prev.filter((n) => n !== nom) : [...prev, nom]);
  };

  const submit = async () => {
    setError(null);
    const customList = useCustom ? customNames.split(',').map((s) => s.trim()).filter(Boolean) : [];
    const chosen = [
      ...selected.map((nom) => ({ nom, isCustom: false })),
      ...customList.map((nom) => ({ nom, isCustom: true })),
    ];
    if (!email.trim()) { setError('L’email est requis.'); return; }
    if (chosen.length === 0) { setError('Choisissez au moins une catégorie (ou Aucune pour saisir la vôtre).'); return; }
    setBusy(true);
    try {
      await apiFetch('/api/newsletter/redacteurs', { method: 'POST', body: { email: email.trim(), categories: chosen } });
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec de la demande');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: '18px', fontWeight: 700, margin: '0 0 6px' }}>Demander la création de ma newsletter</h2>
        <p style={{ fontSize: '13px', color: 'var(--gray-500, #6b7280)', margin: 0 }}>
          Choisissez les catégories de votre newsletter. Si aucune ne convient, cochez « Aucune » et saisissez la vôtre.
        </p>
      </div>

      {error && <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#FEF2F2', color: '#B91C1C', fontSize: '13px' }}>{error}</div>}

      <div>
        <label style={label}>Email de la newsletter</label>
        <input style={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@exemple.com" />
        <span style={{ fontSize: '11.5px', color: 'var(--gray-400, #9ca3af)' }}>Peut différer de l&apos;email de votre compte.</span>
      </div>

      <div>
        <label style={label}>Catégories</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {categories.map((c) => (
            <button key={c.id} type="button" onClick={() => toggle(c.nom)} style={{
              border: '1px solid', borderColor: selected.includes(c.nom) ? 'var(--accent)' : 'var(--gray-200, #e5e7eb)',
              background: selected.includes(c.nom) ? 'rgba(239,68,68,.08)' : '#fff',
              color: selected.includes(c.nom) ? 'var(--accent)' : 'var(--gray-700, #374151)',
              borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}>{c.nom}</button>
          ))}
          <button type="button" onClick={() => setUseCustom((v) => !v)} style={{
            border: '1px solid', borderColor: useCustom ? 'var(--accent)' : 'var(--gray-200, #e5e7eb)',
            background: useCustom ? 'rgba(239,68,68,.08)' : '#fff',
            color: useCustom ? 'var(--accent)' : 'var(--gray-700, #374151)',
            borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}>Aucune — saisir la mienne</button>
        </div>
        {useCustom && (
          <input
            style={{ ...input, marginTop: '10px' }}
            value={customNames}
            onChange={(e) => setCustomNames(e.target.value)}
            placeholder="Mes catégories, séparées par des virgules"
          />
        )}
      </div>

      <button type="button" onClick={submit} disabled={busy} style={{
        alignSelf: 'flex-start', border: 'none', borderRadius: '8px', padding: '10px 22px', background: 'var(--accent)',
        color: '#fff', fontWeight: 700, fontSize: '14px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1,
      }}>
        {busy ? 'Envoi…' : 'Envoyer la demande'}
      </button>
    </div>
  );
}

// ── Rédaction des newsletters (une fois rédacteur approuvé) ──
function ContentTabs() {
  const [tab, setTab] = useState<'create' | 'mine'>('create');
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [titre, setTitre] = useState('');
  const [contenu, setContenu] = useState('');
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [mine, setMine] = useState<NewsletterItem[] | null>(null);

  useEffect(() => {
    apiFetch<Categorie[]>('/api/newsletter/categories').then(setCategories).catch(() => {});
  }, []);

  const loadMine = async () => {
    setMine(null);
    try { setMine(await apiFetch<NewsletterItem[]>('/api/newsletter/newsletters/mine')); } catch { setMine([]); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- `loadMine` est réutilisé après soumission.
  useEffect(() => { if (tab === 'mine') loadMine(); }, [tab]);

  const submit = async () => {
    setMessage(null);
    if (!titre.trim() || !contenu.trim() || selectedCats.length === 0) {
      setMessage({ kind: 'err', text: 'Titre, contenu et au moins une catégorie sont requis.' });
      return;
    }
    setBusy(true);
    try {
      await apiFetch('/api/newsletter/newsletters', { method: 'POST', body: { titre: titre.trim(), contenu: contenu.trim(), categorieIds: selectedCats } });
      setMessage({ kind: 'ok', text: 'Newsletter créée en brouillon.' });
      setTitre(''); setContenu(''); setSelectedCats([]);
    } catch (e) {
      setMessage({ kind: 'err', text: e instanceof Error ? e.message : 'Échec de la création' });
    } finally {
      setBusy(false);
    }
  };

  const submitForReview = async (id: string) => {
    setMine((prev) => prev ? prev.map((n) => n.id === id ? { ...n, statut: 'SUBMITTED' } : n) : prev);
    try { await apiFetch(`/api/newsletter/newsletters/${id}/submit`, { method: 'POST' }); } catch { loadMine(); }
  };

  const tabStyle = (val: 'create' | 'mine'): React.CSSProperties => ({
    padding: '9px 16px', fontSize: '13.5px', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none',
    borderBottom: tab === val ? '2px solid var(--accent)' : '2px solid transparent',
    color: tab === val ? 'var(--primary)' : 'var(--gray-500, #6b7280)',
  });

  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--gray-200)', marginBottom: '20px' }}>
        <button type="button" style={tabStyle('create')} onClick={() => setTab('create')}>Créer</button>
        <button type="button" style={tabStyle('mine')} onClick={() => setTab('mine')}>Mes newsletters</button>
      </div>

      {tab === 'create' ? (
        <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {message && (
            <div style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '13px', background: message.kind === 'ok' ? 'rgba(16,185,129,.1)' : '#FEF2F2', color: message.kind === 'ok' ? '#059669' : '#B91C1C' }}>{message.text}</div>
          )}
          <div>
            <label style={label}>Titre</label>
            <input style={input} value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre de la newsletter" />
          </div>
          <div>
            <label style={label}>Contenu</label>
            <textarea style={{ ...input, minHeight: '220px', resize: 'vertical' }} value={contenu} onChange={(e) => setContenu(e.target.value)} placeholder="Contenu de la newsletter" />
          </div>
          <div>
            <label style={label}>Catégories</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {categories.map((c) => (
                <button key={c.id} type="button" onClick={() => setSelectedCats((prev) => prev.includes(c.id) ? prev.filter((x) => x !== c.id) : [...prev, c.id])} style={{
                  border: '1px solid', borderColor: selectedCats.includes(c.id) ? 'var(--accent)' : 'var(--gray-200, #e5e7eb)',
                  background: selectedCats.includes(c.id) ? 'rgba(239,68,68,.08)' : '#fff',
                  color: selectedCats.includes(c.id) ? 'var(--accent)' : 'var(--gray-700, #374151)',
                  borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}>{c.nom}</button>
              ))}
            </div>
          </div>
          <button type="button" onClick={submit} disabled={busy} style={{
            alignSelf: 'flex-start', border: 'none', borderRadius: '8px', padding: '10px 22px', background: 'var(--accent)',
            color: '#fff', fontWeight: 700, fontSize: '14px', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1,
          }}>{busy ? 'Création…' : 'Créer en brouillon'}</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {!mine && <div style={{ color: 'var(--gray-400, #9ca3af)', fontSize: '14px' }}>Chargement…</div>}
          {mine && mine.length === 0 && <div style={{ color: 'var(--gray-500, #6b7280)', fontSize: '14px' }}>Aucune newsletter pour l&apos;instant.</div>}
          {mine && mine.map((n) => (
            <div key={n.id} style={{ border: '1px solid var(--gray-200, #e5e7eb)', borderRadius: '10px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14px' }}>{n.titre}</div>
                <div style={{ fontSize: '12px', color: 'var(--gray-500, #6b7280)' }}>{STATUT_LABELS[n.statut]}</div>
              </div>
              {n.statut === 'DRAFT' && (
                <button type="button" onClick={() => submitForReview(n.id)} style={{ border: 'none', borderRadius: '8px', padding: '7px 14px', background: 'var(--accent)', color: '#fff', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' }}>
                  Soumettre
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NewsletterWorkspace({ email }: { email: string }) {
  const [request, setRequest] = useState<RedacteurRequest | null | undefined>(undefined);

  const load = async () => {
    setRequest(undefined);
    try { setRequest(await apiFetch<RedacteurRequest | null>('/api/newsletter/redacteurs/me')); } catch { setRequest(null); }
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect -- `load` est repassé en callback à RequestForm.
  useEffect(() => { load(); }, []);

  if (request === undefined) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400, #9ca3af)' }}>Chargement…</div>;
  }

  if (!request) {
    return <RequestForm email={email} onSubmitted={load} />;
  }

  if (request.status === 'PENDING') {
    return (
      <div style={{ maxWidth: '480px', padding: '20px', borderRadius: '12px', background: 'rgba(245,158,11,.1)', color: '#B45309' }}>
        <strong>Demande en attente.</strong> Un administrateur doit valider votre demande de création de newsletter avant que vous puissiez rédiger du contenu.
      </div>
    );
  }

  if (request.status === 'REJECTED') {
    return (
      <div style={{ maxWidth: '480px', padding: '20px', borderRadius: '12px', background: '#FEF2F2', color: '#B91C1C' }}>
        <strong>Demande rejetée.</strong>
        {request.rejectionReason && <p style={{ margin: '8px 0 0', fontSize: '13px' }}>{request.rejectionReason}</p>}
      </div>
    );
  }

  return <ContentTabs />;
}
