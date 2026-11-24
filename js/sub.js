/* ==========================================================
   서브페이지 공통 – about.html, programs.html …
   · 스크롤 내리면 헤더 GNB 줄 → 서브바(페이지명 · RESERVATION · 브레드크럼)
   · 서브바 드롭다운 (hover/focus는 CSS, 터치용 클릭 토글은 여기서)
========================================================== */
(function () {
  'use strict';
  const header = document.getElementById('header');
  const SUB_AT = 120; // 이만큼 내려가면 서브바로 전환(px)

  /* ---------- 헤더 서브바 전환 ---------- */
  let ticking = false;
  function update() {
    header.classList.toggle('is-sub', window.scrollY > SUB_AT);
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();

  /* ---------- 서브바 드롭다운 ---------- */
  const dds = Array.from(header.querySelectorAll('.sub-bar .dd'));
  function close(dd) {
    dd.classList.remove('open');
    dd.querySelector('.dd-btn').setAttribute('aria-expanded', 'false');
  }
  dds.forEach((dd) => {
    const btn = dd.querySelector('.dd-btn');
    btn.addEventListener('click', () => {
      const willOpen = !dd.classList.contains('open');
      dds.forEach(close);
      if (willOpen) { dd.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });
  document.addEventListener('click', (e) => {
    dds.forEach((dd) => { if (!dd.contains(e.target)) close(dd); });
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') dds.forEach(close); });
})();
