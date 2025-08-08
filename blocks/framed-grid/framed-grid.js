import { moveClassToTargetedChild } from '../../scripts/utils.js';
import { renderButton } from '../../components/button/button.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const rows = [...block.children];

  // Block-level background config from the first row
  let backgroundImageUrl = '';
  let backgroundImageAlt = '';
  if (rows[0]) {
    const img = rows[0].querySelector('img');
    const a = rows[0].querySelector('a');
    backgroundImageUrl = img?.src || a?.href || '';
    backgroundImageAlt = img?.alt || rows[0].children?.[1]?.textContent?.trim() || '';
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

  const list = document.createElement('ul');
  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'framed-grid-item';

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
      renderButton({
        linkButton: a,
        linkText: item.linkText || '',
        linkTitle: item.linkTitle || '',
        linkTarget: item.linkTarget || '',
        linkType: item.linkType || '',
        linkStyle: item.linkStyle || '',
      });
      buttonWrap.appendChild(a);
      moveClassToTargetedChild(block, a);
      content.appendChild(buttonWrap);
    }

    li.appendChild(content);

    if ([0, 2, 4].includes(index) && backgroundImageUrl) {
      li.classList.add('framed-grid-has-frame');
      const frame = document.createElement('div');
      frame.className = 'framed-grid-frame';
      const picture = createOptimizedPicture(
        backgroundImageUrl,
        backgroundImageAlt || 'Background',
        false,
        [
          { width: '750' },
          { width: '1200' },
        ],
      );
      frame.appendChild(picture);
      li.appendChild(frame);
    }

    list.appendChild(li);
  });

  wrapper.appendChild(list);
  block.textContent = '';
  block.appendChild(wrapper);
}
