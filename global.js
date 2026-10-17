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
