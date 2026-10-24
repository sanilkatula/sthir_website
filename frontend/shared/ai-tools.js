(function() {
  var dialog = document.getElementById('ai-tools-dialog');
  var launchers = Array.from(document.querySelectorAll('[data-open-ai-tools]'));
  var primaryLauncher = document.getElementById('open-ai-tools');
  if (primaryLauncher && !launchers.includes(primaryLauncher)) launchers.unshift(primaryLauncher);
  if (!dialog || !launchers.length) return;
  var returnFocus = launchers[0];

  var closeButton = document.getElementById('close-ai-tools');
  var tabs = Array.from(dialog.querySelectorAll('[data-ai-tab]'));
  var forms = Array.from(dialog.querySelectorAll('[data-ai-form]'));
  var status = document.getElementById('ai-tools-status');
  var response = document.getElementById('ai-tools-response');
  var activeTool = 'idea';
  var activeRequest = null;
  var previousOverflow = '';
  var instructions = {
    idea: 'You are a life design coach at Sthir. Provide very brief, structured, and honest feedback on the user\'s idea or plan. Format exactly like this (bold headers):\n**The Strength:** [1 sentence identifying a solid part]\n**The Assumption:** [1 sentence challenging a hidden assumption]\n**The Test:** [1 sentence suggesting a tiny, low-risk test]',
    lens: 'You are a life design coach at Sthir. The user will tell you what is stuck. Reply ONLY with ONE powerful, reframing journal question.'
  };

  function setStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
  }

  function setBusy(busy) {
    response.setAttribute('aria-busy', String(busy));
    dialog.querySelectorAll('[data-ai-form] button, [data-ai-form] textarea').forEach(function(control) {
      control.disabled = busy;
    });
  }

  function cancelRequest() {
    if (!activeRequest) return;
    activeRequest.abort();
    activeRequest = null;
    setBusy(false);
    setStatus('Ready when you are.', 'idle');
  }

  function selectTool(tool) {
    if (tool === activeTool) return;
    cancelRequest();
    activeTool = tool;
    tabs.forEach(function(tab) {
      var selected = tab.dataset.aiTab === tool;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
    response.replaceChildren();
    var placeholder = document.createElement('p');
    placeholder.textContent = 'Share your thoughts, and your reflection will appear here.';
    response.appendChild(placeholder);
    setStatus('Ready when you are.', 'idle');
  }

  // Build text and emphasis nodes so AI output is never interpreted as HTML.
  function renderResponse(content) {
    response.replaceChildren();
    content.split(/\n\s*\n/).forEach(function(text) {
      var paragraph = document.createElement('p');
      var bold = /\*\*(.+?)\*\*/g;
      var position = 0;
      var match;
      while ((match = bold.exec(text)) !== null) {
        paragraph.appendChild(document.createTextNode(text.slice(position, match.index)));
        var strong = document.createElement('strong');
        strong.textContent = match[1];
        paragraph.appendChild(strong);
        position = bold.lastIndex;
      }
      paragraph.appendChild(document.createTextNode(text.slice(position)));
      response.appendChild(paragraph);
    });
  }

  launchers.forEach(function(launcher) {
    launcher.addEventListener('click', function() {
      if (dialog.open) return;
      returnFocus = launcher.dataset.aiReturnFocus
        ? document.getElementById(launcher.dataset.aiReturnFocus) || launcher
        : launcher;
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      document.getElementById('ai-pathway-' + activeTool).focus({ preventScroll: true });
    });
  });

  closeButton.addEventListener('click', function() { dialog.close(); });
  dialog.addEventListener('close', function() {
    cancelRequest();
    document.body.style.overflow = previousOverflow;
    document.body.classList.remove('cursor-hover');
    returnFocus.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', function(event) {
    if (event.target !== dialog) return;
    var bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right ||
        event.clientY < bounds.top || event.clientY > bounds.bottom) {
      dialog.close();
    }
  });

  tabs.forEach(function(tab, index) {
    tab.addEventListener('click', function() { selectTool(tab.dataset.aiTab); });
    tab.addEventListener('keydown', function(event) {
      var next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault();
      selectTool(tabs[next].dataset.aiTab);
      tabs[next].focus();
    });
  });

  forms.forEach(function(form) {
    var input = form.querySelector('textarea');
    form.querySelectorAll('[data-ai-prompt]').forEach(function(button) {
      button.addEventListener('click', function() {
        input.value = button.dataset.aiPrompt;
        input.focus();
      });
    });

    form.addEventListener('submit', async function(event) {
      event.preventDefault();
      if (activeRequest) return;
      var prompt = input.value.trim();
      if (!prompt) {
        setStatus('Add a few words about what’s on your mind first.', 'error');
        input.focus();
        return;
      }

      var controller = new AbortController();
      activeRequest = controller;
      setBusy(true);
      response.replaceChildren();
      setStatus('Thinking with you…', 'loading');
      var timeout = window.setTimeout(function() {
        if (activeRequest !== controller) return;
        controller.abort();
        activeRequest = null;
        setBusy(false);
        setStatus('This is taking longer than expected. Please try again.', 'error');
      }, 45000);

      try {
        if (!window.SthirRuntime) throw new Error('The guide is unavailable right now. Please try again later.');
        var config = await window.SthirRuntime.getRuntimeConfig();
        var url = await window.SthirRuntime.getGroqFunctionUrl();
        if (activeRequest !== controller) return;
        if (!url) throw new Error('The guide is unavailable right now. Please try again later.');
        var headers = { 'Content-Type': 'application/json' };
        if (config.supabaseAnonKey) {
          headers.apikey = config.supabaseAnonKey;
          headers.Authorization = 'Bearer ' + config.supabaseAnonKey;
        }
        var result = await fetch(url, {
          method: 'POST',
          headers: headers,
          signal: controller.signal,
          body: JSON.stringify({ userPrompt: prompt, systemInstruction: instructions[form.dataset.aiForm] })
        });
        var data = await result.json().catch(function() { return null; });
        if (activeRequest !== controller) return;
        if (!result.ok) {
          throw new Error(result.status === 429
            ? 'The guide is busy. Please wait a moment and try again.'
            : 'We couldn’t generate a reflection right now. Please try again in a moment.');
        }
        if (!data || typeof data.content !== 'string' || !data.content.trim()) {
          throw new Error('No reflection came back. Please try again.');
        }
        renderResponse(data.content);
        setStatus('A starting point for your own reflection.', 'success');
      } catch (error) {
        if (activeRequest !== controller) return;
        var message = error instanceof TypeError
            ? 'We couldn’t connect to the guide. Check your connection and try again.'
            : error.message || 'Something went wrong. Please try again.';
        setStatus(message, 'error');
      } finally {
        window.clearTimeout(timeout);
        if (activeRequest === controller) {
          activeRequest = null;
          setBusy(false);
        }
      }
    });
  });
})();
