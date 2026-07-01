type Blog = {
  img: string;
  cat: string;
  catClass: string;
  readTime: string;
  title: string;
  excerpt: string;
  authorImg: string;
  author: string;
  date: string;
};

const BLOGS: Blog[] = [
  {
    img: 'https://picsum.photos/seed/lagos-startup/800/440',
    cat: 'Business', catClass: 'bb', readTime: '7 min',
    title: "L'essor des startups tech en Afrique de l'Ouest : Lagos, Dakar, Abidjan",
    excerpt: "Comment trois métropoles ouest-africaines sont devenues des pôles d'innovation mondiale.",
    authorImg: 'https://picsum.photos/seed/kwame-auth/64/64', author: 'Kwame Asante', date: '15 mai 2025',
  },
  {
    img: 'https://picsum.photos/seed/africa-education/800/440',
    cat: 'Tech', catClass: 'bt', readTime: '5 min',
    title: 'Apprendre à coder depuis Dakar : ces jeunes qui changent le récit',
    excerpt: 'Dans les bootcamps de Dakar, une génération se forme au développement pour construire demain.',
    authorImg: 'https://picsum.photos/seed/fatou-auth/64/64', author: 'Fatou Diallo', date: '10 mai 2025',
  },
  {
    img: 'https://picsum.photos/seed/nairobi-valley/800/440',
    cat: 'Innovation', catClass: 'bt', readTime: '9 min',
    title: 'Silicon Savannah : pourquoi Nairobi attire les géants de la tech mondiale',
    excerpt: "De M-Pesa à Safaricom, l'Afrique n'attend plus — elle invente ses propres modèles.",
    authorImg: 'https://picsum.photos/seed/amara-auth/64/64', author: 'Amara Touré', date: '4 mai 2025',
  },
];

export function BlogsSection() {
  return (
    <section className="sec-blogs spy" id="blogs" aria-labelledby="blogs-h2">
      <div className="container">
        <div className="sec-hd">
          <div>
            <div className="sec-eyebrow">Blogs</div>
            <h2 className="sec-title" id="blogs-h2">Les voix qui <span className="highlight">inspirent l&apos;Afrique</span></h2>
          </div>
          <a href="#" className="sec-link">Tous les articles →</a>
        </div>
        <div className="blogs-grid">
          {BLOGS.map((b) => (
            <article className="card blog-card" key={b.title}>
              <div className="ci">
                <img src={b.img} alt={b.cat} loading="lazy" style={{ width: '100%', height: '100%' }} />
                <div className="ci-overlay"></div>
                <div className="ci-bottom"><span className={`bcat ${b.catClass}`}>{b.cat}</span><span className="rt">{b.readTime}</span></div>
              </div>
              <div className="cb">
                <h3 className="bt">{b.title}</h3>
                <p className="bx">{b.excerpt}</p>
                <div className="cfooter">
                  <img src={b.authorImg} alt={b.author} />
                  <span className="aname">{b.author}</span><span>·</span><span>{b.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
