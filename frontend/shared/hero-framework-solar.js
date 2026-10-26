(function() {
  'use strict';

  var scene = document.querySelector('.sthir-introduction');
  if (!scene) return;
  var map = scene.querySelector('.framework-map');
  var solar = scene.querySelector('.framework-solar-canvas');
  var lineCanvas = scene.querySelector('.framework-blend-canvas');
  var ring = scene.querySelector('.framework-blend-ring');
  var tail = scene.querySelector('.framework-blend-tail');
  var toggle = scene.querySelector('.framework-motion-toggle');
  var markers = Array.from(scene.querySelectorAll('.framework-disposition-markers > li'));
  var badges = Array.from(scene.querySelectorAll('.home-practice-icon'));
  if (!map || !solar || !lineCanvas || !ring || !tail || markers.length !== 7 || badges.length !== 7) return;

  var ns = 'http://www.w3.org/2000/svg';
  var names = ['Stillness', 'Clarity', 'Perspective', 'Discernment', 'Conscious choice', 'Courage', 'Commitment'];
  var preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  var compact = window.matchMedia('(max-width: 1100px)');
  var paused = preference.matches;
  var metrics = null;
  var dirty = true;
  var frame = null;
  var phase = 0;
  var lastTime = null;
  var departing = false;
  var departurePhase = 0;
  var departureAngle = 0;
  var parkingTurn = 0;
  var lastProgress = null;
  var lastPhase = null;
  var lastPathProgress = null;
  var generation = 0;
  var timeline = null;

  function element(tag, attrs) {
    var node = document.createElementNS(ns, tag);
    Object.keys(attrs || {}).forEach(function(key) { node.setAttribute(key, attrs[key]); });
    return node;
  }
  function clamp(value) { return Math.max(0, Math.min(1, value)); }
  function ease(value) { return value * value * value * (value * (value * 6 - 15) + 10); }
  function mix(a, b, amount) { return a + (b - a) * amount; }
  function xy(x, y) { return x.toFixed(2) + ' ' + y.toFixed(2); }
  function setSvgVisible(node, visible) {
    // SVGElement does not reflect HTMLElement.hidden. Toggle the attribute
    // itself so the canvas[hidden] display rule actually changes.
    var hidden = node.hasAttribute('hidden');
    if (visible && hidden) node.removeAttribute('hidden');
    else if (!visible && !hidden) node.setAttribute('hidden', '');
  }
  function cubic(a, b, c, d, amount) {
    var u = 1 - amount;
    return {
      x: u * u * u * a.x + 3 * u * u * amount * b.x + 3 * u * amount * amount * c.x + amount * amount * amount * d.x,
      y: u * u * u * a.y + 3 * u * u * amount * b.y + 3 * u * amount * amount * c.y + amount * amount * amount * d.y
    };
  }

  function buildRoute() {
    var r = metrics.radius;
    var gap = 14 * Math.PI / 180;
    var from = { x: metrics.x - r * Math.cos(gap), y: metrics.y - r * Math.sin(gap) };
    var to = metrics.targets[0];
    var outside = Math.min(from.x - r * 0.22, to.x - 8);
    var bend = { x: outside, y: from.y + r * 0.65 };
    var controls = [
      from,
      { x: from.x - Math.sin(gap) * r * 0.18, y: from.y + Math.cos(gap) * r * 0.18 },
      { x: outside, y: bend.y - r * 0.25 },
      bend,
      { x: outside, y: bend.y + Math.min(120, (to.y - bend.y) * 0.4) },
      { x: to.x, y: to.y - 120 },
      to
    ];
    metrics.routePath = 'M' + xy(from.x, from.y) + ' C' + xy(controls[1].x, controls[1].y) +
      ' ' + xy(controls[2].x, controls[2].y) + ' ' + xy(bend.x, bend.y) +
      ' C' + xy(controls[4].x, controls[4].y) + ' ' + xy(controls[5].x, controls[5].y) + ' ' + xy(to.x, to.y);
    var points = [];
    var length = 0;
    function add(point) {
      var previous = points[points.length - 1];
      if (previous) length += Math.hypot(point.x - previous.x, point.y - previous.y);
      points.push({ x: point.x, y: point.y, distance: length });
    }
    for (var section = 0; section < 2; section++) {
      var offset = section * 3;
      for (var step = section ? 1 : 0; step <= 40; step++) {
        add(cubic(controls[offset], controls[offset + 1], controls[offset + 2], controls[offset + 3], step / 40));
      }
    }
    metrics.landingDistances = metrics.targets.map(function(target) { return length + target.y - to.y; });
    add(metrics.targets[metrics.targets.length - 1]);
    metrics.route = points;
  }

  function onRoute(distance) {
    var points = metrics.route;
    var low = 0;
    var high = points.length - 1;
    while (high - low > 1) {
      var middle = Math.floor((low + high) / 2);
      if (points[middle].distance < distance) low = middle;
      else high = middle;
    }
    var a = points[low];
    var b = points[high];
    var amount = clamp((distance - a.distance) / (b.distance - a.distance || 1));
    return { x: mix(a.x, b.x, amount), y: mix(a.y, b.y, amount) };
  }

  function distanceAtHeight(height) {
    var points = metrics.route;
    var low = 0;
    var high = points.length - 1;
    while (high - low > 1) {
      var middle = Math.floor((low + high) / 2);
      if (points[middle].y < height) low = middle;
      else high = middle;
    }
    var a = points[low];
    var b = points[high];
    return mix(a.distance, b.distance, clamp((height - a.y) / (b.y - a.y || 1)));
  }

  function flightDistance(amount, index) {
    var total = metrics.landingDistances[index];
    var viewportTop = window.scrollY - metrics.sceneTop - metrics.planetRadius - 20;
    var offscreen = Math.min(total, distanceAtHeight(viewportTop));
    if (offscreen <= 0) return amount * total;
    // Quickly cover the invisible route, then spend most of the movement
    // descending through the viewport. No fade-in or jump to the badge.
    if (amount < 0.1) return offscreen * ease(amount / 0.1);
    return mix(offscreen, total, ease((amount - 0.1) / 0.9));
  }

  function scrollProgress(scroll) {
    var stops = metrics.scrollStops;
    if (scroll <= stops[0].scroll) return 0;
    for (var i = 1; i < stops.length; i++) {
      if (scroll <= stops[i].scroll) {
        var previous = stops[i - 1];
        var next = stops[i];
        return mix(previous.progress, next.progress, (scroll - previous.scroll) / (next.scroll - previous.scroll));
      }
    }
    return 1;
  }

  var planets = badges.map(function(badge, index) {
    var source = badge.querySelector('img, svg');
    var branded = source.localName === 'img';
    var group = element('g');
    var halo = element('circle', { class: 'framework-solar-planet-halo' });
    var body = element('circle', { fill: markers[index].style.getPropertyValue('--disposition-color').trim() });
    var icon = branded
      ? element('image', { href: source.getAttribute('src'), preserveAspectRatio: 'xMidYMid meet' })
      : source.cloneNode(true);
    icon.setAttribute('class', 'framework-solar-planet-icon');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '1.6');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    var label = element('text', { class: 'framework-solar-planet-label' });
    label.textContent = names[index];
    var number = element('text', { class: 'framework-solar-planet-number' });
    number.textContent = '0' + (index + 1);
    group.append(halo, body, icon, number, label);
    solar.appendChild(group);
    return { group: group, halo: halo, body: body, icon: icon, number: number, label: label, branded: branded };
  });

  function measure() {
    var bounds = scene.getBoundingClientRect();
    var source = map.getBoundingClientRect();
    var scroll = window.scrollY;
    var targets = badges.map(function(badge) {
      var rect = badge.getBoundingClientRect();
      return { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2, radius: (rect.width - 10) / 2 };
    });
    var start = Math.max(0, source.top + scroll + source.width * 0.35 - window.innerHeight * 0.45);
    var sceneTop = bounds.top + scroll;
    var firstDeadline = Math.max(start + 120, sceneTop + targets[0].y - window.innerHeight * 0.72);
    var gatherEnd = start + Math.max(24, Math.min(window.innerHeight * 0.16, (firstDeadline - start) * 0.25));
    var stops = [{ scroll: start, progress: 0 }, { scroll: gatherEnd, progress: 0.16 }];
    var previousEnd = gatherEnd;
    targets.forEach(function(destination, index) {
      var deadline = Math.max(firstDeadline, sceneTop + destination.y - window.innerHeight * 0.72);
      // Each stage lands at 92% of its interval, before the row passes the
      // lower part of the viewport. Keep all intervals continuous and ordered.
      var end = Math.max(previousEnd + 48, (deadline - previousEnd * 0.08) / 0.92);
      stops.push({ scroll: end, progress: 0.16 + (index + 1) * 0.84 / 7 });
      previousEnd = end;
    });
    metrics = {
      generation: ++generation,
      x: source.left - bounds.left + source.width / 2,
      y: source.top - bounds.top + source.height / 2,
      radius: source.width * 0.4,
      planetRadius: Math.max(14, Math.min(22, source.width * 0.042)),
      labelSize: Math.max(10, Math.min(12, source.width * 0.024)),
      targets: targets, scrollStops: stops, compact: compact.matches,
      mapTop: source.top + scroll, mapBottom: source.bottom + scroll,
      sceneTop: bounds.top + scroll, sceneBottom: bounds.top + scroll + bounds.height
    };
    buildRoute();
    [solar, lineCanvas].forEach(function(canvas) {
      canvas.setAttribute('viewBox', '0 0 ' + bounds.width + ' ' + bounds.height);
      canvas.style.height = bounds.height + 'px';
    });
    dirty = false;
    lastProgress = lastPhase = lastPathProgress = null;
  }

  function drawPath(progress) {
    if (progress === lastPathProgress) return;
    lastPathProgress = progress;
    var opening = ease(clamp(progress / 0.16));
    var gap = opening * 14 * Math.PI / 180;
    var r = metrics.radius;
    var left = metrics.x - r * Math.cos(gap);
    var lower = metrics.y + r * Math.sin(gap);
    var upper = metrics.y - r * Math.sin(gap);
    ring.setAttribute('d', 'M' + xy(left, lower) +
      ' A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 0 0 ' + xy(metrics.x + r, metrics.y) +
      ' A' + r.toFixed(2) + ' ' + r.toFixed(2) + ' 0 0 0 ' + xy(left, upper));
    tail.setAttribute('d', metrics.routePath);
    scene.classList.add('framework-blend-ready');
    tail.style.strokeDashoffset = (1 - ease(clamp((progress - 0.12) / 0.08))).toFixed(4);
    setSvgVisible(lineCanvas, true);
  }

  function reset() {
    scene.classList.remove('framework-solar-ready', 'framework-blend-ready');
    setSvgVisible(solar, false);
    setSvgVisible(lineCanvas, false);
    badges.forEach(function(badge) { badge.style.removeProperty('opacity'); });
    timeline = null;
    lastProgress = lastPhase = lastPathProgress = null;
  }

  function render(time) {
    frame = null;
    if (document.hidden) { lastTime = null; return; }
    if (preference.matches && paused) { reset(); lastTime = null; return; }
    if (dirty || !metrics) measure();
    var target = scrollProgress(window.scrollY);
    var elapsed = lastTime === null ? 0 : Math.max(0, Math.min(time - lastTime, 64)) / 1000;
    var sceneVisible = metrics.sceneBottom > window.scrollY && metrics.sceneTop < window.scrollY + window.innerHeight;
    if (timeline === null || !sceneVisible) timeline = target;
    // A short scrub smoothing keeps movement soft without a delayed timer.
    timeline += (target - timeline) * (1 - Math.exp(-elapsed / 0.09));
    if (Math.abs(target - timeline) < 0.000001) timeline = target;
    var raw = timeline;
    if (raw > 0 && !departing) {
      departurePhase = phase;
      departureAngle = -Math.PI / 2 + phase;
      var exitAngle = Math.PI + 14 * Math.PI / 180;
      parkingTurn = Math.atan2(Math.sin(exitAngle - departureAngle), Math.cos(exitAngle - departureAngle));
      departing = true;
    }
    if (raw === 0 && departing) { phase = departurePhase; departing = false; }
    var visible = metrics.mapBottom > window.scrollY && metrics.mapTop < window.scrollY + window.innerHeight;
    if (!departing && !paused && visible && lastTime !== null) {
      // A calm 48-second orbit; labels remain upright.
      phase = (phase - elapsed * Math.PI * 2 / 48 + Math.PI * 2) % (Math.PI * 2);
    }
    lastTime = time;
    var activePhase = departing ? departurePhase : phase;
    var progress = raw;
    if (progress !== lastProgress || activePhase !== lastPhase) {
      var gathering = raw < 0.16;
      var stages = clamp((raw - 0.16) / 0.84) * 7;
      var activeIndex = Math.min(6, Math.floor(stages));
      var stageProgress = stages - activeIndex;
      var advance = activeIndex ? ease(clamp(stageProgress / 0.24)) : 1;
      var parkedAngle = departureAngle + parkingTurn;
      planets.forEach(function(planet, index) {
        var local = 0;
        var angle = -Math.PI / 2 + index * Math.PI * 2 / 7 + activePhase;
        if (departing) {
          if (gathering) {
            angle = departureAngle + parkingTurn * ease(clamp(raw / 0.16)) + index * Math.PI * 2 / 7;
          } else {
            angle = parkedAngle + (index - activeIndex + (activeIndex ? 1 - advance : 0)) * Math.PI * 2 / 7;
            if (index < activeIndex) local = 1;
            else if (index === activeIndex) local = ease(clamp((stageProgress - 0.24) / 0.68));
          }
        }
        var position;
        if (local === 1) position = metrics.targets[index];
        else if (local > 0) position = onRoute(flightDistance(local, index));
        else position = { x: metrics.x + Math.cos(angle) * metrics.radius, y: metrics.y + Math.sin(angle) * metrics.radius };
        planet.group.setAttribute('transform', 'translate(' + xy(position.x, position.y) + ')');
        if (planet.progress !== local || planet.generation !== metrics.generation) {
          var radius = mix(metrics.planetRadius, metrics.targets[index].radius, local);
          var opacity = 1 - ease(clamp((local - 0.94) / 0.06));
          planet.group.style.opacity = opacity.toFixed(4);
          planet.halo.setAttribute('r', (radius + 4).toFixed(2));
          planet.body.setAttribute('r', radius.toFixed(2));
          var iconSize = radius * (planet.branded ? 1.65 : 1.05);
          planet.icon.setAttribute('x', (-iconSize / 2).toFixed(2));
          planet.icon.setAttribute('y', (-iconSize / 2).toFixed(2));
          planet.icon.setAttribute('width', iconSize.toFixed(2));
          planet.icon.setAttribute('height', iconSize.toFixed(2));
          planet.label.setAttribute('y', (radius + 19).toFixed(2));
          planet.label.setAttribute('font-size', metrics.labelSize);
          planet.label.style.opacity = (1 - ease(clamp((local - 0.12) / 0.5))).toFixed(4);
          planet.number.setAttribute('y', (-radius - 10).toFixed(2));
          planet.number.setAttribute('font-size', Math.max(9, metrics.labelSize - 2));
          // Hand back to the original badge at the exact landing position.
          badges[index].style.opacity = (0.22 + 0.78 * (1 - opacity)).toFixed(4);
          planet.progress = local;
          planet.generation = metrics.generation;
        }
      });
      drawPath(raw);
      scene.classList.add('framework-solar-ready');
      setSvgVisible(solar, true);
      lastProgress = progress;
      lastPhase = activePhase;
    }
    if ((!paused && !departing && visible) || Math.abs(target - timeline) > 0.000001) schedule();
  }

  function schedule() {
    if (frame === null) frame = window.requestAnimationFrame(render);
  }
  function refresh() { dirty = true; lastTime = null; schedule(); }
  function updateToggle() { if (toggle) toggle.textContent = paused ? 'Play orbit' : 'Pause orbit'; }

  if (toggle) {
    toggle.hidden = false;
    updateToggle();
    toggle.addEventListener('click', function() { paused = !paused; updateToggle(); lastTime = null; schedule(); });
  }
  preference.addEventListener('change', function() { paused = preference.matches; updateToggle(); refresh(); });
  compact.addEventListener('change', refresh);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', refresh, { passive: true });
  window.addEventListener('pageshow', refresh);
  window.addEventListener('load', refresh, { once: true });
  document.addEventListener('visibilitychange', function() { lastTime = null; schedule(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  if (window.ResizeObserver) {
    var observer = new window.ResizeObserver(refresh);
    observer.observe(scene);
    observer.observe(map);
  }
  schedule();
})();
