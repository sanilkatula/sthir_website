const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DEFAULT_FILE = 'index.html';
const CONTENT_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

const localEnv = loadLocalEnv();
const env = { ...localEnv, ...process.env };
const HOST = env.HOST || '127.0.0.1';
const PORT = Number(env.PORT) || 3000;

function loadLocalEnv() {
  const envPath = path.join(ROOT_DIR, '.env');

  try {
    const raw = fs.readFileSync(envPath, 'utf8').trim();
    if (!raw) {
      return {};
    }

    const parsed = {};

    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      parsed[key] = value;
    }

    return parsed;
  } catch (error) {
    return {};
  }
}

function buildPublicConfig() {
  const supabaseUrl = (env.SUPABASE_URL || '').trim();
  const apiBaseUrl = (env.BACKEND_API_URL || (supabaseUrl ? `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/api` : 'http://127.0.0.1:4000/api')).trim();
  const supabaseAnonKey = (env.SUPABASE_ANON_KEY || '').trim();
  const groqFunctionUrl = (
    env.GROQ_EDGE_FUNCTION_URL ||
    (supabaseUrl ? `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/groq-proxy` : '')
  ).trim();

  return {
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ''),
    supabaseUrl: supabaseUrl.replace(/\/+$/, ''),
    supabaseAnonKey,
    groqFunctionUrl
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

async function serveStaticFile(pathname, res) {
  let relativePath = decodeURIComponent(pathname);

  if (relativePath === '/') {
    relativePath = `/${DEFAULT_FILE}`;
  }

  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    let stats = await fs.promises.stat(filePath);

    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
      stats = await fs.promises.stat(filePath);
    }

    if (path.basename(filePath).startsWith('.')) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    const contentType = CONTENT_TYPES[extension] || 'application/octet-stream';
    const file = await fs.promises.readFile(filePath);

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': extension === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(file);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (requestUrl.pathname === '/api/config') {
    sendJson(res, 200, buildPublicConfig());
    return;
  }

  await serveStaticFile(requestUrl.pathname, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Sthir website running at http://${HOST}:${PORT}`);
});
