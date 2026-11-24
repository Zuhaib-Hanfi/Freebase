import type { Metadata } from 'next';
import { Directory } from '@/components/directory';
import { categories, groups, resources } from '@/lib/catalog';

export const metadata: Metadata = {
  title: 'Directory',
  description: 'Search and filter free tools, courses, assets, and opportunities.',
};

export default function BrowsePage() {
  return <Directory resources={resources} groups={groups} categories={categories} />;
}
