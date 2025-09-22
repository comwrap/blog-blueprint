import useBlockConfig from '../../scripts/global/useBlockConfig.js';
import { getQueryIndex } from '../helpers.js';

const BLOCK_CONFIG = Object.freeze({
  empty: false,
  FIELDS: {
    TEASER_LIST_TYPE: {
      index: 0,
      removeRow: true,
    },
    TEASER_PARENT_PAGE_LINK: {
      index: 1,
      removeRow: true,
    },
    TEASER_INDIVIDUAL_PAGES_LINK: {
      index: 2,
      removeRow: true,
    },
    TEASER_TAG: {
      index: 3,
      removeRow: true,
    },
  },
});

export default async function decorate(block) {
  const {
    TEASER_LIST_TYPE,
    TEASER_PARENT_PAGE_LINK,
    TEASER_INDIVIDUAL_PAGES_LINK,
    TEASER_TAG,
  } = useBlockConfig(block, BLOCK_CONFIG);

  let pagesData = [];

  if (TEASER_LIST_TYPE.text === 'parent_page') {
    const { data } = await getQueryIndex();
    const teaserParentPath = TEASER_PARENT_PAGE_LINK.text;
    const teaserParentLink = teaserParentPath.replace('/content/qnx-xwalk', '');
    pagesData = data.filter(
      (page) => page.path
      && page.path.startsWith(teaserParentLink)
      && page.path !== teaserParentLink,
    );
  } else if (TEASER_LIST_TYPE.text === 'individual_pages') {
    const individualPagesLinks = TEASER_INDIVIDUAL_PAGES_LINK.node?.innerText;
    if (individualPagesLinks) {
      const { data } = await getQueryIndex();

      const individualPaths = individualPagesLinks
        .split(',')
        .map((link) => link.trim())
        .filter((link) => link.length > 0)
        .map((link) => {
          const cleanPath = link.replace(/^\/?(content\/qnx-xwalk\/?)/, '');
          return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
        });

      pagesData = data.filter((page) => page.path && individualPaths.includes(page.path));
      pagesData.sort((a, b) => {
        const aIndex = individualPaths.indexOf(a.path);
        const bIndex = individualPaths.indexOf(b.path);
        return aIndex - bIndex;
      });
    }
  } else if (TEASER_LIST_TYPE.text === 'tag') {
    // TODO: Implement tag
    const { data } = await getQueryIndex();
    pagesData = data.filter((page) => page.tags && page.tags.includes(TEASER_TAG.text));
  }

  pagesData.forEach((page) => {
    const teaser = document.createElement('div');
    teaser.classList.add('teaser');
    if (page) {
      teaser.innerHTML = `
      <div class="teaser-image">
        <img src="${page.teaserimage}?smartcrop=16-9" alt="${page.title}">
      </div>
      <div class="teaser-content">
        <div class="teaser-text">
          <h2 class="teaser-headline">${page.teasertitle}</h2>
          <p class="teaser-description">${page.teaserdescription}</p>
        </div>
        <div class="teaser-button-container showarrow">
          <a href="${page.path}" class="button">
            <span>Read more</span>
          </a>
        </div>
      </div>
      `;
    }
    block.appendChild(teaser);
  });
}
