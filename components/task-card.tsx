import Link from 'next/link';
import { BriefcaseBusiness, ChevronRight, Code2, FileText, GraduationCap, Image, Terminal } from 'lucide-react';
import type { Collection } from '@/lib/collections';

const icons = { code: Code2, terminal: Terminal, file: FileText, image: Image, briefcase: BriefcaseBusiness, graduation: GraduationCap };

export function TaskCard({ collection }: { collection: Collection }) {
  const Icon = icons[collection.icon];
  return (
    <Link href={`/collections/${collection.slug}/`} className="task-card">
      <span className="task-icon"><Icon size={23} strokeWidth={1.8} /></span>
      <span className="task-content"><strong>{collection.title}</strong><span>{collection.description}</span></span>
      <ChevronRight className="task-chevron" size={17} aria-hidden="true" />
    </Link>
  );
}
