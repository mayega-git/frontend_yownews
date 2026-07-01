type Course = {
  img: string;
  level: string;
  levelClass: string;
  title: string;
  author: string;
  meta: string;
};

const COURSES: Course[] = [
  {
    img: 'https://picsum.photos/seed/coding-senegal/800/380',
    level: 'Débutant', levelClass: 'lvl-b',
    title: 'Développement Web de Zéro au Métier',
    author: 'par Moussa Kouyaté · Dakar', meta: '14 leçons · PDF inclus',
  },
  {
    img: 'https://picsum.photos/seed/marketing-africa/800/380',
    level: 'Intermédiaire', levelClass: 'lvl-i',
    title: 'Marketing Digital pour les Marchés Africains',
    author: 'par Aminata Bah · Conakry', meta: '16 leçons · PDF inclus',
  },
  {
    img: 'https://picsum.photos/seed/entrepreneurship-africa/800/380',
    level: 'Avancé', levelClass: 'lvl-a',
    title: 'Lancer sa Startup en Afrique',
    author: 'par Dr. Oumar Diop · Abidjan', meta: '22 leçons · PDF inclus',
  },
];

export function CoursesSection() {
  return (
    <section className="sec-courses spy" id="cours" aria-labelledby="courses-h2">
      <div className="container">
        <div className="sec-hd">
          <div>
            <div className="sec-eyebrow">Cours</div>
            <h2 className="sec-title" id="courses-h2">Formez-vous pour <span className="highlight">l&apos;Afrique de demain</span></h2>
          </div>
          <a href="#" className="sec-link">Tout le catalogue →</a>
        </div>
        <div className="courses-grid">
          {COURSES.map((c) => (
            <div className="card course-card" key={c.title}>
              <div className="ci">
                <img src={c.img} alt={c.title} loading="lazy" />
                <div className="ci-top"><span className="badge b-grn" style={{ fontSize: 9 }}>GRATUIT</span><span className={`bcat ${c.levelClass}`}>{c.level}</span></div>
              </div>
              <div className="cb">
                <h3 className="ct">{c.title}</h3>
                <p className="c-author">{c.author}</p>
                <div className="c-meta"><svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>{c.meta}</div>
                <a href="#" className="btn btn-blue" style={{ width: '100%', justifyContent: 'center', fontSize: 13, padding: 9 }}>Voir le cours</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
