import { Directory } from '@/components/directory';
import { categories, groups, resources } from '@/lib/catalog';

export default function HomePage() {
  return <Directory resources={resources} groups={groups} categories={categories} home />;
}
