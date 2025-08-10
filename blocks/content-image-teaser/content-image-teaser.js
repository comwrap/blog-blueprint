import { setBlockItemOptions, moveClassToTargetedChild } from '../../scripts/utils.js';
import { renderButton } from '../../components/button/button.js';
import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

/**
 * Decorates the content/image teaser block
 * Expected columns order in the authoring table:
 * 0 Pretitle
 * 1 Title
 * 2 Title type (h2-h6)
 * 3 Text (richtext)
 * 4 Image path / URL
 * 5 Image alt text
 * 6 Alignment (left|right) – optional, defaults to left
 * 7 Coral line (true|false) – optional, defaults to false
 * 8 CTA link
 * 9 CTA label
 * 10 CTA target (e.g., _blank)
 */
export default function decorate(block) {
  // Parse authoring values to an object
  const blockItemsOptions = [];
  const blockItemMap = [
    { name: 'pretitle' },
    { name: 'title' },
    { name: 'description' },
    { name: 'image' },
    { name: 'align' },
    { name: 'coralLine' },
    { name: 'link' },
    { name: 'label' },
    { name: 'target' },
  ];

  setBlockItemOptions(block, blockItemMap, blockItemsOptions);
  const config = blockItemsOptions[0] || {};

  // Wrapper element
  const wrapper = document.createElement('div');
  wrapper.className = 'content-image-teaser';

  // Alignment
  const alignment = (config.align || 'left').toLowerCase();
  wrapper.classList.add(`align-${alignment}`);

  // Coral accent line
  if (['true', 'yes', 'on'].includes((config.coralLine || '').toLowerCase())) {
    wrapper.classList.add('coral-line');
  }

  /* ---------------- Image Column ---------------- */
  const imageDiv = document.createElement('div');
  imageDiv.className = 'teaser-image';

  if (config.image) {
    // Attempt to preserve Universal Editor instrumentation attributes
    let originalImgEl;
    const imageCell = block.children[4];
    if (imageCell) {
      // Look for an existing <picture> or <img> element provided by the author
      originalImgEl = imageCell.querySelector('picture, img');
    }

    const optimizedPic = createOptimizedPicture(
      config.image,
      config.imageAlt || '',
      false,
      [{ media: '(min-width: 900px)' }],
    );

    if (originalImgEl) {
      moveInstrumentation(originalImgEl, optimizedPic);
    }

    imageDiv.appendChild(optimizedPic);
  } else {
    const img = document.createElement('img');
    img.src = 'https://placehold.co/600x400';
    img.alt = config.imageAlt || 'Placeholder Image';
    imageDiv.appendChild(img);
  }

  /* ---------------- Text Column ---------------- */
  const textDiv = document.createElement('div');
  textDiv.className = 'teaser-text';

  // Pretitle
  if (config.pretitle) {
    const preEl = document.createElement('p');
    preEl.className = 'teaser-pretitle';
    preEl.textContent = config.pretitle;
    textDiv.appendChild(preEl);
  }

  // Title with dynamic heading level
  const headingLevel = ['h2', 'h3', 'h4', 'h5', 'h6'].includes((config.titleType || '').toLowerCase())
    ? config.titleType.toLowerCase()
    : 'h2';

  const titleEl = document.createElement(headingLevel);
  titleEl.className = 'teaser-title';
  titleEl.textContent = config.title || '';
  textDiv.appendChild(titleEl);

  // Description / rich text – basic handling (as plain text)
  if (config.description) {
    const descEl = document.createElement('p');
    descEl.className = 'teaser-description';
    descEl.textContent = config.description;
    textDiv.appendChild(descEl);
  }

  // CTA button
  if (config.label) {
    const btnWrapper = document.createElement('div');
    btnWrapper.className = 'teaser-button';

    const button = renderButton({
      link: config.link,
      label: config.label,
      target: config.target,
      block,
    });

    btnWrapper.appendChild(button);
    moveClassToTargetedChild(block, button);
    textDiv.appendChild(btnWrapper);
  }

  /* ---------------- Assemble ---------------- */
  // Order depends on alignment – for visual order we rely on flex-direction,
  // but on mobile they stack.
  wrapper.appendChild(imageDiv);
  wrapper.appendChild(textDiv);

  // Clean original block and inject new DOM
  block.textContent = '';
  block.appendChild(wrapper);
}
