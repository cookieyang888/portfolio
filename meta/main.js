import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

function processCommits(data) {
  return d3.groups(data, d => d.commit).map(([id, lines]) => {
    const { author, date, time, timezone, datetime } = lines[0];
    const commit = {
      id, author, date, time, timezone, datetime,
      url: `https://github.com/cookieyang888/portfolio/commit/${id}`,
      hourFrac: datetime.getHours() + datetime.getMinutes() / 60 + datetime.getSeconds() / 3600,
      totalLines: lines.length,
    };
    Object.defineProperty(commit, 'lines', { value: lines, enumerable: false });
    return commit;
  });
}

function renderCommitInfo(data, commits) {
  const files = d3.rollups(data, rows => rows.length, d => d.file);
  const stats = [
    ['Lines of code', d3.format(',')(data.length)],
    ['Commits represented', commits.length],
    ['Files', files.length],
    ['Longest file', `${d3.max(files, d => d[1])} lines`],
    ['Average line length', `${d3.mean(data, d => d.length).toFixed(1)} characters`],
    ['Maximum indentation', `${d3.max(data, d => d.depth)} levels`],
  ];
  const container = d3.select('#stats').text('');
  const dl = container.append('dl').attr('class', 'meta-stats');
  for (const [label, value] of stats) {
    const item = dl.append('div');
    item.append('dt').text(label);
    item.append('dd').text(value);
  }
}

const tooltip = document.querySelector('#commit-tooltip');
function hideTooltip() { tooltip.hidden = true; }
function showTooltip(event, commit) {
  const link = document.querySelector('#commit-link');
  link.href = commit.url;
  link.textContent = commit.id;
  document.querySelector('#commit-date').textContent = commit.datetime.toLocaleDateString('en', { dateStyle: 'medium' });
  document.querySelector('#commit-time').textContent = commit.datetime.toLocaleTimeString('en', { timeStyle: 'short' });
  document.querySelector('#commit-author').textContent = commit.author;
  document.querySelector('#commit-lines').textContent = commit.totalLines;
  tooltip.hidden = false;
  positionTooltip(event);
}
function positionTooltip(event) {
  const bounds = event.currentTarget.getBoundingClientRect();
  const x = Number.isFinite(event.clientX) ? event.clientX : bounds.right;
  const y = Number.isFinite(event.clientY) ? event.clientY : bounds.top;
  tooltip.style.left = `${Math.max(8, Math.min(x + 14, innerWidth - tooltip.offsetWidth - 8))}px`;
  tooltip.style.top = `${Math.max(8, Math.min(y + 14, innerHeight - tooltip.offsetHeight - 8))}px`;
}

function renderScatterPlot(commits) {
  const width = 1000, height = 560;
  const area = { left: 66, right: 966, top: 30, bottom: 498 };
  let [start, end] = d3.extent(commits, d => d.datetime);
  if (+start === +end) {
    start = new Date(+start - 86400000);
    end = new Date(+end + 86400000);
  }
  const x = d3.scaleTime().domain([start, end]).nice().range([area.left + 25, area.right - 25]);
  const y = d3.scaleLinear().domain([0, 24]).range([area.bottom, area.top]);
  // Starting at zero keeps circle area exactly proportional to the line count.
  const radius = d3.scaleSqrt().domain([0, d3.max(commits, d => d.totalLines)]).range([0, 25]);
  const svg = d3.select('#chart').append('svg').attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'group').attr('aria-labelledby', 'chart-heading').attr('aria-describedby', 'chart-help');
  svg.append('g').attr('class', 'meta-grid').attr('transform', `translate(${area.left},0)`)
    .call(d3.axisLeft(y).ticks(8).tickSize(-(area.right - area.left)).tickFormat(''));
  svg.append('g').attr('transform', `translate(0,${area.bottom})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%b %d')));
  svg.append('g').attr('transform', `translate(${area.left},0)`)
    .call(d3.axisLeft(y).ticks(8).tickFormat(d => `${String(d).padStart(2, '0')}:00`));
  svg.append('text').attr('x', (area.left + area.right) / 2).attr('y', height - 12).attr('text-anchor', 'middle').text('Commit date');
  svg.append('text').attr('transform', 'rotate(-90)').attr('x', -(area.top + area.bottom) / 2)
    .attr('y', 16).attr('text-anchor', 'middle').text('Time of day');

  const brushLayer = svg.append('g').attr('class', 'commit-brush');
  const circles = svg.append('g').attr('class', 'commit-dots').selectAll('circle')
    .data(d3.sort(commits, d => -d.totalLines)).join('circle')
    .attr('cx', d => x(d.datetime)).attr('cy', d => y(d.hourFrac))
    .attr('r', d => radius(d.totalLines)).attr('tabindex', 0).attr('role', 'link')
    .attr('aria-label', d => `Commit ${d.id}, ${d.datetime.toLocaleString('en')}, ${d.totalLines} lines, by ${d.author}`)
    .on('mouseenter focus', showTooltip).on('mousemove', positionTooltip)
    .on('mouseleave blur', hideTooltip)
    .on('click', (_, d) => window.open(d.url, '_blank', 'noopener,noreferrer'))
    .on('keydown', (event, d) => {
      if (event.key === 'Enter') window.open(d.url, '_blank', 'noopener,noreferrer');
      if (event.key === 'Escape') hideTooltip();
    });
  const clear = document.querySelector('#clear-selection');
  function brushed({ selection }) {
    hideTooltip();
    const selected = selection ? commits.filter(d => {
      const [[x0, y0], [x1, y1]] = selection;
      return x(d.datetime) >= x0 && x(d.datetime) <= x1 && y(d.hourFrac) >= y0 && y(d.hourFrac) <= y1;
    }) : [];
    const ids = new Set(selected.map(d => d.id));
    circles.classed('selected', d => ids.has(d.id)).classed('muted', d => !!selection && !ids.has(d.id));
    clear.disabled = !selection;
    document.querySelector('#selection-count').textContent = selection
      ? `${selected.length} of ${commits.length} commits selected` : 'No commits selected';
    const dl = d3.select('#language-breakdown').text('');
    const lines = selected.flatMap(d => d.lines);
    for (const [language, count] of d3.rollups(lines, rows => rows.length, d => d.type).sort((a, b) => b[1] - a[1])) {
      dl.append('dt').text(language.toUpperCase());
      dl.append('dd').text(`${count} lines (${d3.format('.1%')(count / lines.length)})`);
    }
  }
  const brush = d3.brush().extent([[area.left, area.top], [area.right, area.bottom]])
    .on('start brush end', brushed);
  brushLayer.call(brush);
  clear.addEventListener('click', () => brushLayer.call(brush.move, null));
  svg.on('keydown', event => { if (event.key === 'Escape') brushLayer.call(brush.move, null); });
}

try {
  const data = await d3.csv('loc.csv', row => ({
    ...row, line: Number(row.line), depth: Number(row.depth), length: Number(row.length),
    date: new Date(`${row.date}T00:00${row.timezone}`), datetime: new Date(row.datetime),
  }));
  if (!data.length) throw new Error('No code data found. Run npm run analyze to generate loc.csv.');
  const commits = processCommits(data);
  renderCommitInfo(data, commits);
  renderScatterPlot(commits);
} catch (error) {
  document.querySelector('#stats').textContent = `Unable to load code statistics: ${error.message}`;
  console.error(error);
}
