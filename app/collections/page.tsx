import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { TaskCard } from '@/components/task-card';
import { collections } from '@/lib/collections';

export const metadata: Metadata = { title: 'Collections', description: 'Shortlists of free resources for specific tasks, from learning Python to publishing a portfolio.' };

export default function CollectionsPage() {
  return <div className="container inner-page"><Breadcrumbs links={[{ title: 'Home', href: '/' }]} current="Collections" /><header className="page-heading"><h1>Collections</h1><p>Shortlists of free resources for the thing you’re trying to get done.</p></header><div className="task-grid">{collections.map((collection) => <TaskCard key={collection.slug} collection={collection} />)}</div></div>;
}
