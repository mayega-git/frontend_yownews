type Testimonial = { quote: string; img: string; name: string; role: string };

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "YowNews a complètement changé ma façon d'apprendre. Les articles sont d'une qualité rare et parlent de notre réalité africaine.",
    img: 'https://picsum.photos/seed/testimonial-1/88/88', name: 'Ibrahim Coulibaly', role: 'Développeur web · Abidjan',
  },
  {
    quote: "J'ai pu me reconvertir en data science grâce aux formations de YowNews. Tout ça, gratuitement. Les exemples parlent de marchés que je connais.",
    img: 'https://picsum.photos/seed/testimonial-2/88/88', name: 'Mariam Kaboré', role: 'Entrepreneuse · Ouagadougou',
  },
  {
    quote: 'Les podcasts m\'accompagnent dans mes trajets. Écouter des leaders africains partager leurs expériences est devenu mon rituel quotidien.',
    img: 'https://picsum.photos/seed/testimonial-3/88/88', name: 'Emmanuel Adeyemi', role: 'Ingénieur · Lagos',
  },
];

export function TestimonialsSection() {
  return (
    <section className="sec-testi spy" aria-labelledby="testi-h2">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="sec-eyebrow" style={{ justifyContent: 'center' }}>Témoignages</div>
          <h2 className="sec-title" id="testi-h2" style={{ margin: '0 auto', textAlign: 'center' }}>Ce que disent <span className="highlight">nos apprenants</span></h2>
        </div>
        <div className="testi-grid">
          {TESTIMONIALS.map((t) => (
            <div className="tcard" key={t.name}>
              <div className="tcard-stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span className="tcard-star" key={i}>★</span>
                ))}
              </div>
              <p className="tcard-txt">&quot;{t.quote}&quot;</p>
              <div className="tcard-author">
                <img src={t.img} alt={t.name} />
                <div><div className="tcard-name">{t.name}</div><div className="tcard-role">{t.role}</div></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
