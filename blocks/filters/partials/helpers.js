const TAGS_ROOT = '/content/cq:tags';
const TAG_NAMESPACE = 'blog-blueprint';
export const DEFAULT_LANGUAGE = 'en';
export const SAMPLE = 'sample';
const ROOT_PATH = '/content/blog-blueprint';
/** Filter selectors */
export const FILTER_SELECTORS = Object.freeze({
  ITEM: 'filter-item',
  EXCLUDE_ITEM: ':not(.bg-transparent)',
  INNER_BLOCK: 'inner-block',
});

/** Filter data keys */
export const FILTER_KEYS = Object.freeze({
  TYPES: 'filterTypes',
  TAGS: 'filterTags',
  TAGS_DISPLAY: 'filterTagsDisplay',
  SELECTED_TAGS: '__selectedTagFilters',
  ORDERED: '__filtersOrdered',
  CURRENT_PAGE_SIZE: '__currentPageSize',
});

/** Filter CSS classes */
export const FILTER_CLASSES = Object.freeze({
  FILTER: 'filters-filter',
  FILTER_BUTTONS: 'filters-filter-buttons',
  FILTER_DROPDOWNS: 'filters-filter-dropdowns',
  CONTENT_WRAPPER: 'filters-content-wrapper',
  TOTAL_ITEMS: 'filters-total-items',
  LOAD_MORE_BUTTON: 'filters-load-more-button',
  LOAD_MORE_CONTAINER: 'filters-load-more-container',
  LOAD_MORE_COUNTER: 'filters-load-more-counter',
  SEARCH: 'filters-search',
});

/**
 * Normalize a string for case-insensitive and trim matching
 * @param {string} str - The string to normalize
 * @returns {string} The normalized string
 */
export const normalizeForMatch = (str) => (str || '').trim().toLowerCase();

/**
 * Parse item tags and build a normalized map of categories to subcategories
 * @param {string} tagsContent - Comma-separated tag string
 * @param {object} options - Configuration options
 * @param {function(string): string} options.normalizeFn
 *   - Function to normalize strings for matching
 * @param {function(string, string): string} options.getDisplayName
 *   - Function to get display name from tag ID
 * @returns {{
 *   itemMap: Map<string, Set<string>>,
 *   displayNames: Map<string, string>
 * }} Object containing normalized map and display names
 */
export function parseItemTags(tagsContent, { normalizeFn, getDisplayName }) {
  const itemMap = new Map();
  const displayNames = new Map();
  if (!tagsContent) return { itemMap, displayNames };

  tagsContent
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .forEach((tag) => {
      const m = tag.match(/^([^:]+):([^/]+)\/(.+)$/);
      if (!m) return;
      const [, namespace, category, subcategory] = m;

      // Build tag IDs for taxonomy lookup
      const categoryTagId = `${namespace}:${category}`;
      const subcategoryTagId = `${namespace}:${category}/${subcategory}`;

      // Derive fallback names and get display names from taxonomy
      const categoryFallback = category.replace(/--/g, ' & ').replace(/-/g, ' ');
      const subcategoryFallback = subcategory.replace(/-/g, ' ');
      const categoryDisplayName = getDisplayName(categoryTagId, categoryFallback);
      const subcategoryDisplayName = getDisplayName(
        subcategoryTagId,
        subcategoryFallback,
      );

      const normalizedCat = normalizeFn(categoryDisplayName);
      const normalizedSub = normalizeFn(subcategoryDisplayName);

      // Store display names
      displayNames.set(normalizedCat, categoryDisplayName.trim());
      displayNames.set(normalizedSub, subcategoryDisplayName.trim());

      if (!itemMap.has(normalizedCat)) itemMap.set(normalizedCat, new Set());
      itemMap.get(normalizedCat).add(normalizedSub);
    });

  return { itemMap, displayNames };
}

/**
 * Checks if an item matches the selected tag filters
 * @param {Map<string, Set<string>>} selectedFilters - Map of selected categories to subcategories
 * @param {Map<string, Set<string>>} itemTagMap - Map of item's categories to subcategories
 * @returns {boolean} True if item matches all selected filters (OR within category, AND between)
 */
const matchesTagFilters = (selectedFilters, itemTagMap) => {
  if (selectedFilters.size === 0) return true;

  // For each category with selections, check if item matches ANY of
  // the selected subcategories (OR within category)
  // Between categories, ALL must match (AND between categories)
  return Array.from(selectedFilters.entries()).every(
    ([cat, selectedSubSet]) => {
      const normalizedCat = normalizeForMatch(cat);
      const itemSubSet = itemTagMap.get(normalizedCat);
      if (!itemSubSet) return false;

      // Check if item has ANY of the selected subcategories
      return Array.from(selectedSubSet).some((selectedSub) => {
        const normalizedSub = normalizeForMatch(selectedSub);
        return itemSubSet.has(normalizedSub);
      });
    },
  );
};

/**
 * Creates a function to check if an item matches all current filters (tags, type, search)
 * @param {object} options - Configuration options
 * @param {function(string, string): string} options.getDisplayName
 *   - Function to get display name from tag ID
 * @param {HTMLElement} options.block - The block element
 * @returns {function} Function that checks if an item matches all filters
 */
export function createItemMatcher({ getDisplayName, block }) {
  return (filterItemEl, selectedFilters, searchQuery) => {
    const itemTags = filterItemEl?.dataset.tags?.trim() || '';
    const { itemMap } = parseItemTags(itemTags, {
      normalizeFn: normalizeForMatch,
      getDisplayName,
    });
    const tagMatches = matchesTagFilters(selectedFilters, itemMap);

    const itemType = normalizeForMatch(filterItemEl?.dataset.type || '');
    const activeFilter = normalizeForMatch(block.dataset.activeFilter || '');
    const typeMatches = !activeFilter || itemType === activeFilter;

    const titleText = filterItemEl
      ?.querySelector('.filter-item-title')
      ?.textContent?.trim()
      .toLowerCase() || '';
    const searchMatches = !searchQuery || titleText.includes(searchQuery);

    return tagMatches && typeMatches && searchMatches;
  };
}

/**
 * Ensures a container element exists, creating it if necessary
 * @param {HTMLElement} parent - Parent element
 * @param {string} selector - CSS class selector (without dot)
 * @param {Function} appendFn - Optional function to determine where to append
 *   (default: appendChild)
 * @returns {HTMLElement} The container element
 */
export function ensureContainer(parent, selector, appendFn = null) {
  let container = parent.querySelector(`.${selector}`);
  if (!container) {
    container = document.createElement('div');
    container.className = selector;
    if (appendFn) {
      appendFn(container);
    } else {
      parent.appendChild(container);
    }
  }
  return container;
}

/**
 * Maps a Tag ID to its content path.
 *
 * Example: `qnx:region/emea` ⇒ `/content/cq:tags/qnx/region/emea`
 *
 * NOTE: Does not check for mapped path existence.
 * @param {import('./types').Tag['id']} id The Tag ID
 * @returns {?import('./types').Tag['path']} The Tag path on success, null otherwise
 */
export function mapTagIdToPath(id) {
  if (!id) return null;
  return `${TAGS_ROOT}/${TAG_NAMESPACE}/${id.replace(`${TAG_NAMESPACE}:`, '')}`;
}

/**
 * Maps the taxonomy spreadsheet entries to {@link TagSpreadsheetEntry}.
 * @param {import('./types').TagSpreadsheetEntry[]} data The taxonomy spreadsheet entries
 * @returns {import('./types').Tag[]} The mapped tags
 */
function mapTaxonomy(data) {
  if (!Array.isArray(data)) return [];
  return data.map((entry) => /** @type {import('./types').Tag} */({
    id: entry.tag,
    path: mapTagIdToPath(entry.tag),
    name: entry.tag.lastIndexOf('/') === -1 ? '' : entry.tag.slice(entry.tag.lastIndexOf('/') + 1),
    title: entry.title,
    description: entry['jcr:description'],
  }));
}

/**
 * Fetches the taxonomy (AEM Tags) configured for the current site.
 *
 * IMPORTANT: Assumes there is a `/content/site/taxonomy` page configured with exposed AEM Tags.
 * @param {string} [language] The language code for Tag title translation
 * @returns {Promise<import("./types").Tag[]>} The array of AEM Tags exposed by the taxonomy page
 */
async function fetchTaxonomy(language) {
  try {
    const url = new URL(`${window.location.origin}${window.hlx.codeBasePath}/taxonomy.json`);
    if (language) url.searchParams.append('sheet', language);
    const resp = await fetch(url);
    const data = await resp.json();
    return {
      promise: null,
      data: mapTaxonomy(data?.data),
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Could not fetch taxonomy for language ${language} due to:`, error);
    return {
      promise: null,
      data: [],
    };
  }
}

/**
 * Gets the taxonomy (AEM Tags) configured for the current site as an array of {@link Tag}.
 *
 * IMPORTANT: Assumes there is a `/content/site/taxonomy` page configured with exposed AEM Tags.
 * @param {string} [language] The language code for Tag title translation.
 * @returns {Promise<import("./types").Tag[]>} The array of AEM Tags exposed by the taxonomy page.
 */
export async function getTaxonomy(language) {
  const lang = language || DEFAULT_LANGUAGE;
  // Initialize window
  window.taxonomy = window.taxonomy || {};
  window.taxonomy[lang] = window.taxonomy[lang] || {
    data: null,
    promise: null,
  };

  // IMPORTANT: never replace this entry but only mutate its fields to avoid a race condition!
  const stableCacheEntry = window.taxonomy[lang];

  // Return taxonomy if already loaded
  if (stableCacheEntry.data) {
    return stableCacheEntry.data;
  }

  // Return promise if taxonomy are currently loading
  if (stableCacheEntry.promise) {
    return stableCacheEntry.promise;
  }

  // Fetch taxonomy and store the promise
  stableCacheEntry.promise = fetchTaxonomy(lang).then((res) => {
    stableCacheEntry.data = res.data;
    // Clear promise once resolved
    stableCacheEntry.promise = null;
    return stableCacheEntry.data;
  });

  return stableCacheEntry.promise;
}

/**
 * Gets the taxonomy (AEM Tags) configured for the current site as a path lookup Map.
 *
 * IMPORTANT: Assumes there is a `/content/site/taxonomy` page configured with exposed AEM Tags.
 * @param {string} [language] The language code for Tag title translation.
 * @returns {Promise<Map<Tag['path'], Tag>>} The path lookup Map of AEM Tags exposed by the taxonomy
 *                                           page.
 */
export async function getTaxonomyMapByPath(language) {
  const taxonomy = await getTaxonomy(language);
  return new Map(taxonomy.map((t) => ([t.path, t])));
}

/**
 * Get the current language code by matching the current location pathname to a regex.
 *
 * IMPORTANT: Assumes a "/language" page structure (no countries).
 * @returns {string} The current code on success (e.g. "en"), empty string otherwise.
 */
export function getCurrentLanguage() {
  const match = window.location.pathname
    .replace(ROOT_PATH, '')
    .match('^/([a-z]{2})');
  const currentLanguage = match ? match.at(1) : DEFAULT_LANGUAGE;
  return currentLanguage || DEFAULT_LANGUAGE;
}

/**
 * Asset Selector (EDS / AEM) inserts links using the "play" endpoint by default:
 *   https://<delivery-host>/adobe/assets/<URN>/play?assetname=<file>
 *
 * That URL is meant for Adobe's embedded player (iframe/HLS) and will be blocked
 * if used directly as <video src=""> (Chrome ORB rejects it).
 *
 * This helper rewrites the "play" URL into a Delivery API URL for the original rendition:
 *   https://<delivery-host>/adobe/assets/<URN>/original/as/<file>
 *
 * The /original/as/ endpoint returns the raw binary with proper video/mp4 headers,
 * safe to embed directly in <video> or to pass into Plyr.
 */
export function videoToOriginalRendition(url) {
  try {
    const u = new URL(url);
    if (/\/original\/as\//.test(u.pathname) || /\/dynamicmedia\/deliver\//.test(u.pathname)) {
      return url; // already good
    }

    // Handle /play/as/filename.mp4 format (convert to /original/as/filename.mp4)
    const playAsMatch = u.pathname.match(/^(\/adobe\/assets\/[^/]+)\/play\/as\/(.+)$/);
    if (playAsMatch) {
      const idPath = playAsMatch[1];
      const filename = playAsMatch[2];
      return `${u.origin}${idPath}/original/as/${encodeURIComponent(filename)}`;
    }

    // Handle /play?assetname=filename.mp4 format
    const playMatch = u.pathname.match(/^(\/adobe\/assets\/[^/]+)\/play$/);
    if (!playMatch) return url;
    const idPath = playMatch[1];
    const file = u.searchParams.get('assetname') || '';
    return file ? `${u.origin}${idPath}/original/as/${encodeURIComponent(file)}` : url;
  } catch {
    return url;
  }
}

/**
 * Maps a path to a safe live path, using the URL API for validation.
 *
 * - Nullish paths are nullified to an empty string
 * - Paths that do not construct into a valid {@link URL} are nullified to an empty string
 * - Absolute paths are mirrored back, and a console warning is printed for non-HTTPS paths
 * - Relative paths undergo the following steps, preserving query string and hash parameters:
 *   1. Strip out leading {@link ROOT_PATH}
 *   2. Strip out trailing `.html`
 *
 * @param {string} path The path to map
 * @returns The mapped path
 */
export function mapPath(path) {
  if (!path) return '';

  /** @type {URL} */
  let url;
  try {
    // Try absolute URL first
    url = new URL(path);
    // If it's an absolute URL, return as-is
    if (url.protocol === 'https:') return url.href;
    if (url.protocol === 'http:') {
      // eslint-disable-next-line no-console
      console.warn('Non-secure HTTP path detected:', url.href);
      return url.href;
    }
  } catch {
    try {
      // Try relative URL
      url = new URL(path, window.location.origin);
    } catch {
      // If both fail, bail out
      return '';
    }
  }

  // Map relative path

  // Work with pathname only
  let mappedPath = url.pathname;

  // 1. Strip out leading ROOT_PATH
  if (mappedPath.startsWith(ROOT_PATH)) {
    mappedPath = mappedPath.slice(ROOT_PATH.length);
  }

  // 2. Strip out trailing `.html` (case-insensitive, only at the end)
  mappedPath = mappedPath.replace(/\.html$/i, '');

  // Construct a new URL instance with preserved search/hash
  const finalUrl = new URL(
    mappedPath + url.search + url.hash,
    window.location.origin,
  );

  return `${finalUrl.pathname}${finalUrl.search}${finalUrl.hash}`;
}
