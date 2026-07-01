'use client';
import { Link } from '@/i18n/navigation';
import { useSession } from '@/components/providers/session-provider';
import { isPlatformAdmin, isEducationEditor } from '@/lib/roles';

export function Header() {
  const { session } = useSession();
  const user = session?.user ?? null;

  const authorities = user?.permissions ?? user?.roles;
  const dashboardHref = isPlatformAdmin(authorities)
    ? '/admin/dashboard'
    : isEducationEditor(authorities)
      ? '/editor/dashboard'
      : '/reader/profile';

  return (
    <header className="header" id="hdr">
      <div className="container">
        <Link href="/" className="logo" aria-label="YowNews">
          <div className="logo-icon" aria-hidden="true">YN</div>
          <span className="logo-text"><span className="l1">Yow</span><span className="l2">News</span></span>
        </Link>
        <div className="h-right" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <Link href={dashboardHref} className="btn btn-orange btn-sm" style={{ fontFamily: 'var(--font-d)', fontWeight: 600 }}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="btn btn-outline btn-sm">Connexion</Link>
              <Link href="/auth/sign-up" className="btn btn-orange btn-sm">Commencer</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
