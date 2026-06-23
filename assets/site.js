(() => {
  const storageKey = 'chessflow-language';
  const supported = ['fr', 'en'];

  function preferredLanguage() {
    const pageLanguage = document.body.dataset.defaultLanguage;
    if (supported.includes(pageLanguage)) return pageLanguage;
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

  const guideItems = [
    { slug: 'repertoires', fr: 'Répertoires', en: 'Repertoires' },
    { slug: 'import-pgn', fr: 'Import PGN', en: 'PGN import' },
    { slug: 'entrainement-ouvertures', fr: 'Entraînement', en: 'Training' },
    { slug: 'statistiques', fr: 'Statistiques', en: 'Statistics' },
    { slug: 'puzzles', fr: 'Puzzles', en: 'Puzzles' },
    { slug: 'analyse-stockfish', fr: 'Stockfish', en: 'Stockfish' },
  ];

  function guidePath(item, lang, fromArticle) {
    const prefix = fromArticle ? '../' : '';
    return lang === 'en' ? `${prefix}${item.slug}/en.html` : `${prefix}${item.slug}/`;
  }

  function guideIndexPath(lang, fromArticle) {
    if (fromArticle) return lang === 'en' ? '../en.html' : '../';
    return lang === 'en' ? 'en.html' : './';
  }

  function currentGuideIndex() {
    const pathname = window.location.pathname;
    return guideItems.findIndex((item) => pathname.includes(`/guide/${item.slug}/`));
  }

  function addGuideNavigation() {
    if (!document.body.dataset.page || !document.body.dataset.page.startsWith('guide')) return;

    const lang = document.body.dataset.defaultLanguage === 'en' ? 'en' : 'fr';
    const hero = document.querySelector('.guide-hero');
    const articleLayout = document.querySelector('.article-layout');
    if (!hero || document.querySelector('.guide-quick-nav')) return;

    const activeIndex = currentGuideIndex();
    const fromArticle = activeIndex !== -1;
    const quickNav = document.createElement('nav');
    quickNav.className = 'guide-quick-nav';
    quickNav.setAttribute('aria-label', lang === 'en' ? 'Guide sections' : 'Rubriques du guide');

    const indexLink = document.createElement('a');
    indexLink.href = guideIndexPath(lang, fromArticle);
    indexLink.textContent = lang === 'en' ? 'All guides' : 'Tous les guides';
    if (activeIndex === -1) indexLink.setAttribute('aria-current', 'page');
    quickNav.append(indexLink);

    guideItems.forEach((item, index) => {
      const link = document.createElement('a');
      link.href = guidePath(item, lang, fromArticle);
      link.textContent = item[lang];
      if (index === activeIndex) link.setAttribute('aria-current', 'page');
      quickNav.append(link);
    });
    hero.after(quickNav);

    if (!articleLayout || activeIndex === -1 || document.querySelector('.guide-step-nav')) return;

    const previous = guideItems[activeIndex - 1];
    const next = guideItems[activeIndex + 1];
    const stepNav = document.createElement('nav');
    stepNav.className = 'guide-step-nav';
    stepNav.setAttribute('aria-label', lang === 'en' ? 'Guide article navigation' : 'Navigation entre les articles du guide');

    const previousLink = document.createElement('a');
    previousLink.className = 'guide-step-previous';
    previousLink.href = previous ? guidePath(previous, lang, true) : guideIndexPath(lang, true);
    previousLink.innerHTML = `<span>${lang === 'en' ? 'Previous' : 'Précédent'}</span><strong>${previous ? previous[lang] : (lang === 'en' ? 'All guides' : 'Tous les guides')}</strong>`;

    const nextLink = document.createElement('a');
    nextLink.className = 'guide-step-next';
    nextLink.href = next ? guidePath(next, lang, true) : guideIndexPath(lang, true);
    nextLink.innerHTML = `<span>${lang === 'en' ? 'Next' : 'Suivant'}</span><strong>${next ? next[lang] : (lang === 'en' ? 'All guides' : 'Tous les guides')}</strong>`;

    stepNav.append(previousLink, nextLink);
    articleLayout.after(stepNav);
  }

  addGuideNavigation();

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
