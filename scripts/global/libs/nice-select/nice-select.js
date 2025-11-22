/**
 * CSS loading function for {@link NiceSelect}.
 */
export const loadCSS = async () => import(`${window.hlx.codeBasePath}/scripts/aem.js`)
  .then((mod) => mod.loadCSS(`${window.hlx.codeBasePath}/scripts/global/libs/nice-select/nice-select.css`));

/** @type {import("./types").NiceSelectConfig} */
const DEFAULT_CONFIG = {
  data: null,
  searchable: false,
  showSelectedItems: false,
  multiple: false,
  disabled: false,
  placeholder: 'Select an option',
  searchText: 'Search',
  selectedText: 'selected',
  cancelText: 'Cancel',
};

export const NICE_SELECT_CLASS = 'nice-select';

/**
 * A reusable UI component for rendering a custom-styled, accessible select dropdown
 * with support for single/multiple selection, search, and enhanced keyboard navigation.
 * The component wraps a native `<select>` element and provides a rich dropdown interface
 * while maintaining accessibility and native form integration.
 *
 * ### Features
 * - Generates unique IDs for root, label, select, and list elements.
 * - Renders a `<label>` linked to the native select for accessibility.
 * - Supports both single and multiple selection modes.
 * - Optional search functionality to filter options.
 * - Displays selected items with customizable text format.
 * - Provides a cancel button ✕ that clears all selections.
 * - Dispatches a custom bubbling `nice-input` event with `{ name, label, value, validity }`
 *   whenever the selection changes.
 * - Full keyboard navigation support (Arrow keys, Enter, Escape, Space).
 * - Supports configuration via a `NiceSelectConfig` object (options, searchable, multiple, etc.).
 * - Exposes methods to programmatically set/reset values, open/close dropdown, enable/disable.
 * - Keeps ARIA attributes (`aria-expanded`, `aria-required`, `aria-disabled`, `aria-readonly`)
 *   in sync with state.
 * - Maintains native select element for form submission and validation.
 *
 * ### Usage
 * ```js
 * import NiceSelect from './NiceSelect.js';
 *
 * const dropdown = new NiceSelect({
 *   name: 'country',
 *   label: 'Select Country',
 *   placeholder: 'Choose a country',
 *   searchable: true,
 *   options: [
 *     { text: 'United States', value: 'us', selected: false },
 *     { text: 'Canada', value: 'ca', selected: true },
 *     { text: 'Mexico', value: 'mx', selected: false },
 *   ],
 * });
 *
 * document.body.appendChild(dropdown.element);
 *
 * dropdown.addEventListener('nice-input', (e) => {
 *   console.log(e.detail.value); // current selected value(s)
 * });
 * ```
 *
 * ### Public API
 * - `element: HTMLElement` → root element to insert into the DOM.
 * - `value: string | string[]` → get/set the selected value(s).
 * - `name: string` → the name attribute of the select.
 * - `label: string` → the label text.
 * - `validity: ValidityState` → native validity object from the select.
 * - `disabled: boolean` → get/set disabled state.
 * - `required: boolean` → get/set required state.
 * - `readonly: boolean` → get/set readonly state.
 * - `isOpen(): boolean` → check if dropdown is currently open.
 * - `open()` → opens the dropdown (respects disabled/readonly state).
 * - `close()` → closes the dropdown.
 * - `update()` → synchronizes the UI with the native select state.
 * - `setValue(value: string | string[])` → sets value without dispatching.
 * - `updateSelectValue()` → updates native select from selected options and dispatches.
 * - `resetSelectValue()` → clears all selections.
 * - `reset()` → clears selections, updates UI, and dispatches events.
 * - `enable()` / `disable()` → toggle disabled state.
 * - `setDisabled(disabled: boolean)` → sets disabled state.
 * - `setRequired(required: boolean)` → sets required state.
 * - `setReadOnly(readonly: boolean)` → sets readonly state.
 * - `focus()` → focuses the dropdown element.
 * - `blur()` → blurs the dropdown element.
 * - `destroy()` → removes the component from the DOM.
 * - `addEventListener(type, listener, options)` → attach listeners to the root.
 *
 * @class NiceSelect
 * @classdesc A self‑contained accessible select dropdown widget with label, optional search,
 * single/multiple selection modes, and enhanced keyboard navigation, dispatching custom events
 * for easier integration.
 */
export default class NiceSelect {
  static #id = 0;

  static get id() {
    const id = NiceSelect.#id;
    this.#id += 1;
    return id;
  }

  /** @type {string} The root element ID */
  #rootId;

  /** @type {string} The nice select element ID */
  #elementId;

  /** @type {string} The native select element ID */
  #selectId;

  /** @type {string} The label element ID */
  #labelId;

  /** @type {string} The dropdown list element ID */
  #listId;

  /** @type {HTMLElement} The root element */
  #root;

  /** @type {HTMLLabelElement} The label element */
  #label;

  /** @type {HTMLSelectElement} The native select element */
  #select;

  /** @type {import("./types").NiceSelectConfig} The configuration object */
  #config;

  /** @type {import("./types").NiceSelectOption[]} The select options data array */
  #options;

  /** @type {import("./types").NiceSelectOption[]} The selected options array */
  #selectedOptions;

  /** @type {string} The select placeholder */
  #placeholder;

  /** @type {string} The search input text */
  #searchText;

  /** @type {string} The selected text */
  #selectedText;

  /** @type {string} The cancel text */
  #cancelText;

  /** @type {HTMLElement} The nice select element */
  #element;

  /** @type {HTMLInputElement} The current value input */
  #currentInput;

  /** @type {?HTMLInputElement} The search input */
  #searchInput;

  /** @type {HTMLElement} The options list element */
  #list;

  /** @type {HTMLButtonElement} The cancel button */
  #cancel;

  /** @type {boolean} The multiple flag */
  #multiple;

  /** @type {boolean} The disabled flag */
  #disabled;

  /**
   * @param {import("./types").NiceSelectConfig} [options] The nice select config options
   */
  constructor(options = {}) {
    this.#config = { ...DEFAULT_CONFIG, ...options };
    this.#options = this.#config.options ?? [];
    this.#selectedOptions = this.#options.filter((o) => o.selected);
    this.#placeholder = this.#config.placeholder;
    this.#searchText = this.#config.searchText;
    this.#selectedText = this.#config.selectedText;
    this.#cancelText = this.#config.cancelText;
    this.#element = null;
    this.#cancel = null;
    this.#multiple = Boolean(this.#config.multiple);
    this.#disabled = Boolean(this.#config.disabled);
    this.#create();
  }

  /** @private */
  #create() {
    // Set up IDs
    const { id } = NiceSelect;
    this.#rootId = `nice-select-${id}`;
    this.#elementId = `${this.#rootId}-element`;
    this.#labelId = `${this.#rootId}-label`;
    this.#selectId = `${this.#rootId}-select`;
    this.#listId = `${this.#rootId}-list`;

    // Set up input names
    const selectName = this.#config.name;
    const inputName = `${selectName}-text`;
    const searchInputName = `${selectName}-search`;

    // Create structure
    this.#root = document.createRange().createContextualFragment(`
      <div
        id="${this.#rootId}"
        class="${NICE_SELECT_CLASS} ${this.#config.className ?? ''}"
      >
        <label
          id="${this.#labelId}"
          for="${this.#selectId}"
          class="${this.#config.labelClassName ?? ''}"
        >${this.#config.label}</label>
        <select
          id="${this.#selectId}"
          name="${selectName}"
          autocomplete="off"
          tabindex="-1"
          aria-hidden="true"
        >
          ${this.#options.map((o) => `
            <option
              name="${o.value}"
              value="${o.value}"
              ${o.selected ? 'selected' : ''}
              ${o.disabled ? 'disabled' : ''}
              ${o.extra ? `data-extra="${o.extra}"` : ''}
            >${o.text}</option>
          `)}
        </select>
        <div
          id="${this.#elementId}"
          class="nice-select-element ${this.#disabled ? 'disabled' : ''} ${this.#multiple ? 'has-multiple' : ''}"
          role="combobox"
          aria-expanded="false"
          aria-owns="${this.#listId}"
          aria-labelledby="${this.#labelId}"
          tabindex="${this.#disabled ? null : 0}"
        >
          <input
            class="${this.#multiple ? 'multiple-options' : 'current'}"
            name="${inputName}"
            form="nonexisting"
            type="text"
            autocomplete="off"
            aria-labelledby="${this.#labelId}"
            aria-controls="${this.#listId}"
            tabindex="-1"
            aria-hidden="true"
            value="${this.#placeholder}"
            ${this.#disabled ? 'disabled' : ''}
            readonly
            inert>
          <button
            class="cancel"
            type="button"
            aria-label="${this.#cancelText}"
            ${this.#config.form ? `form="${this.#config.form}"` : ''}
          >✕</button>
          <div class="nice-select-dropdown">
            ${this.#config.searchable ? `
              <div class="nice-select-search-box">
                <input
                  class="nice-select-search"
                  name="${searchInputName}"
                  form="nonexisting"
                  type="text"
                  autocomplete="off"
                  placeholder="${this.#searchText}"
                  aria-label="${this.#searchText}"
                >
              </div>
            ` : ''}
            <ul
              id="${this.#listId}"
              class="list"
              role="listbox"
              title="${this.#placeholder}"
              tabindex="-1"
            ></ul>
          </div>
        </div>
      </div>
    `).firstElementChild;
    this.#label = this.#root.querySelector(':scope label');
    this.#select = this.#root.querySelector(':scope select');
    if (this.#selectedOptions.length === 0) this.#select.selectedIndex = -1;
    this.#element = this.#root.querySelector(':scope .nice-select-element');
    this.#currentInput = this.#element.querySelector(':scope input');
    this.#searchInput = this.#element.querySelector(':scope input.nice-select-search');
    this.#list = this.#element.querySelector(':scope .list');
    this.#cancel = this.#element.querySelector(':scope button.cancel');
    this.#renderDropdownOptions();
    this.#updateSelectedInput();

    // Initial state
    this.setRequired(this.#config.required);
    this.setDisabled(this.#config.disabled);
    this.setReadOnly(this.#config.readonly);

    this.#addEventListeners();

    // Set NiceSelect instance reference on the root element
    // eslint-disable-next-line no-underscore-dangle
    this.#root._niceselect = this;
  }

  /** @private */
  #updateSelectedInput() {
    if (this.#multiple) {
      let value = '';
      if (this.#config.showSelectedItems || this.#selectedOptions.length < 2) {
        this.#selectedOptions.forEach((o, index, array) => {
          value += `${o.text}${index + 1 < array.length ? ', ' : ''}`;
        });
        value = value === '' ? this.#placeholder : value;
      } else {
        value = `${this.#selectedOptions.length} ${this.#selectedText}`;
      }
      this.#currentInput.value = value;
    } else {
      const value = this.#selectedOptions.length > 0
        ? this.#selectedOptions[0].text
        : this.#placeholder;
      this.#currentInput.value = value;
    }
  }

  /** @private */
  #renderDropdownOptions() {
    this.#list.textContent = '';
    this.#options.forEach((o) => {
      o.element = this.#createDropdownOption(o);
      this.#list.appendChild(o.element);
    });
  }

  /**
   * @private
   * @param {import("./types").NiceSelectOption} option
   */
  #createDropdownOption(option) {
    const el = document.createElement('li');
    el.role = 'option';
    el.innerHTML = option.text;
    if (option.extra) {
      const span = document.createElement('span');
      span.className = 'extra';
      span.innerText = option.extra;
      el.appendChild(span);
    }
    el.setAttribute('data-value', option.value);
    const classList = [
      'option',
      option.selected ? 'selected' : null,
      option.disabled ? 'disabled' : null,
    ].filter(Boolean);
    el.addEventListener('click', this.#onItemClicked.bind(this, option));
    el.classList.add(...classList);
    return el;
  }

  isOpen() {
    return this.#element.classList.contains('open');
  }

  open() {
    if (this.readonly || this.disabled) return;
    this.#element.classList.add('open');
    this.#element.setAttribute('aria-expanded', 'true');
    this.#list.removeAttribute('tabindex');
    this.#select.dispatchEvent(new UIEvent('modalopen', { bubbles: true, cancelable: false }));
  }

  close() {
    this.#element.classList.remove('open');
    this.#element.setAttribute('aria-expanded', 'false');
    this.#list.setAttribute('tabindex', '-1');
    Array.from(this.#list.querySelectorAll(':scope .option[tabindex="0"]'))
      .forEach((item) => {
        item.classList.remove('focus');
        item.setAttribute('tabindex', '-1');
      });
    this.#select.dispatchEvent(new UIEvent('modalclose', { bubbles: true, cancelable: false }));
  }

  update() {
    this.#selectedOptions = [];

    // Parse current options state from the native select
    Array.from(this.#select.options).forEach((option) => {
      const value = option.getAttribute('value');
      const selected = option.hasAttribute('selected');
      const disabled = option.hasAttribute('disabled');

      // Update option
      const opt = this.#options.find((o) => o.value === value);
      if (opt) {
        // Update data
        opt.selected = selected;
        opt.disabled = disabled;

        // Update selected state
        if (selected) {
          this.#selectedOptions.push(opt);
          opt.element?.classList.add('selected');
        } else {
          opt.element?.classList.remove('selected');
        }

        // Update disabled state
        if (disabled) {
          opt.element?.classList.add('disabled');
        } else {
          opt.element?.classList.remove('disabled');
        }
      }
    });
    this.#updateSelectedInput();
    if (this.isOpen()) this.#element?.click();
    if (this.#config.disabled) this.disable();
    else this.enable();
  }

  disable() {
    this.disabled = true;
  }

  enable() {
    this.disabled = false;
  }

  /** @param {boolean} disabled */
  setDisabled(disabled) {
    this.#disabled = Boolean(disabled);
    this.#select.disabled = this.#disabled;
    this.#select.setAttribute('aria-disabled', String(this.#disabled));
    this.#currentInput.disabled = this.#disabled;
    this.#currentInput.setAttribute('aria-disabled', String(this.#disabled));
    if (this.#searchInput) {
      this.#searchInput.disabled = this.#disabled;
      this.#searchInput.setAttribute('aria-disabled', String(this.#disabled));
    }
    if (this.#disabled) this.#element.classList.add('disabled');
    else this.#element.classList.remove('disabled');
  }

  /** @param {boolean} disabled */
  set disabled(disabled) {
    this.setDisabled(disabled);
  }

  get disabled() {
    return this.#disabled;
  }

  focus() {
    this.#element?.focus();
  }

  blur() {
    this.#element?.blur();
  }

  reset() {
    this.resetSelectValue();
    this.#updateSelectedInput();
    this.update();
    this.#triggerInput();
  }

  destroy() {
    this.#root?.remove();
  }

  /** @private */
  #addEventListeners() {
    this.#element.addEventListener('click', this.#onClicked.bind(this));
    this.#element.addEventListener('keydown', this.#onKeyPressed.bind(this));
    this.#element.addEventListener('focusin', () => this.#select.dispatchEvent(new FocusEvent('focusin', { bubbles: true, cancelable: false })));
    this.#element.addEventListener('focusout', () => this.#select.dispatchEvent(new FocusEvent('focusout', { bubbles: true, cancelable: false })));

    this.#cancel.addEventListener('click', (e) => {
      e.preventDefault();
      this.reset();
      if (!this.isOpen()) {
        e.stopPropagation();
      }
    }, { capture: true });

    window.addEventListener('click', this.#onClickedOutside.bind(this));

    this.#searchInput?.addEventListener('click', (e) => {
      e.stopPropagation();
      return false;
    });
    this.#searchInput?.addEventListener('input', this.#onSearchInput.bind(this));
  }

  /**
   * @private
   * @param {Event} e
   */
  #onClicked(e) {
    e.preventDefault();
    if (e.target.matches('.option.disabled')) {
      this.#element.focus();
      return;
    }
    if (!this.isOpen() && e.target !== this.#cancel) {
      this.open();
    } else if (this.#multiple) {
      if (e.target === this.#currentInput) {
        this.close();
      }
    } else {
      this.close();
    }
    if (this.isOpen()) {
      const search = this.#element.querySelector(':scope .nice-select-search');
      if (search) {
        search.value = '';
        search.focus();
      }
      const focusedOption = this.#getFocusedOption();
      focusedOption?.classList.add('focus');
      this.#list.querySelectorAll(':scope li').forEach((item) => item.setAttribute('aria-hidden', 'false'));
    } else {
      this.#element.focus();
    }
  }

  /**
   * @private
   * @param {import('./types').NiceSelectOption} option
   * @param {Event} e
   */
  #onItemClicked(option, e) {
    const optionEl = e.target;
    if (!optionEl.classList.contains('disabled')) {
      if (this.#multiple) {
        if (optionEl.classList.contains('selected')) {
          optionEl.classList.remove('selected');
          this.#selectedOptions = this.#selectedOptions.filter((o) => o.value !== option.value);
          const opt = this.#select.querySelector(`:scope option[value="${optionEl.dataset.value}"]`);
          if (opt) {
            opt.removeAttribute('selected');
            opt.selected = false;
          }
        } else {
          optionEl.classList.add('selected');
          this.#selectedOptions.push(option);
        }
      } else {
        this.#options.forEach((o) => o.element?.classList.remove('selected'));
        optionEl.classList.add('selected');
        this.#selectedOptions = [option];
      }
      this.#updateSelectedInput();
      this.updateSelectValue();
    }
  }

  /**
   * Sets the provided value.
   *
   * NOTE: Does not dispatch an input event automatically; call programmatically if you need to
   * notify listeners.
   * @param {string | string[]} value
   */
  setValue(value) {
    let noSelected = true;
    let currentValue;
    const values = Array.isArray(value) ? value.map(String) : [String(value)];
    for (let i = 0; i < this.#select.options.length; i += 1) {
      const opt = this.#select.options[i];
      currentValue = values.includes(opt.value) && !opt.disabled ? opt.value : null;
      if (opt.value === currentValue) {
        if (noSelected) {
          this.#select.value = currentValue;
          noSelected = false;
        }
        opt.setAttribute('selected', true);
        opt.selected = true;
      } else {
        opt.removeAttribute('selected');
        delete opt.selected;
      }
    }
    if (noSelected && !this.#select.multiple) {
      this.#select.options[0].setAttribute('selected', true);
      this.#select.options[0].selected = true;
      this.#select.value = this.#select.options[0].value;
    }
    this.update();
  }

  /** @param {string | string[]} value */
  set value(value) {
    this.setValue(value);
  }

  get value() {
    if (!this.#select.multiple) return this.#select.value;
    return Array.from(this.#select.options).filter((opt) => opt.selected).map((opt) => opt.value);
  }

  updateSelectValue() {
    if (this.#multiple) {
      this.#selectedOptions.forEach((o) => {
        const el = this.#select.querySelector(`:scope option[value="${o.value}"]`);
        if (el) el.setAttribute('selected', true);
      });
    } else if (this.#selectedOptions.length > 0) {
      this.#select.value = this.#selectedOptions[0].value;
    }
    this.#triggerInput();
  }

  resetSelectValue() {
    this.#selectedOptions.forEach((o) => {
      o.element?.classList.remove('selected');
      const option = this.#select.querySelector(`:scope option[value="${o.value}"]`);
      if (option) {
        option.removeAttribute('selected');
        delete option.selected;
      }
    });
    this.#selectedOptions = [];
    this.#select.selectedIndex = -1;
  }

  /**
   * @private
   * @param {MouseEvent} e
   */
  #onClickedOutside(e) {
    if (!this.#element.contains(e.target)) {
      this.close();
    }
  }

  /**
   * @private
   * @param {KeyboardEvent} e
   */
  #onKeyPressed(e) {
    const focusedOption = this.#getFocusedOption();
    switch (e.key) {
      case 'Enter': {
        if (this.isOpen()) {
          focusedOption?.click();
        } else {
          this.#element?.click();
        }
        break;
      }
      case 'ArrowDown': {
        if (!this.isOpen()) {
          this.#element?.click();
        } else {
          const next = this.#findNext(focusedOption);
          if (next) {
            focusedOption?.setAttribute('tabindex', '-1');
            focusedOption?.classList.remove('focus');
            next.setAttribute('tabindex', '0');
            next.classList.add('focus');
            next.focus();
          }
        }
        e.preventDefault();
        break;
      }
      case 'ArrowUp': {
        if (!this.isOpen()) {
          this.#element?.click();
        } else {
          const prev = this.#findPrev(focusedOption);
          if (prev) {
            focusedOption?.setAttribute('tabindex', '-1');
            focusedOption?.classList.remove('focus');
            prev.setAttribute('tabindex', '0');
            prev.classList.add('focus');
            prev.focus();
          }
        }
        e.preventDefault();
        break;
      }
      case 'Escape': {
        if (this.isOpen()) this.#currentInput?.click();
        break;
      }
      case 'Space': {
        if (this.isOpen()) return false;
        break;
      }
      default:
        break;
    }
    return false;
  }

  /** @private */
  #getFocusedOption() {
    return this.#list.contains(document.activeElement) && document.activeElement.classList.contains('option')
      ? document.activeElement
      : this.#list.querySelector(':scope .focus');
  }

  /**
   * @private
   * @param {HTMLElement} el
   * @returns {HTMLElement | null}
   */
  #findNext(el) {
    let target = el;
    target = target ? target.nextElementSibling : this.#list.querySelector(':scope .option');
    while (target) {
      if (!target.classList.contains('disabled') && target.getAttribute('aria-hidden') !== 'true') return target;
      target = target.nextElementSibling;
    }
    return null;
  }

  /**
   * @private
   * @param {HTMLElement} el
   * @returns {HTMLElement | null}
   */
  #findPrev(el) {
    let target = el;
    target = target ? target.previousElementSibling : this.#list.querySelector(':scope .option:last-child');
    while (target) {
      if (!target.classList.contains('disabled') && target.getAttribute('aria-hidden') !== 'true') return target;
      target = target.previousElementSibling;
    }
    return null;
  }

  /**
   * @private
   * @param {InputEvent} e
   */
  #onSearchInput(e) {
    const text = e.target.value.toLowerCase();
    if (text === '') {
      this.#options.forEach((o) => o.element?.setAttribute('aria-hidden', 'false'));
    } else if (this.isOpen()) {
      const matchReg = new RegExp(text);
      this.#options.forEach((o) => {
        const optionText = o.text.toLowerCase();
        o.element?.setAttribute('aria-hidden', String(matchReg.test(optionText)));
      });
    }
    this.#list.querySelectorAll(':scope .focus').forEach((item) => item.classList.remove('focus'));
  }

  /**
   * Dispatches a bubbling `CustomEvent('nice-input')` from the root with detail
   * `{ name, label, value, validity }`.
   * @private
   */
  #dispatchNiceInput() {
    const detail = {
      name: this.name,
      label: this.label,
      value: this.value,
      validity: this.validity,
    };
    const forwarded = new CustomEvent('nice-input', {
      bubbles: true,
      cancelable: false,
      detail,
    });
    this.#root.dispatchEvent(forwarded);
  }

  /** @private */
  #triggerInput() {
    this.#select.dispatchEvent(new Event('input', { bubbles: true, cancelable: false }));
    this.#dispatchNiceInput();
  }

  /**
   * Wraps adding an event listener to the root element.
   * @param {K extends keyof HTMLElementEventMap} type
   * @param {EventListenerOrEventListenerObject} listener
   * @param {boolean | AddEventListenerOptions} options
   */
  addEventListener(type, listener, options) {
    this.#root.addEventListener(type, listener, options);
  }

  get element() {
    return this.#root;
  }

  get name() {
    return this.#config.name;
  }

  get label() {
    return this.#config.label;
  }

  get validity() {
    return this.#select.validity;
  }

  /** @param {boolean} required */
  setRequired(required) {
    this.#select.required = Boolean(required);
    this.#select.setAttribute('aria-required', String(this.#select.required));
  }

  /** @param {boolean} required */
  set required(required) {
    this.setRequired(required);
  }

  get required() {
    return this.#select.required;
  }

  /** @param {boolean} readonly */
  setReadOnly(readonly) {
    this.#select.readOnly = Boolean(readonly);
    this.#select.setAttribute('aria-readonly', String(this.#select.readOnly));
  }

  /** @param {boolean} readonly */
  set readonly(readonly) {
    this.setReadOnly(readonly);
  }

  get readonly() {
    return this.#select.readonly;
  }
}
