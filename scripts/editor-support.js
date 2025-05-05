import {
  decorateBlock,
  decorateBlocks,
  decorateButtons,
  decorateIcons,
  decorateSections,
  loadBlock,
  loadSections,
} from './aem.js';
import { decorateRichtext } from './editor-support-rte.js';
import { decorateMain } from './scripts.js';

/**
 * Module for handling component locking and user-specific filtering
 */

/**
 * Fetches current user and their group memberships
 * @returns {Promise<Object>} User data including group memberships
 */
async function getCurrentUser() {
  try {
    const response = await fetch('/libs/granite/security/currentuser.json?props=memberOf');
    if (!response.ok) throw new Error('Failed to fetch user data');
    return await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

/**
 * Removes authoring instrumentation from specified components
 * @param {HTMLElement} element - The component element to lock
 */
function lockComponent(element) {
  if (!element) return;

  // Remove all data-aue-* attributes
  const aueAttributes = Array.from(element.attributes).filter((attr) =>
    attr.name.startsWith('data-aue-')
  );

  aueAttributes.forEach((attr) => {
    element.removeAttribute(attr.name);
  });

  // Also remove from child elements
  element.querySelectorAll('[data-aue-resource]').forEach((child) => {
    lockComponent(child);
  });
}

/**
 * Updates component filters based on user group membership
 * @param {Object} userData - Current user data including group memberships
 */
async function updateComponentFilters(userData) {
  if (!userData?.memberOf) return;

  const userGroups = userData.memberOf;
  const filterScript = document.querySelector('script[type="application/vnd.adobe.aue.filter+json"]');
  if (!filterScript) return;

  // Determine appropriate filter based on user groups
  const filterPath = userGroups.some((group) => group.authorizableId === 'contributor')
    ? '/content/aem-xwalk.resource/component-limited-filters.json'
    : '/content/aem-xwalk.resource/component-filters.json';

  // Only update if the path is different
  if (filterScript.getAttribute('src') !== filterPath) {
    filterScript.setAttribute('src', filterPath);
  }
}

// Initialize component locking and user-specific filtering
async function initializeEditorSupport() {
  const userData = await getCurrentUser();
  await updateComponentFilters(userData);

  // Check if this is an article page that needs component locking
  const isArticlePage = document.body.classList.contains('two-columns');
  if (isArticlePage) {
    // Lock all add except those that should remain editable
    document.querySelectorAll('.block[data-aue-resource]').forEach((component) => {
      // You can add conditions here to determine which components to lock
      if (!component.classList.contains('editable')) {
        lockComponent(component);
      }
    });
  }
}

// Initialize editor support immediately at module level
await initializeEditorSupport();

async function applyChanges(event) {
  // redecorate default content and blocks on patches (in the properties rail)
  const { detail } = event;

  const resource =
    detail?.request?.target?.resource || // update, patch components
    detail?.request?.target?.container?.resource || // update, patch, add to sections
    detail?.request?.to?.container?.resource; // move in sections
  if (!resource) return false;
  const updates = detail?.response?.updates;
  if (!updates.length) return false;
  const { content } = updates[0];
  if (!content) return false;

  const parsedUpdate = new DOMParser().parseFromString(content, 'text/html');
  const element = document.querySelector(`[data-aue-resource="${resource}"]`);

  if (element) {
    if (element.matches('main')) {
      const newMain = parsedUpdate.querySelector(`[data-aue-resource="${resource}"]`);
      newMain.style.display = 'none';
      element.insertAdjacentElement('afterend', newMain);
      decorateMain(newMain);
      decorateRichtext(newMain);
      await loadSections(newMain);
      element.remove();
      newMain.style.display = null;
      // eslint-disable-next-line no-use-before-define
      attachEventListners(newMain);
      return true;
    }

    const block =
      element.parentElement?.closest('.block[data-aue-resource]') ||
      element?.closest('.block[data-aue-resource]');
    if (block) {
      const blockResource = block.getAttribute('data-aue-resource');
      const newBlock = parsedUpdate.querySelector(`[data-aue-resource="${blockResource}"]`);
      if (newBlock) {
        newBlock.style.display = 'none';
        block.insertAdjacentElement('afterend', newBlock);
        decorateButtons(newBlock);
        decorateIcons(newBlock);
        decorateBlock(newBlock);
        decorateRichtext(newBlock);
        await loadBlock(newBlock);
        block.remove();
        newBlock.style.display = null;
        return true;
      }
    } else {
      // sections and default content, may be multiple in the case of richtext
      const newElements = parsedUpdate.querySelectorAll(
        `[data-aue-resource="${resource}"],[data-richtext-resource="${resource}"]`
      );
      if (newElements.length) {
        const { parentElement } = element;
        if (element.matches('.section')) {
          const [newSection] = newElements;
          newSection.style.display = 'none';
          element.insertAdjacentElement('afterend', newSection);
          decorateButtons(newSection);
          decorateIcons(newSection);
          decorateRichtext(newSection);
          decorateSections(parentElement);
          decorateBlocks(parentElement);
          await loadSections(parentElement);
          element.remove();
          newSection.style.display = null;
        } else {
          element.replaceWith(...newElements);
          decorateButtons(parentElement);
          decorateIcons(parentElement);
          decorateRichtext(parentElement);
        }
        return true;
      }
    }
  }

  return false;
}

function attachEventListners(main) {
  [
    'aue:content-patch',
    'aue:content-update',
    'aue:content-add',
    'aue:content-move',
    'aue:content-remove',
    'aue:content-copy',
  ].forEach((eventType) =>
    main?.addEventListener(eventType, async (event) => {
      event.stopPropagation();
      const applied = await applyChanges(event);
      if (!applied) window.location.reload();
    })
  );
}

attachEventListners(document.querySelector('main'));
