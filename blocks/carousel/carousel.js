import { fetchPlaceholders, createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

function updateActiveSlide(slide) {
  const block = slide.closest('.carousel');
  const slideIndex = parseInt(slide.dataset.slideIndex, 10);
  block.dataset.activeSlide = slideIndex;

  const slides = block.querySelectorAll('.carousel-slide');
  slides.forEach((aSlide, idx) => {
    const isActive = idx === slideIndex;
    aSlide.setAttribute('aria-hidden', !isActive);
    aSlide.querySelectorAll('a').forEach((link) => {
      link.setAttribute('tabindex', isActive ? '' : '-1');
    });
  });

  const indicators = block.querySelectorAll('.carousel-slide-indicator');
  indicators.forEach((indicator, idx) => {
    const button = indicator.querySelector('button');
    if (idx === slideIndex) {
      button.setAttribute('disabled', 'true');
    } else {
      button.removeAttribute('disabled');
    }
  });
}

function showSlide(block, slideIndex = 0) {
  const slides = block.querySelectorAll('.carousel-slide');
  let realSlideIndex = slideIndex;
  if (slideIndex < 0) {
    realSlideIndex = slides.length - 1;
  } else if (slideIndex >= slides.length) {
    realSlideIndex = 0;
  }
  const activeSlide = slides[realSlideIndex];

  const slidesWrapper = block.querySelector('.carousel-slides');
  const slideWidth = activeSlide.offsetWidth;
  const translateX = -(realSlideIndex * slideWidth);

  activeSlide.querySelectorAll('a').forEach((link) => link.removeAttribute('tabindex'));
  slidesWrapper.style.transform = `translateX(${translateX}px)`;
}

function createButtonEffect(button) {
  button.style.transform = 'scale(0.95)';
  setTimeout(() => {
    button.style.transform = 'scale(1)';
  }, 150);
}

function bindEvents(block) {
  const slideIndicators = block.querySelector('.carousel-slide-indicators');
  if (!slideIndicators) return;

  slideIndicators.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const slideIndicator = e.currentTarget.parentElement;
      const targetSlide = parseInt(slideIndicator.dataset.targetSlide, 10);
      createButtonEffect(button);
      showSlide(block, targetSlide);
    });
  });

  const prevButton = block.querySelector('.slide-prev');
  const nextButton = block.querySelector('.slide-next');

  if (prevButton) {
    prevButton.addEventListener('click', (e) => {
      e.preventDefault();
      createButtonEffect(prevButton);
      const current = parseInt(block.dataset.activeSlide, 10);
      const slides = block.querySelectorAll('.carousel-slide');
      const newIndex = (current - 1 + slides.length) % slides.length;
      showSlide(block, newIndex);
    });
  }

  if (nextButton) {
    nextButton.addEventListener('click', (e) => {
      e.preventDefault();
      createButtonEffect(nextButton);
      const current = parseInt(block.dataset.activeSlide, 10);
      const slides = block.querySelectorAll('.carousel-slide');
      const newIndex = (current + 1) % slides.length;
      showSlide(block, newIndex);
    });
  }

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
        setTimeout(() => {
          updateActiveSlide(entry.target);
        }, 50);
      }
    });
  }, {
    threshold: [0.3, 0.5, 0.7],
    rootMargin: '0px -10% 0px -10%',
  });

  block.querySelectorAll('.carousel-slide').forEach((slide) => {
    slideObserver.observe(slide);
  });
}

function createSlide(row, slideIndex, carouselId) {
  const hasImage = row.querySelector('picture') !== null;
  if (!hasImage) {
    const content = document.createElement('div');
    content.classList.add('carousel-content');
    moveInstrumentation(row, content);

    [...row.children].forEach((div) => {
      content.append(div.cloneNode(true));
    });

    row.querySelectorAll('.carit, .card').forEach((item) => {
      content.append(item.cloneNode(true));
    });

    return content;
  }

  const slide = document.createElement('li');
  slide.dataset.slideIndex = slideIndex;
  slide.setAttribute('id', `carousel-${carouselId}-slide-${slideIndex}`);
  slide.classList.add('carousel-slide');

  moveInstrumentation(row, slide);

  let slideLink = null;
  const firstLink = row.querySelector('a');
  if (firstLink) {
    slideLink = document.createElement('a');
    slideLink.href = firstLink.href;
  }

  [...row.children].forEach((div) => {
    const divClone = div.cloneNode(true);
    if (divClone.children.length === 1 && divClone.querySelector('picture')) {
      divClone.className = 'carousel-slide-image';
    } else {
      divClone.className = 'carousel-slide-content';
      const primaryButtonText = row.querySelector('.primary_button_text');
      const primaryButtonLink = row.querySelector('.primary_button_link');
      const secondaryButtonText = row.querySelector('.secondary_button_text');
      const secondaryButtonLink = row.querySelector('.secondary_button_link');

      if ((primaryButtonText && primaryButtonLink)
        || (secondaryButtonText && secondaryButtonLink)) {
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'carousel-buttons';

        if (primaryButtonText && primaryButtonLink) {
          const primaryButton = document.createElement('a');
          primaryButton.href = primaryButtonLink.textContent;
          primaryButton.textContent = primaryButtonText.textContent;
          primaryButton.className = 'button primary';
          buttonsContainer.appendChild(primaryButton);
        }

        if (secondaryButtonText && secondaryButtonLink) {
          const secondaryButton = document.createElement('a');
          secondaryButton.href = secondaryButtonLink.textContent;
          secondaryButton.textContent = secondaryButtonText.textContent;
          secondaryButton.className = 'button secondary';
          buttonsContainer.appendChild(secondaryButton);
        }

        divClone.appendChild(buttonsContainer);
      }

      const hasTextContent = divClone.textContent.trim() !== '';
      const hasButtons = divClone.querySelector('.carousel-buttons') !== null;

      if (!hasTextContent && !hasButtons) {
        return;
      }
    }

    if (divClone.querySelector('a')) {
      divClone.querySelector('a').remove();
    }
    slide.append(divClone);
  });

  row.querySelectorAll('.carit, .card').forEach((item) => {
    slide.append(item.cloneNode(true));
  });

  if (slideLink) {
    slideLink.append(slide);
    return slideLink;
  }
  return slide;
}

let carouselId = 0;
export default async function decorate(block) {
  carouselId += 1;
  block.setAttribute('id', `carousel-${carouselId}`);
  block.classList.add('loading');

  const rows = block.querySelectorAll(':scope > div');
  const slidesWithImages = [...rows].filter((row) => row.querySelector('picture'));
  const isSingleSlide = slidesWithImages.length < 2;

  const placeholders = await fetchPlaceholders();
  block.setAttribute('role', 'region');
  block.setAttribute('aria-roledescription', placeholders.carousel || 'Carousel');

  const container = document.createElement('div');
  container.classList.add('carousel-slides-container');

  const slidesWrapper = document.createElement('ul');
  slidesWrapper.classList.add('carousel-slides');
  block.prepend(slidesWrapper);

  let slideIndicators;
  let slideIndex = 0;

  if (!isSingleSlide) {
    const slideIndicatorsNav = document.createElement('nav');
    slideIndicatorsNav.setAttribute('aria-label', placeholders.carouselSlideControls || 'Carousel Slide Controls');
    slideIndicators = document.createElement('ol');
    slideIndicators.classList.add('carousel-slide-indicators');
    slideIndicatorsNav.append(slideIndicators);
    block.append(slideIndicatorsNav);

    const slideNavButtons = document.createElement('div');
    slideNavButtons.classList.add('carousel-navigation-buttons');
    const prevLabel = placeholders.previousSlide || 'Previous Slide';
    const nextLabel = placeholders.nextSlide || 'Next Slide';
    slideNavButtons.innerHTML = `
      <button type="button" class="slide-prev" aria-label="${prevLabel}"></button>
      <button type="button" class="slide-next" aria-label="${nextLabel}"></button>
    `;
    container.append(slideNavButtons);
  }

  rows.forEach((row) => {
    const element = createSlide(row, slideIndex, carouselId);
    if (element.classList.contains('carousel-slide')) {
      slidesWrapper.append(element);
      if (slideIndicators) {
        const indicator = document.createElement('li');
        indicator.classList.add('carousel-slide-indicator');
        indicator.dataset.targetSlide = slideIndex;
        const buttonLabel = `${placeholders.showSlide || 'Show Slide'} ${slideIndex + 1} ${placeholders.of || 'of'} ${slidesWithImages.length}`;
        indicator.innerHTML = `<button type="button" aria-label="${buttonLabel}"></button>`;
        slideIndicators.append(indicator);
      }
      slideIndex += 1;
    } else {
      block.append(element);
    }
  });

  block.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });

  rows.forEach((row) => row.remove());
  container.append(slidesWrapper);
  block.prepend(container);

  setTimeout(() => {
    block.classList.remove('loading');
    block.classList.add('loaded');
  }, 100);

  if (!isSingleSlide) {
    setTimeout(() => {
      bindEvents(block);
    }, 200);
  }
}
