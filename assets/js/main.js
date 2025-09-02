// ===== NAV MÓVIL (clona menú de escritorio)
document.addEventListener('DOMContentLoaded', function () {
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  const desktopMenu = document.querySelector('.nav-menu ul');

  if (desktopMenu && mobileMenu) {
    mobileMenu.innerHTML = '';
    const mobileUl = desktopMenu.cloneNode(true);
    mobileUl.querySelectorAll('.dropdown').forEach((li) => {
      const trigger = li.querySelector('a');
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        li.classList.toggle('open');
      });
    });
    mobileMenu.appendChild(mobileUl);
    const contactDiv = document.createElement('div');
    contactDiv.style.marginTop = '32px';
    contactDiv.innerHTML = `
      <a href="tel:664-676-5059" class="nav-phone">664-676-5059</a>
      <a href="https://wa.me/526646765059" class="btn-primary" style="margin-left:12px;">WhatsApp</a>`;
    mobileMenu.appendChild(contactDiv);
  }
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
  }
  document.addEventListener('click', (e) => {
    if (mobileMenu.classList.contains('open') &&
        !mobileMenu.contains(e.target) &&
        !e.target.closest('#navToggle')) {
      mobileMenu.classList.remove('open');
    }
  });
});

// ===== HERO CAROUSEL (mixto imagen/video)
const heroConfig = {
  autoPlay: true,        // ⇦ pon false si no quieres autoplay
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
    dotsWrap.appendChild(b);
    return b;
  });

  const prevBtn = document.querySelector(".hero-nav.prev");
  const nextBtn = document.querySelector(".hero-nav.next");
  prevBtn?.addEventListener("click", () => goTo(current - 1));
  nextBtn?.addEventListener("click", () => goTo(current + 1));

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

  if (pauseOnHover){
    root.closest(".hero")?.addEventListener("mouseenter", stop);
    root.closest(".hero")?.addEventListener("mouseleave", start);
  }
  document.addEventListener("visibilitychange", () => { document.hidden ? stop() : start(); });
  if (autoPlay) start();

  function start(){ if (!autoPlay) return; stop(); timer = setInterval(() => goTo(current + 1), interval || 5000); const v = slidesEls[current]?.querySelector("video"); if (v) v.play().catch(()=>{}); }
  function stop(){ if (timer){ clearInterval(timer); timer = null; } const v = slidesEls[current]?.querySelector("video"); if (v) v.pause(); }

  function goTo(index){
    const total = slidesEls.length;
    const next = (index + total) % total;
    if (next === current) return;

    slidesEls[current].classList.remove("is-active");
    dots[current]?.classList.remove("is-active");
    slidesEls[next].classList.add("is-active");
    dots[next]?.classList.add("is-active");

    const vCur = slidesEls[current].querySelector("video"); if (vCur) vCur.pause();
    const vNext = slidesEls[next].querySelector("video"); if (vNext) vNext.play().catch(()=>{});
    current = next;
    if (autoPlay) start();
  }
}

/* ===== Lightbox para imágenes con [data-lightbox] ===== */
(function(){
  let items = [];         // [{src, caption, group}]
  let index = 0;
  let overlay, media, captionEl;

  // Crea overlay si no existe
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

    // Cerrar por click fuera del contenido
    overlay.addEventListener('click', (e) => {
      const dialog = overlay.querySelector('.lb-dialog');
      if (!dialog.contains(e.target)) close();
    });
    // Botones
    overlay.querySelector('.lb-close').addEventListener('click', close);
    overlay.querySelector('.lb-prev').addEventListener('click', prev);
    overlay.querySelector('.lb-next').addEventListener('click', next);

    // Teclado
    document.addEventListener('keydown', (e) => {
      if (!overlay.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    });

    return overlay;
  }

  // Abre una galería (group) en un índice
  function open(group, startIndex){
    // Recolecta items del mismo grupo
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

  // Delegación: click en cualquier [data-lightbox]
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
// Año dinámico en el footer
document.addEventListener('DOMContentLoaded', () => {
  const y = document.getElementById('yearCopy');
  if (y) y.textContent = new Date().getFullYear();
});
