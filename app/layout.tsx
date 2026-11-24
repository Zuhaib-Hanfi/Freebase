import type { Metadata } from 'next';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import './globals.css';
import { SiteFooter, SiteHeader } from '@/components/site-shell';

export const metadata: Metadata = {
  title: { default: 'Freebase — Find good things for free', template: '%s · Freebase' },
  description: 'Find free tools, courses and opportunities. See what’s included, what’s limited, and where to get started.',
  applicationName: 'Freebase',
  openGraph: { siteName: 'Freebase', type: 'website' },
};

const initTheme = "try{var t=localStorage.getItem('freebase-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch{}";

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: initTheme }} /></head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1}>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
