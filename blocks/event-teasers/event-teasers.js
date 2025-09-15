import { setBlockItemOptions } from '../../scripts/utils.js';
import { renderButton } from '../../components/button/button.js';

/*
 * Event-Teasers block
 * ─────────────────── 
 * Expected authoring markup (rows → cols):
 * | Category | Title | Date | Location | Link | Label | Target |
 * Each row represents one event teaser.
 * The block converts these rows into teaser cards and arranges them
 * in an horizontally scrollable slider that shows 4 items per “page”
 * on desktop, fewer on smaller breakpoints.
 */

function buildTeaserCard(cfg) {
  const wrapper = document.createElement('article');
  wrapper.className = 'event-teaser-card';

  // Event info container
  const info = document.createElement('div');
  info.className = 'event-teaser-info';

  const category = document.createElement('div');
  category.className = 'event-category';
  category.textContent = cfg.category || 'Event';

  const title = document.createElement('h3');
  title.className = 'event-title';
  title.textContent = cfg.title || 'Untitled Event';

  const divider = document.createElement('div');
  divider.className = 'event-divider';

  const details = document.createElement('div');
  details.className = 'event-details';

  if (cfg.date) {
    const date = document.createElement('span');
    date.className = 'event-date';
    date.textContent = cfg.date;
    details.append(date);
  }

  if (cfg.location) {
    const loc = document.createElement('span');
    loc.className = 'event-location';
    loc.textContent = cfg.location;
    details.append(loc);
  }

  info.append(category, title, divider, details);

  const btnContainer = document.createElement('div');
  btnContainer.className = 'event-teaser-button';

  if (cfg.label) {
    const btn = renderButton({
      link: cfg.link,
      label: cfg.label,
      target: cfg.target,
      block: wrapper,
    });
    btn.classList.add('outline');
    btnContainer.append(btn);
  }

  wrapper.append(info, btnContainer);

  return wrapper;
}

function collectConfigs(block) {
  const map = [
    { name: 'category' },
    { name: 'title' },
    { name: 'date' },
    { name: 'location' },
    { name: 'link' },
    { name: 'label' },
    { name: 'target' },
  ];

  const configs = [];
  [...block.children].forEach((row) => {
    setBlockItemOptions(row, map, configs);
  });
  return configs;
}

function buildNavigationButton(dir, label) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `slider-${dir}`;
  btn.setAttribute('aria-label', label);
  return btn;
}

export default function decorate(block) {
  // Collect data from authoring rows
  const configs = collectConfigs(block);

  // Build main DOM structure
  const wrapper = document.createElement('div');
  wrapper.className = 'event-teasers-wrapper';

  const slider = document.createElement('div');
  slider.className = 'event-teasers-slider';

  configs.forEach((cfg) => {
    const card = buildTeaserCard(cfg);
    slider.append(card);
  });

  // Navigation
  const prevBtn = buildNavigationButton('prev', 'Previous events');
  const nextBtn = buildNavigationButton('next', 'Next events');

  wrapper.append(prevBtn, slider, nextBtn);

  // Clean and inject
  block.textContent = '';
  block.append(wrapper);

  // Slider logic
  const getPageWidth = () => slider.getBoundingClientRect().width;
  const cardsPerPage = () => {
    if (window.innerWidth >= 1200) return 4;
    if (window.innerWidth >= 900) return 3;
    if (window.innerWidth >= 600) return 2;
    return 1;
  };

  let pageIndex = 0;
  const maxPage = () => Math.max(0, Math.ceil(configs.length / cardsPerPage()) - 1);

  const update = () => {
    const scrollTo = pageIndex * getPageWidth();
    slider.scrollTo({ left: scrollTo, behavior: 'smooth' });
    prevBtn.disabled = pageIndex === 0;
    nextBtn.disabled = pageIndex === maxPage();
  };

  prevBtn.addEventListener('click', () => {
    pageIndex = Math.max(0, pageIndex - 1);
    update();
  });
  nextBtn.addEventListener('click', () => {
    pageIndex = Math.min(maxPage(), pageIndex + 1);
    update();
  });

  // Swipe support
  let touchStartX = 0;
  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  });
  slider.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        pageIndex = Math.min(maxPage(), pageIndex + 1);
      } else {
        pageIndex = Math.max(0, pageIndex - 1);
      }
      update();
    }
  });

  window.addEventListener('resize', () => {
    // Reset page index when cards per page changes to keep slider in bounds
    pageIndex = Math.min(pageIndex, maxPage());
    update();
  });

  // Initial state
  update();
}

