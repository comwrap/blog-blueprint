import { renderButton } from '../../components/button/button.js';

export default function decorate(block) {
  const [link, text, title, target, type, style] = block.children;

  let linkButton = link?.querySelector('a');
  if (linkButton === null) {
    linkButton = document.createElement('a');
    linkButton.classList.add('button');
    linkButton.href = link.textContent.trim();
  }

  const linkTarget = target?.textContent.trim();
  const linkType = type?.textContent.trim();
  const linkStyle = style?.textContent.trim();
  const linkText = text?.textContent.trim();
  const linkTitle = title?.textContent.trim();

  renderButton({
    linkButton,
    linkText,
    linkTitle,
    linkTarget,
    linkType,
    linkStyle,
  });

  block.textContent = '';
  block.appendChild(linkButton);
}
