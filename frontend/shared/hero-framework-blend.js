(function() {
  'use strict';

  var introduction = document.querySelector('.sthir-introduction');
  if (!introduction) return;
  var map = introduction.querySelector('.framework-map');
  var story = document.getElementById('mind-gym-story');
  var badge = introduction.querySelector('.home-practice-icon');
  var canvas = introduction.querySelector('.framework-blend-canvas');
  var ring = introduction.querySelector('.framework-blend-ring');
  var tail = introduction.querySelector('.framework-blend-tail');
  if (!map || !story || !badge || !canvas || !ring || !tail) return;

  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var compact = window.matchMedia('(max-width: 1100px)');
  var metrics = null;
  var dirty = true;
  var frame = null;
  var previous = null;

  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function ease(value) { return value * value * (3 - 2 * value); }
  function xy(x, y) { return x.toFixed(2) + ' ' + y.toFixed(2); }

  function measure() {
    var bounds = introduction.getBoundingClientRect();
    var source = map.getBoundingClientRect();
    var destination = badge.getBoundingClientRect();
    var scroll = window.scrollY;
    var top = bounds.top + scroll;
    var first = destination.top + scroll + destination.height / 2;
    var start = Math.max(0, source.top + scroll + source.width * 0.3 - window.innerHeight * 0.65);
    var end = Math.max(start + 240, first - window.innerHeight * 0.55);
    if (compact.matches) {
      start = first - window.innerHeight * 0.9;
      end = first - window.innerHeight * 0.55;
    }
    metrics = {
      x: source.left - bounds.left + source.width / 2,
      y: source.top - bounds.top + source.height / 2,
      radius: source.width * 0.4,
      toX: destination.left - bounds.left + destination.width / 2,
      toY: first - top,
      start: start,
      end: end,
      compact: compact.matches,
      height: bounds.height
    };
    canvas.setAttribute('viewBox', '0 0 ' + bounds.width + ' ' + bounds.height);
    canvas.style.height = bounds.height + 'px';
    dirty = false;
    previous = null;
  }

  function reset() {
    introduction.classList.remove('framework-blend-ready');
    canvas.hidden = true;
    previous = null;
  }

  function render() {
    frame = null;
    if (motion.matches) { reset(); return; }
    if (dirty || !metrics) measure();
    var progress = ease(clamp((window.scrollY - metrics.start) / (metrics.end - metrics.start)));
    if (progress === previous) return;
    previous = progress;

    if (metrics.compact) {
      // A short continuation above the stacked list, never across paragraphs.
      introduction.classList.remove('framework-blend-ready');
      ring.setAttribute('d', '');
      tail.setAttribute('d', 'M' + xy(metrics.toX + 52, metrics.toY - 96) +
        ' Q' + xy(metrics.toX, metrics.toY - 96) + ' ' + xy(metrics.toX, metrics.toY - 44) +
        ' L' + xy(metrics.toX, metrics.toY));
      tail.style.strokeDashoffset = (1 - progress).toFixed(4);
      canvas.hidden = progress === 0;
      return;
    }

    // Open the left edge of the outer circle. Its vertical tangent becomes
    // the same spine as the seven stationary badges in the story below.
    var gap = progress * 14 * Math.PI / 180;
    var r = metrics.radius;
    var left = metrics.x - r * Math.cos(gap);
    var lower = metrics.y + r * Math.sin(gap);
    var upper = metrics.y - r * Math.sin(gap);
    ring.setAttribute('d', 'M' + xy(left, lower) +
      ' A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 0 0 ' + xy(metrics.x + r, metrics.y) +
      ' A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 0 0 ' + xy(left, upper));

    var outside = Math.min(left - r * 0.22, metrics.toX - 8);
    var tangent = r * 0.18;
    var exitY = upper + r * 0.65;
    var descent = Math.min(120, (metrics.toY - exitY) * 0.4);
    tail.setAttribute('d', 'M' + xy(left, upper) +
      ' C' + xy(left - Math.sin(gap) * tangent, upper + Math.cos(gap) * tangent) +
      ' ' + xy(outside, exitY - r * 0.25) + ' ' + xy(outside, exitY) +
      ' C' + xy(outside, exitY + descent) + ' ' + xy(metrics.toX, metrics.toY - 120) + ' ' + xy(metrics.toX, metrics.toY));
    tail.style.strokeDashoffset = (1 - progress).toFixed(4);
    introduction.classList.add('framework-blend-ready');
    canvas.hidden = false;
  }

  function schedule() {
    if (frame === null) frame = window.requestAnimationFrame(render);
  }
  function refresh() { dirty = true; schedule(); }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('load', refresh, { once: true });
  motion.addEventListener('change', refresh);
  compact.addEventListener('change', refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  if (window.ResizeObserver) {
    var observer = new window.ResizeObserver(refresh);
    observer.observe(introduction);
    observer.observe(map);
  }
  render();
})();
