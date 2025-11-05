import useBlockConfig from '../../scripts/global/useBlockConfig.js';
import { createImageWithModal } from '../helpers.js';

/** @type {import("../../scripts/global/types").BlockConfig} */
const BLOCK_CONFIG = Object.freeze({
  empty: true,
  FIELDS: {
    CLASSES: {
      index: 0,
      removeRow: false,
    },
    PRETITLE: {
      index: 1,
      removeRow: false,
    },
    TITLE: {
      index: 2,
      removeRow: false,
    },
    DESCRIPTION: {
      index: 3,
      removeRow: false,
    },
    DM_IMAGE: {
      index: 4,
      removeRow: false,
    },
    DM_IMAGE_MOBILE: {
      index: 5,
      removeRow: false,
    },
    LINK: {
      index: 6,
      removeRow: false,
    },
    LINK_TARGET: {
      index: 7,
      removeRow: false,
    },
  },
});

/**
 * Decorates the block.
 * @param {HTMLElement} block The block element
 */
export default function decorate(block) {
  const {
    CLASSES,
    PRETITLE,
    TITLE,
    DESCRIPTION,
    DM_IMAGE,
    DM_IMAGE_MOBILE,
    LINK,
    LINK_TARGET,
  } = useBlockConfig(block, BLOCK_CONFIG);

  // Set the smart crop based on the teaser grid columns
  let smartCrop = block?.parentElement?.classList?.contains('teaser-grid-columns-1') ? '32-9' : 'original';
  smartCrop = block?.parentElement?.classList?.contains('teaser-grid-columns-2') ? '16-9' : smartCrop;
  smartCrop = block?.parentElement?.classList?.contains('teaser-grid-columns-3') ? '1-1' : smartCrop;
  smartCrop = block?.parentElement?.classList?.contains('teaser-grid-columns-4') ? '4-3' : smartCrop;
  smartCrop = block?.parentElement?.classList?.contains('regular-teaser') ? '1-1' : smartCrop;

  const image = createImageWithModal(
    DM_IMAGE?.image?.src,
    DM_IMAGE?.image?.alt,
    smartCrop,
    DM_IMAGE_MOBILE?.image?.src,
    false,
    false,
  );

  const teaserInitialClasses = CLASSES ? CLASSES?.text : '';
  const teaserClassesArray = teaserInitialClasses.split(',');
  const teaserClasses = teaserClassesArray.join('');
  let teaserType = '';
  const teaserParent = block?.parentElement;
  const hasOpacityOptions = teaserParent?.classList?.contains('content-box-teaser') || teaserParent?.classList?.contains('image-teaser');
  let showImage = false;
  const classParentArray = Array.from(teaserParent.classList);
  if (!classParentArray.some((className) => className === 'content-box-teaser' || className === 'image-teaser')) {
    classParentArray.forEach((className) => {
      if (className.startsWith('teaser-background-') || className.startsWith('teaser-opacity-')) {
        // here instead remove the class from the parent element
        teaserParent.classList.remove(className);
        showImage = true;
      }
    });
  }

  // set the teaser type based on the classes if they end with -teaser
  if (classParentArray.some((className) => className.endsWith('-teaser'))) {
    teaserType = classParentArray.find((className) => className.endsWith('-teaser'));
  }

  const teaserImage = image || '';

  const link = LINK.node;
  const linkTarget = LINK_TARGET.text ? LINK_TARGET.text : '_self';
  const a = link?.querySelector('a');
  if (a) {
    a.setAttribute('target', linkTarget);
    if (teaserType === 'content-box-teaser' || teaserType === 'regular-teaser' || teaserType === 'image-teaser') {
      link.querySelector('.button-container').classList.add('showarrow');
    }
    if (teaserType === 'glass-effect-teaser') {
      a.classList.add('primary');
    }
  }

  // Show image if teaser has opacity < 100 (either inherited from grid or set individually)
  if (teaserParent?.classList?.contains('teaser-grid') && hasOpacityOptions) {
    const inheritsOpacity = teaserClasses?.includes('teaser-opacity-inherit');
    const gridHasOpacity = classParentArray.some((className) => className.includes('teaser-opacity-') && className !== 'teaser-opacity-100');
    const hasOwnOpacity = teaserClasses?.includes('teaser-opacity-') && !teaserClasses?.includes('teaser-opacity-100');

    showImage = (inheritsOpacity && gridHasOpacity) || (!inheritsOpacity && hasOwnOpacity);
  }

  // set the images automatically for non content-box-teaser and image-teaser
  if (teaserClasses && !hasOpacityOptions) {
    if ((teaserClasses?.includes('teaser-opacity-') && !teaserClasses?.includes('teaser-opacity-100'))) {
      showImage = true;
    }
  }

  const teaser = document.createRange().createContextualFragment(`
    <article class="${teaserClasses}">
      <div class="teaser-image-container">
        ${showImage && teaserImage ? teaserImage?.outerHTML : '<div class="teaser-placeholder"></div>'}
      </div>
      <div class="teaser-content">
        <div class="teaser-pretitle">
          ${PRETITLE?.text}
        </div>
        <div class="teaser-title">
          <h2>${TITLE?.text}</h2>
        </div>
        <div class="teaser-description">
          ${DESCRIPTION?.node?.innerHTML}
        </div>
        ${link ? link.innerHTML : ''}
      </div>
    </article>
  `).firstElementChild;

  block.innerHTML = '';
  block.appendChild(teaser);
}
