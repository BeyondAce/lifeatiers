(() => {
  "use strict";

  const TIER_POINTS = { HT1:60, LT1:45, HT2:30, LT2:20, HT3:10, LT3:6, HT4:4, LT4:3, HT5:2, LT5:1 };
  const TIER_COLORS = {
    HT1:"#fde047", LT1:"#d4b83a",
    HT2:"#cad5e2", LT2:"#9aa8b8",
    HT3:"#d9915c", LT3:"#b3764a",
    HT4:"#7c8ea6", LT4:"#64748b",
    HT5:"#526078", LT5:"#45526b"
  };
  const REGION_COLORS = {
    NA:"#e05555", EU:"#4ade80", AS:"#f5a623", SA:"#f5d623", AU:"#d5ad80", ME:"#d95c5c"
  };
  const TIER_GROUPS = [
    { label:"Tier 1", codes:["HT1","LT1"], color:"#fff", bg:"#c9820f", border:"#c9820f", trophy:true },
    { label:"Tier 2", codes:["HT2","LT2"], color:"#fff", bg:"#3a4455", border:"#3a4455", trophy:true },
    { label:"Tier 3", codes:["HT3","LT3"], color:"#fff", bg:"#a04a1e", border:"#a04a1e", trophy:true },
    { label:"Tier 4", codes:["HT4","LT4"], color:null, bg:null, border:null, trophy:false },
    { label:"Tier 5", codes:["HT5","LT5"], color:null, bg:null, border:null, trophy:false },
  ];

  const state = { config: null, lb: null, gamemode: "overall", query: "" };

  const ASSETS = "/assets/";

  const els = {
    tabs: document.getElementById("tabs"),
    thead: document.getElementById("thead"),
    tbody: document.getElementById("tbody"),
    tempty: document.getElementById("tempty"),
    search: document.getElementById("search"),
    copyIp: document.getElementById("copy-ip"),
    ipIcon: document.getElementById("ip-icon"),
    infoBtn: document.getElementById("info-btn"),
  };

  const weight = (code) => TIER_POINTS[code] ?? 0;
  const tierColor = (code) => TIER_COLORS[code] ?? "var(--muted)";
  const regionColor = (r) => REGION_COLORS[r] ?? "#8b97a8";

  function totalScore(p) {
    return Object.values(p.gamemodes ?? {}).reduce((s, c) => s + weight(c), 0);
  }

  function scoreFor(p) {
    if (state.gamemode === "overall") return totalScore(p);
    return weight(p.gamemodes?.[state.gamemode]);
  }

  function ranked() {
    return [...state.lb]
      .map((p) => ({ ...p, score: scoreFor(p) }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  }

  function titleFor(pts) {
    return state.config.ranks.find((r) => pts >= r.minPoints) ?? state.config.ranks.at(-1);
  }

  function overallRank(name) {
    return [...state.lb]
      .map((p) => ({ name: p.name, score: totalScore(p) }))
      .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
      .findIndex((p) => p.name === name) + 1;
  }

  const avatar = (name, small = false) => {
    if (small) {
      return `<img class="prow__avatar" loading="lazy" alt="" src="https://mc-heads.net/avatar/${encodeURIComponent(name)}" />`;
    }
    return `<img class="skin" loading="lazy" alt="" src="https://nmsr.nickac.dev/bust/${encodeURIComponent(name)}" onerror="this.src='https://nmsr.nickac.dev/bust/Steve'" />`;
  };

  /* ---------------------------------------------------------- profile */
  function openProfile(name) {
    const p = state.lb.find((x) => x.name === name);
    if (!p) return;

    const gmModes = state.config.gamemodes.filter((g) => g.id !== "overall");
    const pts = totalScore(p);
    const title = titleFor(pts);
    const rank = overallRank(name);
    const regionNames = { NA:"North America", EU:"Europe", AS:"Asia", ME:"Middle East", SA:"South America", AU:"Australia" };

    document.getElementById("profile-skin").src = `https://nmsr.nickac.dev/bust/${encodeURIComponent(name)}`;
    document.getElementById("profile-name").textContent = name;
    document.getElementById("profile-rank").innerHTML = `<img src="${ASSETS}${title.icon}" alt="" /><span style="color:${title.color}">${title.name}</span>`;
    document.getElementById("profile-region").textContent = regionNames[p.region] ?? p.region;

    const namemc = document.getElementById("profile-namemc");
    if (p.cracked) {
      namemc.style.display = "none";
    } else {
      namemc.style.display = "";
      namemc.href = `https://namemc.com/profile/${encodeURIComponent(name)}`;
      namemc.innerHTML = `<img src="${ASSETS}NameMC.webp" alt="NameMC" />NameMC ↗`;
    }

    document.getElementById("profile-position").innerHTML = `
      <span class="profile-pos-num">${rank}.</span>
      <span>🏆</span>
      <span class="profile-pos-label">OVERALL</span>
      <span class="profile-pos-pts">(${pts} points)</span>`;

    const TIER_ORDER = Object.keys(TIER_POINTS);
    document.getElementById("profile-tiers").innerHTML = gmModes
      .map((g) => ({ g, t: p.gamemodes?.[g.id] }))
      .sort((a, b) => {
        if (!a.t && !b.t) return 0;
        if (!a.t) return 1;
        if (!b.t) return -1;
        return TIER_ORDER.indexOf(a.t) - TIER_ORDER.indexOf(b.t);
      })
      .map(({ g, t }) => {
        if (!t) return `<div class="tier-card tier-card--empty">
          <div class="tier-icon-circle tier-icon-circle--empty"><img src="${ASSETS}${g.icon}" alt="${g.name}" /></div>
          <span class="tier-badge tier-badge--empty">–</span>
        </div>`;
        const tc = tierColor(t);
        return `<div class="tier-card">
          <div class="tier-icon-circle" style="border-color:${tc}; box-shadow:0 0 8px ${tc}55"><img src="${ASSETS}${g.icon}" alt="${g.name}" /></div>
          <span class="tier-badge" style="color:${tc}">${t}</span>
        </div>`;
      }).join("");

    document.getElementById("profile-modal").style.display = "flex";
  }

  function closeProfile() {
    document.getElementById("profile-modal").style.display = "none";
  }
  window.closeProfile = closeProfile;

  document.getElementById("profile-modal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeProfile();
  });

  /* ---------------------------------------------------------- tabs */
  function renderTabs() {
    els.tabs.innerHTML = state.config.gamemodes
      .map((g) => `<button class="tab${g.id === state.gamemode ? " is-active" : ""}" data-gm="${g.id}" style="--tab-c:${g.color || '#fff'}">
        <img class="tab__icon" src="/assets/${g.icon}" alt="${g.name}" />
        <strong>${g.name}</strong>
        <span class="tab__bar"></span>
      </button>`)
      .join("");
  }

  /* ---------------------------------------------------------- rows */
  function tierCell(gmId, code, gm) {
    if (!code) {
      return `<span class="tcell tcell--empty" title="${gm.name}: Unranked">
        <img src="/assets/${gm.icon}" alt="${gm.name}" /><b>—</b></span>`;
    }
    return `<span class="tcell" style="--tier-c:${tierColor(code)}" title="${gm.name}: ${code}">
      <img src="/assets/${gm.icon}" alt="${gm.name}" /><b>${code}</b></span>`;
  }

  function tiersMarkup(p) {
    const gmModes = state.config.gamemodes.filter((g) => g.id !== "overall");
    if (state.gamemode === "overall") {
      return gmModes.map((g) => tierCell(g.id, p.gamemodes?.[g.id], g)).join("");
    }
    const gm = state.config.gamemodes.find((g) => g.id === state.gamemode);
    const code = p.gamemodes?.[state.gamemode];
    if (!code) return `<span class="tcell tcell--big tcell--empty"><img src="/assets/${gm.icon}" alt="${gm.name}" /><b>—</b></span>`;
    return `<span class="tcell tcell--big" style="--tier-c:${tierColor(code)}" title="${code}">
      <img src="/assets/${gm.icon}" alt="${gm.name}" /><b>${code}</b></span>`;
  }

  function renderRows() {
    const q = state.query.trim().toLowerCase();
    const allRanked = ranked().filter((p) => !q || p.name.toLowerCase().includes(q));
    els.thead.hidden = state.gamemode !== "overall";

    if (state.gamemode !== "overall") {
      renderGmView(allRanked);
      return;
    }

    els.tempty.hidden = allRanked.length > 0;
    els.tbody.innerHTML = allRanked
      .map((p, i) => {
        const rank = i + 1;
        const title = titleFor(p.score);
        const rc = regionColor(p.region);
        const posCls = rank <= 3 ? ` pos-${rank}` : "";
        return `<div class="prow" data-player="${p.name}" style="--d:${Math.min(i * 25, 500)}ms;--hover-c:${title.color}">
          <div class="col-banner${posCls}">
            <div class="banner-wrap">
              <div class="banner-bg"></div>
              <span class="banner-num">${rank}.</span>
              ${avatar(p.name)}
            </div>
          </div>
          <span class="prow__id">
            <span class="prow__name">${p.name}</span>
            <span class="prow__title" style="--tcolor:${title.color}; color:${title.color}; text-shadow:0 0 12px ${title.color}88">
              <img src="/assets/${title.icon}" alt="" style="width:14px;height:14px;image-rendering:pixelated;vertical-align:-2px" onerror="this.style.display='none'" />
              <b>${title.name}</b>
              <span class="sep">•</span>${p.score} points
            </span>
          </span>
          <span class="prow__region"><span class="rpill" style="--rc:${rc}">${p.region}</span></span>
          <span class="prow__tiers">${tiersMarkup(p)}</span>
        </div>`;
      })
      .join("");
  }

  function renderGmView(players) {
    const gm = state.config.gamemodes.find((g) => g.id === state.gamemode);
    const buckets = TIER_GROUPS.map(({ label, codes, color, bg, border, trophy }) => ({
      label, codes, color, bg, border, trophy,
      players: players.filter((p) => codes.includes(p.gamemodes?.[state.gamemode])),
    }));
    els.tempty.hidden = buckets.some((b) => b.players.length > 0);
    els.tbody.innerHTML = `
      <div class="gm-header">
        <img class="gm-header__icon" src="/assets/${gm.icon}" alt="${gm.name}" />
        <span class="gm-header__name">${gm.name}</span>
      </div>
      <div class="gm-board">
        ${buckets.map(({ label, codes, players, color, bg, border, trophy }) => `
          <div class="gm-col">
            <div class="gm-col__head${bg ? '' : ' gm-col__head--plain'}" ${bg ? `style="background:${bg};border-color:${border}"` : ''}>
              ${trophy ? `<svg class="gm-col__trophy" style="color:${color}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 2h12v8a6 6 0 0 1-12 0V2ZM4 4H2v4a4 4 0 0 0 4 4v-1A3 3 0 0 1 4 8V4Zm16 0h2v4a4 4 0 0 0-4 4v1a4 4 0 0 0 4-4V4ZM11 16.93V19H8v2h8v-2h-3v-2.07A6.02 6.02 0 0 0 18 11V2H6v9a6.02 6.02 0 0 0 5 5.93Z"/></svg>` : ''}
              <span class="gm-col__label" ${color ? `style="color:${color}"` : ''}>${label}</span>
            </div>
            <div class="gm-col__players">
              ${players.length === 0
                ? `<span class="gm-col__empty">—</span>`
                : players.map((p) => {
                    const rc = regionColor(p.region);
                    return `<div class="gm-pcard" data-player="${p.name}" style="--rc:${rc}">
                      <span class="gm-pcard__region">${p.region}</span>
                      <span class="gm-pcard__avatar-wrap">${avatar(p.name, true)}</span>
                      <span class="gm-pcard__name">${p.name}</span>
                      <svg class="gm-pcard__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m18 15-6-6-6 6"/></svg>
                    </div>`;
                  }).join("")}
            </div>
          </div>
        `).join("")}
      </div>`;
  }

  function renderSkeleton(n = 8) {
    els.tempty.hidden = true;
    els.tbody.innerHTML = Array.from({ length: n })
      .map(() => `<div class="skel">
        <span class="skel__a"></span><span class="skel__b"></span>
        <span class="skel__c"></span><span class="skel__d"></span>
      </div>`)
      .join("");
  }

  function switchMode(id) {
    if (id === state.gamemode) return;
    state.gamemode = id;
    renderTabs();
    renderSkeleton();
    setTimeout(renderRows, 280);
  }

  /* ---------------------------------------------------------- events */
  function bind() {
    els.tabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (btn) switchMode(btn.dataset.gm);
    });

    els.search.addEventListener("input", (e) => {
      state.query = e.target.value;
      renderRows();
    });

    els.tbody.addEventListener("click", (e) => {
      const row = e.target.closest(".prow, .gm-pcard");
      if (row?.dataset.player) openProfile(row.dataset.player);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && document.getElementById("profile-modal").style.display !== "none") {
        e.preventDefault(); closeProfile();
      } else if (e.key === "/" && document.activeElement !== els.search) {
        e.preventDefault(); els.search.focus();
      } else if (e.key === "Escape" && document.activeElement === els.search) {
        els.search.value = ""; state.query = ""; renderRows(); els.search.blur();
      }
    });

    const copy = async () => {
      try {
        await navigator.clipboard.writeText("lifeamc.fun");
        els.copyIp.classList.add("copied");
        els.ipIcon.innerHTML = `<path fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.5 5 5 10-11"/>`;
        setTimeout(() => {
          els.copyIp.classList.remove("copied");
          els.ipIcon.innerHTML = `<path d="M9 9h10v10H9zM5 15H4V4h11v1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
        }, 1400);
      } catch (_) {}
    };
    els.copyIp.addEventListener("click", copy);
    els.copyIp.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); copy(); }
    });

    if (els.infoBtn) {
      els.infoBtn.addEventListener("click", () => {
        alert("Rankings are based on tier placements across all gamemodes. Points are awarded per tier level.");
      });
    }

    // Mobile nav drawer
    const drawer = document.getElementById("nav-drawer");
    const burger = document.getElementById("burger");
    const navClose = document.getElementById("nav-close");
    const navBackdrop = document.getElementById("nav-backdrop");
    const openDrawer = () => { drawer.classList.add("open"); document.body.classList.add("no-scroll"); };
    const closeDrawer = () => { drawer.classList.remove("open"); document.body.classList.remove("no-scroll"); };
    burger.addEventListener("click", openDrawer);
    navClose.addEventListener("click", closeDrawer);
    navBackdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

    document.addEventListener("click", (e) => {
      const dd = document.getElementById("dd-discords");
      if (!dd) return;
      if (dd.contains(e.target) && e.target.closest(".navspan")) {
        dd.classList.toggle("open");
      } else if (!dd.contains(e.target)) {
        dd.classList.remove("open");
      }
    });
  }

  /* ---------------------------------------------------------- boot */
  async function boot() {
    renderSkeleton();
    try {
      const [config, lb] = await Promise.all([
        fetch("/data/config.json").then((r) => r.json()),
        fetch("/data/lb.json").then((r) => r.json()),
      ]);
      state.config = config;
      state.lb = lb;
    } catch (err) {
      els.tbody.innerHTML = `<p class="tempty">Could not load data.</p>`;
      console.error(err);
      return;
    }
    renderTabs();
    bind();
    setTimeout(renderRows, 350);
  }

  boot();
})();
