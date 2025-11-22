// Type definitions for Swiper 12.x (bundle)
// Project: https://swiperjs.com
// Definitions: local minimal typings for in-project usage

declare class Swiper {
  constructor(el: Element | string, options?: Swiper.Options);

  // Common instance fields (subset)
  readonly el: HTMLElement;
  readonly wrapperEl: HTMLElement;
  readonly slides: HTMLElement[];
  readonly activeIndex: number;
  readonly realIndex: number;
  readonly isBeginning: boolean;
  readonly isEnd: boolean;
  params: Swiper.Options;

  // Core API (subset used in project and commonly needed)
  update(): void;
  destroy(deleteInstance?: boolean, cleanStyles?: boolean): void;

  slideTo(index: number, speed?: number, runCallbacks?: boolean, internal?: boolean): boolean | void;
  slideNext(speed?: number, runCallbacks?: boolean, internal?: boolean): boolean | void;
  slidePrev(speed?: number, runCallbacks?: boolean, internal?: boolean): boolean | void;

  on(event: string, handler: (...args: any[]) => void): void;
  once(event: string, handler: (...args: any[]) => void): void;
  off(event: string, handler: (...args: any[]) => void): void;

  enable(): void;
  disable(): void;
  setProgress(progress: number, speed?: number): void;

  // Static helpers (subset)
  static use(modules: any[] | any): void;
  static extendDefaults(options: Partial<Swiper.Options>): void;
  static get defaults(): Swiper.Options;
}

declare namespace Swiper {
  type Direction = 'horizontal' | 'vertical';
  type Effect = 'slide' | 'fade' | 'cube' | 'coverflow' | 'flip' | 'cards' | 'creative';

  interface Options {
    // Core
    init?: boolean;
    direction?: Direction;
    initialSlide?: number;
    speed?: number;
    allowTouchMove?: boolean;
    cssMode?: boolean;
    oneWayMovement?: boolean;

    // Layout
    spaceBetween?: number;
    slidesPerView?: number | 'auto';
    centeredSlides?: boolean;
    slidesPerGroup?: number;

    // Looping / rewind
    loop?: boolean;
    loopAdditionalSlides?: number;
    rewind?: boolean;

    // Observers
    observer?: boolean;
    observeParents?: boolean;
    observeSlideChildren?: boolean;

    // Grid
    grid?: {
      rows: number;
      fill?: 'row' | 'column';
    };

    // Effects
    effect?: Effect;

    // Autoplay
    autoplay?: boolean | {
      enabled?: boolean;
      delay?: number;
      waitForTransition?: boolean;
      disableOnInteraction?: boolean;
      stopOnLastSlide?: boolean;
      reverseDirection?: boolean;
      pauseOnMouseEnter?: boolean;
    };

    // Pagination
    pagination?: {
      el: Element | string;
      type?: 'bullets' | 'fraction' | 'progressbar' | 'custom';
      clickable?: boolean;
      dynamicBullets?: boolean;
      renderBullet?: (index: number, className: string) => string;
      renderCustom?: (swiper: Swiper, current: number, total: number) => string;
    };

    // Navigation
    navigation?: {
      nextEl: Element | string;
      prevEl: Element | string;
      disabledClass?: string;
      hiddenClass?: string;
      lockClass?: string;
    };

    // Scrollbar
    scrollbar?: {
      el: Element | string;
      draggable?: boolean;
      hide?: boolean;
      snapOnRelease?: boolean;
    };

    // A11y / input
    a11y?: { enabled?: boolean } | boolean;
    keyboard?: { enabled?: boolean; onlyInViewport?: boolean; pageUpDown?: boolean } | boolean;
    mousewheel?: { enabled?: boolean } | boolean;

    // Free mode
    freeMode?: boolean | {
      enabled?: boolean;
      momentum?: boolean;
      sticky?: boolean;
    };

    // Virtual slides
    virtual?: {
      enabled?: boolean;
      slides?: any[];
      addSlidesBefore?: number;
      addSlidesAfter?: number;
      cache?: boolean;
      renderSlide?: (slide: any, index: number) => string | Element;
    };

    // Events (loose typing)
    on?: { [event: string]: (...args: any[]) => void };
  }
}

export = Swiper;
export as namespace Swiper;
export default Swiper;


