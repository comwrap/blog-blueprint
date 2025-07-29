export function renderButton({
  linkButton, linkText, linkTitle, linkTarget, linkType, linkStyle,
}) {
  if (linkTarget !== '') linkButton.target = linkTarget;
  if (linkText !== '') linkButton.textContent = linkText;
  if (linkTitle !== '') linkButton.title = linkTitle;

  let { href } = linkButton;
  if (linkType === 'telephone') href = `tel:${href}`;
  if (linkType === 'email') href = `mailto:${href}`;
  if (linkType === 'download') linkButton.download = '';

  if (linkStyle !== '') linkButton.classList.add(linkStyle);

  linkButton.href = href;

  return linkButton;
}

export default renderButton;
