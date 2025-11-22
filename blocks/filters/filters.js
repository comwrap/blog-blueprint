import { moveInstrumentation } from '../../scripts/scripts.js';
import NiceSelect, {
  loadCSS as loadNiceSelectCSS,
} from '../../scripts/global/libs/nice-select/nice-select.js';
import NiceText, {
  loadCSS as loadNiceTextCSS,
} from '../../scripts/global/libs/nice-text/nice-text.js';
import NiceTag, {
  loadCSS as loadNiceTagCSS,
} from '../../scripts/global/libs/nice-tag/nice-tag.js';
import useBlockConfig from '../../scripts/global/useBlockConfig.js';
import {
  getCurrentLanguage,
  loadItemBlocks,
  isUE,
  mapPath,
  getTaxonomyMapById,
} from '../helpers.js';
import {
  ensureContainer,
  DEFAULT_LANGUAGE,
  SAMPLE,
  FILTER_SELECTORS,
  FILTER_KEYS,
  FILTER_CLASSES,
  createItemMatcher,
  normalizeForMatch,
  parseItemTags,
} from './partials/helpers.js';

/** @type {import("../../scripts/global/types.js").BlockConfig} */
const BLOCK_CONFIG = Object.freeze({
  FIELDS: {
    TOTAL_ITEMS_LABEL: {
      index: 0,
      removeRow: true,
    },
    FILTERS_FIRST_LABEL: {
      index: 1,
      removeRow: true,
    },
    FILTERS_NUMBER_OF_ITEMS: {
      index: 2,
      removeRow: true,
    },
    FILTERS_LOAD_MORE_LABEL: {
      index: 3,
      removeRow: true,
    },
    FILTERS_ITEM_LINK_LABEL: {
      index: 4,
      removeRow: true,
    },
  },
});

// Destructure constants for easier use
const { ITEM, EXCLUDE_ITEM, INNER_BLOCK } = FILTER_SELECTORS;
const {
  TYPES, TAGS, TAGS_DISPLAY, SELECTED_TAGS, ORDERED, CURRENT_PAGE_SIZE,
} = FILTER_KEYS;
const {
  FILTER, FILTER_BUTTONS, FILTER_DROPDOWNS, CONTENT_WRAPPER,
  TOTAL_ITEMS, LOAD_MORE_BUTTON, LOAD_MORE_CONTAINER, SEARCH,
  LOAD_MORE_COUNTER,
} = FILTER_CLASSES;

/**
 * Decorates the block.
 * @param {HTMLElement} block The block element
 */
export default async function decorate(block) {
  // Extract configuration fields
  const {
    TOTAL_ITEMS_LABEL,
    FILTERS_FIRST_LABEL,
    FILTERS_NUMBER_OF_ITEMS,
    FILTERS_LOAD_MORE_LABEL,
    FILTERS_ITEM_LINK_LABEL,
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

  // Helper function to get display name from taxonomy or fallback to derived name
  const getDisplayName = (tagId, fallbackName) => {
    const tag = taxonomyMap.get(tagId);
    return tag?.title || fallbackName;
  };

  // Create the item matcher function with necessary dependencies
  const itemMatchesAllFilters = createItemMatcher({ getDisplayName, block });

  const itemRows = [...block.children];

  itemRows.forEach((item) => {
    const wrapper = document.createElement('div');
    wrapper.classList.add(INNER_BLOCK);
    wrapper.setAttribute('data-block-name', ITEM);

    if (isUE()) {
      moveInstrumentation(item, wrapper);
    }

    while (item.firstChild) {
      wrapper.appendChild(item.firstChild);
    }
    block.appendChild(wrapper);

    item.remove();
  });

  const itemLinkLabel = FILTERS_ITEM_LINK_LABEL?.text || '';
  block.setAttribute('data-item-link-label', itemLinkLabel);

  await loadItemBlocks(block, ITEM);

  // Stable wrapper to hold items in original order - not to shuffle the items
  let wrapper = block.querySelector(`.${CONTENT_WRAPPER}`);
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.setAttribute(
      'data-number-of-items',
      FILTERS_NUMBER_OF_ITEMS?.text,
    );
    wrapper.setAttribute('data-first-label', FILTERS_FIRST_LABEL?.text);
    wrapper.className = CONTENT_WRAPPER;
    block.appendChild(wrapper);
  }

  // Move existing inner-block rows into wrapper in DOM order
  if (!block[ORDERED]) {
    const siblings = Array.from(block.children).filter(
      (el) => el !== wrapper && !el.classList.contains(FILTER),
    );
    siblings.forEach((sib) => {
      if (!wrapper.contains(sib)) wrapper.appendChild(sib);
    });
    block[ORDERED] = true;
  }

  // Collect available types and tags from rendered items
  block[TYPES] = new Set();
  block[TAGS] = new Map(); // normalized category -> Set(normalized subcategories)
  block[TAGS_DISPLAY] = new Map(); // normalized key -> display value

  const filterItems = wrapper.querySelectorAll(`.${INNER_BLOCK} .${ITEM}`);
  filterItems.forEach((filterItemEl) => {
    const typeText = normalizeForMatch(filterItemEl?.dataset.type || '');
    if (typeText) block[TYPES].add(typeText);

    const tagsContent = (filterItemEl?.dataset.tags || '').trim();
    if (!tagsContent) return;

    // Parse tags and build the map
    const { itemMap, displayNames } = parseItemTags(tagsContent, {
      normalizeFn: normalizeForMatch,
      getDisplayName,
    });

    // Store display names for UI and build the global tags map
    displayNames.forEach((displayName, normalizedKey) => {
      if (!block[TAGS_DISPLAY].has(normalizedKey)) {
        block[TAGS_DISPLAY].set(normalizedKey, displayName);
      }
    });

    // Add to global tags map
    itemMap.forEach((subcategories, normalizedCat) => {
      if (!block[TAGS].has(normalizedCat)) {
        block[TAGS].set(normalizedCat, new Set());
      }
      subcategories.forEach((sub) => block[TAGS].get(normalizedCat).add(sub));
    });
  });

  // Ensure filters container exists
  const filtersContainer = ensureContainer(block, FILTER, (el) => block.prepend(el));
  const buttonsContainer = ensureContainer(filtersContainer, FILTER_BUTTONS);
  const dropdownsContainer = ensureContainer(filtersContainer, FILTER_DROPDOWNS);

  // State for selected tag filters per category
  // Now supports multiple selections per category
  // Map<category, Set<subcategory>>
  if (!block[SELECTED_TAGS]) block[SELECTED_TAGS] = new Map();

  // Track pagination state
  const numberOfItems = parseInt(FILTERS_NUMBER_OF_ITEMS?.text, 10) || 0;
  if (!block[CURRENT_PAGE_SIZE] && numberOfItems > 0) {
    block[CURRENT_PAGE_SIZE] = numberOfItems;
  }

  // Count total items that match current filters
  function countMatchingItems() {
    const selected = block[SELECTED_TAGS];
    const search = (block.dataset.searchQuery || '').trim().toLowerCase();

    let totalMatchingItems = 0;
    [...wrapper.querySelectorAll(`.${INNER_BLOCK}`)].forEach((row) => {
      const filterItemEl = row.querySelector(`.${ITEM}`);
      if (itemMatchesAllFilters(filterItemEl, selected, search)) {
        totalMatchingItems += 1;
      }
    });

    return totalMatchingItems;
  }

  // Update load more button visibility based on current state
  function updateLoadMoreButton() {
    const loadMoreBtn = block.querySelector(`.${LOAD_MORE_BUTTON}`);
    if (!loadMoreBtn) return;

    const currentPageSize = block[CURRENT_PAGE_SIZE] || 0;
    if (currentPageSize === 0) {
      loadMoreBtn.hidden = true;
      return;
    }

    const totalMatchingItems = countMatchingItems();
    loadMoreBtn.hidden = totalMatchingItems <= currentPageSize;
  }

  // Update the counter display showing current visible / total matching items
  function updateLoadMoreCounter() {
    const counterElement = block.querySelector(`.${LOAD_MORE_COUNTER}`);
    if (!counterElement) return;

    const currentPageSize = block[CURRENT_PAGE_SIZE] || 0;
    if (currentPageSize === 0) return;

    const totalMatchingItems = countMatchingItems();
    const visibleCount = Math.min(currentPageSize, totalMatchingItems);
    counterElement.textContent = `${visibleCount}/${totalMatchingItems}`;
  }

  // Update total count display
  function updateTotalCount() {
    const totalItemsElement = block.querySelector(`.${TOTAL_ITEMS}`);
    if (!totalItemsElement) return;

    const totalMatchingItems = countMatchingItems();
    totalItemsElement.textContent = `${TOTAL_ITEMS_LABEL?.text || ''} ${totalMatchingItems}`;
  }

  // Filtering: tags (OR within category, AND between categories) + type + search + pagination
  function applyMultiTagFilter() {
    const selected = block[SELECTED_TAGS];
    const search = (block.dataset.searchQuery || '').trim().toLowerCase();
    const currentPageSize = block[CURRENT_PAGE_SIZE] || 0;

    let visibleCount = 0;
    const allRows = [...wrapper.querySelectorAll(`.${INNER_BLOCK}`)];

    allRows.forEach((row) => {
      const filterItemEl = row.querySelector(`.${ITEM}`);
      const matchesFilters = itemMatchesAllFilters(filterItemEl, selected, search);

      // Apply pagination limit only if set and item matches filters
      let shouldShow = matchesFilters;
      if (matchesFilters && currentPageSize > 0) {
        visibleCount += 1;
        shouldShow = visibleCount <= currentPageSize;
      }

      row.hidden = !shouldShow;
    });

    // Update load more button visibility, counter, and total count
    updateLoadMoreButton();
    updateLoadMoreCounter();
    updateTotalCount();
  }

  const applyFilter = (selectedType) => {
    block.dataset.activeFilter = normalizeForMatch(selectedType || '');
    // Update NiceTag visual states
    if (block.niceTypeTagInstances) {
      block.niceTypeTagInstances.forEach(({ niceTag, type }) => {
        niceTag.setSelected(normalizeForMatch(type) === normalizeForMatch(selectedType));
      });
    }
    applyMultiTagFilter();
  };

  const updateSelectedTag = (category, subcategories) => {
    const map = block[SELECTED_TAGS];
    const cat = normalizeForMatch(category);
    if (!cat) return;

    if (!subcategories || subcategories.length === 0) {
      // No subcategories selected, remove this category
      map.delete(cat);
    } else {
      // Store as Set for efficient lookup
      const subSet = new Set(subcategories.map((sub) => normalizeForMatch(sub)));
      map.set(cat, subSet);
    }

    try {
      // Convert Sets to Arrays for JSON serialization
      const entriesArray = Array.from(map.entries()).map(
        ([c, subSet]) => [
          c,
          Array.from(subSet),
        ],
      );
      block.dataset.activeTagFilters = JSON.stringify(entriesArray);
    } catch (e) {
      // ignore
    }
  };

  /**
   * Creates a type filter tag
   * @param {string} type - The type value (empty string for "All")
   * @param {string} label - The label to display
   * @param {boolean} selected - Whether the tag is initially selected
   * @returns {object} Object with niceTag instance and type value
   */
  const createTypeFilterTag = (type, label, selected) => {
    const niceTag = new NiceTag({
      name: 'type-filter',
      label,
      value: type,
      selected,
      className: 'type-filter',
    });

    niceTag.addEventListener('nice-input', (e) => {
      const { selected: isSelected } = e.detail;
      const current = block.dataset.activeFilter || '';
      if (isSelected) {
        applyFilter(type);
      } else if (current === type) {
        // If deselecting the current filter, go back to "all"
        applyFilter('');
      }
    });

    buttonsContainer.appendChild(niceTag.element);
    return { niceTag, type };
  };

  // Build type filter tags
  await loadNiceTagCSS();
  buttonsContainer.textContent = '';
  if (!block.niceTypeTagInstances) block.niceTypeTagInstances = [];
  block.niceTypeTagInstances.length = 0;

  if (block[TYPES].size > 0) {
    // Create "ALL FILTER ITEMS" tag
    block.niceTypeTagInstances.push(
      createTypeFilterTag('', FILTERS_FIRST_LABEL?.text || 'All', true),
    );

    // Create a tag for each type
    block[TYPES].forEach((t) => {
      block.niceTypeTagInstances.push(createTypeFilterTag(t, t, false));
    });
  }

  // Build tag dropdowns
  await loadNiceSelectCSS();
  const existingDropdowns = dropdownsContainer.querySelectorAll('.tag-dropdown');
  existingDropdowns.forEach((d) => d.remove());
  if (!block.niceSelectInstances) block.niceSelectInstances = [];
  block.niceSelectInstances.length = 0;

  block[TAGS].forEach((subcategories, normalizedCategory) => {
    const displayCategory = block[TAGS_DISPLAY].get(normalizedCategory) || normalizedCategory;
    const niceSelect = new NiceSelect({
      name: `tag-filter-${normalizedCategory}`,
      label: displayCategory,
      placeholder: displayCategory,
      className: 'tag-dropdown',
      labelClassName: 'sr-only',
      multiple: true, // Enable multiple selection
      options: Array.from(subcategories).map((normalizedSubcategory) => {
        const displaySubcategory = block[TAGS_DISPLAY].get(normalizedSubcategory)
          || normalizedSubcategory;
        return {
          text: displaySubcategory,
          value: normalizedSubcategory,
          selected: false,
        };
      }),
    });

    niceSelect.addEventListener('nice-input', (e) => {
      const selectedValues = e.detail.value;
      // e.detail.value should be an array when multiple is enabled
      let values = [];
      if (Array.isArray(selectedValues)) {
        values = selectedValues;
      } else if (selectedValues) {
        values = [selectedValues];
      }
      updateSelectedTag(normalizedCategory, values);
      applyMultiTagFilter();
    });

    dropdownsContainer.appendChild(niceSelect.element);
    block.niceSelectInstances.push({ niceSelect, category: normalizedCategory });
  });

  // Build search input
  await loadNiceTextCSS();
  const searchContainer = ensureContainer(dropdownsContainer, SEARCH);
  searchContainer.textContent = '';
  const searchField = new NiceText({
    name: SEARCH,
    type: 'search',
    label: 'Search by title',
    placeholder: 'Search by title',
    cancelText: 'Cancel',
    className: `${SEARCH}-input`,
    labelClassName: 'sr-only',
  });
  searchField.addEventListener('nice-input', (e) => {
    const value = (e?.detail?.value || '').toString().toLowerCase().trim();
    block.dataset.searchQuery = value;
    applyMultiTagFilter();
  });
  searchContainer.appendChild(searchField.element);

  // Initialize filter state
  if (!block.dataset.activeFilter) {
    applyFilter('');
  } else {
    applyFilter(block.dataset.activeFilter);
  }
  if (block.dataset.activeTagFilters) {
    try {
      const entries = JSON.parse(block.dataset.activeTagFilters);
      if (Array.isArray(entries)) {
        // Convert arrays back to Sets
        block[SELECTED_TAGS] = new Map(
          entries.map(([cat, subArray]) => [cat, new Set(subArray)]),
        );
      }
    } catch (e) {
      // ignore
    }
  }

  // Add total of the items at the top of the component
  const totalItems = block.querySelectorAll(`.${ITEM}${EXCLUDE_ITEM}`).length;
  const totalItemsElement = document.createElement('div');
  totalItemsElement.className = TOTAL_ITEMS;
  totalItemsElement.textContent = `${TOTAL_ITEMS_LABEL?.text || ''} ${totalItems}`;
  block.prepend(totalItemsElement);

  // Apply initial filters and update counts
  applyMultiTagFilter();

  // Add Load More button if pagination is enabled
  if (numberOfItems > 0 && totalItems > numberOfItems) {
    const loadMoreContainer = document.createElement('div');
    loadMoreContainer.className = LOAD_MORE_CONTAINER;

    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = `button secondary ${LOAD_MORE_BUTTON}`;
    loadMoreBtn.textContent = FILTERS_LOAD_MORE_LABEL?.text || 'Load More';
    loadMoreBtn.type = 'button';

    loadMoreBtn.addEventListener('click', () => {
      // Increase page size by the original increment
      block[CURRENT_PAGE_SIZE] = (block[CURRENT_PAGE_SIZE] || 0) + numberOfItems;
      applyMultiTagFilter();
    });

    // Add counter display showing current visible / total matching items
    const counterElement = document.createElement('div');
    counterElement.className = LOAD_MORE_COUNTER;
    loadMoreContainer.appendChild(counterElement);

    loadMoreContainer.appendChild(loadMoreBtn);

    block.appendChild(loadMoreContainer);

    // Initial button state update
    updateLoadMoreButton();
    updateLoadMoreCounter();
  }
}
