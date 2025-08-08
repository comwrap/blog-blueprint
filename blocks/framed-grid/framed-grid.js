import { moveClassToTargetedChild } from '../../scripts/utils.js';
import { renderButton } from '../../components/button/button.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const items = [];
  let backgroundImageUrl = '';
  let backgroundImageAlt = '';

  [...block.children].forEach((row) => {
    const label = row.children?.[0]?.textContent?.trim()?.toLowerCase() || '';

    const hasInlineImage = !!row.querySelector('img');
    const hasAnchor = !!row.querySelector('a');
    const isLikelyBackgroundRow = hasInlineImage && !hasAnchor && row.children.length <= 2;

    if (label === 'background image' || label === 'background' || (!backgroundImageUrl && isLikelyBackgroundRow)) {
      const img = row.querySelector('img');
      if (img) {
        backgroundImageUrl = img.src;
        backgroundImageAlt = img.alt || '';
      } else {
        const link = row.querySelector('a');
        if (link) backgroundImageUrl = link.href;
      }
      return;
    }

    const map = [
      { name: 'title' },
      { name: 'description' },
      { name: 'link' },
      { name: 'linkText' },
      { name: 'linkTitle' },
      { name: 'linkTarget' },
      { name: 'linkType' },
      { name: 'linkStyle' },
    ];

    const options = {};
    map.forEach((entry, index) => {
      const node = row.children[index];
      options[entry.name] = node ? node.textContent.trim() : '';
      if (entry.name === 'link' && node) {
        const anchor = node.querySelector('a');
        if (anchor) options.link = anchor.href;
      }
    });
    items.push(options);
  });

  const limited = items.slice(0, 6);

  const wrapper = document.createElement('div');
  wrapper.className = 'framed-grid';

  const list = document.createElement('ul');
  limited.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'framed-grid-item';

    const content = document.createElement('div');
    content.className = 'framed-grid-content';

    const titleEl = document.createElement('h3');
    titleEl.className = 'framed-grid-title';
    titleEl.textContent = item.title || '';

    const descEl = document.createElement('p');
    descEl.className = 'framed-grid-description';
    descEl.textContent = item.description || '';

    const buttonWrap = document.createElement('div');
    buttonWrap.className = 'framed-grid-button';
    if (item.link) {
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
    }

    content.appendChild(titleEl);
    content.appendChild(descEl);
    content.appendChild(buttonWrap);

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
