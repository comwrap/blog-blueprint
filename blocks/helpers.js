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

/** Counter used to generate unique IDs for image dialogs */
let imageDialogCounter = 0;

/**
 * Adds search parameters to a URL using the URL API
 * @param {string} urlString The URL string
 * @param {Object} params Object containing the search parameters to add
 * @param {string} base The base URL
 * @returns {string} URL with search parameters added
 */
const addSearchParams = (urlString, params, base = window.location.origin) => {
  if (!urlString) return urlString;

  try {
    const url = new URL(urlString, base);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, value);
      }
    });
    return url.toString();
  } catch (error) {
    // If URL parsing fails, return the original string
    // eslint-disable-next-line no-console
    console.warn('Failed to parse URL:', urlString, error);
    return urlString;
  }
};

/**
 * Creates an <picture> element from a reference <a> and optionally wires a modal on click.
 * Adds `&smartcrop=` when crop is not "original".
 *
 * @param {HTMLAnchorElement | string} referenceLink Delivery link to the image
 * @param {HTMLElement | string} alt The image alternative description
 * @param {string} smartCrop Smart crop ("original", "16-9", "32-9", "1-1", "4-3", "3-2" or "3-4")
 * @param {HTMLAnchorElement | string} mobileReferenceLink
 * @param {boolean} attachModal If true, attach modal click behavior and return
 *                              modal opener button wrapping the picture.
 *                              If false, no click handler and return the picture directly.
 * @param {boolean} eager If true, load eager, otherwise load lazy
 * @returns {HTMLButtonElement | HTMLPictureElement | null} The dynamic image element on success,
 *                                                          null otherwise
 */
export function createImageWithModal(
  referenceLink,
  alt,
  smartCrop,
  mobileReferenceLink = '',
  attachModal = false,
  eager = false,
) {
  if (!referenceLink) return null;

  // Remove any existing width query parameter from string URLs
  const cleanedReferenceLink = (() => {
    if (typeof referenceLink !== 'string' || !referenceLink.includes('width=')) return referenceLink;
    try {
      const url = new URL(referenceLink, window.location.origin);
      url.searchParams.delete('width');
      return url.toString();
    } catch (e) {
      // Fallback: strip "width=<value>" from the query string if URL parsing fails
      return referenceLink
        .replace(/([?&])width=[^&#]*(&)?/, (match, p1, p2) => (p2 ? p1 : ''))
        .replace(/\?[&]+/, '?')
        .replace(/\?$/, '');
    }
  })();

  const newReferenceLink = cleanedReferenceLink && typeof cleanedReferenceLink === 'string' && cleanedReferenceLink.includes('/original/')
    ? cleanedReferenceLink.replace('/original/', '/')
    : cleanedReferenceLink;
  const newMobileReferenceLink = mobileReferenceLink && mobileReferenceLink.includes('/original/') ? mobileReferenceLink.replace('/original/', '/') : mobileReferenceLink;

  const altImage = alt || (referenceLink.getAttribute ? (referenceLink.getAttribute('alt') || '') : '');
  const resolveHref = (input) => {
    if (!input) return '';
    if (typeof input === 'string') return input;
    if (input.getAttribute) return input.getAttribute('href') || '';
    return '';
  };
  const desktopBasePath = resolveHref(newReferenceLink);
  const shouldApplySmartCrop = smartCrop && smartCrop !== 'original';

  const searchParams = {
    preferwebp: 'true',
    format: 'webply',
    quality: '80',
  };

  // No smartcrops applied on mobile image
  const rawMobilePath = resolveHref(newMobileReferenceLink);
  const mobilePath = addSearchParams(rawMobilePath, { ...searchParams, width: '767' });

  if (shouldApplySmartCrop) {
    searchParams.smartcrop = smartCrop;
    searchParams.quality = '100';
  }
  const desktopPath = addSearchParams(desktopBasePath, searchParams);

  const picture = document.createElement('picture');
  if (mobilePath) {
    const sourceMobile = document.createElement('source');
    sourceMobile.setAttribute('media', '(max-width: 767px)');
    sourceMobile.setAttribute('srcset', mobilePath);
    picture.appendChild(sourceMobile);
  }

  const img = document.createElement('img');
  img.src = desktopPath;
  img.alt = alt || altImage;
  img.className = 'dynamic-image';
  img.setAttribute('loading', eager ? 'eager' : 'lazy');
  picture.appendChild(img);

  if (attachModal) {
    imageDialogCounter += 1;
    const dialogId = `dm-image-dialog-${imageDialogCounter}`;

    /** @type {HTMLButtonElement} */
    const dialogOpenButton = document.createRange().createContextualFragment(`
      <button
        class="dm-image-modal-opener"
        type="button"
        aria-haspopup="dialog"
        aria-controls="${dialogId}"
        aria-label="Open image preview"
      ></button>
    `).firstElementChild;
    dialogOpenButton.appendChild(picture);
    dialogOpenButton.addEventListener('click', () => document.getElementById(dialogId)?.showModal());

    /** @type {HTMLDialogElement} */
    const dialog = document.createRange().createContextualFragment(`
      <dialog id="${dialogId}" class="dm-image-modal" aria-label="Image preview">
        <div class="dm-image-modal-content">
          <form method="dialog">
            <button class="dm-image-modal-close" type="submit" aria-label="Close image preview">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="Frame 252326588">
                <g id="Group 252326589">
                <path id="Vector 11" d="M2 2L22 22" stroke="currentColor" stroke-width="2"/>
                <path id="Vector 12" d="M22 2L2 22" stroke="currentColor" stroke-width="2"/>
                </g>
                </g>
              </svg>
            </button>
          </form>
        </div>
      </dialog>
    `).firstElementChild;
    const dialogContent = dialog.querySelector('.dm-image-modal-content');
    // Clone the picture so the browser handles responsive switching in the modal
    /** @type {HTMLPictureElement} */
    const pictureClone = picture.cloneNode(true);
    pictureClone.querySelector('img')?.setAttribute('loading', 'eager');
    dialogContent.appendChild(pictureClone);
    document.body.appendChild(dialog);

    return dialogOpenButton;
  }

  return picture;
}

/**
 * Creates a `<figure>` element from a dynamic image configuration options.
 *
 * @param {Object} options The figure creation options.
 * @param {Object} options.caption The figure caption options.
 * @param {HTMLElement} options.caption.node The caption original field element holding UE
 *                                           instrumentation attributes.
 * @param {string} options.caption.text The caption text.
 * @param {Object} options.image The image options.
 * @param {HTMLAnchorElement | string} options.image.referenceLink
 *                                     See {@link createImageWithModal}
 * @param {HTMLElement | string} options.image.alt See {@link createImageWithModal}
 * @param {string} options.image.smartCrop See {@link createImageWithModal}
 * @param {HTMLAnchorElement | string} options.image.mobileReferenceLink
 *                                     See {@link createImageWithModal}
 * @param {boolean} options.image.attachModal See {@link createImageWithModal}
 * @param {boolean} options.image.eager See {@link createImageWithModal}
 * @returns {HTMLElement | null} The `<figure>` element on success, null otherwise.
 */
export function createFigureWithModal(options) {
  const figure = document.createElement('figure');
  const figcaption = document.createElement('figcaption');
  const caption = document.createElement('p');
  caption.className = 'paragraph-m-regular';
  caption.innerText = options.caption.text;
  const { referenceLink } = options.image;
  const { mobileReferenceLink } = options.image;

  /** @type {HTMLPictureElement | HTMLButtonElement} */
  const pictureDialogOpenerOrPicture = createImageWithModal(
    referenceLink,
    options.image.alt,
    options.image.smartCrop,
    mobileReferenceLink,
    options.image.attachModal,
    options.image.eager,
  );
  if (!pictureDialogOpenerOrPicture) {
    return null;
  }

  // if (isUEEdit()) {
  //   // Instrument image caption
  //   if (options.caption.text && options.caption.node) {
  //     moveInstrumentation(options.caption.node, caption);
  //   }
  //   // Instrument desktop image manually
  //   const picture = options.image.attachModal
  //     ? pictureDialogOpenerOrPicture.querySelector('picture')
  //     : pictureDialogOpenerOrPicture;
  //   picture?.setAttribute(UE_ATTRIBUTES.PROP, 'dmImage');
  //   picture?.setAttribute(UE_ATTRIBUTES.LABEL, 'Image');
  //   picture?.setAttribute(UE_ATTRIBUTES.TYPE, 'reference');
  // }

  figcaption.appendChild(caption);
  figure.appendChild(pictureDialogOpenerOrPicture);
  figure.appendChild(figcaption);

  return figure;
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
