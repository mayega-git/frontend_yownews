import { Link } from '@/i18n/navigation';

export function CtaBanner() {
  return (
    <section className="sec-cta spy" aria-labelledby="cta-h2">
      <div className="cta-deco"><div className="cta-shape cta-s1"></div><div className="cta-shape cta-s2"></div><div className="cta-shape cta-s3"></div></div>
      <div className="container">
        <div className="cta-tag">🚀 Rejoignez le mouvement</div>
        <h2 className="cta-title" id="cta-h2">L&apos;Afrique n&apos;attend plus.<br />Et toi ?</h2>
        <p className="cta-sub">Rejoins 8 500+ apprenants qui construisent le continent de demain.</p>
        <div className="cta-btns">
          <Link href="/auth/sign-up" className="btn btn-orange">Créer mon compte gratuit</Link>
          <a href="#blogs" className="btn btn-outline-white">Parcourir le contenu</a>
        </div>
        <div className="cta-reassure">
          <span>✓ Gratuit</span><span>✓ Sans engagement</span><span>✓ Experts africains</span>
        </div>
      </div>
    </section>
  );
}
