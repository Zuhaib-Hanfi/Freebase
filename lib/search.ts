import type { Access, Category, Resource } from "./types";

export const booleanFacets = {
  card: "Payment card required",
  account: "Account required",
  commercial: "Commercial use allowed",
  certificate: "Free certificate",
  offline: "Works offline",
  attribution: "Attribution required",
  domain: "Custom domain support",
} as const;

const facetFields = {
  card: "cardRequired",
  account: "accountRequired",
  commercial: "commercialUse",
  certificate: "freeCertificate",
  offline: "worksOffline",
  attribution: "attributionRequired",
  domain: "customDomain",
} as const satisfies Record<BooleanFacet, keyof Resource>;

const facetKeys = Object.keys(booleanFacets) as BooleanFacet[];
const startingResources = [
  'github-pages', 'harvard-cs50p', 'pdf24', 'openverse', 'reactive-resume',
  'github-student-developer-pack', 'webaim-wave', 'squoosh', 'audacity',
];
const startingRank = new Map(startingResources.map((slug, index) => [slug, index]));
const accessValues = new Set<string>([
  "free-access", "free-tier", "open-source", "eligibility", "promotional", "unknown", "time-limited",
]);

export type BooleanFacet = keyof typeof booleanFacets;
export type FacetValue = "" | "yes" | "no";
export type Sort = "relevance" | "name" | "recent";

export type SearchFilters = Record<BooleanFacet, FacetValue> & {
  query: string;
  section: string;
  category: string;
  access: Access | "";
  region: string;
  sort: Sort;
  reviewed: boolean;
};

export const defaultFilters: SearchFilters = {
  query: "", section: "", category: "", access: "", region: "",
  sort: "relevance", reviewed: false,
  card: "", account: "", commercial: "", certificate: "", offline: "", attribution: "", domain: "",
};

type ParamSource = string | Pick<URLSearchParams, "get"> | Record<string, string | string[] | undefined>;

export function parseSearchParams(input: ParamSource): SearchFilters {
  const params = typeof input === "string" ? new URLSearchParams(input) : input;
  const get = (key: string) => {
    if (typeof params.get === "function") return params.get(key) ?? "";
    const value = (params as Record<string, string | string[] | undefined>)[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };
  const slug = (key: string) => {
    const value = get(key);
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 80 ? value : "";
  };
  const access = get("access");
  const sort = get("sort");
  const result: SearchFilters = {
    ...defaultFilters,
    query: get("q").trim().slice(0, 140),
    section: slug("section"),
    category: slug("category"),
    region: slug("region"),
    access: accessValues.has(access) ? access as Access : "",
    sort: sort === "name" || sort === "recent" ? sort : "relevance",
    reviewed: get("reviewed") === "1",
  };
  for (const key of facetKeys) {
    const value = get(key);
    if (value === "yes" || value === "no") result[key] = value;
  }
  return result;
}

export function serializeSearchParams(filters: SearchFilters): URLSearchParams {
  const params = new URLSearchParams();
  const query = filters.query.trim().slice(0, 140);
  if (query) params.set("q", query);
  for (const key of ["section", "category", "access", "region", ...facetKeys] as const) {
    if (filters[key]) params.set(key, filters[key]);
  }
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  if (filters.reviewed) params.set("reviewed", "1");
  return params;
}

const stopWords = new Set([
  "a", "an", "and", "any", "are", "best", "can", "find", "for", "free", "get", "how", "i", "in", "is",
  "me", "my", "of", "on", "please", "some", "the", "to", "use", "using", "want", "what", "where", "which", "who", "with",
]);

const termAliases: Record<string, string> = {
  beginners: "beginner",
  compressing: "compress", compression: "compress", compressor: "compress", shrink: "compress", reduce: "compress",
  converter: "convert", converting: "convert", conversion: "convert",
  class: "course", classes: "course", courses: "course", lesson: "course", lessons: "course",
  learning: "learn", tutorials: "tutorial", guides: "guide", programming: "code", coding: "code",
  cv: "resume", cvs: "resume", resumes: "resume",
  deploy: "host", deployed: "host", deployment: "host", hosting: "host", publication: "host", publish: "host",
  indian: "india", scholarships: "scholarship", students: "student",
  pictures: "image", picture: "image", photos: "image", photo: "image", images: "image",
  portfolios: "portfolio", websites: "website", sites: "site", tools: "tool",
  pdfs: "pdf", docs: "document", documents: "document",
  fonts: "font", icons: "icon", videos: "video",
};

function normalize(text: string) {
  return text.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/\bc\+\+/g, "cplusplus ").replace(/\bc#/g, "csharp ").replace(/(^|\s)\.net\b/g, "$1dotnet")
    .replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function terms(text: string) {
  return normalize(text).split(" ").filter((word) => word && !stopWords.has(word))
    .map((word) => Object.hasOwn(termAliases, word) ? termAliases[word] : word);
}

interface IntentRule {
  pattern: RegExp;
  facet?: BooleanFacet;
  value?: FacetValue;
  replacement?: string;
}

const intentRules: IntentRule[] = [
  { pattern: /\b(?:no|without) (?:a |an )?(?:credit |debit |payment )?card(?:s)?\b/g, facet: "card", value: "no" },
  { pattern: /\b(?:card|credit card|payment card) (?:is )?not required\b/g, facet: "card", value: "no" },
  { pattern: /\b(?:no|without) (?:a |an )?(?:account|login|log in|sign up|signup|registration|sign in)(?: required)?\b/g, facet: "account", value: "no" },
  { pattern: /\b(?:account|login|sign up|registration) (?:is )?not required\b/g, facet: "account", value: "no" },
  { pattern: /\b(?:free (?:completion )?certificates?|certificates? (?:for )?free)\b/g, facet: "certificate", value: "yes" },
  { pattern: /\b(?:no|without) commercial use\b/g, facet: "commercial", value: "no" },
  { pattern: /\b(?:for )?non commercial use\b/g, replacement: "" },
  { pattern: /\b(?:for )?commercial use\b/g, facet: "commercial", value: "yes" },
  { pattern: /\b(?:no|without) attribution\b/g, facet: "attribution", value: "no" },
  { pattern: /\b(?:works? )?offline\b/g, facet: "offline", value: "yes" },
  { pattern: /\b(?:with (?:a )?)?custom domains?\b/g, facet: "domain", value: "yes" },
  { pattern: /\b(?:open source|opensource)\b/g, replacement: "" },
  { pattern: /\b(?:file size|file sizes)\b/g, replacement: "" },
  { pattern: /\b(?:build|make|create|write) (?:a |my )?(?:resume|cv)\b/g, replacement: "resume builder" },
  { pattern: /\b(?:learn|study) (?:some )?python\b/g, replacement: "python learn" },
];

function parseIntent(query: string) {
  let text = normalize(query);
  const openSource = /\b(?:open source|opensource)\b/.test(text);
  const facets: Partial<Record<BooleanFacet, FacetValue>> = {};
  for (const { pattern, facet, value, replacement } of intentRules) {
    text = text.replace(pattern, () => {
      if (facet && value) facets[facet] = value;
      return ` ${replacement ?? ""} `;
    });
  }
  return { tokens: [...new Set(terms(text))], phrase: normalize(text), facets, openSource };
}

function regionSlug(region: string) {
  return normalize(region).replace(/\s+/g, "-");
}

type Entry = {
  resource: Resource;
  name: string;
  sections: string[];
  region: string;
  access: Access[];
  weights: Map<string, number>;
};

export type SearchIndex = ReadonlyArray<Entry>;

export function createSearchIndex(resources: readonly Resource[], categories: readonly Category[]): SearchIndex {
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  return resources.map((resource) => {
    const weights = new Map<string, number>();
    const resolved = resource.categories.flatMap((slug) => categoryBySlug.get(slug) ?? []);
    const fields: Array<[string, number]> = [
      [resource.name, 52], [resource.name.replace(/([a-z\d])([A-Z])/g, "$1 $2"), 50],
      [normalize(resource.name).replaceAll(" ", ""), 48], [(resource.searchTerms ?? []).join(" "), 31],
      [resource.tags.join(" "), 28], [resource.bestFor ?? "", 23], [resource.description, 21],
      [resource.free ?? "", 14], [resolved.map(({ name }) => name).join(" "), 13],
      [resource.region ?? "", 12], [resource.license ?? "", 12],
      [[...(resource.platform ?? []), ...(resource.language ?? []), resource.level ?? ""].join(" "), 12],
      [new URL(resource.url).hostname, 7],
    ];
    for (const [field, weight] of fields) {
      for (const word of terms(field)) weights.set(word, Math.max(weight, weights.get(word) ?? 0));
    }
    const access = new Set([resource.access]);
    if (resource.openSource) access.add("open-source");
    return {
      resource, name: normalize(resource.name), weights, access: [...access],
      sections: [...new Set(resolved.map(({ group }) => group))],
      region: resource.region ? regionSlug(resource.region) : "",
    };
  });
}

function oneTypo(a: string, b: string): boolean {
  if (a.length < 4 || b.length < 4 || Math.abs(a.length - b.length) > 1 || a[0] !== b[0]) return false;
  if (a.length > b.length) [a, b] = [b, a];
  let index = 0;
  while (index < a.length && a[index] === b[index]) index++;
  if (a.length !== b.length) return a.slice(index) === b.slice(index + 1);
  if (a.slice(index + 1) === b.slice(index + 1)) return true;
  return a[index] === b[index + 1] && a[index + 1] === b[index] && a.slice(index + 2) === b.slice(index + 2);
}

const taskVerbs = new Set(["build", "compress", "create", "host", "learn"]);

function rank(entry: Entry, tokens: string[], phrase: string, fuzzy: boolean) {
  const resource = entry.resource;
  let score = resource.reviewed ? (tokens.length > 1 ? 20 : 8) : 0;
  for (const token of tokens) {
    let weight = entry.weights.get(token) ?? 0;
    if (!weight && token.length >= 2) {
      for (const [word, candidate] of entry.weights) {
        const allowPrefix = token.length >= 3 || (tokens.length === 1 && candidate >= 28);
        if (allowPrefix && word.startsWith(token)) weight = Math.max(weight, candidate * 0.38);
        else if (fuzzy && candidate >= 13 && oneTypo(word, token)) weight = Math.max(weight, candidate * 0.24);
      }
    }
    if (!weight) return -1;
    score += tokens.length > 1 && taskVerbs.has(token) ? Math.min(weight, 28) : weight;
  }
  if (tokens.length && phrase) {
    if (entry.name === phrase) score += 200;
    else if (entry.name.startsWith(`${phrase} `)) score += 95;
    else if (` ${entry.name} `.includes(` ${phrase} `)) score += 55;
  }
  return score;
}

function countMap(): Record<string, number> {
  return Object.create(null) as Record<string, number>;
}

function freshCounts() {
  const facets = {} as Record<BooleanFacet, Record<"yes" | "no", number>>;
  for (const key of facetKeys) facets[key] = { yes: 0, no: 0 };
  return { sections: countMap(), categories: countMap(), access: countMap(), regions: countMap(), reviewed: 0, facets };
}

function bump(counts: Record<string, number>, values: readonly string[]) {
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
}

const nameCollator = new Intl.Collator("en", { sensitivity: "base" });

export function searchCatalog(index: SearchIndex, filters: SearchFilters) {
  const intent = parseIntent(filters.query);
  function collect(fuzzy: boolean) {
    const counts = freshCounts();
    const matches: Array<{ resource: Resource; score: number }> = [];
    let lexicalMatches = 0;
    for (const entry of index) {
      const { resource } = entry;
      if (intent.openSource && !entry.access.includes("open-source")) continue;
      if (facetKeys.some((key) => intent.facets[key] && resource[facetFields[key]] !== (intent.facets[key] === "yes"))) continue;
      const score = rank(entry, intent.tokens, intent.phrase, fuzzy);
      if (score < 0) continue;
      lexicalMatches++;
      // Count each facet against the other current choices so alternatives stay visible.
      const failed: string[] = [];
      if (filters.section && !entry.sections.includes(filters.section)) failed.push("sections");
      if (filters.category && !resource.categories.includes(filters.category)) failed.push("categories");
      if (filters.access && !entry.access.includes(filters.access)) failed.push("access");
      if (filters.region && filters.region !== entry.region) failed.push("regions");
      if (filters.reviewed && !resource.reviewed) failed.push("reviewed");
      for (const key of facetKeys) {
        if (filters[key] && resource[facetFields[key]] !== (filters[key] === "yes")) failed.push(key);
      }
      if (!failed.length) matches.push({ resource, score });
      if (failed.length > 1) continue;
      const available = (key: string) => !failed.length || failed[0] === key;
      if (available("sections")) bump(counts.sections, entry.sections);
      if (available("categories")) bump(counts.categories, resource.categories);
      if (available("access")) bump(counts.access, entry.access);
      if (available("regions") && entry.region) bump(counts.regions, [entry.region]);
      if (available("reviewed") && resource.reviewed) counts.reviewed++;
      for (const key of facetKeys) {
        const value = resource[facetFields[key]];
        if (available(key) && typeof value === "boolean") counts.facets[key][value ? "yes" : "no"]++;
      }
    }
    return { matches, counts, lexicalMatches };
  }

  const strict = collect(false);
  let { matches, counts } = strict;
  let approximate = false;
  if (!strict.lexicalMatches && intent.tokens.some((term) => term.length >= 4)) {
    const approximations = collect(true);
    if (approximations.matches.length) {
      ({ matches, counts } = approximations);
      approximate = true;
    }
  }
  matches.sort((a, b) => {
    const byName = nameCollator.compare(a.resource.name, b.resource.name);
    if (filters.sort === "name") return byName || a.resource.slug.localeCompare(b.resource.slug);
    if (filters.sort === "recent") {
      const byDate = (b.resource.reviewedAt ?? "").localeCompare(a.resource.reviewedAt ?? "");
      if (byDate) return byDate;
    }
    if (!filters.query && !filters.section && !filters.category && filters.sort === "relevance") {
      const byStartingRank = (startingRank.get(a.resource.slug) ?? startingResources.length)
        - (startingRank.get(b.resource.slug) ?? startingResources.length);
      if (byStartingRank) return byStartingRank;
    }
    return b.score - a.score || byName || a.resource.slug.localeCompare(b.resource.slug);
  });
  return { results: matches.map(({ resource }) => resource), counts, approximate };
}
