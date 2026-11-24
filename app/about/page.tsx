import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { categories, groups, resources, reviewedResources } from '@/lib/catalog';

export const metadata: Metadata = { title: 'How we review', description: 'How Freebase reviews access, eligibility, licensing, and free-plan limitations.' };

export default function AboutPage() {
  return (
    <div className="container inner-page">
      <Breadcrumbs links={[{ href: '/', title: 'Home' }]} current="How we review" />
      <header className="page-heading"><h1>How we review</h1><p>Freebase helps you choose a resource with the terms in view.</p></header>
      <div className="narrow">
        <section className="info-panel"><h2>Where the listings come from</h2><p>The directory has {resources.length} resources. We’ve checked official provider material for {reviewedResources.length} since rebuilding the original catalog. Source-reviewed listings include the source, review date, free offer, and main limitation.</p></section>
        <section className="info-panel"><h2>What the filters mean</h2><ul className="about-list"><li>A free plan gives you ongoing access with limits. Time-limited and eligibility offers have their own labels.</li><li>Requirements such as a payment card or an account appear when the provider material establishes them. Unknown answers are excluded from both the Yes and No filters.</li><li>Check the individual asset’s terms if you plan to redistribute it or use it commercially. Collections may include sources with several licenses.</li></ul></section>
        <section className="info-panel"><h2>When terms change</h2><p>Provider information can change between reviews. Follow the evidence link on the listing for the current terms. Source review records the published details at the time of review.</p></section>
      </div>
      <section className="home-section" aria-labelledby="topic-index"><div className="section-heading"><h2 id="topic-index">Topic index</h2></div><div className="group-grid topic-index">{groups.map((group) => <section key={group.slug} className="info-panel"><h3>{group.name}</h3><ul>{group.categories.map((slug) => <li key={slug}><Link href={`/topics/${slug}/`}>{categories.find((category) => category.slug === slug)?.name ?? slug}</Link></li>)}</ul></section>)}</div></section>
    </div>
  );
}
