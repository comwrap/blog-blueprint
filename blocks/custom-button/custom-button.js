import { setBlockItemOptions, moveClassToChild } from '../../scripts/utils.js';

export default function decorate(block) {
  const blockItemsOptions = [];
  const blockItemMap = [{ name: 'link' }, { name: 'label' }, { name: 'target' }];

  setBlockItemOptions(block, blockItemMap, blockItemsOptions);
  const { link, label, target } = blockItemsOptions[0];

  const button = document.createElement('a');
  button.className = 'button';
  button.title = label;
  if (target !== '') button.target = target;
  button.innerText = label;

  let href = link;
  block.classList.forEach((className) => {
    switch (className) {
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
  });

  button.href = href;

  block.textContent = '';
  block.appendChild(button);
  moveClassToChild(block);
}
