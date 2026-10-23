import { fetchJSON, renderProjects } from '../global.js';

const container = document.querySelector('.projects');
const title = document.querySelector('.projects-title');
try {
    const projects = await fetchJSON(new URL('../lib/projects.json', import.meta.url));
    renderProjects(projects, container, 'h2');
    title.textContent = `Projects (${projects.length})`;
} catch {
    container.textContent = 'Projects could not be loaded. Please refresh to try again.';
}
