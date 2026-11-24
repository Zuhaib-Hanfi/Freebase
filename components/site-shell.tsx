import Link from 'next/link';
import { Bookmark, Search } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export function Brand() {
  return <Link className="brand" href="/" aria-label="Freebase home"><span className="brand-mark" aria-hidden="true">F</span>freebase<span className="brand-period">.</span></Link>;
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/">Directory</Link>
          <Link href="/collections/">Collections</Link>
          <Link href="/play/">Play</Link>
        </nav>
        <div className="header-actions">
          <Link href="/browse/" className="icon-button mobile-search" aria-label="Search directory"><Search size={19} /></Link>
          <ThemeToggle />
          <Link href="/saved/" className="button button-small saved-link"><Bookmark size={17} /><span>Saved</span></Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div><Brand /><p>A directory for making more with what’s free.</p></div>
        <nav aria-label="Footer navigation"><Link href="/">Directory</Link><Link href="/collections/">Collections</Link><Link href="/play/">Play</Link><Link href="/about/">How we review</Link></nav>
      </div>
    </footer>
  );
}
