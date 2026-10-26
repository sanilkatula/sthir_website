(function() {
  var dialog = document.getElementById('muscle-dialog');
  var triggers = Array.from(document.querySelectorAll('[data-muscle][aria-controls="muscle-dialog"]'));
  if (!dialog || !triggers.length) return;

  var closeButton = document.getElementById('close-muscle-dialog');
  var actionButton = document.getElementById('muscle-dialog-action');
  var title = document.getElementById('muscle-dialog-title');
  var tagline = document.getElementById('muscle-dialog-tagline');
  var description = document.getElementById('muscle-dialog-description');
  var prompt = document.getElementById('muscle-dialog-prompt');
  var icon = document.getElementById('muscle-dialog-icon');
  var activeMuscle = null;
  var previousOverflow = '';
  var nextAction = null;

  var muscles = {
    clarity: {
      title: 'Clarity',
      tagline: 'See what is actually there.',
      description: 'Pause, separate what you know from what you assume, and notice what matters to you.',
      prompt: 'What do I know for sure, and what am I filling in?',
      action: 'Take the 30-sec Clarity Check'
    },
    courage: {
      title: 'Courage',
      tagline: 'Act when the next step is hard.',
      description: 'Try a small real-world experiment, learn from what happens, and build confidence through action.',
      prompt: 'What is one small step I can take before I feel fully ready?',
      action: 'Explore Sthir Pathways'
    },
    choice: {
      title: 'Conscious choice',
      tagline: 'Choose intentionally and own it.',
      description: 'Weigh the trade-offs, hear other perspectives, and make a choice that reflects what matters to you.',
      prompt: 'What am I choosing, and what am I willing to stand behind?',
      action: 'See how we work'
    }
  };

  triggers.forEach(function(trigger) {
    trigger.addEventListener('click', function() {
      var key = trigger.dataset.muscle;
      var muscle = muscles[key];
      if (!muscle || dialog.open) return;
      activeMuscle = key;
      nextAction = null;
      dialog.dataset.muscle = key;
      title.textContent = muscle.title;
      tagline.textContent = muscle.tagline;
      description.textContent = muscle.description;
      prompt.textContent = muscle.prompt;
      actionButton.textContent = muscle.action;
      icon.replaceChildren(trigger.querySelector('svg').cloneNode(true));
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
    });
  });

  closeButton.addEventListener('click', function() { dialog.close(); });
  dialog.addEventListener('close', function() {
    document.body.style.overflow = previousOverflow;
    var action = nextAction;
    nextAction = null;
    if (action) action();
  });
  dialog.addEventListener('click', function(event) {
    if (event.target !== dialog) return;
    var bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) {
      dialog.close();
    }
  });

  actionButton.addEventListener('click', function() {
    if (!dialog.open) return;
    var selected = activeMuscle;
    // Run the next step after close has restored scrolling, so opening the
    // clarity assessment can apply its own scroll lock without a race.
    nextAction = function() {
      if (selected === 'clarity') {
        document.getElementById('open-clarity-hero').click();
        document.getElementById('close-clarity').focus({ preventScroll: true });
      } else if (selected === 'courage') {
        window.location.assign('./pathways/');
      } else if (selected === 'choice') {
        var offerings = document.getElementById('offerings');
        offerings.scrollIntoView({ block: 'start' });
        offerings.tabIndex = -1;
        offerings.focus({ preventScroll: true });
      }
    };
    dialog.close();
  });
})();
