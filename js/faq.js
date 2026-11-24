/* ==========================================================
   FAQ
   · 카테고리 드롭다운 (클릭 · 키보드 ↑↓ Enter Esc)
   · 탭 필터 / 검색(카테고리 + 검색어)
   · 아코디언 (한 번에 하나만 열림)
   · 페이지 번호 (PER_PAGE 개씩, 자동 생성)
========================================================== */
(function () {
  'use strict';
  const PER_PAGE = 10;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const items = $$('#fqItems > .fq-item');
  const tabs = $$('.fq-tab');
  const pagesEl = $('#fqPages');
  const empty = $('#fqEmpty');
  const state = { cat: 'all', kw: '', page: 1 };

  /* ---------- 목록 그리기 ---------- */
  function matched() {
    return items.filter((li) =>
      (state.cat === 'all' || li.dataset.cat === state.cat) &&
      (!state.kw || li.textContent.toLowerCase().includes(state.kw)));
  }

  function render() {
    const list = matched();
    const total = Math.max(1, Math.ceil(list.length / PER_PAGE));
    state.page = Math.min(state.page, total);
    const start = (state.page - 1) * PER_PAGE;
    items.forEach((li) => { li.hidden = true; closeItem(li); });
    list.slice(start, start + PER_PAGE).forEach((li) => { li.hidden = false; });
    empty.hidden = list.length > 0;

    // 페이지 번호 (1페이지뿐이면 숨김)
    pagesEl.innerHTML = '';
    if (list.length > PER_PAGE) {
      for (let p = 1; p <= total; p++) {
        const li = document.createElement('li');
        li.innerHTML = `<button type="button" class="fq-page" data-page="${p}"${p === state.page ? ' aria-current="page"' : ''} aria-label="${p}페이지">${p}</button>`;
        pagesEl.appendChild(li);
      }
    }
  }

  pagesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.fq-page');
    if (!btn) return;
    state.page = +btn.dataset.page;
    render();
    $('.fq-tabs').scrollIntoView({ behavior: 'smooth', block: 'start' });
    pagesEl.querySelector('[aria-current]').focus({ preventScroll: true });
  });

  function setCat(cat) {
    state.cat = cat;
    tabs.forEach((t) => t.setAttribute('aria-pressed', String(t.dataset.cat === cat)));
    select.set(cat);
  }

  /* ---------- 탭 ---------- */
  tabs.forEach((tab) => tab.addEventListener('click', () => {
    setCat(tab.dataset.cat);
    state.page = 1;
    render();
  }));

  /* ---------- 아코디언 ---------- */
  function closeItem(li) {
    const btn = $('.fq-q button', li);
    btn.setAttribute('aria-expanded', 'false');
    $('.fq-a', li).hidden = true;
  }
  items.forEach((li) => {
    const btn = $('.fq-q button', li);
    btn.addEventListener('click', () => {
      const willOpen = btn.getAttribute('aria-expanded') !== 'true';
      items.forEach(closeItem);                        // 하나만 열림 – 여러 개 열려면 이 줄 삭제
      if (willOpen) { btn.setAttribute('aria-expanded', 'true'); $('.fq-a', li).hidden = false; }
    });
  });

  /* ---------- 카테고리 드롭다운 ---------- */
  const select = (function () {
    const wrap = $('#fqSelect');
    const btn = $('.fq-sel-btn', wrap);
    const list = $('.fq-sel-list', wrap);
    const opts = $$('[role="option"]', list);
    const valueEl = $('#fqSelValue');
    let value = 'all';
    let active = 0;

    const highlight = (i) => {
      active = (i + opts.length) % opts.length;
      opts.forEach((o, n) => o.classList.toggle('is-active', n === active));
      list.setAttribute('aria-activedescendant', opts[active].id);
      opts[active].scrollIntoView({ block: 'nearest' });
    };
    const open = () => {
      list.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      highlight(opts.findIndex((o) => o.dataset.value === value));
      list.focus();
    };
    const close = (focusBtn) => {
      if (list.hidden) return;
      list.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus();
    };
    const set = (v) => {
      value = v;
      opts.forEach((o) => o.setAttribute('aria-selected', String(o.dataset.value === v)));
      valueEl.textContent = opts.find((o) => o.dataset.value === v).textContent;
    };

    btn.addEventListener('click', () => (list.hidden ? open() : close()));
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); open(); }
    });
    list.addEventListener('click', (e) => {
      const o = e.target.closest('[role="option"]');
      if (!o) return;
      set(o.dataset.value);
      close(true);
    });
    list.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(opts[active].dataset.value); close(true); }
      else if (e.key === 'Escape' || e.key === 'Tab') { close(e.key === 'Escape'); }
    });
    document.addEventListener('click', (e) => { if (!wrap.contains(e.target)) close(); });

    return { set, get: () => value };
  })();

  /* ---------- 검색 ---------- */
  // 카테고리(드롭다운) + 검색어로 거르고, 탭도 같은 카테고리로 맞춤
  $('#fqSearch').addEventListener('submit', (e) => {
    e.preventDefault();
    state.kw = $('#fqKeyword').value.trim().toLowerCase();
    setCat(select.get());
    state.page = 1;
    render();
  });

  render();
})();
