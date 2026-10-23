import { fetchJSON, renderProjects, fetchGitHubData } from './global.js?v=lab04-2';

async function loadLatestProjects() {
    const container = document.querySelector('.projects');
    try {
        const projects = await fetchJSON(new URL('./lib/projects.json', import.meta.url));
        renderProjects(projects.slice(0, 3), container, 'h3');
    } catch {
        container.textContent = 'Projects could not be loaded. Please refresh to try again.';
    }
}

async function loadProfileStats() {
    const profileStats = document.querySelector('#profile-stats');
    if (!profileStats) return;
    try {
        const githubData = await fetchGitHubData('cookieyang888');
        profileStats.innerHTML = `
            <dl>
                <dt>Public Repos</dt><dd>${githubData.public_repos}</dd>
                <dt>Public Gists</dt><dd>${githubData.public_gists}</dd>
                <dt>Followers</dt><dd>${githubData.followers}</dd>
                <dt>Following</dt><dd>${githubData.following}</dd>
            </dl>
        `;
    } catch {
        profileStats.textContent = 'GitHub statistics are temporarily unavailable. Please try again later.';
    }
}

await Promise.all([loadLatestProjects(), loadProfileStats()]);
