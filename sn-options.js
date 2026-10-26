(function () {
  if (window.__snOpts) return;
  window.__snOpts = true;

  var FONTS = {
    current: { label: 'Agdasima',     stack: null },
    anton:   { label: 'Anton',        stack: "'Anton', 'Arial Narrow', sans-serif",        g: 'Anton' },
    bebas:   { label: 'Bebas Neue',   stack: "'Bebas Neue', 'Arial Narrow', sans-serif",   g: 'Bebas+Neue' },
    archivo: { label: 'Archivo Black',stack: "'Archivo Black', Arial, sans-serif",         g: 'Archivo+Black' },
    oswald:  { label: 'Oswald',       stack: "'Oswald', 'Arial Narrow', sans-serif",       g: 'Oswald:wght@400;600;700' }
  };
  var COLLECTIVE = { 0:'Current', 1:'Cut-out', 2:'Image behind', 3:'Image behind + reveal' };
  var HERO = { off:'Current', full:'Full bleed', scrim:'Full bleed + scrim' };

  var P = {};
  try { new URLSearchParams(location.search).forEach(function (v, k) { P[k] = v; }); } catch (e) {}

  var font = FONTS[P.font] ? P.font : 'current';
  var coll = (P.collective in COLLECTIVE) ? P.collective : '0';
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
  // How this section actually works: section.about-section-copy is
  // mix-blend-mode:screen over a white div.overlay, and the heading is near
  // black. Screen turns black transparent and keeps white white, so the dark
  // letters knock a hole in the white and reveal whatever sits BEHIND the
  // section. Two consequences drive everything below:
  //   1. text must stay dark, white text disappears into the overlay
  //   2. the image must live OUTSIDE the section, or it gets screened too
  function applyCollective() {
    if (coll === '0') return;
    var sec = document.getElementById('Collective');
    if (!sec) return;
    var head = sec.querySelector('.cut-out-h3') || sec.querySelector('h1,h2,h3,h4,h5,h6');
    var img = sec.querySelector('img');
    if (!head) return;

    var ink = getComputedStyle(head).color || '#0A0A0A';

    // the restructure Alex approved: short bold headline, body as a paragraph
    if (!sec.querySelector('.sn-lede2')) {
      var body = head.textContent.trim();
      head.textContent = 'Who we are:';
      var p = document.createElement('p');
      p.className = 'sn-lede2';
      p.textContent = body;
      head.parentElement.insertBefore(p, head.nextSibling);
    }

    var css =
      '#Collective .sn-lede2{font-family:"DM Sans",Arial,sans-serif;' +
      'font-size:clamp(16px,1.45vw,21px);line-height:1.5;color:' + ink + ';' +
      'max-width:52ch;margin:clamp(14px,1.6vw,26px) 0 0;font-weight:500}' +
      '#Collective .cut-out-h3{font-size:clamp(44px,7vw,120px);line-height:.95}';

    if (coll === '1' || coll === '2' || coll === '3') {
      var host = sec.parentElement;
      if (host && getComputedStyle(host).position === 'static') host.style.position = 'relative';
      if (img && host && !host.querySelector('.sn-bgimg')) {
        var clone = img.cloneNode(true);
        clone.className = 'sn-bgimg';
        clone.removeAttribute('style');
        img.style.visibility = 'hidden';
        host.insertBefore(clone, host.firstChild);

        // The section's nearest positioned ancestor is the whole landing page,
        // so 100%/100% would stretch the image down the entire document.
        // Measure the section and pin the image to exactly its box instead.
        var bleed = (coll === '3') ? 0.14 : 0;
        function place() {
          var h = sec.offsetHeight;
          clone.style.top = Math.round(sec.offsetTop - h * bleed) + 'px';
          clone.style.height = Math.round(h * (1 + bleed * 2)) + 'px';
        }
        var veil = null;
        if (coll === '2' || coll === '3') {
          veil = document.createElement('div');
          veil.className = 'sn-collveil';
          host.insertBefore(veil, clone.nextSibling);
        }
        var place0 = place;
        place = function () {
          place0();
          if (veil) {
            veil.style.top = Math.round(sec.offsetTop) + 'px';
            veil.style.height = Math.round(sec.offsetHeight) + 'px';
          }
        };
        place();
        addEventListener('resize', place);
        if (window.ResizeObserver) { try { new ResizeObserver(place).observe(sec); } catch (e) {} }
        setTimeout(place, 1200);          // after Webflow's own load animations settle

        if (coll === '3') {
          addEventListener('scroll', function () {
            var r = sec.getBoundingClientRect();
            var t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - innerHeight / 2) / innerHeight));
            clone.style.transform = 'translateY(' + (t * -7) + '%)';
          }, { passive: true });
        }
      }
      css +=
        '.sn-bgimg{position:absolute;left:0;width:100%;' +
        'object-fit:cover;z-index:0;pointer-events:none}' +
        '#Collective{z-index:3}';

      if (coll === '2' || coll === '3') {
        // Option 1 keeps the knock-out, where only the letters show picture.
        // Alex asked to actually see the image, so here the screen blend and
        // the white overlay come off and the copy flips to white over a veil.
        css +=
          '#Collective{mix-blend-mode:normal !important}' +
          '#Collective .overlay{background:transparent !important;' +
          'mix-blend-mode:normal !important}' +
          '#Collective .cut-out-h3,#Collective .sn-lede2{color:#fff !important}' +
          '#Collective .title-section{color:#FF2A18 !important}' +
          '.sn-collveil{position:absolute;left:0;width:100%;z-index:1;pointer-events:none;' +
          'background:linear-gradient(to right,rgba(10,10,10,.9),rgba(10,10,10,.6) 55%,rgba(10,10,10,.3))}';
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
