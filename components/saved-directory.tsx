'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import type { Resource } from '@/lib/types';
import { ResourceCard } from './resource-card';
import { migrateBookmarks, useBookmarks } from './saved-store';

export function SavedDirectory({ resources, legacySlugs }: { resources: Resource[]; legacySlugs: Record<string, string> }) {
  useEffect(() => migrateBookmarks(legacySlugs), [legacySlugs]);
  const saved = useBookmarks();
  const picks = resources.filter((resource) => saved.includes(resource.slug));
  if (!picks.length) return <div className="empty-panel"><Bookmark size={30} /><h2>Your list is empty</h2><p>Use the bookmark button on a resource to keep it here.</p><Link className="button button-primary" href="/browse/">Browse the directory</Link></div>;
  return <div className="resource-grid">{picks.map((resource) => <ResourceCard key={resource.slug} resource={resource} />)}</div>;
}
