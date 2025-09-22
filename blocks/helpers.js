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

/** @param {string[]} classes */
export function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**  @type {Promise<any> | null} */
let dictionaryPromise = null;
export async function getDictionary() {
  const lang = document.documentElement.lang.toLowerCase() || 'en-us';
  if (dictionaryPromise === null) {
    dictionaryPromise = fetch('/api/dictionary.json')
      .then((res) => res.json());
  }

  /** @type Array<{ key:string} & Record<string, string>> */
  const dictionary = (await dictionaryPromise).data;
  const dictionaryLangValues = dictionary.filter((item) => Object.keys(item).includes(lang));
  const dictionaryLang = dictionaryLangValues.map((item) => {
    const { key } = item;
    const value = item[lang];
    return [key, value];
  });

  // key is e.g. blogpost.backtotop and value is 'Back to top'. We are creatating a
  // new object split by '.' and creating nested objects.
  const dictionaryLangNested = dictionaryLang.reduce(
    (/** @type {Record<string, any>} */ acc, [key, value]) => {
      const keys = key.split('.');
      const last = keys.pop();
      if (!last) {
        return acc;
      }
      const obj = acc;
      // eslint-disable-next-line no-shadow
      keys.reduce((acc, k) => {
        if (!(k in acc)) {
          acc[k] = {};
        }
        return acc[k];
      }, obj);
      obj[last] = value;
      return acc;
    },
    {},
  );
  return dictionaryLangNested;
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
 * Fetch query-index.json preferring localized path (/<country>-<lang>/query-index.json)
 * with a fallback to the root (/query-index.json). The result is cached in
 * the module-scoped queryIndexPromise.
 * @returns {Promise<any>} Parsed JSON of the query index
 */
export function getQueryIndex() {
  let queryIndexPromise = null;
  if (queryIndexPromise === null) {
    const [currentCountry, currentLanguage] = getCurrentCountryLanguage();
    const localizedUrl = `/${currentCountry}-${currentLanguage}/query-index.json`;
    const fallbackUrl = '/query-index.json';
    queryIndexPromise = fetchIndex(localizedUrl)
      .then((res) => (res.ok ? res : Promise.reject(new Error('Localized query-index not found'))))
      .then((res) => res.json())
      .catch(() => fetch(fallbackUrl).then((res) => res.json()));
  }
  return queryIndexPromise;
}
