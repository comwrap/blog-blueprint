import { moveClassToTargetedChild } from '../../scripts/utils.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const rows = [...block.children];

  // Block-level background config from the first row
  let backgroundImageUrl = '';
  let backgroundImageAlt = '';
  let layout = '';
  if (rows[0]) {
    const img = rows[0].querySelector('img');
    const a = rows[0].querySelector('a');
    backgroundImageUrl = img?.src || a?.href || '';
    backgroundImageAlt = img?.alt || rows[0].children?.[1]?.textContent?.trim() || '';
    layout = rows[0].children?.[2]?.textContent?.trim() || '';
  }

  // Remaining rows are items
  const itemRows = rows.slice(1);

  const items = itemRows.map((row) => {
    const cells = [...row.children];
    const title = cells[0]?.textContent?.trim() || '';
    const description = cells[1]?.textContent?.trim() || '';

    let link = '';
    let linkText = '';
    let linkTitle = '';
    let linkTarget = '';
    let linkType = '';
    let linkStyle = '';

    // Try to read a standard anchor if present in any cell
    const anchor = row.querySelector('a');
    if (anchor) {
      link = anchor.href || '';
      linkText = anchor.textContent?.trim() || '';
      linkTitle = anchor.title || '';
      linkTarget = anchor.target || '';
    }

    // Fallback to explicit button fields if provided as separate cells (matches partials)
    link = cells[2]?.querySelector('a')?.href || cells[2]?.textContent?.trim() || link;
    linkText = cells[3]?.textContent?.trim() || linkText;
    linkTitle = cells[4]?.textContent?.trim() || linkTitle;
    linkTarget = cells[5]?.textContent?.trim() || linkTarget;
    linkType = cells[6]?.textContent?.trim() || linkType;
    linkStyle = cells[7]?.textContent?.trim() || linkStyle;

    return {
      row,
      title,
      description,
      link,
      linkText,
      linkTitle,
      linkTarget,
      linkType,
      linkStyle,
    };
  }).slice(0, 6);

  // Build DOM
  const wrapper = document.createElement('div');
  wrapper.className = 'framed-grid';
  if (layout === 'half') wrapper.classList.add('layout-half');
  if (layout === 'quarter') wrapper.classList.add('layout-quarter');

  const list = document.createElement('ul');
  list.setAttribute('role', 'list');
  const framedItems = [];

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'framed-grid-item';
    li.setAttribute('role', 'listitem');

    // Preserve authoring instrumentation from the source row
    moveInstrumentation(item.row, li);

    const content = document.createElement('div');
    content.className = 'framed-grid-content';

    if (item.title) {
      const titleEl = document.createElement('h3');
      titleEl.className = 'framed-grid-title';
      titleEl.textContent = item.title;
      content.appendChild(titleEl);
    }

    if (item.description) {
      const descEl = document.createElement('p');
      descEl.className = 'framed-grid-description';
      descEl.textContent = item.description;
      content.appendChild(descEl);
    }

    if (item.link) {
      const buttonWrap = document.createElement('div');
      buttonWrap.className = 'framed-grid-button';
      const a = document.createElement('a');
      a.classList.add('button');
      a.href = item.link;
      // Render button styles/text if provided
      a.textContent = item.linkText || a.textContent || '';
      if (item.linkTitle) a.title = item.linkTitle;
      if (item.linkTarget) a.target = item.linkTarget;
      if (item.linkStyle) a.classList.add(item.linkStyle);
      buttonWrap.appendChild(a);
      moveClassToTargetedChild(block, a);
      content.appendChild(buttonWrap);
    }

    li.appendChild(content);

    if ([0, 2, 4].includes(index) && backgroundImageUrl) {
      li.classList.add('framed-grid-has-frame');
      const frame = document.createElement('div');
      frame.className = 'framed-grid-frame';
      frame.setAttribute('role', 'img');
      if (backgroundImageAlt) frame.setAttribute('aria-label', backgroundImageAlt);
      li.appendChild(frame);
      framedItems.push(frame);
    }

    list.appendChild(li);
  });

  wrapper.appendChild(list);
  block.textContent = '';
  block.appendChild(wrapper);

  // Align framed backgrounds to a single shared background
  function positionFrames() {
    if (!backgroundImageUrl || framedItems.length === 0) return;
    const wrapperRect = wrapper.getBoundingClientRect();

    framedItems.forEach((frame) => {
      const liRect = frame.parentElement.getBoundingClientRect();
      const offsetX = liRect.left - wrapperRect.left;
      const offsetY = liRect.top - wrapperRect.top;

      // Size the background to the wrapper, and offset to align slice
      frame.style.backgroundImage = `url("${backgroundImageUrl}")`;
      frame.style.backgroundRepeat = 'no-repeat';
      frame.style.backgroundSize = `${Math.round(wrapperRect.width)}px ${Math.round(wrapperRect.height)}px`;
      frame.style.backgroundPosition = `-${Math.round(offsetX)}px -${Math.round(offsetY)}px`;
    });
  }

  // Reposition on load and on resize
  positionFrames();
  window.addEventListener('resize', () => {
    window.requestAnimationFrame(positionFrames);
  });

  const ro = new ResizeObserver(() => positionFrames());
  ro.observe(wrapper);
}
