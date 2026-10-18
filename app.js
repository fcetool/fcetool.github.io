(function () {
  'use strict';

  if (typeof CONFIG === 'undefined') return;

  var TIMEOUT_MS = 180000;
  var api = CONFIG.api;

  function byId(id) {
    return document.getElementById(id);
  }

  var form = byId('extract-form');
  if (!form) return;

  var urlInput = byId('firmware-url');
  var select = byId('target-select');
  var submit = byId('submit-btn');
  var submitLabel = byId('submit-label');
  var status = byId('status');
  var result = byId('result');
  var downloadBtn = byId('download-btn');
  var copyLinkBtn = byId('copy-link-btn');
  var againBtn = byId('again-btn');
  var resultFile = byId('result-file');
  var resultMeta = byId('result-meta');

  var ticker = 0;
  var lastLink = '';

  var announcer = document.createElement('p');
  announcer.className = 'sr-only';
  announcer.setAttribute('role', 'status');
  document.body.appendChild(announcer);

  function ApiError(code, data) {
    this.code = code;
    this.data = data;
  }

  function httpUrl(value, secureOnly) {
    try {
      var url = new URL(String(value));
      var allowed = secureOnly ? url.protocol === 'https:' : url.protocol === 'https:' || url.protocol === 'http:';
      return allowed ? url.href : '';
    } catch (_) {
      return '';
    }
  }

  function showStatus(message, tone) {
    status.textContent = message;
    status.dataset.tone = tone;
    status.hidden = false;
  }

  function hideStatus() {
    status.hidden = true;
    status.textContent = '';
  }

  function setBusy(busy) {
    urlInput.disabled = busy;
    select.disabled = busy;
    submit.disabled = busy;
    submit.classList.toggle('is-busy', busy);
    form.setAttribute('aria-busy', String(busy));

    clearInterval(ticker);

    if (!busy) {
      submitLabel.textContent = 'Extract';
      return;
    }

    var started = Date.now();
    submitLabel.textContent = 'Extracting\u2026';
    ticker = setInterval(function () {
      submitLabel.textContent = 'Extracting\u2026 ' + Math.floor((Date.now() - started) / 1000) + 's';
    }, 1000);
  }

  async function request(url, options) {
    var response = await fetch(url, options);
    var data = null;

    try {
      data = await response.json();
    } catch (_) {}

    return { ok: response.ok, code: response.status, data: data };
  }

  async function run(url, target, signal) {
    try {
      var query = new URLSearchParams({ url: url, target: target });
      var cached = await request(api.baseUrl + api.check + '?' + query, { signal: signal });

      if (cached.ok && cached.data && cached.data.status === 'found') {
        return { cached: true, downloadUrl: cached.data.download_url, target: cached.data.target || target };
      }
    } catch (error) {
      if (error.name === 'AbortError') throw error;
    }

    var response = await request(api.baseUrl + api.extract, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, target: target }),
      signal: signal
    });

    if (!response.ok) throw new ApiError(response.code, response.data);

    var data = response.data || {};
    return { cached: false, downloadUrl: data.download_url, target: data.target || target, seconds: data.duration_seconds };
  }

  function showFailure(error) {
    if (error && error.name === 'AbortError') {
      showStatus('The server took too long to respond. Large files can exceed the web limits, so try the command line below.', 'warn');
      return;
    }

    if (error instanceof ApiError) {
      var data = error.data || {};
      var text = typeof data.message === 'string' && data.message ? data.message
        : typeof data.detail === 'string' && data.detail ? data.detail
        : error.code === 429 ? 'Too many requests. Please wait a minute and try again.'
        : 'An unexpected error occurred.';
      var gentle = error.code === 429 || /capacity/i.test(text);
      showStatus(text, gentle ? 'warn' : 'error');
      return;
    }

    showStatus('Network error: unable to connect to the server.', 'error');
  }

  function showResult(outcome) {
    var link = httpUrl(outcome.downloadUrl, true);

    if (!link) {
      showStatus('The server returned an invalid download link. Please try again.', 'error');
      return;
    }

    lastLink = link;
    downloadBtn.href = link;
    downloadBtn.download = outcome.target;
    resultFile.textContent = outcome.target;
    resultMeta.textContent = outcome.cached ? 'Retrieved from cache'
      : Number.isFinite(Number(outcome.seconds)) ? 'Extraction completed in ' + Number(outcome.seconds) + 's'
      : 'Extraction completed';

    hideStatus();
    form.hidden = true;
    result.hidden = false;
    result.focus();
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (_) {}
    }

    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();

    var done = false;
    try {
      done = document.execCommand('copy');
    } catch (_) {}

    area.remove();
    return done;
  }

  function flashCopied(button, label) {
    var text = label && button.querySelector('span');
    var original = text && text.textContent;

    button.classList.add('is-copied');
    if (text) text.textContent = 'Copied';
    announcer.textContent = 'Copied to clipboard';

    setTimeout(function () {
      button.classList.remove('is-copied');
      if (text) text.textContent = original;
      announcer.textContent = '';
    }, 1600);
  }

  CONFIG.targets.forEach(function (name) {
    var option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    hideStatus();

    var url = httpUrl(urlInput.value.trim(), false);

    if (!url) {
      showStatus('Enter a valid firmware URL that starts with http:// or https://.', 'error');
      urlInput.focus();
      return;
    }

    if (!select.value) {
      showStatus('Please select a target file to extract.', 'error');
      select.focus();
      return;
    }

    var controller = new AbortController();
    var timeout = setTimeout(function () {
      controller.abort();
    }, TIMEOUT_MS);

    setBusy(true);

    try {
      showResult(await run(url, select.value, controller.signal));
    } catch (error) {
      showFailure(error);
    } finally {
      clearTimeout(timeout);
      setBusy(false);
      if (result.hidden) submit.focus();
    }
  });

  againBtn.addEventListener('click', function () {
    result.hidden = true;
    form.hidden = false;
    urlInput.value = '';
    select.value = '';
    hideStatus();
    urlInput.focus();
  });

  copyLinkBtn.addEventListener('click', async function () {
    if (lastLink && await copyText(lastLink)) flashCopied(copyLinkBtn, true);
  });

  document.querySelectorAll('.copy[data-copy]').forEach(function (button) {
    button.addEventListener('click', async function () {
      if (await copyText(button.dataset.copy)) flashCopied(button, false);
    });
  });

  function prepare(typed) {
    var text = typed.dataset.text;
    typed.querySelector('.typed-done').textContent = '';
    typed.querySelector('.typed-rest').textContent = text;
  }

  function type(typed) {
    var text = typed.dataset.text;
    var done = typed.querySelector('.typed-done');
    var rest = typed.querySelector('.typed-rest');

    return new Promise(function (resolve) {
      var index = 0;
      typed.classList.add('is-typing');

      (function step() {
        done.textContent = text.slice(0, index);
        rest.textContent = text.slice(index);

        if (index >= text.length) {
          typed.classList.remove('is-typing');
          resolve();
          return;
        }

        index += 1;
        setTimeout(step, 38);
      }());
    });
  }

  async function play(frame) {
    frame.classList.add('is-in');
    await new Promise(function (resolve) { setTimeout(resolve, 450); });

    var lines = frame.querySelectorAll('.typed');
    for (var i = 0; i < lines.length; i++) {
      await type(lines[i]);
      await new Promise(function (resolve) { setTimeout(resolve, 250); });
    }
  }

  var frames = document.querySelectorAll('.frame');
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!calm && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        play(entry.target);
      });
    }, { threshold: 0.45 });

    frames.forEach(function (frame) {
      frame.classList.add('will-reveal');
      frame.querySelectorAll('.typed').forEach(prepare);
      observer.observe(frame);
    });
  }
}());
