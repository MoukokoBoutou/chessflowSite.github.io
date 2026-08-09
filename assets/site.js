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
  let scrollFrame = 0;
  const updateHeader = () => {
    scrollFrame = 0;
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 12);
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    header.style.setProperty('--scroll-progress', progress.toFixed(4));
  };
  const requestHeaderUpdate = () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateHeader);
  };
  updateHeader();
  window.addEventListener('scroll', requestHeaderUpdate, { passive: true });
  window.addEventListener('resize', requestHeaderUpdate, { passive: true });

  const menuButton = document.querySelector('.menu-toggle');
  const navPanel = document.querySelector('.nav-panel');
  if (menuButton && navPanel) {
    const language = () => document.documentElement.lang === 'en' ? 'en' : 'fr';
    const setMenu = (open, restoreFocus = false) => {
      menuButton.setAttribute('aria-expanded', String(open));
      menuButton.setAttribute('aria-label', open
        ? (language() === 'en' ? 'Close menu' : 'Fermer le menu')
        : (language() === 'en' ? 'Open menu' : 'Ouvrir le menu'));
      navPanel.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      if (!open && restoreFocus) menuButton.focus();
    };
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
    });
    navPanel.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
      setMenu(false);
    }));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    document.addEventListener('pointerdown', (event) => {
      if (menuButton.getAttribute('aria-expanded') !== 'true') return;
      if (!navPanel.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 980) setMenu(false);
    }, { passive: true });
  }

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

  function addGuideBreadcrumbData() {
    const pageType = document.body.dataset.page;
    if (pageType !== 'guide' && pageType !== 'guide-article') return;
    if (document.querySelector('#guide-breadcrumb-data')) return;

    const lang = document.body.dataset.defaultLanguage === 'en' ? 'en' : 'fr';
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    if (!canonical) return;
    const items = [
      {
        '@type': 'ListItem',
        position: 1,
        name: lang === 'en' ? 'Home' : 'Accueil',
        item: lang === 'en' ? 'https://chessflow.fr/en.html' : 'https://chessflow.fr/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: lang === 'en' ? 'Chess opening guides' : 'Guides d’ouvertures d’échecs',
        item: lang === 'en' ? 'https://chessflow.fr/guide/en.html' : 'https://chessflow.fr/guide/',
      },
    ];
    if (pageType === 'guide-article') {
      items.push({
        '@type': 'ListItem',
        position: 3,
        name: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim() || document.title,
        item: canonical,
      });
    }

    const script = document.createElement('script');
    script.id = 'guide-breadcrumb-data';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    });
    document.head.append(script);
  }

  function addGuideNavigation() {
    if (!document.body.dataset.page || !document.body.dataset.page.startsWith('guide')) return;

    const lang = document.body.dataset.defaultLanguage === 'en' ? 'en' : 'fr';
    const articleLayout = document.querySelector('.article-layout');
    const activeIndex = currentGuideIndex();
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

  addGuideBreadcrumbData();
  addGuideNavigation();

  document.querySelectorAll('[data-showcase]').forEach((showcase) => {
    const tabs = [...showcase.querySelectorAll('[data-showcase-tab]')];
    const panels = [...showcase.querySelectorAll('[data-showcase-screen]')];
    if (!tabs.length || tabs.length !== panels.length) return;

    const activate = (name, focus = false) => {
      tabs.forEach((tab) => {
        const active = tab.dataset.showcaseTab === name;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
        if (active && focus) tab.focus();
      });
      panels.forEach((panel) => {
        const active = panel.dataset.showcaseScreen === name;
        panel.hidden = !active;
        panel.classList.toggle('is-active', active);
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activate(tab.dataset.showcaseTab));
      tab.addEventListener('keydown', (event) => {
        let nextIndex = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % tabs.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === 'Home') nextIndex = 0;
        if (event.key === 'End') nextIndex = tabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        activate(tabs[nextIndex].dataset.showcaseTab, true);
      });
    });
  });

  function acquisitionEvent(name, detail = {}) {
    if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: name, ...detail });
    window.dispatchEvent(new CustomEvent(`chessflow:${name}`, { detail }));
  }

  const campaignParameters = new URLSearchParams(window.location.search);
  const campaignKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid'];
  document.querySelectorAll('a[href*="play.google.com/store/apps/details"]').forEach((link) => {
    const playUrl = new URL(link.href);
    const placement = link.dataset.playCta
      || `${document.body.dataset.page || 'page'}_${link.closest('section')?.id || 'content'}`;
    const referrer = new URLSearchParams();

    campaignKeys.forEach((key) => {
      const value = campaignParameters.get(key);
      if (value) referrer.set(key, value);
    });
    if (!referrer.has('utm_source')) referrer.set('utm_source', 'chessflow.fr');
    if (!referrer.has('utm_medium')) referrer.set('utm_medium', 'website');
    if (!referrer.has('utm_campaign')) referrer.set('utm_campaign', 'organic');
    const originalContent = referrer.get('utm_content');
    referrer.set('utm_content', originalContent ? `${originalContent}_${placement}` : placement);
    referrer.set('cf_landing', window.location.pathname);
    playUrl.searchParams.set('referrer', referrer.toString());
    link.href = playUrl.toString();
    link.dataset.playCta = placement;
    link.addEventListener('click', () => acquisitionEvent('play_store_click', {
      placement,
      landing: window.location.pathname,
      campaign: referrer.get('utm_campaign'),
    }));
  });

  const trialContent = {
    fr: [
      { line: '1. e4 e5  2. Cf3 Cc6', question: 'Jouez le prochain coup des Blancs.', from: 'f1', to: 'c4', reply: ['g8', 'f6'] },
      { line: '3. Fc4 Cf6', question: 'Continuez la variante enregistrée.', from: 'd2', to: 'd3', reply: ['f8', 'c5'] },
      { line: '4. d3 Fc5', question: 'Mettez maintenant le roi en sécurité.', from: 'e1', to: 'g1', castle: true },
    ],
    en: [
      { line: '1. e4 e5  2. Nf3 Nc6', question: 'Play White’s next move.', from: 'f1', to: 'c4', reply: ['g8', 'f6'] },
      { line: '3. Bc4 Nf6', question: 'Continue the saved line.', from: 'd2', to: 'd3', reply: ['f8', 'c5'] },
      { line: '4. d3 Bc5', question: 'Now bring your king to safety.', from: 'e1', to: 'g1', castle: true },
    ],
  };

  const trialPieces = {
    wr: { asset: 'wR.svg', fr: 'tour blanche', en: 'white rook' },
    wn: { asset: 'wN.svg', fr: 'cavalier blanc', en: 'white knight' },
    wb: { asset: 'wB.svg', fr: 'fou blanc', en: 'white bishop' },
    wq: { asset: 'wQ.svg', fr: 'dame blanche', en: 'white queen' },
    wk: { asset: 'wK.svg', fr: 'roi blanc', en: 'white king' },
    wp: { asset: 'wP.svg', fr: 'pion blanc', en: 'white pawn' },
    br: { asset: 'bR.svg', fr: 'tour noire', en: 'black rook' },
    bn: { asset: 'bN.svg', fr: 'cavalier noir', en: 'black knight' },
    bb: { asset: 'bB.svg', fr: 'fou noir', en: 'black bishop' },
    bq: { asset: 'bQ.svg', fr: 'dame noire', en: 'black queen' },
    bk: { asset: 'bK.svg', fr: 'roi noir', en: 'black king' },
    bp: { asset: 'bP.svg', fr: 'pion noir', en: 'black pawn' },
  };

  const trialInitialPosition = {
    a1: 'wr', b1: 'wn', c1: 'wb', d1: 'wq', e1: 'wk', f1: 'wb', h1: 'wr',
    a2: 'wp', b2: 'wp', c2: 'wp', d2: 'wp', f2: 'wp', g2: 'wp', h2: 'wp',
    e4: 'wp', f3: 'wn',
    a8: 'br', c8: 'bb', d8: 'bq', e8: 'bk', f8: 'bb', g8: 'bn', h8: 'br',
    a7: 'bp', b7: 'bp', c7: 'bp', d7: 'bp', f7: 'bp', g7: 'bp', h7: 'bp',
    e5: 'bp', c6: 'bn',
  };

  document.querySelectorAll('[data-opening-trial]').forEach((trial) => {
    const lang = trial.dataset.language === 'en' ? 'en' : 'fr';
    const steps = trialContent[lang];
    const score = trial.querySelector('[data-trial-score]');
    const progress = trial.querySelector('[data-trial-progress]');
    const stepLabel = trial.querySelector('[data-trial-step]');
    const line = trial.querySelector('[data-trial-line]');
    const question = trial.querySelector('[data-trial-question]');
    const board = trial.querySelector('[data-trial-board]');
    const feedback = trial.querySelector('[data-trial-feedback]');
    const complete = trial.querySelector('[data-trial-complete]');
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const position = { ...trialInitialPosition };
    let currentStep = 0;
    let selectedSquare = null;
    let locked = false;
    let lastMove = [];

    const movePiece = (from, to, castle = false) => {
      position[to] = position[from];
      delete position[from];
      if (castle) {
        position.f1 = position.h1;
        delete position.h1;
      }
    };

    const squareLabel = (square, piece) => {
      const pieceName = piece ? trialPieces[piece][lang] : (lang === 'en' ? 'empty' : 'vide');
      return lang === 'en' ? `${square}, ${pieceName}` : `${square}, ${pieceName}`;
    };

    const renderBoard = (focusSquare = null) => {
      const step = steps[currentStep];
      const squares = [];
      for (let rank = 8; rank >= 1; rank -= 1) {
        files.forEach((file, fileIndex) => {
          const square = `${file}${rank}`;
          const piece = position[square];
          const cell = document.createElement('button');
          cell.type = 'button';
          cell.className = `trial-square ${(fileIndex + rank) % 2 ? 'is-dark' : 'is-light'}`;
          cell.dataset.square = square;
          cell.setAttribute('role', 'gridcell');
          cell.setAttribute('aria-label', squareLabel(square, piece));
          cell.tabIndex = !locked && square === (selectedSquare ? step?.to : step?.from) ? 0 : -1;
          if (square === selectedSquare) cell.classList.add('is-selected');
          if (lastMove.includes(square)) cell.classList.add('is-last-move');
          if (!locked && square === step?.from) cell.classList.add('is-trainable');
          if (selectedSquare && square === step?.to) cell.classList.add('is-target');

          if (piece) {
            const pieceElement = document.createElement('img');
            pieceElement.className = `trial-chess-piece piece-${piece[0] === 'w' ? 'white' : 'black'}`;
            pieceElement.src = `assets/merida/${trialPieces[piece].asset}`;
            pieceElement.alt = '';
            pieceElement.width = 50;
            pieceElement.height = 50;
            pieceElement.draggable = false;
            pieceElement.decoding = 'async';
            cell.append(pieceElement);
            cell.draggable = !locked && square === step?.from;
          }
          if (file === 'a') {
            const rankLabel = document.createElement('span');
            rankLabel.className = 'trial-rank';
            rankLabel.textContent = String(rank);
            rankLabel.setAttribute('aria-hidden', 'true');
            cell.append(rankLabel);
          }
          if (rank === 1) {
            const fileLabel = document.createElement('span');
            fileLabel.className = 'trial-file';
            fileLabel.textContent = file;
            fileLabel.setAttribute('aria-hidden', 'true');
            cell.append(fileLabel);
          }
          squares.push(cell);
        });
      }
      board.replaceChildren(...squares);
      board.setAttribute('aria-busy', 'false');
      if (focusSquare) board.querySelector(`[data-square="${focusSquare}"]`)?.focus();
    };

    const renderStep = (focusBoard = false) => {
      const step = steps[currentStep];
      stepLabel.textContent = lang === 'en' ? `Step ${currentStep + 1} of 3` : `Étape ${currentStep + 1} sur 3`;
      line.textContent = step.line;
      question.textContent = step.question;
      feedback.textContent = lang === 'en'
        ? 'Tap a piece and its destination, or drag it.'
        : 'Touchez une pièce puis sa case d’arrivée, ou faites-la glisser.';
      feedback.classList.remove('is-success');
      selectedSquare = null;
      locked = false;
      renderBoard(focusBoard ? step.from : null);
    };

    const rejectMove = () => {
      locked = true;
      board.classList.remove('is-wrong');
      window.requestAnimationFrame(() => board.classList.add('is-wrong'));
      feedback.textContent = lang === 'en'
        ? 'That move is not in the saved line — try again.'
        : 'Ce coup n’est pas dans la variante enregistrée — réessayez.';
      acquisitionEvent('trial_move', { step: currentStep + 1, correct: false });
      selectedSquare = null;
      window.setTimeout(() => {
        locked = false;
        board.classList.remove('is-wrong');
        renderBoard(steps[currentStep]?.from);
      }, 300);
    };

    const attemptMove = (from, to) => {
      if (locked) return;
      const step = steps[currentStep];
      if (from !== step.from || to !== step.to) return rejectMove();

      locked = true;
      selectedSquare = null;
      movePiece(step.from, step.to, step.castle);
      lastMove = [step.from, step.to];
      renderBoard();
      score.textContent = String(currentStep + 1);
      progress.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
      feedback.textContent = lang === 'en' ? 'Correct. Your opponent replies…' : 'Exact. Votre adversaire répond…';
      feedback.classList.add('is-success');
      acquisitionEvent('trial_move', { step: currentStep + 1, correct: true });

      window.setTimeout(() => {
        if (step.reply) {
          movePiece(step.reply[0], step.reply[1]);
          lastMove = step.reply;
        }
        currentStep += 1;
        if (currentStep < steps.length) {
          renderStep(true);
          return;
        }
        question.hidden = true;
        feedback.textContent = lang === 'en' ? '3 out of 3 — well played.' : '3 sur 3 — bien joué.';
        complete.hidden = false;
        lastMove = [step.from, step.to];
        renderBoard();
        complete.querySelector('a')?.focus();
        acquisitionEvent('trial_complete', { landing: window.location.pathname });
      }, 700);
    };

    board.addEventListener('click', (event) => {
      const cell = event.target.closest('[data-square]');
      if (!cell || locked) return;
      const square = cell.dataset.square;
      const step = steps[currentStep];
      if (!selectedSquare) {
        if (square !== step.from) return rejectMove();
        selectedSquare = square;
        feedback.textContent = lang === 'en' ? 'Now choose the destination square.' : 'Choisissez maintenant la case d’arrivée.';
        renderBoard(step.to);
        return;
      }
      if (square === selectedSquare) {
        selectedSquare = null;
        renderBoard(step.from);
        return;
      }
      attemptMove(selectedSquare, square);
    });

    board.addEventListener('dragstart', (event) => {
      const cell = event.target.closest('[data-square]');
      if (!cell || locked || cell.dataset.square !== steps[currentStep].from) {
        event.preventDefault();
        return;
      }
      selectedSquare = cell.dataset.square;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', selectedSquare);
      cell.classList.add('is-selected');
    });
    board.addEventListener('dragover', (event) => {
      if (selectedSquare && !locked) event.preventDefault();
    });
    board.addEventListener('drop', (event) => {
      const cell = event.target.closest('[data-square]');
      if (!cell || !selectedSquare || locked) return;
      event.preventDefault();
      attemptMove(selectedSquare, cell.dataset.square);
    });
    board.addEventListener('dragend', () => {
      if (locked) return;
      selectedSquare = null;
      renderBoard(steps[currentStep]?.from);
    });

    renderStep(false);
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  if (hero && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(([entry]) => {
      hero.classList.toggle('is-paused', !entry.isIntersecting);
    }, { threshold: 0 });
    heroObserver.observe(hero);
  } else if (hero && reducedMotion) {
    hero.classList.add('is-paused');
  }

  const reveals = [...document.querySelectorAll('.reveal')];
  document.querySelectorAll('.features-grid, .guide-grid').forEach((grid) => {
    [...grid.children].forEach((element, index) => {
      element.style.setProperty('--reveal-delay', `${Math.min(index * 65, 195)}ms`);
    });
  });

  if ('IntersectionObserver' in window && !reducedMotion) {
    reveals.forEach((element) => element.classList.add('will-reveal'));
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .1, rootMargin: '0px 0px -28px' });
    reveals.forEach((element) => observer.observe(element));
    window.setTimeout(() => reveals.forEach((element) => element.classList.add('visible')), 6000);
  } else {
    reveals.forEach((element) => element.classList.add('visible'));
  }
})();
