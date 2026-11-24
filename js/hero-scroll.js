/* ==========================================================
   Hero Scroll – 첫 섹션(메인 영상)만 풀페이지 방식
   ----------------------------------------------------------
   · 메인 영상(#hero)은 화면을 덮는 고정 레이어
   · 영상에서 아래로 스크롤 1번 → 영상이 위로 올라가고 본문 노출
   · 본문은 일반 문서 스크롤 (섹션 단위 이동 없음)
   · 본문 맨 위에서 위로 스크롤
       - 스크롤로 맨 위에 닿은 그 동작은 막힘 → 다음 스크롤 1번에 영상으로
       - 영상에서 막 넘어온 직후에는 위로 1번에 바로 영상으로
   · 휠 / 터치 / 키보드 / 앵커(data-fp-link) 지원
   · data-fp-ignore 영역(전체메뉴 등) 안에서는 동작하지 않음
========================================================== */
(function () {
  'use strict';

  const OPT = {
    duration: 800,      // 영상 올라가기/내려오기 시간(ms) – CSS --dur 와 동일
    edgeIdle: 180,      // 맨 위에서 막힌 뒤 휠이 이만큼 멈춰야 "준비"
    wheelThreshold: 60, // 준비 상태에서 이만큼 휠이 쌓이면 영상으로
    touchThreshold: 70, // 스와이프 거리(px)
    cooldown: 1,      // 전환 직후 관성 무시(ms) – 잠금이 풀린 뒤 휠 판정만 잠깐 쉼
    unlockEarly: 300,   // 영상이 다 올라가기 이만큼 전(ms)부터 본문 스크롤 허용
    edgeGap: 2          // 맨 위 판정 허용 오차(px)
  };

  const root = document.documentElement;
  const header = document.getElementById('header');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let onHero = true;           // true: 영상 화면 / false: 본문
  let animating = false;
  let cooldownUntil = 0;
  // 본문 맨 위 상태: 'none' → 'wait'(막힘) → 'armed'(다음 스크롤에 영상으로)
  let edge = { state: 'none', timer: null, acc: 0 };

  const atTop = () => window.scrollY <= OPT.edgeGap;
  const busy = () => animating || performance.now() < cooldownUntil;
  const ignored = (e) => root.classList.contains('menu-open') ||                 // 전체메뉴 열림
  (e.target instanceof Element && !!e.target.closest('[data-fp-ignore]'));

  function resetEdge() { clearTimeout(edge.timer); edge = { state: 'none', timer: null, acc: 0 }; }
  function arm() { resetEdge(); edge.state = 'armed'; }
  function waitThenArm() {
    clearTimeout(edge.timer);
    edge.state = 'wait'; edge.acc = 0;
    edge.timer = setTimeout(() => { edge.state = 'armed'; edge.acc = 0; }, OPT.edgeIdle);
  }

  function finish(after, lock) {
    const dur = reduceMotion ? 0 : OPT.duration;
    animating = true;
    // 전환 중 문서 스크롤 잠금: 취소 불가 휠·관성은 preventDefault로 못 막음. 잠그면 맨 위로 고정되므로 앵커 이동엔 쓰지 않음
    if (lock) {
      root.classList.add('fp-lock');
      setTimeout(() => root.classList.remove('fp-lock'), Math.max(0, dur - OPT.unlockEarly));
    }
    setTimeout(() => {
      animating = false;
      cooldownUntil = performance.now() + OPT.cooldown;
      if (after) after();
    }, dur);
  }

  /* ---------- 전환 ---------- */
  function toContent(targetId) {
    if (!onHero) { if (targetId) scrollToId(targetId); return; }
    onHero = false;
    root.classList.add('is-content');                 // CSS: 영상 translateY(-100%), 문서 스크롤 허용
    header.dataset.mode = 'default';
    resetEdge();
    if (targetId) scrollToId(targetId, true); else window.scrollTo(0, 0);
    finish(() => { if (atTop()) arm(); }, !targetId); // 도착 직후 위로 1번 → 바로 영상
  }

  function toHero() {
    if (onHero) return;
    onHero = true;
    resetEdge();
    root.classList.remove('is-content');              // CSS: 영상 translateY(0), 문서 스크롤 잠금
    header.dataset.mode = 'hero';
    finish(() => window.scrollTo(0, 0));
    history.replaceState(null, '', location.pathname + location.search);
  }

  function scrollToId(id, instant) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - header.offsetHeight;
    window.scrollTo({ top: Math.max(0, y), behavior: instant || reduceMotion ? 'auto' : 'smooth' });
  }

  /* ---------- 휠 ---------- */
  window.addEventListener('wheel', (e) => {
    if (e.ctrlKey || ignored(e)) return;
    const dir = Math.sign(e.deltaY);
    if (!dir) return;

    if (onHero) {                                     // 영상: 문서 스크롤 없음
      e.preventDefault();
      if (!busy() && dir > 0) toContent();
      return;
    }

    if (busy()) { if (atTop() && dir < 0) e.preventDefault(); return; } // 잠금(fp-lock)이 풀린 뒤엔 아래 방향 스크롤 허용
    if (dir > 0 || !atTop()) {                         // 본문 일반 스크롤
      if (edge.state !== 'none' && dir > 0) resetEdge();
      return;
    }

    // 본문 맨 위에서 위로
    e.preventDefault();
    if (edge.state === 'armed') {
      edge.acc += Math.abs(e.deltaY);
      if (edge.acc >= OPT.wheelThreshold) toHero();
      return;
    }
    waitThenArm();                                     // 맨 위에 닿은 스크롤(관성 포함) → 막힘
  }, { passive: false });

  // 스크롤로 맨 위에 "도달한 순간" = 그 스크롤이 막힘 / 맨 위를 벗어나면 해제
  window.addEventListener('scroll', () => {
    if (onHero || animating) return;
    if (!atTop()) { if (edge.state !== 'none') resetEdge(); return; }
    if (edge.state !== 'armed') waitThenArm();
  }, { passive: true });

  /* ---------- 터치 ---------- */
  let touch = null;
  window.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1 || ignored(e)) { touch = null; return; }
    touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, dy: 0, axis: null, moved: false, startTop: atTop() };
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!touch) return;                                // 전체메뉴 등 무시 영역: 기본 스크롤 허용
    if (busy()) { if (onHero) e.preventDefault(); return; } // 전환 중엔 fp-lock이 본문 스크롤을 막음
    const dx = touch.x - e.touches[0].clientX;
    const dy = touch.y - e.touches[0].clientY;        // +: 아래로 가려는 방향
    if (!touch.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      touch.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
    }
    if (touch.axis === 'x') return;
    touch.dy = dy;

    if (onHero) {
      e.preventDefault();
      if (dy >= OPT.touchThreshold && !touch.moved) { touch.moved = true; toContent(); }
      return;
    }
    // 본문 맨 위에서 아래로 당김(위로 가려는 방향)
    if (dy < 0 && touch.startTop) {
      e.preventDefault();
      if (edge.state === 'armed' && -dy >= OPT.touchThreshold && !touch.moved) { touch.moved = true; toHero(); }
    }
  }, { passive: false });

  window.addEventListener('touchend', () => {
    if (!touch) return;
    const { moved, axis, dy } = touch;
    touch = null;
    if (moved || onHero || axis !== 'y') return;
    if (dy < -10 && atTop() && edge.state !== 'armed') arm(); // 맨 위에서 막힌 스와이프 → 준비
  }, { passive: true });

  /* ---------- 키보드 ---------- */
  document.addEventListener('keydown', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag) || e.target.isContentEditable) return;
    if (root.classList.contains('menu-open')) return;
    if (e.key === ' ' && e.target.closest('button, a')) return; // 스페이스는 버튼/링크 실행에 양보
    const down = ['ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
    const up = ['ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey) || e.key === 'Home';

    if (onHero) {
      if (down || e.key === 'End') { e.preventDefault(); if (!busy()) toContent(); }
      return;
    }
    if (up && atTop() && !busy()) {
      e.preventDefault();
      if (edge.state === 'armed') toHero(); else arm();
    }
  });

  /* ---------- 앵커 링크 ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-fp-link]');
    if (!a) return;
    const id = (a.getAttribute('href') || '').replace('#', '');
    if (!id) return;
    e.preventDefault();
    document.dispatchEvent(new CustomEvent('fp:navigate'));  // 전체메뉴 닫기용
    if (id === 'hero') { window.scrollTo(0, 0); toHero(); }
    else {
      toContent(id); history.replaceState(null, '', '#' + id);
      const el = document.getElementById(id);          // 본문 바로가기 등: 키보드 포커스도 함께 이동
      if (el) { el.tabIndex = -1; el.focus({ preventScroll: true }); }
    }
  });

  /* ---------- 포커스: 영상 화면에서 Tab으로 가려진 요소에 닿으면 본문으로 ---------- */
  document.addEventListener('focusin', (e) => {
    if (onHero && !ignored(e) && !e.target.closest('#hero, .hd-hero, .skip, .kakao-fab')) toContent();
  });

  /* ---------- init ---------- */
  const startId = location.hash.slice(1);
  if (startId && startId !== 'hero' && document.getElementById(startId)) {
    onHero = false;
    root.classList.add('is-content', 'no-anim');
    header.dataset.mode = 'default';
    requestAnimationFrame(() => { scrollToId(startId, true); root.classList.remove('no-anim'); });
  } else {
    header.dataset.mode = 'hero';
  }
})();
