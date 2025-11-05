import { fetchSVG } from '../../blocks/helpers.js';

export async function renderButton({
  linkButton, linkText, linkTitle, linkTarget, linkType, linkStyle, iconImage,
}) {
  if (linkTarget !== '') linkButton.target = linkTarget;
  if (linkText !== '') linkButton.textContent = linkText;
  if (linkTitle !== '') linkButton.title = linkTitle;

  let { href } = linkButton;
  // also add classes based on type telephone, email, download
  if (linkType === 'telephone') href = `tel:${href}`;
  if (linkType === 'email') href = `mailto:${href}`;
  if (linkType === 'download') linkButton.download = '';

  if (linkStyle !== '') linkButton.classList.add(linkStyle);

  linkButton.href = href;

  if (linkType === 'telephone' || linkType === 'email' || linkType === 'external-link' || linkType === 'download' || iconImage) {
    const iconElement = document.createElement('span');
    iconElement.classList.add('icon');
    iconElement.innerHTML = iconImage ? await fetchSVG(iconImage.src) : await fetchSVG(`${window.hlx.codeBasePath}/icons/def-btn-icon-${linkType}.svg`);
    linkButton.append(iconElement);
  }

  return linkButton;
}

export default renderButton;
