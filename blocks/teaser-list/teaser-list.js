import useBlockConfig from '../../scripts/global/useBlockConfig.js';
import { getQueryIndex, getDictionary } from '../helpers.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

const TEASER_LIST_BUTTON_LABEL = 'Read more';
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

/**
 * Decorates the block.
 * @param {HTMLElement} block The block element
 */
export default async function decorate(block) {
  const {
    TEASER_LIST_TYPE,
    TEASER_PARENT_PAGE_LINK,
    TEASER_INDIVIDUAL_PAGES_LINK,
    TEASER_TAG,
  } = useBlockConfig(block, BLOCK_CONFIG);

  const { teaserlist: button } = await getDictionary();

  let pagesData = [];
  const data = await getQueryIndex();
  const ROOT_PATH = '/content/blog-blueprint';

  if (TEASER_LIST_TYPE.text === 'parent_page') {
    const teaserParentPath = TEASER_PARENT_PAGE_LINK.text;
    const teaserParentLink = teaserParentPath.replace(ROOT_PATH, '');
    pagesData = data.filter(
      (page) => page.path
      && page.path.startsWith(teaserParentLink)
      && page.path !== teaserParentLink,
    );
  } else if (TEASER_LIST_TYPE.text === 'individual_pages') {
    const individualPagesLinks = TEASER_INDIVIDUAL_PAGES_LINK.node?.innerText;
    if (individualPagesLinks) {
      const individualPaths = individualPagesLinks
        .split(',')
        .map((link) => link.trim())
        .filter((link) => link.length > 0)
        .map((link) => {
          const cleanPath = link.replace(ROOT_PATH, '');
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
    const teaserTag = TEASER_TAG.text;
    const teaserTags = teaserTag.split(',');
    pagesData = data.filter(
      (page) => page.tags
      && page.tags.some((tag) => teaserTags.includes(tag)),
    );
  }

  const teaserList = document.createElement('ul');
  teaserList.className = 'teaser-list-inner';
  teaserList.setAttribute('role', 'list');
  pagesData.forEach((page) => {
    const image = createOptimizedPicture(page.teaserimage, page.title, '16-9');
    const title = page.teasertitle || page.title;

    const description = page.teaserdescription || page.description;
    const teaserFragment = document.createRange().createContextualFragment(`
      <li class="teaser-list-item" role="listitem">
        <article class="teaser">
          <div class="teaser-image" role="img" aria-label="${title}"></div>
          <div class="teaser-content">
            <div class="teaser-text">
              <h3 class="teaser-headline">${title}</h3>
              ${description ? `<p class="teaser-description">${description}</p>` : ''}
            </div>
            <div class="teaser-button-container showarrow">
              <a href="${page.path || '#'}" 
                 class="button" 
                 aria-label="${button.label || TEASER_LIST_BUTTON_LABEL}"
                 ${!page.path ? 'aria-disabled="true"' : ''}>
                <span>${button.label || TEASER_LIST_BUTTON_LABEL}</span>
              </a>
            </div>
          </div>
        </article>
      </li>
    `);
    const teaser = teaserFragment.querySelector('.teaser');
    const imageContainer = teaser.querySelector('.teaser-image');
    if (image) {
      imageContainer.appendChild(image);
    }
    teaserList.appendChild(teaser);
  });

  block.appendChild(teaserList);
}
