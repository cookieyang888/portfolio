import { fetchJSON, renderProjects } from '../global.js?v=lab04-2';

const container = document.querySelector('.projects');
const title = document.querySelector('.projects-title');
const search = document.querySelector('.searchBar');
const reset = document.querySelector('#clear-filters');
const status = document.querySelector('#filter-status');
let projects = [];
let query = '';
// Store the year itself: slice indices change when a search removes years.
let selectedYear = null;
let d3;
let colors;

function searchProjects() {
    return projects.filter(project =>
        Object.values(project).join('\n').toLowerCase().includes(query.toLowerCase())
    );
}

function selectYear(year) {
    selectedYear = selectedYear === year ? null : year;
    update();
}

function renderPieChart(searchMatches) {
    const data = d3.rollups(searchMatches, values => values.length, project => String(project.year))
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => d3.descending(a.label, b.label));
    const svg = d3.select('#projects-pie-plot');
    const legend = d3.select('.legend');
    svg.selectAll('*').remove();
    legend.selectAll('*').remove();
    document.querySelector('.chart-empty').hidden = data.length > 0;
    svg.attr('aria-label', `Projects by year: ${searchMatches.length} search matches. Select a year to filter.`);
    const arc = d3.arc().innerRadius(0).outerRadius(50);
    const slices = d3.pie().sort(null).value(d => d.value)(data);
    slices.forEach(slice => {
        const { label, value } = slice.data;
        const selected = label === selectedYear;
        const description = `${label}: ${value} ${value === 1 ? 'project' : 'projects'}`;
        svg.append('path')
            .attr('d', arc(slice))
            .attr('fill', colors(label))
            .attr('class', selected ? 'selected' : null)
            .attr('tabindex', 0)
            .attr('role', 'button')
            .attr('aria-label', description)
            .attr('aria-pressed', String(selected))
            .on('click', () => selectYear(label))
            .on('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectYear(label);
                    // Rendering recreates paths; restore keyboard focus by year.
                    [...document.querySelectorAll('#projects-pie-plot path')]
                        .find(path => path.getAttribute('aria-label') === description)?.focus();
                }
            })
            .append('title').text(description);
        const item = legend.append('li').attr('class', selected ? 'legend-item selected' : 'legend-item')
            .style('--color', colors(label));
        const button = item.append('button').attr('type', 'button')
            .attr('aria-pressed', String(selected))
            .on('click', () => {
                selectYear(label);
                [...document.querySelectorAll('.legend button')]
                    .find(button => button.dataset.year === label)?.focus();
            }).attr('data-year', label);
        button.append('span').attr('class', 'swatch').attr('aria-hidden', 'true');
        button.append('span').text(label);
        button.append('em').text(`(${value})`);
    });
}

function update() {
    const matches = searchProjects();
    // Both handlers use this intersection, so neither filter overwrites the other.
    const visible = matches.filter(project => selectedYear === null || String(project.year) === selectedYear);
    renderProjects(visible, container, 'h2');
    title.textContent = `Projects (${visible.length})`;
    status.textContent = `Showing ${visible.length} of ${projects.length} projects${selectedYear ? ` · Year ${selectedYear}` : ''}${query ? ` · Search: “${query}”` : ''}`;
    reset.disabled = !query && selectedYear === null;
    // Keep all search-matching years available so users can switch years directly.
    renderPieChart(matches);
}

try {
    projects = await fetchJSON(new URL('../lib/projects.json', import.meta.url));
    // A failed CDN request still leaves the project list available.
    renderProjects(projects, container, 'h2');
    title.textContent = `Projects (${projects.length})`;
    d3 = await import('https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm');
    colors = d3.scaleOrdinal()
        .domain([...new Set(projects.map(project => String(project.year)))].sort().reverse())
        .range(d3.schemeTableau10);
    search.addEventListener('input', event => {
        query = event.target.value;
        update();
    });
    reset.addEventListener('click', () => {
        query = '';
        selectedYear = null;
        search.value = '';
        update();
        search.focus();
    });
    search.disabled = false;
    update();
} catch (error) {
    console.error('Could not initialize projects:', error);
    status.textContent = 'Interactive chart could not load. Please refresh to try again.';
    if (!projects.length) container.textContent = 'Projects could not be loaded. Please refresh to try again.';
}
