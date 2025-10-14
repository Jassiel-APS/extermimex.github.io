// Carga e inserta los includes de header, footer y burbuja WhatsApp
async function includeHTML(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('No se pudo cargar ' + url);
    el.innerHTML = await res.text();
  } catch (e) {
    el.innerHTML = '<!-- Error al cargar ' + url + ' -->';
  }
}

// Carga todos los elementos que usen el atributo data-include
async function includeAllDataInclude(basePath = '/components/') {
  const nodes = document.querySelectorAll('[data-include]');
  if (!nodes || nodes.length === 0) return;
  const promises = Array.from(nodes).map(async (node) => {
    // Allow absolute or root-relative paths in the attribute; if it's a relative path, prefix with basePath
    let url = node.getAttribute('data-include').trim();
    if (!url) return;
    if (!url.startsWith('/') && !url.match(/^https?:/)) {
      // relative path -> make it root-relative
      url = basePath + url.replace(/^\/+/, '');
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se pudo cargar ' + url);
      node.innerHTML = await res.text();
    } catch (e) {
      node.innerHTML = '<!-- Error al cargar ' + url + ' -->';
    }
  });
  await Promise.all(promises);
}

// Detecta la página actual y marca el nav activo
function setActiveNav() {
  const path = window.location.pathname.split('/').pop();
  let navKey = 'index';
  if (path.includes('clientes')) navKey = 'clientes';
  else if (path.includes('certificaciones')) navKey = 'certificaciones';
  else if (path.includes('sectores')) navKey = 'sectores';
  else if (path.includes('nosotros')) navKey = 'nosotros';
  else if (path.includes('contacto')) navKey = 'contacto';
  else if (path.includes('aviso-de-privacidad') || path.includes('privacidad')) navKey = 'privacidad';
  // Marcar activo
  document.querySelectorAll('.nav-menu a[data-nav]').forEach(a => {
    if (a.getAttribute('data-nav') === navKey) {
      a.classList.add('active');
    } else {
      a.classList.remove('active');
    }
  });
}

// Inicializa los includes y nav activo
window.addEventListener('DOMContentLoaded', async () => {
  // Usar rutas root-relative para que los includes funcionen desde permalinks (ej: /servicios-fumigacion/)
  // Antes se usaban rutas relativas ('components/' o '../components/'), lo que provocaba requests a
  // /servicios-fumigacion/components/header.html (no existe). Con '/' garantizamos que se carguen
  // desde la raíz del sitio: /components/header.html
  const base = '/components/';
  await includeHTML('#header-include', base + 'header.html');
  await includeHTML('#footer-include', base + 'footer.html');
  await includeHTML('#wa-float-include', base + 'whatsapp-float.html');
  await includeHTML('#slider-sectores-include', base + 'slider-sectores.html');
  // Cargar cualquier elemento con data-include (por ejemplo: testimonios)
  await includeAllDataInclude(base);
  setActiveNav();

  // Disparar evento para notificar que los includes han sido cargados
  try {
    const evt = new CustomEvent('includes:loaded');
    document.dispatchEvent(evt);
  } catch (e) {
    // noop
  }
});
