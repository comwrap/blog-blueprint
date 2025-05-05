import { setBlockItemOptions, moveClassToFirstChild } from '../../scripts/utils.js';

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
    if (className === 'telephone') href = `tel:${link}`;
    if (className === 'email') href = `mailto:${link}`;
    if (className === 'download') button.download = '';
  });

  button.href = href;

  block.textContent = '';
  block.appendChild(button);
  moveClassToFirstChild(block);
}
