const ASSETS = '/assets/';

function getRank(ranks, points) {
  return ranks.find(r => points >= r.minPoints) ?? ranks[ranks.length - 1];
}

function skinUrl(name) {
  return `https://nmsr.nickac.dev/bust/${encodeURIComponent(name)}`;
}

// ── Leaderboard ────────────────────────────────────────────────────────────
function posClass(i) {
  return i === 0 ? 'pos-1' : i === 1 ? 'pos-2' : i === 2 ? 'pos-3' : '';
}

const TIER_POINTS = { HT1:60, LT1:45, HT2:30, LT2:20, HT3:10, LT3:6, HT4:4, LT4:3, HT5:2, LT5:1 };
const TIER_ORDER = Object.keys(TIER_POINTS);

function tierColor(tier) {
  if (['HT1','LT1','HT2','LT2','HT3'].includes(tier)) return '#f5c518';
  return '#888899';
}

function renderGamemode(players, ranks, gmId, gamemodes) {
  if (!players?.length) {
    document.getElementById('leaderboard').innerHTML = '<p class="empty">No players yet.</p>';
    return;
  }

  const gm = gamemodes.find(g => g.id === gmId);

  const rows = players.map((p, i) => {
    const rank = getRank(ranks, p.points);
    const tc = tierColor(p.tier);
    const pts = TIER_POINTS[p.tier] ?? 0;
    return `
      <tr onclick="openProfile('${p.name}')">
        <td class="col-banner ${posClass(i)}">
          <div class="banner-wrap">
            <div class="banner-bg"></div>
            <span class="banner-num">${i + 1}.</span>
            <img class="skin" src="${skinUrl(p.name)}" alt="${p.name}" onerror="this.src='https://nmsr.nickac.dev/bust/Steve'" />
          </div>
        </td>
        <td class="col-player">
          <div class="player-name">${p.name}</div>
          <div class="rank-badge">
            <img src="${ASSETS}${rank.icon}" alt="${rank.name}" />${rank.name} <span class="rank-pts">(${pts} Points)</span>
          </div>
        </td>
        <td><span class="region-badge region-${p.region}">${p.region}</span></td>
        <td>
          <div class="tiers-cell">
            <div class="tier-card">
              <div class="tier-icon-circle" style="border-color:${tc}44">
                <img src="${ASSETS}${gm.icon}" alt="${gm.name}" />
              </div>
              <span class="tier-badge" style="color:${tc}">${p.tier}</span>
              <div class="tier-tooltip"><span class="tt-tier">${p.tier} ${gm.name.toUpperCase()}</span><span class="tt-pts">${pts} Points</span></div>
            </div>
          </div>
        </td>
      </tr>`;
  }).join('');

  document.getElementById('leaderboard').innerHTML = `
    <table class="lb-table">
      <thead><tr>
        <th>#</th><th>Player</th><th>Region</th><th>Tiers</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderOverall(players, ranks, gamemodes) {
  if (!players?.length) {
    document.getElementById('leaderboard').innerHTML = '<p class="empty">No players yet.</p>';
    return;
  }

  const gmModes = gamemodes.filter(g => g.id !== 'overall');
  const sorted = [...players].sort((a,b) => {
    const ap = Object.values(a.gamemodes ?? {}).reduce((s,t) => s+(TIER_POINTS[t]??0),0);
    const bp = Object.values(b.gamemodes ?? {}).reduce((s,t) => s+(TIER_POINTS[t]??0),0);
    return bp - ap;
  }).slice(0, 100);

  const rows = sorted.map((p, i) => {
    const totalPts = Object.values(p.gamemodes ?? {}).reduce((s,t) => s+(TIER_POINTS[t]??0),0);
    const rank = getRank(ranks, totalPts);
    const pts = totalPts;
    const tiers = gmModes
      .map(g => ({ g, t: p.gamemodes?.[g.id] }))
      .sort((a, b) => {
        if (!a.t && !b.t) return 0;
        if (!a.t) return 1;
        if (!b.t) return -1;
        return TIER_ORDER.indexOf(a.t) - TIER_ORDER.indexOf(b.t);
      })
      .map(({ g, t }) => {
        if (!t) return `<div class="tier-card tier-card--empty">
          <div class="tier-icon-circle tier-icon-circle--empty">
            <img src="${ASSETS}${g.icon}" alt="${g.name}" />
          </div>
          <span class="tier-badge tier-badge--empty">–</span>
          <div class="tier-tooltip"><span class="tt-tier">${g.name.toUpperCase()}</span><span class="tt-pts">Unranked</span></div>
        </div>`;
        const tc = tierColor(t);
        const tpts = TIER_POINTS[t] ?? 0;
        return `<div class="tier-card">
          <div class="tier-icon-circle" style="border-color:${tc}44">
            <img src="${ASSETS}${g.icon}" alt="${g.name}" />
          </div>
          <span class="tier-badge" style="color:${tc}">${t}</span>
          <div class="tier-tooltip"><span class="tt-tier">${t} ${g.name.toUpperCase()}</span><span class="tt-pts">${tpts} Points</span></div>
        </div>`;
      }).join('');

    return `
      <tr onclick="openProfile('${p.name}')">
        <td class="col-banner ${posClass(i)}">
          <div class="banner-wrap">
            <div class="banner-bg"></div>
            <span class="banner-num">${i + 1}.</span>
            <img class="skin" src="${skinUrl(p.name)}" alt="${p.name}" onerror="this.src='https://nmsr.nickac.dev/bust/Steve'" />
          </div>
        </td>
        <td class="col-player">
          <div class="player-name">${p.name}</div>
          <div class="rank-badge">
            <img src="${ASSETS}${rank.icon}" alt="${rank.name}" />${rank.name} <span class="rank-pts">(${pts} Points)</span>
          </div>
        </td>
        <td><span class="region-badge region-${p.region}">${p.region}</span></td>
        <td><div class="tiers-cell">${tiers}</div></td>
      </tr>`;
  }).join('');

  document.getElementById('leaderboard').innerHTML = `
    <table class="lb-table">
      <thead><tr>
        <th>#</th><th>Player</th><th>Region</th><th>Tiers</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

// ── Profile Modal ──────────────────────────────────────────────────────────
let _profileData = { lb: [], ranks: [], gamemodes: [] };

function openProfile(name) {
  const { lb, ranks, gamemodes } = _profileData;
  const p = lb.find(x => x.name === name);
  if (!p) return;

  const gmModes = gamemodes.filter(g => g.id !== 'overall');
  const totalPts = Object.values(p.gamemodes ?? {}).reduce((s, t) => s + (TIER_POINTS[t] ?? 0), 0);
  const rank = getRank(ranks, totalPts);
  const sorted = [...lb].sort((a,b) => {
    const ap = Object.values(a.gamemodes ?? {}).reduce((s,t) => s+(TIER_POINTS[t]??0),0);
    const bp = Object.values(b.gamemodes ?? {}).reduce((s,t) => s+(TIER_POINTS[t]??0),0);
    return bp - ap;
  });
  const pos = sorted.findIndex(x => x.name === name) + 1;
  const regionNames = { NA:'North America', EU:'Europe', AS:'Asia', ME:'Middle East' };

  document.getElementById('profile-skin').src = skinUrl(name);
  document.getElementById('profile-name').textContent = name;
  document.getElementById('profile-rank').innerHTML = `<img src="${ASSETS}${rank.icon}" alt="" /><span style="color:${rank.color}">${rank.name}</span>`;
  document.getElementById('profile-rank').style.cssText = '';
  document.getElementById('profile-region').textContent = regionNames[p.region] ?? p.region;

  const namemc = document.getElementById('profile-namemc');
  if (p.cracked) {
    namemc.style.display = 'none';
  } else {
    namemc.style.display = '';
    namemc.href = `https://namemc.com/profile/${encodeURIComponent(name)}`;
    namemc.innerHTML = `<img src="${ASSETS}NameMC.webp" alt="NameMC" />NameMC ↗`;
  }

  document.getElementById('profile-position').innerHTML = `
    <span class="profile-pos-num">${pos}.</span>
    <span>🏆</span>
    <span class="profile-pos-label">OVERALL</span>
    <span class="profile-pos-pts">(${totalPts} points)</span>`;

  document.getElementById('profile-tiers').innerHTML = gmModes
    .map(g => ({ g, t: p.gamemodes?.[g.id] }))
    .sort((a, b) => {
      if (!a.t && !b.t) return 0;
      if (!a.t) return 1;
      if (!b.t) return -1;
      return TIER_ORDER.indexOf(a.t) - TIER_ORDER.indexOf(b.t);
    })
    .map(({ g, t }) => {
      if (!t) return `<div class="tier-card tier-card--empty">
        <div class="tier-icon-circle tier-icon-circle--empty">
          <img src="${ASSETS}${g.icon}" alt="${g.name}" />
        </div>
        <span class="tier-badge tier-badge--empty">–</span>
        <div class="tier-tooltip"><span class="tt-tier">${g.name.toUpperCase()}</span><span class="tt-pts">Unranked</span></div>
      </div>`;
      const tpts = TIER_POINTS[t] ?? 0;
      const tc = tierColor(t);
      return `<div class="tier-card">
        <div class="tier-icon-circle" style="border-color:${tc}; box-shadow:0 0 8px ${tc}55">
          <img src="${ASSETS}${g.icon}" alt="${g.name}" />
        </div>
        <span class="tier-badge" style="color:${tc}">${t}</span>
        <div class="tier-tooltip"><span class="tt-tier">${t} ${g.name.toUpperCase()}</span><span class="tt-pts">${tpts} Points</span></div>
      </div>`;
    }).join('');

  document.getElementById('profile-modal').style.display = 'flex';
}

function closeProfile() {
  document.getElementById('profile-modal').style.display = 'none';
}

document.getElementById('profile-modal').addEventListener('click', e => {
  if (e.target === e.currentTarget) closeProfile();
});

// ── Tabs ───────────────────────────────────────────────────────────────────
function renderTabs(gamemodes, activeId, onClick) {
  const nav = document.getElementById('tabs');
  nav.innerHTML = gamemodes.map(g => `
    <button class="tab-btn ${g.id === activeId ? 'active' : ''}" data-id="${g.id}">
      <img src="${ASSETS}${g.icon}" alt="${g.name}" />
      ${g.name}
    </button>`).join('');

  nav.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => onClick(btn.dataset.id))
  );
}

// ── Init ───────────────────────────────────────────────────────────────────
Promise.all([
  fetch('/data/config.json').then(r => r.json()),
  fetch('/data/lb.json').then(r => r.json()),
]).then(([config, lb]) => {
  const { ranks, gamemodes } = config;
  _profileData = { lb, ranks, gamemodes };
  let activeTab = 'overall';

  function getGamemodePlayers(lb, gmId) {
    return lb
      .filter(p => p.gamemodes?.[gmId])
      .map(p => ({ name: p.name, region: p.region, tier: p.gamemodes[gmId], points: TIER_POINTS[p.gamemodes[gmId]] ?? 0 }))
      .sort((a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier))
      .slice(0, 100);
  }

  function switchTab(id) {
    activeTab = id;
    renderTabs(gamemodes, activeTab, switchTab);
    if (id === 'overall') {
      renderOverall(lb, ranks, gamemodes);
    } else {
      renderGamemode(getGamemodePlayers(lb, id), ranks, id, gamemodes);
    }
  }

  window.goToRankings = (id = 'overall') => {
    switchTab(id);
    document.getElementById('tabs').scrollIntoView({ behavior: 'smooth' });
  };

  document.querySelector('.search-bar input').addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const match = lb.find(p => p.name.toLowerCase() === q);
    if (match) {
      openProfile(match.name);
      e.target.value = '';
    }
  });

  switchTab('overall');
});
