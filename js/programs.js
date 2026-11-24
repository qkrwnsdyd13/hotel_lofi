/* ==========================================================
   PROGRAMS
   · 기간 선택 달력 (시작일 / 종료일)
   · KEYWORD 펼치기 / 접기
   · 관심(♡) 토글
   · MORE 버튼 (HTML 주석을 풀면 동작)
========================================================== */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (v) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v || '');
    if (!m) return null;
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;   // 2026-02-31 같은 날짜 거르기
  };
  const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString();

  /* ---------- 기간 달력 ---------- */
  const fields = $$('.date-field');
  const inputOf = (role) => $(`.date-field[data-role="${role}"] .date-input`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let openField = null;

  function buildCal(field) {
    const cal = document.createElement('div');
    cal.className = 'cal';
    cal.hidden = true;
    cal.setAttribute('role', 'dialog');
    cal.setAttribute('aria-label', field.dataset.role === 'start' ? '시작일 선택' : '종료일 선택');
    cal.innerHTML = `
      <div class="cal-head">
        <button type="button" class="cal-nav cal-prev" aria-label="이전 달"></button>
        <p class="cal-title" aria-live="polite"></p>
        <button type="button" class="cal-nav cal-next" aria-label="다음 달"></button>
      </div>
      <div class="cal-grid"></div>`;
    field.appendChild(cal);
    cal.querySelector('.cal-prev').addEventListener('click', () => move(field, -1));
    cal.querySelector('.cal-next').addEventListener('click', () => move(field, 1));
    return cal;
  }

  function render(field) {
    const cal = field.cal;
    const view = field.view;                       // 보고 있는 달의 1일
    const selected = parse($('.date-input', field).value);
    // 종료일은 시작일 이전 선택 불가
    const min = field.dataset.role === 'end' ? parse(inputOf('start').value) : null;

    $('.cal-title', cal).textContent = `${view.getFullYear()}.${view.getMonth() + 1}`;
    const grid = $('.cal-grid', cal);
    let html = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
      .map((d, i) => `<span class="cal-dow${i === 0 ? ' sun' : ''}">${d}</span>`).join('');
    const first = view.getDay();
    const last = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (let i = 0; i < first; i++) html += '<span></span>';
    for (let d = 1; d <= last; d++) {
      const date = new Date(view.getFullYear(), view.getMonth(), d);
      const cls = ['cal-day'];
      if (date.getDay() === 0) cls.push('sun');
      if (sameDay(date, today)) cls.push('today');
      if (sameDay(date, selected)) cls.push('selected');
      const off = min && date < min;
      html += `<button type="button" class="${cls.join(' ')}" data-date="${fmt(date)}"${off ? ' disabled' : ''}${sameDay(date, selected) ? ' aria-pressed="true"' : ''}>${d}</button>`;
    }
    grid.innerHTML = html;
  }

  function move(field, step) {
    field.view = new Date(field.view.getFullYear(), field.view.getMonth() + step, 1);
    render(field);
  }

  function open(field) {
    if (openField && openField !== field) close(openField);
    const base = parse($('.date-input', field).value) ||
      (field.dataset.role === 'end' && parse(inputOf('start').value)) || today;
    field.view = new Date(base.getFullYear(), base.getMonth(), 1);
    render(field);
    field.cal.hidden = false;
    $('.date-ico', field).setAttribute('aria-expanded', 'true');
    openField = field;
  }

  function close(field, focusIcon) {
    if (!field || field.cal.hidden) return;
    field.cal.hidden = true;
    const ico = $('.date-ico', field);
    ico.setAttribute('aria-expanded', 'false');
    if (focusIcon) ico.focus();
    if (openField === field) openField = null;
  }

  // 종료일이 시작일보다 앞이면 종료일 비움 (달력 클릭 · 직접 입력 공통)
  function fixRange() {
    const start = parse(inputOf('start').value);
    const end = inputOf('end');
    if (start && parse(end.value) && parse(end.value) < start) end.value = '';
  }

  fields.forEach((field) => {
    field.cal = buildCal(field);
    const input = $('.date-input', field);
    input.addEventListener('focus', () => open(field));
    input.addEventListener('click', () => open(field));
    $('.date-ico', field).addEventListener('click', () => (field.cal.hidden ? open(field) : close(field)));
    // 직접 입력: 숫자만 → YYYY-MM-DD 자동 하이픈
    input.addEventListener('input', () => {
      const caret = input.value.slice(0, input.selectionStart).replace(/\D/g, '').length; // 커서 앞 숫자 개수
      const n = input.value.replace(/\D/g, '').slice(0, 8);
      const next = [n.slice(0, 4), n.slice(4, 6), n.slice(6, 8)].filter(Boolean).join('-');
      if (input.value !== next) {                  // 하이픈을 다시 넣어도 커서는 같은 숫자 뒤에 둠
        input.value = next;
        const pos = caret + (caret > 4 ? 1 : 0) + (caret > 6 ? 1 : 0);
        input.setSelectionRange(pos, pos);
      }
      const d = parse(input.value);
      if (d) { fixRange(); field.view = new Date(d.getFullYear(), d.getMonth(), 1); render(field); }
    });
    field.cal.addEventListener('click', (e) => {
      const btn = e.target.closest('.cal-day');
      if (!btn || btn.disabled) return;
      input.value = btn.dataset.date;
      fixRange();
      close(field);
    });
  });

  document.addEventListener('click', (e) => {
    if (openField && !openField.contains(e.target)) close(openField);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && openField) close(openField, true);
  });

  /* ---------- KEYWORD 펼치기 / 접기 ---------- */
  const kwToggle = $('.kw-toggle');
  const kwList = $('#kwList');
  kwToggle.addEventListener('click', () => {
    const isOpen = kwList.classList.toggle('is-open');
    kwToggle.setAttribute('aria-expanded', String(isOpen));
  });

  /* ---------- 관심(♡) 토글 ---------- */
  $$('.btn-wish').forEach((btn) => {
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', String(!on));
      btn.firstElementChild.textContent = on ? '♡' : '♥';
      btn.setAttribute('aria-label', on ? '관심 프로그램 담기' : '관심 프로그램 해제');
    });
  });

  /* ---------- MORE ----------
     programs.html 의 MORE 버튼 주석을 풀면 동작.
     · 처음 PAGE_SIZE 개만 보이고, 누를 때마다 PAGE_SIZE 개씩 추가
     · 전부 보이면 버튼 숨김 / 카드가 PAGE_SIZE 개 이하면 버튼 자체를 숨김
     · 서버에서 불러오는 방식으로 바꿀 땐 showMore() 안에서 fetch → 카드 <li> 추가로 교체
  ------------------------------------------------------------ */
  const PAGE_SIZE = 6;
  const btnMore = $('#btnMore');
  if (btnMore) {
    const cards = $$('#pgCards > .pg-card');
    let shown = 0;
    const showMore = () => {
      const next = cards.slice(shown, shown + PAGE_SIZE);
      next.forEach((c) => { c.hidden = false; });
      if (next[0] && shown > 0) next[0].querySelector('a').focus({ preventScroll: true }); // 키보드 사용자: 새로 나온 첫 카드로
      shown += next.length;
      btnMore.parentElement.hidden = shown >= cards.length;
    };
    cards.forEach((c) => { c.hidden = true; });
    showMore();
    btnMore.addEventListener('click', showMore);
  }
})();
