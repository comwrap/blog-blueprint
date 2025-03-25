import {
  getCurrentCountryLanguage,
} from '../helpers.js';

export default async function decorate(block) {
  const [currentCountry, currentLanguage] = getCurrentCountryLanguage();
  const response = await fetch(`/${currentCountry}-${currentLanguage}/query-index.json`);
  const articles = await response.json();

  const container = document.createElement('div');
  container.classList.add('article-container');
  const blogArticles = articles.data.filter((article) => {
    const { path } = article;
    return path.includes(`/${currentCountry}-${currentLanguage}/`)
      && !path.includes('/index')
      && !path.includes('/nav')
      && !path.includes('/footer');
  });
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
    block.replaceChildren(container);
  });
}
