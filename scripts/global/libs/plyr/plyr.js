import { loadCSS } from '../../../aem.js';

/**
 * @typedef {import("./plyr.min.js").default} Plyr
 */

const PLYR_PATH = '/scripts/global/libs/plyr';
const PLYR_SPRITE_ID = 'plyr-sprite';

async function loadPlyrSprite() {
  if (document.getElementById(PLYR_SPRITE_ID)) return;
  const res = await fetch(`${window.hlx.codeBasePath}${PLYR_PATH}/plyr.svg`, { cache: 'reload' });
  const svg = await res.text();
  const plyrSprite = document.createRange().createContextualFragment(`
    <div
      id="${PLYR_SPRITE_ID}"
      style="position:absolute;width:0;height:0;overflow:hidden"
    >
      ${svg}
    </div>
  `).firstElementChild;
  if (plyrSprite) document.body.prepend(plyrSprite);
}

/** @returns {Promise<Plyr>} */
export default async function loadPlyr() {
  return Promise.all([
    import(`${window.hlx.codeBasePath}${PLYR_PATH}/plyr.min.mjs`),
    loadCSS(`${window.hlx.codeBasePath}${PLYR_PATH}/plyr.min.css`),
    loadPlyrSprite(),
  ]).then(([m]) => m?.default || m);
}
