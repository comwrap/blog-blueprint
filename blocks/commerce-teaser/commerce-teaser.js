import { setBlockItemOptions, moveClassToTargetedChild } from '../../scripts/utils.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { renderButton } from '../../components/button/button.js';

/*
 * Commerce-Teaser Block
 *
 * Authoring column order:
 * 0 — Product Title (text)
 * 1 — Price (text, supports currency formatting)
 * 2 — Description (rich-text / text)
 * 3 — Product Image (asset reference or <picture>)
 * 4 — Image Alt Text (text – optional)
 * 5 — Product Link (URL)
 * 6 — Button Label (text – optional, defaults to "Shop Now")
 * 7 — Link Target (select – optional, _blank opens new window)
 */

export default function decorate(block) {
  /* ---------------- Parse configuration ---------------- */
  const blockItemsOptions = [];
  const blockItemMap = [
    { name: 'title' },
    { name: 'price' },
    { name: 'description' },
    { name: 'image' },
    { name: 'imageAlt' },
    { name: 'link' },
    { name: 'label' },
    { name: 'target' },
  ];

  setBlockItemOptions(block, blockItemMap, blockItemsOptions);
  const config = blockItemsOptions[0] || {};

  /* ---------------- Build DOM ---------------- */
  const wrapper = document.createElement('div');
  wrapper.className = 'commerce-teaser';

  /* Image */
  const imageContainer = document.createElement('div');
  imageContainer.className = 'commerce-teaser-image';

  if (config.image) {
    let optimizedPicture;
    try {
      optimizedPicture = createOptimizedPicture(
        config.image,
        config.imageAlt || config.title || 'Product image',
        true,
        [{ width: '750' }],
      );
    } catch (e) {
      // When config.image is already a <picture>
      optimizedPicture = config.image.cloneNode(true);
    }
    imageContainer.appendChild(optimizedPicture);
  } else {
    const placeholder = createOptimizedPicture(
      'https://placehold.co/600x450?text=No+Image',
      config.imageAlt || 'Placeholder product image',
      true,
      [{ width: '750' }],
    );
    imageContainer.appendChild(placeholder);
  }

  /* Content */
  const contentContainer = document.createElement('div');
  contentContainer.className = 'commerce-teaser-content';

  if (config.title) {
    const titleEl = document.createElement('h3');
    titleEl.className = 'commerce-teaser-title';
    titleEl.textContent = config.title;
    contentContainer.appendChild(titleEl);
  }

  if (config.price) {
    const priceEl = document.createElement('p');
    priceEl.className = 'commerce-teaser-price';
    priceEl.textContent = config.price;
    priceEl.setAttribute('aria-label', `Price: ${config.price}`);
    contentContainer.appendChild(priceEl);
  }

  if (config.description) {
    const descEl = document.createElement('p');
    descEl.className = 'commerce-teaser-description';
    descEl.textContent = config.description;
    contentContainer.appendChild(descEl);
  }

  if (config.link) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'commerce-teaser-button-container';

    const anchor = document.createElement('a');
    anchor.href = config.link;

    const button = renderButton({
      linkButton: anchor,
      linkText: config.label || 'Shop Now',
      linkTitle: config.title || 'View Product',
      linkTarget: config.target || '_blank',
      linkType: '',
      linkStyle: '',
    });

    buttonContainer.appendChild(button);
    moveClassToTargetedChild(block, button);
    contentContainer.appendChild(buttonContainer);
  }

  /* Assemble */
  wrapper.appendChild(imageContainer);
  wrapper.appendChild(contentContainer);

  moveInstrumentation(block, wrapper);

  block.textContent = '';
  block.appendChild(wrapper);
}

