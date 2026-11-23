const { test } = require('node:test');
const assert = require('node:assert/strict');
const edgeFixture = require('./edge-api.fixture.cjs');
const request = (route, method = 'GET', body, token) => new Request('https://test.invalid/functions/v1/api' + route, { method, headers: { Origin: 'http://localhost:3000', 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });

test('health, CORS preflight and published-event reads remain available', async () => {
  const { handler } = edgeFixture();
  const health = await handler(request('/health'));assert.equal(health.status, 200);assert.equal((await health.json()).status, 'ok');
  assert.equal(health.headers.get('access-control-allow-origin'), 'http://localhost:3000');
  const preflight = await handler(request('/interests', 'OPTIONS'));assert.equal(preflight.status, 200);assert.match(preflight.headers.get('access-control-allow-methods'), /POST/);
  const events = await handler(request('/events'));assert.equal(events.status, 200);assert.deepEqual((await events.json()).events.map(e => e.id), ['published']);
});

test('existing interest types and email-series metadata use the same backend contract', async () => {
  const { handler, tables } = edgeFixture();
  for (const type of ['general', 'pathways', 'coaching', 'sprints']) {
    const response = await handler(request('/interests', 'POST', { name: 'Reader', email: 'READER@EXAMPLE.COM', interest_type: type, notes: 'Existing signup', metadata: { selected_pathway: type }, stage: 'closed', is_admin: true }));
    assert.equal(response.status, 201);assert.ok((await response.json()).interest.id);
    assert.equal(tables.interests.at(-1).stage, 'new');assert.equal(tables.interests.at(-1).email, 'reader@example.com');
    assert.equal(tables.interests.at(-1).is_admin, undefined);
  }
});

test('invalid names, emails, interest types, JSON bodies and metadata are rejected before insertion', async () => {
  const { handler, tables } = edgeFixture();
  for (const body of [{}, { name: 'Reader', email: 'invalid' }, { name: 'Reader', email: 'r@example.com', interest_type: 'email-series' }, { name: 'Reader', email: 'r@example.com', metadata: [] }, ['not', 'an', 'object']]) {
    const response = await handler(request('/interests', 'POST', body));assert.equal(response.status, 400);
  }
  assert.equal(tables.interests.length, 0);
});

test('admin access remains restricted and cannot be granted by a public interest request', async () => {
  const { handler } = edgeFixture();
  assert.equal((await handler(request('/admin/interests'))).status, 401);
  assert.equal((await handler(request('/admin/interests', 'GET', undefined, 'invalid'))).status, 401);
  assert.equal((await handler(request('/admin/interests', 'GET', undefined, 'reader'))).status, 403);
  assert.equal((await handler(request('/admin/interests', 'GET', undefined, 'admin'))).status, 200);
  assert.equal((await handler(request('/interests'))).status, 404);
});

test('database failure returns an error instead of a successful signup', async () => {
  const edge = edgeFixture();edge.failInserts();
  const response = await edge.handler(request('/interests', 'POST', { name: 'Reader', email: 'r@example.com' }));
  assert.equal(response.status, 500);assert.equal(edge.tables.interests.length, 0);
});
