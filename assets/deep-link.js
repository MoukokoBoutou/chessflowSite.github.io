(() => {
  if (window.__chessflowLanguageRedirecting) return;

  const page = document.body;
  const kind = page.dataset.deepLinkKind;
  const language = page.dataset.deepLinkLanguage === 'en' ? 'en' : 'fr';
  const status = document.querySelector('[data-deep-link-status]');
  const button = document.querySelector('[data-deep-link-button]');
  const frenchLink = document.getElementById('language-fr-link');
  const englishLink = document.getElementById('language-en-link');
  if (!kind || !status || !button) return;

  const segments = window.location.pathname.split('/').filter(Boolean);
  const pathIdentifier = segments[0] === kind
    ? (segments[1] === 'en' ? segments[2] : segments[1])
    : null;
  const identifier = pathIdentifier || new URLSearchParams(window.location.search).get('id');
  const labels = language === 'en'
    ? {
        ready: `Open this ${kind} in ChessFlow. If needed, Google Play will open automatically.`,
        action: 'Open or install ChessFlow',
        loading: 'Looking for ChessFlow…',
        fallback: 'ChessFlow is not installed. Opening Google Play…',
        install: 'Install ChessFlow',
        incomplete: `This ${kind} link is incomplete.`,
      }
    : {
        ready: kind === 'opening'
          ? 'Ouvrez cette leçon dans ChessFlow. Si nécessaire, Google Play s’ouvrira automatiquement.'
          : 'Ouvrez ce puzzle dans ChessFlow. Si nécessaire, Google Play s’ouvrira automatiquement.',
        action: 'Ouvrir ou installer ChessFlow',
        loading: 'Recherche de ChessFlow…',
        fallback: 'ChessFlow n’est pas installé. Ouverture de Google Play…',
        install: 'Installer ChessFlow',
        incomplete: kind === 'opening' ? 'Ce lien d’ouverture est incomplet.' : 'Ce lien de puzzle est incomplet.',
      };

  const campaign = new URLSearchParams({
    utm_source: 'chessflow.fr',
    utm_medium: 'deep_link',
    utm_campaign: `${kind}_share`,
  });
  const storeUrl = new URL('https://play.google.com/store/apps/details');
  storeUrl.searchParams.set('id', 'com.rolf.ChessFlow');
  storeUrl.searchParams.set('referrer', campaign.toString());

  const setButtonLabel = (label) => {
    button.textContent = label;
    button.setAttribute('aria-label', label);
    button.title = label;
  };
  const setStoreMode = () => {
    button.href = storeUrl.toString();
    button.classList.remove('is-loading');
    button.dataset.mode = 'store';
    setButtonLabel(labels.install);
  };

  if (identifier && frenchLink && englishLink) {
    const encodedIdentifier = encodeURIComponent(identifier);
    frenchLink.href = `/${kind}/${encodedIdentifier}`;
    englishLink.href = `/${kind}/en/${encodedIdentifier}`;
  }

  if (!identifier) {
    status.textContent = labels.incomplete;
    setStoreMode();
    return;
  }

  const encodedIdentifier = encodeURIComponent(identifier);
  const appUrl = `chessopen://${kind}/${encodedIdentifier}`;
  const intentUrl = `intent://${kind}/${encodedIdentifier}#Intent;scheme=chessopen;package=com.rolf.ChessFlow;S.browser_fallback_url=${encodeURIComponent(storeUrl.toString())};end`;
  const isAndroid = /Android/i.test(navigator.userAgent);
  let pageHidden = false;
  let fallbackTimer = 0;

  const setReadyMode = () => {
    button.href = isAndroid ? intentUrl : appUrl;
    button.dataset.mode = 'app';
    button.classList.remove('is-loading');
    setButtonLabel(labels.action);
    status.textContent = labels.ready;
  };
  setReadyMode();

  document.addEventListener('visibilitychange', () => {
    pageHidden = document.hidden;
    if (pageHidden) {
      window.clearTimeout(fallbackTimer);
    } else {
      setReadyMode();
    }
  });
  window.addEventListener('pagehide', () => {
    pageHidden = true;
    window.clearTimeout(fallbackTimer);
  });
  window.addEventListener('pageshow', setReadyMode);

  button.addEventListener('click', (event) => {
    if (button.dataset.mode === 'store') return;

    pageHidden = false;
    status.textContent = labels.loading;
    setButtonLabel(labels.loading);
    button.classList.add('is-loading');
    fallbackTimer = window.setTimeout(() => {
      if (pageHidden) return;
      status.textContent = labels.fallback;
      setStoreMode();
      window.location.assign(storeUrl.toString());
    }, 1600);

    if (!isAndroid) {
      event.preventDefault();
      window.location.href = appUrl;
    }
  });
})();
