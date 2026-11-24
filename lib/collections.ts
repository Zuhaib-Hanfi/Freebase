import { resources } from './catalog.ts';

export const collections = [
  {
    slug: 'publish-a-portfolio', title: 'Publish a portfolio', label: 'Build', icon: 'code', color: 'mint',
    description: 'Put your work online with a free subdomain or a site you can build without code.',
    tip: 'Pick a host based on how you want to build. A static host works well for HTML and CSS. A visual builder is easier if you want a template and an editor.',
    picks: ['GitHub Pages', 'Cloudflare Pages', 'Carrd', 'Codeberg Pages', 'Neocities'],
  },
  {
    slug: 'learn-python', title: 'Learn Python', label: 'Learn', icon: 'terminal', color: 'lilac',
    description: 'Start from the basics with free lessons, practice, and projects.',
    tip: 'Choose one course and write code as you go. If you need a credential, check what the provider offers for free before you enroll.',
    picks: ['Harvard CS50P', 'Python for Everybody', 'Python Programming MOOC', 'Exercism Python Track', 'Automate the Boring Stuff with Python'],
  },
  {
    slug: 'fix-a-pdf', title: 'Fix a PDF', label: 'Everyday', icon: 'file', color: 'peach',
    description: 'Shrink, split, combine, or scan a PDF without a paid subscription.',
    tip: 'For sensitive documents, use a desktop app or a tool whose source confirms local processing. Splitting and merging pages call for a different tool than editing text.',
    picks: ['PDF24', 'PDFsam Basic', 'NAPS2', 'Stirling PDF'],
  },
  {
    slug: 'find-reusable-images', title: 'Find reusable images', label: 'Create', icon: 'image', color: 'blue',
    description: 'Find photos, illustrations, and public-domain art for your next project.',
    tip: 'Check the license on the individual asset, especially for client work. Save the source and creator details when attribution is required.',
    picks: ['Openverse', 'Wikimedia Commons', 'The Met', 'Art Institute of Chicago', 'Pexels'],
  },
  {
    slug: 'build-a-resume', title: 'Build a résumé', label: 'Career', icon: 'briefcase', color: 'peach',
    description: 'Turn your experience into a clean résumé you can export and share.',
    tip: 'Start with a readable, single-column layout. Export a test PDF early so you know which download options are included.',
    picks: ['Reactive Resume', 'Europass', 'RenderCV', 'Canva Résumé Templates'],
  },
  {
    slug: 'find-student-benefits', title: 'Find student benefits', label: 'Opportunities', icon: 'graduation', color: 'lilac',
    description: 'Discover student plans and find scholarship portals for India.',
    tip: 'Check the proof of enrollment, location rules, and expiry date. Scholarship deadlines and eligibility vary by scheme.',
    picks: ['GitHub Student Developer Pack', 'JetBrains Education', 'Microsoft Education', 'National Scholarship Portal', 'Figma Education'],
  },
] as const;

export type Collection = (typeof collections)[number];

const byName = new Map(resources.map((resource) => [resource.name.toLowerCase(), resource]));

export function collectionResources(collection: Collection) {
  return collection.picks.flatMap((name) => {
    const resource = byName.get(name.toLowerCase());
    return resource ? [resource] : [];
  });
}
