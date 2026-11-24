import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ResourceCard } from '@/components/resource-card';
import { collectionResources, collections } from '@/lib/collections';

type Params = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return collections.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const collection = collections.find((item) => item.slug === slug);
  return collection ? { title: collection.title, description: collection.description } : {};
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const collection = collections.find((item) => item.slug === slug);
  if (!collection) notFound();
  const picks = collectionResources(collection);
  return <div className="container inner-page"><Breadcrumbs links={[{ title: 'Home', href: '/' }, { title: 'Collections', href: '/collections/' }]} current={collection.title} /><header className="page-heading"><h1>{collection.title}</h1><p>{collection.description}</p></header><section className="info-panel"><h2>How to choose</h2><p>{collection.tip}</p></section><section aria-labelledby="collection-picks"><div className="section-heading"><h2 id="collection-picks">Resource picks</h2></div><div className="resource-grid">{picks.map((resource) => <ResourceCard key={resource.slug} resource={resource} />)}</div></section></div>;
}
