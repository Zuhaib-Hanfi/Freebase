export type Access =
  | "free-access"
  | "free-tier"
  | "open-source"
  | "eligibility"
  | "promotional"
  | "unknown"
  | "time-limited";

export interface Category {
  slug: string;
  name: string;
  group: string;
}

export interface CategoryGroup {
  slug: string;
  name: string;
  description: string;
  categories: string[];
}

export interface Resource {
  slug: string;
  name: string;
  url: string;
  description: string;
  categories: string[];
  access: Access;
  tags: string[];
  reviewed: boolean;
  searchTerms?: string[];
  bestFor?: string;
  free?: string;
  limitation?: string;
  sourceUrl?: string;
  reviewedAt?: string;
  region?: string;
  platform?: string[];
  language?: string[];
  level?: string;
  license?: string;
  openSource?: boolean;
  accountRequired?: boolean;
  cardRequired?: boolean;
  commercialUse?: boolean;
  freeCertificate?: boolean;
  worksOffline?: boolean;
  attributionRequired?: boolean;
  customDomain?: boolean;
}
