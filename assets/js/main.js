/* =========================================================
   EXTERMIMEX — main.js (robusto con espera de header)
   ========================================================= */

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);

// ========= NAV DRAWER (mobileMenu) =========
(function () {
  function openMenu(menu) {
    if (!menu) return;
    menu.classList.add('open');
    document.body.classList.add('no-scroll');
  }

  function closeMenu(menu) {
    if (!menu) return;
    menu.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }

  function bindNav() {
    const navToggle  = $('#navToggle');
    const mobileMenu = $('#mobileMenu');

    if (!navToggle || !mobileMenu) return false;

    // Botón hamburguesa
    navToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      mobileMenu.classList.contains('open') ? closeMenu(mobileMenu) : openMenu(mobileMenu);
    });

    // Botón de cerrar dentro del panel (si existe)
    const closeBtn = $('.mobile-menu-close', mobileMenu);
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu(mobileMenu);
      });
    }

    // Cerrar si clic fuera del panel
    document.addEventListener('click', (e) => {
      if (!mobileMenu.classList.contains('open')) return;
      const content = $('.mobile-menu-content', mobileMenu);
      const clickedToggle = e.target.closest('#navToggle');
      const insideContent = content && content.contains(e.target);
      if (!insideContent && !clickedToggle) closeMenu(mobileMenu);
    }, { passive: true });

    // ESC para cerrar
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu(mobileMenu);
      }
    });

    return true;
  }

  // Si el header viene inyectado por includes.js, esperamos a que aparezca
  function waitForHeaderAndBind() {
    if (bindNav()) return; // ya estaba en el DOM

    const obs = new MutationObserver(() => {
      if (bindNav()) obs.disconnect();
    });
    obs.observe(document.documentElement, { childList: true, subtree: true });

    // fallback por si acaso
    setTimeout(() => { bindNav(); }, 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForHeaderAndBind);
  } else {
    waitForHeaderAndBind();
  }
})();


// ========= HERO CAROUSEL =========
const heroConfig = {
  autoPlay: true,
  interval: 5500,
  pauseOnHover: true,
  slides: [
    { type: "video", src: "media/hero1.mp4", poster: "media/hero1.jpg" },
    { type: "image", src: "media/hero2.webp", alt: "Equipo EXTERMIMEX en operación" }
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("heroCarousel");
  if (!root) return;
  initHeroCarousel(root, heroConfig);
});

function initHeroCarousel(root, config){
  const { slides, autoPlay, interval, pauseOnHover } = config;
  if (!slides || !slides.length) return;

  let current = 0, timer = null, isPointerDown = false, startX = 0;

  slides.forEach((s, i) => {
    const slide = document.createElement("div");
    slide.className = "hero-slide" + (i === 0 ? " is-active" : "");
    slide.setAttribute("role","group");
    slide.setAttribute("aria-label",`${i+1} de ${slides.length}`);

    if (s.type === "video"){
      const v = document.createElement("video");
      v.src = s.src; if (s.poster) v.poster = s.poster;
      v.muted = true; v.loop = true; v.playsInline = true; v.preload = "metadata";
      if (i === 0) v.autoplay = true;
      slide.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = s.src; img.alt = s.alt || "";
      slide.appendChild(img);
    }
    root.appendChild(slide);
  });

  const slidesEls = Array.from(root.querySelectorAll(".hero-slide"));
  const dotsWrap = document.querySelector(".hero-dots");
  const dots = slides.map((_, i) => {
    const b = document.createElement("button");
    b.className = "hero-dot" + (i === 0 ? " is-active" : "");
    b.type = "button";
    b.addEventListener("click", () => goTo(i));
    dotsWrap && dotsWrap.appendChild(b);
    return b;
  });

  const prevBtn = document.querySelector(".hero-nav.prev");
  const nextBtn = document.querySelector(".hero-nav.next");
  prevBtn && prevBtn.addEventListener("click", () => goTo(current - 1));
  nextBtn && nextBtn.addEventListener("click", () => goTo(current + 1));

  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") goTo(current - 1);
    if (e.key === "ArrowRight") goTo(current + 1);
  });

  root.addEventListener("pointerdown", (e) => { isPointerDown = true; startX = e.clientX; });
  root.addEventListener("pointerup", (e) => {
    if (!isPointerDown) return;
    const dx = e.clientX - startX;
    if (dx > 40) goTo(current - 1);
    if (dx < -40) goTo(current + 1);
    isPointerDown = false;
  });

  function start(){ if (!autoPlay) return; stop(); timer = setInterval(() => goTo(current + 1), interval || 5000); const v = slidesEls[current]?.querySelector("video"); if (v) v.play().catch(()=>{}); }
  function stop(){ if (timer){ clearInterval(timer); timer = null; } const v = slidesEls[current]?.querySelector("video"); if (v) v.pause(); }

  if (pauseOnHover){
    const hero = root.closest(".hero");
    hero && hero.addEventListener("mouseenter", stop);
    hero && hero.addEventListener("mouseleave", start);
  }
  document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });
  if (autoPlay) start();

  function goTo(index){
    const total = slidesEls.length;
    const next = (index + total) % total;
    if (next === current) return;

    slidesEls[current].classList.remove("is-active");
    dots[current] && dots[current].classList.remove("is-active");
    slidesEls[next].classList.add("is-active");
    dots[next] && dots[next].classList.add("is-active");

    const vCur = slidesEls[current].querySelector("video"); if (vCur) vCur.pause();
    const vNext = slidesEls[next].querySelector("video"); if (vNext) vNext.play().catch(()=>{});
    current = next;
    if (autoPlay) start();
  }
}


// ========= LIGHTBOX =========
(function(){
  let items = [], index = 0;
  let overlay, media, captionEl;

  function ensureOverlay(){
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'lb-overlay';
    overlay.innerHTML = `
      <div class="lb-dialog">
        <button class="lb-close" aria-label="Cerrar (Esc)">✕</button>
        <button class="lb-prev" aria-label="Anterior">‹</button>
        <button class="lb-next" aria-label="Siguiente">›</button>
        <div class="lb-media"></div>
        <div class="lb-caption"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    media = overlay.querySelector('.lb-media');
    captionEl = overlay.querySelector('.lb-caption');

    overlay.addEventListener('click', (e) => {
      const dialog = overlay.querySelector('.lb-dialog');
      if (!dialog.contains(e.target)) close();
    });
    overlay.querySelector('.lb-close').addEventListener('click', close);
    overlay.querySelector('.lb-prev').addEventListener('click', prev);
    overlay.querySelector('.lb-next').addEventListener('click', next);

    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    return overlay;
  }

  function open(group, startIndex){
    const triggers = Array.from(document.querySelectorAll(`[data-lightbox][data-group="${group}"]`));
    items = triggers.map(btn => ({
      src: btn.getAttribute('data-src'),
      caption: btn.getAttribute('data-caption') || '',
      group
    }));
    index = Math.max(0, Math.min(startIndex, items.length - 1));
    ensureOverlay();
    render();
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function close(){
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function render(){
    const it = items[index];
    if (!it) return;
    media.innerHTML = '';
    const img = document.createElement('img');
    img.src = it.src;
    img.alt = it.caption || '';
    media.appendChild(img);
    captionEl.textContent = it.caption || '';
  }

  function prev(){ index = (index - 1 + items.length) % items.length; render(); }
  function next(){ index = (index + 1) % items.length; render(); }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox]');
    if (!trigger) return;
    e.preventDefault();
    const group = trigger.getAttribute('data-group') || 'default';
    const triggers = Array.from(document.querySelectorAll(`[data-lightbox][data-group="${group}"]`));
    const startIndex = Math.max(0, triggers.indexOf(trigger));
    open(group, startIndex);
  });
})();


// ========= Año dinámico footer =========
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('yearCopy');
  if (y) y.textContent = new Date().getFullYear();
});
