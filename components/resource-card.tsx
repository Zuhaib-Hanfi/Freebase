import Link from 'next/link';
import { BadgeCheck, ExternalLink } from 'lucide-react';
import type { Resource } from '@/lib/types';
import { SaveButton } from './saved-store';

const labels: Record<Resource['access'], string> = {
  'free-access': 'Free access', 'free-tier': 'Free plan', 'open-source': 'Open source', eligibility: 'Eligibility required',
  promotional: 'Promotion', unknown: 'Terms to check', 'time-limited': 'Time-limited',
};

export function accessLabel(access: Resource['access']) {
  return labels[access];
}

export function ResourceMark({ resource }: { resource: Resource }) {
  const initials = resource.name.split(/[^\p{L}\p{N}]+/u).filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join('').toUpperCase();
  return <span className="resource-mark" aria-hidden="true">{initials || 'FB'}</span>;
}

export function ResourceCard({ resource, category }: { resource: Resource; category?: string }) {
  return (
    <article className="resource-card">
      <div className="resource-top"><ResourceMark resource={resource} /><SaveButton slug={resource.slug} name={resource.name} /></div>
      <div className="resource-body">
        {category && <p className="resource-category">{category}</p>}
        <h3><Link href={`/resource/${resource.slug}/`}>{resource.name}</Link></h3>
        <p className="resource-description">{resource.description}</p>
      </div>
      <div className="resource-bottom">
        <div className="resource-badges">
          <span className="badge" title={resource.reviewed ? undefined : 'Original listing label. Check with the provider.'}>{accessLabel(resource.access)}</span>
          {resource.reviewed && <span className="reviewed-label" title="Official source reviewed"><BadgeCheck size={16} aria-hidden="true" /><span>Reviewed</span></span>}
        </div>
        <a className="external-link" href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${resource.name} (opens in a new tab)`}>Visit <ExternalLink size={14} /></a>
      </div>
    </article>
  );
}
