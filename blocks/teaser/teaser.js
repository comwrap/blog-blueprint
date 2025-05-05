import { setBlockItemOptions } from '../../scripts/utils.js';
import { renderCustomButton } from '../custom-button/custom-button.js';

export function renderTeaser({
  title = 'Teaser Title',
  description = 'This is a teaser description.',
  image = 'https://via.placeholder.com/400x200',
  imageAlt = 'Teaser Image',
  button = {},
}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'teaser-block';

  const imageDiv = document.createElement('div');
  imageDiv.className = 'teaser-image';
  const img = document.createElement('img');
  img.src = image;
  img.alt = imageAlt;
  imageDiv.appendChild(img);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'teaser-content';

  const titleEl = document.createElement('h2');
  titleEl.className = 'teaser-title';
  titleEl.textContent = title;

  const descEl = document.createElement('p');
  descEl.className = 'teaser-description';
  descEl.textContent = description;

  const buttonDiv = document.createElement('div');
  buttonDiv.className = 'teaser-button';
  if (button && button.text) {
    buttonDiv.appendChild(renderCustomButton(button));
  }

  contentDiv.appendChild(titleEl);
  contentDiv.appendChild(descEl);
  contentDiv.appendChild(buttonDiv);

  wrapper.appendChild(imageDiv);
  wrapper.appendChild(contentDiv);

  return wrapper;
}

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
  const config = blockItemsOptions[0] || {};

  // Map button fields to custom-button config
  const buttonConfig = {
    aemContent: config.aemContent,
    title: config.buttonTitle,
    label: config.buttonLabel,
    style: config.buttonStyle,
    text: config.buttonText,
    target: config.buttonTarget,
    type: config.buttonType,
  };

  const teaserEl = renderTeaser({
    title: config.title,
    description: config.description,
    image: config.image,
    imageAlt: config.imageAlt,
    button: buttonConfig,
  });

  block.textContent = '';
  block.appendChild(teaserEl);
}
