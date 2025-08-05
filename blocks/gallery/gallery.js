import { createTag } from '../helpers.js';

// Utility functions
function getAspectRatioClass(ratio) {
  const ratioMap = {
    '16:9': '16-9',
    '4:3': '4-3',
    '16:10': '16-10',
    '16:5': '16-5',
  };
  return ratioMap[ratio] || '16-9';
}

function createYouTubeEmbed(url) {
  const videoId = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i,
  );
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId[1]}?rel=0&showinfo=0`;
  }
  return url;
}

function createVimeoEmbed(url) {
  const videoId = url.match(/vimeo\.com\/([0-9]+)/i);
  if (videoId) {
    return `https://player.vimeo.com/video/${videoId[1]}?title=0&byline=0&portrait=0`;
  }
  return url;
}

// Process gallery item functions
function processImageItem(item) {
  const div = document.createElement('div');
  div.classList.add('gallery-image-container');
  item.appendChild(div);
  const image = item.querySelector('img');

  const {
    asset,
    alt = item?.children[1]?.textContent.trim(),
    title = item?.children[2]?.textContent.trim(),
    caption = item?.children[3]?.textContent.trim(),
  } = image.dataset;
  const maintainAspectRatio = item.dataset.aspectRatio === 'true';
  div.appendChild(image);

  if (image) {
    image.classList.add('gallery-image');
    if (maintainAspectRatio) {
      image.classList.add('gallery-image-aspect-ratio');
    }

    if (asset) {
      image.src = asset;
    }

    if (alt) {
      image.alt = alt;
    }
  }

  // Create caption if provided
  if (title || caption) {
    const captionElement = createTag('div', { class: 'gallery-caption' });

    if (title) {
      const titleElement = createTag('h3');
      titleElement.textContent = title;
      captionElement.appendChild(titleElement);
    }

    if (caption) {
      const captionText = createTag('p');
      captionText.innerHTML = caption;
      captionElement.appendChild(captionText);
    }

    item.querySelectorAll('div').forEach((divContainer) => {
      if (!divContainer.classList.contains('gallery-image-container')
        && !divContainer.classList.contains('gallery-caption')
      ) {
        divContainer.remove();
      }
    });

    item.appendChild(captionElement);
  }
}

function processVideoItem(item) {
  // Find the nested structure elements
  const link = item.querySelector('a');
  const titleElement = item.querySelector('p:nth-child(2)'); // Second p element
  const descriptionElement = item.querySelector('p:nth-child(3)'); // Third p element
  const aspectRatioElement = item.querySelector('div > div:last-child p'); // Last p in nested div

  // Extract values
  const videoUrl = link?.href || '';
  const videoTitle = titleElement?.textContent?.trim() || '';
  const videoDescription = descriptionElement?.textContent?.trim() || '';
  const aspectRatio = aspectRatioElement?.textContent?.trim() || '16:9';

  if (videoUrl) {
    // Remove existing content
    item.innerHTML = '';

    // Create video element
    const video = createTag('video', {
      class: `gallery-video gallery-video-${getAspectRatioClass(aspectRatio)}`,
      controls: '',
      preload: 'metadata',
    });

    // Create source element
    const source = createTag('source', {
      src: videoUrl,
      type: 'video/mp4',
    });

    video.appendChild(source);
    item.appendChild(video);
  }

  // Create caption if provided
  if (videoTitle || videoDescription) {
    const captionElement = createTag('div', { class: 'gallery-caption' });

    if (videoTitle) {
      const titleHeading = createTag('h3');
      titleHeading.textContent = videoTitle;
      captionElement.appendChild(titleHeading);
    }

    if (videoDescription) {
      const descElement = createTag('p');
      descElement.innerHTML = videoDescription;
      captionElement.appendChild(descElement);
    }

    item.appendChild(captionElement);
  }
}

function processEmbedItem(item) {
  const { embedUrl, embedTitle = '', embedDescription = '' } = item.dataset;
  const aspectRatio = item.dataset.aspectRatio || '16:9';

  if (embedUrl) {
    let processedUrl = embedUrl;

    // Process different embed types
    if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
      processedUrl = createYouTubeEmbed(embedUrl);
    } else if (embedUrl.includes('vimeo.com')) {
      processedUrl = createVimeoEmbed(embedUrl);
    }

    const iframe = createTag('iframe', {
      src: processedUrl,
      class: `gallery-embed gallery-embed-${getAspectRatioClass(aspectRatio)}`,
      frameborder: '0',
      allowfullscreen: '',
      loading: 'lazy',
    });

    // Clear existing content and add iframe
    item.innerHTML = '';
    item.appendChild(iframe);
  }

  // Create caption if provided
  if (embedTitle || embedDescription) {
    const captionElement = createTag('div', { class: 'gallery-caption' });

    if (embedTitle) {
      const titleElement = createTag('h3');
      titleElement.textContent = embedTitle;
      captionElement.appendChild(titleElement);
    }

    if (embedDescription) {
      const descElement = createTag('p');
      descElement.innerHTML = embedDescription;
      captionElement.appendChild(descElement);
    }

    item.appendChild(captionElement);
  }
}

function processGalleryItem(item, type) {
  item.classList.add('gallery-item');

  switch (type) {
    case 'image':
      processImageItem(item);
      break;
    case 'video':
      processVideoItem(item);
      break;
    case 'embed':
      processEmbedItem(item);
      break;
    default:
      break;
  }
}

// Carousel functionality
function createGalleryCarousel(container, items) {
  let currentIndex = 0;
  let isTransitioning = false;
  let touchStartX = 0;
  let touchEndX = 0;
  let carouselContainer;
  let prevBtn;
  let nextBtn;
  let thumbnails;

  // Function declarations (hoisted)
  function updateActiveStates() {
    // Update button states
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === items.length - 1;

    // Update thumbnails
    if (thumbnails) {
      thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentIndex);
      });
    }

    // Update ARIA attributes
    container.setAttribute('aria-current', currentIndex + 1);
  }

  function goTo(index) {
    if (isTransitioning || index === currentIndex) return;

    isTransitioning = true;
    currentIndex = index;

    const translateX = -index * 100;
    carouselContainer.style.transform = `translateX(${translateX}%)`;

    updateActiveStates();

    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }

  function prev() {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
    goTo(newIndex);
  }

  function next() {
    const newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
    goTo(newIndex);
  }

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        next();
      } else {
        prev();
      }
    }
  }

  function createCarouselStructure() {
    carouselContainer = createTag('div', { class: 'gallery-carousel-container' });

    items.forEach((item, index) => {
      const carouselItem = createTag('div', { class: 'gallery-carousel-item' });
      carouselItem.appendChild(item.cloneNode(true));
      carouselItem.dataset.index = index;
      carouselContainer.appendChild(carouselItem);
    });

    container.textContent = '';

    container.appendChild(carouselContainer);
  }

  function createNavigation() {
    const nav = createTag('div', { class: 'gallery-carousel-nav' });

    prevBtn = createTag('button', {
      class: 'gallery-carousel-arrow',
      'aria-label': 'Previous item',
    });
    prevBtn.innerHTML = '‹';
    prevBtn.addEventListener('click', () => prev());

    nextBtn = createTag('button', {
      class: 'gallery-carousel-arrow',
      'aria-label': 'Next item',
    });
    nextBtn.innerHTML = '›';
    nextBtn.addEventListener('click', () => next());

    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    container.appendChild(nav);
  }

  function createThumbnails() {
    if (items.length <= 1) return;

    const thumbnailsContainer = createTag('div', { class: 'gallery-thumbnails' });

    items.forEach((item, index) => {
      const thumbnail = createTag('div', {
        class: 'gallery-thumbnail',
        'aria-label': `Go to item ${index + 1}`,
      });

      const img = item.querySelector('img');
      if (img) {
        const thumbnailImg = createTag('img', {
          src: img.src,
          alt: img.alt || `Thumbnail ${index + 1}`,
        });
        thumbnail.appendChild(thumbnailImg);
      }

      thumbnail.addEventListener('click', () => goTo(index));
      thumbnail.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goTo(index);
        }
      });

      thumbnailsContainer.appendChild(thumbnail);
    });

    container.appendChild(thumbnailsContainer);
    thumbnails = thumbnailsContainer.querySelectorAll('.gallery-thumbnail');
  }

  function bindEvents() {
    // Touch events for swipe
    container.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
      },
      { passive: true },
    );

    container.addEventListener(
      'touchend',
      (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
      },
      { passive: true },
    );

    // Keyboard navigation
    container.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          prev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          next();
          break;
        case 'Home':
          e.preventDefault();
          goTo(0);
          break;
        case 'End':
          e.preventDefault();
          goTo(items.length - 1);
          break;
        default:
          break;
      }
    });

    // Auto-focus for accessibility
    container.setAttribute('tabindex', '0');
  }

  // Initialize carousel
  createCarouselStructure();
  createNavigation();
  createThumbnails();
  bindEvents();
  updateActiveStates();

  // Return public methods if needed
  return {
    goTo,
    prev,
    next,
  };
}

// Main gallery decoration function
export default function decorate(block) {
  // Get gallery configuration from first three children
  const configChildren = Array.from(block.children).slice(0, 3);
  const galleryItems = Array.from(block.children).slice(3);

  // Extract configuration from first three children
  const galleryType = configChildren[0]?.textContent?.trim() || 'grid';
  const elementsPerRow = configChildren[1]?.textContent?.trim() || '3';
  const jumpLinkLabel = configChildren[2]?.textContent?.trim() || '';
  const jumpLinkId = configChildren[2]?.dataset?.id || '';

  // Add main gallery class
  block.classList.add('gallery');
  block.classList.add(`gallery-${galleryType}`);

  // Add jump link if provided
  if (jumpLinkId && jumpLinkLabel) {
    const jumpLink = createTag('div', {
      class: 'gallery-jump-link',
      id: jumpLinkId,
      'aria-label': jumpLinkLabel,
    });
    block.appendChild(jumpLink);
  }

  // Remove the config children from DOM
  configChildren.forEach((child) => child.remove());

  if (galleryItems.length === 0) {
    block.innerHTML = '<div class="gallery-loading">No gallery items found</div>';
    return;
  }

  // Process each item
  galleryItems.forEach((item) => {
    let itemType;
    if (item.querySelector('img')) {
      itemType = 'image';
    } else if (item.querySelector('a[href$=".mp4"]')) {
      itemType = 'video';
    } else if (item.querySelector('iframe')) {
      itemType = 'embed';
    } else {
      // Skip items that don't contain expected elements
      return;
    }

    processGalleryItem(item, itemType);
  });

  // Apply layout
  if (galleryType === 'carousel') {
    // Add grid class for carousel layout
    block.classList.add('gallery-cols-1');
    const carousel = createGalleryCarousel(block, galleryItems);
    // Store reference to prevent garbage collection
    block.galleryCarousel = carousel;
  } else {
    // Grid layout
    block.classList.add(`gallery-cols-${elementsPerRow}`);

    // Remove any existing carousel-specific classes
    galleryItems.forEach((item) => {
      item.classList.remove('gallery-carousel-item');
    });
  }
}
