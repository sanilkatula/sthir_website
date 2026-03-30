(function() {
  if (!window.SthirRuntime || typeof window.SthirRuntime.apiFetch !== 'function') {
    return;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function toTitleCase(value) {
    return String(value || '')
      .split(/\s+/)
      .filter(Boolean)
      .map(function(part) {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join(' ');
  }

  function deriveNameFromEmail(email) {
    var localPart = String(email || '').split('@')[0] || 'Sthir visitor';
    return toTitleCase(localPart.replace(/[._-]+/g, ' ')) || 'Sthir visitor';
  }

  function getPageLabel() {
    var path = String(window.location.pathname || '/')
      .replace(/\/index\.html$/i, '/')
      .replace(/\/+$/, '');

    if (!path || path === '/') {
      return 'home';
    }

    return path.split('/').filter(Boolean).join('-');
  }

  function createFooterNote(form) {
    var note = form.parentNode && form.parentNode.querySelector('.site-footer-note');
    if (note) {
      return note;
    }

    note = document.createElement('p');
    note.className = 'site-footer-note hidden';
    note.setAttribute('aria-live', 'polite');
    form.insertAdjacentElement('afterend', note);
    return note;
  }

  function setFooterNote(note, message, type) {
    if (!note) {
      return;
    }

    if (!message) {
      note.textContent = '';
      note.className = 'site-footer-note hidden';
      return;
    }

    note.textContent = message;
    note.className = 'site-footer-note site-footer-note--' + (type || 'info');
  }

  function bindFooterForm(form) {
    if (!form || form.dataset.interestBound === 'true') {
      return;
    }

    var emailInput = form.querySelector('input[type="email"]');
    var submitButton = form.querySelector('button[type="submit"], button');
    var note = createFooterNote(form);

    if (!emailInput || !submitButton) {
      return;
    }

    form.dataset.interestBound = 'true';
    form.addEventListener('submit', function(event) {
      event.preventDefault();

      var email = String(emailInput.value || '').trim();
      setFooterNote(note, '', 'info');

      if (!isValidEmail(email)) {
        setFooterNote(note, 'Enter a valid email address to join the loop.', 'error');
        emailInput.focus();
        return;
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';

      window.SthirRuntime.apiFetch('/interests', {
        method: 'POST',
        body: {
          name: deriveNameFromEmail(email),
          email: email,
          interest_type: 'general',
          source_page: getPageLabel(),
          notes: 'Footer interest submission',
          metadata: {
            form_location: 'footer',
            page_path: window.location.pathname || '/',
            selected_pathway: 'general'
          }
        }
      }).then(function() {
        form.reset();
        setFooterNote(note, 'Thanks. We will stay in touch.', 'success');
      }).catch(function() {
        setFooterNote(note, 'We could not save that right now. Please try again soon.', 'error');
      }).finally(function() {
        submitButton.disabled = false;
        submitButton.textContent = 'Join';
      });
    });
  }

  function bindContactForm(form) {
    if (!form || form.dataset.interestBound === 'true') {
      return;
    }

    var sendBtn = document.getElementById('send-btn');
    var nameInput = document.getElementById('name');
    var emailInput = document.getElementById('email');
    var msgInput = document.getElementById('message');
    var nameErr = document.getElementById('name-error');
    var emailErr = document.getElementById('email-error');
    var msgErr = document.getElementById('message-error');
    var successEl = document.getElementById('contact-success');
    var errorEl = document.getElementById('contact-error');

    if (!sendBtn || !nameInput || !emailInput || !msgInput || !nameErr || !emailErr || !msgErr || !successEl || !errorEl) {
      return;
    }

    function resetErrors() {
      [nameInput, emailInput, msgInput].forEach(function(input) {
        input.classList.remove('error');
      });
      [nameErr, emailErr, msgErr].forEach(function(el) {
        el.classList.add('hidden');
      });
      successEl.classList.add('hidden');
      errorEl.classList.add('hidden');
    }

    form.dataset.interestBound = 'true';
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      resetErrors();

      var name = String(nameInput.value || '').trim();
      var email = String(emailInput.value || '').trim();
      var message = String(msgInput.value || '').trim();
      var hasError = false;

      if (!name) {
        nameInput.classList.add('error');
        nameErr.classList.remove('hidden');
        hasError = true;
      }

      if (!isValidEmail(email)) {
        emailInput.classList.add('error');
        emailErr.classList.remove('hidden');
        hasError = true;
      }

      if (!message) {
        msgInput.classList.add('error');
        msgErr.classList.remove('hidden');
        hasError = true;
      }

      if (hasError) {
        return;
      }

      sendBtn.disabled = true;
      sendBtn.textContent = 'Sending...';

      window.SthirRuntime.apiFetch('/interests', {
        method: 'POST',
        body: {
          name: name,
          email: email,
          interest_type: 'general',
          source_page: 'contact',
          notes: message,
          metadata: {
            form_location: 'contact-page',
            page_path: window.location.pathname || '/',
            selected_pathway: 'general'
          }
        }
      }).then(function() {
        form.reset();
        successEl.classList.remove('hidden');
      }).catch(function() {
        errorEl.classList.remove('hidden');
      }).finally(function() {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Message';
      });
    });

    document.querySelectorAll('.form-group input, .form-group textarea').forEach(function(input) {
      input.addEventListener('blur', function() {
        this.classList.toggle('filled', !!this.value.trim());
      });
    });
  }

  bindFooterForm(document.querySelector('footer#contact form'));
  bindContactForm(document.querySelector('.contact-page-form'));
})();
