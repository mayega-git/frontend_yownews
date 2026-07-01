import { Link } from '@/i18n/navigation';

export function Hero() {
  return (
    <section className="hero" aria-labelledby="hero-h1">
      <div className="container" style={{ padding: 0 }}>
        {/* LEFT */}
        <div className="hero-left">
          <div className="hero-eyebrow"><span className="hero-eyebrow-dot"></span>Plateforme éducative africaine</div>
          <h1 className="hero-title" id="hero-h1">
            Apprends.<br />Crée.<br />
            <span className="line-accent">Propulse-toi.</span>
          </h1>
          <p className="hero-sub">Des articles, podcasts et cours créés par des experts africains — pour les talents d&apos;Afrique et de la diaspora. 100% gratuit.</p>
          <div className="hero-ctas">
            <Link href="/auth/sign-up" className="btn btn-orange">Rejoindre gratuitement →</Link>
            <a href="#cours" className="btn btn-outline">Explorer les cours</a>
          </div>
          <div className="hero-users">
            <div className="hero-avatars">
              <img src="https://picsum.photos/seed/hav1/64/64" alt="" />
              <img src="https://picsum.photos/seed/hav2/64/64" alt="" />
              <img src="https://picsum.photos/seed/hav3/64/64" alt="" />
              <img src="https://picsum.photos/seed/hav4/64/64" alt="" />
            </div>
            <div className="hero-users-txt"><strong>8 500+</strong> apprenants actifs dans 12 pays africains</div>
          </div>
        </div>
        {/* RIGHT */}
        <div className="hero-right" aria-hidden="true">
          <div className="hero-vis-grid">
            <div className="hv-img-tall">
              <img src="https://picsum.photos/seed/hero-africa-main/760/520" alt="Apprenante africaine" />
            </div>
            <div className="hv-col-2">
              <div className="hv-img-sq"><img src="https://picsum.photos/seed/hero-podcast-af/400/240" alt="Podcast africain" /></div>
              <div className="hv-img-sq"><img src="https://picsum.photos/seed/hero-class-af/400/240" alt="Cours en ligne" /></div>
            </div>
            <div className="hv-pill-card" style={{ marginTop: 16 }}>
              <div className="hv-pill-icon">
                <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
              <div className="hv-pill-txt">
                <strong>Tech Made in Africa — Ép. 47</strong>
                <span>Aicha Koné · 54 min · 18 400 écoutes</span>
              </div>
            </div>
          </div>
          <div className="hv-float-badge" aria-hidden="true">
            <div className="hv-float-badge-icon">
              <svg width="16" height="16" fill="none" stroke="var(--accent)" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
            </div>
            <div className="hv-float-badge-txt">
              <strong>Kofi vient de s&apos;inscrire</strong>
              <span>Accra, Ghana 🇬🇭</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
