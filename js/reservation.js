/* ==========================================================
   RESERVATION
   · 달력: 오늘 이전 날짜 · 지난 달은 선택 불가, 처음엔 오늘 선택
   · 방문인원: 기본 <select> (JS 없음)
   · 시간 선택: 하나만 선택 / 날짜를 바꾸면 선택 해제
   · 모든 시간 보기: 꺼짐 = 선택 가능한 시간만, 켜짐 = 마감된 시간도 표시(선택 불가)
========================================================== */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'];
  const SLOTS = {
    lunch: ['11:30', '12:00', '12:30', '13:00', '13:30'],
    dinner: ['17:30', '18:00', '18:30', '19:00', '19:30', '20:00']
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const state = { view: new Date(today.getFullYear(), today.getMonth(), 1), date: today, time: null };

  const title = $('#rvCalTitle');
  const grid = $('#rvCalGrid');
  const prev = $('.rv-prev');
  const allSwitch = $('#rvAll');

  /* ---------- 달력 ---------- */
  function renderCal() {
    const y = state.view.getFullYear();
    const m = state.view.getMonth();
    title.textContent = `${y}.${m + 1}`;
    prev.disabled = y === today.getFullYear() && m === today.getMonth();
    let html = DOW.map((d, i) => `<span class="rv-dow${i === 0 ? ' sun' : ''}">${d}</span>`).join('');
    for (let i = 0; i < state.view.getDay(); i++) html += '<span></span>';
    const last = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= last; d++) {
      const date = new Date(y, m, d);
      const dow = date.getDay();
      html += `<button type="button" class="rv-day${dow === 0 ? ' sun' : ''}" data-day="${d}"` +
        ` aria-label="${m + 1}월 ${d}일 ${DOW_KO[dow]}요일" aria-pressed="${date.getTime() === state.date.getTime()}"` +
        `${date < today ? ' disabled' : ''}>${d}</button>`;
    }
    grid.innerHTML = html;
  }

  function move(step) {
    state.view = new Date(state.view.getFullYear(), state.view.getMonth() + step, 1);
    renderCal();
  }
  prev.addEventListener('click', () => move(-1));
  $('.rv-next').addEventListener('click', () => move(1));

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.rv-day');
    if (!btn || btn.disabled) return;
    state.date = new Date(state.view.getFullYear(), state.view.getMonth(), +btn.dataset.day);
    state.time = null;                                   // 날짜마다 마감 시간이 다름
    renderCal();
    renderTimes();
    $('.rv-day[aria-pressed="true"]', grid).focus();     // 다시 그려도 키보드 위치 유지
  });

  /* ---------- 시간 ---------- */
  // shortcut: 마감 여부는 날짜로 만든 가짜 값, 예약 API 붙이면 서버 응답으로 교체
  const isClosed = (i) => (state.date.getDate() + i) % 3 === 0;

  function renderTimes() {
    let i = 0;
    Object.keys(SLOTS).forEach((meal) => {
      const html = SLOTS[meal].map((t) => {
        const closed = isClosed(i++);
        if (closed && !allSwitch.checked) return '';
        return `<li><button type="button" class="rv-slot" data-time="${t}" aria-pressed="${state.time === t}"${closed ? ' disabled' : ''}>` +
          `${t}${closed ? '<span class="blind"> 마감</span>' : ''}</button></li>`;
      }).join('');
      $(`.rv-slots[data-meal="${meal}"]`).innerHTML = html || '<li class="rv-none">선택 가능한 시간이 없습니다.</li>';
    });
  }

  $('.rv-times').addEventListener('click', (e) => {
    const btn = e.target.closest('.rv-slot');
    if (!btn || btn.disabled) return;
    state.time = btn.dataset.time;
    $$('.rv-slot').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  });
  allSwitch.addEventListener('change', renderTimes);

  renderCal();
  renderTimes();
})();
