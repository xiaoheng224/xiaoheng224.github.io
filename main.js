(function () {
  var root = document.documentElement;
  var toggle = document.getElementById('themeToggle');
  var KEY = 'tmc-theme';

  function apply(theme) {
    root.setAttribute('data-theme', theme);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#08131c' : '#eaf6ff');
  }

  var saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch (error) {
    saved = null;
  }
  var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  apply(saved || (prefersDark ? 'dark' : 'light'));

  if (toggle) {
    toggle.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try {
        localStorage.setItem(KEY, next);
      } catch (error) {
        /* 隐私模式下忽略 */
      }
    });
  }

  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 8);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------------------------------------------------------------
     彩蛋 1：连点头像 5 次（3 秒内）→ /secret/
     --------------------------------------------------------------- */
  var AVATAR_CLICKS = 5;
  var AVATAR_WINDOW = 3000;
  var avatarHits = 0;
  var lastHit = 0;

  document.addEventListener(
    'click',
    function (event) {
      var node = event.target;
      if (!(node && node.closest && node.closest('.hero-avatar, .brand img'))) return;
      var now = Date.now();
      if (now - lastHit > AVATAR_WINDOW) avatarHits = 0;
      lastHit = now;
      avatarHits += 1;
      if (avatarHits >= AVATAR_CLICKS) {
        avatarHits = 0;
        window.location.href = 'secret/';
      }
    },
    true,
  );

  /* ---------------------------------------------------------------
     彩蛋 2：Konami 代码 → 隐藏主题「星夜」
     --------------------------------------------------------------- */
  var KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  var progress = 0;
  var night = false;
  var previousTheme = null;
  var canvas = null;
  var raf = 0;

  function toast(message) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.classList.add('show');
    });
    setTimeout(function () {
      el.classList.remove('show');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 400);
    }, 2600);
  }

  function startNight() {
    previousTheme = root.getAttribute('data-theme');
    root.setAttribute('data-night', 'on');
    apply('dark');
    toast('隐藏主题 · 星夜 —— 再按一次 ↑↑↓↓←→←→BA 退出');
    buildSky();
  }

  function stopNight() {
    root.removeAttribute('data-night');
    apply(previousTheme || 'light');
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    cancelAnimationFrame(raf);
  }

  function buildSky() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'nightSky';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var stars = [];

    function resize() {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      var count = Math.round((window.innerWidth * window.innerHeight) / 9000);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: (Math.random() * 1.3 + 0.35) * dpr,
          a: Math.random() * 0.6 + 0.25,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.006,
          drift: (Math.random() - 0.5) * 0.06 * dpr,
        });
      }
    }

    resize();
    window.addEventListener('resize', resize);

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function draw(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < stars.length; i++) {
        var star = stars[i];
        var twinkle = reduce ? star.a : star.a * (0.65 + 0.35 * Math.sin(star.phase + time * star.speed));
        ctx.beginPath();
        ctx.fillStyle = 'rgba(198, 226, 255, ' + twinkle.toFixed(3) + ')';
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
        if (!reduce) {
          star.y += star.drift * 0.6;
          if (star.y < -4) star.y = canvas.height + 4;
          if (star.y > canvas.height + 4) star.y = -4;
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    }

    draw(0);
  }

  document.addEventListener('keydown', function (event) {
    var tag = (event.target && event.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    var key = (event.key || '').toLowerCase();
    if (key === KONAMI[progress]) {
      progress += 1;
      if (progress === KONAMI.length) {
        progress = 0;
        night = !night;
        if (night) startNight();
        else stopNight();
      }
    } else {
      progress = key === KONAMI[0] ? 1 : 0;
    }
  });

  /* ---------------------------------------------------------------
     滚动淡入
     --------------------------------------------------------------- */
  var items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    for (var i = 0; i < items.length; i++) items[i].classList.add('in');
    return;
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );

  for (var j = 0; j < items.length; j++) observer.observe(items[j]);
})();
