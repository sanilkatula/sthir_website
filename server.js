const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const DEFAULT_FILE = 'hybrid_positive_framing.html';
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

    if (!raw.includes('=')) {
      return { GROQ_API_KEY: raw };
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

function getGroqApiKey() {
  return (env.GROQ_API_KEY || '').trim();
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(new Error('Invalid JSON body.'));
      }
    });

    req.on('error', reject);
  });
}

async function handleGroqProxy(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  const apiKey = getGroqApiKey();
  if (!apiKey) {
    return sendJson(res, 500, {
      error: 'Missing GROQ_API_KEY in sthir_website/.env.'
    });
  }

  let body;
  try {
    body = await readJsonBody(req);
  } catch (error) {
    return sendJson(res, 400, { error: error.message });
  }

  const userPrompt = typeof body.userPrompt === 'string' ? body.userPrompt.trim() : '';
  const systemInstruction =
    typeof body.systemInstruction === 'string' ? body.systemInstruction.trim() : '';

  if (!userPrompt || !systemInstruction) {
    return sendJson(res, 400, {
      error: 'Both userPrompt and systemInstruction are required.'
    });
  }

  const payload = {
    model: 'llama-3.1-8b-instant',
    messages: [
      { role: 'system', content: systemInstruction },
      { role: 'user', content: userPrompt }
    ],
    temperature: 1,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: false,
    stop: null
  };

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return sendJson(res, response.status, {
        error: data && data.error && data.error.message
          ? data.error.message
          : 'Groq request failed.'
      });
    }

    return sendJson(res, 200, {
      content: data && data.choices && data.choices[0] && data.choices[0].message
        ? data.choices[0].message.content
        : 'Here is a reflection prompt for you.'
    });
  } catch (error) {
    return sendJson(res, 502, {
      error: 'Unable to reach Groq right now. Please try again.'
    });
  }
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

  if (requestUrl.pathname === '/api/groq') {
    await handleGroqProxy(req, res);
    return;
  }

  await serveStaticFile(requestUrl.pathname, res);
});

server.listen(PORT, HOST, () => {
  console.log(`Sthir website running at http://${HOST}:${PORT}`);
});
