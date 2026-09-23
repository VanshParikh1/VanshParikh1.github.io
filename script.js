// Mark that JS is running. CSS only hides .reveal elements when this
// class exists, so the page is still readable if this file fails to load.
document.documentElement.classList.add('js');

// ---------------------------------------------------------
// 1. Scroll reveal
// IntersectionObserver tells us when an element enters the screen.
// When it does, we add .in and the CSS transition slides it up.
// ---------------------------------------------------------
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target); // animate once only
      }
    });
  },
  { threshold: 0.15 }
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// ---------------------------------------------------------
// 2. Videos: only play while visible
// Four videos playing off-screen waste battery and data, so each one
// plays when it scrolls into view and pauses when it leaves.
// ---------------------------------------------------------
// Only muted clips marked data-autoplay start by themselves; anything with
// sound (the SketchQuest demo) waits for a click but still pauses off-screen.
const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const v = entry.target;
      if (entry.isIntersecting) {
        if (v.hasAttribute('data-autoplay')) v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  },
  { threshold: 0.25 }
);
document.querySelectorAll('video').forEach((v) => videoObserver.observe(v));

// ---------------------------------------------------------
// 3. Nav gets a solid background after you scroll a bit
// ---------------------------------------------------------
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

// ---------------------------------------------------------
// 4. Mobile menu
// ---------------------------------------------------------
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', open);
});
navLinks.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    navToggle.setAttribute('aria-expanded', false);
  })
);

// ---------------------------------------------------------
// 5. Zoink 3D carousel
// The ring's rotation lives in one number: `angle`. Every frame we
// update it (auto-spin, drag momentum, or easing toward an arrow-click
// target) and redraw. Everything else is derived from that number.
// ---------------------------------------------------------
const carousel = document.getElementById('zoinkCarousel');
if (carousel) {
  const stage = carousel.querySelector('.carousel-stage');
  const ring = carousel.querySelector('.carousel-ring');
  const slides = [...carousel.querySelectorAll('.slide')];
  const labelNum = carousel.querySelector('.carousel-label em');
  const labelText = carousel.querySelector('.carousel-label span');
  const step = 360 / slides.length;            // degrees between slides
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let radius = 0;
  let angle = 0;           // current rotation of the ring, in degrees
  let velocity = 0;        // leftover spin after a drag (momentum)
  let target = null;       // angle to ease toward after an arrow click
  let snapAfterDrag = false;
  let dragging = false;
  let lastX = 0;
  let pauseUntil = 0;      // auto-spin waits until this timestamp
  let visible = false;
  let current = -1;

  // Place each slide around the ring. The radius is the distance from the
  // centre that lets all slides fit side by side without overlapping.
  const layout = () => {
    const w = slides[0].offsetWidth;
    radius = Math.round((w * 1.2) / 2 / Math.tan(Math.PI / slides.length));
    slides.forEach((s, i) => {
      s.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`;
    });
  };

  const render = () => {
    ring.style.transform = `translateZ(${-radius}px) rotateY(${angle}deg)`;
    slides.forEach((s, i) => {
      // cos() of the slide's angle tells us how much it faces the viewer:
      // 1 = straight at us, 0 = side-on, -1 = facing away. Fade accordingly.
      const facing = Math.cos(((i * step + angle) * Math.PI) / 180);
      s.style.opacity = (0.12 + 0.88 * Math.max(0, facing) ** 1.6).toFixed(3);
      s.style.zIndex = Math.round(facing * 100) + 100;
    });
    // Which slide is at the front? Update the caption only when it changes.
    const n = slides.length;
    const idx = ((Math.round(-angle / step) % n) + n) % n;
    if (idx !== current) {
      current = idx;
      labelNum.textContent = String(idx + 1).padStart(2, '0');
      labelText.textContent = slides[idx].dataset.label;
    }
  };

  const tick = (now) => {
    if (visible) {
      if (target !== null) {
        angle += (target - angle) * 0.12;                 // ease toward target
        if (Math.abs(target - angle) < 0.05) { angle = target; target = null; }
      } else if (!dragging) {
        if (Math.abs(velocity) > 0.05) {
          angle += velocity;
          velocity *= 0.93;                               // friction
        } else if (snapAfterDrag) {
          snapAfterDrag = false;
          target = Math.round(angle / step) * step;       // settle on a slide
        } else if (!reduceMotion && now > pauseUntil) {
          angle -= 0.07;                                  // gentle auto-spin
        }
      }
      render();
    }
    requestAnimationFrame(tick);
  };

  // Drag to spin (pointer events cover mouse, touch and pen in one API)
  stage.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    velocity = 0;
    target = null;
    stage.classList.add('dragging');
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = (e.clientX - lastX) * 0.28;
    lastX = e.clientX;
    angle += dx;
    velocity = dx;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    snapAfterDrag = true;
    pauseUntil = performance.now() + 3000;
    stage.classList.remove('dragging');
  };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // Pause the spin while the mouse is over it, so people can look
  stage.addEventListener('mouseenter', () => { pauseUntil = Infinity; });
  stage.addEventListener('mouseleave', () => { pauseUntil = performance.now() + 800; });

  // Arrow buttons: jump exactly one slide
  carousel.querySelectorAll('.carousel-btn').forEach((btn) =>
    btn.addEventListener('click', () => {
      const dir = Number(btn.dataset.dir);
      const base = target ?? Math.round(angle / step) * step;
      target = base - dir * step;
      pauseUntil = performance.now() + 4000;
    })
  );

  // Only animate while the carousel is on screen
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; })
    .observe(carousel);

  window.addEventListener('resize', layout);
  layout();
  render();
  requestAnimationFrame(tick);
}

// ---------------------------------------------------------
// 6. SketchQuest: sketch → game screenshot swap + demo video
// ---------------------------------------------------------
const sq = document.getElementById('sqCompare');
if (sq) {
  const framesEl = document.getElementById('sqFrames');
  const tabs = sq.querySelectorAll('.sq-tab');
  const reduceMotionSQ = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let shown = 0;
  let scanTimer;

  const show = (i) => {
    shown = i;
    framesEl.classList.toggle('show-game', i === 1);   // CSS animates --reveal
    framesEl.classList.add('scanning');                // light up the scan line
    clearTimeout(scanTimer);
    scanTimer = setTimeout(() => framesEl.classList.remove('scanning'), 1300);
    tabs.forEach((t, j) => {
      t.classList.toggle('active', j === i);
      t.setAttribute('aria-selected', j === i);
    });
  };

  // Auto-cycle: the countdown bar under the active label is a CSS animation.
  // When it finishes, 'animationend' fires and we switch. Pausing the bar
  // (off-screen or on hover) therefore pauses the cycle too.
  if (!reduceMotionSQ) sq.classList.add('auto');
  sq.addEventListener('animationend', (e) => {
    if (e.animationName === 'sq-countdown') show(1 - shown);
  });
  const setPaused = (p) => sq.classList.toggle('paused', p);
  framesEl.addEventListener('mouseenter', () => setPaused(true));
  framesEl.addEventListener('mouseleave', () => setPaused(false));
  new IntersectionObserver(([e]) => setPaused(!e.isIntersecting)).observe(sq);

  // Clicking a label takes manual control and stops the auto-cycle
  tabs.forEach((t) =>
    t.addEventListener('click', () => {
      sq.classList.remove('auto');
      show(Number(t.dataset.i));
    })
  );

  // Demo video: the overlay button starts playback and reveals native controls
  const video = document.getElementById('sqVideo');
  const playBtn = document.getElementById('sqPlay');
  playBtn.addEventListener('click', () => {
    video.controls = true;
    video.closest('.sq-video').classList.add('playing');
    video.play();
  });
}

// ---------------------------------------------------------
// 7. Footer year, so it never goes stale
// ---------------------------------------------------------
document.getElementById('year').textContent = new Date().getFullYear();
