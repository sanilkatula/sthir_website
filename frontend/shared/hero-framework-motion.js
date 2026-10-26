(function() {
  'use strict';

  var figure = document.querySelector('.hero-framework');
  var map = document.querySelector('.framework-map');
  var story = document.getElementById('mind-gym-story');
  var overlay = document.querySelector('.framework-journey-overlay');
  if (!figure || !map || !story || !overlay) return;

  var rings = Array.from(map.querySelectorAll('.framework-rings > circle'));
  var muscles = Array.from(map.querySelectorAll('.framework-muscle'));
  var dispositions = Array.from(map.querySelectorAll('.framework-dispositions > li'));
  var destinations = Array.from(story.querySelectorAll('.home-practice-icon'));
  var threads = Array.from(overlay.querySelectorAll('.framework-journey-thread'));
  var seeds = Array.from(overlay.querySelectorAll('.framework-journey-seeds > circle'));
  var cue = figure.querySelector('.framework-scroll-cue > span');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (muscles.length !== 3 || dispositions.length !== 7 || destinations.length !== 7 || seeds.length !== 7) return;

  var musclePositions = [{ x: 50, y: 28 }, { x: 69, y: 61.5 }, { x: 31, y: 61.5 }];
  var dispositionPositions = dispositions.map(function(node) {
    return { x: parseFloat(node.style.getPropertyValue('--x')), y: parseFloat(node.style.getPropertyValue('--y')) };
  });
  var metrics = null;
  var frame = null;
  var needsMeasure = true;
  var keyboardOpen = false;
  var focusedMuscle = false;
  var lastOpening = null;
  var lastTravel = null;

  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function smooth(start, end, value) {
    var t = clamp((value - start) / (end - start));
    return t * t * (3 - 2 * t);
  }
  function point(a, b, c, d, t) {
    var u = 1 - t;
    return {
      x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
      y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y
    };
  }

  function measure() {
    var scroll = window.scrollY;
    var bounds = map.getBoundingClientRect();
    var storyBounds = story.getBoundingClientRect();
    var width = document.documentElement.clientWidth;
    var targets = destinations.map(function(node) {
      var rect = node.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + scroll + rect.height / 2, radius: rect.width / 2 };
    });
    var top = bounds.top + scroll;
    var center = { x: bounds.left + bounds.width / 2, y: top + bounds.height / 2 };
    var compact = window.matchMedia('(max-width: 1100px)').matches;
    var start = Math.max(0, top - window.innerHeight * 0.38);
    var openEnd = start + Math.min(200, window.innerHeight * 0.26);
    var arrival = Math.max(openEnd + 160, targets[0].y - window.innerHeight * 0.48);
    var height = Math.ceil(storyBounds.bottom + scroll + 2);

    metrics = {
      width: width, size: bounds.width, center: center, targets: targets,
      start: start, openEnd: openEnd, arrival: arrival, compact: compact,
      sources: dispositionPositions.map(function(position) {
        return { x: bounds.left + bounds.width * position.x / 100, y: top + bounds.height * position.y / 100 - bounds.width * 0.025 };
      })
    };
    overlay.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    overlay.style.height = height + 'px';

    threads.forEach(function(thread, index) {
      var offset = (index - 1) * 7;
      var from = { x: center.x + offset * 1.5, y: center.y + bounds.width * 0.12 };
      var to = { x: targets[0].x + offset * 0.4, y: targets[0].y };
      var path;
      if (compact) {
        // Keep the long connection in the page gutter, clear of the story copy.
        var edge = width - 12 + offset * 0.35;
        var bend = Math.min(from.y + bounds.height * 0.45, to.y - 80);
        path = 'M' + from.x + ' ' + from.y + ' C' + from.x + ' ' + bend + ' ' + edge + ' ' + from.y + ' ' + edge + ' ' + bend +
          ' L' + edge + ' ' + (to.y - 60) + ' Q' + edge + ' ' + to.y + ' ' + to.x + ' ' + to.y;
      } else {
        var middle = mix(from.y, to.y, 0.52);
        path = 'M' + from.x + ' ' + from.y + ' C' + from.x + ' ' + middle + ' ' + to.x + ' ' + middle + ' ' + to.x + ' ' + to.y;
      }
      thread.setAttribute('d', path);
    });
    needsMeasure = false;
  }

  function reset() {
    figure.classList.remove('framework-motion-ready');
    figure.removeAttribute('style');
    muscles.concat(dispositions).forEach(function(node) {
      node.style.removeProperty('left');
      node.style.removeProperty('top');
    });
    rings.forEach(function(ring) {
      ring.removeAttribute('stroke-dasharray');
      ring.removeAttribute('transform');
    });
    overlay.hidden = true;
    cue.textContent = 'From intention to everyday practice';
  }

  function render() {
    frame = null;
    if (reducedMotion.matches) { reset(); return; }
    var measured = needsMeasure || !metrics;
    if (measured) measure();
    var scroll = window.scrollY;
    var opening = keyboardOpen ? 1 : smooth(metrics.start, metrics.openEnd, scroll);
    var travel = focusedMuscle ? 0 : smooth(metrics.openEnd, metrics.arrival, scroll);
    // Once the handoff is complete, scrolling through the rest of the site
    // does not keep rewriting illustration styles.
    if (!measured && opening === lastOpening && travel === lastTravel) return;
    lastOpening = opening;
    lastTravel = travel;
    var muscleOpacity = smooth(0.1, 0.65, opening) * (1 - smooth(0.15, 0.8, travel));
    var labelOpacity = smooth(0.3, 1, opening) * (1 - smooth(0.02, 0.32, travel));

    figure.style.setProperty('--framework-drift', (metrics.size * travel * 0.16).toFixed(2) + 'px');
    figure.style.setProperty('--framework-squeeze', (1 - travel * 0.35).toFixed(4));
    figure.style.setProperty('--framework-stretch', (1 + travel * 0.65).toFixed(4));
    figure.style.setProperty('--framework-ring-opacity', (1 - smooth(0.2, 0.85, travel)).toFixed(4));
    figure.style.setProperty('--framework-core-opacity', (1 - smooth(0.3, 0.9, travel)).toFixed(4));
    figure.style.setProperty('--framework-muscle-opacity', muscleOpacity.toFixed(4));
    figure.style.setProperty('--framework-label-opacity', labelOpacity.toFixed(4));
    figure.style.setProperty('--framework-hit-area', muscleOpacity > 0.5 ? 'auto' : 'none');

    muscles.forEach(function(node, index) {
      var reach = smooth(0.05 + index * 0.08, 0.8 + index * 0.08, opening);
      node.style.left = mix(50, musclePositions[index].x, reach) + '%';
      node.style.top = mix(50, musclePositions[index].y, reach) + '%';
    });
    dispositions.forEach(function(node, index) {
      var reach = smooth(0.15 + index * 0.025, 0.83 + index * 0.025, opening);
      node.style.left = mix(50, dispositionPositions[index].x, reach) + '%';
      node.style.top = mix(50, dispositionPositions[index].y, reach) + '%';
    });
    rings.forEach(function(ring, index) {
      var length = 2 * Math.PI * Number(ring.getAttribute('r'));
      var gap = opening * 0.12 + travel * 0.45;
      ring.setAttribute('stroke-dasharray', (length * (1 - gap)).toFixed(2) + ' ' + (length * gap).toFixed(2));
      ring.setAttribute('transform', 'rotate(' + ((index ? -1 : 1) * (opening * 32 + travel * 80)) + ' 320 320)');
    });

    threads.forEach(function(thread, index) {
      var draw = smooth(index * 0.025, 0.95, travel);
      thread.style.strokeDashoffset = (1 - draw).toFixed(4);
      thread.style.opacity = (draw * (metrics.compact ? 0.35 : 0.7)).toFixed(4);
    });
    seeds.forEach(function(seed, index) {
      // On narrow screens the thread follows the gutter; floating markers stay
      // off the reading column. The existing practice icons remain visible.
      if (metrics.compact) { seed.style.opacity = '0'; return; }
      var progress = smooth(index * 0.025, 1, travel);
      var from = metrics.sources[index];
      var to = metrics.targets[index];
      var middleY = mix(from.y, to.y, 0.5);
      var position = point(from, { x: from.x, y: middleY }, { x: to.x, y: middleY }, to, progress);
      seed.setAttribute('cx', position.x.toFixed(2));
      seed.setAttribute('cy', position.y.toFixed(2));
      seed.setAttribute('r', mix(Math.max(6, metrics.size * 0.014), to.radius * 0.84, progress).toFixed(2));
      seed.style.opacity = (smooth(0, 0.1, progress) * (1 - smooth(0.78, 1, progress))).toFixed(4);
    });

    cue.textContent = opening < 0.95 ? 'Scroll to unfold' : 'Follow the thread into practice';
    figure.classList.add('framework-motion-ready');
    overlay.hidden = travel <= 0;
  }

  function schedule() {
    if (frame === null) frame = window.requestAnimationFrame(render);
  }
  function refresh() { needsMeasure = true; schedule(); }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('load', refresh, { once: true });
  reducedMotion.addEventListener('change', refresh);
  figure.addEventListener('focusin', function(event) {
    if (event.target.closest('.framework-muscle')) {
      keyboardOpen = true;
      focusedMuscle = true;
      // Reveal focused controls immediately, including before a first scroll.
      if (frame !== null) window.cancelAnimationFrame(frame);
      render();
    }
  });
  figure.addEventListener('focusout', function() { focusedMuscle = false; schedule(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  if (window.ResizeObserver) {
    var observer = new window.ResizeObserver(refresh);
    observer.observe(map);
    observer.observe(story);
  }
  render();
})();
