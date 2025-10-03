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
  // Detecta si la página está en una subcarpeta (ej: /pages/)
  const isSubfolder = window.location.pathname.includes('/pages/');
  const base = isSubfolder ? '../components/' : 'components/';
  await includeHTML('#header-include', base + 'header.html');
  await includeHTML('#footer-include', base + 'footer.html');
  await includeHTML('#wa-float-include', base + 'whatsapp-float.html');
  await includeHTML('#slider-sectores-include', base + 'slider-sectores.html');
  setActiveNav();
});
