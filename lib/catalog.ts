import legacyData from "../data/legacy.json" with { type: "json" };
import reviewedData from "../data/reviewed.json" with { type: "json" };
import type { Access, Category, CategoryGroup, Resource } from "./types.ts";

export type { Access, Category, CategoryGroup, Resource } from "./types.ts";

export const accessOptions: { id: Access; label: string }[] = [
  { id: "free-access", label: "Free access" },
  { id: "free-tier", label: "Free plan" },
  { id: "open-source", label: "Open source" },
  { id: "eligibility", label: "Eligibility required" },
  { id: "time-limited", label: "Time-limited" },
  { id: "promotional", label: "Promotion" },
  { id: "unknown", label: "Access unconfirmed" },
];

export const accessLabels = Object.fromEntries(
  accessOptions.map(({ id, label }) => [id, label]),
) as Record<Access, string>;

const prototypeAccess: Record<string, Access> = {
  "Free access": "free-access",
  "Free tier": "free-tier",
  "Open source": "open-source",
  Eligibility: "eligibility",
  Promotional: "promotional",
};

const taxonomy = [
  {
    slug: "learn",
    name: "Learn",
    description: "Courses, books, languages, and practice for building new skills.",
    categories: [
      "Education and learning",
      "Certificates and badges",
      "Books and audiobooks",
      "Programming practice",
      "Language learning",
      "Research and science",
      "Engineering and simulation",
    ],
  },
  {
    slug: "create",
    name: "Create",
    description: "Design, media, and templates for your next project.",
    categories: [
      "Graphic design",
      "Design inspiration",
      "UI components",
      "Stock media",
      "Fonts and icons",
      "Video and animation",
      "Music and sound",
      "Templates",
      "AI creative tools",
      "Game development and 3D",
      "Social media and marketing",
    ],
  },
  {
    slug: "build",
    name: "Build",
    description: "Developer tools, hosting, and services for shipping software.",
    categories: [
      "Website hosting",
      "Databases and backend",
      "Domains and DNS",
      "Cloud infrastructure",
      "Developer tools",
      "AI APIs and GPUs",
      "Datasets and APIs",
      "No-code and automation",
    ],
  },
  {
    slug: "everyday",
    name: "Everyday",
    description: "Practical tools for work, files, and everyday tasks.",
    categories: [
      "AI assistants",
      "Productivity and office",
      "PDF and documents",
      "Storage and sharing",
      "Operating systems and utilities",
      "Privacy and security",
      "Health and fitness",
      "Finance and investing",
    ],
  },
  {
    slug: "opportunities",
    name: "Opportunities",
    description: "Benefits, jobs, grants, and public services.",
    categories: [
      "Student benefits",
      "Career and jobs",
      "Freelancing and business",
      "India government resources",
      "Grants and rewards",
      "Physical samples and swag",
    ],
  },
  {
    slug: "explore",
    name: "Explore",
    description: "Games, culture, and interesting corners of the web.",
    categories: [
      "Games",
      "Entertainment",
      "Virtual exploration",
      "Interesting websites",
      "Resource directories",
    ],
  },
];

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z\d]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const categories: Category[] = taxonomy.flatMap((group) =>
  group.categories.map((name) => ({ name, slug: slugify(name), group: group.slug })),
);

export const groups: CategoryGroup[] = taxonomy.map((group) => ({
  ...group,
  categories: group.categories.map(slugify),
}));

const categoriesBySlug = new Map(categories.map((category) => [category.slug, category]));
const groupsBySlug = new Map(groups.map((group) => [group.slug, group]));

export function getCategory(slug: string): Category | undefined {
  return categoriesBySlug.get(slug);
}

export function getGroup(slug: string): CategoryGroup | undefined {
  return groupsBySlug.get(slug);
}

function categorySlug(value: string): string {
  const slug = slugify(value);
  if (!categoriesBySlug.has(slug)) {
    throw new Error(`Unknown catalog category "${value}".`);
  }
  return slug;
}

export function canonicalResourceUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error("Catalog links must use HTTPS without credentials.");
  }

  // Keep meaningful paths, search parameters, and anchors.
  url.pathname = url.pathname.replace(/\/+$/, "");
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_.+|gclid|fbclid)$/i.test(key)) {
      url.searchParams.delete(key);
    }
  }
  url.searchParams.sort();
  return url.href;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

type ReviewDetails = Pick<Resource, "free" | "limitation" | "bestFor" | "sourceUrl" | "reviewedAt">;
type ReviewedEntry = Omit<Resource, keyof ReviewDetails | "slug" | "access" | "reviewed"> &
  Required<ReviewDetails> & {
    access: string;
    replacesUrl?: string;
    slug?: string;
  };

const reviewedEntries: ReviewedEntry[] = reviewedData;
const byUrl = new Map<string, Resource>();
const bySlug = new Map<string, Resource>();
const legacyBookmarks = new Map<string, string>();

function allocateSlug(name: string, url: string): string {
  const base = slugify(name) || "resource";
  if (!bySlug.has(base)) return base;

  const { hostname, pathname } = new URL(url);
  const qualified = `${base}-${slugify(hostname.replace(/^www\./, "") + pathname)}`;
  let candidate = qualified;
  for (let suffix = 2; bySlug.has(candidate); suffix++) {
    candidate = `${qualified}-${suffix}`;
  }
  return candidate;
}

// The prototype used a shared landing page for these distinct tools.
const directLegacyLinks: Record<string, string> = {
  "Firebase Hosting": "https://firebase.google.com/docs/hosting",
  "YouTube Audio Library": "https://www.youtube.com/audiolibrary",
};

const specificLegacyNames: Record<string, string> = {
  "https://hackerrank.com/skills-verification": "HackerRank Skills Verification",
};

for (const entry of legacyData) {
  const url = directLegacyLinks[entry.name] ?? entry.url;
  const key = canonicalResourceUrl(url);
  const category = categorySlug(entry.category);
  const existing = byUrl.get(key);

  if (existing) {
    existing.categories = unique([...existing.categories, category]);
    existing.searchTerms = unique([
      ...(existing.searchTerms ?? []),
      ...[entry.name, entry.description].filter((text) =>
        text !== existing.name && text !== existing.description,
      ),
    ]);
    legacyBookmarks.set(`${entry.category}|${entry.url}`, existing.slug);
    continue;
  }

  const name = specificLegacyNames[entry.url] ?? entry.name;
  const resource: Resource = {
    slug: allocateSlug(name, url),
    name,
    description: entry.description,
    url,
    access: prototypeAccess[entry.type] ?? "unknown",
    categories: [category],
    tags: [],
    reviewed: false,
  };

  byUrl.set(key, resource);
  bySlug.set(resource.slug, resource);
  legacyBookmarks.set(`${entry.category}|${entry.url}`, resource.slug);
}

for (const entry of reviewedEntries) {
  const { access, categories: entryCategories, replacesUrl, slug: requestedSlug, ...details } = entry;
  const option = accessOptions.find(({ id }) => id === access);
  if (!option) {
    throw new Error(`Unknown access value for "${entry.name}": ${access}`);
  }
  const reviewDate = new Date(details.reviewedAt);
  if (!Number.isFinite(reviewDate.valueOf()) || reviewDate.toISOString().slice(0, 10) !== details.reviewedAt) {
    throw new Error(`Invalid review date for "${entry.name}".`);
  }
  canonicalResourceUrl(details.sourceUrl);

  const newKey = canonicalResourceUrl(details.url);
  const priorKey = replacesUrl ? canonicalResourceUrl(replacesUrl) : newKey;
  const current = byUrl.get(newKey);
  const prior = byUrl.get(priorKey);
  if (replacesUrl && !prior) {
    throw new Error(`No catalog URL to replace for "${entry.name}": ${replacesUrl}`);
  }
  if (current && prior && current !== prior) {
    throw new Error(`Review for "${entry.name}" matches two catalog records.`);
  }
  const existing = current ?? prior;
  if (existing?.reviewed) {
    throw new Error(`Duplicate review for "${entry.name}".`);
  }

  if (
    requestedSlug !== undefined &&
    (!requestedSlug ||
      requestedSlug !== slugify(requestedSlug) ||
      (existing ? requestedSlug !== existing.slug : bySlug.has(requestedSlug)))
  ) {
    throw new Error(`Invalid or conflicting catalog slug for "${entry.name}": ${requestedSlug}`);
  }

  const resource: Resource = {
    ...details,
    slug: existing?.slug ?? requestedSlug ?? allocateSlug(details.name, details.url),
    categories: unique([...entryCategories.map(categorySlug), ...(existing?.categories ?? [])]),
    access: option.id,
    reviewed: true,
  };
  if (existing) {
    resource.searchTerms = unique([
      ...(details.searchTerms ?? []),
      ...(existing.searchTerms ?? []),
      ...[existing.name, existing.description].filter((text) =>
        text !== resource.name && text !== resource.description,
      ),
    ]);
  }

  byUrl.set(newKey, resource);
  byUrl.set(priorKey, resource);
  bySlug.set(resource.slug, resource);
}

export const resources = [...bySlug.values()];
export const reviewedResources = resources.filter((resource) => resource.reviewed);
export const legacyBookmarkSlugs = Object.fromEntries(legacyBookmarks);

export function getResource(slug: string): Resource | undefined {
  return bySlug.get(slug);
}

export function getResourcesForCategory(slug: string): Resource[] {
  return resources.filter((resource) => resource.categories.includes(slug));
}

export function resolveLegacyBookmarks(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];

  return unique(keys.flatMap((key) => {
    if (typeof key !== "string") return [];
    const slug = legacyBookmarks.get(key) ?? key;
    return bySlug.has(slug) ? [slug] : [];
  }));
}
