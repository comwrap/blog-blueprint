import {
  getCurrentLanguage,
  getTaxonomyMapById,
  mapPath,
  useBlockConfig,
  videoToOriginalRendition,
} from '../helpers.js';
import { DEFAULT_LANGUAGE, SAMPLE } from '../../scripts/global/constants.js';
import { decorateIcons } from '../../scripts/aem.js';
import loadPlyr from '../../scripts/global/libs/plyr/plyr.js';

/** @type {import("../../scripts/global/types.js").BlockConfig} */
const BLOCK_CONFIG = Object.freeze({
  empty: true,
  FIELDS: {
    FILTER_ITEM_TYPE: {
      index: 0,
      removeRow: false,
    },
    FILTER_ITEM_TITLE: {
      index: 1,
      removeRow: false,
    },
    FILTER_ITEM_DESCRIPTION: {
      index: 2,
      removeRow: false,
    },
    FILTER_ITEM_LINK: {
      index: 3,
      removeRow: false,
    },
    FILTER_ITEM_ASSET: {
      index: 4,
      removeRow: false,
    },
    FILTER_ITEM_TAGS: {
      index: 5,
      removeRow: false,
    },
  },
});

/**
 * Decorates the block.
 * @param {HTMLElement} block The block element
 */
export default async function decorate(block) {
  const {
    FILTER_ITEM_TYPE,
    FILTER_ITEM_TITLE,
    FILTER_ITEM_DESCRIPTION,
    FILTER_ITEM_LINK,
    FILTER_ITEM_ASSET,
    FILTER_ITEM_TAGS,
  } = useBlockConfig(block, BLOCK_CONFIG);

  // Fetch taxonomy for display names
  let taxonomyMap = new Map();
  const currentLanguage = mapPath(window.location.pathname).startsWith(`/${SAMPLE}`)
    ? DEFAULT_LANGUAGE
    : getCurrentLanguage();
  try {
    taxonomyMap = await getTaxonomyMapById(currentLanguage);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Could not fetch taxonomy:', error);
  }

  // Helper function to convert :icon-name: pattern to icon span
  const convertIconsToSpans = (text) => {
    if (!text) return '';
    return text.replace(/:([a-z0-9-]+):/gi, '<span class="icon icon-$1"></span>');
  };

  // Create tagNamesHtml with parent: child format
  const tagNamesHtml = FILTER_ITEM_TAGS?.text
    .split(',')
    .map((tag) => {
      const trimmedTag = tag.trim();
      const parts = trimmedTag.split('/');
      if (parts.length === 2) {
        const parentName = taxonomyMap.get(parts[0].trim())?.title || parts[0].trim();
        const childName = taxonomyMap.get(trimmedTag)?.title || parts[1].trim();
        const childDescription = taxonomyMap.get(trimmedTag)?.description || '';
        const descriptionWithIcons = convertIconsToSpans(childDescription);
        return `<span class="filter-item-tag">${descriptionWithIcons} ${parentName}: ${childName}</span>`;
      }
      // If there's no parent/child relationship, just show the tag name
      const tagName = taxonomyMap.get(trimmedTag)?.title || trimmedTag;
      return `<span class="filter-item-tag">${tagName}</span>`;
    })
    .join('');

  // Add background transparent to the filter item if there is no title filled in
  const itemBgClass = FILTER_ITEM_TYPE?.text === '' ? 'bg-transparent' : '';

  // Check if the link is a video (.mp4) - if yes, show it in a modal instead of opening as link
  const isVideo = FILTER_ITEM_LINK?.text.includes('.mp4') || FILTER_ITEM_ASSET?.text.includes('.mp4');
  let link;

  if (isVideo) {
    // For videos, set link to # to prevent navigation (modal will handle it)
    link = '#';
  } else {
    // For non-video links, remove /content/qnx-xwalk prefix
    link = FILTER_ITEM_LINK?.text.replace('/content/qnx-xwalk', '');
    if (FILTER_ITEM_ASSET?.text.includes('.pdf')) {
      link = FILTER_ITEM_ASSET?.text;
    }
  }

  const showTags = block?.parentElement?.classList?.contains('filters-show-tags');
  const target = isVideo ? '' : '_blank';
  const videoDataAttr = isVideo ? `data-video-url="${FILTER_ITEM_LINK?.text || FILTER_ITEM_ASSET?.text}"` : '';
  const itemLinkLabel = block?.parentElement?.getAttribute('data-item-link-label');

  const filterItem = document.createRange().createContextualFragment(`
    <article
      class="filter-item ${itemBgClass}"
      data-tags="${FILTER_ITEM_TAGS?.text}"
      data-type="${FILTER_ITEM_TYPE?.text}"
      ${videoDataAttr}
    >
      <p class="filter-item-type">${FILTER_ITEM_TYPE?.text}</p>
      <h2 class="filter-item-title">${FILTER_ITEM_TITLE?.text}</h2>
      <div class="filter-item-description">${FILTER_ITEM_DESCRIPTION?.node?.innerHTML}</div>
      <div class="filter-item-tags">${showTags && FILTER_ITEM_TAGS?.text ? tagNamesHtml : ''}</div>
      <p class="button-container showarrow">
        <a
          class="filter-item-link button"
          href="${link}"
          ${target ? `target="${target}"` : ''}
        >${itemLinkLabel}</a>
      </p>
    </article>
  `).firstElementChild;

  // If it's a video, add click handler to show modal
  if (isVideo) {
    const videoUrl = FILTER_ITEM_LINK?.text || FILTER_ITEM_ASSET?.text;
    const dialogId = `filter-item-video-modal-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Create the video element
    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.setAttribute('controls', '');

    const videoUrlProcessed = videoToOriginalRendition(videoUrl);
    const source = document.createElement('source');
    source.src = videoUrlProcessed;
    source.type = 'video/mp4';
    video.appendChild(source);

    // Create the video modal
    const dialog = document.createRange().createContextualFragment(`
      <dialog id="${dialogId}" class="dm-image-modal filter-item-video-modal" aria-label="Video preview">
        <div class="dm-image-modal-content filter-item-video-modal-content">
          <form method="dialog">
            <button class="dm-image-modal-close filter-item-video-modal-close" type="submit" aria-label="Close video preview">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g id="Frame 252326588">
                  <g id="Group 252326589">
                    <path id="Vector 11" d="M2 2L22 22" stroke="currentColor" stroke-width="2"/>
                    <path id="Vector 12" d="M22 2L2 22" stroke="currentColor" stroke-width="2"/>
                  </g>
                </g>
              </svg>
            </button>
          </form>
        </div>
      </dialog>
    `).firstElementChild;

    // Append video to modal content
    const modalContent = dialog.querySelector('.filter-item-video-modal-content');
    modalContent.appendChild(video);

    document.body.appendChild(dialog);

    let player = null;
    const filterItemLink = filterItem.querySelector('.filter-item-link');

    // Add click handler to open modal
    filterItemLink.addEventListener('click', (e) => {
      e.preventDefault();
      const modalEl = document.getElementById(dialogId);
      modalEl?.showModal();

      // Initialize Plyr when modal opens (if not already initialized)
      if (!player) {
        loadPlyr()
          .then((Plyr) => {
            const controls = [
              'play-large', 'play', 'progress', 'current-time', 'duration',
              'mute', 'download', 'fullscreen',
            ];

            player = new Plyr(video, {
              controls,
              urls: {
                download: FILTER_ITEM_ASSET?.text?.replace('/play/as/', '/original/as/'),
              },
              settings: [],
              invertTime: false,
              hideControls: true,
              clickToPlay: true,
              loadSprite: false,
              autoplay: false,
            });

            // Make video pausable via touch
            player.once('ready', () => {
              player.elements.wrapper?.addEventListener('touchend', () => player.togglePlay());
            });
          })
          .catch((err) => {
            // Fallback: if Plyr failed to load, keep the native controls
            // eslint-disable-next-line no-console
            console.error('Failed to load Plyr dynamically:', err);
          });
      }
    });

    // Pause video and reset when modal is closed
    dialog.addEventListener('close', () => {
      if (player) {
        player.pause();
        player.currentTime = 0;
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }

  block.innerHTML = '';
  block.appendChild(filterItem);

  // Decorate icons in the tags
  if (showTags) {
    const tagsContainer = filterItem.querySelector('.filter-item-tags');
    if (tagsContainer) {
      decorateIcons(tagsContainer);
    }
  }
}
