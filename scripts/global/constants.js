export const BREAKPOINTS = Object.freeze({
  MOBILE_XS: 375,
  MOBILE: 480,
  DESKTOP_XL: 1920,
});

// Paths
export const ROOT_PATH = '/content/blog-blueprint';

// Names
export const LANGUAGE_MASTERS = 'language-masters';
export const SAMPLE = 'sample';

// Defaults
/** @type {import("./types").ColorScheme} */
export const DEFAULT_COLOR_SCHEME = 'light';
export const DEFAULT_COUNTRY = 'com';
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_LOCALE = `${DEFAULT_COUNTRY}-${DEFAULT_LANGUAGE}`;

// IDs
export const MAIN_CONTENT_ID = 'main-content';

// Data attributes
export const DATA_BG_GRAPHIC = 'data-bg-graphic';
/**
 * Used to mark all the major elements of the page that are fixed positioned.
 * This way their right margin will be handled correctly when the page scrolling is blocked and
 * the lateral scrollbar disappears, to prevent the page content from abruptly changing its width.
 */
export const DATA_FIXED_POSITION = 'data-fixed-position';

// Classes
/** Used to block page scrolling on the `<body>` element */
export const CLASS_BLOCK_SCROLL = 'block-scroll';

// Common regexes
export const REGEX_PLACEHOLDER = /\$\{[^}]+\}/;
export const REGEX_DICTIONARY = /\$\{[^}]+\}/;

/**
 * UNIVERSAL EDITOR EVENTS (see {@link https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/universal-editor/events})
 */
export const UE_EVENT = Object.freeze({
  CONTENT_ADD: 'aue:content-add',
  CONTENT_DETAILS: 'aue:content-details',
  CONTENT_MOVE: 'aue:content-move',
  CONTENT_PATCH: 'aue:content-patch',
  CONTENT_REMOVE: 'aue:content-remove',
  CONTENT_UPDATE: 'aue:content-update',
  UI_PREVIEW: 'aue:ui-preview',
  UI_EDIT: 'aue:ui-edit',
  UI_VIEWPORT_CHANGE: 'aue:ui-viewport-change',
  INITIALIZED: 'aue:initialized',
});

/**
 * UNIVERSAL EDITOR ATTRIBUTES
 */
export const UE_ATTRIBUTES = Object.freeze({
  RESOURCE: 'data-aue-resource',
  PROP: 'data-aue-prop',
  LABEL: 'data-aue-label',
  TYPE: 'data-aue-type',
  MODEL: 'data-aue-model',
});
