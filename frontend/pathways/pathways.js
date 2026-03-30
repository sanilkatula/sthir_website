(function() {
  var body = document.body;
  var cursorDot = document.querySelector('.cursor-dot');
  var cursorOutline = document.querySelector('.cursor-outline');
  var navbar = document.getElementById('navbar');
  var mobileNavToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  var progressBar = document.getElementById('progress-bar');
  var interactiveSelector = '.interactive, a, button, textarea, input, select, .btn';
  var prefersCoarse = window.matchMedia('(pointer: coarse)').matches;
  var openUpcomingFilters = document.getElementById('open-upcoming-filters');
  var openOnDemandFilters = document.getElementById('open-ondemand-filters');
  var openPastFilters = document.getElementById('open-past-filters');
  var sessionFilterModal = document.getElementById('session-filter-modal');
  var sessionFilterKicker = document.getElementById('session-filter-kicker');
  var sessionFilterTitle = document.getElementById('session-filter-title');
  var upcomingFilterActiveCount = document.getElementById('upcoming-filter-active-count');
  var upcomingRoot = document.getElementById('upcoming-sessions');
  var upcomingCount = document.getElementById('upcoming-count');
  var ondemandFilterActiveCount = document.getElementById('ondemand-filter-active-count');
  var ondemandRoot = document.getElementById('ondemand-sessions');
  var ondemandCount = document.getElementById('ondemand-count');
  var pastFilterActiveCount = document.getElementById('past-filter-active-count');
  var pastRoot = document.getElementById('past-sessions');
  var pastCount = document.getElementById('past-count');
  var sessionSearch = document.getElementById('session-search');
  var sessionPathwayFilter = document.getElementById('session-pathway-filter');
  var sessionFormatFilter = document.getElementById('session-format-filter');
  var sessionDisplayFilter = document.getElementById('session-display-filter');
  var sessionFilterNote = document.getElementById('session-filter-note');
  var interestModal = document.getElementById('interest-modal');
  var interestForm = document.getElementById('pathway-interest-form');
  var selectedPathwayInput = document.getElementById('selected-pathway');
  var interestPrice = document.getElementById('interest-modal-price');
  var interestSubmit = document.getElementById('interest-submit');
  var interestSuccess = document.getElementById('interest-success');
  var interestError = document.getElementById('interest-error');
  var allEvents = [];
  var activeFilterPanel = 'upcoming';
  var sectionFilters = {
    upcoming: createDefaultFilters(),
    ondemand: createDefaultFilters(),
    past: createDefaultFilters()
  };

  function createDefaultFilters() {
    return {
      search: '',
      pathway: 'all',
      format: 'all',
      display: 'smart'
    };
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function hideInterestMessages() {
    if (interestSuccess) {
      interestSuccess.classList.add('hidden');
    }
    if (interestError) {
      interestError.classList.add('hidden');
    }
  }

  if (!prefersCoarse && cursorDot && cursorOutline) {
    window.addEventListener('mousemove', function(e) {
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top = e.clientY + 'px';
      cursorOutline.animate(
        { left: e.clientX + 'px', top: e.clientY + 'px' },
        { duration: 500, fill: 'forwards' }
      );
    });

    document.addEventListener('mouseover', function(e) {
      if (e.target.closest(interactiveSelector)) {
        body.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', function(e) {
      if (!e.target.closest(interactiveSelector)) {
        return;
      }

      if (!e.relatedTarget || !e.relatedTarget.closest(interactiveSelector)) {
        body.classList.remove('cursor-hover');
      }
    });
  }

  function closeMobileNav() {
    if (!mobileNavToggle || !mobileNav) {
      return;
    }

    mobileNavToggle.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
  }

  if (mobileNavToggle && mobileNav) {
    mobileNavToggle.addEventListener('click', function() {
      var willOpen = mobileNavToggle.getAttribute('aria-expanded') !== 'true';
      mobileNavToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      mobileNav.classList.toggle('is-open', willOpen);
    });

    mobileNav.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', closeMobileNav);
    });

    window.addEventListener('resize', function() {
      if (window.innerWidth >= 1024) {
        closeMobileNav();
      }
    });
  }

  function updateChrome() {
    var scrollTop = window.scrollY || window.pageYOffset;

    if (navbar) {
      navbar.classList.toggle('nav-scrolled', scrollTop > 50);
    }

    if (progressBar) {
      var totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      var width = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;
      progressBar.style.width = Math.max(0, Math.min(100, width)) + '%';
    }
  }

  window.addEventListener('scroll', updateChrome, { passive: true });
  window.addEventListener('resize', updateChrome);
  updateChrome();

  function formatDateTime(value) {
    if (!value) {
      return 'Date coming soon';
    }

    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return 'Date coming soon';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  function formatPathType(value) {
    var labels = {
      ai: 'AI Pathway',
      '4-week': '4 Week Cohort',
      '6-week': '6 Week Cohort',
      general: 'General Pathway'
    };

    return labels[value] || 'Pathway';
  }

  function formatEventFormat(value) {
    var labels = {
      cohort: 'Cohort',
      live: 'Live',
      'on-demand': 'On-demand'
    };

    return labels[value] || 'Session';
  }

  function formatPrice(value) {
    var amount = Number(value || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return 'Free';
    }

    return '$' + amount.toLocaleString('en-US');
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

  function renderEventAction(event) {
    var ctaUrl = event && event.cta_url ? event.cta_url : '';
    var label = event && event.cta_label ? escapeHtml(event.cta_label) : '';

    if (ctaUrl && label) {
      return '' +
        '<a class="w-full py-3 rounded-lg bg-brand-bg border border-brand-surfaceLight text-brand-ink hover:border-brand-accent2 hover:text-white transition-colors interactive text-sm font-medium text-center" href="' + escapeHtml(ctaUrl) + '" target="_blank" rel="noopener">' +
          label +
        '</a>';
    }

    return '';
  }

  function getEventCardMeta(event, sectionTitle) {
    if (!event) {
      return {
        cardClass: 'event-card glass-card p-8 flex flex-col',
        kickerClass: 'text-xs font-bold tracking-wider uppercase text-brand-muted mb-3 block',
        kicker: 'Session'
      };
    }

    if (event.format === 'on-demand') {
      return {
        cardClass: 'event-card event-card--ondemand glass-card p-8 flex flex-col opacity-80 hover:opacity-100 transition-opacity',
        kickerClass: 'text-xs font-bold tracking-wider uppercase text-brand-muted mb-3 block',
        kicker: 'On-demand • Available now'
      };
    }

    if (sectionTitle === 'Past Sessions') {
      return {
        cardClass: 'event-card event-card--past glass-card p-8 flex flex-col hover:border-brand-surfaceLight transition-colors',
        kickerClass: 'text-xs font-bold tracking-wider uppercase text-brand-muted mb-3 block',
        kicker: formatDateLabel(event.start_at) + ' • Past session'
      };
    }

    return {
      cardClass: 'event-card event-card--upcoming glass-card p-8 flex flex-col hover:border-brand-accent2/50 transition-colors',
      kickerClass: 'text-xs font-bold tracking-wider uppercase text-brand-accent2 mb-3 block',
      kicker: formatDateLabel(event.start_at) + ' • ' + formatEventFormat(event.format)
    };
  }

  function renderSessionList(root, title, events) {
    if (!root) {
      return;
    }

    if (!events.length) {
      root.innerHTML = '' +
        '<article class="glass-card event-card event-card--empty p-8 text-center text-brand-muted md:col-span-2 lg:col-span-3">' +
          '<p>No ' + escapeHtml(title.toLowerCase()) + ' right now.</p>' +
        '</article>';
      return;
    }

    root.innerHTML = events.map(function(event) {
      var eventMeta = getEventCardMeta(event, title);
      return '' +
        '<article class="' + eventMeta.cardClass + '">' +
          '<span class="' + eventMeta.kickerClass + '">' + escapeHtml(eventMeta.kicker) + '</span>' +
          '<h3 class="text-xl font-display mb-3 text-brand-ink">' + escapeHtml(event.title || 'Session') + '</h3>' +
          '<p class="text-brand-muted text-sm leading-relaxed mb-6 flex-grow">' + escapeHtml(event.description || 'More details coming soon.') + '</p>' +
          '<div class="text-brand-accent1 text-sm font-semibold mb-4">' + escapeHtml(formatPrice(event.price_usd)) + '</div>' +
          renderEventAction(event) +
        '</article>';
    }).join('');
  }

  function splitSessions(events) {
    var now = Date.now();
    var upcoming = [];
    var ondemand = [];
    var past = [];

    events.forEach(function(event) {
      if (event && event.format === 'on-demand') {
        ondemand.push(event);
        return;
      }

      var startTime = event.start_at ? new Date(event.start_at).getTime() : Number.NaN;
      var isPast = event.status === 'archived' || (Number.isFinite(startTime) ? startTime < now : false);

      if (isPast) {
        past.push(event);
      } else {
        upcoming.push(event);
      }
    });

    upcoming.sort(function(a, b) {
      return new Date(a.start_at || 0).getTime() - new Date(b.start_at || 0).getTime();
    });

    ondemand.sort(function(a, b) {
      if (Boolean(b && b.is_featured) !== Boolean(a && a.is_featured)) {
        return Number(Boolean(b && b.is_featured)) - Number(Boolean(a && a.is_featured));
      }

      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    past.sort(function(a, b) {
      return new Date(b.start_at || 0).getTime() - new Date(a.start_at || 0).getTime();
    });

    return {
      upcoming: upcoming,
      ondemand: ondemand,
      past: past
    };
  }

  function normalizeSearchText(value) {
    return String(value || '').toLowerCase();
  }

  function countActiveFilters(filters) {
    var count = 0;

    if (filters.search) {
      count += 1;
    }
    if (filters.pathway !== 'all') {
      count += 1;
    }
    if (filters.format !== 'all') {
      count += 1;
    }
    if (filters.display !== 'smart') {
      count += 1;
    }

    return count;
  }

  function updateFilterTrigger(button, badge, filters) {
    if (!button || !badge) {
      return;
    }

    var activeCount = countActiveFilters(filters);
    button.classList.toggle('is-active', activeCount > 0);
    badge.textContent = String(activeCount);
    badge.classList.toggle('hidden', activeCount === 0);
  }

  function buildSectionView(events, filters) {
    var rawSearch = String(filters.search || '').trim();
    var search = normalizeSearchText(rawSearch);
    var pathway = filters.pathway || 'all';
    var format = filters.format || 'all';
    var display = filters.display || 'smart';
    var filtered = events.filter(function(event) {
      if (!event) {
        return false;
      }

      var matchesPathway = pathway === 'all' || event.path_type === pathway;
      var matchesFormat = format === 'all' || event.format === format;
      var searchHaystack = normalizeSearchText([
        event.title,
        event.description,
        event.location,
        formatPathType(event.path_type),
        formatEventFormat(event.format)
      ].join(' '));
      var matchesSearch = !search || searchHaystack.indexOf(search) !== -1;

      return matchesPathway && matchesFormat && matchesSearch;
    });
    var hasFocusedFilter = Boolean(rawSearch) || pathway !== 'all' || format !== 'all';
    var limitToRecent = display !== 'all' && !hasFocusedFilter;

    return {
      rawSearch: rawSearch,
      filtered: filtered,
      hasFocusedFilter: hasFocusedFilter,
      limitToRecent: limitToRecent,
      visible: limitToRecent ? filtered.slice(0, 6) : filtered
    };
  }

  function updateModalCopy(sectionName, view) {
    if (!sessionFilterKicker || !sessionFilterTitle || !sessionFilterNote) {
      return;
    }

    var label = {
      upcoming: 'Upcoming',
      ondemand: 'On-demand',
      past: 'Past'
    }[sectionName] || 'Upcoming';

    sessionFilterKicker.textContent = label + ' Filters';
    sessionFilterTitle.textContent = 'Refine ' + label + ' Sessions';

    if (!allEvents.length) {
      sessionFilterNote.textContent = 'No sessions have been published yet.';
      return;
    }

    if (!view.filtered.length) {
      sessionFilterNote.textContent = 'No ' + label.toLowerCase() + ' sessions match these filters right now.';
      return;
    }

    if (view.limitToRecent) {
      sessionFilterNote.textContent = 'Default view shows the latest six ' + label.toLowerCase() + ' sessions. Use filters or Show all results to expand the list.';
      return;
    }

    if (view.hasFocusedFilter) {
      sessionFilterNote.textContent = 'Showing all matching ' + label.toLowerCase() + ' sessions for your current filters.';
      return;
    }

    sessionFilterNote.textContent = 'Showing all ' + label.toLowerCase() + ' sessions right now.';
  }

  function syncModalControlsFromState() {
    var filters = sectionFilters[activeFilterPanel];

    if (sessionSearch) {
      sessionSearch.value = filters.search;
    }
    if (sessionPathwayFilter) {
      sessionPathwayFilter.value = filters.pathway;
    }
    if (sessionFormatFilter) {
      sessionFormatFilter.value = filters.format;
    }
    if (sessionDisplayFilter) {
      sessionDisplayFilter.value = filters.display;
    }
  }

  function applyEventFilters() {
    if (!upcomingRoot || !ondemandRoot || !pastRoot) {
      return;
    }

    var sessions = splitSessions(allEvents);
    var upcomingView = buildSectionView(sessions.upcoming, sectionFilters.upcoming);
    var ondemandView = buildSectionView(sessions.ondemand, sectionFilters.ondemand);
    var pastView = buildSectionView(sessions.past, sectionFilters.past);

    if (upcomingCount) {
      upcomingCount.textContent = String(upcomingView.visible.length);
    }

    if (ondemandCount) {
      ondemandCount.textContent = String(ondemandView.visible.length);
    }

    if (pastCount) {
      pastCount.textContent = String(pastView.visible.length);
    }

    renderSessionList(upcomingRoot, 'Upcoming Sessions', upcomingView.visible);
    renderSessionList(ondemandRoot, 'On-demand Sessions', ondemandView.visible);
    renderSessionList(pastRoot, 'Past Sessions', pastView.visible);
    updateFilterTrigger(openUpcomingFilters, upcomingFilterActiveCount, sectionFilters.upcoming);
    updateFilterTrigger(openOnDemandFilters, ondemandFilterActiveCount, sectionFilters.ondemand);
    updateFilterTrigger(openPastFilters, pastFilterActiveCount, sectionFilters.past);
    updateModalCopy(
      activeFilterPanel,
      activeFilterPanel === 'past'
        ? pastView
        : activeFilterPanel === 'ondemand'
          ? ondemandView
          : upcomingView
    );
  }

  function loadEvents() {
    if (!window.SthirRuntime || !upcomingRoot || !ondemandRoot || !pastRoot) {
      return;
    }

    window.SthirRuntime.apiFetch('/events')
      .then(function(data) {
        allEvents = data && Array.isArray(data.events) ? data.events.filter(Boolean) : [];
        applyEventFilters();
      })
      .catch(function(error) {
        var message = error && error.message ? error.message : 'Please try again soon.';

        upcomingRoot.innerHTML = '' +
          '<article class="glass-card event-card event-card--empty p-8 text-center text-brand-muted md:col-span-2 lg:col-span-3">' +
            '<p>' + escapeHtml(message) + '</p>' +
          '</article>';

        ondemandRoot.innerHTML = '' +
          '<article class="glass-card event-card event-card--empty p-8 text-center text-brand-muted md:col-span-2 lg:col-span-3">' +
            '<p>' + escapeHtml(message) + '</p>' +
          '</article>';

        pastRoot.innerHTML = '' +
          '<article class="glass-card event-card event-card--empty p-8 text-center text-brand-muted md:col-span-2 lg:col-span-3">' +
            '<p>' + escapeHtml(message) + '</p>' +
          '</article>';

        if (sessionFilterNote) {
          sessionFilterNote.textContent = message;
        }
      });
  }

  function openSessionFilterModal(sectionName) {
    if (!sessionFilterModal) {
      return;
    }

    activeFilterPanel = sectionName;
    syncModalControlsFromState();
    applyEventFilters();
    sessionFilterModal.classList.remove('hidden');
    sessionFilterModal.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');

    window.setTimeout(function() {
      if (sessionSearch) {
        sessionSearch.focus();
      }
    }, 60);
  }

  function closeSessionFilterModal() {
    if (!sessionFilterModal) {
      return;
    }

    sessionFilterModal.classList.add('hidden');
    sessionFilterModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('no-scroll');
  }

  function resetSessionFilters() {
    sectionFilters[activeFilterPanel] = createDefaultFilters();
    syncModalControlsFromState();
    applyEventFilters();
  }

  function syncActivePanelFilters() {
    sectionFilters[activeFilterPanel] = {
      search: String(sessionSearch && sessionSearch.value || '').trim(),
      pathway: sessionPathwayFilter ? sessionPathwayFilter.value : 'all',
      format: sessionFormatFilter ? sessionFormatFilter.value : 'all',
      display: sessionDisplayFilter ? sessionDisplayFilter.value : 'smart'
    };

    applyEventFilters();
  }

  function openInterestModal(pathway, price) {
    if (!interestModal || !selectedPathwayInput) {
      return;
    }

    selectedPathwayInput.value = pathway;
    if (interestPrice) {
      interestPrice.textContent = pathway === '4-week'
        ? '4 Week Cohort • ' + price
        : '6 Week Cohort • ' + price;
    }

    hideInterestMessages();
    interestModal.classList.remove('hidden');
    interestModal.setAttribute('aria-hidden', 'false');
    body.classList.add('no-scroll');
  }

  function closeInterestModal() {
    if (!interestModal) {
      return;
    }

    interestModal.classList.add('hidden');
    interestModal.setAttribute('aria-hidden', 'true');
    body.classList.remove('no-scroll');
  }

  document.querySelectorAll('[data-open-interest]').forEach(function(button) {
    button.addEventListener('click', function() {
      openInterestModal(
        button.getAttribute('data-open-interest') || '',
        button.getAttribute('data-price') || ''
      );
    });
  });

  document.querySelectorAll('[data-close-interest]').forEach(function(node) {
    node.addEventListener('click', closeInterestModal);
  });

  if (openUpcomingFilters) {
    openUpcomingFilters.addEventListener('click', function() {
      openSessionFilterModal('upcoming');
    });
  }

  if (openOnDemandFilters) {
    openOnDemandFilters.addEventListener('click', function() {
      openSessionFilterModal('ondemand');
    });
  }

  if (openPastFilters) {
    openPastFilters.addEventListener('click', function() {
      openSessionFilterModal('past');
    });
  }

  document.querySelectorAll('[data-close-session-filters]').forEach(function(node) {
    node.addEventListener('click', closeSessionFilterModal);
  });

  if (document.getElementById('close-session-filters')) {
    document.getElementById('close-session-filters').addEventListener('click', closeSessionFilterModal);
  }

  if (document.getElementById('reset-session-filters')) {
    document.getElementById('reset-session-filters').addEventListener('click', resetSessionFilters);
  }

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeSessionFilterModal();
      closeInterestModal();
    }
  });

  [
    sessionSearch,
    sessionPathwayFilter,
    sessionFormatFilter,
    sessionDisplayFilter
  ].forEach(function(control) {
    if (!control) {
      return;
    }

    control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', syncActivePanelFilters);
  });

  if (interestForm && window.SthirRuntime) {
    interestForm.addEventListener('submit', function(event) {
      event.preventDefault();
      hideInterestMessages();

      var formData = new FormData(interestForm);
      var selectedPathway = String(formData.get('selected_pathway') || '');
      var payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        interest_type: 'pathways',
        source_page: 'pathways',
        notes: formData.get('message'),
        metadata: {
          selected_pathway: selectedPathway
        }
      };

      interestSubmit.disabled = true;
      interestSubmit.textContent = 'Sending...';

      window.SthirRuntime.apiFetch('/interests', {
        method: 'POST',
        body: payload
      }).then(function() {
        interestForm.reset();
        selectedPathwayInput.value = selectedPathway;
        interestSuccess.classList.remove('hidden');
        window.setTimeout(closeInterestModal, 900);
      }).catch(function() {
        interestError.classList.remove('hidden');
      }).finally(function() {
        interestSubmit.disabled = false;
        interestSubmit.textContent = 'Send Interest';
      });
    });
  }

  loadEvents();
})();
