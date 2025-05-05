import { readBlockConfig } from '../../scripts/aem.js';

export default function decorate(block) {
  const config = readBlockConfig(block);
  const {
    aemContent,
    title,
    label,
    style = 'primary',
    text,
    target = '_self',
    type = 'link', // link, telephone, email, download
  } = config;

  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'custom-button-container';

  // Create the button
  const button = document.createElement('a');
  button.className = `custom-button ${style}`;
  button.title = title || text;
  button.target = target;

  // Set href based on type
  let href = aemContent;
  switch (type) {
    case 'telephone':
      href = `tel:${aemContent}`;
      break;
    case 'email':
      href = `mailto:${aemContent}`;
      break;
    case 'download':
      button.download = '';
      break;
    default:
      href = aemContent;
  }
  button.href = href;

  // Add label if provided
  if (label) {
    const labelSpan = document.createElement('span');
    labelSpan.className = 'button-label';
    labelSpan.textContent = label;
    button.appendChild(labelSpan);
  }

  // Add text
  const textSpan = document.createElement('span');
  textSpan.className = 'button-text';
  textSpan.textContent = text;
  button.appendChild(textSpan);

  // Add to container
  buttonContainer.appendChild(button);
  block.textContent = '';
  block.appendChild(buttonContainer);
}
