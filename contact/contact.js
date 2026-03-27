(function() {
  var BOOKING_URL = 'https://cal.com/sthireducation/';
  var openers = [
    document.getElementById('open-booking'),
    document.getElementById('open-booking-2')
  ].filter(Boolean);

  if (!openers.length) return;

  openers.forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      openBookingModal(BOOKING_URL);
    });
  });

  function openBookingModal(url) {
    var overlay = document.createElement('div');
    overlay.className = 'booking-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Book a call with Sthir');

    var modal = document.createElement('div');
    modal.className = 'booking-modal';
    modal.tabIndex = -1;

    var header = document.createElement('div');
    header.className = 'booking-header';

    var title = document.createElement('div');
    title.className = 'booking-title';
    title.textContent = 'Book a 30-minute call';

    var actions = document.createElement('div');
    actions.className = 'booking-actions';

    var openNewTab = document.createElement('a');
    openNewTab.className = 'booking-btn';
    openNewTab.href = url;
    openNewTab.target = '_blank';
    openNewTab.rel = 'noopener';
    openNewTab.textContent = 'Open in new tab';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'booking-close';
    closeBtn.setAttribute('aria-label', 'Close booking modal');
    closeBtn.innerHTML = '&times;';

    var iframe = document.createElement('iframe');
    iframe.className = 'booking-iframe';
    iframe.src = url;
    iframe.title = 'Cal.com scheduling';

    actions.appendChild(openNewTab);
    actions.appendChild(closeBtn);
    header.appendChild(title);
    header.appendChild(actions);
    modal.appendChild(header);
    modal.appendChild(iframe);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    var prevActive = document.activeElement;
    document.body.classList.add('no-scroll');
    window.setTimeout(function() { modal.focus(); }, 0);

    function close() {
      document.body.classList.remove('no-scroll');
      overlay.remove();
      if (prevActive && typeof prevActive.focus === 'function') {
        prevActive.focus();
      }
      document.removeEventListener('keydown', onKeydown);
    }

    function onKeydown(ev) {
      if (ev.key === 'Escape') {
        close();
      }
      if (ev.key === 'Tab') {
        trapFocus(ev, modal);
      }
    }

    overlay.addEventListener('click', function(ev) {
      if (ev.target === overlay) {
        close();
      }
    });

    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKeydown);
  }

  function trapFocus(e, container) {
    var focusables = container.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusables.length) return;

    var first = focusables[0];
    var last = focusables[focusables.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      last.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first.focus();
      e.preventDefault();
    }
  }
})();
