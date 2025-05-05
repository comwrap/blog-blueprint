import { setBlockItemOptions } from '../../scripts/utils.js';

export default function decorate(block) {
  const blockItemsOptions = [];
  const blockItemMap = [
    { name: 'title' },
    { name: 'description' },
    { name: 'image' },
    { name: 'imageAlt' },
    { name: 'aemContent' },
    { name: 'buttonTitle' },
    { name: 'buttonLabel' },
    { name: 'buttonStyle' },
    { name: 'buttonText' },
    { name: 'buttonTarget' },
    { name: 'buttonType' },
  ];
  setBlockItemOptions(block, blockItemMap, blockItemsOptions);
}
