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
  var COLLECTIVE = { full:'Full image', split:'Split', off:'As built (broken)' };
  var HERO = { off:'Current', full:'Full bleed', scrim:'Full bleed + scrim' };

  var P = {};
  try { new URLSearchParams(location.search).forEach(function (v, k) { P[k] = v; }); } catch (e) {}

  var font = FONTS[P.font] ? P.font : 'current';
  var DEFAULT_COLLECTIVE = 'full';   // what a normal visitor gets
  var coll = COLLECTIVE[P.collective] ? P.collective : DEFAULT_COLLECTIVE;
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
  // PROVEN on the live page: the section is mix-blend-mode:screen, and a
  // child cannot opt out of an ancestor's blend group. A probe placed inside
  // the section rendered washed out; the same probe in a layer outside it
  // rendered solid black. So any copy that must stay crisp has to live in a
  // layer OUTSIDE the section. That is what every option below does: a
  // backing layer behind for the picture, a front layer above for the words.
  function applyCollective() {
    if (coll === 'off') return;
    var sec = document.getElementById('Collective');
    if (!sec) return;
    var eyebrow = sec.querySelector('.title-section');
    var head = sec.querySelector('[class*="cut-out-h3"]');
    var lede = sec.querySelector('[class*="about-b2"]') || sec.querySelector('[class*="body-text"]');
    var img  = sec.querySelector('img[class*="about-tilt"]') || sec.querySelector('img');
    var host = sec.parentElement;
    if (!host || !head || !lede) return;
    var src = img ? (img.currentSrc || img.getAttribute('src') || '') : '';
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

    var back = document.createElement('div');
    back.className = 'sn-cback';
    back.innerHTML = (src ? '<img class="sn-cimg" src="' + src + '" aria-hidden="true">' : '') +
                     '<div class="sn-cveil"></div>';

    var front = document.createElement('div');
    front.className = 'sn-cfront';
    front.innerHTML =
      '<div class="sn-cinner">' +
        '<p class="sn-ceyebrow">' + (eyebrow ? eyebrow.textContent : 'The Collective') + '</p>' +
        '<h2 class="sn-chead">' + head.textContent + '</h2>' +
        '<p class="sn-clede">' + lede.textContent + '</p>' +
      '</div>';

    host.insertBefore(back, host.firstChild);
    host.appendChild(front);

    function place() {
      var t = Math.round(sec.offsetTop), h = Math.round(sec.offsetHeight);
      back.style.top = t + 'px';  back.style.height = h + 'px';
      front.style.top = t + 'px'; front.style.height = h + 'px';
    }
    place();
    addEventListener('resize', place);
    if (window.ResizeObserver) { try { new ResizeObserver(place).observe(sec); } catch (e) {} }
    setTimeout(place, 1200);

    var css =
      // the section itself stops drawing; it only reserves the space now
      '#Collective{mix-blend-mode:normal !important;background:transparent !important}' +
      '#Collective [class*="overlay"]{background:transparent !important;mix-blend-mode:normal !important;visibility:hidden}' +
      '#Collective [class*="about-bottom"]{background:transparent !important}' +
      '#Collective [class*="about-image-tilt"]{display:none !important}' +

      '.sn-cback{position:absolute;left:0;width:100%;z-index:1;pointer-events:none;overflow:hidden;background:#0A0A0A}' +
      '.sn-cimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block}' +
      '.sn-cveil{position:absolute;inset:0}' +
      '.sn-cfront{position:absolute;left:0;width:100%;z-index:5;pointer-events:none;' +
      'display:flex;align-items:center}' +
      '.sn-cinner{width:100%;padding:0 100px;box-sizing:border-box}' +
      '.sn-ceyebrow{font:600 11px/1 "DM Sans",Arial,sans-serif;letter-spacing:.22em;' +
      'text-transform:uppercase;color:#FF2A18;margin:0 0 14px}' +
      '.sn-chead{font-family:Agdasima,"Arial Narrow",sans-serif;font-weight:700;' +
      'text-transform:uppercase;font-size:clamp(44px,7vw,120px);line-height:.95;margin:0}' +
      '.sn-clede{font-family:"DM Sans",Arial,sans-serif;font-size:clamp(16px,1.35vw,20px);' +
      'line-height:1.55;margin:clamp(16px,1.6vw,28px) 0 0;max-width:46ch}' +
      '@media(max-width:767px){.sn-cinner{padding:0 24px}.sn-clede{max-width:none}}';

    if (coll === 'full') {
      css +=
        '.sn-cveil{background:linear-gradient(to top,rgba(10,10,10,.92),rgba(10,10,10,.5) 60%,rgba(10,10,10,.35))}' +
        '.sn-chead{color:#fff}.sn-clede{color:rgba(255,255,255,.9)}';
    } else if (coll === 'split') {
      css +=
        '.sn-cimg{left:auto;right:0;width:54%}' +
        '.sn-cveil{background:linear-gradient(to right,#0A0A0A 42%,rgba(10,10,10,.8) 52%,rgba(10,10,10,0) 70%)}' +
        '.sn-chead{color:#fff}.sn-clede{color:rgba(255,255,255,.9);max-width:32ch}' +
        '@media(max-width:900px){.sn-cimg{width:100%}' +
        '.sn-cveil{background:linear-gradient(to top,rgba(10,10,10,.93),rgba(10,10,10,.6))}' +
        '.sn-clede{max-width:none}}';
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
    applyCollective();               // runs for every visitor, not just ?opts=1
    if (showRail) buildRail();
  });
})();
