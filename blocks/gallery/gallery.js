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
  const videoId = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i);
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

// Carousel functionality
class GalleryCarousel {
  constructor(container, items) {
    this.container = container;
    this.items = items;
    this.currentIndex = 0;
    this.isTransitioning = false;
    this.touchStartX = 0;
    this.touchEndX = 0;

    this.init();
  }

  init() {
    this.createCarouselStructure();
    this.createNavigation();
    this.createThumbnails();
    this.bindEvents();
    this.updateActiveStates();
  }

  createCarouselStructure() {
    const carouselContainer = createTag('div', { class: 'gallery-carousel-container' });

    this.items.forEach((item, index) => {
      const carouselItem = createTag('div', { class: 'gallery-carousel-item' });
      carouselItem.appendChild(item.cloneNode(true));
      carouselItem.dataset.index = index;
      carouselContainer.appendChild(carouselItem);
    });

    this.container.appendChild(carouselContainer);
    this.carouselContainer = carouselContainer;
  }

  createNavigation() {
    const nav = createTag('div', { class: 'gallery-carousel-nav' });

    const prevBtn = createTag('button', {
      class: 'gallery-carousel-arrow',
      'aria-label': 'Previous item',
    });
    prevBtn.innerHTML = '‹';
    prevBtn.addEventListener('click', () => this.prev());

    const nextBtn = createTag('button', {
      class: 'gallery-carousel-arrow',
      'aria-label': 'Next item',
    });
    nextBtn.innerHTML = '›';
    nextBtn.addEventListener('click', () => this.next());

    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    this.container.appendChild(nav);

    this.prevBtn = prevBtn;
    this.nextBtn = nextBtn;
  }

  createThumbnails() {
    if (this.items.length <= 1) return;

    const thumbnailsContainer = createTag('div', { class: 'gallery-thumbnails' });

    this.items.forEach((item, index) => {
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

      thumbnail.addEventListener('click', () => this.goTo(index));
      thumbnail.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.goTo(index);
        }
      });

      thumbnailsContainer.appendChild(thumbnail);
    });

    this.container.appendChild(thumbnailsContainer);
    this.thumbnails = thumbnailsContainer.querySelectorAll('.gallery-thumbnail');
  }

  bindEvents() {
    // Touch events for swipe
    this.container.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    }, { passive: true });

    // Keyboard navigation
    this.container.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          this.prev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.next();
          break;
        case 'Home':
          e.preventDefault();
          this.goTo(0);
          break;
        case 'End':
          e.preventDefault();
          this.goTo(this.items.length - 1);
          break;
      }
    });

    // Auto-focus for accessibility
    this.container.setAttribute('tabindex', '0');
  }

  handleSwipe() {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }

  goTo(index) {
    if (this.isTransitioning || index === this.currentIndex) return;

    this.isTransitioning = true;
    this.currentIndex = index;

    const translateX = -index * 100;
    this.carouselContainer.style.transform = `translateX(${translateX}%)`;

    this.updateActiveStates();

    setTimeout(() => {
      this.isTransitioning = false;
    }, 300);
  }

  prev() {
    const newIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.items.length - 1;
    this.goTo(newIndex);
  }

  next() {
    const newIndex = this.currentIndex < this.items.length - 1 ? this.currentIndex + 1 : 0;
    this.goTo(newIndex);
  }

  updateActiveStates() {
    // Update button states
    this.prevBtn.disabled = this.currentIndex === 0;
    this.nextBtn.disabled = this.currentIndex === this.items.length - 1;

    // Update thumbnails
    if (this.thumbnails) {
      this.thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === this.currentIndex);
      });
    }

    // Update ARIA attributes
    this.container.setAttribute('aria-current', this.currentIndex + 1);
  }
}

// Main gallery decoration function
export default function decorate(block) {
  // Get gallery configuration from data attributes
  const galleryType = block.dataset.galleryType || 'grid';
  const elementsPerRow = block.dataset.elementsPerRow || '3';
  const jumpLinkLabel = block.dataset.jumpLinkLabel;
  const jumpLinkId = block.dataset.jumpLinkId;

  // Add main gallery class
  block.classList.add('gallery');
  block.classList.add(`gallery--${galleryType}`);

  // Add jump link if provided
  if (jumpLinkId && jumpLinkLabel) {
    const jumpLink = createTag('div', {
      class: 'gallery-jump-link',
      id: jumpLinkId,
      'aria-label': jumpLinkLabel,
    });
    block.appendChild(jumpLink);
  }

  // Process gallery items
  const items = Array.from(block.children).filter((child) =>
    child.classList.contains('galleryimage') ||
    child.classList.contains('galleryvideo') ||
    child.classList.contains('galleryembed'),
  );

  if (items.length === 0) {
    block.innerHTML = '<div class="gallery-loading">No gallery items found</div>';
    return;
  }

  // Process each item
  items.forEach((item) => {
    const itemType = item.classList.contains('galleryimage') ? 'image' :
      item.classList.contains('galleryvideo') ? 'video' : 'embed';

    processGalleryItem(item, itemType);
  });

  // Apply layout
  if (galleryType === 'carousel') {
    // Add grid class for carousel layout
    block.classList.add('gallery--cols-1');
    new GalleryCarousel(block, items);
  } else {
    // Grid layout
    block.classList.add(`gallery--cols-${elementsPerRow}`);

    // Remove any existing carousel-specific classes
    items.forEach((item) => {
      item.classList.remove('gallery-carousel-item');
    });
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
  }
}

function processImageItem(item) {
  const image = item.querySelector('img');
  const asset = item.dataset.asset;
  const alt = item.dataset.alt || '';
  const title = item.dataset.title || '';
  const caption = item.dataset.caption || '';
  const maintainAspectRatio = item.dataset.aspectRatio === 'true';

  if (image) {
    image.classList.add('gallery-image');
    if (maintainAspectRatio) {
      image.classList.add('gallery-image--aspect-ratio');
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

    item.appendChild(captionElement);
  }
}

function processVideoItem(item) {
  const video = item.querySelector('video');
  const videoAsset = item.dataset.videoAsset;
  const videoTitle = item.dataset.videoTitle || '';
  const videoDescription = item.dataset.videoDescription || '';
  const aspectRatio = item.dataset.aspectRatio || '16:9';

  if (video) {
    video.classList.add('gallery-video');
    video.classList.add(`gallery-video--${getAspectRatioClass(aspectRatio)}`);

    if (videoAsset) {
      const source = video.querySelector('source');
      if (source) {
        source.src = videoAsset;
      } else {
        const newSource = createTag('source', { src: videoAsset, type: 'video/mp4' });
        video.appendChild(newSource);
      }
    }

    // Add controls and other video attributes
    video.setAttribute('controls', '');
    video.setAttribute('preload', 'metadata');
  }

  // Create caption if provided
  if (videoTitle || videoDescription) {
    const captionElement = createTag('div', { class: 'gallery-caption' });

    if (videoTitle) {
      const titleElement = createTag('h3');
      titleElement.textContent = videoTitle;
      captionElement.appendChild(titleElement);
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
  const embedUrl = item.dataset.embedUrl;
  const embedTitle = item.dataset.embedTitle || '';
  const embedDescription = item.dataset.embedDescription || '';
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
      class: `gallery-embed gallery-embed--${getAspectRatioClass(aspectRatio)}`,
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