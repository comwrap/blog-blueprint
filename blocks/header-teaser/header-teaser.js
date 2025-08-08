import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';
import { setBlockItemOptions } from '../../scripts/utils.js';
import { renderButton } from '../../components/button/button.js';

function buildHeading(level, text) {
  const tag = (/^h[1-6]$/i.test(level) ? level.toLowerCase() : 'h2');
  const el = document.createElement(tag);
  el.textContent = text || '';
  return el;
}

function getUrlFromCell(cell) {
  if (!cell) return '';
  const a = cell.querySelector('a');
  if (a) return a.href;
  return cell.textContent.trim();
}

function createCTA(link, text, title, target, type, style) {
  if (!link || !text) return null;
  const a = document.createElement('a');
  a.classList.add('button');
  // Use shared renderButton util for consistency
  return renderButton({
    linkButton: a,
    linkText: text,
    linkTitle: title || '',
    linkTarget: target || '',
    linkType: (type || 'link').toLowerCase(),
    linkStyle: (style || '').toLowerCase(),
  });
}

function buildMedia({
  desktopType,
  desktopImage,
  desktopAlt,
  desktopVideo,
  mobileType,
  mobileImage,
  mobileAlt,
  mobileVideo,
}) {
  const mediaContainer = document.createElement('div');
  mediaContainer.className = 'header-teaser-media';

  // Desktop media
  if (desktopType === 'video' && desktopVideo) {
    const video = document.createElement('video');
    video.className = 'desktop-media';
    video.src = desktopVideo;
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('aria-label', desktopAlt || 'Header video');
    mediaContainer.appendChild(video);
  } else {
    const picture = createOptimizedPicture(
      desktopImage || 'https://placehold.co/1600x900?text=Header%20Teaser',
      desktopAlt || 'Header image',
      true,
      [
        { media: '(min-width: 900px)', width: '2000' },
        { width: '900' },
      ],
    );
    const wrapper = document.createElement('div');
    wrapper.className = 'desktop-media';
    wrapper.append(picture);
    mediaContainer.appendChild(wrapper);
  }

  // Mobile media (optional override)
  if (mobileType && mobileType !== 'same') {
    if (mobileType === 'video' && mobileVideo) {
      const video = document.createElement('video');
      video.className = 'mobile-media';
      video.src = mobileVideo;
      video.muted = true;
      video.loop = true;
      video.autoplay = true;
      video.playsInline = true;
      video.setAttribute('aria-label', mobileAlt || desktopAlt || 'Header video');
      mediaContainer.appendChild(video);
    } else {
      const picture = createOptimizedPicture(
        mobileImage || desktopImage || 'https://placehold.co/800x600?text=Header%20Teaser',
        mobileAlt || desktopAlt || 'Header image',
        false,
        [
          { media: '(min-width: 900px)', width: '1200' },
          { width: '600' },
        ],
      );
      const wrapper = document.createElement('div');
      wrapper.className = 'mobile-media';
      wrapper.append(picture);
      mediaContainer.appendChild(wrapper);
    }
  }

  return mediaContainer;
}

function applyStyleTokens({ content, textbox, media }, tokens) {
  if (!tokens) return;
  const styles = tokens.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  styles.forEach((style) => {
    switch (style) {
      case 'pos-left':
      case 'pos-center':
      case 'pos-right':
        content.classList.add(style);
        break;
      case 'text-left':
      case 'text-center':
      case 'text-right':
      case 'no-bg':
      case 'glass-25':
      case 'glass-50':
      case 'glass-75':
      case 'overlay-dark':
      case 'overlay-light':
      case 'height-short':
      case 'height-medium':
      case 'height-full':
        textbox.classList.add(style);
        media.classList.add(style);
        break;
      default:
        break;
    }
  });
}

export default function decorate(block) {
  // Read inputs by column index to keep consistent parsing
  const blockItemsOptions = [];
  const blockItemMap = [
    { name: 'pretitle' }, // 0
    { name: 'title' }, // 1
    { name: 'titleLevel' }, // 2 e.g., h1-h6
    { name: 'text' }, // 3
    { name: 'mediaType' }, // 4 image | video
    { name: 'image' }, // 5
    { name: 'imageAlt' }, // 6
    { name: 'video' }, // 7
    { name: 'mobileMediaType' }, // 8 same | image | video
    { name: 'mobileImage' }, // 9
    { name: 'mobileImageAlt' }, // 10
    { name: 'mobileVideo' }, // 11
    // CTA 1
    { name: 'cta1Link' }, // 12
    { name: 'cta1Text' }, // 13
    { name: 'cta1Title' }, // 14
    { name: 'cta1Target' }, // 15 (e.g., _blank)
    { name: 'cta1Type' }, // 16 link|download|email|telephone
    { name: 'cta1Style' }, // 17 primary|secondary|tertiary|text
    // CTA 2
    { name: 'cta2Link' }, // 18
    { name: 'cta2Text' }, // 19
    { name: 'cta2Title' }, // 20
    { name: 'cta2Target' }, // 21
    { name: 'cta2Type' }, // 22
    { name: 'cta2Style' }, // 23
    // Styles (comma separated tokens)
    { name: 'styles' }, // 24
  ];
  setBlockItemOptions(block, blockItemMap, blockItemsOptions);
  const cfg = blockItemsOptions[0] || {};

  // Media prefs
  const desktopType = (cfg.mediaType || 'image').toLowerCase();
  const desktopImage = cfg.image || '';
  const desktopAlt = cfg.imageAlt || '';
  const desktopVideo = cfg.video || '';
  const mobileType = (cfg.mobileMediaType || 'same').toLowerCase();
  const mobileImage = cfg.mobileImage || '';
  const mobileAlt = cfg.mobileImageAlt || '';
  const mobileVideo = cfg.mobileVideo || '';

  // Build media container first
  const media = buildMedia({
    desktopType,
    desktopImage,
    desktopAlt,
    desktopVideo,
    mobileType,
    mobileImage,
    mobileAlt,
    mobileVideo,
  });

  // Build content container with an inner textbox wrapper so that
  // carousel.js can replace outer class without breaking our styles
  const content = document.createElement('div');
  content.className = 'header-teaser-content';

  const contentInner = document.createElement('div');
  contentInner.className = 'header-teaser-content-inner';

  const textbox = document.createElement('div');
  textbox.className = 'header-teaser-textbox';

  if (cfg.pretitle) {
    const pre = document.createElement('p');
    pre.className = 'header-teaser-pretitle';
    pre.textContent = cfg.pretitle;
    textbox.appendChild(pre);
  }

  if (cfg.title) {
    const heading = buildHeading(cfg.titleLevel || 'h2', cfg.title);
    heading.classList.add('header-teaser-title');
    textbox.appendChild(heading);
  }

  if (cfg.text) {
    const p = document.createElement('p');
    p.className = 'header-teaser-text';
    p.textContent = cfg.text;
    textbox.appendChild(p);
  }

  const ctas = document.createElement('div');
  ctas.className = 'header-teaser-ctas';

  const cta1 = createCTA(
    cfg.cta1Link,
    cfg.cta1Text,
    cfg.cta1Title,
    cfg.cta1Target,
    cfg.cta1Type,
    cfg.cta1Style,
  );
  if (cta1) ctas.appendChild(cta1);

  const cta2 = createCTA(
    cfg.cta2Link,
    cfg.cta2Text,
    cfg.cta2Title,
    cfg.cta2Target,
    cfg.cta2Type,
    cfg.cta2Style,
  );
  if (cta2) ctas.appendChild(cta2);

  if (ctas.children.length) textbox.appendChild(ctas);

  // Apply style tokens
  applyStyleTokens({ content: contentInner, textbox, media }, cfg.styles);

  contentInner.appendChild(textbox);
  content.appendChild(contentInner);

  // Replace original content
  const originalPictures = block.querySelectorAll('picture > img');
  block.textContent = '';
  block.appendChild(media);
  block.appendChild(content);

  // Try to keep UE instrumentation if we had images in the authored table
  if (originalPictures.length) {
    const firstImg = media.querySelector('img');
    if (firstImg) {
      moveInstrumentation(originalPictures[0], firstImg);
    }
  }
}
