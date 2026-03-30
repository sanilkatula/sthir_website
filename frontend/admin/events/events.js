(function() {
  var state = {
    editingEventId: '',
    events: []
  };

  var elements = {
    eventForm: document.getElementById('event-form'),
    eventFormHelper: document.getElementById('event-form-helper'),
    eventFormMode: document.getElementById('event-form-mode'),
    eventModal: document.getElementById('event-modal'),
    eventNote: document.getElementById('event-note'),
    eventsBody: document.getElementById('events-body'),
    openCreateEvent: document.getElementById('open-create-event'),
    pageNote: document.getElementById('page-note'),
    pathFilter: document.getElementById('path-filter'),
    refreshPage: document.getElementById('refresh-page'),
    resetEventForm: document.getElementById('reset-event-form'),
    saveEvent: document.getElementById('save-event'),
    searchInput: document.getElementById('search-input'),
    sessionEmail: document.getElementById('session-email'),
    sessionStatus: document.getElementById('session-status'),
    signOut: document.getElementById('sign-out'),
    statArchived: document.getElementById('stat-archived'),
    statDraft: document.getElementById('stat-draft'),
    statLive: document.getElementById('stat-live'),
    statTotal: document.getElementById('stat-total'),
    statusFilter: document.getElementById('status-filter')
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

  function setEventNote(message, type) {
    if (!message) {
      elements.eventNote.textContent = '';
      elements.eventNote.className = 'admin-inline-note hidden';
      return;
    }

    elements.eventNote.textContent = message;
    elements.eventNote.className = 'admin-inline-note admin-inline-note--' + (type || 'info');
  }

  function getField(name) {
    return elements.eventForm ? elements.eventForm.elements.namedItem(name) : null;
  }

  function setFieldValue(name, value) {
    var field = getField(name);
    if (field) {
      field.value = value;
    }
  }

  function setFieldChecked(name, checked) {
    var field = getField(name);
    if (field && 'checked' in field) {
      field.checked = Boolean(checked);
    }
  }

  function resetEventForm() {
    state.editingEventId = '';
    elements.eventForm.reset();
    setFieldValue('price_usd', '0');
    setFieldValue('cta_label', 'Join Waitlist');
    elements.eventFormMode.textContent = 'Create a new event';
    elements.eventFormHelper.textContent = 'Add a new event to the library, then publish it when it is ready.';
    setEventNote('', 'info');
  }

  function setSession(me) {
    elements.sessionStatus.textContent = 'Signed in';
    elements.sessionEmail.textContent = me.email || '-';
  }

  function formatEventFormat(value) {
    var labels = {
      cohort: 'Cohort',
      live: 'Live',
      'on-demand': 'On-demand'
    };

    return labels[value] || 'Cohort';
  }

  function getFilteredEvents() {
    var query = String(elements.searchInput.value || '').trim().toLowerCase();
    var statusFilter = elements.statusFilter.value;
    var pathFilter = elements.pathFilter.value;

    return state.events.filter(function(event) {
      var matchesQuery = !query || [
        event.title,
        event.slug,
        event.description,
        event.location
      ].join(' ').toLowerCase().includes(query);

      var matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      var matchesPath = pathFilter === 'all' || event.path_type === pathFilter;

      return matchesQuery && matchesStatus && matchesPath;
    });
  }

  function renderStats() {
    var total = state.events.length;
    var live = state.events.filter(function(event) { return event.status === 'live'; }).length;
    var draft = state.events.filter(function(event) { return event.status === 'draft'; }).length;
    var archived = state.events.filter(function(event) { return event.status === 'archived'; }).length;

    elements.statTotal.textContent = String(total);
    elements.statLive.textContent = String(live);
    elements.statDraft.textContent = String(draft);
    elements.statArchived.textContent = String(archived);
  }

  function renderTable() {
    var rows = getFilteredEvents();

    if (!rows.length) {
      elements.eventsBody.innerHTML = '<tr class="admin-empty-row"><td colspan="7">No events match the current filters.</td></tr>';
      return;
    }

    elements.eventsBody.innerHTML = rows.map(function(event) {
      return '' +
        '<tr>' +
          '<td>' +
            '<div class="admin-row-title">' + window.SthirAdmin.escapeHtml(event.title || 'Untitled event') + '</div>' +
            '<div class="admin-row-subtitle">' + window.SthirAdmin.escapeHtml(event.slug || '-') + '</div>' +
          '</td>' +
          '<td><span class="admin-tag">' + window.SthirAdmin.escapeHtml(window.SthirAdmin.formatPathType(event.path_type)) + '</span></td>' +
          '<td><span class="admin-tag admin-tag--muted">' + window.SthirAdmin.escapeHtml(formatEventFormat(event.format)) + '</span></td>' +
          '<td><span class="admin-tag ' + (event.status === 'live' ? 'admin-tag--success' : 'admin-tag--muted') + '">' +
            window.SthirAdmin.escapeHtml(event.status || 'draft') +
          '</span></td>' +
          '<td>' + window.SthirAdmin.escapeHtml(window.SthirAdmin.formatDateTime(event.start_at)) + '</td>' +
          '<td>' + window.SthirAdmin.escapeHtml(event.price_usd > 0 ? '$' + Number(event.price_usd).toLocaleString('en-US') : 'Free') + '</td>' +
          '<td>' +
            '<div class="admin-inline-actions">' +
              '<button type="button" class="btn interactive admin-inline-btn" data-action="edit-event" data-event-id="' + window.SthirAdmin.escapeHtml(event.id) + '">Edit</button>' +
              '<button type="button" class="btn interactive admin-inline-btn admin-danger" data-action="delete-event" data-event-id="' + window.SthirAdmin.escapeHtml(event.id) + '">Delete</button>' +
            '</div>' +
          '</td>' +
        '</tr>';
    }).join('');
  }

  function openEventModal() {
    if (!elements.eventModal) {
      return;
    }

    elements.eventModal.classList.remove('hidden');
    elements.eventModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    window.setTimeout(function() {
      var titleField = getField('title');
      if (titleField) {
        titleField.focus();
      }
    }, 60);
  }

  function closeEventModal() {
    if (!elements.eventModal) {
      return;
    }

    elements.eventModal.classList.add('hidden');
    elements.eventModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    resetEventForm();
  }

  function populateEventForm(event) {
    state.editingEventId = event.id;
    setFieldValue('title', event.title || '');
    setFieldValue('slug', event.slug || '');
    setFieldValue('description', event.description || '');
    setFieldValue('format', event.format || 'cohort');
    setFieldValue('path_type', event.path_type || 'general');
    setFieldValue('status', event.status || 'draft');
    setFieldValue('price_usd', String(event.price_usd || 0));
    setFieldValue('start_at', window.SthirAdmin.toDateTimeLocal(event.start_at));
    setFieldValue('end_at', window.SthirAdmin.toDateTimeLocal(event.end_at));
    setFieldValue('cta_label', event.cta_label || 'Join Waitlist');
    setFieldValue('cta_url', event.cta_url || '');
    setFieldValue('location', event.location || '');
    setFieldChecked('is_featured', event.is_featured);
    elements.eventFormMode.textContent = 'Edit event';
    elements.eventFormHelper.textContent = 'Update details for "' + (event.title || 'this event') + '" and save to refresh the library.';
    setEventNote('Editing an existing event. Save to update it.', 'info');
    openEventModal();
  }

  function getEventPayload() {
    return {
      title: getField('title').value,
      slug: getField('slug').value,
      description: getField('description').value,
      format: getField('format').value,
      path_type: getField('path_type').value,
      status: getField('status').value,
      price_usd: Number(getField('price_usd').value || 0),
      start_at: getField('start_at').value ? new Date(getField('start_at').value).toISOString() : '',
      end_at: getField('end_at').value ? new Date(getField('end_at').value).toISOString() : '',
      cta_label: getField('cta_label').value,
      cta_url: getField('cta_url').value,
      location: getField('location').value,
      is_featured: getField('is_featured').checked
    };
  }

  async function loadEvents(options) {
    if (!options || !options.preserveNote) {
      setPageNote('Loading events...', 'info');
    }

    try {
      var context = await window.SthirAdmin.ensureAdmin({ redirectTo: '../' });
      if (!context) {
        return;
      }

      setSession(context.me);
      var response = await window.SthirAdmin.api('/admin/events');
      state.events = response.events || [];
      renderStats();
      renderTable();
      setPageNote(
        options && options.message
          ? options.message
          : 'Events loaded. Live ai / 4-week / 6-week / general events appear on the Pathways page.',
        'success'
      );
    } catch (error) {
      setPageNote(error && error.message ? error.message : 'Unable to load events.', 'error');
    }
  }

  elements.eventForm.addEventListener('submit', function(event) {
    event.preventDefault();
    setEventNote('Saving event...', 'info');
    elements.saveEvent.disabled = true;

    var payload = getEventPayload();
    var isEditing = Boolean(state.editingEventId);
    var request = state.editingEventId
      ? window.SthirAdmin.api('/admin/events/' + state.editingEventId, { method: 'PATCH', body: payload })
      : window.SthirAdmin.api('/admin/events', { method: 'POST', body: payload });

    request.then(function() {
      closeEventModal();
      return loadEvents({
        preserveNote: true,
        message: isEditing ? 'Event updated successfully.' : 'Event created successfully.'
      });
    }).catch(function(error) {
      setEventNote(error && error.message ? error.message : 'Unable to save event.', 'error');
    }).finally(function() {
      elements.saveEvent.disabled = false;
    });
  });

  elements.resetEventForm.addEventListener('click', function() {
    resetEventForm();
  });

  if (elements.openCreateEvent) {
    elements.openCreateEvent.addEventListener('click', function() {
      try {
        resetEventForm();
        openEventModal();
      } catch (error) {
        setPageNote(error && error.message ? error.message : 'Unable to open the event editor.', 'error');
      }
    });
  }

  document.querySelectorAll('[data-close-event-modal]').forEach(function(node) {
    node.addEventListener('click', closeEventModal);
  });

  elements.refreshPage.addEventListener('click', function() {
    loadEvents();
  });

  elements.signOut.addEventListener('click', function() {
    window.SthirAdmin.signOut({ redirectTo: '../' });
  });

  elements.searchInput.addEventListener('input', renderTable);
  elements.statusFilter.addEventListener('change', renderTable);
  elements.pathFilter.addEventListener('change', renderTable);

  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && elements.eventModal && !elements.eventModal.classList.contains('hidden')) {
      closeEventModal();
    }
  });

  elements.eventsBody.addEventListener('click', function(event) {
    var button = event.target.closest('[data-action]');
    if (!button) {
      return;
    }

    var action = button.getAttribute('data-action');
    var eventId = button.getAttribute('data-event-id');
    var selectedEvent = state.events.find(function(item) {
      return item.id === eventId;
    });

    if (!selectedEvent) {
      return;
    }

    if (action === 'edit-event') {
      try {
        populateEventForm(selectedEvent);
      } catch (error) {
        setPageNote(error && error.message ? error.message : 'Unable to open this event for editing.', 'error');
      }
      return;
    }

    if (action === 'delete-event') {
      if (!window.confirm('Delete "' + selectedEvent.title + '"?')) {
        return;
      }

      window.SthirAdmin.api('/admin/events/' + eventId, { method: 'DELETE' })
        .then(function() {
          if (state.editingEventId === eventId) {
            closeEventModal();
          }
          return loadEvents({
            preserveNote: true,
            message: 'Event deleted successfully.'
          });
        })
        .catch(function(error) {
          setPageNote(error && error.message ? error.message : 'Unable to delete event.', 'error');
        });
    }
  });

  window.SthirAdmin.onAuthStateChange(function(session) {
    if (!session) {
      window.location.href = '../';
    }
  }).catch(function(error) {
    setPageNote(error && error.message ? error.message : 'Unable to initialize events workspace.', 'error');
  });

  resetEventForm();
  loadEvents();
})();
