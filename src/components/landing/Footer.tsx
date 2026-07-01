import { Link } from '@/i18n/navigation';

export function Footer() {
  return (
    <footer className="footer" aria-label="Pied de page">
      <div className="container">
        <div className="foot-top">
          <div>
            <div className="logo"><div className="logo-icon" style={{ width: 32, height: 32, fontSize: 13 }}>YN</div><span className="logo-text" style={{ fontSize: 17 }}><span className="l1">Yow</span><span className="l2">News</span></span></div>
            <p className="foot-desc">La première plateforme de contenu éducatif panafricaine. Blogs, podcasts, cours et communauté pour les talents du continent.</p>
            <div className="socials">
              <a href="#" className="soc-a" aria-label="X"><svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg></a>
              <a href="#" className="soc-a" aria-label="LinkedIn"><svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" /></svg></a>
              <a href="#" className="soc-a" aria-label="YouTube"><svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.4a2.78 2.78 0 001.95-1.96A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" /></svg></a>
              <a href="#" className="soc-a" aria-label="Instagram"><svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg></a>
            </div>
          </div>
          <div><div className="fcol-title">Explorer</div><ul className="flinks"><li><a href="#blogs">Articles</a></li><li><a href="#podcasts">Podcasts</a></li><li><a href="#cours">Cours</a></li><li><a href="#">Newsletter</a></li></ul></div>
          <div><div className="fcol-title">Communauté</div><ul className="flinks"><li><a href="#">Forum</a></li><li><a href="#">Groupes</a></li><li><a href="#">Événements live</a></li><li><a href="#">Devenir créateur</a></li></ul></div>
          <div><div className="fcol-title">Compte</div><ul className="flinks"><li><Link href="/auth/sign-up">Créer un compte</Link></li><li><Link href="/auth/login">Se connecter</Link></li><li><a href="#">Dashboard</a></li><li><a href="#">Support</a></li></ul></div>
        </div>
        <div className="foot-bot">
          <div className="foot-copy">© 2025 YowNews — Made with ❤️ in Africa.</div>
          <div className="foot-leg"><a href="#">CGU</a><a href="#">Confidentialité</a><a href="#">Cookies</a></div>
        </div>
      </div>
    </footer>
  );
}
