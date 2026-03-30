(function() {
  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDateLabel(value) {
    if (!value) {
      return 'Date coming soon';
    }

    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Date coming soon';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  function formatPrice(value) {
    var amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return 'Free';
    }

    return '$' + amount.toLocaleString('en-US');
  }

  function renderEmptyState(message) {
    return '' +
      '<div class="glass-card p-8 text-center text-brand-muted md:col-span-2 lg:col-span-3">' +
        escapeHtml(message) +
      '</div>';
  }

  function renderAction(event, fallbackLabel) {
    var label = escapeHtml(event.cta_label || fallbackLabel);

    if (event.cta_url) {
      return '' +
        '<a href="' + escapeHtml(event.cta_url) + '" target="_blank" rel="noopener" ' +
          'class="w-full py-3 rounded-lg bg-brand-bg border border-brand-surfaceLight text-brand-ink hover:border-brand-accent2 hover:text-white transition-colors interactive text-sm font-medium text-center">' +
          label +
        '</a>';
    }

    return '' +
      '<div class="w-full py-3 rounded-lg bg-brand-bg border border-brand-surfaceLight text-brand-muted text-center text-sm font-medium">' +
        label +
      '</div>';
  }

  function renderLiveCards(events) {
    if (!events.length) {
      return renderEmptyState('No upcoming live sprints are published yet.');
    }

    return events.map(function(event) {
      return '' +
        '<div class="glass-card p-8 flex flex-col hover:border-brand-accent2/50 transition-colors">' +
          '<span class="text-xs font-bold tracking-wider uppercase text-brand-accent2 mb-3 block">' +
            escapeHtml(formatDateLabel(event.start_at) + ' • Live') +
          '</span>' +
          '<h4 class="text-xl font-display mb-3 text-brand-ink">' + escapeHtml(event.title || 'Live Sprint') + '</h4>' +
          '<p class="text-brand-muted text-sm leading-relaxed mb-6 flex-grow">' + escapeHtml(event.description || 'Details coming soon.') + '</p>' +
          '<div class="text-brand-accent1 text-sm font-semibold mb-4">' + escapeHtml(formatPrice(event.price_usd)) + '</div>' +
          renderAction(event, 'Join Waitlist') +
        '</div>';
    }).join('');
  }

  function renderOnDemandCards(events) {
    if (!events.length) {
      return renderEmptyState('No on-demand sprints are live yet.');
    }

    return events.map(function(event) {
      return '' +
        '<div class="glass-card p-8 flex flex-col opacity-80 hover:opacity-100 transition-opacity">' +
          '<span class="text-xs font-bold tracking-wider uppercase text-brand-muted mb-3 block">On-demand • Available now</span>' +
          '<h4 class="text-xl font-display mb-3 text-brand-ink">' + escapeHtml(event.title || 'On-demand Sprint') + '</h4>' +
          '<p class="text-brand-muted text-sm leading-relaxed mb-6 flex-grow">' + escapeHtml(event.description || 'Details coming soon.') + '</p>' +
          '<div class="text-brand-accent1 text-sm font-semibold mb-4">' + escapeHtml(formatPrice(event.price_usd)) + '</div>' +
          renderAction(event, 'Access Recording') +
        '</div>';
    }).join('');
  }

  function sortAscendingByStartAt(a, b) {
    var aTime = a && a.start_at ? new Date(a.start_at).getTime() : Number.POSITIVE_INFINITY;
    var bTime = b && b.start_at ? new Date(b.start_at).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  }

  function sortOnDemand(a, b) {
    if (Boolean(b && b.is_featured) !== Boolean(a && a.is_featured)) {
      return Number(Boolean(b && b.is_featured)) - Number(Boolean(a && a.is_featured));
    }

    var aTime = a && a.created_at ? new Date(a.created_at).getTime() : 0;
    var bTime = b && b.created_at ? new Date(b.created_at).getTime() : 0;
    return bTime - aTime;
  }

  async function init(options) {
    var liveRoot = document.getElementById('sprints-live-list');
    var onDemandRoot = document.getElementById('sprints-on-demand-list');

    if (!liveRoot || !onDemandRoot || !window.SthirRuntime) {
      return;
    }

    try {
      var response = await window.SthirRuntime.apiFetch('/events?status=live');
      var events = response && Array.isArray(response.events) ? response.events.filter(Boolean) : [];
      var now = Date.now();
      var liveUpcoming = events.filter(function(event) {
        if (!event || event.format !== 'live') {
          return false;
        }

        if (!event.start_at) {
          return true;
        }

        var startTime = new Date(event.start_at).getTime();
        return !Number.isFinite(startTime) || startTime >= now;
      }).sort(sortAscendingByStartAt);
      var onDemand = events.filter(function(event) {
        return event && event.format === 'on-demand';
      }).sort(sortOnDemand);

      liveRoot.innerHTML = renderLiveCards(liveUpcoming);
      onDemandRoot.innerHTML = renderOnDemandCards(onDemand);

      if (options && typeof options.attachCursorEvents === 'function') {
        options.attachCursorEvents();
      }
    } catch (error) {
      var message = error && error.message ? error.message : 'Please try again soon.';
      liveRoot.innerHTML = renderEmptyState(message);
      onDemandRoot.innerHTML = renderEmptyState(message);
    }
  }

  window.SthirHomeEvents = {
    init: init
  };
})();
