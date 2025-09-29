import {
  DEFAULT_LANGUAGE,
  ROOT_PATH,
  DEFAULT_LOCALE,
} from '../scripts/global/constants.js';
/**
 * Get the current country and language codes label by matching the current
 * location pathname to a regex.
 * @returns {string[]} The current country and language codes array on
 * success (e.g. ["us","en"]), array of two empty strings otherwise
 */

export function getCurrentCountryLanguage() {
  const match = window.location.pathname.match(/(?:^|\/)([a-z]{2})-([a-z]{2})(?:\.html|\/|$)/i);
  return match ? match.slice(1, 3) : ['', ''];
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

/** @param {string[]} classes */
export function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Helper function to set a property on an object using a dot-separated path.
 * It creates nested objects as needed.
 * @param {object} obj The object to modify.
 * @param {string} path The dot-separated path (e.g., "path.to.destination").
 * @param {any} value The value to set at the destination.
 */
function setNestedProperty(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  // Iterate through the keys until the second-to-last key
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    // If the nested object doesn't exist, create it.
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    // Move to the next level down.
    current = current[key];
  }
  // Set the value on the final key.
  current[keys[keys.length - 1]] = value;
}

/**
 * Extracts key-value pairs for a specific column and builds a nested object.
 * If the given column doesn't exist or any entry is empty for it,
 * the default language (first) and the default locale (second) are used as fallbacks.
 * @param {object} dataObject The full input data from the source.
 * @param {string} column The column to extract.
 * @returns {object} A new nested object with keys mapped to their translations.
 */
function getTranslationsForDictionaryColumn(dataObject, column) {
  const finalObject = {};
  dataObject.data.forEach((item) => {
    // Check if the current item has a translation for the selected column.
    if (Object.hasOwn(item, column)) {
      setNestedProperty(
        finalObject,
        item.key,
        item[column] || item[DEFAULT_LANGUAGE] || item[DEFAULT_LOCALE],
      );
    } else if (Object.hasOwn(item, DEFAULT_LOCALE)) {
      // Fallback to the "en" language or "com-en" locale
      setNestedProperty(finalObject, item.key, item[DEFAULT_LANGUAGE] || item[DEFAULT_LOCALE]);
    }
  });
  return finalObject;
}

/**
 * Fetches the dictionary for a given column.
 * @param {string} column The column to extract.
 * @returns {Record<string, string>} The dictionary map for the column.
 */
async function fetchDictionary(column) {
  try {
    const resp = await fetch(`${window.location.origin}${window.hlx.codeBasePath}/api/dictionary.json`);
    const data = await resp.json();
    return {
      promise: null,
      data: getTranslationsForDictionaryColumn(data, column),
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Could not fetch dictionary for column ${column} due to:`, error);
    return {
      promise: null,
      data: {},
    };
  }
}
/**
 * Gets the dictionary object for the given column.
 * @param {string?} column The target column.
 * @returns {Promise<object>} The dictionary object.
 */
export async function getDictionaryColumn(column = null) {
  // Initialize window
  window.dictionary = window.dictionary || {};
  window.dictionary[column] = window.dictionary[column] || {
    data: null,
    promise: null,
  };

  // IMPORTANT: never replace this entry but only mutate its fields to avoid a race condition!
  const stableCacheEntry = window.dictionary[column];

  // Return dictionary if already loaded
  if (stableCacheEntry.data) {
    return stableCacheEntry.data;
  }

  // Return promise if dictionary is currently loading
  if (stableCacheEntry.promise) {
    return stableCacheEntry.promise;
  }

  // Fetch dictionary and store the promise
  stableCacheEntry.promise = fetchDictionary(column).then((result) => {
    stableCacheEntry.data = result.data;
    // Clear promise once resolved
    stableCacheEntry.promise = null;
    return stableCacheEntry.data;
  });

  return stableCacheEntry.promise;
}
/**
 * Gets the dictionary object for the current site language, with fallback to the default one.
 *
 * IMPORTANT: Assumes that the dictionary spreadsheet has language only columns
 * (e.g. "en", "zh").
 * @param {string?} language The language code (e.g. "en").
 * @returns {Promise<object>} The dictionary object.
 */
export async function getDictionary(language = null) {
  const currentLanguage = language || getCurrentLanguage();
  let dictionary = await getDictionaryColumn(currentLanguage);
  if (!dictionary || !dictionary.length) {
    dictionary = await getDictionaryColumn(DEFAULT_LOCALE);
  }
  return dictionary;
}
/**
 * Creates an HTML element with the specified tag name and attributes
 * @param {string} tag - The HTML tag name
 * @param {Object} [attributes] - Optional object containing element attributes
 * @returns {HTMLElement} The created HTML element
 */
export function createTag(tag, attributes = {}) {
  const element = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === true) element.setAttribute(key, '');
    else if (value !== false && value !== null && value !== '') {
      element.setAttribute(key, value);
    }
  });
  return element;
}

async function fetchIndex(indexFile, pageSize = 500) {
  const handleIndex = async (offset) => {
    const resp = await fetch(`/${indexFile}.json?limit=${pageSize}&offset=${offset}`);
    const json = await resp.json();

    const newIndex = {
      complete: (json.limit + json.offset) === json.total,
      offset: json.offset + pageSize,
      promise: null,
      data: [...window.index[indexFile].data, ...json.data],
    };

    return newIndex;
  };

  window.index = window.index || {};
  window.index[indexFile] = window.index[indexFile] || {
    data: [],
    offset: 0,
    complete: false,
    promise: null,
  };

  // Return index if already loaded
  if (window.index[indexFile].complete) {
    return window.index[indexFile];
  }

  // Return promise if index is currently loading
  if (window.index[indexFile].promise) {
    return window.index[indexFile].promise;
  }

  window.index[indexFile].promise = handleIndex(window.index[indexFile].offset);
  const newIndex = await (window.index[indexFile].promise);
  window.index[indexFile] = newIndex;

  return newIndex;
}

/**
 * Queries an entire query index.
 * @param {string} indexFile The index file path name (e.g. "us/en/query-index").
 *                           NOTE: without leading "/" and without trailing ".json".
 * @param {*} pageSize The page size of the {@link fetchIndex} calls.
 * @returns {Promise<any>} The entire query index.
 */
export async function queryEntireIndex(indexFile, pageSize = 500) {
  window.queryIndex = window.queryIndex || {};
  if (!window.queryIndex[indexFile]) {
    window.queryIndex[indexFile] = {
      data: [],
      offset: 0,
      complete: false,
      promise: null,
    };
  }

  // Return immediately if already complete
  if (window.queryIndex[indexFile].complete) {
    return window.queryIndex[indexFile];
  }

  // Wait for in-progress fetches
  if (window.queryIndex[indexFile].promise) {
    return window.queryIndex[indexFile].promise;
  }

  // Fetch all pages in sequence and accumulate data
  window.queryIndex[indexFile].promise = (async () => {
    let { offset } = window.queryIndex[indexFile];
    let complete = false;

    while (!complete) {
      const {
        data,
        offset: nextOffset,
        complete: isComplete,
      // eslint-disable-next-line no-await-in-loop
      } = await fetchIndex(indexFile, pageSize);

      window.queryIndex[indexFile].data.push(...data);
      offset = nextOffset;
      complete = isComplete;
    }

    window.queryIndex[indexFile].offset = offset;
    window.queryIndex[indexFile].complete = true;
    window.queryIndex[indexFile].promise = null;
    return window.queryIndex[indexFile];
  })();

  return window.queryIndex[indexFile].promise;
}

/**
 * Fetch query-index.json preferring localized path (/<lang>/query-index.json)
 * with a fallback to the root (/query-index.json).
 * @returns {Promise<import('./types.js').IndexedPageMetadata[]>} The parsed query index
 */
export async function getQueryIndex() {
  /** @type {import('./types.js').IndexedPageMetadata[]?} */
  let queryIndex = null;
  try {
    queryIndex = (await queryEntireIndex(`${getCurrentLanguage()}/query-index`))?.data ?? [];
  } catch {
    queryIndex = (await queryEntireIndex('query-index'))?.data ?? [];
  }
  return (queryIndex ?? []);
}
