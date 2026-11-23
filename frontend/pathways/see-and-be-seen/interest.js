(function() {
  'use strict';

  var form = document.getElementById('email-series-interest');
  if (!form) return;
  var nameInput = form.querySelector('[name="name"]');
  var emailInput = form.querySelector('[name="email"]');
  var submit = form.querySelector('button[type="submit"]');
  var status = document.getElementById('email-series-status');
  var pending = false;

  function showStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
  }

  if (!window.SthirRuntime || typeof window.SthirRuntime.apiFetch !== 'function') {
    showStatus('Registration could not load. Please refresh the page or contact shalu@sthir.education.', 'error');
    return;
  }

  form.addEventListener('submit', function(event) {
    event.preventDefault();
    if (pending) return;
    showStatus('', '');
    emailInput.removeAttribute('aria-invalid');
    if (!form.reportValidity()) return;

    var email = emailInput.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showStatus('Enter a valid email address.', 'error');
      emailInput.setAttribute('aria-invalid', 'true');
      emailInput.focus();
      return;
    }

    var name = nameInput.value.trim() || email.split('@')[0].replace(/[._-]+/g, ' ');
    pending = true;
    submit.disabled = true;
    submit.textContent = 'Saving…';
    form.setAttribute('aria-busy', 'true');

    window.SthirRuntime.apiFetch('/interests', {
      method: 'POST',
      body: {
        name: name,
        email: email,
        interest_type: 'pathways',
        source_page: 'pathways/see-and-be-seen',
        notes: 'Interest in the See, and Be Seen! 12-day email series.',
        metadata: {
          selected_pathway: 'see-and-be-seen',
          series_title: 'See, and Be Seen!',
          form_location: 'email-series',
          page_path: window.location.pathname,
          consent_to_contact: true
        }
      }
    }).then(function(data) {
      if (!data || !data.interest || !data.interest.id) throw new Error('Interest was not confirmed.');
      form.reset();
      showStatus('Thank you! We’ve saved your interest in See, and Be Seen! We’ll be in touch by email.', 'success');
    }).catch(function() {
      showStatus('We couldn’t save your interest. Please try again, or email shalu@sthir.education.', 'error');
    }).finally(function() {
      pending = false;
      submit.disabled = false;
      submit.textContent = 'Register interest';
      form.setAttribute('aria-busy', 'false');
    });
  });

  submit.disabled = false;
})();
