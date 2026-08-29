/*
 * The hero demo. A standalone reimplementation of what the extension does, so
 * the page has no build step and no dependency on the extension bundle.
 *
 * It is deliberately not the extension's own code: shipping that here would mean
 * a build pipeline for one page. The behaviour is mirrored, not shared, and the
 * extension's version is the one covered by tests.
 */

(function () {
  'use strict';

  var NIL = '00000000-0000-0000-0000-000000000000';
  var MAX = 'ffffffff-ffff-ffff-ffff-ffffffffffff';

  function randomBytes(n) {
    var bytes = new Uint8Array(n);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  function hex(byte) {
    return byte.toString(16).padStart(2, '0');
  }

  function format(bytes) {
    var s = Array.prototype.map.call(bytes, hex).join('');
    return (
      s.slice(0, 8) +
      '-' +
      s.slice(8, 12) +
      '-' +
      s.slice(12, 16) +
      '-' +
      s.slice(16, 20) +
      '-' +
      s.slice(20)
    );
  }

  function v4() {
    // randomUUID is available in every browser that can run this page.
    return crypto.randomUUID();
  }

  var v7LastMs = 0;
  var v7Counter = 0;

  /**
   * Unix-epoch time-ordered: 48 bits of milliseconds, a 12-bit counter, then
   * randomness.
   *
   * The counter is what makes the sort order claim true. Without it, every UUID
   * generated inside the same millisecond differs only in random bits and the
   * sequence does not sort — which is the entire reason to choose v7. This is
   * RFC 9562 §6.2 method 1, using `rand_a` as a sub-millisecond counter.
   */
  function v7() {
    var bytes = randomBytes(16);
    var ms = Date.now();

    if (ms === v7LastMs) {
      v7Counter += 1;
      if (v7Counter > 0x0fff) {
        // Counter exhausted within one millisecond: borrow from the next one
        // rather than wrap, which would go backwards.
        v7LastMs += 1;
        ms = v7LastMs;
        v7Counter = 0;
      }
    } else {
      if (ms < v7LastMs) ms = v7LastMs; // clock stepped backwards
      v7LastMs = ms;
      v7Counter = 0;
    }

    bytes[0] = (ms / 2 ** 40) & 0xff;
    bytes[1] = (ms / 2 ** 32) & 0xff;
    bytes[2] = (ms / 2 ** 24) & 0xff;
    bytes[3] = (ms / 2 ** 16) & 0xff;
    bytes[4] = (ms / 2 ** 8) & 0xff;
    bytes[5] = ms & 0xff;
    bytes[6] = 0x70 | ((v7Counter >> 8) & 0x0f); // version 7 + counter high
    bytes[7] = v7Counter & 0xff; // counter low
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    return format(bytes);
  }

  // Milliseconds between the Gregorian epoch (1582-10-15) and the Unix epoch.
  var GREGORIAN_OFFSET = 12219292800000n;
  var v1Counter = 0;

  function v1() {
    var ts =
      (BigInt(Date.now()) + GREGORIAN_OFFSET) * 10000n + BigInt(v1Counter++ % 10000);
    var bytes = randomBytes(16);

    var timeLow = Number(ts & 0xffffffffn);
    var timeMid = Number((ts >> 32n) & 0xffffn);
    var timeHi = Number((ts >> 48n) & 0x0fffn);

    bytes[0] = (timeLow >>> 24) & 0xff;
    bytes[1] = (timeLow >>> 16) & 0xff;
    bytes[2] = (timeLow >>> 8) & 0xff;
    bytes[3] = timeLow & 0xff;
    bytes[4] = (timeMid >>> 8) & 0xff;
    bytes[5] = timeMid & 0xff;
    bytes[6] = ((timeHi >>> 8) & 0x0f) | 0x10; // version 1
    bytes[7] = timeHi & 0xff;
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
    // RFC 9562 §5.1: a random node id sets the multicast bit, which is what
    // guarantees no MAC address is being used. The extension does the same.
    bytes[10] |= 0x01;

    return format(bytes);
  }

  var GENERATORS = {
    v4: v4,
    v1: v1,
    v7: v7,
    nil: function () {
      return NIL;
    },
    max: function () {
      return MAX;
    },
  };

  var CONSTANT = { nil: true, max: true };
  var WRAPPERS = ['none', 'braces', 'quotes', 'urn'];
  var WRAPPER_LABEL = { none: '{ }', braces: '{ }', quotes: '" "', urn: 'urn:' };

  var state = { kind: 'v4', raw: v4(), uppercase: false, hyphens: true, wrapper: 'none' };

  var els = {
    value: document.getElementById('value'),
    card: document.querySelector('.value-card'),
    copy: document.getElementById('copy'),
    refresh: document.getElementById('refresh'),
    caseChip: document.getElementById('case'),
    hyphenChip: document.getElementById('hyphens'),
    wrapperChip: document.getElementById('wrapper'),
    live: document.getElementById('live'),
    tabs: Array.prototype.slice.call(document.querySelectorAll('.tabs button')),
  };

  function formatted() {
    var out = state.hyphens ? state.raw : state.raw.replace(/-/g, '');
    if (state.uppercase) out = out.toUpperCase();
    if (state.wrapper === 'braces') return '{' + out + '}';
    if (state.wrapper === 'quotes') return '"' + out + '"';
    if (state.wrapper === 'urn') return 'urn:uuid:' + out;
    return out;
  }

  var copyTimer = null;

  function render() {
    els.value.textContent = formatted();
    els.caseChip.setAttribute('aria-pressed', String(state.uppercase));
    els.hyphenChip.setAttribute('aria-pressed', String(state.hyphens));
    els.wrapperChip.setAttribute('aria-pressed', String(state.wrapper !== 'none'));
    els.wrapperChip.textContent = WRAPPER_LABEL[state.wrapper];
    els.refresh.setAttribute('aria-disabled', String(Boolean(CONSTANT[state.kind])));
    els.tabs.forEach(function (tab) {
      var on = tab.dataset.kind === state.kind;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
    });
  }

  function clearCopied() {
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = null;
    els.card.classList.remove('copied');
    els.copy.classList.remove('done');
    els.live.textContent = '';
  }

  function copy() {
    var text = formatted();
    var done = function () {
      els.card.classList.add('copied');
      els.copy.classList.add('done');
      els.live.textContent = 'Copied ' + text;
      if (copyTimer) clearTimeout(copyTimer);
      copyTimer = setTimeout(clearCopied, 1200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () {
        els.live.textContent = 'Copy failed';
      });
    } else {
      els.live.textContent = 'Copy failed';
    }
  }

  function select(kind) {
    state.kind = kind;
    state.raw = GENERATORS[kind]();
    clearCopied();
    render();
  }

  els.tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () {
      select(tab.dataset.kind);
    });
    tab.addEventListener('keydown', function (event) {
      var next = null;
      if (event.key === 'ArrowRight') next = (index + 1) % els.tabs.length;
      if (event.key === 'ArrowLeft')
        next = (index - 1 + els.tabs.length) % els.tabs.length;
      if (next === null) return;
      event.preventDefault();
      select(els.tabs[next].dataset.kind);
      els.tabs[next].focus();
    });
  });

  els.copy.addEventListener('click', copy);
  els.value.addEventListener('click', copy);

  els.refresh.addEventListener('click', function () {
    if (CONSTANT[state.kind]) return;
    state.raw = GENERATORS[state.kind]();
    clearCopied();
    render();
  });

  els.caseChip.addEventListener('click', function () {
    state.uppercase = !state.uppercase;
    clearCopied();
    render();
  });

  els.hyphenChip.addEventListener('click', function () {
    state.hyphens = !state.hyphens;
    clearCopied();
    render();
  });

  els.wrapperChip.addEventListener('click', function () {
    state.wrapper = WRAPPERS[(WRAPPERS.indexOf(state.wrapper) + 1) % WRAPPERS.length];
    clearCopied();
    render();
  });

  render();
})();
