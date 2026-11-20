(() => {
  const key = 'ag-design-analytics-v1';
  const preference = document.querySelector('[data-analytics-settings]');
  const panel = document.createElement('section');
  panel.className = 'analytics-choice';
  panel.setAttribute('aria-label', 'Preferencias de analítica');
  panel.innerHTML = '<strong>¿Aceptas las cookies?</strong><p>Ayúdame a mejorar este portafolio. Si aceptas las cookies, podré identificar qué secciones funcionan bien y cuáles podrían ser más fáciles de usar, para brindarte una mejor experiencia.</p><div><button type="button" data-choice="no">Rechazar</button><button type="button" data-choice="yes">Aceptar</button></div>';
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
    const measurementId = document.querySelector('meta[name="ga-measurement-id"]')?.content;
    if (measurementId) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function(){ window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false
      });
      const tag = document.createElement('script');
      tag.async = true;
      tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
      document.head.append(tag);
    }
    function record(name) {
      window.hj('event', name);
      if (measurementId) window.gtag('event', name);
    }
    document.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (!link) return;
      if (link.hostname === 'wa.me') {
        const label = link.textContent.trim();
        if (label === 'Quiero cotizar') record('clic_quiero_cotizar');
        else if (label === '¡Conversemos!') record('clic_conversemos');
        record('clic_whatsapp');
      }
      if (link.matches('.project-services')) record('clic_ver_servicios');
    });
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        record('bloque_servicios_visible');
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
        if (name.startsWith('_hj') || name === '_ga' || name.startsWith('_ga_')) {
          document.cookie = name + '=; Max-Age=0; Path=/';
          document.cookie = name + '=; Max-Age=0; Path=/; Domain=' + location.hostname;
        }
      }
      location.reload();
    }
  });
})();
