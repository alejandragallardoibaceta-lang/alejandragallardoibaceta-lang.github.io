(() => {
  const key = 'ag-design-analytics-v1';
  const preference = document.querySelector('[data-analytics-settings]');
  const panel = document.createElement('section');
  panel.className = 'analytics-choice';
  panel.setAttribute('aria-label', 'Preferencias de analítica');
  panel.innerHTML = '<strong>Respetamos tu privacidad</strong><p>Con tu permiso, usamos cookies de analítica de Hotjar para entender cómo navegas por el portafolio y mejorar tu experiencia.</p><div><button type="button" data-choice="no">Rechazar</button><button type="button" data-choice="yes">Aceptar</button></div>';
  document.body.append(panel);
  let choice;
  try { choice = localStorage.getItem(key); } catch {}
  function start() {
    if (window._hjSettings) return;
    window.hj = function(){ (window.hj.q = window.hj.q || []).push(arguments); };
    window._hjSettings = {hjid:6855358,hjsv:6};
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://static.hotjar.com/c/hotjar-6855358.js?sv=6';
    document.head.append(script);
    document.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link) return;
      if (link.hostname === 'wa.me') window.hj('event','clic_whatsapp');
      if (link.matches('.project-services')) window.hj('event','clic_ver_servicios');
    });
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        window.hj('event','bloque_servicios_visible');
        observer.unobserve(entry.target);
      }
    });
    document.querySelectorAll('.project .sv-cta').forEach(el => observer.observe(el));
  }
  panel.hidden = choice === 'yes' || choice === 'no';
  if (choice === 'yes') start();
  preference.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  panel.addEventListener('click', event => {
    const next = event.target.dataset.choice;
    if (!next) return;
    try { localStorage.setItem(key,next); } catch {}
    panel.hidden = true;
    if (next === 'yes') start();
    else if (window._hjSettings) {
      for (const item of document.cookie.split(';')) {
        const name = item.trim().split('=')[0];
        if (name.startsWith('_hj')) {
          document.cookie = name + '=; Max-Age=0; Path=/';
          document.cookie = name + '=; Max-Age=0; Path=/; Domain=' + location.hostname;
        }
      }
      location.reload();
    }
  });
})();
