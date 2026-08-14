// ── Chefaleh first-party page analytics ──
// Counts page views, unique tab-sessions, how long each page was actually
// looked at, how far down it was scrolled, and a handful of discrete
// actions (added to cart, opened the cart, which delivery zone got
// detected, which buttons got clicked, orders placed). No cookies, no
// third parties, no personal data — a random id is kept in sessionStorage
// and disappears the moment the tab is closed. Numbers show up in the
// admin panel's Analytics tab.
//
// Nothing is sent until the visitor actively accepts the banner this file
// injects on first visit (a localStorage flag remembers the choice so it's
// only asked once per browser). Declining, or never answering, means
// tracking simply never starts.
(function () {
  var ENDPOINT = '/api/track';
  var CONSENT_KEY = 'chefaleh_consent'; // 'granted' | 'denied'
  var isBot = !!navigator.webdriver
    || location.hostname === 'localhost'
    || location.hostname === '127.0.0.1';

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* ignore */ }
  }

  var tracking = !isBot && getConsent() === 'granted';

  // /index.html → "/", /menu.html → "/menu", /menu/ → "/menu"
  function currentPath() {
    var p = location.pathname.replace(/\/index\.html$/i, '/').replace(/\.html$/i, '');
    if (p.length > 1) p = p.replace(/\/+$/, '');
    return p || '/';
  }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function sessionId() {
    try {
      var id = sessionStorage.getItem('chefaleh_sid');
      if (!id) { id = uuid(); sessionStorage.setItem('chefaleh_sid', id); }
      return id;
    } catch (e) {
      return uuid(); // private mode with storage disabled — still counts as a visit
    }
  }

  function send(payload, keepalive) {
    if (!tracking) return;
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: !!keepalive,
      }).catch(function () {});
    } catch (e) { /* tracking must never break the page */ }
  }

  // Exposed globally so cart.js / checkout.html can log a discrete action —
  // e.g. window.chefalehTrack('add_to_cart', 'Challah', 12.5). Safe to call
  // unconditionally: it's always a function, a no-op until consent is granted.
  window.chefalehTrack = function (type, label, value) {
    if (!tracking) return;
    try {
      // keepalive: true — a click that fires this often navigates away
      // (a CTA link, an order placed then redirected) right after; without
      // it the browser can cancel the request mid-flight.
      send({
        type: 'event',
        session_id: sessionId(),
        path: currentPath(),
        event_type: String(type || '').slice(0, 40),
        label: label != null ? String(label).slice(0, 200) : null,
        value: (typeof value === 'number' && isFinite(value)) ? value : null,
      }, true);
    } catch (e) { /* tracking must never break the page */ }
  };

  // Click tracking for any element marked up with data-track="some_label" —
  // hero buttons, the sticky order bar, menu CTAs, etc.
  document.addEventListener('click', function (ev) {
    var el = ev.target && ev.target.closest ? ev.target.closest('[data-track]') : null;
    if (el) window.chefalehTrack('cta_click', el.getAttribute('data-track'));
  }, true);

  function deviceType() {
    var w = window.innerWidth || screen.width || 0;
    if (w > 0 && w < 640) return 'mobile';
    if (w >= 640 && w < 1024) return 'tablet';
    return 'desktop';
  }

  function externalReferrer() {
    var r = document.referrer || '';
    if (!r) return null;
    try { if (new URL(r).hostname === location.hostname) return null; } catch (e) { return null; }
    return r.slice(0, 300);
  }

  // Starts the actual page-view + time-on-page + scroll-depth measurement
  // for the CURRENT page. Called immediately if consent was already granted
  // on an earlier visit, or the moment the banner is accepted.
  function startTracking() {
    if (!tracking) return;

    var viewId = uuid();
    var params = new URLSearchParams(location.search);

    send({
      type: 'view',
      id: viewId,
      session_id: sessionId(),
      path: currentPath(),
      title: (document.title || '').slice(0, 120),
      referrer: externalReferrer(),
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      device: deviceType(),
    });

    // ── Time actually spent on the page (paused while the tab is in the background) ──
    var activeMs = 0;
    var since = document.visibilityState === 'visible' ? Date.now() : 0;
    var maxScroll = 0;
    var lastSent = -1;

    function measureScroll() {
      var doc = document.documentElement;
      var reach = window.scrollY + window.innerHeight;
      var height = Math.max(doc.scrollHeight, document.body ? document.body.scrollHeight : 0);
      var pct = height > 0 ? Math.round((reach / height) * 100) : 100;
      if (pct > maxScroll) maxScroll = Math.min(100, Math.max(0, pct));
    }

    function elapsedSeconds() {
      var total = activeMs + (since ? Date.now() - since : 0);
      return Math.min(3600, Math.round(total / 1000));
    }

    function flush() {
      measureScroll();
      var seconds = elapsedSeconds();
      if (seconds === lastSent) return;      // nothing new to report
      lastSent = seconds;
      send({ type: 'end', id: viewId, duration_seconds: seconds, max_scroll: maxScroll }, true);
    }

    window.addEventListener('scroll', measureScroll, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') {
        if (since) { activeMs += Date.now() - since; since = 0; }
        flush();
      } else if (!since) {
        since = Date.now();
      }
    });

    window.addEventListener('pagehide', flush);
  }

  // ── Consent banner ──
  // Same element id ("cookie") the site always used, so cart.js's sticky
  // order bar — which already knows to duck out of this banner's way —
  // keeps working without any changes there.
  function injectConsentBanner() {
    if (document.getElementById('cookie') || !document.body) return;

    var el = document.createElement('div');
    el.id = 'cookie';
    el.className = 'fixed bottom-0 left-0 right-0 z-50 bg-charcoal text-cream px-6 py-4 flex flex-wrap items-center justify-between gap-4 translate-y-full transition-transform duration-500';
    el.innerHTML =
      '<p class="text-xs font-light opacity-70 tracking-wide max-w-xl">' +
        'We use privacy-friendly analytics to see how visitors use the site — no cookies, no ad networks, nothing sold. ' +
        '<a href="/cookie-policy" class="underline hover:text-gold transition-colors">Learn more</a>' +
      '</p>' +
      '<div class="flex items-center gap-2 shrink-0">' +
        '<button type="button" id="consent-decline" class="text-xs tracking-[.12em] uppercase text-cream/50 hover:text-cream px-3 py-2 transition-colors">No thanks</button>' +
        '<button type="button" id="consent-accept" class="text-xs tracking-[.12em] uppercase border border-gold text-gold px-6 py-2 hover:bg-gold hover:text-charcoal transition-all">Accept</button>' +
      '</div>';
    document.body.appendChild(el);

    setTimeout(function () { el.classList.remove('translate-y-full'); }, 1200);

    document.getElementById('consent-accept').addEventListener('click', function () {
      setConsent('granted');
      el.remove();
      tracking = !isBot;
      startTracking();
    });
    document.getElementById('consent-decline').addEventListener('click', function () {
      setConsent('denied');
      el.remove();
    });
  }

  if (isBot) return; // crawlers / automated browsers / local dev: no banner, no tracking, ever

  var consent = getConsent();
  if (consent === 'granted') {
    startTracking();
  } else if (consent !== 'denied') {
    injectConsentBanner();
  }
  // consent === 'denied': respect it silently — no banner, no tracking, no nagging.
})();
