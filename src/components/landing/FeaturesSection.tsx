type Feature = { icon: React.ReactNode; title: string; desc: string };

const FEATURES: Feature[] = [
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>,
    title: 'Articles par des experts africains',
    desc: "Des centaines d'articles rédigés par des professionnels du continent, accessibles gratuitement.",
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>,
    title: 'Podcasts en français & langues locales',
    desc: 'Du français au swahili — apprenez dans la langue qui vous parle le plus.',
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5M2 17l10 5 10-5M2 12l10 5 10-5" /></svg>,
    title: 'Cours adaptés aux réalités locales',
    desc: "Des formations qui prennent en compte les marchés et opportunités spécifiques à l'Afrique.",
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
    title: 'Communauté panafricaine',
    desc: 'De Lagos à Casablanca, de Dakar à Nairobi — un réseau pour grandir ensemble.',
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>,
    title: 'Newsletter hebdo africaine',
    desc: 'Chaque semaine, la sélection des meilleures innovations et opportunités du continent.',
  },
  {
    icon: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    title: '100% Gratuit, toujours',
    desc: 'Apprenez sans limites, sans abonnement caché, sans engagement. La connaissance est un droit.',
  },
];

export function FeaturesSection() {
  return (
    <section className="sec-feats spy" aria-labelledby="feats-h2">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="sec-eyebrow" style={{ justifyContent: 'center' }}>Pourquoi YowNews ?</div>
          <h2 className="sec-title" id="feats-h2" style={{ margin: '0 auto', textAlign: 'center' }}>Conçu pour les <span className="highlight">talents africains</span></h2>
        </div>
        <div className="feats-grid">
          {FEATURES.map((f) => (
            <div className="feat-card" key={f.title}>
              <div className="feat-icon">{f.icon}</div>
              <div className="feat-title">{f.title}</div>
              <p className="feat-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
