(function(global) {
  var configPromise = null;
  var runtimeScript = document.currentScript;
  var runtimeScriptUrl = runtimeScript && runtimeScript.src ? runtimeScript.src : '';

  function trimTrailingSlash(value) {
    return String(value || '').replace(/\/+$/, '');
  }

  function discoverSiteRootUrl() {
    if (runtimeScriptUrl) {
      return trimTrailingSlash(new URL('../', runtimeScriptUrl).toString());
    }

    return trimTrailingSlash(window.location.origin || '');
  }

  function joinUrl(base, path) {
    var normalizedBase = trimTrailingSlash(base);
    var normalizedPath = String(path || '').trim();

    if (!normalizedPath) {
      return normalizedBase;
    }

    if (/^https?:\/\//i.test(normalizedPath)) {
      return normalizedPath;
    }

    return normalizedBase + (normalizedPath.startsWith('/') ? normalizedPath : '/' + normalizedPath);
  }

  function normalizeConfig(data) {
    var payload = data || {};
    var supabaseUrl = trimTrailingSlash(payload.supabaseUrl || payload.SUPABASE_URL || '');
    var apiBaseUrl = trimTrailingSlash(payload.apiBaseUrl || payload.BACKEND_API_URL || '');
    var groqFunctionUrl = trimTrailingSlash(payload.groqFunctionUrl || payload.GROQ_EDGE_FUNCTION_URL || '');

    return {
      apiBaseUrl: apiBaseUrl || (supabaseUrl ? joinUrl(supabaseUrl, '/functions/v1/api') : 'http://127.0.0.1:4000/api'),
      supabaseUrl: supabaseUrl,
      supabaseAnonKey: payload.supabaseAnonKey || payload.SUPABASE_ANON_KEY || '',
      groqFunctionUrl: groqFunctionUrl || (supabaseUrl ? joinUrl(supabaseUrl, '/functions/v1/groq-proxy') : '')
    };
  }

  function fetchConfig(url, allowMissing) {
    return fetch(url, { cache: 'no-store' })
      .then(function(response) {
        if (allowMissing && response.status === 404) {
          return null;
        }

        return response.json().catch(function() { return null; }).then(function(data) {
          if (!response.ok) {
            if (allowMissing) {
              return null;
            }

            throw new Error(data && data.error ? data.error : 'Unable to load site config.');
          }

          return data;
        });
      })
      .catch(function(error) {
        if (allowMissing) {
          return null;
        }

        throw error;
      });
  }

  function getRuntimeConfig() {
    if (!configPromise) {
      configPromise = (function() {
        if (global.__STHIR_CONFIG__) {
          return Promise.resolve(normalizeConfig(global.__STHIR_CONFIG__));
        }

        var siteRootUrl = discoverSiteRootUrl();
        var staticConfigUrl = joinUrl(siteRootUrl, '/config.json');
        var serverConfigUrl = joinUrl(siteRootUrl, '/api/config');

        return fetchConfig(staticConfigUrl, true).then(function(staticConfig) {
          if (staticConfig) {
            return normalizeConfig(staticConfig);
          }

          return fetchConfig(serverConfigUrl, true).then(function(serverConfig) {
            return normalizeConfig(serverConfig || {});
          });
        });
      })();
    }

    return configPromise;
  }

  function getGroqFunctionUrl(config) {
    if (config.groqFunctionUrl) {
      return config.groqFunctionUrl;
    }

    if (config.supabaseUrl) {
      return joinUrl(config.supabaseUrl, '/functions/v1/groq-proxy');
    }

    return '';
  }

  function apiFetch(path, options) {
    var request = options || {};

    return getRuntimeConfig().then(function(config) {
      var headers = Object.assign({}, request.headers || {});

      if (request.body !== undefined && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      if (request.token) {
        headers.Authorization = 'Bearer ' + request.token;
      }

      return fetch(joinUrl(config.apiBaseUrl, path), {
        method: request.method || 'GET',
        headers: headers,
        body: request.body === undefined ? undefined : JSON.stringify(request.body)
      }).then(function(response) {
        return response.json().catch(function() { return null; }).then(function(data) {
          if (!response.ok) {
            var error = new Error(data && data.error ? data.error : 'Request failed.');
            error.status = response.status;
            error.data = data;
            throw error;
          }

          return data;
        });
      });
    });
  }

  global.SthirRuntime = {
    apiFetch: apiFetch,
    getGroqFunctionUrl: function() {
      return getRuntimeConfig().then(getGroqFunctionUrl);
    },
    getRuntimeConfig: getRuntimeConfig,
    getSiteRootUrl: discoverSiteRootUrl,
    joinUrl: joinUrl
  };
})(window);
