console.log('IT’S ALIVE!');

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

// The shared module lives in the website root, locally and on GitHub Pages.
const BASE_PATH = new URL('./', import.meta.url);
const pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'resume/', title: 'Resume' },
    { url: 'https://github.com/cookieyang888', title: 'GitHub' },
];

const nav = document.createElement('nav');
nav.setAttribute('aria-label', 'Main navigation');
document.body.prepend(nav);

// Treat /index.html and / as the same page.
function pagePath(pathname) {
    return pathname.replace(/\/index\.html$/, '/');
}

for (const page of pages) {
    const a = document.createElement('a');
    a.href = new URL(page.url, BASE_PATH);
    a.textContent = page.title;
    if (a.host === location.host && pagePath(a.pathname) === pagePath(location.pathname)) {
        a.classList.add('current');
        a.setAttribute('aria-current', 'page');
    }
    if (a.host !== location.host) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
    }
    nav.append(a);
}

document.body.insertAdjacentHTML('afterbegin', `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
`);

const select = document.querySelector('.color-scheme select');
const colorSchemes = ['light dark', 'light', 'dark'];
function setColorScheme(colorScheme) {
    const value = colorSchemes.includes(colorScheme) ? colorScheme : 'light dark';
    document.documentElement.style.setProperty('color-scheme', value);
    select.value = value;
}

// The switch still works when the browser blocks persistent storage.
try {
    setColorScheme(localStorage.getItem('colorScheme'));
} catch {
    setColorScheme('light dark');
}
select.addEventListener('input', (event) => {
    setColorScheme(event.target.value);
    try {
        localStorage.setItem('colorScheme', event.target.value);
    } catch {
        // This browser session can still use the selected theme.
    }
});

// Optional Step 5: preserve spaces and special characters in email drafts.
const form = document.querySelector('form[action^="mailto:"]');
form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const parameters = Array.from(data, ([name, value]) =>
        `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    ).join('&');
    location.href = `${form.action}?${parameters}`;
});

// Lab 4: shared data loading and project rendering.
export async function fetchJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch JSON (${response.status} ${response.statusText})`);
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
        throw error;
    }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    if (!(containerElement instanceof Element)) {
        throw new TypeError('A project container element is required.');
    }
    if (!Array.isArray(projects)) {
        throw new TypeError('Projects must be an array.');
    }
    if (!/^h[1-6]$/.test(headingLevel)) {
        throw new TypeError('Heading level must be h1 through h6.');
    }
    containerElement.replaceChildren();
    if (projects.length === 0) {
        containerElement.textContent = 'No projects to display yet.';
        return;
    }
    for (const project of projects) {
        const article = document.createElement('article');
        const heading = document.createElement(headingLevel);
        heading.textContent = project.title || 'Untitled project';
        const image = document.createElement('img');
        image.src = new URL(project.image || 'images/project-placeholder.svg', BASE_PATH);
        image.alt = `Illustration for ${heading.textContent}`;
        image.width = 640;
        image.height = 360;
        image.loading = 'lazy';
        const details = document.createElement('div');
        const description = document.createElement('p');
        description.textContent = project.description || 'Description coming soon.';
        const year = document.createElement('p');
        year.className = 'project-year';
        year.textContent = `${project.year ?? 'Year to be added'}${project.placeholder ? ' · Placeholder' : ''}`;
        details.append(description, year);
        if (project.url) {
            const link = document.createElement('a');
            link.href = project.url;
            link.textContent = project.linkLabel || 'View project';
            details.append(link);
        }
        article.append(heading, image, details);
        containerElement.append(article);
    }
}

export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${encodeURIComponent(username)}`);
}
