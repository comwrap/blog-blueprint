import { setBlockItemOptions, moveClassToTargetedChild } from '../../scripts/utils.js';
import { renderButton } from '../../components/button/button.js';
import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const blockItemsOptions = [];
  const blockItemMap = [
    { name: 'title' },
    { name: 'description' },
    { name: 'image' },
    { name: 'link' },
    { name: 'label' },
    { name: 'target' },
  ];
  setBlockItemOptions(block, blockItemMap, blockItemsOptions);
  const config = blockItemsOptions[0] || {};

  const wrapper = document.createElement('div');
  wrapper.className = 'teaser-block';

  const imageDiv = document.createElement('div');
  imageDiv.className = 'teaser-image';
  if (config.image) {
    const optimizedPic = createOptimizedPicture(config.image, config.imageAlt || 'Teaser Image');
    imageDiv.appendChild(optimizedPic);
  } else {
    const img = document.createElement('img');
    img.src = 'https://via.placeholder.com/400x200';
    img.alt = config.imageAlt || 'Teaser Image';
    imageDiv.appendChild(img);
  }

  const contentDiv = document.createElement('div');
  contentDiv.className = 'teaser-content';

  const titleEl = document.createElement('h2');
  titleEl.className = 'teaser-title';
  titleEl.textContent = config.title || '';

  const descEl = document.createElement('p');
  descEl.className = 'teaser-description';
  descEl.textContent = config.description || '';

  const buttonDiv = document.createElement('div');
  buttonDiv.className = 'teaser-button';
  if (config.label) {
    buttonDiv.appendChild(renderButton({
      link: config.link,
      label: config.label,
      target: config.target,
      block,
    }));
    moveClassToTargetedChild(block, buttonDiv.querySelector('.button'));
  }

  contentDiv.appendChild(titleEl);
  contentDiv.appendChild(descEl);
  contentDiv.appendChild(buttonDiv);

  wrapper.appendChild(imageDiv);
  wrapper.appendChild(contentDiv);

  block.textContent = '';
  block.appendChild(wrapper);
}
