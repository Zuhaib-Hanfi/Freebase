import assert from 'node:assert/strict';
import { canonicalResourceUrl, categories, getCategory, groups, resources, reviewedResources } from '../lib/catalog.ts';
import { collectionResources, collections } from '../lib/collections.ts';

const slugs = new Set<string>();
const destinations = new Set<string>();
for (const resource of resources) {
  assert.match(resource.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert(!slugs.has(resource.slug), `Duplicate slug: ${resource.slug}`);
  slugs.add(resource.slug);
  const url = canonicalResourceUrl(resource.url);
  assert(url && !destinations.has(url), `Missing or duplicate destination: ${resource.url}`);
  destinations.add(url);
  assert(resource.categories.length && resource.categories.every(getCategory), `Invalid categories: ${resource.slug}`);
  assert(resource.name.trim() && resource.description.trim(), `Empty listing text: ${resource.slug}`);
  if (resource.reviewed) {
    assert(resource.free && resource.limitation && resource.bestFor, `Missing review text: ${resource.slug}`);
    assert(resource.sourceUrl && canonicalResourceUrl(resource.sourceUrl), `Missing or invalid review source: ${resource.slug}`);
    assert(resource.reviewedAt && /^\d{4}-\d{2}-\d{2}$/.test(resource.reviewedAt) && Number.isFinite(Date.parse(resource.reviewedAt)), `Invalid review date: ${resource.slug}`);
  }
}
for (const collection of collections) {
  const picks = collectionResources(collection);
  assert.equal(picks.length, collection.picks.length, `Missing collection picks: ${collection.slug}`);
  assert(picks.every((item) => item.reviewed), `Unreviewed collection pick: ${collection.slug}`);
}
console.log(`${resources.length} unique resources · ${reviewedResources.length} source-reviewed · ${categories.length} categories · ${groups.length} groups · ${collections.length} collections`);
