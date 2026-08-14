// ── Chefaleh first-party page analytics ──
// Counts page views, unique tab-sessions, how long each page was actually
// looked at, how far down it was scrolled, and a handful of discrete
// actions (added to cart, opened the cart, which delivery zone got
// detected, which buttons got clicked, orders placed). No cookies, no
// third parties, no personal data — a random id is kept in sessionStorage
// and disappears the moment the tab is closed. Numbers show up in the
// admin panel's Analytics tab.
(function () {
  var ENDPOINT = '/api/track';
  var ENABLED = !navigator.webdriver
    && location.hostname !== 'localhost'
    && location.hostname !== '127.0.0.1';

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
    if (!ENABLED) return;
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
  // unconditionally: it's always a function, a no-op when tracking is off.
  window.chefalehTrack = function (type, label, value) {
    if (!ENABLED) return;
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

  if (!ENABLED) return;   // automated browser / local dev — stop before page-view tracking

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
})();
