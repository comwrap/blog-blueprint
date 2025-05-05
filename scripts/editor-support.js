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
 * Initialize user data and set appropriate component filters
 */
async function initializeUserAndFilters() {
  let userData = null;
  try {
    const response = await fetch('/libs/granite/security/currentuser.json?props=memberOf');
    if (!response.ok) throw new Error('Failed to fetch user data');
    userData = await response.json();
  } catch (error) {
    console.error('Error fetching user data:', error);
    userData = null;
  }

  console.log('Updating component filters for user:', userData);

  const userGroups = !userData?.memberOf ? [] : userData.memberOf;
  let filterPath = '/content/aem-xwalk.resource/component-filters.json';
  // Determine appropriate filter based on user groups
  console.log('User groups:', userGroups);
  const filterScript = document.querySelector('script[type="application/vnd.adobe.aue.filter+json"]');
  // Check if any group in the array has the name 'contributor'
  if (userGroups.some((group) => group.authorizableId === 'contributor')) {
    filterPath = '/content/aem-xwalk.resource/component-limited-filters.json';
  }
  await filterScript.setAttribute('src', filterPath);
}

// Initialize user data and filters at module level
await initializeUserAndFilters();

/**
 * Removes authoring instrumentation from specified components
 * @param {HTMLElement} element - The component element to lock
 */
function lockComponent(element) {
  if (!element) return;

  // Remove all data-aue-* attributes
  const aueAttributes = Array.from(element.attributes).filter((attr) => attr.name.startsWith('data-aue-'));

  aueAttributes.forEach((attr) => {
    element.removeAttribute(attr.name);
  });

  // Also remove from child elements
  element.querySelectorAll('[data-aue-resource]').forEach((child) => {
    lockComponent(child);
  });
}

// Initialize component locking and user-specific filtering
async function initializeEditorSupport() {
  // const userData = await getCurrentUser();

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

await initializeEditorSupport();

async function applyChanges(event) {
  // redecorate default content and blocks on patches (in the properties rail)
  const { detail } = event;

  const resource = detail?.request?.target?.resource
    || detail?.request?.target?.container?.resource
    || detail?.request?.to?.container?.resource;
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

    const block = element.parentElement?.closest('.block[data-aue-resource]')
      || element?.closest('.block[data-aue-resource]');
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
        `[data-aue-resource="${resource}"],[data-richtext-resource="${resource}"]`,
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
  ].forEach((eventType) => main?.addEventListener(eventType, async (event) => {
    event.stopPropagation();
    const applied = await applyChanges(event);
    if (!applied) window.location.reload();
  }));
}

attachEventListners(document.querySelector('main'));
