export function renderButton({
  linkButton, linkTarget, linkType, linkStyle,
}) {
  if (linkTarget !== '') linkButton.target = linkTarget;

  let { href } = linkButton;
  if (linkType === 'telephone') href = `tel:${href}`;
  if (linkType === 'email') href = `mailto:${href}`;
  if (linkType === 'download') linkButton.download = '';

  if (linkStyle !== '') linkButton.classList.add(linkStyle);

  linkButton.href = href;

  return linkButton;
}

export default renderButton;
