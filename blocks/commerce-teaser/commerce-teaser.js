import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { setBlockItemOptions, moveClassToTargetedChild } from '../../scripts/utils.js';
import { renderButton } from '../../components/button/button.js';

function getTextContent(el) {
  return el?.textContent?.trim() || '';
}

function getLinkFromRow(row) {
  if (!row) return '';
  const a = row.querySelector('a');
  if (a) return a.href;
  return getTextContent(row);
}

function getImageFromRow(row) {
  if (!row) return { src: '', alt: '' };
  const img = row.querySelector('img');
  if (img) return { src: img.src, alt: img.alt || '' };
  const pic = row.querySelector('picture');
  const picImg = pic?.querySelector('img');
  if (picImg) return { src: picImg.src, alt: picImg.alt || '' };
  return { src: '', alt: '' };
}

export default function decorate(block) {
  // Parse block content in a defensive manner
  const rows = [...block.children];

  // Map common fields by index for consistency with authoring model
  const blockItemsOptions = [];
  const blockItemMap = [
    { name: 'image' },
    { name: 'title' },
    { name: 'price' },
    { name: 'description' },
    { name: 'link' },
    { name: 'label' },
    { name: 'target' },
  ];
  setBlockItemOptions(block, blockItemMap, blockItemsOptions);
  const config = blockItemsOptions[0] || {};

  // Enhance config with richer extraction for image and link
  const imgInfo = getImageFromRow(rows[0]);
  const linkHref = getLinkFromRow(rows[4]);
  const linkLabel = getTextContent(rows[5]) || config.label || 'Shop Now';
  const linkTarget = getTextContent(rows[6]) || config.target || '_blank';

  const product = {
    title: getTextContent(rows[1]) || config.title || '',
    price: getTextContent(rows[2]) || config.price || '',
    description: getTextContent(rows[3]) || config.description || '',
    image: imgInfo.src || config.image || '',
    imageAlt: imgInfo.alt || config.imageAlt || 'Product image',
    link: linkHref || config.link || '',
    label: linkLabel,
    target: linkTarget || '_blank',
  };

  // Build structure
  const card = document.createElement('div');
  card.className = 'commerce-teaser-card';
  card.setAttribute('role', 'region');
  card.setAttribute('aria-roledescription', 'Product teaser');

  // Image
  const imageWrap = document.createElement('div');
  imageWrap.className = 'ct-image';
  if (product.image) {
    const picture = createOptimizedPicture(product.image, product.imageAlt, false, [{ width: '750' }]);
    // If there was an authored image/picture, move instrumentation attributes
    const authored = rows[0]?.querySelector('img, picture');
    if (authored) {
      const optimizedImg = picture.querySelector('img');
      if (optimizedImg) moveInstrumentation(authored, optimizedImg);
    }
    imageWrap.appendChild(picture);
  } else {
    const picture = createOptimizedPicture('https://placehold.co/600x400', product.imageAlt, false, [{ width: '750' }]);
    imageWrap.appendChild(picture);
  }

  // Body
  const body = document.createElement('div');
  body.className = 'ct-body';

  // Title (also linked for accessibility and keyboard users)
  if (product.title) {
    const h3 = document.createElement('h3');
    h3.className = 'ct-title';
    if (product.link) {
      const a = document.createElement('a');
      a.href = product.link;
      a.textContent = product.title;
      if (product.target) a.target = product.target;
      a.setAttribute('aria-label', `${product.title}`);
      h3.appendChild(a);
    } else {
      h3.textContent = product.title;
    }
    body.appendChild(h3);
  }

  // Price (prominent and accessible)
  if (product.price) {
    const priceEl = document.createElement('div');
    priceEl.className = 'ct-price';
    priceEl.setAttribute('aria-label', `Price ${product.price}`);
    priceEl.textContent = product.price;
    body.appendChild(priceEl);
  }

  // Description (truncated via CSS)
  if (product.description) {
    const desc = document.createElement('p');
    desc.className = 'ct-description';
    desc.textContent = product.description;
    body.appendChild(desc);
  }

  // CTA Button (defaults to new window if not provided)
  const ctaWrap = document.createElement('div');
  ctaWrap.className = 'ct-cta';
  if (product.link) {
    const linkButton = document.createElement('a');
    linkButton.className = 'button primary';
    linkButton.href = product.link;
    // Render with shared button util for consistency
    const btn = renderButton({
      linkButton,
      linkText: product.label,
      linkTitle: product.label,
      linkTarget: product.target || '_blank',
      linkType: '',
      linkStyle: 'primary',
    });
    ctaWrap.appendChild(btn);
    moveClassToTargetedChild(block, btn);
  }

  card.appendChild(imageWrap);
  card.appendChild(body);
  card.appendChild(ctaWrap);

  // Replace original content
  block.textContent = '';
  block.appendChild(card);
}

