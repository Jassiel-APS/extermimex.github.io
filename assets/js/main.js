/* =========================================================
   EXTERMIMEX — main.js (robusto con espera de header)
   ========================================================= */

// ---------- helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);

// ========= NAV MÓVIL (robusto) =========
(function () {
  const getMenu = () => document.querySelector('#mobileMenu') || document.querySelector('#navModal');
  const isOpen  = (m) => m && (m.classList.contains('open') || m.classList.contains('is-open'));

  let lastFocus = null;
  let ignoreUntil = 0; // evita cierre inmediato por click fuera
  const FOCUSABLE = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

  const firstFocusable = (root) => root.querySelector(FOCUSABLE);
  const getFocusables = (root) =>
    Array.from(root.querySelectorAll(FOCUSABLE))
      .filter(el => !el.disabled && el.getAttribute('aria-hidden') !== 'true');

  function openMenu(menu){
    if (!menu) return;
    lastFocus = (document.activeElement instanceof HTMLElement) ? document.activeElement : null;

    (menu.id === 'navModal') ? menu.classList.add('is-open') : menu.classList.add('open');
    menu.removeAttribute('aria-hidden');
    menu.removeAttribute('inert');
    document.body.classList.add('no-scroll');

    const preferred = menu.querySelector('.nav-modal__close');
    (preferred || firstFocusable(menu))?.focus();

    // ignora clicks "fuera" durante un instante
    ignoreUntil = performance.now() + 220;
  }

  function closeMenu(menu){
    if (!menu) return;

    const backTo = (lastFocus && document.contains(lastFocus)) ? lastFocus : document.querySelector('#navToggle');
    backTo?.focus();

    menu.setAttribute('aria-hidden','true');
    menu.setAttribute('inert','');
    menu.classList.remove('open');
    menu.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
  }

  function bindNav(){
    const navToggle = document.querySelector('#navToggle');
    const menu = getMenu();
    if (!navToggle || !menu) return false;

    // evita duplicar listeners si el header se reinyecta
    if (navToggle.dataset.bound === '1') return true;
    navToggle.dataset.bound = '1';

    navToggle.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      const m = getMenu(); // siempre obtener el actual
      isOpen(m) ? closeMenu(m) : openMenu(m);
    });

    // cerrar con botones dedicados
    const wireCloseButtons = () => {
      const m = getMenu();
      if (!m) return;
      m.querySelectorAll('[data-close="modal"], .mobile-menu-close').forEach(btn=>{
        if (btn.dataset.bound === '1') return;
        btn.dataset.bound = '1';
        btn.addEventListener('click', ()=> closeMenu(getMenu()));
      });
    };
    wireCloseButtons();

    // cerrar tocando backdrop (modal) o fuera del panel
    document.addEventListener('click', (e)=>{
      const t = performance.now();
      if (t < ignoreUntil) return; // recién abierto, no cerrar

      const m = getMenu();
      if (!isOpen(m)) return;

      const content = m.querySelector('.nav-modal__panel') || m.querySelector('.mobile-menu-content');
      const clickedToggle = e.target.closest('#navToggle');
      if (clickedToggle) return;

      if (content && !content.contains(e.target)) closeMenu(m);
    }, { passive:true });

    // ESC
    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape') closeMenu(getMenu());
    });

    // cerrar al navegar por cualquier link del menú
    document.addEventListener('click', (e)=>{
      const m = getMenu();
      if (!isOpen(m)) return;
      const link = e.target.closest('.nav-modal a, .mobile-menu a');
      if (link) closeMenu(m);
    });

    // trap de TAB
    document.addEventListener('keydown', (e)=>{
      const m = getMenu();
      if (e.key !== 'Tab' || !isOpen(m)) return;
      const focusables = getFocusables(m); if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    return true;
  }

  function waitAndBind(){
    if (bindNav()) return;
    const obs = new MutationObserver((_,o)=>{ if (bindNav()) o.disconnect(); });
    obs.observe(document.documentElement, { childList:true, subtree:true });
    setTimeout(bindNav, 3000);
  }

  (document.readyState === 'loading')
    ? document.addEventListener('DOMContentLoaded', waitAndBind)
    : waitAndBind();
})();



// ========= HERO CAROUSEL =========
const heroConfig = {
  autoPlay: true,
  interval: 5500,
  pauseOnHover: true,
  slides: [
    {
      type: "image",
      src: "./assets/img/Fondo extermimex.jpg",
      alt: "Equipo Extermimex y logo"
    },
    /*{
      type: "video",
      src: "./assets/img/Diseño sin título.mp4",
      poster: "./assets/img/Fondo extermimex.jpg"
    }*/
   {
      type: "image",
      src: "./assets/img/Fondo extermimex 2.jpg",
      alt: "Servicio de fumigación"
   }
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

      // Controles flotantes personalizados
      const controls = document.createElement("div");
      controls.className = "hero-video-controls";
      controls.style = `position:absolute;left:0;right:0;bottom:24px;display:flex;justify-content:center;z-index:10;pointer-events:none;`;

      // Botón play (blanco, semitransparente)
      const playBtn = document.createElement("button");
      playBtn.type = "button";
      playBtn.innerHTML = `<svg width='48' height='48' fill='none' viewBox='0 0 48 48'><circle cx='24' cy='24' r='24' fill='white' fill-opacity='0.7'/><polygon points='20,16 36,24 20,32' fill='#00004F'/></svg>`;
      playBtn.title = "Reproducir";
      playBtn.style = "pointer-events:auto;background:none;border:none;cursor:pointer;transition:opacity 0.2s;opacity:1;";

      // Botón pausa (blanco, semitransparente)
      const pauseBtn = document.createElement("button");
      pauseBtn.type = "button";
      pauseBtn.innerHTML = `<svg width='48' height='48' fill='none' viewBox='0 0 48 48'><circle cx='24' cy='24' r='24' fill='white' fill-opacity='0.7'/><rect x='18' y='16' width='4' height='16' fill='#00004F'/><rect x='26' y='16' width='4' height='16' fill='#00004F'/></svg>`;
      pauseBtn.title = "Pausar";
      pauseBtn.style = "pointer-events:auto;background:none;border:none;cursor:pointer;transition:opacity 0.2s;opacity:1;";

      controls.appendChild(playBtn);
      controls.appendChild(pauseBtn);
      slide.style.position = "relative";
      slide.appendChild(controls);

      // Mostrar solo el botón correspondiente
      function updateControls(){
        if (v.paused) {
          playBtn.style.display = "inline-block";
          pauseBtn.style.display = "none";
        } else {
          playBtn.style.display = "none";
          pauseBtn.style.display = "inline-block";
        }
      }
      updateControls();

      playBtn.addEventListener("click", e => {
        e.stopPropagation();
        v.play();
        updateControls();
      });
      pauseBtn.addEventListener("click", e => {
        e.stopPropagation();
        v.pause();
        updateControls();
      });
      v.addEventListener("play", updateControls);
      v.addEventListener("pause", updateControls);
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

  let videoTimeout = null;
  function goTo(index){
    const total = slidesEls.length;
    const next = (index + total) % total;
    if (next === current) return;

    // Limpiar timeout anterior si existe
    if (videoTimeout) {
      clearTimeout(videoTimeout);
      videoTimeout = null;
    }

    slidesEls[current].classList.remove("is-active");
    dots[current] && dots[current].classList.remove("is-active");
    slidesEls[next].classList.add("is-active");
    dots[next] && dots[next].classList.add("is-active");

    const vCur = slidesEls[current].querySelector("video"); if (vCur) vCur.pause();
    const vNext = slidesEls[next].querySelector("video"); if (vNext) {
      vNext.playbackRate = 1;
      vNext.play().catch(()=>{});
      // Espera 30 segundos antes de avanzar
      videoTimeout = setTimeout(() => {
        goTo(next + 1);
      }, 30000);
    }
    current = next;
    if (autoPlay && !vNext) start();
  }

  function nextSlide() {
    goTo(current + 1);
  }

  function setupVideoSlide() {
    const activeSlide = document.querySelector('.hero-slide.is-active');
    if (!activeSlide) return;
    const video = activeSlide.querySelector('video');
    if (video) {
      video.addEventListener('ended', () => {
        nextSlide();
      });
    }
  }

  // Llama esta función cada vez que cambias de slide
  setupVideoSlide();
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


// ========= CARRUSEL DE TESTIMONIOS =========
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.getElementById('testimoniosCarousel');
  if (!carousel) return;

  const track = carousel.querySelector('#testimoniosTrack');
  const slides = track.querySelectorAll('.testimonio-slide');
  const prevBtn = carousel.querySelector('#testimoniosPrev');
  const nextBtn = carousel.querySelector('#testimoniosNext');
  const dotsContainer = carousel.querySelector('#testimoniosDots');

  if (!track || !slides.length) return;

  let currentIndex = 0;
  let slidesToShow = 1;
  let autoPlayInterval = null;
  const autoPlayDelay = 6000; // 6 segundos

  // Detectar cuántos slides mostrar según el viewport
  function updateSlidesToShow() {
    const width = window.innerWidth;
    if (width >= 1024) {
      slidesToShow = 3;
    } else if (width >= 768) {
      slidesToShow = 2;
    } else {
      slidesToShow = 1;
    }
  }

  // Crear indicadores
  function createDots() {
    if (!dotsContainer) return;
    dotsContainer.innerHTML = '';
    
    const totalDots = Math.ceil(slides.length / slidesToShow);
    
    for (let i = 0; i < totalDots; i++) {
      const dot = document.createElement('button');
      dot.className = `testimonio-dot ${i === 0 ? 'active' : ''}`;
      dot.setAttribute('aria-label', `Ir al grupo ${i + 1} de testimonios`);
      dot.addEventListener('click', () => goToSlide(i * slidesToShow));
      dotsContainer.appendChild(dot);
    }
  }

  // Actualizar posición del carrusel
  function updateCarousel() {
    const slideWidth = 100 / slidesToShow;
    const maxIndex = Math.max(0, slides.length - slidesToShow);
    currentIndex = Math.min(currentIndex, maxIndex);
    
    const translateX = -(currentIndex * slideWidth);
    track.style.transform = `translateX(${translateX}%)`;

    // Actualizar indicadores
    const activeDotIndex = Math.floor(currentIndex / slidesToShow);
    const dots = dotsContainer?.querySelectorAll('.testimonio-dot');
    dots?.forEach((dot, index) => {
      dot.classList.toggle('active', index === activeDotIndex);
    });

    // Actualizar botones
    if (prevBtn && nextBtn) {
      prevBtn.style.opacity = currentIndex === 0 ? '0.5' : '1';
      nextBtn.style.opacity = currentIndex >= slides.length - slidesToShow ? '0.5' : '1';
    }
  }

  // Ir a un slide específico
  function goToSlide(index) {
    const maxIndex = Math.max(0, slides.length - slidesToShow);
    currentIndex = Math.max(0, Math.min(index, maxIndex));
    updateCarousel();
    resetAutoPlay();
  }

  // Slide anterior
  function prevSlide() {
    if (currentIndex > 0) {
      currentIndex--;
      updateCarousel();
      resetAutoPlay();
    }
  }

  // Siguiente slide
  function nextSlide() {
    const maxIndex = Math.max(0, slides.length - slidesToShow);
    if (currentIndex < maxIndex) {
      currentIndex++;
    } else {
      currentIndex = 0; // Volver al inicio
    }
    updateCarousel();
    resetAutoPlay();
  }

  // Auto-play
  function startAutoPlay() {
    stopAutoPlay();
    autoPlayInterval = setInterval(() => {
      nextSlide();
    }, autoPlayDelay);
  }

  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
  }

  function resetAutoPlay() {
    stopAutoPlay();
    startAutoPlay();
  }

  // Event listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', prevSlide);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', nextSlide);
  }

  // Pausar auto-play al hacer hover
  carousel.addEventListener('mouseenter', stopAutoPlay);
  carousel.addEventListener('mouseleave', startAutoPlay);

  // Soporte táctil básico
  let startX = 0;
  let isDragging = false;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDragging = true;
    stopAutoPlay();
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
  }, { passive: false });

  track.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    
    const endX = e.changedTouches[0].clientX;
    const diffX = startX - endX;
    
    if (Math.abs(diffX) > 50) { // Mínimo 50px de desplazamiento
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    
    isDragging = false;
    startAutoPlay();
  }, { passive: true });

  // Navegación con teclado
  carousel.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  });

  // Responsive
  function handleResize() {
    updateSlidesToShow();
    createDots();
    updateCarousel();
  }

  window.addEventListener('resize', handleResize);

  // Inicialización
  updateSlidesToShow();
  createDots();
  updateCarousel();
  startAutoPlay();

  // Pausar auto-play cuando la página no es visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  });
});

// Configuración de Swiper.js para el slider de empresas
const empresasSlider = new Swiper('.empresas-slider', {
  slidesPerView: 1,
  spaceBetween: 10,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  breakpoints: {
    640: {
      slidesPerView: 2,
      spaceBetween: 20,
    },
    768: {
      slidesPerView: 3,
      spaceBetween: 30,
    },
    1024: {
      slidesPerView: 4,
      spaceBetween: 40,
    },
  },
});
