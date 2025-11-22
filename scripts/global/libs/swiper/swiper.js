import { loadCSS, loadScript } from '../../../aem.js';

/**
 * @typedef {import("./swiper.min.js")} Swiper
 */

const SWIPER_PATH = '/scripts/global/libs/swiper';

/**
 * Try to resolve a Swiper constructor from a value by checking common shapes.
 * @param {*} value
 * @returns {Function|undefined}
 */
function resolveSwiperCtor(value) {
  if (typeof value === 'function') return value;
  if (!value || typeof value !== 'object') return undefined;
  if (typeof value.Swiper === 'function') return value.Swiper;
  if (typeof value.default === 'function') return value.default;
  if (value.default && typeof value.default.Swiper === 'function') {
    return value.default.Swiper;
  }
  if (typeof value.Core === 'function') return value.Core;
  return undefined;
}

/** @returns {Promise<Swiper>} */
export default async function loadSwiper() {
  const jsSrc = `${window.hlx.codeBasePath}${SWIPER_PATH}/swiper.min.js`;
  const cssHref = `${window.hlx.codeBasePath}${SWIPER_PATH}/swiper.min.css`;

  // Start loading resources in parallel
  const jsPromise = loadScript(jsSrc);
  const cssPromise = loadCSS(cssHref);

  // Always await CSS, but JS may have resolved early if the tag already existed.
  await cssPromise;
  await jsPromise;

  // If Swiper is already available, return it immediately.
  let ctor = resolveSwiperCtor(window.Swiper);
  if (ctor) return ctor;

  // If the script tag exists but window.Swiper is not ready yet, wait for the load event.
  const scriptEl = document.querySelector(`head > script[src="${jsSrc}"]`);
  if (scriptEl) {
    await new Promise((resolve, reject) => {
      // If it already finished loading between checks, resolve synchronously
      if (resolveSwiperCtor(window.Swiper)) {
        resolve();
        return;
      }
      scriptEl.addEventListener('load', resolve, { once: true });
      scriptEl.addEventListener('error', reject, { once: true });
    });
  }

  ctor = resolveSwiperCtor(window.Swiper);
  return ctor || window.Swiper;
}
