(() => {
  const storageKey = 'chessflow-language';
  const supported = ['fr', 'en'];

  function preferredLanguage() {
    let saved = null;
    try { saved = localStorage.getItem(storageKey); } catch (_) { /* Storage can be disabled. */ }
    if (supported.includes(saved)) return saved;
    return navigator.language && navigator.language.toLowerCase().startsWith('en') ? 'en' : 'fr';
  }

  function setLanguage(language, persist = true) {
    const lang = supported.includes(language) ? language : 'fr';
    document.documentElement.lang = lang;

    document.querySelectorAll('[data-fr][data-en]').forEach((element) => {
      element.innerHTML = element.dataset[lang];
    });
    document.querySelectorAll('[data-aria-fr][data-aria-en]').forEach((element) => {
      element.setAttribute('aria-label', element.dataset[`aria${lang === 'fr' ? 'Fr' : 'En'}`]);
    });
    document.querySelectorAll('[data-alt-fr][data-alt-en]').forEach((element) => {
      element.alt = element.dataset[`alt${lang === 'fr' ? 'Fr' : 'En'}`];
    });
    document.querySelectorAll('[data-lang]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
    });

    const page = document.body;
    if (page.dataset[`title${lang === 'fr' ? 'Fr' : 'En'}`]) {
      document.title = page.dataset[`title${lang === 'fr' ? 'Fr' : 'En'}`];
    }
    const description = page.dataset[`description${lang === 'fr' ? 'Fr' : 'En'}`];
    if (description) {
      document.querySelectorAll('meta[name="description"], meta[property="og:description"]').forEach((meta) => meta.content = description);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = document.title;
    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.content = lang === 'fr' ? 'fr_FR' : 'en_US';
    if (persist) {
      try { localStorage.setItem(storageKey, lang); } catch (_) { /* Storage can be disabled. */ }
    }
  }

  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.lang));
  });
  setLanguage(preferredLanguage(), false);

  const header = document.querySelector('.site-header');
  const updateHeader = () => header && header.classList.toggle('scrolled', window.scrollY > 12);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const menuButton = document.querySelector('.menu-toggle');
  const navPanel = document.querySelector('.nav-panel');
  if (menuButton && navPanel) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      navPanel.classList.toggle('open', open);
    });
    navPanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      menuButton.setAttribute('aria-expanded', 'false');
      navPanel.classList.remove('open');
    }));
  }

  document.querySelectorAll('.screenshot-image').forEach((image) => {
    const show = () => image.parentElement.classList.toggle('is-loaded', image.naturalWidth > 0);
    image.addEventListener('load', show);
    image.addEventListener('error', show);
    if (image.complete) show();
  });

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -35px' });
    reveals.forEach((element) => observer.observe(element));
  } else {
    reveals.forEach((element) => element.classList.add('visible'));
  }
})();
