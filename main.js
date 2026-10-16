/* АгроСкан, лендинг. Без библиотек и без сторонних запросов.
   Два движения: лесенка достоверности и мягкое появление блоков.
   При prefers-reduced-motion всё стоит на месте. */

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var reduceQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  function reduced() { return !!(reduceQuery && reduceQuery.matches); }

  function onceVisible(el, fn, margin) {
    if (!el) { return; }
    if (!('IntersectionObserver' in window)) { fn(); return; }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          io.disconnect();
          fn();
          return;
        }
      }
    }, { rootMargin: margin || '0px 0px -10% 0px' });
    io.observe(el);
  }

  /* ---------- появление блоков ---------- */

  function setupReveal() {
    var blocks = document.querySelectorAll('.reveal');
    var i;
    if (reduced() || !('IntersectionObserver' in window)) {
      for (i = 0; i < blocks.length; i++) { blocks[i].classList.add('is-in'); }
      return;
    }
    for (i = 0; i < blocks.length; i++) {
      (function (el) {
        onceVisible(el, function () { el.classList.add('is-in'); }, '0px 0px -8% 0px');
      }(blocks[i]));
    }
  }

  /* ---------- лесенка достоверности ---------- */

  function setupLadder() {
    var ladder = document.querySelector('[data-ladder]');
    if (!ladder) { return; }
    var fill = ladder.querySelector('[data-ladder-fill]');
    var marks = ladder.querySelectorAll('[data-ladder-step]');
    if (!fill || !marks.length) { return; }
    if (reduced()) { return; }

    onceVisible(ladder, function () {
      ladder.classList.add('is-anim');
      fill.style.width = '0%';
      var step = 0;
      function next() {
        if (step >= marks.length) { return; }
        var value = marks[step].getAttribute('data-ladder-step');
        fill.style.width = value + '%';
        marks[step].classList.add('is-on');
        step += 1;
        window.setTimeout(next, 420);
      }
      window.setTimeout(next, 120);
    });
  }

  /* ---------- заявка ---------- */

  function setupForm() {
    var form = document.getElementById('lead-form');
    var done = document.getElementById('lead-ok');
    var errorBox = document.getElementById('form-error');
    if (!form || !done || !errorBox || !window.fetch || !window.FormData) { return; }

    form.addEventListener('submit', function (event) {
      if (form.checkValidity && !form.checkValidity()) { return; }
      event.preventDefault();
      errorBox.textContent = '';

      var button = form.querySelector('button[type=submit]');
      var payload = {};
      var entries = new FormData(form);
      entries.forEach(function (value, key) { payload[key] = value; });
      if (button) { button.disabled = true; }

      window.fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        }, function () {
          return { ok: response.ok, data: {} };
        });
      }).then(function (result) {
        if (button) { button.disabled = false; }
        if (result.ok && result.data && result.data.ok) {
          form.classList.add('is-hidden');
          done.classList.add('is-shown');
          done.focus();
          return;
        }
        errorBox.textContent = (result.data && result.data.error)
          ? result.data.error
          : 'Заявка не ушла. Попробуйте ещё раз или напишите в MAX.';
      }, function () {
        if (button) { button.disabled = false; }
        errorBox.textContent = 'Заявка не ушла: нет связи с сервером. Напишите в MAX.';
      });
    });
  }

  setupReveal();
  setupLadder();
  setupForm();
}());
