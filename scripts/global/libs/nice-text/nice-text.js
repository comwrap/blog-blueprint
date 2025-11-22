/**
 * CSS loading function for {@link NiceText}.
 */
export const loadCSS = async () => import(`${window.hlx.codeBasePath}/scripts/aem.js`)
  .then((mod) => mod.loadCSS(`${window.hlx.codeBasePath}/scripts/global/libs/nice-text/nice-text.css`));

/** @type {import("./types").NiceTextConfig} */
const DEFAULT_CONFIG = {
  name: '',
  type: 'text',
  label: '',
  value: '',
  pattern: '',
  placeholder: '',
  cancelText: 'Cancel',
  required: false,
  disabled: false,
  readonly: false,
  form: '',
  className: '',
  labelClassName: '',
};

export const NICE_TEXT_CLASS = 'nice-text';

/**
 * A reusable UI component for rendering a labeled text input with optional search icon
 * and a built‑in cancel (clear) button. The component manages accessibility attributes,
 * event dispatching, and state (disabled, required, readonly).
 *
 * ### Features
 * - Generates unique IDs for root, label, and input elements.
 * - Renders a `<label>` linked to the input for accessibility.
 * - Optionally displays a search icon when `type === "search"`.
 * - Provides a cancel button ✕ that clears the input and re‑focuses it.
 * - Dispatches a custom bubbling `nice-input` event with `{ name, label, value, validity }`
 *   whenever the input value changes.
 * - Supports configuration via a `NiceTextConfig` object (label, name, type, placeholder, etc.).
 * - Exposes methods to programmatically set/reset value, enable/disable, and toggle
 *   required/readonly.
 * - Keeps ARIA attributes (`aria-required`, `aria-disabled`, `aria-readonly`) in sync with state.
 *
 * ### Usage
 * ```js
 * import NiceText from './NiceText.js';
 *
 * const field = new NiceText({
 *   name: 'name',
 *   label: 'Label',
 *   type: 'text',
 *   placeholder: 'Enter text',
 *   required: true,
 * });
 *
 * document.body.appendChild(field.element);
 *
 * field.addEventListener('nice-input', (e) => {
 *   console.log(e.detail.value); // current input value
 * });
 * ```
 *
 * ### Public API
 * - `element: HTMLElement` → root element to insert into the DOM.
 * - `value: string` → get/set the input value.
 * - `disabled: boolean` → get/set disabled state.
 * - `required: boolean` → get/set required state.
 * - `readonly: boolean` → get/set readonly state.
 * - `validity: ValidityState` → native validity object.
 * - `reset()` → clears the input and dispatches events.
 * - `setValue(value: string)` → sets value without dispatching.
 * - `enable()` / `disable()` → toggle disabled state.
 * - `addEventListener(type, listener, options)` → attach listeners to the root.
 *
 * @class NiceText
 * @classdesc A self‑contained accessible text input widget with label, optional search icon,
 * and cancel button, dispatching enhanced input events for easier integration.
 */
export default class NiceText {
  static #id = 0;

  static get id() {
    const id = NiceText.#id;
    this.#id += 1;
    return id;
  }

  /** @type {import("./types").NiceTextConfig} */
  #config;

  /** @type {HTMLElement} The root element */
  #root;

  /** @type {HTMLLabelElement} The label element */
  #label;

  /** @type {HTMLInputElement} The input element */
  #input;

  /** @type {HTMLButtonElement} The cancel button */
  #cancel;

  /** @type {string} The root element ID */
  #rootId;

  /** @type {string} The label element ID */
  #labelId;

  /** @type {string} The input element ID */
  #inputId;

  /**
   * @param {import("./types").NiceTextConfig} config
   */
  constructor(config = {}) {
    this.#config = { ...DEFAULT_CONFIG, ...config };
    this.#create();
  }

  /** @private */
  #create() {
    // Set up IDs
    const { id } = NiceText;
    this.#rootId = `nice-text-${id}`;
    this.#labelId = `${this.#rootId}-label`;
    this.#inputId = `${this.#rootId}-input`;

    this.#root = document.createRange().createContextualFragment(`
      <div
        id="${this.#rootId}"
        class="${NICE_TEXT_CLASS} ${this.#config.className ?? ''}"
      >
        <label
          id="${this.#labelId}"
          for="${this.#inputId}"
          class="${this.#config.labelClassName ?? ''}"
        >${this.#config.label}</label>
        ${this.#config.type === 'search' ? `
          <span class="icon" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path d="M19.6902 20.57L13.2702 14.15C12.7702 14.58 12.1902 14.91 11.5402 15.15C10.8802 15.39 10.2002 15.5 9.50016 15.5C7.80016 15.5 6.36016 14.91 5.18016 13.73C4.00016 12.55 3.41016 11.12 3.41016 9.42999C3.41016 7.73999 4.00016 6.30999 5.18016 5.12999C6.36016 3.94999 7.79016 3.35999 9.48016 3.35999C11.1702 3.35999 12.6002 3.94999 13.7802 5.12999C14.9602 6.30999 15.5502 7.73999 15.5502 9.42999C15.5502 10.14 15.4302 10.82 15.1902 11.48C14.9502 12.14 14.6102 12.73 14.1802 13.25L20.6102 19.65L19.7102 20.56L19.6902 20.57ZM9.48016 14.25C10.8202 14.25 11.9602 13.78 12.8902 12.85C13.8202 11.92 14.2902 10.78 14.2902 9.43999C14.2902 8.09999 13.8202 6.95999 12.8902 6.02999C11.9602 5.09999 10.8202 4.62999 9.48016 4.62999C8.14016 4.62999 6.99016 5.09999 6.06016 6.02999C5.13016 6.95999 4.66016 8.09999 4.66016 9.43999C4.66016 10.78 5.13016 11.92 6.06016 12.85C6.99016 13.78 8.13016 14.25 9.48016 14.25Z" fill="currentColor"/>
              </g>
            </svg>
          </span>
        ` : ''}
        <input
          id="${this.#inputId}"
          name="${this.#config.name}"
          type="${this.#config.type}"
          placeholder="${this.#config.placeholder}"
          ${this.#config.value ? `value="${this.#config.value}"` : ''}
          ${this.#config.pattern ? `pattern="${this.#config.pattern}"` : ''}
          ${this.#config.form ? `form="${this.#config.form}"` : ''}
          autocomplete="off"
        >
        <button
          class="cancel"
          type="button"
          aria-label="${this.#config.cancelText}"
          ${this.#config.form ? `form="${this.#config.form}"` : ''}
        >✕</button>
      </div>
    `).firstElementChild;
    this.#label = this.#root.querySelector(':scope label');
    this.#input = this.#root.querySelector(':scope input');
    this.#cancel = this.#root.querySelector(':scope button.cancel');

    // Initial state
    this.setRequired(this.#config.required);
    this.setDisabled(this.#config.disabled);
    this.setReadOnly(this.#config.readonly);

    this.#addEventListeners();

    // Set NiceText instance reference on the root element
    // eslint-disable-next-line no-underscore-dangle
    this.#root._nicetext = this;
  }

  /** @private */
  #addEventListeners() {
    this.#cancel.addEventListener('click', (e) => {
      e.preventDefault();
      this.reset();
      this.#input.focus();
      e.stopPropagation();
    });

    // Intercept native input and re-dispatch with detail
    this.#input.addEventListener('input', this.#onNativeInput.bind(this));
  }

  /**
   * Handles incoming native input events.
   * @private
   * @type {(e: Event) => void}
   */
  // eslint-disable-next-line no-unused-vars
  #onNativeInput = (e) => {
    this.#dispatchNiceInput();
  };

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
    this.#input.dispatchEvent(new Event('input', { bubbles: true, cancelable: false }));
    this.#dispatchNiceInput();
  }

  reset() {
    this.setValue('');
    this.#triggerInput();
  }

  /**
   * Sets the provided value.
   *
   * NOTE: Does not dispatch an input event automatically; call programmatically if you need to
   * notify listeners.
   * @param {string} value
   */
  setValue(value) {
    this.#input.value = value;
  }

  disable() {
    this.disabled = true;
  }

  enable() {
    this.disabled = false;
  }

  /** @param {boolean} disabled */
  setDisabled(disabled) {
    this.#input.disabled = Boolean(disabled);
    this.#input.setAttribute('aria-disabled', String(this.#input.disabled));
    this.#cancel.disabled = this.#input.disabled;
    this.#cancel.setAttribute('aria-disabled', String(this.#input.disabled));
  }

  /** @param {boolean} disabled */
  set disabled(disabled) {
    this.setDisabled(disabled);
  }

  get disabled() {
    return this.#input.disabled;
  }

  /** @param {string} value */
  set value(value) {
    this.setValue(value);
  }

  get value() {
    return this.#input.value;
  }

  get name() {
    return this.#config.name;
  }

  get type() {
    return this.#config.type;
  }

  get label() {
    return this.#config.label;
  }

  get validity() {
    return this.#input.validity;
  }

  /** @param {boolean} required */
  setRequired(required) {
    this.#input.required = Boolean(required);
    this.#input.setAttribute('aria-required', String(this.#input.required));
  }

  /** @param {boolean} required */
  set required(required) {
    this.setRequired(required);
  }

  get required() {
    return this.#input.required;
  }

  /** @param {boolean} readonly */
  setReadOnly(readonly) {
    this.#input.readOnly = Boolean(readonly);
    this.#input.setAttribute('aria-readonly', String(this.#input.readOnly));
  }

  /** @param {boolean} readonly */
  set readonly(readonly) {
    this.setReadOnly(readonly);
  }

  get readonly() {
    return this.#input.readonly;
  }

  get element() {
    return this.#root;
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
}
