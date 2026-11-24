import Link from 'next/link';

export default function NotFound() {
  return <div className="container inner-page"><header className="page-heading"><h1>Page not found</h1><p>This address doesn’t point to a listing or collection. Try searching the directory.</p></header><Link className="button button-primary" href="/browse/">Browse the directory</Link></div>;
}
