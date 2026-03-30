(function() {
  var state = {
    me: null,
    users: []
  };

  var elements = {
    pageNote: document.getElementById('page-note'),
    refreshPage: document.getElementById('refresh-page'),
    roleFilter: document.getElementById('role-filter'),
    searchInput: document.getElementById('search-input'),
    sessionEmail: document.getElementById('session-email'),
    sessionStatus: document.getElementById('session-status'),
    signOut: document.getElementById('sign-out'),
    sortFilter: document.getElementById('sort-filter'),
    statAdmins: document.getElementById('stat-admins'),
    statMembers: document.getElementById('stat-members'),
    statNewest: document.getElementById('stat-newest'),
    statTotal: document.getElementById('stat-total'),
    usersBody: document.getElementById('users-body')
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
    var admins = state.users.filter(function(user) { return user.is_admin; }).length;
    var members = state.users.length - admins;
    var newest = state.users.length ? state.users[0].created_at : '';

    elements.statTotal.textContent = String(state.users.length);
    elements.statAdmins.textContent = String(admins);
    elements.statMembers.textContent = String(members);
    elements.statNewest.textContent = newest ? window.SthirAdmin.formatDate(newest) : '-';
  }

  function getFilteredUsers() {
    var query = String(elements.searchInput.value || '').trim().toLowerCase();
    var role = elements.roleFilter.value;
    var sort = elements.sortFilter.value;

    var rows = state.users.filter(function(user) {
      var matchesQuery = !query || [
        user.full_name,
        user.email
      ].join(' ').toLowerCase().includes(query);

      var matchesRole = role === 'all' ||
        (role === 'admin' && user.is_admin) ||
        (role === 'member' && !user.is_admin);

      return matchesQuery && matchesRole;
    });

    rows.sort(function(a, b) {
      var left = new Date(a.created_at || 0).getTime();
      var right = new Date(b.created_at || 0).getTime();
      return sort === 'oldest' ? left - right : right - left;
    });

    return rows;
  }

  function renderTable() {
    var rows = getFilteredUsers();

    if (!rows.length) {
      elements.usersBody.innerHTML = '<tr class="admin-empty-row"><td colspan="5">No users match the current filters.</td></tr>';
      return;
    }

    elements.usersBody.innerHTML = rows.map(function(user) {
      var isCurrentUser = state.me && state.me.id === user.id;
      var actionHtml = user.is_admin
        ? '<span class="admin-row-subtitle">Admin access active</span>'
        : '<button class="btn interactive admin-inline-btn" data-action="make-admin" data-user-id="' + window.SthirAdmin.escapeHtml(user.id) + '">Make admin</button>';

      return '' +
        '<tr>' +
          '<td>' +
            '<div class="admin-row-title">' + window.SthirAdmin.escapeHtml(user.full_name || 'Sthir member') + '</div>' +
            (isCurrentUser ? '<div class="admin-row-subtitle">Current session</div>' : '') +
          '</td>' +
          '<td>' + window.SthirAdmin.escapeHtml(user.email || '-') + '</td>' +
          '<td><span class="admin-tag ' + (user.is_admin ? 'admin-tag--success' : 'admin-tag--muted') + '">' +
            (user.is_admin ? 'Admin' : 'Member') +
          '</span></td>' +
          '<td>' + window.SthirAdmin.escapeHtml(window.SthirAdmin.formatDate(user.created_at)) + '</td>' +
          '<td>' + actionHtml + '</td>' +
        '</tr>';
    }).join('');
  }

  async function loadUsers() {
    setPageNote('Loading users...', 'info');

    try {
      var context = await window.SthirAdmin.ensureAdmin({ redirectTo: '../' });
      if (!context) {
        return;
      }

      state.me = context.me;
      setSession(context.me);
      var response = await window.SthirAdmin.api('/admin/users');
      state.users = response.users || [];
      renderStats();
      renderTable();
      setPageNote('Users loaded. Existing admins can be searched here, but not removed.', 'success');
    } catch (error) {
      setPageNote(error && error.message ? error.message : 'Unable to load users.', 'error');
    }
  }

  elements.refreshPage.addEventListener('click', function() {
    loadUsers();
  });

  elements.signOut.addEventListener('click', function() {
    window.SthirAdmin.signOut({ redirectTo: '../' });
  });

  elements.searchInput.addEventListener('input', renderTable);
  elements.roleFilter.addEventListener('change', renderTable);
  elements.sortFilter.addEventListener('change', renderTable);

  elements.usersBody.addEventListener('click', function(event) {
    var button = event.target.closest('[data-action="make-admin"]');
    if (!button) {
      return;
    }

    window.SthirAdmin.api('/admin/users/' + button.getAttribute('data-user-id'), {
      method: 'PATCH',
      body: {
        is_admin: true
      }
    }).then(function() {
      setPageNote('User promoted to admin.', 'success');
      return loadUsers();
    }).catch(function(error) {
      setPageNote(error && error.message ? error.message : 'Unable to update user role.', 'error');
    });
  });

  window.SthirAdmin.onAuthStateChange(function(session) {
    if (!session) {
      window.location.href = '../';
    }
  }).catch(function(error) {
    setPageNote(error && error.message ? error.message : 'Unable to initialize users workspace.', 'error');
  });

  loadUsers();
})();
