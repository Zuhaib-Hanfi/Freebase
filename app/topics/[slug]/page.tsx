import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ResourceCard } from '@/components/resource-card';
import { categories, getCategory, getResourcesForCategory } from '@/lib/catalog';

type Params = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return categories.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const category = getCategory((await params).slug);
  return category ? { title: category.name, description: `Browse free resources in ${category.name.toLowerCase()}.` } : {};
}

export default async function TopicPage({ params }: Params) {
  const category = getCategory((await params).slug);
  if (!category) notFound();
  const resources = getResourcesForCategory(category.slug).sort((a, b) => Number(b.reviewed) - Number(a.reviewed) || a.name.localeCompare(b.name));
  return <div className="container inner-page"><Breadcrumbs links={[{ title: 'Home', href: '/' }, { title: 'Directory', href: '/browse/' }]} current={category.name} /><header className="page-heading"><h1>{category.name}</h1><p>{resources.length} resources in this category.</p></header><div className="section-heading"><Link className="button" href={`/browse/?category=${category.slug}`}>Filter these resources</Link></div><div className="resource-grid">{resources.map((resource) => <ResourceCard key={resource.slug} resource={resource} />)}</div></div>;
}
