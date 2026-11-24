/* ==========================================================
   UI – 전체메뉴(슬라이드 다운/업) / 프로필 드롭다운 / 영상 컨트롤 / 패밀리사이트
========================================================== */
(function () {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ---------- 전체메뉴: 슬라이드 다운(열기) / 슬라이드 업(닫기) ---------- */
  const menu = $('#allMenu');
  const hamBtns = $$('.btn-ham');
  const closeBtn = $('.am-close', menu);
  let lastFocus = null;

  function openMenu(e) {
  lastFocus = e ? e.currentTarget : document.activeElement;
  menu.inert = false;
  menu.setAttribute('aria-hidden', 'false');
  menu.classList.add('open');                          // 슬라이드 다운
  document.documentElement.classList.add('menu-open'); // 미니 헤더 유지 + 햄버거 사선
  hamBtns.forEach((b) => { b.setAttribute('aria-expanded', 'true'); b.setAttribute('aria-label', '전체메뉴 닫기'); });
  closeBtn.focus();
  }
  function closeMenu() {
    if (!menu.classList.contains('open')) return;
    menu.classList.remove('open');                       // 슬라이드 업
    document.documentElement.classList.remove('menu-open');
    menu.setAttribute('aria-hidden', 'true');
    menu.inert = true;
    hamBtns.forEach((b) => { b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-label', '전체메뉴 열기'); });
    if (lastFocus && document.contains(lastFocus) && lastFocus.offsetParent) lastFocus.focus({ preventScroll: true });
  }
  const toggleMenu = (e) => (menu.classList.contains('open') ? closeMenu() : openMenu(e));
  hamBtns.forEach((b) => b.addEventListener('click', toggleMenu));
  closeBtn.addEventListener('click', closeMenu);
  // 메뉴가 열려 있는 동안 Tab이 메뉴 뒤로 빠져나가지 않게
  document.addEventListener('focusin', (e) => {
    if (menu.classList.contains('open') && !menu.contains(e.target) && !e.target.closest('.hd-hero')) closeBtn.focus();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
  document.addEventListener('fp:navigate', closeMenu); // 메뉴 안 앵커로 섹션 이동 시 닫기

  /* ---------- 프로필: hover/포커스는 CSS, 터치 기기용 클릭 토글은 여기서 ---------- */
  const profile = $('.profile');
  const profileBtn = $('.profile-btn');
  profileBtn.addEventListener('click', () => {
    const open = profile.classList.toggle('open');
    profileBtn.setAttribute('aria-expanded', String(open));
  });
  const closeProfile = () => { profile.classList.remove('open'); profileBtn.setAttribute('aria-expanded', 'false'); };
  document.addEventListener('click', (e) => { if (!profile.contains(e.target)) closeProfile(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeProfile(); });

  /* ---------- 메인 영상 컨트롤 (UI 상태만 – 실제 video 연결 시 주석 참고) ---------- */
  const btnPlay = $('#btnPlay');
  const btnSound = $('#btnSound');
  if (btnPlay) btnPlay.addEventListener('click', () => {   // 서브페이지엔 영상 없음
    const playing = btnPlay.getAttribute('aria-pressed') === 'true';
    btnPlay.setAttribute('aria-pressed', String(!playing));
    btnPlay.textContent = playing ? '▶' : '❚❚';
    btnPlay.setAttribute('aria-label', playing ? '영상 재생' : '영상 일시정지');
    // video.paused ? video.play() : video.pause();
  });
  if (btnSound) btnSound.addEventListener('click', () => {
    const on = btnSound.getAttribute('aria-pressed') === 'true';
    btnSound.setAttribute('aria-pressed', String(!on));
    btnSound.textContent = on ? '🔇' : '🔊';
    btnSound.setAttribute('aria-label', on ? '소리 켜기' : '소리 끄기');
    // video.muted = on;
  });

  /* ---------- 패밀리 사이트 ---------- */
  const family = $('.family');
  const familyBtn = $('.family-btn');
  familyBtn.addEventListener('click', () => {
    const open = family.classList.toggle('open');
    familyBtn.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', (e) => {
    if (!family.contains(e.target)) { family.classList.remove('open'); familyBtn.setAttribute('aria-expanded', 'false'); }
  });
})();
