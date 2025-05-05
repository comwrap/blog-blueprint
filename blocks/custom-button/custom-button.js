import { setBlockItemOptions, moveClassToChild } from '../../scripts/utils.js';

export default function decorate(block) {
  const blockItemsOptions = [];
  const blockItemMap = [
    { name: 'link' },
    { name: 'title' },
    { name: 'label' },
    { name: 'target' },
    { name: 'type' },
  ];

  setBlockItemOptions(block, blockItemMap, blockItemsOptions);
  const {
    link, title, label, target, type,
  } = blockItemsOptions[0];

  const button = document.createElement('a');
  button.className = 'button';
  button.title = title || label;
  if (target !== '') button.target = target;
  button.innerText = label;

  let href = link;
  switch (type) {
    case 'telephone':
      href = `tel:${link}`;
      break;
    case 'email':
      href = `mailto:${link}`;
      break;
    case 'download':
      button.download = '';
      break;
    default:
      href = link;
  }
  button.href = href;

  block.textContent = '';
  block.appendChild(button);
  moveClassToChild(block);
}
