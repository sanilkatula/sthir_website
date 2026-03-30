(function() {
  var state = {
    isLoadingHome: false
  };

  var elements = {
    adminHomeGrid: document.getElementById('admin-home-grid'),
    adminNote: document.getElementById('admin-note'),
    eventsCount: document.getElementById('events-count'),
    interestsCount: document.getElementById('interests-count'),
    loginForm: document.getElementById('login-form'),
    loginSubmit: document.getElementById('login-submit'),
    refreshHome: document.getElementById('refresh-home'),
    sessionEmail: document.getElementById('session-email'),
    sessionStatus: document.getElementById('session-status'),
    signOut: document.getElementById('sign-out'),
    usersCount: document.getElementById('users-count')
  };

  function setNote(message, type) {
    if (!message) {
      elements.adminNote.textContent = '';
      elements.adminNote.className = 'admin-note hidden';
      return;
    }

    elements.adminNote.textContent = message;
    elements.adminNote.className = 'admin-note admin-note--' + (type || 'info');
  }

  function setBusy(isBusy) {
    elements.loginSubmit.disabled = isBusy;
    elements.refreshHome.disabled = isBusy;
    elements.signOut.disabled = isBusy;
  }

  function renderSignedOut() {
    elements.loginForm.classList.remove('hidden');
    elements.adminHomeGrid.classList.add('hidden');
    elements.sessionStatus.textContent = 'Not signed in';
    elements.sessionEmail.textContent = '-';
    elements.usersCount.textContent = '0';
    elements.eventsCount.textContent = '0';
    elements.interestsCount.textContent = '0';
    elements.refreshHome.disabled = true;
    elements.signOut.disabled = true;
  }

  function renderCounts(users, events, interests) {
    elements.usersCount.textContent = String(users.length);
    elements.eventsCount.textContent = String(events.length);
    elements.interestsCount.textContent = String(interests.length);
  }

  async function loadHome() {
    if (state.isLoadingHome) {
      return;
    }

    state.isLoadingHome = true;
    setBusy(true);
    setNote('Checking admin access...', 'info');

    try {
      var context = await window.SthirAdmin.ensureAdmin();
      elements.sessionStatus.textContent = 'Signed in';
      elements.sessionEmail.textContent = context.me.email || context.session.user.email;
      elements.loginForm.classList.add('hidden');

      var results = await Promise.all([
        window.SthirAdmin.api('/admin/users'),
        window.SthirAdmin.api('/admin/events'),
        window.SthirAdmin.api('/admin/interests')
      ]);

      renderCounts(
        results[0].users || [],
        results[1].events || [],
        results[2].interests || []
      );

      elements.adminHomeGrid.classList.remove('hidden');
      elements.refreshHome.disabled = false;
      elements.signOut.disabled = false;
      setNote('Signed in as admin. Choose a workspace below.', 'success');
    } catch (error) {
      elements.adminHomeGrid.classList.add('hidden');
      if (error && error.status === 401) {
        renderSignedOut();
        setNote('', 'info');
      } else {
        elements.sessionStatus.textContent = 'Signed in';
        setNote(error && error.message ? error.message : 'Unable to load admin home.', 'error');
      }
    } finally {
      state.isLoadingHome = false;
      setBusy(false);
    }
  }

  elements.loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    setNote('', 'info');
    setBusy(true);

    var formData = new FormData(elements.loginForm);

    window.SthirAdmin.signIn(
      String(formData.get('email') || ''),
      String(formData.get('password') || '')
    ).then(function() {
      elements.loginForm.reset();
    }).catch(function(error) {
      setNote(error && error.message ? error.message : 'Unable to sign in.', 'error');
    }).finally(function() {
      setBusy(false);
    });
  });

  elements.refreshHome.addEventListener('click', function() {
    loadHome();
  });

  elements.signOut.addEventListener('click', function() {
    window.SthirAdmin.signOut({ redirectTo: './' });
  });

  window.SthirAdmin.onAuthStateChange(function(session) {
    if (!session) {
      renderSignedOut();
      return;
    }

    loadHome();
  }).catch(function(error) {
    setNote(error && error.message ? error.message : 'Unable to initialize admin home.', 'error');
  });
})();
