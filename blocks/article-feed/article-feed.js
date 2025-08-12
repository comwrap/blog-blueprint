import {
  getCurrentCountryLanguage,
} from '../helpers.js';

function normalizePath(path) {
  if (!path) return '';
  let p = path.trim();
  p = p.replace(/\.?html?$/i, '');
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
  return p;
}

function getCell(block, index) {
  return block && block.children && block.children[index] ? block.children[index] : null;
}

function getTextValue(block, index) {
  const cell = getCell(block, index);
  if (!cell) return '';
  const deepest = cell.querySelector('*:not(:has(*))');
  return (deepest ? deepest.textContent : cell.textContent).trim();
}

function getLinksFromCell(block, index) {
  const cell = getCell(block, index);
  if (!cell) return [];
  const anchors = Array.from(cell.querySelectorAll('a'));
  return anchors.map((a) => a.getAttribute('href')).filter(Boolean);
}

function parseSelectedTags(raw) {
  if (!raw) return [];
  // Support comma or semicolon separated tags; trim and lowercase for matching
  return raw
    .split(/[,;\n]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default async function decorate(block) {
  // Model mapping (by column index):
  // 0: articlefeed-type (select: parent_page | individual_pages | tag)
  // 1: parent-page-link (aem-content)
  // 2: individual-pages-link (aem-content, potentially multiple links)
  // 3: tag (aem-tag)
  console.log('block', block);
  const type = getTextValue(block, 0) || 'parent_page';
  const parentPageHref = getLinksFromCell(block, 1)[0] || '';
  const individualLinks = getLinksFromCell(block, 2);
  const rawTagValue = getTextValue(block, 3);
  const selectedTags = parseSelectedTags(rawTagValue);

  const [currentCountry, currentLanguage] = getCurrentCountryLanguage();
  let response = await fetch('/query-index.json');
  if (currentCountry && currentLanguage) {
    response = await fetch(`/${currentCountry}-${currentLanguage}/query-index.json`);
  }
  const articles = await response.json();

  const parentPath = normalizePath(parentPageHref);
  const individualPaths = new Set(individualLinks.map(normalizePath));
  const selectedTagsNormalized = selectedTags.map((t) => t.toLowerCase());

  const container = document.createElement('div');
  container.classList.add('article-container');

  const shouldInclude = (article) => {
    const { path, title } = article;
    const normalizedPath = normalizePath(path);
    // Exclusions common to all modes
    if (title && title.includes('Index')) return false;
    if (normalizedPath.includes('/nav')) return false;
    if (normalizedPath.includes('/footer')) return false;

    if (type === 'individual_pages') {
      return individualPaths.size > 0 && individualPaths.has(normalizedPath);
    }

    if (type === 'tag') {
      if (!selectedTagsNormalized.length) return false;
      let articleTags = [];
      if (Array.isArray(article.tags)) {
        articleTags = article.tags;
      } else if (typeof article.tags === 'string') {
        articleTags = article.tags.split(/[;,]/).map((t) => t.trim()).filter(Boolean);
      }
      const articleTagsNormalized = articleTags.map((t) => t.toLowerCase());
      return selectedTagsNormalized.some((t) => articleTagsNormalized.includes(t));
    }

    // default: parent_page
    if (!parentPath) return false;
    return (
      normalizedPath.startsWith(parentPath)
      && normalizedPath !== parentPath
    );
  };

  const blogArticles = (articles.data || []).filter(shouldInclude);

  blogArticles.forEach((article) => {
    const articleLink = document.createElement('a');
    articleLink.href = article.path;
    const articleElement = document.createElement('article');
    articleElement.classList.add('article');
    articleLink.appendChild(articleElement);

    if (article.image) {
      const image = document.createElement('img');
      image.src = article.image;
      image.alt = article.title;
      articleElement.appendChild(image);
    }

    const articleBody = document.createElement('div');
    articleBody.classList.add('article-body');
    articleElement.appendChild(articleBody);

    const title = document.createElement('p');
    title.classList.add('article-title');
    title.textContent = article.title;
    articleBody.appendChild(title);

    if (article.content) {
      const content = document.createElement('p');
      content.classList.add('description');
      content.textContent = article.content;
      articleBody.appendChild(content);
    }

    const readMoreButton = document.createElement('a');
    readMoreButton.classList.add('button', 'primary');
    readMoreButton.textContent = 'Read more';
    readMoreButton.href = article.path;
    articleBody.appendChild(readMoreButton);

    container.appendChild(articleLink);
  });

  block.textContent = '';
  block.append(container);
}
