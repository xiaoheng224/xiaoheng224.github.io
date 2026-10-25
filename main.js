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
