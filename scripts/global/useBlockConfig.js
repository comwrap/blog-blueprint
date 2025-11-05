/**
 * Extracts fields from block rows and removes rows as per config,
 * allowing custom extraction logic per field.
 *
 * @param {Element} block The block element
 * @param {import("./types").BlockConfig} BLOCK_CONFIG The block config object
 * @param {{
 *   [k: string]: import("./types").FieldExtractor,
 * }} [fieldExtractors] Field extractors: `{ FIELD_NAME: (row, index, rows) => { ... } }`
 * @returns {{
 *   [k: keyof BlockConfig['FIELDS']]: {
 *     text: string,
 *     node: Element | null,
 *     picture: HTMLPictureElement | null,
 *     [j: string]: any,
 *   }
 * }} The structured fields
 */
export default function useBlockConfig(block, BLOCK_CONFIG, fieldExtractors = {}) {
  const rows = Array.from(block.children);

  const fields = {};
  Object.entries(BLOCK_CONFIG.FIELDS).forEach(([key, { index }]) => {
    const row = rows[index];
    let value;

    // If a custom extractor is provided, use it
    if (typeof fieldExtractors[key] === 'function') {
      value = fieldExtractors[key](row, index, rows);
    } else if (row) {
      // Default extraction: text, node, picture
      value = {
        text: row.textContent?.trim() || '',
        node: row,
        picture: row.querySelector?.('picture') || null,
        img: row.querySelector?.('img') || null,
      };
    } else {
      value = { text: '', node: null, picture: null };
    }

    fields[key] = value;
  });

  // Decorate block
  if (fields.BLOCK_ID) block.id = fields.BLOCK_ID.text;
  if (fields.BLOCK_LABEL) block.setAttribute('data-block-label', fields.BLOCK_LABEL.text);

  // Remove configured rows
  Object.values(BLOCK_CONFIG.FIELDS)
    .filter(({ removeRow }) => removeRow)
    .forEach(({ index }) => rows[index]?.remove());

  if (BLOCK_CONFIG.empty) block.textContent = '';

  return fields;
}
