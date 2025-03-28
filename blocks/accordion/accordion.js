import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'accordion';
  ul.setAttribute('role', 'list');

  [...block.children].forEach((row, index) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    li.setAttribute('role', 'listitem');

    const heading = document.createElement('h3');
    const button = document.createElement('button');
    button.className = 'accordion-trigger';
    button.setAttribute('type', 'button');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', `accordion-sect-${index}`);
    button.id = `accordion-trigger-${index}`;

    const titleSpan = document.createElement('span');
    titleSpan.className = 'accordion-title';
    const iconSpan = document.createElement('span');
    iconSpan.className = 'accordion-icon';
    iconSpan.setAttribute('aria-hidden', 'true');

    const questionDiv = row.querySelector(':scope > div:first-child');
    if (questionDiv) {
      titleSpan.textContent = questionDiv.textContent.trim();
    }

    button.appendChild(titleSpan);
    button.appendChild(iconSpan);
    heading.appendChild(button);
    li.appendChild(heading);

    const panel = document.createElement('div');
    panel.className = 'accordion-panel';
    panel.id = `accordion-sect-${index}`;
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-labelledby', `accordion-trigger-${index}`);
    panel.setAttribute('hidden', '');

    const contentDiv = document.createElement('div');
    contentDiv.className = 'accordion-content';

    const answerDiv = row.querySelector(':scope > div:nth-child(2)');
    if (answerDiv) {
      contentDiv.innerHTML = answerDiv.innerHTML;
    }

    const imageDiv = row.querySelector(':scope > div:nth-child(3) picture');
    if (imageDiv) {
      const img = imageDiv.querySelector('img');
      if (img) {
        const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
        moveInstrumentation(img, optimizedPic.querySelector('img'));
        contentDiv.insertBefore(optimizedPic, contentDiv.firstChild);
      }
    }

    panel.appendChild(contentDiv);
    li.appendChild(panel);

    button.addEventListener('click', () => {
      const isExpanded = button.getAttribute('aria-expanded') === 'true';
      // Close all other panels
      ul.querySelectorAll('.accordion-trigger').forEach((otherButton) => {
        if (otherButton !== button) {
          otherButton.setAttribute('aria-expanded', 'false');
          const otherPanel = document.getElementById(otherButton.getAttribute('aria-controls'));
          otherPanel.setAttribute('hidden', '');
        }
      });

      // Toggle current panel
      button.setAttribute('aria-expanded', !isExpanded);
      if (isExpanded) {
        panel.setAttribute('hidden', '');
      } else {
        panel.removeAttribute('hidden');
      }
    });

    ul.appendChild(li);
  });

  block.textContent = '';
  block.appendChild(ul);
}
