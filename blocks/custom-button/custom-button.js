import { renderButton } from '../../components/button/button.js';

export default function decorate(block) {
  const [link, target, type, style] = block.children;

  const linkButton = link?.querySelector('a');
  const linkTarget = target?.textContent.trim();
  const linkType = type?.textContent.trim();
  const linkStyle = style?.textContent.trim();

  renderButton({
    linkButton,
    linkTarget,
    linkType,
    linkStyle,
  });

  block.textContent = '';
  block.appendChild(linkButton);
}
