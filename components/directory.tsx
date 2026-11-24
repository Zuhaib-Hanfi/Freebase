'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ChevronDown, ChevronRight, Grid2X2, List, Search, SlidersHorizontal, X } from 'lucide-react';
import { booleanFacets, createSearchIndex, defaultFilters, parseSearchParams, searchCatalog, serializeSearchParams } from '@/lib/search';
import type { BooleanFacet, SearchFilters } from '@/lib/search';
import type { Access, Category, CategoryGroup, Resource } from '@/lib/types';
import { accessLabel, ResourceCard } from './resource-card';

const urlChange = 'freebase-directory-url';
const viewChange = 'freebase-directory-view';
const viewKey = 'freebase-directory-layout';
const pageSize = 18;
const accesses: Access[] = ['free-access', 'free-tier', 'open-source', 'eligibility', 'time-limited', 'promotional', 'unknown'];
const facets = Object.keys(booleanFacets) as BooleanFacet[];
const fitsSection: Record<string, BooleanFacet[]> = {
  learn: ['certificate', 'account'],
  build: ['card', 'commercial', 'domain', 'account'],
  create: ['commercial', 'attribution', 'account'],
  everyday: ['account', 'offline'],
  opportunities: ['account'],
  explore: ['account', 'commercial'],
};
type View = 'grid' | 'list';
let currentView: View = 'grid';

function subscribeUrl(listener: () => void) {
  window.addEventListener('popstate', listener);
  window.addEventListener(urlChange, listener);
  return () => {
    window.removeEventListener('popstate', listener);
    window.removeEventListener(urlChange, listener);
  };
}

function LocationSync() {
  const params = useSearchParams();
  useEffect(() => { window.dispatchEvent(new Event(urlChange)); }, [params]);
  return null;
}

function subscribeView(listener: () => void) {
  window.addEventListener(viewChange, listener);
  window.addEventListener('storage', listener);
  return () => {
    window.removeEventListener(viewChange, listener);
    window.removeEventListener('storage', listener);
  };
}

function getView(): View {
  try {
    const saved = localStorage.getItem(viewKey) ?? localStorage.getItem('freebase-view');
    if (saved === 'list' || saved === '"list"') return 'list';
    if (saved === 'grid' || saved === '"grid"') return 'grid';
  } catch {
    // The layout can still change when storage is unavailable.
  }
  return currentView;
}

function setView(view: View) {
  currentView = view;
  try { localStorage.setItem(viewKey, view); } catch { /* Keep the preference in memory. */ }
  window.dispatchEvent(new Event(viewChange));
}

function updateUrl(filters: SearchFilters, page = 1) {
  const params = serializeSearchParams(filters);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  const next = window.location.pathname + (query ? '?' + query : '');
  if (next !== window.location.pathname + window.location.search) {
    window.history.pushState(null, '', next);
    window.dispatchEvent(new Event(urlChange));
  }
}

function Select({ label, className = '', value, onChange, children }: {
  label: string;
  className?: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className={'field ' + className}>
      <span>{label}</span>
      <span className="select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
        <ChevronDown size={15} aria-hidden="true" />
      </span>
    </label>
  );
}

function regionLabel(region: string) {
  return region.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function Directory({ resources, groups, categories, home = false }: {
  resources: Resource[];
  groups: CategoryGroup[];
  categories: Category[];
  home?: boolean;
}) {
  const raw = useSyncExternalStore(subscribeUrl, () => window.location.search, () => '');
  const view = useSyncExternalStore(subscribeView, getView, () => 'grid' as const);
  const filters = useMemo(() => parseSearchParams(raw), [raw]);
  const index = useMemo(() => createSearchIndex(resources, categories), [resources, categories]);
  const { results, counts, approximate } = useMemo(() => searchCatalog(index, filters), [index, filters]);
  const [allFilters, showAllFilters] = useState(false);
  const searchField = useRef<HTMLInputElement>(null);
  const resultsHeading = useRef<HTMLHeadingElement>(null);
  const reviewedCount = useMemo(() => resources.filter((item) => item.reviewed).length, [resources]);
  const categoryNames = useMemo(() => new Map(categories.map((item) => [item.slug, item.name])), [categories]);
  const section = groups.find((item) => item.slug === filters.section);
  const category = categories.find((item) => item.slug === filters.category);
  const visibleGroup = section?.slug ?? category?.group;
  const availableCategories = categories.filter((item) => !section || item.group === section.slug);
  const regions = useMemo(() => [...new Set(resources.map((item) => item.region?.toLowerCase().replaceAll(' ', '-')).filter((region): region is string => Boolean(region)))].sort(), [resources]);
  const visibleFacets = [...new Set([...(fitsSection[visibleGroup ?? ''] ?? ['account', 'commercial', 'card']), ...facets.filter((key) => filters[key])])];
  const requestedPage = Number(new URLSearchParams(raw).get('page'));
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
  const start = (page - 1) * pageSize;
  const active: { key: keyof SearchFilters; text: string; reset: Partial<SearchFilters> }[] = [];

  if (filters.query) active.push({ key: 'query', text: '“' + filters.query + '”', reset: { query: '' } });
  if (filters.section) active.push({ key: 'section', text: section?.name ?? filters.section, reset: { section: '', category: '' } });
  if (filters.category) active.push({ key: 'category', text: category?.name ?? filters.category, reset: { category: '' } });
  if (filters.access) active.push({ key: 'access', text: accessLabel(filters.access), reset: { access: '' } });
  if (filters.region) active.push({ key: 'region', text: regionLabel(filters.region), reset: { region: '' } });
  if (filters.reviewed) active.push({ key: 'reviewed', text: 'Source-reviewed', reset: { reviewed: false } });
  for (const key of facets) {
    if (filters[key]) active.push({
      key,
      text: booleanFacets[key] + ' · ' + (filters[key] === 'yes' ? 'Yes' : 'No'),
      reset: { [key]: '' },
    });
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (event.key !== '/' || event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return;
      event.preventDefault();
      searchField.current?.focus();
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  function change(values: Partial<SearchFilters>) {
    updateUrl({ ...filters, ...values });
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q');
    if (typeof query === 'string') change({ query });
    requestAnimationFrame(() => resultsHeading.current?.focus({ preventScroll: true }));
  }

  function goToPage(nextPage: number) {
    updateUrl(filters, nextPage);
    resultsHeading.current?.focus();
    resultsHeading.current?.scrollIntoView({ block: 'start' });
  }

  return (
    <div className={'container directory-page' + (home ? ' directory-home' : '')}>
      <Suspense><LocationSync /></Suspense>
      {home ? (
        <header className="directory-intro">
          <div>
            <h1>The internet.<br /><span>Without the price tag.</span></h1>
            <p>Free tools, courses, software, and more. Find what you need and see what’s included.</p>
          </div>
          <dl className="directory-stats" aria-label="Catalog summary">
            <div><dt>{resources.length.toLocaleString('en')}</dt><dd>Resources</dd></div>
            <div><dt>{categories.length}</dt><dd>Categories</dd></div>
            <div><dt>{reviewedCount}</dt><dd><Link href="/about/">Source-reviewed</Link></dd></div>
          </dl>
        </header>
      ) : (
        <header className="page-heading directory-heading">
          <h1>Resource directory</h1>
          <p>Find free tools, courses, and opportunities by what you need to do.</p>
        </header>
      )}

      <form role="search" action={home ? '/' : '/browse/'} className="directory-search" onSubmit={search}>
        <div className="search-field">
          <label className="sr-only" htmlFor="catalog-search">Search resources</label>
          <Search size={20} aria-hidden="true" />
          <input key={filters.query} ref={searchField} id="catalog-search" type="search" name="q" defaultValue={filters.query} placeholder="Search free resources…" maxLength={140} />
          <kbd aria-hidden="true">/</kbd>
        </div>
        <button className="button button-primary" type="submit">Search</button>
      </form>

      <Select label="Browse by category" className="mobile-topics" value={category?.slug ?? (section ? 'group:' + section.slug : '')} onChange={(value) => {
        const picked = categories.find((item) => item.slug === value);
        change({ section: value.startsWith('group:') ? value.slice(6) : picked?.group ?? '', category: picked?.slug ?? '' });
      }}>
        <option value="">All categories</option>
        {groups.map((group) => (
          <optgroup key={group.slug} label={group.name}>
            <option value={'group:' + group.slug}>All {group.name.toLowerCase()} resources</option>
            {group.categories.map((slug) => <option key={slug} value={slug}>{categoryNames.get(slug)}</option>)}
          </optgroup>
        ))}
      </Select>

      <div className="browse-layout">
        <aside className="topic-sidebar" aria-label="Browse categories">
          <h2>Browse categories</h2>
          <button className="topic-button" aria-pressed={!filters.section && !filters.category} onClick={() => change({ section: '', category: '' })}>
            <span>All resources</span><span className="topic-count">{resources.length}</span>
          </button>
          {groups.map((group) => (
            <div key={group.slug}>
              <button className="topic-button" aria-pressed={visibleGroup === group.slug && !filters.category} aria-expanded={visibleGroup === group.slug} onClick={() => change({ section: visibleGroup === group.slug && !filters.category ? '' : group.slug, category: '' })}>
                <span>{group.name}</span><span className="topic-count">{counts.sections[group.slug] ?? 0}<ChevronRight size={14} aria-hidden="true" /></span>
              </button>
              {visibleGroup === group.slug && (
                <div className="topic-children">
                  {group.categories.map((slug) => (
                    <button className="topic-button" key={slug} aria-pressed={filters.category === slug} onClick={() => change({ section: group.slug, category: filters.category === slug ? '' : slug })}>
                      <span>{categoryNames.get(slug)}</span><span className="topic-count">{counts.categories[slug] ?? 0}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link className="topic-index-link" href="/about/#topic-index">See all categories</Link>
        </aside>

        <section aria-labelledby="results-heading" className="browse-results">
          <div className="results-heading">
            <div>
              <h2 id="results-heading" ref={resultsHeading} tabIndex={-1}>{category?.name ?? section?.name ?? 'All resources'}</h2>
              <p role="status">{results.length ? 'Showing ' + (start + 1) + '–' + Math.min(start + pageSize, results.length) + ' of ' + results.length.toLocaleString('en') + ' resources' : '0 resources'}{approximate ? ' · Showing close matches' : ''}</p>
            </div>
            <div className="results-controls">
              <Select label="Access" className="toolbar-select" value={filters.access} onChange={(value) => change({ access: value as SearchFilters['access'] })}>
                <option value="">Any access</option>
                {accesses.map((access) => <option key={access} value={access}>{accessLabel(access)} ({counts.access[access] ?? 0})</option>)}
              </Select>
              <Select label="Sort by" className="toolbar-select" value={filters.sort} onChange={(value) => change({ sort: value as SearchFilters['sort'] })}>
                <option value="relevance">Relevance</option>
                <option value="name">Name A–Z</option>
                <option value="recent">Recently reviewed</option>
              </Select>
              <div className="view-switch" role="group" aria-label="Result layout">
                <button className="icon-button" type="button" aria-pressed={view === 'grid'} aria-label="Grid view" onClick={() => setView('grid')}><Grid2X2 size={17} /></button>
                <button className="icon-button" type="button" aria-pressed={view === 'list'} aria-label="List view" onClick={() => setView('list')}><List size={18} /></button>
              </div>
            </div>
          </div>

          <details className="filters-panel">
            <summary><SlidersHorizontal size={17} /> Filters <ChevronDown className="filters-chevron" size={16} /></summary>
            <div className="filter-body">
              <Select label="Category" className="desktop-category" value={filters.category} onChange={(value) => change({ category: value })}>
                <option value="">All categories</option>
                {availableCategories.map((item) => <option key={item.slug} value={item.slug}>{item.name} ({counts.categories[item.slug] ?? 0})</option>)}
              </Select>
              <Select label="Region" value={filters.region} onChange={(value) => change({ region: value })}>
                <option value="">Any region</option>
                {regions.map((region) => <option key={region} value={region}>{regionLabel(region)} ({counts.regions[region] ?? 0})</option>)}
              </Select>
              {(allFilters ? facets : visibleFacets).map((key) => (
                <Select key={key} label={booleanFacets[key]} value={filters[key]} onChange={(value) => change({ [key]: value })}>
                  <option value="">Any</option>
                  <option value="yes">Yes ({counts.facets[key].yes})</option>
                  <option value="no">No ({counts.facets[key].no})</option>
                </Select>
              ))}
              <label className="checkbox-label">
                <input type="checkbox" checked={filters.reviewed} onChange={(event) => change({ reviewed: event.target.checked })} />
                <span>Source-reviewed only <small>({counts.reviewed})</small></span>
              </label>
              <button className="text-button" aria-expanded={allFilters} onClick={() => showAllFilters(!allFilters)}>{allFilters ? 'Show fewer filters' : 'Show all filters'}</button>
            </div>
          </details>

          {active.length > 0 && (
            <div className="filter-chips" aria-label="Active search and filters">
              {active.map((chip) => (
                <button className="filter-chip" key={chip.key} onClick={() => change(chip.reset)} aria-label={'Remove ' + chip.text}>{chip.text}<X size={14} /></button>
              ))}
              <button className="text-button" onClick={() => updateUrl(defaultFilters)}>Clear all</button>
            </div>
          )}

          {results.length ? (
            <>
              <div className={'resource-grid browse-grid' + (view === 'list' ? ' resource-list' : '')}>
                {results.slice(start, start + pageSize).map((resource) => <ResourceCard key={resource.slug} resource={resource} category={categoryNames.get(category?.slug ?? resource.categories[0])} />)}
              </div>
              {totalPages > 1 && (
                <nav className="pagination" aria-label="Result pages">
                  <button className="button" disabled={page === 1} onClick={() => goToPage(page - 1)}>Previous</button>
                  <span>Page {page} of {totalPages}</span>
                  <button className="button" disabled={page === totalPages} onClick={() => goToPage(page + 1)}>Next</button>
                </nav>
              )}
            </>
          ) : (
            <div className="empty-panel">
              <Search size={29} /><h3>No matches found</h3>
              <p>Try a shorter phrase or remove one of the current filters.</p>
              <button className="button" onClick={() => updateUrl(defaultFilters)}>Reset search and filters</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
