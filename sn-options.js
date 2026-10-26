(function () {
  if (window.__snOpts) return;
  window.__snOpts = true;

  var FONTS = {
    current: { label: 'Agdasima',     stack: null },
    anton:   { label: 'Anton',        stack: "'Anton', 'Arial Narrow', sans-serif",        g: 'Anton' },
    bebas:   { label: 'Bebas Neue',   stack: "'Bebas Neue', 'Arial Narrow', sans-serif",   g: 'Bebas+Neue' },
    archivo: { label: 'Archivo Black',stack: "'Archivo Black', Arial, sans-serif",         g: 'Archivo+Black', scale: 0.75 },
    oswald:  { label: 'Oswald',       stack: "'Oswald', 'Arial Narrow', sans-serif",       g: 'Oswald:wght@400;600;700' }
  };
  var COLLECTIVE = { off:'As built', fix:'Fixed cut-out', full:'Full image', split:'Split' };
  var HERO = { off:'Current', full:'Full bleed', scrim:'Full bleed + scrim' };

  var P = {};
  try { new URLSearchParams(location.search).forEach(function (v, k) { P[k] = v; }); } catch (e) {}

  var font = FONTS[P.font] ? P.font : 'current';
  var coll = COLLECTIVE[P.collective] ? P.collective : 'off';
  var hero = HERO[P.hero] ? P.hero : 'off';
  var showRail = ('opts' in P) || ('font' in P) || ('collective' in P) || ('hero' in P);

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  /* ---------------- fonts ---------------- */
  function applyFont() {
    var f = FONTS[font];
    if (!f || !f.stack) return;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + f.g + '&display=swap';
    document.head.appendChild(l);

    var st = document.createElement('style');
    st.textContent = '.sn-fswap{font-family:' + f.stack + ' !important}';
    document.head.appendChild(st);

    function tag(root) {
      var all = (root || document).querySelectorAll('*');
      for (var i = 0; i < all.length; i++) {
        var e = all[i];
        if (e.classList.contains('sn-fswap')) continue;
        var ff = '';
        try { ff = getComputedStyle(e).fontFamily || ''; } catch (x) { continue; }
        if (ff.indexOf('Agdasima') > -1) e.classList.add('sn-fswap');
      }
      if (f.scale) rescale();
    }

    // Archivo Black is far wider than Agdasima, so at the same point size the
    // wordmark wraps and the subtitle runs off the page. Scale it down.
    // Sizes here are mostly vw-based, so clear the override, re-read the real
    // size, then reapply. Debounced, and redone on resize so it stays fluid.
    var rsTimer = null;
    function rescale() {
      var els = document.querySelectorAll('.sn-fswap');
      for (var i = 0; i < els.length; i++) els[i].style.fontSize = '';
      var sizes = [];
      for (var j = 0; j < els.length; j++) sizes.push(parseFloat(getComputedStyle(els[j]).fontSize) || 0);
      for (var k = 0; k < els.length; k++) {
        if (sizes[k]) els[k].style.fontSize = (sizes[k] * f.scale).toFixed(2) + 'px';
      }
    }
    if (f.scale) {
      addEventListener('resize', function () {
        clearTimeout(rsTimer);
        rsTimer = setTimeout(rescale, 150);
      });
    }

    tag();
    new MutationObserver(function (ms) {
      ms.forEach(function (m) {
        for (var i = 0; i < m.addedNodes.length; i++) {
          var n = m.addedNodes[i];
          if (n.nodeType === 1) { tag(n); if (n.parentElement) tag(n.parentElement); }
        }
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  /* ---------------- collective ---------------- */
  // The section is mix-blend-mode:screen over a white overlay, so dark text
  // punches a hole and reveals whatever is painted BEHIND the section.
  // Its own backing image (img.about-tilt-copy) currently measures 0x0, so
  // the hole was revealing a neighbouring section instead, which is why the
  // body copy looked sliced off partway across. Every option below supplies
  // its own backing layer so the hole always reveals something deliberate.
  function applyCollective() {
    if (coll === 'off') return;
    var sec = document.getElementById('Collective');
    if (!sec) return;
    var head = sec.querySelector('[class*="cut-out-h3"]');
    var lede = sec.querySelector('[class*="about-b2"]') || sec.querySelector('[class*="body-text"]');
    var img  = sec.querySelector('img[class*="about-tilt"]') || sec.querySelector('img');
    var host = sec.parentElement;
    if (!host) return;
    var src = img ? (img.currentSrc || img.getAttribute('src') || '') : '';
    if (!src) return;

    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    var back = document.createElement('div');
    back.className = 'sn-cback';
    back.innerHTML = '<img class="sn-cimg" src="' + src + '" aria-hidden="true">' +
                     '<div class="sn-cveil"></div>' +
                     '<div class="sn-cpanel"></div>';
    host.insertBefore(back, host.firstChild);
    var panel = back.querySelector('.sn-cpanel');

    function place() {
      back.style.top = Math.round(sec.offsetTop) + 'px';
      back.style.height = Math.round(sec.offsetHeight) + 'px';
      if (coll === 'fix' && lede) {
        // a flat dark plate behind the body copy only, so the knock-out there
        // resolves to clean dark text instead of a slice of another section
        var sr = sec.getBoundingClientRect(), lr = lede.getBoundingClientRect();
        panel.style.top = Math.round(lr.top - sr.top) - 24 + 'px';
        panel.style.height = Math.round(lr.height) + 48 + 'px';
        panel.style.left = '0px';
        panel.style.width = '100%';
      }
    }
    place();
    addEventListener('resize', place);
    if (window.ResizeObserver) { try { new ResizeObserver(place).observe(sec); } catch (e) {} }
    setTimeout(place, 1200);

    var css =
      '.sn-cback{position:absolute;left:0;width:100%;z-index:0;pointer-events:none;overflow:hidden}' +
      '.sn-cimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}' +
      '.sn-cveil{position:absolute;inset:0}' +
      '.sn-cpanel{position:absolute;display:none}' +
      '#Collective{z-index:3}';

    if (coll === 'fix') {
      // keep the knock-out headline, make the body copy solid and readable
      css +=
        '.sn-cveil{background:linear-gradient(to bottom,rgba(10,10,10,.25),rgba(10,10,10,.55))}' +
        '.sn-cpanel{display:block;background:#0A0A0A}' +
        '#Collective [class*="about-b2"],#Collective [class*="body-text"]' +
        '{color:#0A0A0A !important;max-width:46ch}';
    }

    if (coll === 'full' || coll === 'split') {
      // blend off, picture visible, copy set in white over a veil
      css +=
        '#Collective{mix-blend-mode:normal !important}' +
        '#Collective [class*="overlay"]{background:transparent !important;mix-blend-mode:normal !important}' +
        '#Collective [class*="about-bottom"]{background:transparent !important}' +
        '#Collective [class*="about-image-tilt"]{display:none !important}' +
        '#Collective [class*="cut-out-h3"]{color:#fff !important}' +
        '#Collective [class*="about-b2"],#Collective [class*="body-text"]' +
        '{color:rgba(255,255,255,.9) !important;max-width:46ch}' +
        '#Collective .title-section{color:#FF2A18 !important}' +
        // the copy sat in the top third of a 900px section, leaving dead space
        '#Collective [class*="overlay"]{display:flex;flex-direction:column;justify-content:center}';
      if (coll === 'full') {
        css += '.sn-cveil{background:linear-gradient(to top,rgba(10,10,10,.92),rgba(10,10,10,.55) 60%,rgba(10,10,10,.4))}';
      } else {
        // picture on the right, copy on a solid field to the left
        css +=
          '.sn-cimg{left:auto;right:0;width:52%}' +
          '.sn-cveil{background:linear-gradient(to right,#0A0A0A 44%,rgba(10,10,10,.75) 52%,rgba(10,10,10,0) 68%)}' +
          '#Collective [class*="about-b2"],#Collective [class*="body-text"]{max-width:34ch}' +
          '@media (max-width:767px){.sn-cimg{width:100%;right:0}' +
          '.sn-cveil{background:linear-gradient(to top,rgba(10,10,10,.92),rgba(10,10,10,.6))}}';
      }
    }

    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ---------------- hero ---------------- */
  function applyHero() {
    if (hero === 'off') return;
    var st = document.createElement('style');
    // IX2 writes width/height inline on .hero-image-block, and inline loses to
    // !important, so this is what actually takes the frame full bleed.
    var css =
      '.hero-image-block{width:100vw !important;height:100vh !important;' +
      'top:0 !important;left:0 !important;z-index:0 !important}' +
      '.hero-bg-video{width:100vw !important;height:100vh !important;' +
      'left:0 !important;object-fit:cover !important}' +
      // the frame normally sits at z-index 1 and the copy at 0, which is fine
      // while the frame is inset. Full bleed buries the copy, so flip them.
      '.hero{position:relative !important;z-index:2 !important}';
    if (hero === 'scrim') {
      css +=
        '.hero-section::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;' +
        'background:radial-gradient(120% 80% at 50% 45%,rgba(0,0,0,.55),rgba(0,0,0,.15) 60%,transparent)}' +
        '.hero-section .hero{position:relative;z-index:2}';
    }
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ---------------- the rail ---------------- */
  function link(k, v, label, active) {
    var q = { font: font, collective: coll, hero: hero, opts: '1' };
    q[k] = v;
    var s = Object.keys(q).map(function (x) { return x + '=' + encodeURIComponent(q[x]); }).join('&');
    var a = document.createElement('a');
    a.href = location.pathname + '?' + s;
    a.textContent = label;
    if (active) a.setAttribute('aria-current', 'true');
    return a;
  }

  function buildRail() {
    var st = document.createElement('style');
    st.textContent =
      '#sn-opts{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:2147483000;' +
      'display:flex;flex-direction:column;gap:6px;padding:10px 12px;max-width:calc(100vw - 24px);' +
      'background:rgba(12,12,12,.9);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,.14);' +
      'font:600 10px/1 "DM Sans",Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;' +
      'opacity:0;animation:snOptsIn .5s cubic-bezier(.22,.61,.36,1) .3s forwards}' +
      '@keyframes snOptsIn{from{opacity:0;transform:translate(-50%,14px)}to{opacity:1;transform:translate(-50%,0)}}' +
      '#sn-opts .r{display:flex;align-items:center;gap:6px;flex-wrap:wrap}' +
      '#sn-opts .k{color:#8E8C89;width:74px;flex:0 0 74px;letter-spacing:.18em}' +
      '#sn-opts a{color:#8E8C89;text-decoration:none;padding:7px 10px;white-space:nowrap;' +
      'border:1px solid transparent;transition:color .2s,border-color .2s,background .2s}' +
      '#sn-opts a:hover{color:#fff;border-color:rgba(255,255,255,.25)}' +
      '#sn-opts a[aria-current]{background:#FF2A18;color:#fff}' +
      '#sn-opts .x{position:absolute;top:-10px;right:-10px;width:22px;height:22px;border-radius:50%;' +
      'background:#FF2A18;color:#fff;display:grid;place-items:center;font-size:12px;cursor:pointer;border:0}' +
      '@media(max-width:700px){#sn-opts{font-size:9px}#sn-opts .k{width:100%;flex:0 0 100%}}';
    document.head.appendChild(st);

    var nav = document.createElement('nav');
    nav.id = 'sn-opts';
    nav.setAttribute('aria-label', 'Design options');

    function row(title, obj, cur, key) {
      var d = document.createElement('div');
      d.className = 'r';
      var k = document.createElement('span');
      k.className = 'k';
      k.textContent = title;
      d.appendChild(k);
      Object.keys(obj).forEach(function (v) {
        d.appendChild(link(key, v, obj[v].label || obj[v], String(cur) === String(v)));
      });
      nav.appendChild(d);
    }
    row('Font', FONTS, font, 'font');
    row('Collective', COLLECTIVE, coll, 'collective');
    row('Hero', HERO, hero, 'hero');

    var x = document.createElement('button');
    x.className = 'x';
    x.type = 'button';
    x.textContent = '×';
    x.title = 'Hide';
    x.onclick = function () { nav.remove(); };
    nav.appendChild(x);

    document.body.appendChild(nav);
    // land on the visible state even if the browser never ticks the animation
    setTimeout(function () {
      if (getComputedStyle(nav).opacity !== '1') {
        nav.style.animation = 'none';
        nav.style.opacity = '1';
        nav.style.transform = 'translateX(-50%)';
      }
    }, 1400);
  }

  applyHero();                       // before paint where possible
  ready(function () {
    applyFont();
    applyCollective();
    if (showRail) buildRail();
  });
})();
