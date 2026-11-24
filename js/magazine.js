/* ==========================================================
   MAGAZINE
   · 카테고리 필터 (ALL / CATEGORY 01 …)
   · 처음 PAGE_SIZE 개 → MORE 누를 때마다 PAGE_SIZE 개씩 추가, 다 보이면 MORE 숨김
   · 서버에서 불러오는 방식으로 바꿀 땐 render() 안에서 fetch → <li class="mg-item"> 추가로 교체
========================================================== */
(function () {
  'use strict';
  const PAGE_SIZE = 12;
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const tabs = $$('.mg-tab');
  const items = $$('#mgGrid > .mg-item');
  const moreWrap = document.getElementById('mgMoreWrap');
  const moreBtn = document.getElementById('mgMore');
  const empty = document.getElementById('mgEmpty');

  let cat = 'all';
  let shown = PAGE_SIZE;

  const matched = () => items.filter((li) => cat === 'all' || li.dataset.cat === cat);

  function render() {
    const list = matched();
    items.forEach((li) => { li.hidden = true; });
    list.slice(0, shown).forEach((li) => { li.hidden = false; });
    moreWrap.hidden = list.length <= shown;
    empty.hidden = list.length > 0;
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.setAttribute('aria-pressed', String(t === tab)));
      cat = tab.dataset.cat;
      shown = PAGE_SIZE;                     // 카테고리 바꾸면 처음 12개부터
      render();
    });
  });

  moreBtn.addEventListener('click', () => {
    const firstNew = matched()[shown];
    shown += PAGE_SIZE;
    render();
    if (firstNew) firstNew.querySelector('a').focus({ preventScroll: true }); // 키보드 사용자: 새로 나온 첫 칸으로
  });

  render();
})();
