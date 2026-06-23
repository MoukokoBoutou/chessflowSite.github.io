(() => {
  const storageKey = 'chessflow-language';
  const supported = ['fr', 'en'];
  const currentLanguage = document.documentElement.lang && document.documentElement.lang.slice(0, 2);

  function storedLanguage() {
    try {
      const saved = localStorage.getItem(storageKey);
      return supported.includes(saved) ? saved : null;
    } catch (_) {
      return null;
    }
  }

  function browserLanguage() {
    const languages = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language];
    const first = (languages[0] || '').toLowerCase();
    return first.startsWith('en') ? 'en' : 'fr';
  }

  function alternateUrl(language) {
    const link = document.querySelector(`link[rel="alternate"][hreflang="${language}"]`);
    if (!link) return null;

    const script = document.currentScript;
    const preservePathTail = script && script.dataset.preservePathTail === 'true';
    if (!preservePathTail) return new URL(link.href, window.location.href);

    const currentLink = document.querySelector(`link[rel="alternate"][hreflang="${currentLanguage}"]`);
    if (!currentLink) return new URL(link.href, window.location.href);

    const currentBase = new URL(currentLink.href, window.location.href).pathname;
    const target = new URL(link.href, window.location.href);
    const pathname = window.location.pathname;
    const tail = pathname.startsWith(currentBase) ? pathname.slice(currentBase.length) : '';
    target.pathname = `${target.pathname.replace(/\/?$/, '/')}${tail}`;
    return target;
  }

  function persistLanguage(language) {
    if (!supported.includes(language)) return;
    try {
      localStorage.setItem(storageKey, language);
    } catch (_) {
      /* Storage can be disabled. */
    }
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('.language-switcher a[lang], .language-switcher a[hreflang]');
    if (!link) return;
    persistLanguage((link.lang || link.hreflang || '').slice(0, 2));
  }, true);

  if (!supported.includes(currentLanguage)) return;

  const preferred = storedLanguage() || browserLanguage();
  if (preferred === currentLanguage) return;

  const target = alternateUrl(preferred);
  if (!target) return;

  target.search = window.location.search;
  target.hash = window.location.hash;

  if (target.href !== window.location.href) {
    window.__chessflowLanguageRedirecting = true;
    window.location.replace(target.href);
  }
})();
