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
  const filterScript = document.querySelector('script[type="application/vnd.adobe.aue.filter+json"]');
  if (!filterScript) return;

  try {
    const userResponse = await fetch('/libs/granite/security/currentuser.json?props=memberOf');
    if (!userResponse.ok) throw new Error('Failed to fetch user data');
    const userData = await userResponse.json();
    const userGroups = userData?.memberOf || [];
    
    console.log('User groups:', userGroups);
    
    const filterPath = userGroups.some((group) => group.authorizableId === 'contributor')
      ? '/content/aem-xwalk.resource/component-limited-filters.json'
      : '/content/aem-xwalk.resource/component-filters.json';

    // Set the filter and wait for it to be applied
    filterScript.setAttribute('src', filterPath);
    
    // Wait for the filter to be loaded and applied
    await new Promise((resolve) => {
      const checkFilter = () => {
        if (window.granite?.author?.editor?.page?.component?.filter) {
          resolve();
        } else {
          setTimeout(checkFilter, 100);
        }
      };
      checkFilter();
    });

    // Verify the filter is applied
    if (window.granite?.author?.editor?.page?.component?.filter) {
      console.log('Filter successfully applied');
    }
  } catch (error) {
    console.error('Error initializing filters:', error);
    // Set default filter on error
    filterScript.setAttribute('src', '/content/aem-xwalk.resource/component-filters.json');
  }
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
