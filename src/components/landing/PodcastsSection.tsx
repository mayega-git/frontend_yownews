const WAVE_HEIGHTS = [30, 70, 45, 88, 55, 72, 38, 95, 62, 50, 80, 42, 90, 58, 68, 35, 78, 85, 46, 65, 52, 76, 40, 92];

type MiniPod = { cover: string; title: string; author: string; dur: string };

const MINI_PODS: MiniPod[] = [
  { cover: 'https://picsum.photos/seed/biz-africa-pod/104/104', title: 'Business Africa Now — Ép. 18', author: 'Cheikh Ndiaye · Dakar', dur: '42 min' },
  { cover: 'https://picsum.photos/seed/langues-afrique/104/104', title: "Les Langues d'Afrique — Ép. 5", author: 'Dr. Nadia Osei · Accra', dur: '35 min' },
  { cover: 'https://picsum.photos/seed/sante-africa/104/104', title: 'Santé & Innovation — Ép. 12', author: 'Dr. Kofi Mensah · Yaoundé', dur: '48 min' },
  { cover: 'https://picsum.photos/seed/women-leaders/104/104', title: 'Femmes Leaders Africa — Ép. 9', author: 'Aisha Traoré · Bamako', dur: '31 min' },
];

export function PodcastsSection() {
  return (
    <section className="sec-pods spy" id="podcasts" aria-labelledby="pods-h2">
      <div className="container">
        <div className="sec-hd" style={{ marginBottom: 40 }}>
          <div>
            <div className="sec-eyebrow">Podcasts</div>
            <h2 className="sec-title" id="pods-h2" style={{ color: '#fff' }}>Les voix de l&apos;Afrique qui <span style={{ color: 'var(--accent-soft)' }}>transforment</span></h2>
          </div>
          <a href="#" className="sec-link" style={{ color: 'var(--accent-soft)' }}>Tous les épisodes →</a>
        </div>
        <div className="pods-layout">
          <div className="pod-main">
            <img className="pod-main-img" src="https://picsum.photos/seed/podcast-africa-host/900/480" alt="Tech Made in Africa" loading="lazy" />
            <div className="pod-main-body">
              <div className="pod-main-tag"><span className="badge b-org" style={{ fontSize: 9 }}>Vedette</span></div>
              <div className="pod-main-title">Tech Made in Africa — Ép. 47 : L&apos;IA au service du continent</div>
              <div className="pod-main-meta">Aicha Koné · Abidjan · 54 min · 18 400 écoutes</div>
              <div className="wf">
                {WAVE_HEIGHTS.map((h, i) => (
                  <span key={i} style={{ height: `${h}%` }}></span>
                ))}
              </div>
              <div className="pod-play">
                <button className="play-btn" aria-label="Écouter">
                  <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </button>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,.5)' }}>Cliquez pour écouter</span>
              </div>
            </div>
          </div>
          <div className="pod-list">
            {MINI_PODS.map((p) => (
              <div className="pod-mini" tabIndex={0} role="button" aria-label={p.title} key={p.title}>
                <img className="pm-cover" src={p.cover} alt={p.title} />
                <div className="pm-info"><div className="pm-title">{p.title}</div><div className="pm-author">{p.author}</div></div>
                <div className="pm-dur">{p.dur}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
