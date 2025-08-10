/*
 * Universal button renderer utilised by multiple blocks.
 *
 * The function historically supported two slightly different
 * calling signatures. In order to keep backward-compatibility with
 * older blocks (e.g. `custom-button`) _and_ support the simplified
 * signature used by newer blocks (e.g. `teaser`, `event-teaser`,
 * `content-image-teaser`) we normalise the incoming parameter object.
 *
 * Supported params (camel-cased to mirror model field names):
 * 1. legacy signature
 *    {
 *      linkButton: <a>,
 *      linkText: string,
 *      linkTitle: string,
 *      linkTarget: string,
 *      linkType: string,   // telephone | email | download | undefined
 *      linkStyle: string   // primary | secondary | text ...
 *    }
 * 2. simplified signature
 *    {
 *      link: string,       // href
 *      label: string,      // visible text
 *      title: string,
 *      target: string,
 *      type: string,
 *      style: string,
 *      block: HTMLElement  // optional, ignored here
 *    }
 */

export function renderButton(params = {}) {
  // Map simplified signature keys → legacy equivalents when required.
  const normalised = {
    linkButton: params.linkButton,
    linkText: params.linkText ?? params.label ?? '',
    linkTitle: params.linkTitle ?? params.title ?? '',
    linkTarget: params.linkTarget ?? params.target ?? '',
    linkType: params.linkType ?? params.type ?? '',
    linkStyle: params.linkStyle ?? params.style ?? '',
    href: params.link ?? '',
  };

  // Ensure we have an <a> element to work with.
  let { linkButton } = normalised;
  if (!linkButton) {
    linkButton = document.createElement('a');
    linkButton.classList.add('button');
    // eslint-disable-next-line prefer-destructuring
    linkButton.href = normalised.href;
  }

  // Apply standard attributes / text.
  if (normalised.linkTarget) linkButton.target = normalised.linkTarget;
  if (normalised.linkText) linkButton.textContent = normalised.linkText;
  if (normalised.linkTitle) linkButton.title = normalised.linkTitle;

  // Handle special link types.
  let { href } = linkButton;
  switch (normalised.linkType) {
    case 'telephone':
      href = `tel:${href}`;
      break;
    case 'email':
      href = `mailto:${href}`;
      break;
    case 'download':
      linkButton.download = '';
      break;
    default:
      break;
  }

  // Add styling class when provided.
  if (normalised.linkStyle) linkButton.classList.add(normalised.linkStyle);

  // Finalise href.
  linkButton.href = href;

  return linkButton;
}

export default renderButton;
