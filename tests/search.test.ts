import assert from "node:assert/strict";
import test from "node:test";
import { categories as liveCategories, resources as liveResources } from "../lib/catalog.ts";
import { createSearchIndex, defaultFilters, parseSearchParams, searchCatalog, serializeSearchParams, type SearchFilters } from "../lib/search.ts";
import type { Category, Resource } from "../lib/types.ts";

const categories: Category[] = [
  { slug: "education-and-learning", name: "Education and learning", group: "learn" },
  { slug: "website-hosting", name: "Website hosting", group: "build" },
  { slug: "pdf-and-documents", name: "PDF and documents", group: "everyday" },
  { slug: "stock-media", name: "Stock media", group: "create" },
  { slug: "student-benefits", name: "Student benefits", group: "opportunities" },
  { slug: "career-and-jobs", name: "Career and jobs", group: "learn" },
];

function resource(fields: Partial<Resource> & Pick<Resource, "slug" | "name" | "categories">): Resource {
  return {
    url: `https://example.com/${fields.slug}`,
    access: "free-tier", description: "", tags: [], reviewed: true, ...fields,
  };
}

const index = createSearchIndex([
  resource({
    slug: "cs50p", name: "CS50’s Introduction to Programming with Python", categories: ["education-and-learning"],
    description: "A hands-on beginner Python course", tags: ["coding"], freeCertificate: true, reviewedAt: "2026-11-24",
  }),
  resource({
    slug: "pythonanywhere", name: "PythonAnywhere", categories: ["website-hosting"],
    tags: ["Python", "deploy an application"], reviewed: false,
  }),
  resource({
    slug: "github-pages", name: "GitHub Pages", categories: ["website-hosting"],
    tags: ["portfolio", "static website"], cardRequired: false, accountRequired: true,
  }),
  resource({
    slug: "host-minimal", name: "Host Minimal", categories: ["website-hosting"],
    tags: ["portfolio"], cardRequired: undefined, accountRequired: true, reviewed: false,
  }),
  resource({
    slug: "pdf24", name: "PDF24", categories: ["pdf-and-documents"],
    description: "Compress PDFs in your browser", accountRequired: false,
  }),
  resource({
    slug: "desktop-pdf", name: "Desktop PDF", categories: ["pdf-and-documents"],
    description: "Merge, split and compress PDFs", access: "free-access", openSource: true, worksOffline: true,
  }),
  resource({
    slug: "studio-images", name: "Studio Images", categories: ["stock-media"],
    description: "Stock photos for your project", commercialUse: true, attributionRequired: false,
  }),
  resource({
    slug: "rights-vary", name: "Rights Vary", categories: ["stock-media"],
    description: "Image search across licenses",
  }),
  resource({
    slug: "scholars-india", name: "National Scholarship Portal", categories: ["student-benefits"],
    region: "India", access: "eligibility", description: "Scholarship applications for Indian students",
  }),
  resource({
    slug: "resume-builder", name: "Reactive Resume", categories: ["career-and-jobs", "pdf-and-documents"],
    description: "Build and export your résumé", tags: ["resume builder"],
  }),
], categories);

const search = (query: string, filters: Partial<SearchFilters> = {}) => searchCatalog(index, { ...defaultFilters, ...filters, query });
const slugs = (query: string, filters?: Partial<SearchFilters>) => search(query, filters).results.map(({ slug }) => slug);

test("finds concrete catalog tasks in everyday wording", () => {
  assert.deepEqual(slugs("learn Python"), ["cs50p"]);
  assert.equal(slugs("host a portfolio")[0], "github-pages");
  assert.equal(slugs("compress a PDF").length, 2);
  assert.deepEqual(slugs("scholarships for Indian students"), ["scholars-india"]);
  assert.deepEqual(slugs("build a résumé"), ["resume-builder"]);
  assert.deepEqual(slugs("free certificate Python course"), ["cs50p"]);
});

test("explicit yes/no filters never imply an answer for unknown data", () => {
  assert.deepEqual(slugs("commercial use images"), ["studio-images"]);
  assert.deepEqual(slugs("images", { commercial: "no" }), []);
  assert.deepEqual(slugs("portfolio no credit card"), ["github-pages"]);
  assert.deepEqual(slugs("no account PDF"), ["pdf24"]);
  assert.deepEqual(slugs("no account PDF", { account: "yes" }), []);
});

test("open source is independent of the access plan and offline support", () => {
  assert.deepEqual(slugs("open-source PDF", { access: "free-access" }), ["desktop-pdf"]);
  assert.deepEqual(slugs("", { access: "open-source", offline: "yes" }), ["desktop-pdf"]);
  const { counts } = search("PDF", { offline: "yes" });
  assert.equal(counts.access["open-source"], 1);
  assert.equal(counts.access["free-access"], 1);
  assert.deepEqual(counts.facets.offline, { yes: 1, no: 0 });
});

test("facet counts use the query and the other current choices", () => {
  const { counts } = search("portfolio", { reviewed: true, section: "build", card: "no" });
  assert.equal(counts.categories["website-hosting"], 1);
  assert.equal(counts.sections.build, 1);
  assert.equal(counts.facets.card.no, 1);
  assert.equal(counts.facets.account.yes, 1);
  assert.equal(search("", { region: "india" }).counts.regions.india, 1);
  assert.equal(search("resume").counts.sections.learn, 1);
  assert.equal(search("resume").counts.sections.everyday, 1);
});

test("typo tolerance is used only when exact and prefix matches are absent", () => {
  assert.equal(search("pyth").approximate, false);
  const fuzzy = search("learn pyhton");
  assert.equal(fuzzy.approximate, true);
  assert.deepEqual(fuzzy.results.map(({ slug }) => slug), ["cs50p"]);
  assert.deepEqual(slugs("zzzzzz"), []);
});

test("search URLs round-trip user selections and ignore invalid values", () => {
  const filters: SearchFilters = { ...defaultFilters, query: "résumé + PDF", reviewed: true, section: "everyday", region: "india", offline: "no", sort: "recent" };
  assert.deepEqual(parseSearchParams(serializeSearchParams(filters)), filters);
  assert.deepEqual(parseSearchParams("?sort=invalid&access=all&section=has%20spaces&card=maybe&reviewed=true"), defaultFilters);
  assert.equal(parseSearchParams({ q: ["first", "second"] }).query, "first");
  assert.equal(serializeSearchParams(defaultFilters).toString(), "");
});

test("launch catalog supports the core directory tasks with reviewed evidence", () => {
  const liveIndex = createSearchIndex(liveResources, liveCategories);
  const tasks = [
    ["learn Python", "Harvard CS50P"],
    ["host a portfolio without a credit card", "GitHub Pages"],
    ["compress a PDF no account", "PDF24"],
    ["images for commercial use", "Pexels"],
    ["scholarships for Indian students", "National Scholarship Portal"],
  ];
  for (const [query, expected] of tasks) {
    const result = searchCatalog(liveIndex, { ...defaultFilters, query });
    assert.ok(result.results.some(({ name, reviewed, sourceUrl }) => name === expected && reviewed && sourceUrl), query);
  }
});
