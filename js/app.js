/*
 * STOP-4P Healthcare Staff — lõi ứng dụng: trạng thái, điều hướng, các màn hình S01–S10.
 * Các trình phát bài tập và trò chơi STOP-4P nằm trong players.js.
 */
(() => {
  'use strict';
  const C = window.STOP4P_CONFIG;
  const D = window.STOP4P_DATA;
  const E = window.STOP4P_ENGINE;
  const S = window.STOP4P_STORE;
  const EX = D.EXERCISES;

  /* ================= Tiện ích ================= */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id' + Date.now() + Math.random().toString(16).slice(2));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmtMin = ex => ex.min === ex.max ? `${ex.min} phút` : `${String(ex.min).replace('.', ',')}–${ex.max} phút`;
  const DISTRESS_EMOJI = ['🤩', '😄', '😊', '🙂', '😐', '😕', '☹️', '😟', '😣', '😫', '😭'];

  function assetImg(file, emoji, alt, cls = '') {
    if (!file) return `<span class="emoji-fallback ${cls}" role="img" aria-label="${esc(alt)}">${emoji}</span>`;
    return `<img class="${cls}" src="${esc(C.ASSET_BASE + file)}" alt="${esc(alt)}" data-fallback="${esc(emoji)}" loading="lazy">`;
  }
  function capy(distress, cls = 'capy') {
    const d = distress == null ? 5 : distress;
    const level = clamp(10 - d, 1, 10);
    return assetImg(`capy-level-${String(level).padStart(2, '0')}.png`, DISTRESS_EMOJI[d], 'Bạn capybara đồng hành', cls);
  }
  // Ảnh lỗi → emoji
  document.addEventListener('error', e => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.dataset.fallback) {
      const span = document.createElement('span');
      span.className = 'emoji-fallback ' + t.className;
      span.setAttribute('role', 'img');
      span.setAttribute('aria-label', t.alt);
      span.textContent = t.dataset.fallback;
      t.replaceWith(span);
    }
  }, true);

  /* ================= Trạng thái ================= */
  const newCheckin = () => ({ emotions: [], distress: null, narrative: '', contexts: [], minutes: null, focusTask: false, piiAck: false, labelsEdited: false, done: false });
  const newSession = () => ({ id: uid(), startedAt: new Date().toISOString(), exercises: [], distressAfter: null, fit: null, stop4p: null, relax4: null, journal: null, saved: false });

  const state = {
    mode: null, memberKey: null, account: null,
    profile: null, // guest: chỉ trong bộ nhớ
    checkin: newCheckin(), rec: null, recAttempt: 0, piiHits: [],
    session: newSession(),
    otp: null, afterLogin: null,
    stack: []
  };

  /* ================= Hẹn giờ & dọn dẹp giữa các màn hình ================= */
  let cleanups = [];
  let currentActions = null; // hành động riêng của màn hình hiện tại
  let narration = null;      // đoạn lời dẫn đang hiển thị (để đọc lại khi bật giọng)
  const lifecycle = {
    later(fn, ms) { const id = setTimeout(fn, ms); cleanups.push(() => clearTimeout(id)); return id; },
    every(fn, ms) { const id = setInterval(fn, ms); cleanups.push(() => clearInterval(id)); return id; },
    loop(fn) {
      let alive = true, last = performance.now();
      const step = now => { if (!alive) return; fn(Math.min(0.1, (now - last) / 1000), now); last = now; requestAnimationFrame(step); };
      requestAnimationFrame(step);
      cleanups.push(() => { alive = false; });
    },
    on(el, type, fn, opts) { el.addEventListener(type, fn, opts); cleanups.push(() => el.removeEventListener(type, fn, opts)); },
    onCleanup(fn) { cleanups.push(fn); }
  };
  function runCleanups() {
    window.STOP4P_VOICE?.stop(); // dừng lời dẫn khi rời màn hình
    const list = cleanups; cleanups = []; currentActions = null;
    list.forEach(fn => { try { fn(); } catch (e) { /* bỏ qua */ } });
  }

  /* ================= Điều hướng ================= */
  /* Stack màn hình đồng bộ với lịch sử trình duyệt (T-20).
   * Mỗi mục lịch sử mang { gen, depth }: depth = độ dài stack lúc đó; gen tăng mỗi lần resetTo (đăng xuất, kết thúc phiên…)
   * để Back không quay về màn của lượt cũ. Back trình duyệt cắt stack về đúng depth và giữ phần bị cắt trong `fwd`,
   * nhờ vậy Forward dựng lại được màn vừa rời (trước đây popstate nào cũng bị coi là Back). */
  const SCREENS = {};
  let gen = 0, fwd = [], historyOk = true;
  const histState = () => ({ gen, depth: state.stack.length });
  function pushHist() { try { history.pushState(histState(), ''); } catch (e) { historyOk = false; } }
  function replaceHist() { try { history.replaceState(histState(), ''); } catch (e) { historyOk = false; } }
  function go(name, params = {}, opts = {}) {
    const top = state.stack[state.stack.length - 1];
    if (opts.replace && state.stack.length) { state.stack[state.stack.length - 1] = { name, params }; replaceHist(); }
    else {
      // bấm đúp một nút điều hướng không đẩy cùng một màn hai lần vào stack
      if (top && top.name === name && JSON.stringify(top.params || {}) === JSON.stringify(params || {})) return;
      state.stack.push({ name, params });
      fwd = [];
      pushHist();
    }
    render();
  }
  function back() {
    if (state.stack.length > 1) { fwd = state.stack.splice(state.stack.length - 1).concat(fwd); render(); }
  }
  window.addEventListener('popstate', e => {
    const s = e.state;
    if (!s || s.gen !== gen) { replaceHist(); return; } // mục lịch sử của lượt trước → đứng yên ở màn hiện tại
    const d = Math.max(1, s.depth | 0);
    if (d < state.stack.length) { fwd = state.stack.splice(d).concat(fwd); render(); }
    else if (d > state.stack.length && fwd.length >= d - state.stack.length) { state.stack.push(...fwd.splice(0, d - state.stack.length)); render(); }
    else replaceHist();
  });
  const resetTo = (name, params = {}) => { gen++; state.stack = []; fwd = []; go(name, params); };

  let lastRenderAt = 0;
  function render() {
    lastRenderAt = performance.now();
    runCleanups();
    const top = state.stack[state.stack.length - 1] || { name: 'welcome', params: {} };
    const scr = SCREENS[top.name] || SCREENS.welcome;
    renderHeader(top.name);
    const main = $('#main');
    main.innerHTML = scr.render(top.params || {});
    main.dataset.screen = top.name;
    document.title = (scr.title ? scr.title + ' · ' : '') + C.APP_NAME;
    if (scr.mount) scr.mount(main, top.params || {});
    window.scrollTo(0, 0);
    const h = main.querySelector('h1, h2');
    if (h && !opts_noFocus) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  let opts_noFocus = false;
  function rerender() { opts_noFocus = true; render(); opts_noFocus = false; }

  function renderHeader(screen) {
    const inFlow = state.mode !== null;
    $('#header').innerHTML = `
      <div class="bar">
        ${state.stack.length > 1 ? '<button class="icon-btn" data-act="back" aria-label="Quay lại">←</button>' : '<span class="icon-spacer"></span>'}
        <button class="brand" data-act="home" aria-label="Trang chính">
          <span class="brand-mark" aria-hidden="true">✋</span><span><b>STOP-4P</b><small>Healthcare Staff</small></span>
        </button>
        <div class="bar-actions">
          ${screen !== 'support' ? '<button class="pill-support" data-go="support">Hỗ trợ</button>' : ''}
          <details class="menu">
            <summary class="icon-btn" aria-label="Mở menu">☰</summary>
            <nav class="menu-panel">
              ${inFlow ? '<button data-go="home">🏠 Trang chính</button>' : '<button data-go="welcome">🏠 Trang chào</button>'}
              <button data-go="library">📚 Thư viện bài tập</button>
              ${state.mode === 'member' ? '<button data-go="journey">📈 Hành trình của tôi</button>' : ''}
              ${inFlow ? '<button data-go="profile" data-params=\'{"next":"back"}\'>👤 Hồ sơ</button>' : ''}
              <button data-go="about">🔒 Quyền riêng tư &amp; giới hạn</button>
              <button data-go="support">🤝 Tìm hỗ trợ</button>
              ${state.mode === 'member' ? '<button data-act="logout">↩ Đăng xuất</button>' : ''}
              ${state.mode === 'guest' ? '<button data-act="endGuest">↩ Kết thúc phiên ẩn danh</button>' : ''}
            </nav>
          </details>
        </div>
      </div>
      ${state.mode ? `<div class="mode-strip ${state.mode}">${state.mode === 'guest'
        ? 'Ẩn danh · không lưu hành trình'
        : 'Đã đăng nhập ' + esc(state.account?.phone_masked || '') + (C.OTP_MODE === 'dev-mock' ? ' · lưu trên thiết bị này (demo)' : '')}</div>` : ''}`;
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 3200);
  }

  /* ================= Tài khoản ================= */
  /* T-10: dữ liệu localStorage là input KHÔNG tin được (máy dùng chung, sửa tay, bản ghi của phiên bản cũ).
   * Chuẩn hóa từng bản ghi khi nạp để màn Hành trình không vỡ (và không mất nút xóa dữ liệu), số 0–10 không thành HTML. */
  const n10 = v => (Number.isInteger(v) && v >= 0 && v <= 10 ? v : null);
  const strOrNull = v => (typeof v === 'string' ? v : null);
  const strArr = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);
  function sanitizeAccount(acc) {
    if (!acc || typeof acc !== 'object' || Array.isArray(acc)) return null;
    acc.phone_masked = strOrNull(acc.phone_masked) || '';
    acc.consents = Array.isArray(acc.consents) ? acc.consents.filter(c => c && typeof c === 'object' && typeof c.purpose === 'string') : [];
    acc.profile = acc.profile && typeof acc.profile === 'object' && !Array.isArray(acc.profile) ? acc.profile : null;
    acc.checkins = (Array.isArray(acc.checkins) ? acc.checkins : []).filter(r => r && typeof r === 'object' && !Array.isArray(r)).map(r => ({
      ...r,
      id: strOrNull(r.id) || uid(),
      created_at: strOrNull(r.created_at) && !isNaN(Date.parse(r.created_at)) ? r.created_at : null,
      emotion_codes: strArr(r.emotion_codes), context_codes: strArr(r.context_codes),
      exercise_ids: strArr(r.exercise_ids).filter(id => EX[id]),
      distress_before: n10(r.distress_before), distress_after: n10(r.distress_after),
      helpfulness: strOrNull(r.helpfulness), narrative: strOrNull(r.narrative),
      journal: r.journal && typeof r.journal === 'object' && !Array.isArray(r.journal) ? r.journal : null
    }));
    return acc;
  }
  const loadAccount = key => sanitizeAccount(S.load(key));
  const hasConsent = p => !!state.account?.consents?.some(c => c.purpose === p && !c.revoked_at);
  function persist() { if (state.mode === 'member' && state.memberKey && state.account) S.save(state.memberKey, state.account); }
  const currentProfile = () => (state.mode === 'member' ? state.account?.profile : state.profile);

  function buildRecord() {
    const c = state.checkin, s = state.session;
    const withText = hasConsent('store_narrative');
    const rec = {
      id: s.id, created_at: s.startedAt,
      emotion_codes: c.emotions, distress_before: c.distress, context_codes: c.contexts,
      available_minutes: c.minutes, exercise_ids: s.exercises,
      distress_after: s.distressAfter, helpfulness: s.fit,
      suggested_ids: state.rec ? state.rec.suggestions.map(x => x.exercise_id) : [],
      stop4p: s.stop4p ? {
        steps_done: s.stop4p.done, steps_skipped: s.stop4p.skipped, breaths: s.stop4p.breaths,
        pain_zones: s.stop4p.pain, named_emotions: s.stop4p.named, clouds: s.stop4p.clouds,
        ...(withText ? { self_note: s.stop4p.selfNote || null, gratitude: s.stop4p.gratitude || [] } : {})
      } : null,
      relax4: s.relax4 ? {
        stations_done: s.relax4.done, stations_skipped: s.relax4.skipped,
        tension_before: s.relax4.before, tension_after: s.relax4.after, most_relaxed: s.relax4.bestZone,
        ...(withText ? { notice: s.relax4.notice || null } : {})
      } : null
    };
    if (withText) { rec.narrative = c.narrative || null; rec.journal = s.journal || null; }
    return rec;
  }
  function saveSession() {
    if (state.mode !== 'member' || !hasConsent('store_journal') || state.session.saved) return false;
    if (!state.session.exercises.length && !state.checkin.done) return false;
    state.account.checkins.unshift(buildRecord());
    state.session.saved = true;
    persist();
    return true;
  }
  /* T-06: phần tự viết trong trò chơi (lời nhắn hũ bình an, 3 lời biết ơn, ghi chú 4 trạm) được lưu khi có đồng ý
   * store_narrative nhưng trước đây không qua detectPII. Trước khi lưu, soát một lượt những đoạn người dùng chưa xác nhận
   * ở chỗ nhập (đã xác nhận thì nằm trong session.piiAcked). Nội dung check-in và nhật ký đã được soát ngay khi nhập. */
  function pendingTextPII() {
    if (state.mode !== 'member' || !hasConsent('store_narrative')) return [];
    const acked = state.session.piiAcked || [];
    const texts = gameTexts().filter(t => !acked.includes(t));
    return texts.length ? E.detectPII(texts.join('\n')) : [];
  }
  const gameTexts = () => { const s = state.session; return [s.stop4p?.selfNote, ...(s.stop4p?.gratitude || []), s.relax4?.notice].filter(Boolean); };
  function ackGameTexts() { const s = state.session; s.piiAcked = (s.piiAcked || []).concat(gameTexts()); }
  function dropGameTexts() {
    const s = state.session;
    if (s.stop4p) { s.stop4p.selfNote = ''; s.stop4p.gratitude = []; }
    if (s.relax4) s.relax4.notice = '';
  }
  const piiGatePanel = hits => `
    <div class="pii-panel" role="alert">
      <p><b>Có thể có thông tin nhận diện</b> trong phần bạn tự viết (lời nhắn, lời biết ơn, ghi chú):</p>
      <ul>${hits.map(h => `<li><mark>${esc(h.text)}</mark> — ${esc(h.why)}</li>`).join('')}</ul>
      <p class="fine">Bộ lọc không thể phát hiện mọi thông tin. Phần này sẽ được lưu vào hành trình của bạn.</p>
      <div class="btn-row">
        <button class="btn soft" data-act="piiDropSave">Bỏ phần tự viết, lưu tiếp</button>
        <button class="btn ghost" data-act="piiSaveAnyway">Tôi đã kiểm tra, lưu tiếp</button>
      </div>
    </div>`;
  function startNewRound() { state.checkin = newCheckin(); state.session = newSession(); state.rec = null; state.recAttempt = 0; state.piiHits = []; }

  /* ================= Hành động (event delegation) ================= */
  const actions = {
    back: () => { if (state.stack.length > 1) { if (historyOk) history.back(); else back(); } },
    home: () => { if (state.mode) resetTo('home'); else resetTo('welcome'); },
    startGuest: () => { S.clearActive(); state.mode = 'guest'; state.profile = null; state.afterLogin = null; startNewRound(); resetTo('profile', { next: 'pause5' }); },
    // Link "Tôi muốn tiếp tục ẩn danh" ở màn đăng nhập: đang là khách (vào từ màn Hoàn tất) thì quay lại, giữ phiên vừa làm.
    loginAsGuest: () => { state.otp = null; if (state.mode === 'guest') { state.afterLogin = null; actions.back(); } else actions.startGuest(); },
    endGuest: () => { state.mode = null; state.profile = null; state.afterLogin = null; startNewRound(); resetTo('welcome'); toast('Đã kết thúc phiên ẩn danh và xóa dữ liệu tạm.'); },
    logout: () => { S.clearActive(); state.mode = null; state.account = null; state.memberKey = null; state.afterLogin = null; startNewRound(); resetTo('welcome'); toast('Đã đăng xuất.'); },
    startEx: el => {
      const id = el.dataset.id;
      // N-05: khi ALLOW_DRAFT_CONTENT=false, mọi đường mở bài (trang chính, chip, nút trong cổng nín thở) cùng luật với thư viện
      if (!EX[id] || !shownIds().includes(id)) return;
      if (!state.session.exercises.includes(id)) state.session.exercises.push(id);
      go('player', { id });
    },
    newCheckin: () => { if (state.session.saved || state.checkin.done) startNewRound(); go('pause5'); }
  };

  // T-21: cú thứ hai của một lần chạm đúp rơi vào màn vừa hiện (vd. "Xong ✓" ở Check-out → trúng "Thử một bài khác"
  // cùng vị trí ở màn Hoàn tất). Chặn ở pha capture, trước mọi listener của màn hình mới.
  document.addEventListener('click', e => {
    if (e.detail > 1 && performance.now() - lastRenderAt < 700) { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);
  document.addEventListener('click', e => {
    const goEl = e.target.closest('[data-go]');
    const actEl = e.target.closest('[data-act]');
    const menu = e.target.closest('details.menu');
    $$('details.menu[open]').forEach(d => { if (d !== menu || goEl || actEl) d.open = false; });
    if (goEl) {
      e.preventDefault();
      const p = goEl.dataset.params ? JSON.parse(goEl.dataset.params) : {};
      const target = goEl.dataset.go;
      if (target === 'home' || target === 'welcome') resetTo(target); else go(target, p);
      return;
    }
    if (actEl) {
      const fn = actions[actEl.dataset.act] || (currentActions && currentActions[actEl.dataset.act]);
      if (fn) { e.preventDefault(); fn(actEl, e); }
    }
  });
  const screenActions = obj => { currentActions = Object.assign({}, currentActions, obj); };

  /* ================= Các thành phần dùng chung ================= */
  const draftNote = () => C.ALLOW_DRAFT_CONTENT
    ? '<p class="draft-note">Bản thử nghiệm: nội dung bài tập chưa được hội đồng chuyên môn phê duyệt. Đây không phải công cụ chẩn đoán hay điều trị.</p>' : '';
  // T-01: bản demo công khai (không phải localhost/file:) tắt đăng nhập, chỉ còn ẩn danh.
  const loginOn = () => C.OTP_MODE !== 'disabled';
  const PUBLIC_NO_LOGIN = 'Bản demo công khai chưa có đăng nhập. Bạn dùng ẩn danh nhé — không cần số điện thoại, không lưu gì trên máy. Bản chính thức sẽ đăng nhập bằng mã OTP gửi qua SMS.';
  const noLoginNote = (cls = 'notice') => `<p class="${cls} no-login">${PUBLIC_NO_LOGIN}</p>`;
  const safetyLine = '<p class="safety-line">Bạn có thể dừng bất kỳ lúc nào; nếu chóng mặt, khó thở hoặc thấy không ổn, hãy trở lại thở tự nhiên và tìm hỗ trợ phù hợp.</p>';

  function exerciseCard(id, reason, primary) {
    const ex = EX[id];
    return `
      <article class="ex-card ${primary ? 'primary' : ''}">
        <div class="ex-icon" aria-hidden="true">${ex.icon}</div>
        <div class="ex-body">
          <h3>${esc(ex.title)}</h3>
          <p class="ex-meta">${fmtMin(ex)}${ex.holdsBreath ? ' · có nín thở (tùy chọn)' : ''}</p>
          <p>${esc(reason || ex.goal)}</p>
          <p class="ex-safety">⚠️ ${esc(ex.safety)}</p>
          <p class="ex-version">Nội dung ${esc(ex.version)} · ${esc(ex.reviewedBy)}</p>
        </div>
        <button class="btn ${primary ? 'primary' : 'soft'}" data-act="startEx" data-id="${id}">Bắt đầu ›</button>
      </article>`;
  }

  function chips(list, selected, name, multi = true) {
    return `<div class="chips" role="group">${list.map(x => {
      const on = multi ? selected.includes(x.code) : selected === x.code;
      return `<button type="button" class="chip ${on ? 'on' : ''}" aria-pressed="${on}" data-chip="${name}" data-code="${esc(x.code)}">${x.icon ? x.icon + ' ' : ''}${esc(x.label)}</button>`;
    }).join('')}</div>`;
  }

  function distressSlider(id, value, label = 'Mức khó chịu lúc này') {
    const v = value == null ? 5 : value;
    return `
      <div class="distress" data-distress="${id}">
        <label for="${id}">${label} <small>(tự đánh giá 0–10, không phải thang chẩn đoán)</small></label>
        <div class="distress-row">
          <div class="capy-wrap" aria-hidden="true">${capy(value)}</div>
          <div class="distress-main">
            <input type="range" id="${id}" min="0" max="10" step="1" value="${v}" aria-valuetext="${v} — ${esc(D.DISTRESS_LABELS[v])}">
            <div class="scale-ends"><span>0 · dễ chịu</span><span>10 · khó chịu nhất</span></div>
            <p class="distress-value" aria-live="polite">${value == null ? 'Chưa chọn — kéo thanh trượt nếu muốn' : `<b>${v}</b> · ${esc(D.DISTRESS_LABELS[v])}`}</p>
          </div>
        </div>
      </div>`;
  }
  function bindDistress(root, id, onChange) {
    const input = $('#' + id, root);
    if (!input) return;
    const wrap = input.closest('.distress');
    input.addEventListener('input', () => {
      const v = +input.value;
      input.setAttribute('aria-valuetext', `${v} — ${D.DISTRESS_LABELS[v]}`);
      $('.distress-value', wrap).innerHTML = `<b>${v}</b> · ${esc(D.DISTRESS_LABELS[v])}`;
      $('.capy-wrap', wrap).innerHTML = capy(v);
      onChange(v);
    });
  }

  /* ================= S01 — Chào mừng ================= */
  SCREENS.welcome = {
    title: 'Chào mừng',
    render: () => `
      <section class="hero">
        <div class="hero-art" aria-hidden="true">${capy(2, 'capy big')}<span class="hero-hand">✋</span></div>
        <p class="eyebrow">STOP-4P Healthcare Staff</p>
        <h1>DỪNG 5 — Trạm nghỉ tinh thần của bạn</h1>
        <p class="lead">Dừng 5 giây. Lắng nghe bản thân. Chọn một cách chăm sóc mình.</p>
        <div class="cta-pair">
          <div class="cta-block">
            <button class="btn big primary" data-act="startGuest">Tiếp tục ẩn danh<small>Không cần số điện thoại</small></button>
            <p class="fine">Phiên này không được đồng bộ hoặc lưu vào tài khoản; nội dung có thể mất khi đóng/tải lại trang.</p>
          </div>
          <div class="cta-block">
            ${loginOn() ? `<button class="btn big teal" data-go="login">Đăng nhập bằng số điện thoại<small>Để lưu và xem lại hành trình</small></button>
            <p class="fine">Dùng mã OTP. Bạn chỉ lưu khi chủ động đồng ý.</p>` : noLoginNote()}
          </div>
        </div>
        <nav class="link-row">
          <button class="link" data-go="library">📚 Thư viện bài tập</button>
          <button class="link" data-go="about">🔒 Quyền riêng tư &amp; giới hạn AI</button>
          <button class="link" data-go="support">🤝 Cách tìm hỗ trợ</button>
        </nav>
        ${draftNote()}
      </section>`
  };

  /* ================= S02 — OTP ================= */
  SCREENS.login = {
    title: 'Đăng nhập',
    render: () => {
      const o = state.otp;
      const dev = C.OTP_MODE === 'dev-mock';
      if (!loginOn()) {
        return `
          <section class="card narrow">
            <h1>Đăng nhập chưa mở ở bản này</h1>
            ${noLoginNote()}
            <button class="btn primary block" data-act="loginAsGuest">Tiếp tục ẩn danh ›</button>
          </section>`;
      }
      if (!o || !o.sent) {
        return `
          <section class="card narrow">
            <h1>Đăng nhập bằng số điện thoại</h1>
            <p class="notice">Bạn đang chọn <b>lưu lịch sử check-in và bài tập</b>. Bạn có thể xem, xuất và xóa dữ liệu bất cứ lúc nào.</p>
            <label for="phone">Số điện thoại</label>
            <div class="phone-row"><span class="cc">🇻🇳 +84</span><input id="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="0912 345 678" value="${esc(o?.raw || '')}"></div>
            <p class="error" id="phone-err" role="alert">${esc(o?.error || '')}</p>
            <button class="btn primary block" data-act="requestOtp">Gửi mã ›</button>
            ${dev ? '<p class="dev-banner">Chế độ DEMO: mã OTP được giả lập và hiện trên màn hình; dữ liệu chỉ lưu trên thiết bị này. Bản chính thức cần kết nối nhà cung cấp SMS qua máy chủ.</p>' : ''}
            <button class="link" data-act="loginAsGuest">Tôi muốn tiếp tục ẩn danh</button>
          </section>`;
      }
      const wait = Math.max(0, Math.ceil((o.resendAt - Date.now()) / 1000));
      return `
        <section class="card narrow">
          <h1>Nhập mã xác minh</h1>
          <p>Nếu số điện thoại hợp lệ, mã gồm 6 chữ số đã được gửi tới <b>${esc(S.maskPhone(o.e164))}</b>. Mã hết hạn sau ${Math.round(C.OTP_TTL_SEC / 60)} phút.</p>
          ${dev ? `<p class="dev-banner">DEMO — mã OTP giả lập: <b class="otp-code">${esc(o.code)}</b></p>` : ''}
          <label for="otp">Mã OTP</label>
          <input id="otp" class="otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="\\d{6}">
          <p class="error" id="otp-err" role="alert">${esc(o.error || '')}</p>
          <button class="btn primary block" data-act="verifyOtp">Xác minh mã ›</button>
          <div class="row-between">
            <button class="link" data-act="resendOtp" ${wait ? 'disabled' : ''} id="resend">${wait ? `Gửi lại sau ${wait}s` : 'Gửi lại mã'}</button>
            <button class="link" data-act="changePhone">Đổi số</button>
          </div>
          <button class="link" data-act="loginAsGuest">Tiếp tục ẩn danh</button>
        </section>`;
    },
    mount(root) {
      const o = state.otp;
      if (!loginOn()) return;
      const input = $('#phone', root) || $('#otp', root);
      if (input) {
        input.focus();
        input.addEventListener('keydown', e => { if (e.key === 'Enter') (currentActions[input.id === 'phone' ? 'requestOtp' : 'verifyOtp'])(); });
      }
      if (o && o.sent) {
        lifecycle.every(() => {
          const btn = $('#resend', root);
          if (!btn) return;
          const wait = Math.max(0, Math.ceil((o.resendAt - Date.now()) / 1000));
          btn.disabled = !!wait;
          btn.textContent = wait ? `Gửi lại sau ${wait}s` : 'Gửi lại mã';
        }, 1000);
      }
      // Trả về true nếu đã gửi được mã. Lỗi máy chủ (mạng hoặc HTTP ≠ 2xx) → ở lại màn số điện thoại, có đường ẩn danh (T-23).
      const sendCode = async () => {
        const o2 = state.otp;
        if (C.OTP_MODE === 'server') {
          try {
            const r = await fetch(C.OTP_ENDPOINTS.request, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ phone: o2.e164 }) });
            if (!r.ok) throw new Error('http ' + r.status);
          } catch (e) { o2.error = 'Không gửi được mã lúc này. Bạn vẫn có thể dùng ứng dụng ở chế độ ẩn danh.'; return false; }
        } else {
          const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
          o2.code = String(n).padStart(6, '0');
        }
        Object.assign(o2, { sent: true, error: '', expires: Date.now() + C.OTP_TTL_SEC * 1000, attempts: 0, resendAt: Date.now() + C.OTP_RESEND_SEC * 1000 });
        return true;
      };
      screenActions({
        requestOtp: async () => {
          const raw = $('#phone', root).value;
          const e164 = S.normalizePhone(raw);
          state.otp = { raw, e164, error: e164 ? '' : 'Số điện thoại chưa đúng định dạng Việt Nam (ví dụ 0912 345 678).' };
          if (!e164) { rerender(); return; }
          await sendCode();
          rerender();
        },
        resendOtp: async () => {
          if (Date.now() < state.otp.resendAt) return;
          const ok = await sendCode();
          rerender();
          if (ok) toast('Đã gửi mã mới.'); // thông báo thành công không nằm trong ô lỗi đỏ (T-23)
        },
        changePhone: () => { state.otp = { raw: state.otp.raw }; rerender(); },
        verifyOtp: async () => {
          const o3 = state.otp;
          const code = $('#otp', root).value.trim();
          if (Date.now() > o3.expires) { o3.error = 'Mã đã hết hạn. Bạn gửi lại mã mới nhé.'; return rerender(); }
          if (o3.attempts >= C.OTP_MAX_ATTEMPTS) { o3.error = `Mã đã nhập sai ${C.OTP_MAX_ATTEMPTS} lần. Bạn gửi lại mã mới nhé.`; return rerender(); }
          let ok = false;
          if (C.OTP_MODE === 'server') {
            try {
              const r = await fetch(C.OTP_ENDPOINTS.verify, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify({ phone: o3.e164, code }) });
              ok = r.ok;
            } catch (e) { ok = false; }
          } else ok = code === o3.code;
          if (!ok) { o3.attempts++; o3.error = `Mã chưa đúng. Còn ${Math.max(0, C.OTP_MAX_ATTEMPTS - o3.attempts)} lần thử.`; return rerender(); }
          const key = await S.hashPhone(o3.e164);
          const acc = loadAccount(key) || S.emptyAccount(S.maskPhone(o3.e164));
          state.memberKey = key; state.account = acc; state.mode = 'member'; state.otp = null;
          // T-08: KHÔNG ghi tài khoản mới xuống localStorage ở đây; chỉ ghi khi người dùng đồng ý ở màn tiếp theo
          // (acceptConsent → persist). Đóng tab ở màn đồng ý thì không còn gì trên máy.
          S.setActive(key);
          toast('Đăng nhập thành công.');
          if (!hasConsent('store_journal')) resetTo('consent');
          else afterMemberReady();
        }
      });
    }
  };

  function afterMemberReady() {
    if (!state.account.profile) return resetTo('profile', { next: state.afterLogin === 'checkout' ? 'importGuest' : 'pause5' });
    if (state.afterLogin === 'checkout') return resetTo('importGuest');
    resetTo('home');
  }

  /* ================= Đồng ý lưu trữ ================= */
  SCREENS.consent = {
    title: 'Đồng ý lưu trữ',
    render: () => `
      <section class="card narrow">
        <h1>Bạn muốn lưu những gì?</h1>
        <p>Mỗi mục là một lựa chọn riêng. Chỉ mục đầu cần thiết để có "Hành trình của tôi".</p>
        <label class="check"><input type="checkbox" id="c-store" checked> <span><b>Lưu hành trình</b>: cảm xúc đã chọn, mức khó chịu, bài đã thử và mức phù hợp.</span></label>
        <label class="check"><input type="checkbox" id="c-text" ${hasConsent('store_narrative') ? 'checked' : ''}> <span><b>Lưu cả nội dung tôi tự viết</b> (tình huống, nhật ký, lời nhắn cho mình, lời biết ơn). Mặc định tắt.</span></label>
        <label class="check"><input type="checkbox" id="c-research" ${hasConsent('research') ? 'checked' : ''}> <span><b>Đồng ý cho sử dụng số liệu tổng hợp ẩn danh phục vụ nghiên cứu.</b> Mặc định tắt, không phải điều kiện sử dụng. (Bản demo không thu thập dữ liệu nghiên cứu.)</span></label>
        <p class="error" id="consent-err" role="alert"></p>
        <button class="btn primary block" data-act="acceptConsent">Tiếp tục ›</button>
        <button class="link" data-act="declineConsent">Không lưu — chuyển sang ẩn danh</button>
        <p class="fine">Không lưu: số điện thoại nguyên văn, tên, mã nhân viên. Không gửi nhật ký cho khoa/phòng hay lãnh đạo.</p>
        <p class="fine">Lưu ý: dữ liệu nằm trên chính trình duyệt này. Trên máy dùng chung, người dùng được trình duyệt này có thể suy ra số điện thoại và đọc hành trình của bạn — trên máy chung bạn nên dùng ẩn danh.</p>
      </section>`,
    mount(root) {
      screenActions({
        acceptConsent: () => {
          if (!$('#c-store', root).checked) { $('#consent-err', root).textContent = 'Để lưu hành trình cần đồng ý mục đầu tiên. Nếu không muốn lưu, hãy chọn chế độ ẩn danh.'; return; }
          const now = new Date().toISOString();
          const acc = state.account;
          acc.consents = acc.consents.filter(c => !['store_journal', 'store_narrative', 'research'].includes(c.purpose));
          acc.consents.push({ purpose: 'store_journal', version: '0.1', accepted_at: now });
          if ($('#c-text', root).checked) acc.consents.push({ purpose: 'store_narrative', version: '0.1', accepted_at: now });
          if ($('#c-research', root).checked) acc.consents.push({ purpose: 'research', version: '0.1', accepted_at: now });
          persist();
          afterMemberReady();
        },
        declineConsent: () => {
          S.clearActive();
          if (state.account && !state.account.checkins.length) S.remove(state.memberKey);
          state.account = null; state.memberKey = null; state.mode = 'guest';
          const fromCheckout = state.afterLogin === 'checkout';
          state.afterLogin = null;
          resetTo(fromCheckout ? 'home' : 'profile', { next: 'pause5' });
        }
      });
    }
  };

  /* ================= S03 — Hồ sơ tối giản ================= */
  SCREENS.profile = {
    title: 'Hồ sơ',
    render: p => {
      const pr = currentProfile() || {};
      const hv = pr.workplace_type === 'hung_vuong', other = pr.workplace_type === 'other';
      const deptKnown = hv && C.DEPARTMENTS_HV.includes(pr.department_code);
      return `
        <section class="card narrow">
          <h1>Hồ sơ tối giản</h1>
          <p class="fine">Lựa chọn là tự khai, không dùng để xác minh nhân sự hay đánh giá hiệu suất. Không hỏi họ tên, mã nhân viên, chức danh hay lịch trực.</p>
          <fieldset>
            <legend>Nơi công tác <span class="req">*</span></legend>
            <label class="radio"><input type="radio" name="wp" value="hung_vuong" ${hv ? 'checked' : ''}> Nhân viên Bệnh viện Hùng Vương</label>
            <label class="radio"><input type="radio" name="wp" value="other" ${other ? 'checked' : ''}> Khác</label>
          </fieldset>
          <div id="other-box" ${other ? '' : 'hidden'}>
            <label for="fac-type">Loại cơ sở <small>(tùy chọn)</small></label>
            <select id="fac-type">
              <option value="">— Không chọn —</option>
              ${['Bệnh viện', 'Phòng khám', 'Cơ sở khác'].map(x => `<option ${pr.facility_type === x ? 'selected' : ''}>${x}</option>`).join('')}
            </select>
            <label for="fac-name">Tên cơ sở <small>(tùy chọn)</small></label>
            <input id="fac-name" maxlength="120" value="${esc(pr.workplace_name || '')}">
          </div>
          <div id="dept-box" ${hv || other ? '' : 'hidden'}>
            <label for="dept">Khoa/phòng <small>(không bắt buộc)</small></label>
            <select id="dept" ${hv ? '' : 'hidden'}>
              <option value="">— Để trống —</option>
              <option value="__none" ${pr.department_code === '__none' ? 'selected' : ''}>Không muốn cung cấp</option>
              ${C.DEPARTMENTS_HV.map(d => `<option ${pr.department_code === d ? 'selected' : ''}>${esc(d)}</option>`).join('')}
              <option value="__free" ${hv && pr.department_free_text && !deptKnown ? 'selected' : ''}>Khác / chưa có trong danh sách</option>
            </select>
            <input id="dept-free" maxlength="120" placeholder="Tên khoa/phòng (tùy chọn)" value="${esc(pr.department_free_text || '')}"
              ${other || (hv && pr.department_free_text && !deptKnown) ? '' : 'hidden'}>
            <p class="fine">Khoa/phòng không được gửi tới AI và không dùng cho báo cáo theo khoa.</p>
          </div>
          <p class="error" id="prof-err" role="alert"></p>
          <button class="btn primary block" data-act="saveProfile">${p.next === 'back' ? 'Lưu ✓' : 'Lưu &amp; tiếp tục ›'}</button>
          ${pr.workplace_type ? '<button class="link" data-act="clearDept">Xóa thông tin khoa/phòng</button>' : ''}
          ${state.mode === 'guest' && p.next !== 'back' ? '<button class="link" data-act="skipProfile">Bỏ qua</button>' : ''}
        </section>`;
    },
    mount(root, p) {
      const sync = () => {
        const wp = ($('input[name=wp]:checked', root) || {}).value;
        $('#other-box', root).hidden = wp !== 'other';
        $('#dept-box', root).hidden = !wp;
        $('#dept', root).hidden = wp !== 'hung_vuong';
        $('#dept-free', root).hidden = !(wp === 'other' || (wp === 'hung_vuong' && $('#dept', root).value === '__free'));
      };
      $$('input[name=wp]', root).forEach(r => r.addEventListener('change', sync));
      $('#dept', root).addEventListener('change', sync);
      const next = () => {
        if (p.next === 'back') { toast('Đã lưu hồ sơ.'); actions.back(); }
        else if (p.next === 'importGuest') resetTo('importGuest');
        else go(p.next || 'pause5');
      };
      screenActions({
        saveProfile: () => {
          const wp = ($('input[name=wp]:checked', root) || {}).value;
          if (!wp) { $('#prof-err', root).textContent = 'Vui lòng chọn nơi công tác (hoặc bấm Bỏ qua nếu đang ẩn danh).'; return; }
          const dsel = $('#dept', root).value;
          const prof = {
            workplace_type: wp,
            facility_type: wp === 'other' ? ($('#fac-type', root).value || null) : null,
            workplace_name: wp === 'other' ? ($('#fac-name', root).value.trim() || null) : null,
            department_code: wp === 'hung_vuong' && dsel && dsel !== '__free' ? dsel : null,
            department_free_text: (wp === 'other' || dsel === '__free') ? ($('#dept-free', root).value.trim() || null) : null,
            updated_at: new Date().toISOString()
          };
          if (state.mode === 'member') { state.account.profile = prof; persist(); } else state.profile = prof;
          next();
        },
        clearDept: () => {
          const pr = currentProfile();
          if (!pr) return;
          pr.department_code = null; pr.department_free_text = null; pr.updated_at = new Date().toISOString();
          persist(); toast('Đã xóa khoa/phòng.'); rerender();
        },
        skipProfile: () => next()
      });
    }
  };

  /* ================= Trang chính ================= */
  SCREENS.home = {
    title: 'Trang chính',
    render: () => {
      const last = state.mode === 'member' ? state.account.checkins[0] : null;
      const shown = shownIds(), ok = id => shown.includes(id); // N-05: chỉ hiện lối mở bài đã được phép
      const quick = ['STOP_PAUSE', 'BREATHE_46', 'GROUND_54321', 'MICRO_RECOVERY', 'SOLEUS_PUSHUP'].some(ok);
      return `
        <section class="home">
          <div class="greet">
            ${capy(last?.distress_after ?? 3, 'capy mid')}
            <div><h1>Chào bạn 👋</h1><p>Hôm nay bạn muốn dành cho mình điều gì?</p></div>
          </div>
          <div class="tiles">
            <button class="tile main" data-act="newCheckin"><span class="t-icon">✋</span><b>Bắt đầu DỪNG 5</b><small>Check-in 1 phút · nhận tối đa 2 gợi ý</small></button>
            ${ok('STOP4P_FULL') ? '<button class="tile game" data-act="startEx" data-id="STOP4P_FULL"><span class="t-icon">🗺️</span><b>Hành trình STOP-4P</b><small>9 chặng · 8–10 phút · bỏ qua chặng nào cũng được</small></button>' : ''}
            ${ok('RELAX_4STATIONS') ? '<button class="tile calm" data-act="startEx" data-id="RELAX_4STATIONS"><span class="t-icon">🧘</span><b>4 trạm – 1 phút bình an</b><small>Hơi thở · vai gáy · mặt – hàm · tâm trí · 8–10 phút</small></button>' : ''}
            <button class="tile" data-go="library"><span class="t-icon">📚</span><b>Thư viện bài tập</b><small>Thở, grounding, ngủ, nghỉ ngắn…</small></button>
            ${state.mode === 'member'
              ? '<button class="tile" data-go="journey"><span class="t-icon">📈</span><b>Hành trình của tôi</b><small>Chỉ bạn xem được</small></button>'
              : loginOn() ? '<button class="tile" data-go="login"><span class="t-icon">💾</span><b>Muốn lưu hành trình?</b><small>Đăng nhập bằng số điện thoại</small></button>' : ''}
          </div>
          <div class="quick" ${quick ? '' : 'hidden'}>
            <p class="quick-title">Cần nhanh?</p>
            <div class="chips">
              ${[['STOP_PAUSE', '✋ Dừng 5 giây'], ['BREATHE_46', '🌬️ Thở 4–6'], ['GROUND_54321', '🌿 5-4-3-2-1'], ['MICRO_RECOVERY', '☕ Nghỉ ngắn'], ['SOLEUS_PUSHUP', '🦵 Nâng gót khi ngồi']]
                .filter(([id]) => ok(id)).map(([id, t]) => `<button class="chip" data-act="startEx" data-id="${id}">${t}</button>`).join('')}
            </div>
          </div>
          ${draftNote()}
        </section>`;
    }
  };

  /* ================= S04 — DỪNG 5 ================= */
  SCREENS.pause5 = {
    title: 'DỪNG 5',
    render: () => `
      <section class="pause5">
        <div class="pause-orb ${reduceMotion() ? 'still' : ''}" aria-hidden="true"><span>✋</span></div>
        <p class="pause-lead">Nếu an toàn để dừng, hãy thả lỏng vai và tự hỏi:</p>
        <h1 class="pause-q">Lúc này mình đang thế nào?</h1>
        <button class="btn soft" id="pause-btn" data-go="checkin">Bỏ qua</button>
      </section>`,
    mount(root) {
      lifecycle.later(() => {
        const b = $('#pause-btn', root);
        if (b) { b.textContent = 'Tiếp tục check-in ›'; b.classList.replace('soft', 'primary'); }
      }, 5000);
    }
  };

  /* ================= S05 — Check-in ================= */
  SCREENS.checkin = {
    title: 'Check-in',
    render: () => {
      const c = state.checkin;
      const emo = D.EMOTIONS.map(e => ({ ...e, icon: '' }));
      return `
        <section class="checkin">
          <h1>Check-in</h1>
          <div class="field">
            <p class="label">Bạn đang cảm thấy gì? <small>(chọn một hoặc nhiều)</small></p>
            <div class="emo-grid">${emo.map(e => `
              <button type="button" class="emo ${c.emotions.includes(e.code) ? 'on' : ''}" aria-pressed="${c.emotions.includes(e.code)}" data-chip="emotions" data-code="${e.code}">
                ${assetImg(e.img, e.emoji, '', 'emo-img')}<span>${esc(e.label)}</span></button>`).join('')}
            </div>
          </div>
          <div class="field">${distressSlider('distress', c.distress)}</div>
          <div class="field">
            <label class="label" for="narr">Điều gì đang khiến bạn khó chịu? <small>(tùy chọn)</small></label>
            <p class="warn">🔒 Không ghi tên, số hồ sơ, ảnh hay chi tiết có thể nhận diện người bệnh/đồng nghiệp.</p>
            <textarea id="narr" maxlength="2000" rows="4" placeholder="Ví dụ: Sắp tư vấn một ca khó, mình thấy lo…">${esc(c.narrative)}</textarea>
            <p class="counter"><span id="narr-count">${c.narrative.length}</span>/2000</p>
            <div id="pii-box">${piiPanel()}</div>
          </div>
          <div class="field">
            <p class="label">Tình huống <small>(tùy chọn)</small></p>
            ${chips(D.CONTEXTS, c.contexts, 'contexts')}
          </div>
          <div class="field">
            <p class="label">Bạn có thể dành bao lâu?</p>
            ${chips(D.MINUTES.map(m => ({ code: String(m), label: m + ' phút' })), c.minutes ? String(c.minutes) : '', 'minutes', false)}
            <label class="check"><input type="checkbox" id="focus" ${c.focusTask ? 'checked' : ''}> <span>Tôi đang làm việc cần tập trung (chỉ hiện hướng dẫn ưu tiên an toàn)</span></label>
          </div>
          <button class="btn primary block" id="submit-btn" data-act="submitCheckin">Xem gợi ý cho tôi</button>
          <p class="rec-wait" id="rec-wait" role="status" aria-live="polite"></p>
          <button class="link" data-go="library">Bỏ qua, tôi tự chọn trong thư viện</button>
          <p class="fine">${state.mode === 'guest' ? 'Ẩn danh: nội dung chỉ nằm trong phiên này, không được lưu.' : hasConsent('store_narrative') ? 'Nội dung tự viết sẽ được lưu vào hành trình của bạn (bạn đã đồng ý).' : 'Chỉ lưu nhãn cảm xúc, mức khó chịu và bài tập; không lưu nội dung tự viết.'}</p>
        </section>`;
    },
    mount(root) {
      const c = state.checkin;
      bindDistress(root, 'distress', v => { c.distress = v; });
      const ta = $('#narr', root);
      ta.addEventListener('input', () => {
        c.narrative = ta.value; c.piiAck = false; $('#narr-count', root).textContent = ta.value.length;
        if (state.piiHits.length) { state.piiHits = []; $('#pii-box', root).innerHTML = ''; }
      });
      $('#focus', root).addEventListener('change', e => { c.focusTask = e.target.checked; });
      lifecycle.on(root, 'click', e => {
        const b = e.target.closest('[data-chip]');
        if (!b) return;
        const key = b.dataset.chip, code = b.dataset.code;
        if (key === 'minutes') {
          c.minutes = c.minutes === +code ? null : +code;
          $$('[data-chip=minutes]', root).forEach(x => { const on = +x.dataset.code === c.minutes; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
          return;
        }
        const arr = c[key];
        const i = arr.indexOf(code);
        if (i >= 0) arr.splice(i, 1); else arr.push(code);
        b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0);
      });
      screenActions({
        submitCheckin: async () => {
          c.narrative = ta.value.slice(0, 2000);
          if (c.narrative && !c.piiAck) {
            const hits = E.detectPII(c.narrative);
            if (hits.length) { state.piiHits = hits; $('#pii-box', root).innerHTML = piiPanel(); $('#pii-box', root).scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }); return; }
          }
          await runRecommendation();
        },
        piiEdit: () => { ta.focus(); },
        piiClear: () => { ta.value = ''; c.narrative = ''; state.piiHits = []; $('#pii-box', root).innerHTML = ''; $('#narr-count', root).textContent = '0'; },
        piiAck: async () => { c.piiAck = true; state.piiHits = []; await runRecommendation(); }
      });
    }
  };

  function piiPanel() {
    if (!state.piiHits.length) return '';
    return `
      <div class="pii-panel" role="alert">
        <p><b>Có thể có thông tin nhận diện</b> trong nội dung bạn viết:</p>
        <ul>${state.piiHits.map(h => `<li><mark>${esc(h.text)}</mark> — ${esc(h.why)}</li>`).join('')}</ul>
        <p class="fine">Bộ lọc không thể phát hiện mọi thông tin. Hãy xem lại trước khi gửi.</p>
        <div class="btn-row">
          <button class="btn soft" data-act="piiEdit">Để tôi sửa lại</button>
          <button class="btn soft" data-act="piiClear">Xóa phần tự viết</button>
          <button class="btn ghost" data-act="piiAck">Tôi đã kiểm tra, gửi tiếp</button>
        </div>
      </div>`;
  }

  let recBusy = false;
  async function runRecommendation() {
    if (recBusy) return; // bấm đúp "Xem gợi ý" không chạy hai lần
    recBusy = true;
    const c = state.checkin;
    c.done = true;
    const main = $('#main');
    main.setAttribute('aria-busy', 'true');
    // T-23: chờ AI có thể tới AI_TIMEOUT_MS → nói rõ đang làm gì thay vì chỉ làm mờ màn hình
    const btn = $('#submit-btn', main), wait = $('#rec-wait', main);
    if (btn) { btn.disabled = true; btn.innerHTML = 'Đang tìm gợi ý…<small>vài giây thôi</small>'; }
    if (wait) wait.textContent = 'Mình đang chọn 1–2 bài hợp với bạn…';
    let rec;
    try { rec = await E.recommendWithAI({ ...c, distress: c.distress }); }
    finally { main.removeAttribute('aria-busy'); recBusy = false; }
    state.rec = rec; state.recAttempt = 0;
    if (!state.session.startedAt) state.session = newSession();
    go(rec.support_mode === 'urgent_or_uncertain' ? 'urgent' : 'result');
  }

  /* ================= Hỗ trợ khẩn ================= */
  SCREENS.urgent = {
    title: 'Hỗ trợ',
    render: () => `
      <section class="card narrow urgent">
        <h1>Cảm ơn bạn đã chia sẻ</h1>
        <p>Một vài từ bạn viết có thể liên quan đến sự an toàn của bạn. Ứng dụng không thể biết chắc — và bạn không phải đối diện điều này một mình.</p>
        <div class="urgent-box">
          <h2>Nếu bạn đang nghĩ đến việc làm hại bản thân, hoặc đang gặp nguy hiểm ngay lúc này</h2>
          <ul>
            <li>Gọi <a href="tel:115"><b>115</b></a> (cấp cứu) hoặc đến khoa Cấp cứu gần nhất.</li>
            <li>Nói ngay với một người ở gần bạn — đồng nghiệp, người phụ trách ca, người thân. Đừng ở một mình.</li>
            ${supportChannelsList(true)}
          </ul>
        </div>
        <p>Trong lúc chờ, bạn có thể đặt chân chạm sàn và thở theo nhịp tự nhiên. Bài tập không thay thế cho sự giúp đỡ của con người.</p>
        <button class="btn primary block" data-go="support">Xem các cách tìm hỗ trợ</button>
        <button class="btn soft block" data-act="notUrgent">Tôi đang an toàn — đó chỉ là cách nói. Tiếp tục</button>
      </section>`,
    mount() {
      screenActions({ notUrgent: () => { state.rec.support_mode = 'needs_human_support'; state.rec.ask_human_support = true; go('result', {}, { replace: true }); } });
    }
  };

  // T-18: khi đơn vị chưa điền SUPPORT_CHANNELS, người dùng không thấy câu kỹ thuật. Ở màn khẩn thì bỏ hẳn dòng này
  // (đã có 115 và "nói với người ở gần"); ở màn Hỗ trợ thì nói bằng lời thường. Hướng dẫn cấu hình nằm trong README.
  function supportChannelsList(urgent = false) {
    if (!C.SUPPORT_CHANNELS.length) return urgent ? '' : '<li>Cơ sở chưa công bố kênh hỗ trợ trong ứng dụng. Trong lúc chờ, bạn có thể nói với người phụ trách ca hoặc một đồng nghiệp bạn tin.</li>';
    return C.SUPPORT_CHANNELS.map(s => `<li><b>${esc(s.name)}</b>${s.detail ? ' — ' + esc(s.detail) : ''}${s.phone ? ` · <a href="tel:${esc(s.phone)}">${esc(s.phone)}</a>` : ''}</li>`).join('');
  }

  /* ================= S06 — Kết quả gợi ý ================= */
  SCREENS.result = {
    title: 'Gợi ý',
    render: () => {
      const r = state.rec;
      if (!r) return SCREENS.library.render();
      const c = state.checkin;
      return `
        <section class="result">
          <h1>Gợi ý cho bạn</h1>
          ${r.ask_human_support ? `
            <div class="human-card">
              <p><b>Bạn không cần tự mình vượt qua.</b> Trò chuyện với một người tin cậy hoặc kênh hỗ trợ có thể giúp ích hơn một bài tập.</p>
              <button class="btn teal" data-go="support">Tôi cần người hỗ trợ</button>
            </div>` : ''}
          <div class="ai-card">
            <p class="tag">${r.source === 'ai' ? 'Phản hồi từ AI' : 'Phản hồi tự động theo luật'} · không phải chẩn đoán</p>
            <p class="summary">${esc(r.summary)}</p>
            ${r.ai_note ? `<p class="fine">${esc(r.ai_note)}</p>` : ''}
            <p class="need">Nhu cầu có thể là: <b>${esc(r.need)}</b></p>
            <details class="edit-labels">
              <summary>Không đúng? Sửa nhãn</summary>
              <p class="label">Cảm xúc</p>
              ${chips(D.EMOTIONS, c.emotions, 'emotions')}
              <p class="label">Tình huống</p>
              ${chips(D.CONTEXTS, r.interpreted_contexts, 'contexts')}
              <button class="btn soft" data-act="applyLabels">Cập nhật gợi ý</button>
            </details>
          </div>
          ${r.suggestions.length ? `<h2 class="sec-title">Nội dung đã biên soạn</h2>
          <div class="ex-list">${r.suggestions.map((s, i) => exerciseCard(s.exercise_id, s.reason, i === 0)).join('')}</div>` : noContentCard()}
          ${r.notes.length ? `<ul class="notes">${r.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}
          <div class="btn-row">
            <button class="btn ghost" data-act="otherSuggestions">Không đúng với tôi — đổi gợi ý</button>
            <button class="btn ghost" data-go="library">Xem cả thư viện</button>
          </div>
          ${!r.ask_human_support ? '<button class="link" data-go="support">🤝 Tôi cần người hỗ trợ</button>' : ''}
          ${draftNote()}
        </section>`;
    },
    mount(root) {
      const labels = { emotions: [...state.checkin.emotions], contexts: [...(state.rec?.interpreted_contexts || [])] };
      lifecycle.on(root, 'click', e => {
        const b = e.target.closest('[data-chip]');
        if (!b) return;
        const arr = labels[b.dataset.chip], i = arr.indexOf(b.dataset.code);
        if (i >= 0) arr.splice(i, 1); else arr.push(b.dataset.code);
        b.classList.toggle('on', i < 0); b.setAttribute('aria-pressed', i < 0);
      });
      screenActions({
        applyLabels: () => {
          Object.assign(state.checkin, { emotions: labels.emotions, contexts: labels.contexts, labelsEdited: true });
          const keepHuman = state.rec.ask_human_support;
          state.recAttempt = 0;
          state.rec = E.recommend(state.checkin);
          state.rec.ask_human_support = state.rec.ask_human_support || keepHuman;
          rerender(); toast('Đã cập nhật gợi ý theo nhãn bạn chọn.');
        },
        otherSuggestions: () => {
          const keepHuman = state.rec.ask_human_support;
          state.recAttempt++;
          state.rec = E.recommend(state.checkin, state.recAttempt);
          state.rec.ask_human_support = state.rec.ask_human_support || keepHuman;
          rerender();
        }
      });
    }
  };

  /* ================= Thư viện ================= */
  // T-12: thư viện lọc cùng luật với engine.validate(): khi ALLOW_DRAFT_CONTENT=false chỉ hiện bài đã duyệt.
  const shownIds = () => Object.keys(EX).filter(id => C.ALLOW_DRAFT_CONTENT || EX[id].status === 'approved');
  function noContentCard() {
    return `
      <div class="card empty-content" role="status">
        <p><b>Nội dung đang chờ hội đồng chuyên môn duyệt.</b> Trong lúc chờ, bạn có thể thở tự nhiên vài hơi, hoặc tìm người hỗ trợ nhé.</p>
        <button class="btn soft" data-go="support">Tìm hỗ trợ ›</button>
      </div>`;
  }
  SCREENS.library = {
    title: 'Thư viện',
    render: () => {
      const ids = shownIds();
      return `
      <section class="library">
        <h1>Thư viện bài tập</h1>
        <p>Chọn bất kỳ bài nào — không cần đăng nhập hay check-in.</p>
        ${ids.length ? `<div class="ex-list">${ids.map(id => exerciseCard(id, EX[id].goal, id === 'STOP4P_FULL')).join('')}</div>` : noContentCard()}
        ${draftNote()}
      </section>`;
    }
  };

  /* ================= S07 — Trình phát ================= */
  SCREENS.player = {
    title: 'Bài tập',
    render: p => {
      const ex = EX[p.id];
      if (!ex) return '<p>Không tìm thấy bài tập.</p>';
      const player = window.STOP4P_PLAYERS[ex.type];
      return `
        <section class="player type-${ex.type}">
          <header class="player-head">
            <span class="ex-icon" aria-hidden="true">${ex.icon}</span>
            <div><h1>${esc(ex.title)}</h1><p class="ex-meta">${fmtMin(ex)} · ${esc(ex.goal)}</p></div>
          </header>
          ${ex.type !== 'journey' ? `<p class="ex-safety">⚠️ ${esc(ex.safety)}</p>` : ''}
          ${safetyLine}
          ${window.STOP4P_VOICE ? window.STOP4P_VOICE.barHTML() : ''}
          <div class="player-body" id="player-body">${player.render(ex, api)}</div>
          <div class="natural-overlay" id="natural" role="dialog" aria-modal="true" aria-labelledby="natural-title" hidden>
            <div class="natural-card">
              <div class="natural-dot" aria-hidden="true"></div>
              <h2 id="natural-title" tabindex="-1">Trở về thở tự nhiên</h2>
              <p>Không cần đếm. Để hơi thở tự đi theo nhịp của nó. Nếu vẫn thấy không ổn, hãy dừng lại và tìm người hỗ trợ.</p>
              <div class="btn-row">
                <button class="btn soft" data-act="closeNatural">Quay lại bài tập</button>
                <button class="btn soft" data-go="support">Tìm hỗ trợ</button>
                <button class="btn primary" data-act="finishExercise">Kết thúc → Check-out</button>
              </div>
            </div>
          </div>
          <footer class="player-foot">
            <button class="btn ghost" data-act="natural">🍃 Trở về thở tự nhiên</button>
            <button class="btn soft" data-act="finishExercise">Kết thúc → Check-out</button>
          </footer>
          ${draftNote()}
        </section>`;
    },
    mount(root, p) {
      const ex = EX[p.id];
      if (!ex) return;
      const player = window.STOP4P_PLAYERS[ex.type];
      const local = { pause: null };
      const V = window.STOP4P_VOICE;
      if (V) {
        const replay = () => { if (narration) V.say(narration); };
        lifecycle.on(root, 'click', e => V.onBarClick(e, root, replay));
        lifecycle.onCleanup(V.watchVoices(root));
        lifecycle.onCleanup(() => { narration = null; });
      }
      // Review lần 2 (G-06): khi lớp phủ mở, mọi thứ phía sau (header, thân bài, chân trang) là `inert` → phím Tab không ra ngoài.
      // #header tồn tại qua các màn nên phải gỡ inert khi rời màn.
      const setInert = on => {
        const sec = root.querySelector('section.player');
        [$('#header'), ...(sec ? [...sec.children].filter(el => el.id !== 'natural') : [])].forEach(el => { if (!el) return; if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
      };
      lifecycle.onCleanup(() => setInert(false));
      screenActions({
        // T-22: lớp phủ là hộp thoại thật: focus vào tiêu đề khi mở, Esc đóng, đóng xong trả focus về nút đã mở nó.
        natural: () => { if (local.pause) local.pause(); window.STOP4P_VOICE?.stop(); $('#natural', root).hidden = false; setInert(true); $('#natural-title', root).focus({ preventScroll: true }); },
        closeNatural: () => { setInert(false); $('#natural', root).hidden = true; $('.player-foot [data-act=natural]', root)?.focus(); },
        finishExercise: () => go('checkout')
      });
      lifecycle.on(document, 'keydown', e => { if (e.key === 'Escape' && !$('#natural', root).hidden) currentActions.closeNatural(); });
      local.pause = player.mount($('#player-body', root), ex, api) || null;
    }
  };

  /* ================= S08 — Check-out ================= */
  SCREENS.checkout = {
    title: 'Check-out',
    render: () => {
      const s = state.session;
      return `
        <section class="card narrow checkout">
          <h1>Bây giờ bạn thấy thế nào?</h1>
          ${distressSlider('after', s.distressAfter, 'Mức khó chịu bây giờ')}
          <label class="check"><input type="checkbox" id="no-answer"> <span>Tôi không muốn trả lời</span></label>
          <p class="label">Bài vừa rồi với bạn:</p>
          ${chips([{ code: 'fit', label: 'Phù hợp' }, { code: 'not_fit', label: 'Không phù hợp' }, { code: 'worse', label: 'Khó chịu hơn' }, { code: 'unsure', label: 'Chưa chắc' }], s.fit || '', 'fit', false)}
          <div id="worse-box"></div>
          <div id="pii-gate"></div>
          <button class="btn primary block" data-act="finishCheckout">Xong ✓</button>
        </section>`;
    },
    mount(root) {
      const s = state.session;
      let touched = s.distressAfter != null;
      bindDistress(root, 'after', v => { s.distressAfter = v; touched = true; $('#no-answer', root).checked = false; });
      $('#no-answer', root).addEventListener('change', e => { if (e.target.checked) { s.distressAfter = null; touched = false; } });
      const worseHTML = `
        <div class="worse-panel" role="alert">
          <p><b>Cảm ơn bạn đã cho biết.</b> Hãy dừng bài tập, quay lại thở tự nhiên. Không cần cố thêm.</p>
          <p>Nếu cảm giác khó chịu vẫn còn, hãy nói với một người tin cậy hoặc tìm hỗ trợ phù hợp.</p>
          <button class="btn teal" data-go="support">Tìm hỗ trợ</button>
        </div>`;
      lifecycle.on(root, 'click', e => {
        const b = e.target.closest('[data-chip=fit]');
        if (!b) return;
        s.fit = s.fit === b.dataset.code ? null : b.dataset.code;
        $$('[data-chip=fit]', root).forEach(x => { const on = x.dataset.code === s.fit; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
        $('#worse-box', root).innerHTML = s.fit === 'worse' ? worseHTML : '';
      });
      const complete = () => {
        if (!touched) s.distressAfter = null;
        if (state.checkin.distress == null) {
          if (s.stop4p?.distress0 != null) state.checkin.distress = s.stop4p.distress0;
          else if (s.relax4?.before != null) state.checkin.distress = s.relax4.before;
        }
        const saved = saveSession();
        go('done', { saved }, { replace: true });
      };
      screenActions({
        finishCheckout: () => {
          const hits = s.saved ? [] : pendingTextPII();
          if (hits.length) { $('#pii-gate', root).innerHTML = piiGatePanel(hits); $('#pii-gate', root).scrollIntoView({ block: 'center' }); return; }
          complete();
        },
        piiDropSave: () => { dropGameTexts(); complete(); },
        piiSaveAnyway: () => { ackGameTexts(); complete(); }
      });
    }
  };

  SCREENS.done = {
    title: 'Hoàn tất',
    render: p => {
      const s = state.session, c = state.checkin;
      const delta = c.distress != null && s.distressAfter != null ? `<p class="delta">Trước: <b>${c.distress}</b> → Sau: <b>${s.distressAfter}</b> <small>(tự đánh giá)</small></p>` : '';
      return `
        <section class="card narrow done">
          <div class="done-art" aria-hidden="true">${capy(s.distressAfter ?? 3, 'capy big')}</div>
          <h1>Cảm ơn bạn đã dành thời gian cho chính mình</h1>
          ${delta}
          ${s.fit === 'worse' ? '<p class="worse-panel">Nếu cảm giác khó chịu vẫn còn, hãy <button class="link inline" data-go="support">tìm hỗ trợ</button>. Bạn không cần thử thêm bài nào lúc này.</p>' : ''}
          ${state.mode === 'member'
            ? (p.saved ? '<p class="ok">✓ Đã lưu vào Hành trình của tôi.</p>' : '<p class="fine">Phiên này không được lưu.</p>')
            : `<div class="guest-save">
                 <p><b>Phiên ẩn danh không được lưu.</b> Dữ liệu tạm sẽ bị xóa khi bạn kết thúc.</p>
                 ${loginOn() ? '<button class="btn teal block" data-act="saveAsMember">💾 Lưu hành trình bằng số điện thoại</button>' : ''}
               </div>`}
          <div class="btn-row">
            ${state.rec ? '<button class="btn soft" data-act="backToResult">Thử một bài khác</button>' : ''}
            <button class="btn primary" data-act="finishRound">${state.mode === 'guest' ? 'Kết thúc &amp; xóa dữ liệu tạm' : 'Về trang chính'}</button>
          </div>
        </section>`;
    },
    mount() {
      screenActions({
        saveAsMember: () => { state.afterLogin = 'checkout'; go('login'); },
        backToResult: () => {
          if (state.session.saved) { const keep = { checkin: state.checkin, rec: state.rec }; startNewRound(); Object.assign(state, keep); }
          go('result');
        },
        finishRound: () => { startNewRound(); resetTo('home'); if (state.mode === 'guest') toast('Đã xóa dữ liệu tạm của phiên.'); }
      });
    }
  };

  /* ================= Guest → member: lưu phiên vừa làm? ================= */
  SCREENS.importGuest = {
    title: 'Lưu phiên vừa thực hiện?',
    render: () => {
      const s = state.session;
      const has = s.exercises.length || state.checkin.done;
      return `
        <section class="card narrow">
          <h1>Lưu cả phiên vừa thực hiện?</h1>
          ${has ? `
            <p>Phiên vừa rồi: ${s.exercises.map(id => esc(EX[id].title)).join(', ') || 'check-in'}.</p>
            <label class="radio"><input type="radio" name="imp" value="no" checked> Không, chỉ lưu các lần sau</label>
            <label class="radio"><input type="radio" name="imp" value="yes"> Có, lưu phiên này</label>
            <p class="fine">Các phiên ẩn danh trước đó không được ghép vào tài khoản.</p>` : '<p>Không có phiên nào để lưu.</p>'}
          <div id="pii-gate"></div>
          <button class="btn primary block" data-act="confirmImport">Tiếp tục ›</button>
        </section>`;
    },
    mount(root) {
      const finish = yes => {
        state.afterLogin = null;
        if (yes && saveSession()) toast('Đã lưu phiên vừa thực hiện.');
        startNewRound();
        resetTo('journey');
      };
      screenActions({
        confirmImport: () => {
          const yes = ($('input[name=imp]:checked', root) || {}).value === 'yes';
          const hits = yes ? pendingTextPII() : [];
          if (hits.length) { $('#pii-gate', root).innerHTML = piiGatePanel(hits); return; }
          finish(yes);
        },
        piiDropSave: () => { dropGameTexts(); finish(true); },
        piiSaveAnyway: () => { ackGameTexts(); finish(true); }
      });
    }
  };

  /* ================= S09 — Hành trình của tôi ================= */
  SCREENS.journey = {
    title: 'Hành trình của tôi',
    render: () => {
      if (state.mode !== 'member') return `
        <section class="card narrow"><h1>Hành trình của tôi</h1>
          <p>Chỉ dành cho người đã đăng nhập và đồng ý lưu. Chế độ ẩn danh không tạo lịch sử.</p>
          ${loginOn() ? '<button class="btn primary block" data-go="login">Đăng nhập bằng số điện thoại</button>' : noLoginNote()}</section>`;
      const list = state.account.checkins;
      // Phần danh sách bọc try/catch: bản ghi lạ không được làm mất khối "Dữ liệu của bạn" (xuất / xóa) bên dưới.
      let listHTML;
      try {
        const helpful = {};
        list.forEach(r => { if (r.helpfulness === 'fit') r.exercise_ids.forEach(id => { if (EX[id]) helpful[id] = (helpful[id] || 0) + 1; }); });
        const top = Object.entries(helpful).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const groups = {};
        list.forEach(r => { const d = r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Không rõ ngày'; (groups[d] = groups[d] || []).push(r); });
        listHTML = list.length ? `
            <div class="card">
              <h2>Mức khó chịu tự đánh giá</h2>
              ${chartSVG(list.slice(0, 14).reverse())}
              <p class="fine">Không phải chẩn đoán. Chấm đậm = trước, chấm rỗng = sau bài tập.</p>
            </div>
            ${top.length ? `<div class="card"><h2>Những cách bạn thấy hữu ích</h2><ul class="plain">${top.map(([id, n]) => `<li>${EX[id].icon} ${esc(EX[id].title)} <small>· ${n} lần</small></li>`).join('')}</ul></div>` : ''}
            ${Object.entries(groups).map(([day, rs]) => `
              <h2 class="day">${esc(day)}</h2>
              ${rs.map(r => journeyItem(r)).join('')}`).join('')}` : '<div class="card"><p>Chưa có gì ở đây. Bắt đầu một lần DỪNG 5 nhé.</p><button class="btn primary" data-act="newCheckin">Bắt đầu DỪNG 5 ›</button></div>';
      } catch (e) {
        listHTML = '<div class="card"><p>Chưa hiển thị được một phần hành trình (dữ liệu trên máy này có thể bị lỗi). Bạn vẫn xuất hoặc xóa dữ liệu ở bên dưới được.</p></div>';
      }
      return `
        <section class="journey">
          <h1>Hành trình của tôi</h1>
          <p class="fine">Chỉ bạn xem được. Không dùng để đánh giá cá nhân hay khoa/phòng.</p>
          ${listHTML}
          <div class="card data-tools">
            <h2>Dữ liệu của bạn</h2>
            <div class="btn-row">
              <button class="btn soft" data-act="exportJSON">Xuất JSON</button>
              <button class="btn soft" data-act="exportCSV">Xuất CSV</button>
              <button class="btn soft" data-go="consent">Đổi lựa chọn lưu trữ</button>
            </div>
            <div class="danger-zone">
              <button class="btn danger-soft" data-act="askDeleteAll">Xóa toàn bộ hành trình</button>
              <button class="btn danger-soft" data-act="askDeleteAccount">Xóa tài khoản</button>
              <div id="confirm-box"></div>
            </div>
          </div>
        </section>`;
    },
    mount(root) {
      if (state.mode !== 'member') return;
      const download = (name, text, type) => {
        const url = URL.createObjectURL(new Blob([text], { type }));
        const a = document.createElement('a');
        a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      };
      const confirm = (msg, act, label) => {
        $('#confirm-box', root).innerHTML = `<div class="confirm" role="alert"><p>${msg}</p>
          <div class="btn-row"><button class="btn soft" data-act="cancelConfirm">Hủy</button><button class="btn danger" data-act="${act}">${label}</button></div></div>`;
      };
      screenActions({
        deleteOne: el => {
          const id = el.dataset.id;
          if (el.dataset.armed !== '1') { el.dataset.armed = '1'; el.textContent = 'Bấm lần nữa để xóa'; return; }
          state.account.checkins = state.account.checkins.filter(r => r.id !== id);
          persist(); toast('Đã xóa check-in.'); rerender();
        },
        exportJSON: () => download('stop4p-hanh-trinh.json', JSON.stringify({ exported_at: new Date().toISOString(), profile: state.account.profile, consents: state.account.consents, checkins: state.account.checkins }, null, 2), 'application/json'),
        exportCSV: () => {
          const cols = ['created_at', 'emotions', 'distress_before', 'distress_after', 'contexts', 'exercises', 'helpfulness', 'narrative'];
          // T-11: ô bắt đầu bằng = + - @ (hoặc tab/CR) bị Excel coi là công thức → chèn dấu nháy đơn ở đầu
          const q = v => { let t = String(v ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
          const rows = state.account.checkins.map(r => [r.created_at, r.emotion_codes.map(E.emotionLabel).join('; '), r.distress_before, r.distress_after,
            r.context_codes.map(E.contextLabel).join('; '), r.exercise_ids.map(id => EX[id]?.title || id).join('; '), r.helpfulness, r.narrative].map(q).join(','));
          download('stop4p-hanh-trinh.csv', '﻿' + cols.join(',') + '\n' + rows.join('\n'), 'text/csv');
        },
        askDeleteAll: () => confirm('Xóa toàn bộ check-in và bài tập đã lưu? Không thể hoàn tác.', 'deleteAll', 'Tôi hiểu, xóa toàn bộ'),
        askDeleteAccount: () => confirm('Xóa tài khoản cùng toàn bộ dữ liệu trên thiết bị này và đăng xuất? Không thể hoàn tác.', 'deleteAccount', 'Tôi hiểu, xóa tài khoản'),
        cancelConfirm: () => { $('#confirm-box', root).innerHTML = ''; },
        deleteAll: () => { state.account.checkins = []; persist(); toast('Đã xóa toàn bộ hành trình.'); rerender(); },
        deleteAccount: () => { S.remove(state.memberKey); S.clearActive(); state.mode = null; state.account = null; state.memberKey = null; startNewRound(); resetTo('welcome'); toast('Đã xóa tài khoản và dữ liệu.'); }
      });
    }
  };

  function journeyItem(r) {
    const t = r.created_at ? new Date(r.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
    const fitLabel = { fit: 'Phù hợp', not_fit: 'Không phù hợp', worse: 'Khó chịu hơn', unsure: 'Chưa chắc' }[r.helpfulness] || '—';
    return `
      <article class="j-item">
        <div class="j-top"><b>${esc(t)}</b><span>${esc(r.distress_before ?? '–')} → ${esc(r.distress_after ?? '–')}</span></div>
        ${r.emotion_codes.length ? `<p>${r.emotion_codes.map(E.emotionLabel).map(esc).join(' · ')}</p>` : ''}
        ${r.exercise_ids.length ? `<p class="fine">${r.exercise_ids.map(id => (EX[id]?.icon || '') + ' ' + esc(EX[id]?.title || id)).join(', ')} · ${fitLabel}</p>` : ''}
        ${r.narrative || r.journal ? `<details><summary>Nội dung đã viết</summary>${r.narrative ? `<p>${esc(r.narrative)}</p>` : ''}${r.journal ? `<p>${esc(Object.values(r.journal).filter(Boolean).join(' / '))}</p>` : ''}</details>` : ''}
        <button class="link small" data-act="deleteOne" data-id="${esc(r.id)}">Xóa mục này</button>
      </article>`;
  }

  function chartSVG(list) {
    const W = 320, H = 150, P = 24;
    const n = list.length;
    const x = i => P + (n === 1 ? (W - 2 * P) / 2 : i * (W - 2 * P) / (n - 1));
    const y = v => H - P - v * (H - 2 * P) / 10;
    const line = key => list.map((r, i) => r[key] == null ? null : `${x(i)},${y(r[key])}`).filter(Boolean).join(' ');
    const grid = [0, 5, 10].map(v => `<line x1="${P}" x2="${W - P}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="4" y="${y(v) + 4}" class="axis">${v}</text>`).join('');
    const dots = list.map((r, i) => `
      ${r.distress_before != null ? `<circle cx="${x(i)}" cy="${y(r.distress_before)}" r="4" class="dot-before"><title>Trước: ${esc(r.distress_before)}</title></circle>` : ''}
      ${r.distress_after != null ? `<circle cx="${x(i)}" cy="${y(r.distress_after)}" r="4" class="dot-after"><title>Sau: ${esc(r.distress_after)}</title></circle>` : ''}`).join('');
    return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Biểu đồ mức khó chịu tự đánh giá của ${n} lần gần nhất">
      ${grid}<polyline points="${line('distress_before')}" class="l-before"/><polyline points="${line('distress_after')}" class="l-after"/>${dots}</svg>`;
  }

  /* ================= S10 — Hỗ trợ ================= */
  SCREENS.support = {
    title: 'Tìm hỗ trợ',
    render: () => `
      <section class="support">
        <h1>Tìm hỗ trợ</h1>
        <div class="card urgent-box">
          <h2>🚨 Cần hỗ trợ ngay</h2>
          <p>Nếu bạn hoặc ai đó đang gặp nguy hiểm tức thời, có ý định làm hại bản thân hay người khác:</p>
          <ul>
            <li>Gọi <a href="tel:115"><b>115</b></a> (cấp cứu) hoặc đến khoa Cấp cứu gần nhất.</li>
            <li>Nói ngay với người ở gần bạn và đừng ở một mình.</li>
          </ul>
          <p class="fine">Ứng dụng và AI không thể đánh giá hay xử lý tình huống khẩn cấp.</p>
        </div>
        <div class="card">
          <h2>💬 Trao đổi với người đáng tin cậy</h2>
          <p>Một đồng nghiệp bạn tin, người phụ trách ca, người thân hoặc bạn bè. Bạn có thể bắt đầu đơn giản: <i>"Hôm nay mình thấy không ổn lắm, bạn có vài phút không?"</i></p>
        </div>
        <div class="card">
          <h2>🏥 Kênh hỗ trợ của cơ sở</h2>
          <ul>${supportChannelsList()}</ul>
        </div>
        <div class="card">
          <h2>😴 Mệt mỏi đang ảnh hưởng đến chăm sóc người bệnh?</h2>
          <ul>
            <li>Tạm ngừng nhiệm vụ khi có thể làm điều đó an toàn.</li>
            <li>Báo người phụ trách ca/trưởng nhóm để được sắp xếp hỗ trợ.</li>
            <li>Thực hiện theo quy trình an toàn người bệnh tại đơn vị.</li>
          </ul>
          <p class="fine">Bài tập thở không thay thế cho nghỉ ngơi và giấc ngủ.</p>
        </div>
      </section>`
  };

  /* ================= Quyền riêng tư & giới hạn ================= */
  SCREENS.about = {
    title: 'Quyền riêng tư',
    render: () => `
      <section class="about">
        <h1>Quyền riêng tư &amp; giới hạn</h1>
        <div class="card"><h2>Ẩn danh</h2><p>Không cần số điện thoại. Không tạo tài khoản, không lưu check-in hay nội dung bạn viết xuống thiết bị và máy chủ. Nội dung mất khi đóng hoặc tải lại trang.</p>
          ${window.STOP4P_VOICE ? '<p class="fine">Ngoại lệ duy nhất: tùy chọn giọng đọc (bật/tắt, giọng nữ hay nam, tốc độ) được nhớ trên trình duyệt này để lần sau không phải chỉnh lại. Đây là thiết lập hiển thị, không phải nội dung check-in.</p>' : ''}</div>
        ${window.STOP4P_VOICE ? '<div class="card"><h2>Giọng đọc</h2><p>Lời dẫn do giọng máy sẵn có của thiết bị đọc, mặc định tắt và chỉ phát khi bạn bấm bật. Ứng dụng chỉ đọc lời dẫn được soạn sẵn, không đọc nội dung bạn tự viết và không gửi gì ra ngoài.</p></div>' : ''}
        <div class="card"><h2>Đăng nhập bằng số điện thoại</h2>
          ${loginOn() ? `<p>Chỉ lưu khi bạn đồng ý; tách riêng đồng ý lưu hành trình, lưu nội dung tự viết và nghiên cứu (hai mục sau mặc định tắt). Bạn có thể xem, xuất, xóa từng mục hoặc toàn bộ.</p>
          ${C.OTP_MODE === 'dev-mock' ? '<p class="dev-banner">Bản demo: OTP giả lập, dữ liệu lưu cục bộ trên thiết bị này. Khóa lưu là mã băm của số điện thoại nhưng <b>không phải bảo mật</b>: trên máy dùng chung, người dùng được trình duyệt này có thể suy ra số điện thoại và đọc hành trình của bạn. Trên máy chung, bạn nên dùng ẩn danh. Bản chính thức cần máy chủ, SMS OTP thật và mã hóa dữ liệu.</p>' : ''}` : `${noLoginNote('fine')}
          ${S.countAll() ? '<p>Máy này còn dữ liệu đăng nhập thử từ bản demo cũ. Bạn có thể xóa hết ngay tại đây.</p><button class="btn danger-soft" data-act="clearDemoData">Xóa dữ liệu demo cũ trên máy này</button>' : ''}`}</div>
        <div class="card"><h2>Gợi ý tự động</h2><p>${C.AI_RECOMMEND_ENDPOINT ? 'Có dùng AI phía máy chủ; kết quả luôn được kiểm tra lại bằng danh mục bài đã biên soạn.' : 'Hiện dùng bộ luật an toàn chạy ngay trong trình duyệt, chưa kết nối AI; nội dung bạn viết không rời khỏi thiết bị.'} Gợi ý tối đa 2 bài, bạn có thể sửa nhãn hoặc từ chối. Không chẩn đoán, không chấm điểm nguy cơ.</p></div>
        <div class="card"><h2>Người bệnh &amp; đồng nghiệp</h2><p>Đừng ghi tên, mã hồ sơ, số giường, ảnh hay chi tiết nhận diện. Ứng dụng có cảnh báo nhưng không thể phát hiện mọi thông tin.</p></div>
        <div class="card"><h2>Không dùng để quản lý nhân sự</h2><p>Không có bảng xếp hạng, không danh sách "nhân viên stress cao", không gửi nhật ký cho khoa/phòng hay lãnh đạo.</p></div>
        <div class="card"><h2>Giới hạn</h2><p>Đây không phải công cụ chẩn đoán hay điều trị và không thay thế bác sĩ/chuyên gia tâm lý. Nội dung bài tập đang ở bản thử nghiệm, chờ hội đồng chuyên môn phê duyệt.</p><p class="fine">Phiên bản ${esc(C.VERSION)}</p></div>
      </section>`,
    mount() {
      screenActions({
        clearDemoData: el => {
          if (el.dataset.armed !== '1') { el.dataset.armed = '1'; el.textContent = 'Tôi hiểu, xóa hết dữ liệu demo cũ'; return; }
          S.removeAll(); S.clearActive(); toast('Đã xóa dữ liệu demo cũ trên máy này.'); rerender();
        }
      });
    }
  };

  /* ================= API cho players.js ================= */
  const api = {
    state, lifecycle, esc, capy, assetImg, reduceMotion, toast, go, hasConsent, uid,
    screenActions: obj => { currentActions = Object.assign({}, currentActions, obj); },
    ensureCheckinDistress: v => { if (state.checkin.distress == null) state.checkin.distress = v; },
    // Lời dẫn của "người quản trò": nhớ đoạn hiện tại để nút "Đọc lại" và lúc bật giọng đọc lại đúng chỗ.
    narrate: segs => { narration = segs; window.STOP4P_VOICE?.say(segs); },
    cue: text => window.STOP4P_VOICE?.cue(text),
    voiceOn: () => !!window.STOP4P_VOICE?.isOn(),
    finish: () => go('checkout'),
    canStart: id => !!EX[id] && shownIds().includes(id),
    rerender
  };
  window.STOP4P_APP = api;

  /* ================= Khởi động ================= */
  function boot() {
    const key = S.getActive();
    const acc = key && loginOn() ? loadAccount(key) : null; // bản công khai tắt đăng nhập thì không khôi phục phiên member
    if (acc) { state.mode = 'member'; state.memberKey = key; state.account = acc; resetTo('home'); }
    else {
      // Review lần 2 (N-02): khóa phiên là mã băm SĐT (suy ngược được) → không có tài khoản đi kèm thì xóa luôn,
      // để người dùng kế tiếp trong cùng tab không còn dấu vết số của người trước.
      if (key) S.clearActive();
      resetTo('welcome');
    }
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
