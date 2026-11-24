import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BadgeCheck, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ResourceCard, ResourceMark, accessLabel } from '@/components/resource-card';
import { SaveButton } from '@/components/saved-store';
import { getCategory, getResource, getResourcesForCategory, resources } from '@/lib/catalog';
import type { Resource } from '@/lib/types';

type Params = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
const factLabels = [
  ['accountRequired', 'Account required'], ['cardRequired', 'Payment card required'], ['commercialUse', 'Commercial use allowed'],
  ['freeCertificate', 'Free certificate'], ['worksOffline', 'Works offline'], ['attributionRequired', 'Attribution required'],
  ['customDomain', 'Custom domain support'], ['openSource', 'Open source'],
] as const satisfies [keyof Resource, string][];

export function generateStaticParams() {
  return resources.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const resource = getResource((await params).slug);
  return resource ? { title: resource.name, description: resource.description, robots: resource.reviewed ? undefined : { index: false, follow: true } } : {};
}

export default async function ResourcePage({ params }: Params) {
  const resource = getResource((await params).slug);
  if (!resource) notFound();
  const category = getCategory(resource.categories[0]);
  const related = getResourcesForCategory(resource.categories[0]).filter((item) => item.slug !== resource.slug).sort((a, b) => Number(b.reviewed) - Number(a.reviewed)).slice(0, 3);
  const facts = factLabels.flatMap(([key, label]) => typeof resource[key] === 'boolean' ? [[label, resource[key] ? 'Yes' : 'No']] : []);
  const date = resource.reviewedAt && new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(resource.reviewedAt));
  return (
    <div className="container inner-page">
      <Breadcrumbs links={[{ title: 'Home', href: '/' }, { title: 'Directory', href: '/browse/' }, ...(category ? [{ title: category.name, href: `/topics/${category.slug}/` }] : [])]} current={resource.name} />
      <header className="page-heading detail-header">
        <ResourceMark resource={resource} /><h1>{resource.name}</h1><p>{resource.description}</p>
        <div className="details-actions"><a className="button button-primary" href={resource.url} target="_blank" rel="noopener noreferrer">Visit provider <ExternalLink size={16} /><span className="sr-only"> (opens in a new tab)</span></a><SaveButton slug={resource.slug} name={resource.name} labeled /></div>
      </header>
      <div className="details-layout">
        <div>
          {resource.reviewed ? (
            <>
              <section className="info-panel"><h2>What’s free</h2><p>{resource.free}</p></section>
              <section className="info-panel"><h2>What to check</h2><p>{resource.limitation}</p></section>
              {resource.bestFor && <section className="info-panel"><h2>Best for</h2><p>{resource.bestFor}</p></section>}
            </>
          ) : <section className="info-panel"><h2>Terms to check</h2><p>This listing comes from the original directory. Check the provider’s website for current prices, limits, and availability.</p></section>}
        </div>
        <aside aria-label="Resource facts">
          <section className="info-panel">
            <h2>At a glance</h2>
            <dl>
              <div><dt>Access</dt><dd>{accessLabel(resource.access)}{!resource.reviewed && ' (unreviewed)'}</dd></div>
              {resource.region && <div><dt>Region</dt><dd>{resource.region}</dd></div>}
              {resource.license && <div><dt>License</dt><dd>{resource.license}</dd></div>}
              {resource.platform?.length ? <div><dt>Platform</dt><dd>{resource.platform.join(', ')}</dd></div> : null}
              {resource.language?.length ? <div><dt>Language</dt><dd>{resource.language.join(', ')}</dd></div> : null}
              {resource.level && <div><dt>Level</dt><dd>{resource.level}</dd></div>}
              {facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          </section>
          {resource.sourceUrl && <section className="info-panel"><h2 className="source-heading"><BadgeCheck size={20} /> Source reviewed</h2><p>{date ? `Checked ${date}` : 'Official provider information checked'}</p><a className="detail-source" href={resource.sourceUrl} target="_blank" rel="noopener noreferrer">Read the official source <span className="sr-only">(opens in a new tab)</span></a></section>}
          <div className="filter-chips" aria-label="Categories">{resource.categories.map((slug) => <Link className="button" key={slug} href={`/topics/${slug}/`}>{getCategory(slug)?.name ?? slug}</Link>)}</div>
        </aside>
      </div>
      {related.length > 0 && <section className="home-section" aria-labelledby="related-resources"><div className="section-heading"><h2 id="related-resources">Related resources</h2></div><div className="resource-grid">{related.map((item) => <ResourceCard key={item.slug} resource={item} />)}</div></section>}
    </div>
  );
}
