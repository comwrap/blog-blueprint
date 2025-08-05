import { setBlockItemOptions, moveClassToTargetedChild } from '../../scripts/utils.js';
import { renderButton } from '../../components/button/button.js';

export default function decorate(block) {
  const blockItemsOptions = [];
  const blockItemMap = [
    { name: 'category' },
    { name: 'title' },
    { name: 'date' },
    { name: 'location' },
    { name: 'link' },
    { name: 'label' },
    { name: 'target' },
  ];
  setBlockItemOptions(block, blockItemMap, blockItemsOptions);
  const config = blockItemsOptions[0] || {};

  const wrapper = document.createElement('div');
  wrapper.className = 'event-teaser-container';

  // Main content frame
  const contentFrame = document.createElement('div');
  contentFrame.className = 'event-content-frame';

  // Event info section
  const eventInfoSection = document.createElement('div');
  eventInfoSection.className = 'event-info-section';

  // Category and title container
  const eventTitleContainer = document.createElement('div');
  eventTitleContainer.className = 'event-title-container';

  const categoryEl = document.createElement('div');
  categoryEl.className = 'event-category';
  categoryEl.textContent = config.category || 'Event, Category';

  const titleEl = document.createElement('h2');
  titleEl.className = 'event-title';
  titleEl.textContent = config.title || 'Event Title';

  eventTitleContainer.appendChild(categoryEl);
  eventTitleContainer.appendChild(titleEl);

  // Divider line
  const dividerEl = document.createElement('div');
  dividerEl.className = 'event-divider';

  // Date and location section
  const eventDetailsSection = document.createElement('div');
  eventDetailsSection.className = 'event-details-section';

  const dateContainer = document.createElement('div');
  dateContainer.className = 'event-date-container';
  if (config.date) {
    const dateEl = document.createElement('span');
    dateEl.className = 'event-date';
    dateEl.textContent = config.date;
    dateContainer.appendChild(dateEl);
  }

  const locationContainer = document.createElement('div');
  locationContainer.className = 'event-location-container';
  if (config.location) {
    const locationEl = document.createElement('span');
    locationEl.className = 'event-location';
    locationEl.textContent = config.location;
    locationContainer.appendChild(locationEl);
  }

  eventDetailsSection.appendChild(dateContainer);
  eventDetailsSection.appendChild(locationContainer);

  eventInfoSection.appendChild(eventTitleContainer);
  eventInfoSection.appendChild(dividerEl);
  eventInfoSection.appendChild(eventDetailsSection);

  contentFrame.appendChild(eventInfoSection);

  // Button section
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'event-button-container';

  if (config.label) {
    const button = renderButton({
      link: config.link,
      label: config.label,
      target: config.target,
      block,
    });
    button.classList.add('event-button', 'outline');
    buttonContainer.appendChild(button);
    moveClassToTargetedChild(block, button);
  } else {
    // Default button
    const defaultButton = document.createElement('a');
    defaultButton.href = config.link || '#';
    defaultButton.textContent = 'LEARN MORE';
    defaultButton.className = 'button event-button outline';
    if (config.target) {
      defaultButton.target = config.target;
    }
    buttonContainer.appendChild(defaultButton);
  }

  wrapper.appendChild(contentFrame);
  wrapper.appendChild(buttonContainer);

  block.textContent = '';
  block.appendChild(wrapper);
}
