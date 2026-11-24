import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export function Breadcrumbs({ links, current }: { links: { href: string; title: string }[]; current: string }) {
  return <nav className="breadcrumb" aria-label="Breadcrumb">{links.map((link) => <span key={link.href}><Link href={link.href}>{link.title}</Link><ChevronRight size={15} aria-hidden="true" /></span>)}<span aria-current="page">{current}</span></nav>;
}
