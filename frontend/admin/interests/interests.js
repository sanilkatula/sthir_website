(function() {
  var state = {
    interests: [],
    interestTypeFilter: 'all',
    sortKey: 'created_at',
    sortDirection: 'desc'
  };

  var elements = {
    interestsBody: document.getElementById('interests-body'),
    interestTypeButtons: Array.prototype.slice.call(document.querySelectorAll('[data-interest-type-filter]')),
    pageNote: document.getElementById('page-note'),
    refreshPage: document.getElementById('refresh-page'),
    searchInput: document.getElementById('search-input'),
    sessionEmail: document.getElementById('session-email'),
    sessionStatus: document.getElementById('session-status'),
    signOut: document.getElementById('sign-out'),
    stageFilter: document.getElementById('stage-filter'),
    statClosed: document.getElementById('stat-closed'),
    statContacted: document.getElementById('stat-contacted'),
    statNew: document.getElementById('stat-new'),
    statQualified: document.getElementById('stat-qualified'),
    sortButtons: Array.prototype.slice.call(document.querySelectorAll('.admin-sort-button'))
  };

  function setPageNote(message, type) {
    if (!message) {
      elements.pageNote.textContent = '';
      elements.pageNote.className = 'admin-note hidden';
      return;
    }

    elements.pageNote.textContent = message;
    elements.pageNote.className = 'admin-note admin-note--' + (type || 'info');
  }

  function setSession(me) {
    elements.sessionStatus.textContent = 'Signed in';
    elements.sessionEmail.textContent = me.email || '-';
  }

  function renderStats() {
    function countStage(stage) {
      return state.interests.filter(function(interest) {
        return interest.stage === stage;
      }).length;
    }

    elements.statNew.textContent = String(countStage('new'));
    elements.statContacted.textContent = String(countStage('contacted'));
    elements.statQualified.textContent = String(countStage('qualified'));
    elements.statClosed.textContent = String(countStage('closed'));
  }

  function getTimeValue(value, fallback) {
    var time = value ? new Date(value).getTime() : Number.NaN;
    return Number.isFinite(time) ? time : fallback;
  }

  function compareText(left, right) {
    return String(left || '').localeCompare(String(right || ''), undefined, {
      sensitivity: 'base',
      numeric: true
    });
  }

  function formatInterestType(value) {
    return window.SthirAdmin.formatInterestType
      ? window.SthirAdmin.formatInterestType(value)
      : String(value || 'general');
  }

  function getInterestDetail(interest) {
    var source = interest && interest.source_page ? 'Source: ' + interest.source_page : 'Source: direct';
    var selectedPathway = window.SthirAdmin.formatSelectedPathway(interest);
    var interestType = formatInterestType(interest && interest.interest_type);

    if (selectedPathway && selectedPathway !== interestType) {
      return 'Selected: ' + selectedPathway + ' • ' + source;
    }

    return source;
  }

  function getDefaultSortDirection(key) {
    return key === 'created_at' ? 'desc' : 'asc';
  }

  function updateInterestTypeButtons() {
    elements.interestTypeButtons.forEach(function(button) {
      var value = button.getAttribute('data-interest-type-filter');
      var isActive = value === state.interestTypeFilter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function updateSortButtons() {
    elements.sortButtons.forEach(function(button) {
      var key = button.getAttribute('data-sort-key');
      var indicator = button.querySelector('.admin-sort-indicator');
      var isActive = key === state.sortKey;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');

      if (indicator) {
        indicator.textContent = isActive ? (state.sortDirection === 'asc' ? '↑' : '↓') : '↕';
      }
    });
  }

  function applySort(key) {
    if (!key) {
      return;
    }

    if (state.sortKey === key) {
      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = key;
      state.sortDirection = getDefaultSortDirection(key);
    }

    renderTable();
  }

  function getFilteredInterests() {
    var query = String(elements.searchInput.value || '').trim().toLowerCase();
    var stage = elements.stageFilter.value;
    var interestType = state.interestTypeFilter;
    var rows = state.interests.filter(function(interest) {
      var haystack = [
        interest.name,
        interest.email,
        interest.notes,
        interest.source_page,
        interest.interest_type,
        formatInterestType(interest.interest_type),
        window.SthirAdmin.formatSelectedPathway(interest),
        interest && interest.metadata ? interest.metadata.selected_pathway : ''
      ].join(' ').toLowerCase();

      var matchesQuery = !query || haystack.includes(query);
      var matchesStage = stage === 'all' || interest.stage === stage;
      var matchesInterestType = interestType === 'all' || interest.interest_type === interestType;

      return matchesQuery && matchesStage && matchesInterestType;
    });

    rows.sort(function(left, right) {
      var sortDirection = state.sortDirection === 'desc' ? -1 : 1;
      var result = 0;

      if (state.sortKey === 'created_at') {
        result = getTimeValue(left.created_at, Number.POSITIVE_INFINITY) - getTimeValue(right.created_at, Number.POSITIVE_INFINITY);
      } else if (state.sortKey === 'name') {
        result = compareText(left.name, right.name);
      } else if (state.sortKey === 'interest_type') {
        result = compareText(formatInterestType(left.interest_type), formatInterestType(right.interest_type));
      } else if (state.sortKey === 'notes') {
        result = compareText(left.notes, right.notes);
      } else if (state.sortKey === 'stage') {
        result = compareText(left.stage, right.stage);
      }

      if (result === 0) {
        result = compareText(left.name, right.name);
      }

      return result * sortDirection;
    });

    return rows;
  }

  function renderTable() {
    var rows = getFilteredInterests();
    updateInterestTypeButtons();
    updateSortButtons();

    if (!rows.length) {
      elements.interestsBody.innerHTML = '<tr class="admin-empty-row"><td colspan="6">No interest submissions match the current filters.</td></tr>';
      return;
    }

    elements.interestsBody.innerHTML = rows.map(function(interest) {
      return '' +
        '<tr data-interest-id="' + window.SthirAdmin.escapeHtml(interest.id) + '">' +
          '<td>' +
            '<div class="admin-row-title">' + window.SthirAdmin.escapeHtml(interest.name || 'Unknown') + '</div>' +
            '<div class="admin-row-subtitle">' + window.SthirAdmin.escapeHtml(interest.email || '-') + '</div>' +
          '</td>' +
          '<td>' +
            '<div class="admin-row-title">' + window.SthirAdmin.escapeHtml(formatInterestType(interest.interest_type)) + '</div>' +
            '<div class="admin-row-subtitle">' + window.SthirAdmin.escapeHtml(getInterestDetail(interest)) + '</div>' +
          '</td>' +
          '<td>' + window.SthirAdmin.escapeHtml(interest.notes || 'No notes') + '</td>' +
          '<td>' +
            '<select class="admin-inline-select interactive" data-role="interest-stage">' +
              ['new', 'contacted', 'qualified', 'closed'].map(function(stage) {
                return '<option value="' + stage + '"' + (interest.stage === stage ? ' selected' : '') + '>' + stage + '</option>';
              }).join('') +
            '</select>' +
          '</td>' +
          '<td>' + window.SthirAdmin.escapeHtml(window.SthirAdmin.formatDate(interest.created_at)) + '</td>' +
          '<td><button class="btn interactive admin-inline-btn" data-action="save-interest" data-interest-id="' + window.SthirAdmin.escapeHtml(interest.id) + '">Save</button></td>' +
        '</tr>';
    }).join('');
  }

  async function loadInterests() {
    setPageNote('Loading interests...', 'info');

    try {
      var context = await window.SthirAdmin.ensureAdmin({ redirectTo: '../' });
      if (!context) {
        return;
      }

      setSession(context.me);
      var response = await window.SthirAdmin.api('/admin/interests');
      state.interests = response.interests || [];
      renderStats();
      renderTable();
      setPageNote('Interest submissions loaded.', 'success');
    } catch (error) {
      setPageNote(error && error.message ? error.message : 'Unable to load interests.', 'error');
    }
  }

  elements.refreshPage.addEventListener('click', function() {
    loadInterests();
  });

  elements.signOut.addEventListener('click', function() {
    window.SthirAdmin.signOut({ redirectTo: '../' });
  });

  elements.searchInput.addEventListener('input', renderTable);
  elements.stageFilter.addEventListener('change', renderTable);
  elements.interestTypeButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      state.interestTypeFilter = button.getAttribute('data-interest-type-filter') || 'all';
      renderTable();
    });
  });
  elements.sortButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      applySort(button.getAttribute('data-sort-key'));
    });
  });

  elements.interestsBody.addEventListener('click', function(event) {
    var button = event.target.closest('[data-action="save-interest"]');
    if (!button) {
      return;
    }

    var row = button.closest('tr');
    var stageSelect = row ? row.querySelector('[data-role="interest-stage"]') : null;
    if (!row || !stageSelect) {
      return;
    }

    window.SthirAdmin.api('/admin/interests/' + button.getAttribute('data-interest-id'), {
      method: 'PATCH',
      body: {
        stage: stageSelect.value
      }
    }).then(function() {
      setPageNote('Interest updated.', 'success');
      return loadInterests();
    }).catch(function(error) {
      setPageNote(error && error.message ? error.message : 'Unable to update interest.', 'error');
    });
  });

  window.SthirAdmin.onAuthStateChange(function(session) {
    if (!session) {
      window.location.href = '../';
    }
  }).catch(function(error) {
    setPageNote(error && error.message ? error.message : 'Unable to initialize interests workspace.', 'error');
  });

  loadInterests();
})();
