(() => {
  'use strict';

  const SAVE_KEY = 'cmr_v2_save_v2';
    const CDN_PRIMARY = '../Candy-Magic-Royale/';
  const CDN_FALLBACK = ['https:', '', 'raw.githubusercontent.com', 'Mano22086', 'Candy-Magic-Royale', 'main', ''].join('/');
  const ROWS = 8, COLS = 7, HEART_MAX = 5, HEART_REGEN_MS = 25 * 60 * 1000;

  const CANDY_FILES = [
    '01_star_gold.png', '02_heart_rainbow.png', '03_diamond_blue.png',
    '04_flower_purple.png', '05_crown_green.png', '06_lollipop_red.png',
    '07_lightning_purple.png'
  ];
  const WRAPPED_FILES = [
    '14_bag_gold.png', '15_bag_rainbow.png', '16_bag_diamond_blue.png',
    '17_bag_flower_purple.png', '18_bag_crown_green.png', '19_bag_lollipop_red.png',
    '20_bag_lightning_purple.png'
  ];
  const STRIPED_FILES = [
    '21_rocket_crown_gold.png', '22_rocket_crown_rainbow.png', '23_rocket_diamond_blue.png',
    '24_rocket_flower_purple.png', '25_rocket_crown_green.png', '26_rocket_lollipop_red.png',
    '27_rocket_lightning_purple.png'
  ];
  const COLOR_BOMB_FILE = '13_chocolate_ball.png';
  const OBS_FILES = {
    single_ice: 'ice_cube_stylized_4k.png',
    double_ice: 'ice_cube_realistic_4k.png',
    chocolate: 'assets/obstacle_3.jpg',
    chains: 'assets/obstacle_4.jpg',
    honey: 'assets/obstacle_5.jpg',
    waffle: 'assets/obstacle_6.jpg',
    cage: 'assets/obstacle_7.jpg',
    chest: 'assets/obstacle_8.jpg'
  };
  const KINGDOM_BACKDROPS = [
    'assets/world_1.jpg', 'assets/castle-ice.svg', 'assets/castle-chocolate.svg',
    'assets/world_2.jpg', 'assets/world_3.jpg', 'assets/world_4.jpg'
  ];
  const K_NAMES = [
    'قصر الحلوى الملكي', 'قصر الكريستال الجليدي', 'أرض الشوكولاتة والكراميل',
    'الحديقة الليلية الساحرة', 'مروج العسل الذهبية', 'قمة التنين والمجرة',
    'جزيرة المارشميلو العائمة', 'قلعة الكرز الياقوتي', 'بحيرة النعناع السماوية',
    'عاصمة ملك الحلوى العظمى'
  ];
  const FALLBACK_COLORS = ['#fbbf24', '#ec4899', '#38bdf8', '#a855f7', '#22c55e', '#ef4444', '#c084fc'];

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const IMG_CACHE = new Map();
  let assetsReady = 0, assetsTotal = 0;

  function removeBgToCanvas(img) {
    try {
      const s = 160;
      const c = document.createElement('canvas');
      c.width = s; c.height = s;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(img, 0, 0, s, s);
      const id = g.getImageData(0, 0, s, s);
      const d = id.data;
      const corners = [0, (s - 1) * 4, (s * (s - 1)) * 4, (s * s - 1) * 4];
      let br = 0, bg = 0, bb = 0;
      for (const idx of corners) { br += d[idx]; bg += d[idx + 1]; bb += d[idx + 2]; }
      br /= 4; bg /= 4; bb /= 4;
      const isLight = (br + bg + bb) / 3 > 200;
      const isDark = (br + bg + bb) / 3 < 45;
      if (isLight || isDark) {
        for (let i = 0; i < d.length; i += 4) {
          const dist = Math.hypot(d[i] - br, d[i + 1] - bg, d[i + 2] - bb);
          if (dist < 42) d[i + 3] = 0;
          else if (dist < 78) d[i + 3] = Math.round(((dist - 42) / 36) * d[i + 3]);
        }
        g.putImageData(id, 0, 0);
      }
      return c;
    } catch { return img; }
  }

  function loadSprite(path, stripBg = false) {
    if (IMG_CACHE.has(path)) return IMG_CACHE.get(path);
    const entry = { img: null, ready: false };
    IMG_CACHE.set(path, entry);
    assetsTotal++;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    let triedFallback = false;
    img.onload = () => {
      entry.img = stripBg ? removeBgToCanvas(img) : img;
      entry.ready = true;
      assetsReady++;
      updateAssetPill();
    };
    img.onerror = () => {
      if (!triedFallback) {
        triedFallback = true;
        img.src = CDN_FALLBACK + path;
      } else {
        assetsReady++;
        updateAssetPill();
      }
    };
    img.src = CDN_PRIMARY + path;
    return entry;
  }

  function updateAssetPill() {
    const el = $('assetLoadPill');
    if (!el) return;
    if (assetsReady >= assetsTotal) {
      el.textContent = `💎 جميع المجسمات الحقيقية جاهزة (${assetsTotal}/${assetsTotal})`;
    } else {
      el.textContent = `جاري تحميل المجسمات الحقيقية (${assetsReady}/${assetsTotal})...`;
    }
  }

  const BOOSTER_FILES = { bomb: '08_bomb_skull.png', rocket: '09_rocket_striped.png', paint: '10_paintbrush_rainbow.png', swap: '12_arrows_cross.png', shuffle: '11_color_wheel.png' };
  const BOOSTER_ORDER = ['08_bomb_skull.png', '09_rocket_striped.png', '10_paintbrush_rainbow.png', '12_arrows_cross.png', '11_color_wheel.png'];
  function hydrateDomAssets() {
    document.querySelectorAll('img[data-asset]').forEach((el) => {
      const p = el.getAttribute('data-asset');
      el.src = CDN_PRIMARY + p;
      el.onerror = () => {
        if (!el.dataset.fb) { el.dataset.fb = '1'; el.src = CDN_FALLBACK + p; }
      };
    });
    document.querySelectorAll('.booster-slot').forEach((slot, idx) => { const btn = slot.closest('[data-b]'); const key = btn ? btn.dataset.b : ''; const f = (key && BOOSTER_FILES[key]) || BOOSTER_ORDER[idx]; if (!f) return; let img = slot.tagName === 'IMG' ? slot : slot.querySelector('img'); if (!img) { slot.textContent = ''; img = document.createElement('img'); img.alt = key || 'booster'; img.style.width = '100%'; img.style.height = '100%'; img.style.objectFit = 'contain'; img.style.pointerEvents = 'none'; slot.appendChild(img); } img.src = CDN_PRIMARY + f; img.onerror = () => { if (!img.dataset.fb) { img.dataset.fb = '1'; img.src = CDN_FALLBACK + f; } }; });
  }

  function preloadAllSprites() {
    CANDY_FILES.forEach((f) => loadSprite(f));
    WRAPPED_FILES.forEach((f) => loadSprite(f));
    STRIPED_FILES.forEach((f) => loadSprite(f));
    loadSprite(COLOR_BOMB_FILE);
    Object.entries(OBS_FILES).forEach(([k, f]) => loadSprite(f, f.endsWith('.jpg')));
      BOOSTER_ORDER.forEach((f) => loadSprite(f));
    hydrateDomAssets();
  }

  function defaultState() {
    return {
      mode: 'online', playerName: 'اللاعب الملكي', loggedIn: false, vipNoAds: false,
      muted: false, tutorialDone: false, maxLevel: 1, currentKingdom: 1, currentHalf: 1,
      coins: 500, hearts: HEART_MAX, lastHeartTs: Date.now(), streak: 0,
      starsMap: {}, totalClears: 0, bossesDefeated: 0, levelsPlayedSinceAd: 0,
      boosters: { bomb: 3, rocket: 3, paint: 2, shuffle: 3, swap: 3 },
      lastSpinDay: '', quests: { matches: 0, levels: 0, claimed: {} }
    };
  }
  let state = (() => {
    try { return Object.assign(defaultState(), JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); }
    catch { return defaultState(); }
  })();
  const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {} };

  function syncHearts() {
    if (state.hearts >= HEART_MAX) { state.lastHeartTs = Date.now(); return; }
    const elapsed = Date.now() - (state.lastHeartTs || Date.now());
    const gained = Math.floor(elapsed / HEART_REGEN_MS);
    if (gained > 0) {
      state.hearts = Math.min(HEART_MAX, state.hearts + gained);
      state.lastHeartTs = state.hearts >= HEART_MAX ? Date.now() : state.lastHeartTs + gained * HEART_REGEN_MS;
      persist();
    }
  }
  function heartTimerText() {
    if (state.hearts >= HEART_MAX) return '';
    const rem = Math.max(0, HEART_REGEN_MS - (Date.now() - state.lastHeartTs));
    const m = Math.floor(rem / 60000), s = Math.floor((rem % 60000) / 1000);
    return ` ${m}:${String(s).padStart(2, '0')}`;
  }

  let toastT = null;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2300);
  }
  let audioCtx = null;
  function playSfx(type) {
    if (state.muted) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      const now = audioCtx.currentTime;
      if (type === 'swap') { o.type = 'sine'; o.frequency.setValueAtTime(340, now); o.frequency.exponentialRampToValueAtTime(520, now + 0.08); g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.09); o.start(now); o.stop(now + 0.1); }
      else if (type === 'match') { o.type = 'triangle'; o.frequency.setValueAtTime(520, now); o.frequency.exponentialRampToValueAtTime(880, now + 0.14); g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.16); o.start(now); o.stop(now + 0.17); }
      else if (type === 'boom') { o.type = 'sawtooth'; o.frequency.setValueAtTime(190, now); o.frequency.exponentialRampToValueAtTime(48, now + 0.25); g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.26); o.start(now); o.stop(now + 0.27); }
      else if (type === 'win') { o.type = 'triangle'; o.frequency.setValueAtTime(523, now); o.frequency.setValueAtTime(659, now + 0.1); o.frequency.setValueAtTime(784, now + 0.2); g.gain.setValueAtTime(0.14, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.42); o.start(now); o.stop(now + 0.44); }
      else if (type === 'boss') { o.type = 'square'; o.frequency.setValueAtTime(140, now); o.frequency.exponentialRampToValueAtTime(70, now + 0.28); g.gain.setValueAtTime(0.12, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.3); o.start(now); o.stop(now + 0.31); }
    } catch {}
  }

  function initLivingBg() {
    const c = $('livingBgCanvas'), g = c.getContext('2d');
    let W = 0, H = 0;
    const drops = Array.from({ length: 48 }, () => ({ x: Math.random(), y: Math.random(), v: 0.003 + Math.random() * 0.006, l: 16 + Math.random() * 28 }));
    const stars = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 2.4, p: Math.random() * 6.28 }));
    const resize = () => { W = c.width = c.offsetWidth || 420; H = c.height = c.offsetHeight || 780; };
    resize(); window.addEventListener('resize', resize);
    (function loop(t) {
      g.clearRect(0, 0, W, H);
      g.strokeStyle = 'rgba(186, 230, 253, 0.22)';
      g.lineWidth = 2;
      for (const d of drops) {
        d.y += d.v; if (d.y > 1.05) { d.y = -0.05; d.x = Math.random() < 0.5 ? Math.random() * 0.18 : 0.82 + Math.random() * 0.18; }
        g.beginPath(); g.moveTo(d.x * W, d.y * H); g.lineTo(d.x * W, d.y * H + d.l); g.stroke();
      }
      for (const s of stars) {
        const a = 0.25 + 0.65 * Math.abs(Math.sin(t * 0.0018 + s.p));
        g.fillStyle = `rgba(254, 240, 138, ${a.toFixed(2)})`;
        g.beginPath(); g.arc(s.x * W, s.y * H, s.r, 0, 6.28); g.fill();
      }
      requestAnimationFrame(loop);
    })(0);
  }

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
    $(id).classList.add('active');
  }
  function applyTheme(levelOrKingdom) {
    const idx = Math.floor(((levelOrKingdom - 1) / 50)) % 6;
    document.body.className = `theme-${idx}`;
    const bgPath = KINGDOM_BACKDROPS[idx % KINGDOM_BACKDROPS.length];
    $('kingdomBackdrop').style.backgroundImage = `url("${CDN_PRIMARY + bgPath}"), url("${CDN_FALLBACK + bgPath}")`;
  }
  function totalStars() { return Object.values(state.starsMap).reduce((a, b) => a + b, 0); }

  function renderMap() {
    syncHearts();
    const k = state.currentKingdom, half = state.currentHalf;
    const base = (k - 1) * 100 + (half === 1 ? 1 : 51);
    applyTheme(base);
    $('mapModeChip').textContent = state.mode === 'offline' ? '📴 أوفلاين' : (state.loggedIn ? '👑 Google' : '🌐 أونلاين');
    $('uiHearts').textContent = state.hearts;
    $('uiHeartTimer').textContent = heartTimerText();
    $('uiCoins').textContent = state.coins;
    $('uiStars').textContent = totalStars();
    $('uiStreak').textContent = state.streak;
    $('kingdomName').textContent = `المملكة ${k}: ${K_NAMES[(k - 1) % K_NAMES.length]}`;
    $('kingdomRange').textContent = `البيوت ${base} – ${base + 49} • الزعيم: ملك الحلوى (بيت ${base + 49})`;
    $('btnHalf1').classList.toggle('active', half === 1);
    $('btnHalf2').classList.toggle('active', half === 2);

    const grid = $('levelsGrid');
    grid.innerHTML = '';
    for (let i = 0; i < 50; i++) {
      const lv = base + i;
      const isBoss = lv % 50 === 0;
      const unlocked = lv <= state.maxLevel || (isBoss && lv === 50);
      const btn = document.createElement('button');
      btn.className = `lvl-node ${isBoss ? 'boss' : ''} ${lv === state.maxLevel ? 'current' : unlocked ? 'unlocked' : 'locked'}`;
      const st = state.starsMap[lv] || 0;
      btn.innerHTML = `<span>${isBoss ? '👑' : ''}${lv}</span><div class="lvl-stars">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div>`;
      btn.onclick = () => {
        if (!unlocked) return toast(`🔒 أكمل البيت ${state.maxLevel} أولاً`);
        openPreLevelModal(lv);
      };
      grid.appendChild(btn);
    }
  }

  function openModal(title, html) {
    $('modalTitle').textContent = title;
    $('modalBody').innerHTML = html;
    $('modalBackdrop').classList.add('open');
  }
  const closeModal = () => $('modalBackdrop').classList.remove('open');

  function showTutorial(step = 0) {
    const steps = [
      { t: '👑 مرحباً بك في Candy Magic Royale v2', b: 'تقول الملكة: «اسحب أي قطعتين متجاورتين لتكوين صف من 3 حلوى متشابهة أو أكثر وتجميع النقاط وكسر العوائق!»' },
      { t: '🐉 سر التنين للقوة الخارقة', b: 'يقول التنين: «طابق 4 قطع لصنع صاروخ، أو 5 قطع لصنع كرة شوكولاتة خارقة، أو حرف L/T لصنع حقيبة متفجرة!»' },
      { t: '😈 احذر ملك الحلوى في كل بيت 50', b: 'كل 50 بيتاً ستواجه الزعيم «ملك الحلوى» الذي يرمي عوائق كل 3 حركات — كل مطابقة تنقص صحته حتى تهزمه!' }
    ];
    const s = steps[step];
    openModal(s.t, `<p>${s.b}</p><div style="display:flex;gap:8px;margin-top:8px">
      <button id="tutNext" class="btn btn-gold" style="flex:1">${step < 2 ? 'التالي ◀' : 'ابدأ المغامرة! 🚀'}</button>
      <button id="tutSkip" class="btn btn-glass">تخطي</button>
    </div>`);
    $('tutNext').onclick = () => step < 2 ? showTutorial(step + 1) : (state.tutorialDone = true, persist(), closeModal());
    $('tutSkip').onclick = () => { state.tutorialDone = true; persist(); closeModal(); };
  }

  function levelConfig(lv) {
    const isBoss = lv % 50 === 0;
    const moves = isBoss ? 26 : clamp(22 - Math.floor((lv % 20) / 5), 14, 24);
    const target = isBoss ? 3500 + lv * 45 : 1000 + lv * 140;
    const obsPool = ['single_ice'];
    if (lv >= 3) obsPool.push('double_ice');
    if (lv >= 6) obsPool.push('waffle', 'chains');
    if (lv >= 10) obsPool.push('honey', 'cage');
    if (lv >= 15) obsPool.push('chocolate');
    if (lv >= 20 || isBoss) obsPool.push('chest');
    const obsCount = isBoss ? 10 : clamp(3 + Math.floor(lv / 2), 3, 14);
    const bossHp = isBoss ? 120 + Math.floor(lv / 50) * 60 : 0;
    return { lv, isBoss, moves, target, obsPool, obsCount, bossHp };
  }

  function openPreLevelModal(lv) {
    syncHearts();
    const cfg = levelConfig(lv);
    const streakBonus = state.streak >= 3 ? '🌈 كرة شوكولاتة + 🚀 صاروخ مجاني' : state.streak === 2 ? '💣 حقيبة متفجرة مجانية' : state.streak === 1 ? '🚀 صاروخ مجاني' : 'فُز بمرحلة لتفعيل سلسلة الفوز!';
    openModal(cfg.isBoss ? `👑 معركة الزعيم — البيت ${lv}` : `🎯 البيت ${lv}`, `
      <div class="card-row"><div><b>الهدف المطلوب</b><small>${cfg.target} نقطة + تكسير ${cfg.obsCount} عائق</small></div><span>🎯</span></div>
      <div class="card-row"><div><b>عدد الحركات</b><small>${cfg.moves} حركة متاحة</small></div><span>⚡</span></div>
      <div class="card-row"><div><b>سلسلة الفوز (🔥 ${state.streak})</b><small>${streakBonus}</small></div><span>🎁</span></div>
      <div class="card-row"><div><b>حالة اللعب</b><small>${state.mode === 'offline' ? '📴 جاهز أوفلاين بالكامل' : '🌐 متصل مع مزامنة التقدم'}</small></div><span>✅</span></div>
      <button id="btnLaunchLevel" class="btn btn-gold btn-lg">▶️ ابدأ اللعب الآن</button>
    `);
    $('btnLaunchLevel').onclick = () => {
      if (state.hearts <= 0) { closeModal(); return openHeartsModal(); }
      closeModal();
      startLevel(lv);
    };
  }

  function openHeartsModal() {
    syncHearts();
    openModal('❤️ نظام القلوب الذكي', `
      <p>لديك حالياً <b>${state.hearts}/${HEART_MAX}</b> قلوب. يتجدد قلب تلقائياً كل 25 دقيقة ${heartTimerText() ? `(القلب القادم خلال ${heartTimerText()})` : ''}.</p>
      ${state.mode === 'online' ? `<button id="adHeart" class="btn btn-ad">🎬 شاهد إعلاناً = +1 قلب مجاني</button>` : ''}
      <button id="buyHearts" class="btn btn-gold">🪙 تعبئة القلوب كاملة (100 عملة)</button>
    `);
    const adBtn = $('adHeart');
    if (adBtn) adBtn.onclick = () => runRewardedAd(() => { state.hearts = Math.min(HEART_MAX, state.hearts + 1); persist(); renderMap(); closeModal(); toast('❤️ حصلت على قلب مجاني!'); });
    $('buyHearts').onclick = () => {
      if (state.coins < 100) return toast('العملات غير كافية');
      state.coins -= 100; state.hearts = HEART_MAX; persist(); renderMap(); closeModal(); toast('❤️ تم شحن جميع القلوب!');
    };
  }

  function runRewardedAd(onReward) {
    if (state.mode === 'offline') return toast('الإعلانات متاحة في الوضع أونلاين فقط');
    openModal('🎬 إعلان مكافأة (Rewarded Ad)', `<p style="text-align:center">جاري عرض الإعلان... ستحصل على مكافأتك خلال <b id="adSec">3</b> ثوانٍ</p>`);
    let sec = 3;
    const iv = setInterval(() => {
      sec--;
      const el = $('adSec'); if (el) el.textContent = sec;
      if (sec <= 0) { clearInterval(iv); closeModal(); onReward(); }
    }, 1000);
  }

  function openProfile() {
    const badges = [
      { n: 'بداية ملكية', d: 'تخطي البيت 1', ok: state.maxLevel > 1 },
      { n: 'قاهر الجليد', d: 'تكسير 50 قطعة', ok: state.totalClears >= 50 },
      { n: 'قاهر ملك الحلوى', d: 'هزيمة الزعيم', ok: state.bossesDefeated >= 1 },
      { n: 'سلسلة نارية', d: 'الفوز بـ 3 متتالية', ok: state.streak >= 3 }
    ];
    openModal('👤 بروفايل اللاعب والشارات', `
      <div class="card-row"><div><b>${state.playerName}</b><small>البيت الحالي: ${state.maxLevel} / 10,000</small></div><span>${state.vipNoAds ? '👑 VIP' : '⭐'}</span></div>
      <div class="card-row"><div><b>إحصائياتك</b><small>النجوم: ${totalStars()} • الزعماء: ${state.bossesDefeated} • السلسلة: 🔥${state.streak}</small></div></div>
      <div class="badge-grid">${badges.map((b) => `<div class="badge-item ${b.ok ? '' : 'locked'}"><b>${b.ok ? '🏅' : '🔒'} ${b.n}</b><br/><small>${b.d}</small></div>`).join('')}</div>
    `);
  }

  function openQuests() {
    if (state.mode === 'offline') return openModal('📜 المهام اليومية', '<p>المهام اليومية تتطلب الاتصال بالإنترنت. يمكنك الاستمرار في لعب الـ 100 مملكة أوفلاين!</p>');
    const list = [
      { id: 'q1', t: 'طابق 30 قطعة حلوى', cur: state.quests.matches, max: 30, r: 120 },
      { id: 'q2', t: 'أكمل مرحلتين اليوم', cur: state.quests.levels, max: 2, r: 200 }
    ];
    openModal('📜 المهام اليومية', list.map((q) => {
      const done = q.cur >= q.max, cl = state.quests.claimed[q.id];
      return `<div class="card-row"><div><b>${q.t}</b><small>${Math.min(q.cur, q.max)}/${q.max} • المكافأة ${q.r} 🪙</small></div>
        <button class="btn ${done && !cl ? 'btn-gold' : 'btn-glass'}" data-q="${q.id}" data-r="${q.r}" ${!done || cl ? 'disabled' : ''}>${cl ? 'تم ✅' : 'استلام'}</button></div>`;
    }).join(''));
    document.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => {
      const id = b.dataset.q, r = +b.dataset.r;
      state.quests.claimed[id] = true; state.coins += r; persist(); renderMap(); openQuests(); toast(`🪙 +${r} عملة!`);
    });
  }

  function openWheel() {
    if (state.mode === 'offline') return openModal('🎡 العجلة اليومية', '<p>العجلة اليومية متاحة في الوضع أونلاين فقط.</p>');
    const today = new Date().toDateString();
    const canFree = state.lastSpinDay !== today;
    const rewards = [
      { label: '150 عملة 🪙', fn: () => state.coins += 150 },
      { label: 'قنبلة مجانية 💣', fn: () => state.boosters.bomb++ },
      { label: 'صاروخ مجاني 🚀', fn: () => state.boosters.rocket++ },
      { label: '300 عملة 🪙', fn: () => state.coins += 300 },
      { label: 'قلب مجاني ❤️', fn: () => state.hearts = Math.min(HEART_MAX, state.hearts + 1) },
      { label: 'فرشاة سحرية 🖌️', fn: () => state.boosters.paint++ }
    ];
    const spin = () => {
      const pick = rewards[Math.floor(Math.random() * rewards.length)];
      pick.fn(); state.lastSpinDay = today; persist(); renderMap(); closeModal();
      playSfx('win'); toast(`🎉 ربحت: ${pick.label}`);
    };
    openModal('🎡 العجلة اليومية الملكية', `
      <p style="text-align:center">أدِر العجلة واربح عملات ومعززات نادرة!</p>
      <button id="btnSpinFree" class="btn btn-gold" ${canFree ? '' : 'disabled'}>${canFree ? '🎡 لفة مجانية اليوم' : 'استخدمت لفتك المجانية اليوم'}</button>
      <button id="btnSpinAd" class="btn btn-ad">🎬 شاهد إعلاناً للفة إضافية</button>
    `);
    if (canFree) $('btnSpinFree').onclick = spin;
    $('btnSpinAd').onclick = () => runRewardedAd(spin);
  }

  function openShop() {
    if (state.mode === 'offline') return openModal('🛒 المتجر الملكي', '<p>المتجر الملكي يعمل عند الاتصال بالإنترنت.</p>');
    openModal('🛒 المتجر الملكي', `
      <div class="card-row"><div><b>حزمة المعززات الملكية</b><small>+2 قنبلة +2 صاروخ +1 فرشاة</small></div><button id="buyPack" class="btn btn-gold">250 🪙</button></div>
      <div class="card-row"><div><b>باقة VIP وإزالة الإعلانات للأبد</b><small>بدون إعلانات بينية + 1000 عملة</small></div><button id="buyVip" class="btn btn-royal">${state.vipNoAds ? 'مفعّلة ✅' : 'تفعيل VIP'}</button></div>
      <div class="card-row"><div><b>صندوق مجاني يومي</b><small>+100 عملة بمشاهدة إعلان</small></div><button id="adCoins" class="btn btn-ad">🎬 مجاني</button></div>
    `);
    $('buyPack').onclick = () => {
      if (state.coins < 250) return toast('عملاتك غير كافية');
      state.coins -= 250; state.boosters.bomb += 2; state.boosters.rocket += 2; state.boosters.paint += 1;
      persist(); renderMap(); toast('🎁 تم شراء حزمة المعززات!');
    };
    $('buyVip').onclick = () => {
      if (state.vipNoAds) return;
      state.vipNoAds = true; state.coins += 1000; persist(); renderMap(); openShop(); toast('👑 أهلاً بك في عضوية VIP!');
    };
    $('adCoins').onclick = () => runRewardedAd(() => { state.coins += 100; persist(); renderMap(); toast('🪙 +100 عملة مجانية!'); });
  }

  function openLeaderboard() {
    const board = [
      { n: 'الأميرة ليلى 👑', s: Math.max(420, totalStars() + 85) },
      { n: 'فارس الحلوى 🐉', s: Math.max(260, totalStars() + 30) },
      { n: `${state.playerName} (أنت)`, s: totalStars(), me: true },
      { n: 'ساحر الكريستال ✨', s: Math.max(12, totalStars() - 10) }
    ].sort((a, b) => b.s - a.s);
    openModal('🏆 قائمة المتصدرين', board.map((r, i) => `
      <div class="card-row" style="${r.me ? 'border-color:#fde047;background:rgba(253,224,71,0.14)' : ''}">
        <b>#${i + 1} ${r.n}</b><span>⭐ ${r.s}</span>
      </div>`).join(''));
  }

  function openSettings() {
    openModal('⚙️ الإعدادات', `
      <div class="card-row"><b>الصوت والمؤثرات</b><button id="togMute" class="btn btn-glass">${state.muted ? '🔇 صامت' : '🔊 مفعل'}</button></div>
      <div class="card-row"><b>إعادة عرض الشرح</b><button id="replayTut" class="btn btn-royal">عرض الشرح</button></div>
      <div class="card-row"><b>تصفير التقدم</b><button id="resetSave" class="btn btn-glass">إعادة ضبط</button></div>
    `);
    $('togMute').onclick = () => { state.muted = !state.muted; persist(); $('btnMute').textContent = state.muted ? '🔇' : '🔊'; openSettings(); };
    $('replayTut').onclick = () => { closeModal(); showTutorial(0); };
    $('resetSave').onclick = () => { localStorage.removeItem(SAVE_KEY); state = defaultState(); persist(); closeModal(); renderMap(); toast('تم تصفير التقدم'); };
  }

  const canvas = $('gameCanvas'), ctx = canvas.getContext('2d');
  let board = [], cellSize = 48, offsetX = 0, offsetY = 0;
  let activeCfg = null, score = 0, movesLeft = 20, bossHp = 0, bossMaxHp = 0, bossTurnCtr = 0;
  let busy = false, armedBooster = null, selected = null, dragStart = null;
  let hintPair = null, lastActionTs = Date.now(), particles = [], shockwaves = [];

  const mkCell = (color, special = null, obs = null, hp = 0) => ({
    color, special, obs, hp, x: 0, y: 0, scale: 1, alpha: 1
  });

  function spawnFxText(txt) {
    const el = document.createElement('div');
    el.className = 'float-txt'; el.textContent = txt;
    $('fxLayer').appendChild(el);
    setTimeout(() => el.remove(), 950);
  }
  function triggerCelebrate() {
    $('queenBadge').classList.add('celebrate');
    $('dragonBadge').classList.add('celebrate');
    setTimeout(() => { $('queenBadge').classList.remove('celebrate'); $('dragonBadge').classList.remove('celebrate'); }, 550);
  }
  function triggerBoardShake() {
    const f = $('boardFrame'); f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake');
  }
  function spawnBurst(r, c, colorIdx, big = false) {
    const cx = offsetX + (c + 0.5) * cellSize, cy = offsetY + (r + 0.5) * cellSize;
    const col = FALLBACK_COLORS[colorIdx % FALLBACK_COLORS.length] || '#fde047';
    const n = big ? 18 : 9;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, sp = (big ? 2.5 : 1.4) + Math.random() * 3.8;
      particles.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1, r: (big ? 4.5 : 3) + Math.random() * 2.5, life: 1, col });
    }
    if (big) shockwaves.push({ x: cx, y: cy, r: 8, maxR: cellSize * 2.2, life: 1, col });
  }

  function resizeBoard() {
    const rect = $('boardFrame').getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(260, rect.width - 12), h = Math.max(300, rect.height - 12);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cellSize = Math.floor(Math.min(w / COLS, h / ROWS));
    offsetX = Math.floor((w - cellSize * COLS) / 2);
    offsetY = Math.floor((h - cellSize * ROWS) / 2);
  }

  function countObstacles() {
    let n = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r]?.[c]?.obs) n++;
    return n;
  }

  function updateHud() {
    $('hudLevel').textContent = activeCfg.lv;
    $('hudMoves').textContent = movesLeft;
    $('hudScore').textContent = score;
    $('hudTarget').textContent = activeCfg.target;
    $('hudObs').textContent = countObstacles();
    $('cntBomb').textContent = state.boosters.bomb;
    $('cntRocket').textContent = state.boosters.rocket;
    $('cntPaint').textContent = state.boosters.paint;
    $('cntShuffle').textContent = state.boosters.shuffle;
    $('cntSwap').textContent = state.boosters.swap;
    const sb = $('streakGameBadge');
    sb.style.display = state.streak > 0 ? 'inline-block' : 'none';
    sb.textContent = `🔥${state.streak}`;
    if (activeCfg.isBoss) {
      $('bossBarWrap').style.display = 'block';
      $('bossHpTxt').textContent = `${Math.max(0, bossHp)}/${bossMaxHp}`;
      $('bossHpFill').style.width = `${clamp((bossHp / bossMaxHp) * 100, 0, 100)}%`;
      $('bossAttackHint').textContent = `هجوم ملك الحلوى بعد ${3 - (bossTurnCtr % 3)} حركة`;
    } else {
      $('bossBarWrap').style.display = 'none';
    }
  }

  function buildBoard(cfg) {
    const colorsCount = cfg.lv <= 4 ? 5 : cfg.lv <= 15 ? 6 : 7;
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        let col;
        do { col = Math.floor(Math.random() * colorsCount); }
        while ((c >= 2 && board[r][c - 1].color === col && board[r][c - 2].color === col) ||
               (r >= 2 && board[r - 1][c].color === col && board[r - 2][c].color === col));
        const cell = mkCell(col);
        cell.x = c; cell.y = r - 2;
        board[r][c] = cell;
      }
    }
    let placed = 0, guard = 0;
    while (placed < cfg.obsCount && guard++ < 200) {
      const r = 1 + Math.floor(Math.random() * (ROWS - 2));
      const c = Math.floor(Math.random() * COLS);
      if (board[r][c].obs) continue;
      const type = cfg.obsPool[Math.floor(Math.random() * cfg.obsPool.length)];
      const hp = (type === 'double_ice' || type === 'honey' || type === 'waffle' || type === 'chest') ? 2 : 1;
      board[r][c].obs = type;
      board[r][c].hp = hp;
      placed++;
    }
    const freeSpecials = state.streak >= 3 ? ['color', 'striped'] : state.streak === 2 ? ['wrapped'] : state.streak === 1 ? ['striped'] : [];
    for (const sp of freeSpecials) {
      for (let tries = 0; tries < 40; tries++) {
        const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
        if (!board[r][c].obs && !board[r][c].special) { board[r][c].special = sp; break; }
      }
    }
  }

  const isLockedCell = (cell) => cell && (cell.obs === 'single_ice' || cell.obs === 'double_ice' || cell.obs === 'chains' || cell.obs === 'cage' || cell.obs === 'chocolate' || cell.obs === 'honey' || cell.obs === 'waffle' || cell.obs === 'chest');
  const isSolidBlocker = (cell) => cell && (cell.obs === 'chocolate' || cell.obs === 'honey' || cell.obs === 'waffle' || cell.obs === 'chest');

  function findMatches() {
    const groups = [];
    for (let r = 0; r < ROWS; r++) {
      let c = 0;
      while (c < COLS) {
        const cell = board[r][c];
        if (!cell || isSolidBlocker(cell)) { c++; continue; }
        let k = c + 1;
        while (k < COLS && board[r][k] && !isSolidBlocker(board[r][k]) && board[r][k].color === cell.color) k++;
        if (k - c >= 3) groups.push({ dir: 'h', cells: Array.from({ length: k - c }, (_, i) => [r, c + i]), color: cell.color });
        c = k;
      }
    }
    for (let c = 0; c < COLS; c++) {
      let r = 0;
      while (r < ROWS) {
        const cell = board[r][c];
        if (!cell || isSolidBlocker(cell)) { r++; continue; }
        let k = r + 1;
        while (k < ROWS && board[k][c] && !isSolidBlocker(board[k][c]) && board[k][c].color === cell.color) k++;
        if (k - r >= 3) groups.push({ dir: 'v', cells: Array.from({ length: k - r }, (_, i) => [r + i, c]), color: cell.color });
        r = k;
      }
    }
    return groups;
  }

  function findHint() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (isLockedCell(board[r][c])) continue;
        for (const [dr, dc] of [[0, 1], [1, 0]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= ROWS || nc >= COLS || isLockedCell(board[nr][nc])) continue;
          if (board[r][c].special === 'color' || board[nr][nc].special === 'color') return [[r, c], [nr, nc]];
          [board[r][c], board[nr][nc]] = [board[nr][nc], board[r][c]];
          const ok = findMatches().length > 0;
          [board[r][c], board[nr][nc]] = [board[nr][nc], board[r][c]];
          if (ok) return [[r, c], [nr, nc]];
        }
      }
    }
    return null;
  }

  function shuffleBoard() {
    const free = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!isLockedCell(board[r][c])) free.push(board[r][c].color);
    for (let i = free.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [free[i], free[j]] = [free[j], free[i]]; }
    let idx = 0;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!isLockedCell(board[r][c])) board[r][c].color = free[idx++];
    spawnFxText('🔀 خلط سحري!');
  }

  function damageObstacle(r, c, clearedChocoRef) {
    const cell = board[r]?.[c];
    if (!cell || !cell.obs) return false;
    cell.hp--;
    if (cell.obs === 'double_ice' && cell.hp === 1) { cell.obs = 'single_ice'; spawnBurst(r, c, 2, false); return true; }
    if (cell.hp <= 0) {
      const old = cell.obs;
      cell.obs = null; cell.hp = 0;
      spawnBurst(r, c, cell.color, true);
      if (old === 'chocolate') clearedChocoRef.cleared = true;
      if (old === 'chest') {
        movesLeft += 2;
        cell.special = Math.random() < 0.5 ? 'striped' : 'wrapped';
        spawnFxText('🎁 صندوق كنز: +2 حركة!');
      }
      return true;
    }
    return false;
  }

  function expandSpecial(r, c, set) {
    const cell = board[r]?.[c];
    if (!cell || !cell.special) return;
    const sp = cell.special;
    cell.special = null;
    playSfx('boom');
    triggerBoardShake();
    if (sp === 'striped') {
      for (let cc = 0; cc < COLS; cc++) set.add(`${r},${cc}`);
      for (let rr = 0; rr < ROWS; rr++) set.add(`${rr},${c}`);
      spawnFxText('🚀 انفجار صاروخي!');
    } else if (sp === 'wrapped') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) set.add(`${rr},${cc}`);
      }
      spawnFxText('💣 انفجار حقيبة!');
    } else if (sp === 'color') {
      const targetColor = cell.color;
      for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) if (board[rr][cc]?.color === targetColor) set.add(`${rr},${cc}`);
      spawnFxText('🌈 طاقة قوس قزح!');
    }
  }

  function spreadChocolateIfNeeded(clearedChoco) {
    if (clearedChoco) return;
    const chocos = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (board[r][c]?.obs === 'chocolate') chocos.push([r, c]);
    if (!chocos.length) return;
    const cands = [];
    for (const [r, c] of chocos) {
      for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc] && !board[nr][nc].obs && !board[nr][nc].special) cands.push([nr, nc]);
      }
    }
    if (cands.length) {
      const [tr, tc] = cands[Math.floor(Math.random() * cands.length)];
      board[tr][tc].obs = 'chocolate'; board[tr][tc].hp = 1;
      spawnFxText('🍫 الشوكولاتة تنتشر!');
    }
  }

  function bossAttack() {
    if (!activeCfg.isBoss || bossHp <= 0) return;
    bossTurnCtr++;
    if (bossTurnCtr % 3 !== 0) return;
    playSfx('boss');
    triggerBoardShake();
    const wrap = $('bossBarWrap'); wrap.classList.remove('hit'); void wrap.offsetWidth; wrap.classList.add('hit');
    const pool = ['single_ice', 'chains', 'chocolate', 'cage'];
    let thrown = 0;
    for (let tries = 0; tries < 60 && thrown < 2; tries++) {
      const r = Math.floor(Math.random() * ROWS), c = Math.floor(Math.random() * COLS);
      if (board[r][c] && !board[r][c].obs) {
        const obs = pool[Math.floor(Math.random() * pool.length)];
        board[r][c].obs = obs; board[r][c].hp = 1;
        spawnBurst(r, c, 5, true);
        thrown++;
      }
    }
    spawnFxText('😈 ملك الحلوى رمى عائقين!');
  }

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  async function resolveBoard(swapOrigin = null) {
    let combo = 0;
    const clearedChocoRef = { cleared: false };
    while (true) {
      const groups = findMatches();
      if (!groups.length) break;
      combo++;
      playSfx('match');
      const toClear = new Set();
      const spawnSpecials = [];
      for (const g of groups) {
        for (const [r, c] of g.cells) toClear.add(`${r},${c}`);
        if (g.cells.length >= 5) spawnSpecials.push({ pos: swapOrigin || g.cells[2], color: g.color, sp: 'color' });
        else if (g.cells.length === 4) spawnSpecials.push({ pos: swapOrigin || g.cells[1], color: g.color, sp: 'striped' });
      }
      if (groups.length >= 2) {
        const seen = new Map();
        for (const g of groups) for (const [r, c] of g.cells) {
          const k = `${r},${c}`;
          if (seen.has(k)) spawnSpecials.push({ pos: [r, c], color: g.color, sp: 'wrapped' });
          seen.set(k, true);
        }
      }
      for (const key of [...toClear]) {
        const [r, c] = key.split(',').map(Number);
        if (board[r][c]?.special) expandSpecial(r, c, toClear);
      }

      const adjHit = new Set();
      let gained = 0;
      for (const key of toClear) {
        const [r, c] = key.split(',').map(Number);
        const cell = board[r][c];
        if (!cell) continue;
        gained += 60 * combo;
        state.totalClears++;
        state.quests.matches++;
        spawnBurst(r, c, cell.color, combo >= 2);
        if (cell.obs) damageObstacle(r, c, clearedChocoRef);
        for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc]?.obs) adjHit.add(`${nr},${nc}`);
        }
        if (!cell.obs) board[r][c] = null;
      }
      for (const key of adjHit) {
        const [r, c] = key.split(',').map(Number);
        if (board[r][c]?.obs && board[r][c].obs !== 'chains' && board[r][c].obs !== 'cage') damageObstacle(r, c, clearedChocoRef);
      }
      for (const s of spawnSpecials) {
        const [r, c] = s.pos;
        board[r][c] = mkCell(s.color, s.sp);
        board[r][c].x = c; board[r][c].y = r;
      }

      score += gained;
      if (activeCfg.isBoss) {
        const dmg = Math.max(8, Math.round(toClear.size * 3.2 * combo));
        bossHp = Math.max(0, bossHp - dmg);
        const wrap = $('bossBarWrap'); wrap.classList.remove('hit'); void wrap.offsetWidth; wrap.classList.add('hit');
        spawnFxText(`⚔️ ضربة للزعيم -${dmg}!`);
      } else if (combo >= 2) {
        triggerCelebrate();
        spawnFxText(`✨ كومبو ×${combo}!`);
      }
      updateHud();
      await sleep(170);

      const colorsCount = activeCfg.lv <= 4 ? 5 : activeCfg.lv <= 15 ? 6 : 7;
      for (let c = 0; c < COLS; c++) {
        let write = ROWS - 1;
        for (let r = ROWS - 1; r >= 0; r--) {
          if (board[r][c]) {
            if (write !== r) { board[write][c] = board[r][c]; board[r][c] = null; }
            write--;
          }
        }
        for (let r = write; r >= 0; r--) {
          const cell = mkCell(Math.floor(Math.random() * colorsCount));
          cell.x = c; cell.y = r - (write + 1.4);
          board[r][c] = cell;
        }
      }
      await sleep(170);
      swapOrigin = null;
    }
    spreadChocolateIfNeeded(clearedChocoRef.cleared);
    if (!findHint()) shuffleBoard();
    hintPair = null; lastActionTs = Date.now();
    updateHud();
  }

  async function attemptSwap(r1, c1, r2, c2) {
    if (busy || Math.abs(r1 - r2) + Math.abs(c1 - c2) !== 1) return;
    const a = board[r1]?.[c1], b = board[r2]?.[c2];
    if (!a || !b) return;
    if (armedBooster !== 'swap' && (isLockedCell(a) || isLockedCell(b))) {
      toast('🔒 هذه الخلية مقفلة بعائق!');
      return;
    }
    busy = true;
    playSfx('swap');
    [board[r1][c1], board[r2][c2]] = [b, a];
    await sleep(130);

    const isSpecialCombo = (a.special && b.special) || a.special === 'color' || b.special === 'color';
    const hasMatch = isSpecialCombo || findMatches().length > 0;
    if (!hasMatch && armedBooster !== 'swap') {
      [board[r1][c1], board[r2][c2]] = [a, b];
      await sleep(110);
      busy = false;
      return;
    }
    if (armedBooster === 'swap') {
      state.boosters.swap--; armedBooster = null;
      document.querySelectorAll('.booster-btn').forEach((x) => x.classList.remove('armed'));
    } else {
      movesLeft--;
    }

    if (isSpecialCombo) {
      const set = new Set();
      if (a.special === 'color' && b.special === 'color') {
        for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) set.add(`${rr},${cc}`);
        spawnFxText('👑💥 انفجار ملكي شامل!');
      } else if (a.special === 'color' || b.special === 'color') {
        const targetColor = a.special === 'color' ? b.color : a.color;
        for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) if (board[rr][cc]?.color === targetColor) set.add(`${rr},${cc}`);
        set.add(`${r1},${c1}`); set.add(`${r2},${c2}`);
        spawnFxText('🌈 طاقة قوس قزح!');
      } else {
        expandSpecial(r1, c1, set); expandSpecial(r2, c2, set);
      }
      const clearedRef = { cleared: false };
      for (const k of set) {
        const [rr, cc] = k.split(',').map(Number);
        if (board[rr][cc]) {
          score += 85;
          spawnBurst(rr, cc, board[rr][cc].color, true);
          if (board[rr][cc].obs) damageObstacle(rr, cc, clearedRef);
          if (!board[rr][cc].obs) board[rr][cc] = null;
        }
      }
      if (activeCfg.isBoss) bossHp = Math.max(0, bossHp - Math.round(set.size * 3.5));
      triggerCelebrate(); triggerBoardShake(); playSfx('boom');
      await sleep(180);
    }

    await resolveBoard([r2, c2]);
    if (activeCfg.isBoss && bossHp > 0 && movesLeft > 0) bossAttack();
    updateHud();
    checkEndState();
    busy = false;
  }

  async function applyBoosterAt(r, c) {
    if (!armedBooster || busy) return;
    if (armedBooster === 'shuffle' || armedBooster === 'swap') return;
    busy = true;
    const b = armedBooster;
    state.boosters[b]--;
    armedBooster = null;
    document.querySelectorAll('.booster-btn').forEach((x) => x.classList.remove('armed'));
    const set = new Set();
    if (b === 'bomb') {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr, cc = c + dc;
        if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) set.add(`${rr},${cc}`);
      }
      spawnFxText('💣 قنبلة 3×3!');
    } else if (b === 'rocket') {
      for (let cc = 0; cc < COLS; cc++) set.add(`${r},${cc}`);
      for (let rr = 0; rr < ROWS; rr++) set.add(`${rr},${c}`);
      spawnFxText('🚀 صاروخ مزدوج!');
    } else if (b === 'paint') {
      const col = board[r][c]?.color ?? 0;
      for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) if (board[rr][cc]?.color === col) set.add(`${rr},${cc}`);
      spawnFxText('🖌️ فرشاة قوس قزح!');
    }
    const clearedRef = { cleared: false };
    for (const k of set) {
      const [rr, cc] = k.split(',').map(Number);
      if (board[rr][cc]) {
        score += 75;
        spawnBurst(rr, cc, board[rr][cc].color, true);
        if (board[rr][cc].obs) damageObstacle(rr, cc, clearedRef);
        if (!board[rr][cc].obs) board[rr][cc] = null;
      }
    }
    if (activeCfg.isBoss) bossHp = Math.max(0, bossHp - 28);
    playSfx('boom'); triggerBoardShake(); triggerCelebrate();
    await sleep(160);
    await resolveBoard();
    persist(); updateHud(); checkEndState();
    busy = false;
  }

  function checkEndState() {
    const obsLeft = countObstacles();
    const won = activeCfg.isBoss ? (bossHp <= 0) : (score >= activeCfg.target && obsLeft === 0);
    if (won) {
      playSfx('win');
      const stars = movesLeft >= 8 ? 3 : movesLeft >= 4 ? 2 : 1;
      const reward = (activeCfg.isBoss ? 250 : 60) + stars * 20;
      state.coins += reward;
      state.streak++;
      state.quests.levels++;
      if (activeCfg.isBoss) state.bossesDefeated++;
      state.starsMap[activeCfg.lv] = Math.max(state.starsMap[activeCfg.lv] || 0, stars);
      if (activeCfg.lv >= state.maxLevel) state.maxLevel = Math.min(10000, activeCfg.lv + 1);
      state.levelsPlayedSinceAd++;
      persist();
      openModal(activeCfg.isBoss ? '👑 انتصار أسطوري على ملك الحلوى!' : `🎉 أحسنت! فزت بالبيت ${activeCfg.lv}`, `
        <p style="text-align:center;font-size:26px;color:#fde047">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</p>
        <div class="card-row"><b>النقاط: ${score}</b><span>🪙 +${reward}</span></div>
        <div class="card-row"><b>سلسلة الفوز الحالية</b><span>🔥 ${state.streak}</span></div>
        ${state.mode === 'online' ? `<button id="btnDoubleCoins" class="btn btn-ad">🎬 شاهد إعلاناً = مضاعفة العملات (×2)</button>` : ''}
        <button id="btnNextLv" class="btn btn-gold">البيت التالي (${activeCfg.lv + 1}) ◀</button>
        <button id="btnToMap" class="btn btn-glass">العودة للخريطة</button>
      `);
      const dbl = $('btnDoubleCoins');
      if (dbl) dbl.onclick = () => runRewardedAd(() => { state.coins += reward; persist(); toast(`🪙 +${reward} عملة إضافية!`); showScreen('mapScreen'); renderMap(); });
      $('btnNextLv').onclick = () => { closeModal(); startLevel(activeCfg.lv + 1); };
      $('btnToMap').onclick = () => { closeModal(); showScreen('mapScreen'); renderMap(); };
      return;
    }
    if (movesLeft <= 0) {
      openModal('⏳ نفدت الحركات!', `
        <p>اقتربت جداً من الفوز! احتفظ بسلسلة فوزك (🔥 ${state.streak}) وأكمل المرحلة:</p>
        ${state.mode === 'online' ? `<button id="btnAdMoves" class="btn btn-ad">🎬 شاهد إعلاناً = +5 حركات مجانية</button>` : ''}
        <button id="btnCoinMoves" class="btn btn-gold">🪙 +5 حركات (80 عملة)</button>
        <button id="btnGiveUp" class="btn btn-glass">خروج (خسارة قلب)</button>
      `);
      const am = $('btnAdMoves');
      if (am) am.onclick = () => runRewardedAd(() => { movesLeft += 5; updateHud(); toast('⚡ +5 حركات مجانية!'); });
      $('btnCoinMoves').onclick = () => {
        if (state.coins < 80) return toast('العملات غير كافية');
        state.coins -= 80; movesLeft += 5; persist(); closeModal(); updateHud();
      };
      $('btnGiveUp').onclick = () => {
        state.hearts = Math.max(0, state.hearts - 1);
        if (state.hearts < HEART_MAX && !state.lastHeartTs) state.lastHeartTs = Date.now();
        state.streak = 0; persist(); closeModal(); showScreen('mapScreen'); renderMap();
      };
    }
  }

  function startLevel(lv) {
    activeCfg = levelConfig(lv);
    score = 0; movesLeft = activeCfg.moves;
    bossHp = bossMaxHp = activeCfg.bossHp; bossTurnCtr = 0;
    armedBooster = null; selected = null; hintPair = null; lastActionTs = Date.now();
    applyTheme(lv);
    showScreen('gameScreen');
    resizeBoard();
    buildBoard(activeCfg);
    updateHud();
    if (activeCfg.isBoss) spawnFxText('👑 معركة ملك الحلوى!');
  }

  function drawSpriteFit(entry, x, y, size, pad = 2) {
    if (!entry || !entry.ready || !entry.img) return false;
    ctx.drawImage(entry.img, x + pad, y + pad, size - pad * 2, size - pad * 2);
    return true;
  }

  function renderLoop(ts) {
    if ($('gameScreen').classList.contains('active') && board.length === ROWS) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!busy && !hintPair && Date.now() - lastActionTs > 5000) hintPair = findHint();
      const pulse = 0.5 + 0.5 * Math.sin(ts * 0.008);

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const px = offsetX + c * cellSize, py = offsetY + r * cellSize;
          ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)';
          ctx.beginPath(); ctx.roundRect(px + 2, py + 2, cellSize - 4, cellSize - 4, 10); ctx.fill();
        }
      }

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const cell = board[r][c];
          if (!cell) continue;
          cell.x += (c - cell.x) * 0.28;
          cell.y += (r - cell.y) * 0.28;
          const px = offsetX + cell.x * cellSize, py = offsetY + cell.y * cellSize;
          const isHint = hintPair && hintPair.some(([hr, hc]) => hr === r && hc === c);
          const isSel = selected && selected[0] === r && selected[1] === c;

          ctx.save();
          if (isHint || isSel) {
            ctx.shadowColor = '#fde047'; ctx.shadowBlur = 14 + pulse * 10;
            const sc = 1 + pulse * 0.08;
            ctx.translate(px + cellSize / 2, py + cellSize / 2); ctx.scale(sc, sc); ctx.translate(-(px + cellSize / 2), -(py + cellSize / 2));
          }

          if (!isSolidBlocker(cell)) {
            const path = cell.special === 'color' ? COLOR_BOMB_FILE
              : cell.special === 'wrapped' ? WRAPPED_FILES[cell.color % WRAPPED_FILES.length]
              : (cell.special === 'striped' || cell.special === 'striped_h' || cell.special === 'striped_v') ? STRIPED_FILES[cell.color % STRIPED_FILES.length]
              : CANDY_FILES[cell.color % CANDY_FILES.length];
            const drawn = drawSpriteFit(IMG_CACHE.get(path), px, py, cellSize, 3);
            if (!drawn) {
              ctx.fillStyle = FALLBACK_COLORS[cell.color % FALLBACK_COLORS.length];
              ctx.beginPath(); ctx.arc(px + cellSize / 2, py + cellSize / 2, cellSize * 0.36, 0, 6.28); ctx.fill();
            }
          }

          if (cell.obs) {
            const obsEntry = IMG_CACHE.get(OBS_FILES[cell.obs]);
            if (cell.obs === 'single_ice' || cell.obs === 'double_ice') {
              ctx.globalAlpha = cell.obs === 'double_ice' ? 0.9 : 0.72;
              drawSpriteFit(obsEntry, px, py, cellSize, 1);
              ctx.globalAlpha = 1;
            } else {
              drawSpriteFit(obsEntry, px, py, cellSize, 2);
            }
            if (cell.hp > 1) {
              ctx.fillStyle = 'rgba(0,0,0,0.72)';
              ctx.beginPath(); ctx.arc(px + cellSize - 10, py + 10, 8, 0, 6.28); ctx.fill();
              ctx.fillStyle = '#fde047'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText(String(cell.hp), px + cellSize - 10, py + 10);
            }
          }
          ctx.restore();
        }
      }

      shockwaves = shockwaves.filter((w) => {
        w.r += (w.maxR - w.r) * 0.16; w.life -= 0.05;
        ctx.strokeStyle = w.col; ctx.globalAlpha = Math.max(0, w.life); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(w.x, w.y, w.r, 0, 6.28); ctx.stroke();
        ctx.globalAlpha = 1;
        return w.life > 0;
      });
      particles = particles.filter((p) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.14; p.life -= 0.035;
        ctx.fillStyle = p.col; ctx.globalAlpha = Math.max(0, p.life);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, 6.28); ctx.fill();
        ctx.globalAlpha = 1;
        return p.life > 0;
      });
    }
    requestAnimationFrame(renderLoop);
  }

  function pointerToCell(ev) {
    const rect = canvas.getBoundingClientRect();
    const x = (ev.clientX - rect.left) - offsetX, y = (ev.clientY - rect.top) - offsetY;
    const c = Math.floor(x / cellSize), r = Math.floor(y / cellSize);
    return (r >= 0 && r < ROWS && c >= 0 && c < COLS) ? [r, c] : null;
  }
  canvas.addEventListener('pointerdown', (e) => {
    lastActionTs = Date.now(); hintPair = null;
    const cell = pointerToCell(e); if (!cell) return;
    if (armedBooster && armedBooster !== 'swap') return applyBoosterAt(cell[0], cell[1]);
    dragStart = { r: cell[0], c: cell[1], x: e.clientX, y: e.clientY };
    if (selected && Math.abs(selected[0] - cell[0]) + Math.abs(selected[1] - cell[1]) === 1) {
      const s = selected; selected = null; dragStart = null;
      attemptSwap(s[0], s[1], cell[0], cell[1]);
    } else {
      selected = cell;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragStart || busy) return;
    const dx = e.clientX - dragStart.x, dy = e.clientY - dragStart.y;
    if (Math.hypot(dx, dy) < 14) return;
    const nr = dragStart.r + (Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0);
    const nc = dragStart.c + (Math.abs(dx) >= Math.abs(dy) ? Math.sign(dx) : 0);
    const sr = dragStart.r, sc = dragStart.c;
    dragStart = null; selected = null;
    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) attemptSwap(sr, sc, nr, nc);
  });
  window.addEventListener('pointerup', () => { dragStart = null; });
  window.addEventListener('resize', () => { if ($('gameScreen').classList.contains('active')) resizeBoard(); });

  function enterMap(mode) {
    state.mode = mode; persist();
    showScreen('mapScreen'); renderMap();
    if (!state.tutorialDone) showTutorial(0);
  }
  $('btnPlayOnline').onclick = () => enterMap('online');
  $('btnPlayOffline').onclick = () => enterMap('offline');
  $('btnGoogleSignIn').onclick = () => { state.loggedIn = true; state.playerName = 'بطل جوجل الملكي'; toast('✅ تم ربط الحساب بنجاح'); enterMap('online'); };
  $('btnPrevKingdom').onclick = () => { state.currentKingdom = state.currentKingdom > 1 ? state.currentKingdom - 1 : 100; persist(); renderMap(); };
  $('btnNextKingdom').onclick = () => { state.currentKingdom = state.currentKingdom < 100 ? state.currentKingdom + 1 : 1; persist(); renderMap(); };
  $('btnHalf1').onclick = () => { state.currentHalf = 1; persist(); renderMap(); };
  $('btnHalf2').onclick = () => { state.currentHalf = 2; persist(); renderMap(); };
  $('btnQuickBoss').onclick = () => openPreLevelModal(50);
  $('btnHeartsInfo').onclick = openHeartsModal;
  $('btnSettingsMap').onclick = openSettings;
  $('navProfile').onclick = openProfile;
  $('navQuests').onclick = openQuests;
  $('navWheel').onclick = openWheel;
  $('navShop').onclick = openShop;
  $('navLeader').onclick = openLeaderboard;
  $('btnBackMap').onclick = () => { showScreen('mapScreen'); renderMap(); };
  $('btnMute').onclick = () => { state.muted = !state.muted; persist(); $('btnMute').textContent = state.muted ? '🔇' : '🔊'; };
  $('btnCloseModal').onclick = closeModal;
  $('modalBackdrop').onclick = (e) => { if (e.target === $('modalBackdrop')) closeModal(); };

  document.querySelectorAll('.booster-btn').forEach((btn) => {
    btn.onclick = () => {
      const b = btn.dataset.b;
      if (state.boosters[b] <= 0) return toast('نفد هذا المعزز! احصل عليه من المتجر أو العجلة');
      if (b === 'shuffle') {
        state.boosters.shuffle--; shuffleBoard(); persist(); updateHud(); return;
      }
      armedBooster = armedBooster === b ? null : b;
      document.querySelectorAll('.booster-btn').forEach((x) => x.classList.toggle('armed', x.dataset.b === armedBooster));
      if (armedBooster) toast(b === 'swap' ? 'اختر قطعتين للتبديل الحر' : 'اضغط على أي خلية لتفعيل المعزز');
    };
  });

  setInterval(() => {
    if ($('mapScreen').classList.contains('active')) {
      syncHearts();
      $('uiHearts').textContent = state.hearts;
      $('uiHeartTimer').textContent = heartTimerText();
    }
  }, 1000);

  preloadAllSprites();
  initLivingBg();
  requestAnimationFrame(renderLoop);
})();
