(function() {
  var state = {
    interests: []
  };

  var elements = {
    interestsBody: document.getElementById('interests-body'),
    pageNote: document.getElementById('page-note'),
    pathwayFilter: document.getElementById('pathway-filter'),
    refreshPage: document.getElementById('refresh-page'),
    searchInput: document.getElementById('search-input'),
    sessionEmail: document.getElementById('session-email'),
    sessionStatus: document.getElementById('session-status'),
    signOut: document.getElementById('sign-out'),
    stageFilter: document.getElementById('stage-filter'),
    statClosed: document.getElementById('stat-closed'),
    statContacted: document.getElementById('stat-contacted'),
    statNew: document.getElementById('stat-new'),
    statQualified: document.getElementById('stat-qualified')
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

  function getFilteredInterests() {
    var query = String(elements.searchInput.value || '').trim().toLowerCase();
    var stage = elements.stageFilter.value;
    var pathway = elements.pathwayFilter.value;

    return state.interests.filter(function(interest) {
      var haystack = [
        interest.name,
        interest.email,
        interest.notes,
        interest.source_page,
        interest.interest_type
      ].join(' ').toLowerCase();

      var matchesQuery = !query || haystack.includes(query);
      var matchesStage = stage === 'all' || interest.stage === stage;
      var matchesPathway = pathway === 'all' || interest.interest_type === pathway;

      return matchesQuery && matchesStage && matchesPathway;
    });
  }

  function renderTable() {
    var rows = getFilteredInterests();

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
            '<div class="admin-row-title">' + window.SthirAdmin.escapeHtml(window.SthirAdmin.formatSelectedPathway(interest)) + '</div>' +
            '<div class="admin-row-subtitle">' + window.SthirAdmin.escapeHtml(interest.source_page || '-') + '</div>' +
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
  elements.pathwayFilter.addEventListener('change', renderTable);

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
