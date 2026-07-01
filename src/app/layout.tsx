import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'YowNews — Apprends. Crée. Propulse-toi.',
  description: 'La plateforme éducative panafricaine qui réunit blogs, podcasts et cours.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Next.js App Router exige html+body dans le layout racine.
  // Le layout [locale] redéclare <html lang={locale}> et surcharge les attributs.
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
