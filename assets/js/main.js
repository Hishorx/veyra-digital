/* Veyra Digital — site interactions. No dependencies. */
(function () {
  'use strict';

  var doc = document.documentElement;
  var CONTACT_EMAIL = 'hishor0526l@gmail.com';
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = window.matchMedia('(hover: hover) and (pointer: fine)');
  var reduced = mqReduce.matches;
  if (reduced) doc.classList.add('reduced');

  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // Remove the intro class once the opening sequence has played,
  // so later layout changes never re-trigger it.
  setTimeout(function () { doc.classList.remove('intro'); }, 2200);

  /* ---------- Current year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------- Broken image fallback ---------- */
  $$('.shot img').forEach(function (img) {
    function fail() { img.style.visibility = 'hidden'; img.parentNode.classList.add('is-error'); }
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) fail();
    img.addEventListener('error', fail);
  });

  /* ---------- Sticky header state ---------- */
  var header = $('.site-header');
  function onHeader() { if (header) header.classList.toggle('is-scrolled', window.scrollY > 8); }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('.menu-btn');
  var menu = $('#mobile-menu');
  var lastFocus = null;
  function setInert(on) {
    $$('main, .site-footer, .skip-link').forEach(function (el) {
      if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  }
  function openMenu() {
    lastFocus = document.activeElement;
    menu.hidden = false;
    // next frame so the opacity transition runs
    requestAnimationFrame(function () { menu.classList.add('is-open'); });
    menuBtn.setAttribute('aria-expanded', 'true');
    menuBtn.querySelector('.menu-label').textContent = 'Close';
    document.body.classList.add('menu-open');
    setInert(true);
    var first = menu.querySelector('a');
    if (first) setTimeout(function () { first.focus(); }, 60);
  }
  function closeMenu(restoreFocus) {
    menu.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.querySelector('.menu-label').textContent = 'Menu';
    document.body.classList.remove('menu-open');
    setInert(false);
    setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 360);
    if (restoreFocus !== false && lastFocus) lastFocus.focus();
  }
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      if (menuBtn.getAttribute('aria-expanded') === 'true') closeMenu(); else openMenu();
    });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a) closeMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (menuBtn.getAttribute('aria-expanded') !== 'true') return;
      if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
      if (e.key === 'Tab') {
        // keep focus inside the menu and its toggle
        var items = [menuBtn].concat($$('a, button', menu));
        var i = items.indexOf(document.activeElement);
        if (e.shiftKey && (i <= 0)) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    window.matchMedia('(min-width: 900px)').addEventListener('change', function (m) {
      if (m.matches && menuBtn.getAttribute('aria-expanded') === 'true') closeMenu(false);
    });
  }

  /* ---------- Active section in navigation ---------- */
  var navLinks = $$('.nav-links a[href^="#"]');
  if ('IntersectionObserver' in window && navLinks.length) {
    var map = {};
    navLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var a = map[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          navLinks.forEach(function (l) { l.removeAttribute('aria-current'); });
          a.setAttribute('aria-current', 'true');
        } else if (a.getAttribute('aria-current')) {
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) navObs.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var rObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); rObs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { rObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Magnetic controls (fine pointers only) ---------- */
  if (mqFine.matches && !reduced) {
    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - (r.left + r.width / 2)) / r.width;
        var y = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.setProperty('--mx', (x * 10).toFixed(2) + 'px');
        el.style.setProperty('--my', (y * 8).toFixed(2) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--mx', '0px'); el.style.setProperty('--my', '0px');
      });
    });
  }

  /* ---------- WebGL capability ---------- */
  function canRunSculpture() {
    var q = /[?&]sculpture=(force|off)\b/.exec(location.search);   // testing override
    if (q) return q[1] === 'force' && !!window.VeyraSculpture;
    if (reduced) return false;
    if (!window.VeyraSculpture) return false;
    if (window.innerWidth < 900) return false;                       // phones & small tablets: static render
    if (window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 1200) return false;
    if (navigator.deviceMemory && navigator.deviceMemory < 4) return false;
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) return false;
    if (navigator.connection && navigator.connection.saveData) return false;
    return true;
  }
  var useGL = canRunSculpture();

  /* ---------- Hero sculpture ---------- */
  var heroStage = $('#hero-stage');
  var heroCanvas = $('#hero-canvas');
  var hero = null;
  function heroFallback() { if (heroStage) { heroStage.classList.remove('is-live'); heroStage.classList.add('is-fallback'); } }
  if (heroStage && heroCanvas) {
    if (useGL) {
      hero = window.VeyraSculpture.create(heroCanvas, {
        mode: 'hero', maxDpr: 1.25,
        shift: function () { var a = heroCanvas.clientWidth / Math.max(1, heroCanvas.clientHeight); return [a * 0.2, 0.03]; },
        scale: function () { return window.innerHeight < 760 ? 0.86 : 0.98; },
        onLost: heroFallback
      });
    }
    if (hero) {
      heroStage.classList.add('is-live');
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (en) {
          if (en[0].isIntersecting && !document.hidden) hero.start(); else hero.stop();
        }).observe(heroStage);
      } else hero.start();
      window.addEventListener('pointermove', function (e) {
        hero.setPointer((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
      }, { passive: true });
    } else {
      heroFallback();
    }
  }

  /* ---------- Closing sculpture: resolves into the Veyra symbol ---------- */
  var cVisual = $('#contact-visual');
  var cCanvas = $('#contact-canvas');
  var closing = null, closingVisible = false;
  if (cVisual) {
    var cObs = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) {
      closingVisible = en[0].isIntersecting;
      if (closingVisible) {
        cVisual.classList.add('is-in');
        if (useGL && !closing && cCanvas) {
          closing = window.VeyraSculpture.create(cCanvas, { mode: 'resolve', emerge: false, maxDpr: 1, scale: function () { return 0.82; } });
          if (closing) { cVisual.classList.add('is-live'); onScroll(); }
          else cVisual.classList.add('is-fallback');
        }
        if (closing && !document.hidden) closing.start();
      } else if (closing) closing.stop();
    }, { rootMargin: '200px 0px' }) : null;
    if (!useGL) cVisual.classList.add('is-fallback');
    if (cObs) cObs.observe(cVisual); else cVisual.classList.add('is-in');
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (hero) hero.stop(); if (closing) closing.stop(); }
    else {
      if (hero && heroStage.getBoundingClientRect().bottom > 0) hero.start();
      if (closing && closingVisible) closing.start();
    }
  });

  /* ---------- Exhibit: pointer-responsive preview ---------- */
  var stage = $('#exhibit-stage');
  if (stage && mqFine.matches && !reduced) {
    var tgt = { rx: 0, ry: 0, px: 0, py: 0 };
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (-y * 4).toFixed(2) + 'deg');
      stage.style.setProperty('--px', (x * 18).toFixed(1) + 'px');
      stage.style.setProperty('--py', (y * 14).toFixed(1) + 'px');
    });
    stage.addEventListener('pointerleave', function () {
      ['--rx', '--ry'].forEach(function (k) { stage.style.setProperty(k, '0deg'); });
      ['--px', '--py'].forEach(function (k) { stage.style.setProperty(k, '0px'); });
    });
  }

  /* ---------- Scroll moments ---------- */
  var processList = $('#process-list');
  var stages = processList ? $$('.stage', processList) : [];
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      onHeader();
      var vh = window.innerHeight;
      if (processList && !reduced) {
        var r = processList.getBoundingClientRect();
        var p = clamp((vh * 0.78 - r.top) / (r.height + vh * 0.25), 0, 1);
        processList.style.setProperty('--p', p.toFixed(3));
        stages.forEach(function (s, i) { s.classList.toggle('is-active', p >= (i / stages.length) + 0.02); });
      }
      if (stage && !reduced) {
        var sr = stage.getBoundingClientRect();
        var sp = clamp((vh - sr.top) / (vh + sr.height), 0, 1);
        stage.style.setProperty('--sy', ((0.5 - sp) * 60).toFixed(1) + 'px');
      }
      if (closing && cVisual) {
        var cr = cVisual.getBoundingClientRect();
        closing.setProgress(clamp((vh - cr.top) / (vh * 0.95), 0, 1));
      }
    });
  }
  if (reduced) stages.forEach(function (s) { s.classList.add('is-active'); });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  onScroll();

  /* ---------- Testimonials (content/testimonials.js) ---------- */
  (function () {
    var section = $('#feedback');
    var list = $('#testimonial-list');
    if (!section || !list) return;
    var data = Array.isArray(window.VEYRA_TESTIMONIALS) ? window.VEYRA_TESTIMONIALS : [];
    var items = data.filter(function (t) {
      return t && t.approved === true && t.quote && t.name && t.business;
    });
    var preview = /[?&]preview=testimonials\b/.test(location.search);
    if (!items.length && preview) {
      items = [{ quote: '[Approved client quote appears here — preview layout only]', name: '[Client name]', business: '[Business]', role: '[Role, optional]' }];
      var note = document.createElement('p');
      note.className = 't-preview-note';
      note.textContent = 'Layout preview only. This section stays hidden until approved testimonials are added to content/testimonials.js.';
      list.parentNode.insertBefore(note, list);
    }
    if (!items.length) return;
    items.forEach(function (t) {
      var fig = document.createElement('figure');
      fig.className = 't-item';
      fig.style.margin = '0';
      var q = document.createElement('blockquote');
      q.textContent = t.quote;
      var cap = document.createElement('figcaption');
      if (t.image) {
        var img = document.createElement('img');
        img.src = t.image; img.alt = t.imageAlt || ('Photo of ' + t.name);
        img.width = 52; img.height = 52; img.loading = 'lazy';
        cap.appendChild(img);
      }
      var who = document.createElement('div');
      var b = document.createElement('b'); b.textContent = t.name;
      var s = document.createElement('span'); s.textContent = (t.role ? t.role + ', ' : '') + t.business;
      who.appendChild(b); who.appendChild(s); cap.appendChild(who);
      fig.appendChild(q); fig.appendChild(cap);
      list.appendChild(fig);
    });
    section.hidden = false;
  })();

  /* ---------- Enquiry form → pre-filled email draft ---------- */
  (function () {
    var form = $('#enquiry-form');
    if (!form) return;
    var status = $('#form-status');
    var summary = $('#form-summary');
    var desc = $('#f-desc');
    var count = $('#desc-count');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var lastMailto = '', lastText = '';

    function updateCount() { if (count && desc) count.textContent = '(' + desc.value.length + ' / 1500)'; }
    if (desc) { desc.addEventListener('input', updateCount); updateCount(); }

    var rules = [
      { el: $('#f-name'), ok: function (v) { return v.trim().length > 0; } },
      { el: $('#f-email'), ok: function (v) { return emailRe.test(v.trim()); } },
      { el: $('#f-type'), ok: function (v) { return v !== ''; } },
      { el: desc, ok: function (v) { return v.trim().length >= 20; } }
    ];
    function check(rule) {
      var field = rule.el.closest('.field');
      var valid = rule.ok(rule.el.value);
      field.classList.toggle('is-invalid', !valid);
      if (valid) rule.el.removeAttribute('aria-invalid'); else rule.el.setAttribute('aria-invalid', 'true');
      return valid;
    }
    rules.forEach(function (rule) {
      rule.el.addEventListener('blur', function () { if (rule.el.value !== '' || rule.el.closest('.field').classList.contains('is-invalid')) check(rule); });
      rule.el.addEventListener('input', function () { if (rule.el.closest('.field').classList.contains('is-invalid')) check(rule); });
      rule.el.addEventListener('change', function () { if (rule.el.closest('.field').classList.contains('is-invalid')) check(rule); });
    });

    function copyText(text) {
      if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
      return new Promise(function (resolve, reject) {
        var ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy') ? resolve() : reject(); } catch (e) { reject(e); }
        document.body.removeChild(ta);
      });
    }

    function showStatus() {
      status.className = 'form-status is-shown';
      status.innerHTML = '';
      var p1 = document.createElement('p');
      p1.innerHTML = '<strong>Your email draft is ready.</strong> Your email app should have opened with the enquiry filled in. <strong>Nothing has been sent yet</strong> — please review it and press Send in your email app.';
      var p2 = document.createElement('p');
      p2.style.color = 'var(--muted)';
      p2.innerHTML = 'If no email app opened, copy the enquiry and send it to <a class="link" href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>.';
      var actions = document.createElement('div');
      actions.className = 'status-actions';
      var again = document.createElement('a');
      again.className = 'btn btn--ghost btn--sm'; again.href = lastMailto; again.textContent = 'Open email draft again';
      var copy = document.createElement('button');
      copy.type = 'button'; copy.className = 'btn btn--ghost btn--sm'; copy.textContent = 'Copy enquiry text';
      copy.addEventListener('click', function () {
        copyText(lastText).then(function () { copy.textContent = 'Copied to clipboard'; },
          function () { copy.textContent = 'Copy failed — please select the text manually'; });
      });
      actions.appendChild(again); actions.appendChild(copy);
      status.appendChild(p1); status.appendChild(p2); status.appendChild(actions);
      status.focus({ preventScroll: true });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var invalid = rules.filter(function (r) { return !check(r); });
      if (invalid.length) {
        summary.className = 'form-summary is-shown';
        summary.innerHTML = '';
        var p = document.createElement('p');
        p.textContent = invalid.length === 1 ? 'Please fix 1 field before continuing:' : 'Please fix ' + invalid.length + ' fields before continuing:';
        var ul = document.createElement('ul');
        ul.style.cssText = 'margin-top:6px;padding-left:18px;list-style:disc';
        invalid.forEach(function (r) {
          var li = document.createElement('li');
          var a = document.createElement('a');
          a.href = '#' + r.el.id;
          a.textContent = r.el.closest('.field').querySelector('.err').textContent;
          a.addEventListener('click', function (ev) { ev.preventDefault(); r.el.focus(); });
          li.appendChild(a); ul.appendChild(li);
        });
        summary.appendChild(p); summary.appendChild(ul);
        status.className = 'form-status';
        summary.focus();
        return;
      }
      summary.className = 'form-summary';

      var v = function (id) { return ($(id).value || '').trim(); };
      var name = v('#f-name'), email = v('#f-email'), business = v('#f-business'),
          type = v('#f-type'), budget = v('#f-budget'), description = v('#f-desc');
      var subject = 'Project enquiry: ' + type + ' — ' + (business || name);
      lastText = [
        'Hello Hishor,',
        '',
        description,
        '',
        '— Project details —',
        'Name: ' + name,
        'Email: ' + email,
        'Business: ' + (business || 'Not provided'),
        'Project type: ' + type,
        'Approximate budget: ' + (budget || 'Not provided'),
        '',
        '(Drafted with the enquiry form on the Veyra Digital website)'
      ].join('\n');
      lastMailto = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(lastText);
      showStatus();
      window.location.href = lastMailto;
    });
  })();
})();
