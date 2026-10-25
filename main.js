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
     彩蛋 1：连点头像 3 次 → 站内弹出隐藏终端
     --------------------------------------------------------------- */
  var AVATAR_CLICKS = 3;
  var AVATAR_WINDOW = 2200;
  var avatarHits = 0;
  var lastHit = 0;

  var TERMINAL_LINES = [
    '$ whoami',
    'terminal-MC —— 写点代码，也拍点东西。',
    '',
    '$ echo "你连点了 3 下头像。"',
    '你连点了 3 下头像。',
    '',
    '$ hint',
    '老玩家应该知道：↑ ↑ ↓ ↓ ← → ← → B A',
    '',
    '$ exit',
  ];

  document.addEventListener(
    'click',
    function (event) {
      var node = event.target;
      if (!(node && node.closest && node.closest('.hero-avatar, .brand img'))) return;

      var img = node.closest('img');
      if (img) {
        img.classList.remove('pop');
        void img.offsetWidth;
        img.classList.add('pop');
        setTimeout(function () {
          img.classList.remove('pop');
        }, 420);
      }

      var now = Date.now();
      if (now - lastHit > AVATAR_WINDOW) avatarHits = 0;
      lastHit = now;
      avatarHits += 1;
      if (avatarHits >= AVATAR_CLICKS) {
        avatarHits = 0;
        openTerminal();
      }
    },
    true,
  );

  function openTerminal() {
    if (document.getElementById('tmc-term')) return;

    var modal = document.createElement('div');
    modal.id = 'tmc-term';
    modal.className = 'terminal-modal';
    modal.innerHTML =
      '<div class="terminal-window" role="dialog" aria-modal="true" aria-label="隐藏终端">' +
      '<div class="terminal-bar"><span class="tdot"></span><span class="tdot"></span><span class="tdot"></span>' +
      '<em>terminal-MC@xiaoheng224: ~</em>' +
      '<button class="terminal-close" type="button" aria-label="关闭">×</button></div>' +
      '<pre class="terminal-body"></pre>' +
      '</div>';
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    var body = modal.querySelector('.terminal-body');
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timer = 0;
    var closed = false;

    function close() {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      modal.classList.remove('open');
      document.body.style.overflow = '';
      setTimeout(function () {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      }, 260);
      document.removeEventListener('keydown', onKey);
    }

    function onKey(event) {
      if (event.key === 'Escape') close();
    }

    modal.addEventListener('click', function (event) {
      if (event.target === modal || (event.target.closest && event.target.closest('.terminal-close'))) close();
    });
    document.addEventListener('keydown', onKey);

    requestAnimationFrame(function () {
      modal.classList.add('open');
    });

    var line = 0;
    function next() {
      if (closed || line >= TERMINAL_LINES.length) return;
      var text = TERMINAL_LINES[line++];
      if (reduce) {
        body.textContent += text + '\n';
        next();
        return;
      }
      var rendered = 0;
      (function type() {
        if (closed) return;
        rendered += 2;
        body.textContent = body.textContent.replace(/[^\n]*$/, text.slice(0, rendered));
        if (rendered < text.length) {
          timer = setTimeout(type, 12);
        } else {
          body.textContent = body.textContent.replace(/[^\n]*$/, text) + '\n';
          timer = setTimeout(next, 110);
        }
      })();
    }

    next();
    setTimeout(function () {
      if (!closed) body.parentNode.querySelector('.terminal-close').focus();
    }, 80);
  }

  /* ---------------------------------------------------------------
     彩蛋 2：Konami → 隐藏主题「星夜」（繁星 + 流星）
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
    }, 2800);
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
    cancelAnimationFrame(raf);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
  }

  function buildSky() {
    if (canvas) return;
    canvas = document.createElement('canvas');
    canvas.id = 'nightSky';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var width = 0;
    var height = 0;
    var stars = [];
    var meteors = [];
    var nextMeteorAt = 0;

    function createStars() {
      /* 密度：每 2600 平方像素一颗，1440×950 约 520 颗 */
      var count = Math.round((width * height) / 2600);
      stars = new Array(count);
      for (var i = 0; i < count; i++) {
        var roll = Math.random();
        var radius = roll < 0.72 ? Math.random() * 0.55 + 0.3 : roll < 0.94 ? Math.random() * 0.6 + 0.85 : Math.random() * 0.9 + 1.5;
        stars[i] = {
          x: Math.random() * width,
          y: Math.random() * height,
          r: radius * dpr,
          a: 0.25 + Math.random() * 0.7,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.02 + 0.005,
          drift: (Math.random() - 0.5) * 0.05 * dpr,
          hue: Math.random() < 0.18 ? '198, 226, 255' : '255, 255, 255',
          glow: radius > 1.4,
        };
      }
    }

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      createStars();
    }

    resize();
    window.addEventListener('resize', resize);

    function spawnMeteor() {
      var toRight = Math.random() < 0.5;
      var angle = (Math.random() * 12 + 24) * (Math.PI / 180);
      var speed = (Math.random() * 420 + 620) * dpr;
      meteors.push({
        x: Math.random() * width * 0.9 + (toRight ? 0 : width * 0.1),
        y: Math.random() * height * 0.45,
        vx: Math.cos(angle) * speed * (toRight ? 1 : -1),
        vy: Math.sin(angle) * speed,
        len: (Math.random() * 90 + 110) * dpr,
        age: 0,
        life: Math.random() * 0.5 + 0.7,
      });
      nextMeteorAt = performance.now() + Math.random() * 1700 + 900;
    }

    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var lastFrame = performance.now();

    function draw(now) {
      var dt = Math.min((now - lastFrame) / 1000, 0.05);
      lastFrame = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < stars.length; i++) {
        var star = stars[i];
        var alpha = reduce ? star.a : star.a * (0.62 + 0.38 * Math.sin(star.phase + now * 0.001 * star.speed * 60));
        if (star.glow) {
          ctx.beginPath();
          ctx.fillStyle = 'rgba(' + star.hue + ', ' + (alpha * 0.18).toFixed(3) + ')';
          ctx.arc(star.x, star.y, star.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.fillStyle = 'rgba(' + star.hue + ', ' + alpha.toFixed(3) + ')';
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();

        if (!reduce) {
          star.y -= star.drift * 0.35 * 60 * dt;
          if (star.y < -4) star.y = height + 4;
          if (star.y > height + 4) star.y = -4;
        }
      }

      if (!reduce) {
        if (now > nextMeteorAt) spawnMeteor();
        for (var m = meteors.length - 1; m >= 0; m--) {
          var meteor = meteors[m];
          meteor.age += dt;
          meteor.x += meteor.vx * dt;
          meteor.y += meteor.vy * dt;
          var life = meteor.age / meteor.life;
          if (life >= 1 || meteor.y > height + 80 || meteor.x < -160 || meteor.x > width + 160) {
            meteors.splice(m, 1);
            continue;
          }
          var fade = Math.sin(Math.min(life, 1) * Math.PI);
          var tailX = meteor.x - (meteor.vx / Math.hypot(meteor.vx, meteor.vy)) * meteor.len;
          var tailY = meteor.y - (meteor.vy / Math.hypot(meteor.vx, meteor.vy)) * meteor.len;
          var gradient = ctx.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
          gradient.addColorStop(0, 'rgba(255, 255, 255, ' + (0.95 * fade).toFixed(3) + ')');
          gradient.addColorStop(0.25, 'rgba(198, 226, 255, ' + (0.55 * fade).toFixed(3) + ')');
          gradient.addColorStop(1, 'rgba(198, 226, 255, 0)');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2.6 * dpr;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(tailX, tailY);
          ctx.stroke();

          ctx.beginPath();
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.9 * fade).toFixed(3) + ')';
          ctx.arc(meteor.x, meteor.y, 2.2 * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
        raf = requestAnimationFrame(draw);
      }
    }

    nextMeteorAt = performance.now() + 700;
    raf = requestAnimationFrame(draw);
    if (reduce) draw(performance.now());
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
