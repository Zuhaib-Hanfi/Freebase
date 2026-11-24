import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SavedDirectory } from '@/components/saved-directory';
import { legacyBookmarkSlugs, resources } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Saved resources', robots: { index: false, follow: false } };

export default function SavedPage() {
  return <div className="container inner-page"><Breadcrumbs links={[{ href: '/', title: 'Home' }]} current="Saved resources" /><header className="page-heading"><h1>Saved resources</h1><p>Your shortlist is stored in this browser.</p></header><SavedDirectory resources={resources} legacySlugs={legacyBookmarkSlugs} /></div>;
}
