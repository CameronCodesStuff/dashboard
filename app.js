const CONFIG = {
  username: 'CameronCodesStuff',
  refreshInterval: 60,
  repoLimit: 30,
  commitFetchLimit: 12,
};

const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  HTML: '#e34c26', CSS: '#563d7c', Rust: '#dea584', Go: '#00ADD8',
  Java: '#b07219', 'C#': '#178600', 'C++': '#f34b7d', Ruby: '#701516',
  Swift: '#F05138', Kotlin: '#A97BFF', Shell: '#89e051', Dart: '#00B4AB',
};

let state = {
  token: '',
  repos: [],
  activeFilter: 'all',
  prevPushed: {},
  firstLoad: true,
  timer: CONFIG.refreshInterval,
  timerTick: null,
};

const $ = id => document.getElementById(id);

function ghHeaders() {
  const h = { Accept: 'application/vnd.github+json' };
  if (state.token) h['Authorization'] = 'Bearer ' + state.token;
  return h;
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return s + 's';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function setStatus(st, msg) {
  $('status-dot').className = 'status-dot ' + st;
  $('status-txt').textContent = msg;
}

function startTimer() {
  state.timer = CONFIG.refreshInterval;
  clearInterval(state.timerTick);
  const C = 94.25;
  state.timerTick = setInterval(() => {
    state.timer--;
    $('tick-circle').style.strokeDashoffset = C * (1 - state.timer / CONFIG.refreshInterval);
    $('tick-label').textContent = state.timer + 's';
    if (state.timer <= 0) { clearInterval(state.timerTick); load(); }
  }, 1000);
}

async function fetchCommit(repo) {
  try {
    const r = await fetch(`https://api.github.com/repos/${CONFIG.username}/${repo}/commits?per_page=1`, { headers: ghHeaders() });
    if (!r.ok) return null;
    const d = await r.json();
    return d[0]?.commit?.message?.split('\n')[0] || null;
  } catch { return null; }
}

function langDot(lang) {
  const c = LANG_COLORS[lang] || '#475569';
  return `<span style="width:7px;height:7px;border-radius:50%;background:${c};display:inline-block;flex-shrink:0"></span>`;
}

function renderRepos(repos) {
  const grid = $('repo-grid');
  grid.innerHTML = '';

  if (!repos.length) {
    grid.innerHTML = '<div class="error-card">No repositories match this filter.</div>';
    return;
  }

  repos.forEach((repo, i) => {
    const isNew = !state.firstLoad && state.prevPushed[repo.name] &&
      (repo.pushed_at || repo.updated_at) > state.prevPushed[repo.name];
    const card = document.createElement('div');
    card.className = 'repo-card' + (isNew ? ' updated' : '');
    card.style.animationDelay = (i * 25) + 'ms';
    const ts = repo.pushed_at || repo.updated_at;

    card.innerHTML = `
      <div class="repo-top">
        <a class="repo-name" href="${repo.html_url}" target="_blank" title="${esc(repo.name)}">${esc(repo.name)}</a>
        <div class="repo-badges">
          ${isNew ? '<span class="badge badge-new">updated</span>' : ''}
          ${repo.language ? `<span class="badge badge-lang">${langDot(repo.language)}${esc(repo.language)}</span>` : ''}
        </div>
      </div>
      ${repo.description ? `<p class="repo-desc">${esc(repo.description)}</p>` : ''}
      ${repo._commit ? `
        <div class="commit-line">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="22"/></svg>
          <span class="commit-msg">${esc(repo._commit)}</span>
        </div>` : ''}
      <div class="repo-meta">
        <span class="meta-item">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${timeAgo(ts)} ago
        </span>
        ${repo.stargazers_count ? `<span class="meta-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>${repo.stargazers_count}</span>` : ''}
        ${repo.forks_count ? `<span class="meta-item"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>${repo.forks_count}</span>` : ''}
      </div>
    `;

    grid.appendChild(card);
    if (isNew) setTimeout(() => card.classList.remove('updated'), 4000);
  });
}

function buildLangFilter(repos) {
  const counts = {};
  repos.forEach(r => { if (r.language) counts[r.language] = (counts[r.language] || 0) + 1; });
  const langs = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const container = $('lang-filter');
  container.innerHTML = '';

  const all = document.createElement('button');
  all.className = 'lang-chip' + (state.activeFilter === 'all' ? ' active' : '');
  all.textContent = 'all';
  all.onclick = () => applyFilter('all');
  container.appendChild(all);

  langs.forEach(([lang, count]) => {
    const chip = document.createElement('button');
    chip.className = 'lang-chip' + (state.activeFilter === lang ? ' active' : '');
    chip.innerHTML = langDot(lang) + esc(lang) + ` <span style="opacity:.45">(${count})</span>`;
    chip.onclick = () => applyFilter(lang);
    container.appendChild(chip);
  });
}

function applyFilter(lang) {
  state.activeFilter = lang;
  const filtered = lang === 'all' ? state.repos : state.repos.filter(r => r.language === lang);
  buildLangFilter(state.repos);
  $('repo-count').textContent = filtered.length + ' repos';
  renderRepos(filtered);
}

async function load() {
  setStatus('loading', 'fetching…');
  try {
    const [userRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${CONFIG.username}`, { headers: ghHeaders() }),
      fetch(`https://api.github.com/users/${CONFIG.username}/repos?sort=updated&per_page=${CONFIG.repoLimit}&type=owner`, { headers: ghHeaders() }),
    ]);

    if (!userRes.ok || !reposRes.ok) {
      const status = !userRes.ok ? userRes.status : reposRes.status;
      if (status === 401) throw new Error('Invalid token — check it and try again.');
      throw new Error('GitHub API error ' + status);
    }

    const user = await userRes.json();
    const repos = await reposRes.json();

    $('avatar').src = user.avatar_url;
    $('display-name').textContent = user.name || user.login;
    $('bio').textContent = user.bio || '';

    const langs = new Set(repos.map(r => r.language).filter(Boolean));
    const today = new Date().toISOString().slice(0, 10);
    const pushedToday = repos.filter(r => (r.pushed_at || '').slice(0, 10) === today).length;

    $('s-repos').textContent = user.public_repos;
    $('s-stars').textContent = repos.reduce((s, r) => s + r.stargazers_count, 0);
    $('s-followers').textContent = user.followers;
    $('s-today').textContent = pushedToday;
    $('s-langs').textContent = langs.size;

    const topRepos = repos.slice(0, CONFIG.commitFetchLimit);
    const commits = await Promise.all(topRepos.map(r => fetchCommit(r.name)));
    topRepos.forEach((r, i) => { r._commit = commits[i]; });

    const newPushed = {};
    repos.forEach(r => { newPushed[r.name] = r.pushed_at || r.updated_at; });

    state.repos = repos;
    state.prevPushed = newPushed;

    applyFilter(state.activeFilter);
    state.firstLoad = false;

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setStatus('ok', 'live · ' + now);
    startTimer();

  } catch (err) {
    $('repo-grid').innerHTML = `<div class="error-card">${esc(err.message)}</div>`;
    setStatus('error', 'error');
    startTimer();
  }
}

async function fetchStreak() {
  try {
    const r = await fetch(`https://streak-stats.demolab.com/?user=${CONFIG.username}&format=json`);
    if (!r.ok) return;
    const d = await r.json();
    if (d.currentStreak?.length !== undefined) $('s-streak').textContent = d.currentStreak.length;
  } catch {}
}

function showDashboard() {
  $('token-screen').style.display = 'none';
  $('dashboard').style.display = 'block';
  load();
  fetchStreak();
}

function initTokenScreen() {
  const input = $('token-input');
  const toggle = $('token-toggle');
  const submit = $('token-submit');
  const skip = $('token-skip');

  const saved = sessionStorage.getItem('gh_token');
  if (saved) {
    state.token = saved;
    showDashboard();
    return;
  }

  toggle.addEventListener('click', () => {
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') submit.click();
  });

  submit.addEventListener('click', () => {
    const val = input.value.trim();
    if (!val) { input.focus(); return; }
    state.token = val;
    sessionStorage.setItem('gh_token', val);
    showDashboard();
  });

  skip.addEventListener('click', () => {
    state.token = '';
    showDashboard();
  });
}

function initCanvas() {
  const canvas = $('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, P;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function make() {
    P = Array.from({ length: 55 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.1 + 0.2,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      o: Math.random() * 0.4 + 0.07,
      hue: Math.random() > 0.5 ? '45,212,191' : '167,139,250',
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    P.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
      if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.hue},${p.o})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  resize(); make(); draw();
  window.addEventListener('resize', () => { resize(); make(); });
}

window.dashboard = {
  refresh: () => { clearInterval(state.timerTick); load(); },
  resetToken: () => {
    sessionStorage.removeItem('gh_token');
    clearInterval(state.timerTick);
    $('token-input').value = '';
    $('token-screen').style.display = 'flex';
    $('dashboard').style.display = 'none';
  },
};

initCanvas();
initTokenScreen();
