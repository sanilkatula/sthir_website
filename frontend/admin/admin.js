(function(global) {
  var body = document.body;
  var cursorDot = document.querySelector('.cursor-dot');
  var cursorOutline = document.querySelector('.cursor-outline');
  var navbar = document.getElementById('navbar');
  var mobileNavToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  var progressBar = document.getElementById('progress-bar');
  var interactiveSelector = '.interactive, a, button, textarea, input, select, .btn';
  var prefersCoarse = window.matchMedia('(pointer: coarse)').matches;

  var sharedState = {
    adminContext: null,
    client: null,
    config: null
  };

  function createError(message, status) {
    var error = new Error(message);
    error.status = status;
    return error;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(value) {
    if (!value) {
      return '-';
    }

    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  }

  function formatDateTime(value) {
    if (!value) {
      return '-';
    }

    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  }

  function toDateTimeLocal(value) {
    if (!value) {
      return '';
    }

    var date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  }

  function formatPathType(value) {
    var labels = {
      ai: 'AI',
      '4-week': '4-Week',
      '6-week': '6-Week',
      general: 'General'
    };

    return labels[value] || 'General';
  }

  function formatInterestType(value) {
    var labels = {
      pathways: 'Pathways',
      sprints: 'Sprints',
      coaching: 'Coaching',
      general: 'General'
    };

    return labels[value] || 'General';
  }

  function formatSelectedPathway(interest) {
    var pathway = interest && interest.metadata && interest.metadata.selected_pathway;
    var labels = {
      'ai-clarity': 'AI Clarity',
      '4-week': '4-Week',
      '6-week': '6-Week',
      'not-sure': 'Not sure yet'
    };

    return labels[pathway] || formatInterestType(interest && interest.interest_type ? interest.interest_type : 'general');
  }

  function closeMobileNav() {
    if (!mobileNavToggle || !mobileNav) {
      return;
    }

    mobileNavToggle.setAttribute('aria-expanded', 'false');
    mobileNav.classList.remove('is-open');
  }

  function initChrome() {
    if (!prefersCoarse && cursorDot && cursorOutline) {
      window.addEventListener('mousemove', function(e) {
        cursorDot.style.left = e.clientX + 'px';
        cursorDot.style.top = e.clientY + 'px';
        cursorOutline.animate(
          { left: e.clientX + 'px', top: e.clientY + 'px' },
          { duration: 500, fill: 'forwards' }
        );
      });

      document.addEventListener('mouseover', function(e) {
        if (e.target.closest(interactiveSelector)) {
          body.classList.add('cursor-hover');
        }
      });

      document.addEventListener('mouseout', function(e) {
        if (!e.target.closest(interactiveSelector)) {
          return;
        }

        if (!e.relatedTarget || !e.relatedTarget.closest(interactiveSelector)) {
          body.classList.remove('cursor-hover');
        }
      });
    }

    if (mobileNavToggle && mobileNav) {
      mobileNavToggle.addEventListener('click', function() {
        var willOpen = mobileNavToggle.getAttribute('aria-expanded') !== 'true';
        mobileNavToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        mobileNav.classList.toggle('is-open', willOpen);
      });

      mobileNav.querySelectorAll('a').forEach(function(link) {
        link.addEventListener('click', closeMobileNav);
      });

      window.addEventListener('resize', function() {
        if (window.innerWidth >= 1024) {
          closeMobileNav();
        }
      });
    }

    function updateChrome() {
      var scrollTop = window.scrollY || window.pageYOffset;

      if (navbar) {
        navbar.classList.toggle('nav-scrolled', scrollTop > 50);
      }

      if (progressBar) {
        var totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        var width = totalHeight > 0 ? (scrollTop / totalHeight) * 100 : 0;
        progressBar.style.width = Math.max(0, Math.min(100, width)) + '%';
      }
    }

    window.addEventListener('scroll', updateChrome, { passive: true });
    window.addEventListener('resize', updateChrome);
    updateChrome();
  }

  async function getConfig() {
    if (sharedState.config) {
      return sharedState.config;
    }

    if (!window.SthirRuntime || typeof window.SthirRuntime.getRuntimeConfig !== 'function') {
      throw new Error('Runtime config is unavailable.');
    }

    sharedState.config = await window.SthirRuntime.getRuntimeConfig();

    if (!sharedState.config.supabaseUrl || !sharedState.config.supabaseAnonKey) {
      throw new Error('Add SUPABASE_URL and SUPABASE_ANON_KEY in frontend/config.json or frontend/.env before using admin.');
    }

    return sharedState.config;
  }

  async function getClient() {
    if (sharedState.client) {
      return sharedState.client;
    }

    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('Supabase browser client is unavailable.');
    }

    var config = await getConfig();
    sharedState.client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return sharedState.client;
  }

  async function getSession() {
    var client = await getClient();
    var result = await client.auth.getSession();

    if (result.error) {
      throw result.error;
    }

    return result.data.session;
  }

  async function signIn(email, password) {
    var client = await getClient();
    var result = await client.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (result.error) {
      throw result.error;
    }

    sharedState.adminContext = null;
    return result.data.session;
  }

  async function signOut(options) {
    var client = await getClient();
    var result = await client.auth.signOut();

    if (result.error) {
      throw result.error;
    }

    sharedState.adminContext = null;
    if (options && options.redirectTo) {
      window.location.href = options.redirectTo;
    }
  }

  async function api(path, options) {
    var request = options || {};
    var session = request.session || await getSession();

    if (!session) {
      throw createError('Please sign in.', 401);
    }

    var nextOptions = Object.assign({}, request);
    delete nextOptions.session;

    return window.SthirRuntime.apiFetch(path, Object.assign(nextOptions, {
      token: session.access_token
    }));
  }

  async function ensureAdmin(options) {
    var settings = options || {};
    var session = await getSession();

    if (!session) {
      if (settings.redirectTo) {
        window.location.href = settings.redirectTo;
        return null;
      }

      throw createError('Please sign in.', 401);
    }

    if (
      sharedState.adminContext &&
      sharedState.adminContext.session &&
      sharedState.adminContext.session.access_token === session.access_token
    ) {
      return sharedState.adminContext;
    }

    var meResponse = await api('/admin/me', { session: session });

    if (!meResponse.user || !meResponse.user.is_admin) {
      if (settings.redirectTo) {
        window.location.href = settings.redirectTo;
        return null;
      }

      throw createError('Admin access is required.', 403);
    }

    sharedState.adminContext = {
      client: await getClient(),
      config: await getConfig(),
      me: meResponse.user,
      session: session
    };

    return sharedState.adminContext;
  }

  async function onAuthStateChange(callback) {
    var client = await getClient();
    return client.auth.onAuthStateChange(function(_event, session) {
      if (!session) {
        sharedState.adminContext = null;
      } else if (
        sharedState.adminContext &&
        sharedState.adminContext.session &&
        sharedState.adminContext.session.access_token !== session.access_token
      ) {
        sharedState.adminContext = null;
      }
      callback(session);
    });
  }

  initChrome();

  global.SthirAdmin = {
    api: api,
    ensureAdmin: ensureAdmin,
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    formatDateTime: formatDateTime,
    formatInterestType: formatInterestType,
    formatPathType: formatPathType,
    formatSelectedPathway: formatSelectedPathway,
    getClient: getClient,
    getConfig: getConfig,
    getSession: getSession,
    onAuthStateChange: onAuthStateChange,
    signIn: signIn,
    signOut: signOut,
    toDateTimeLocal: toDateTimeLocal
  };
})(window);
