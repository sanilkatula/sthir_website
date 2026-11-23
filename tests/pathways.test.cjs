const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const edgeFixture = require('./edge-api.fixture.cjs');
const root = path.join(__dirname, '../frontend');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));
function page(t, name) {
  const dom = new JSDOM(read(name), { url: 'http://localhost:3000/' + name.replace(/index.html$/, ''), runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.matchMedia = () => ({ matches: false, addEventListener() {} });
  t.after(() => w.close());
  return w;
}
function series(t, apiFetch) {
  const w = page(t, 'pathways/see-and-be-seen/index.html');
  w.SthirRuntime = { apiFetch };
  w.eval(read('pathways/see-and-be-seen/interest.js'));
  return { w, form: w.document.getElementById('email-series-interest'), status: w.document.getElementById('email-series-status'), email: w.document.getElementById('series-email'), name: w.document.getElementById('series-name') };
}

test('email interest reaches the real Edge handler and is visible to admins', async t => {
  const edge = edgeFixture(); let response;
  const p = series(t, async (route, options) => {
    response = await edge.handler(new Request('https://test.invalid/functions/v1/api' + route, { method: options.method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body) }));
    return response.json();
  });
  p.name.value = 'Ada'; p.email.value = 'ADA@EXAMPLE.COM'; p.form.requestSubmit();
  await flush(); await flush();
  assert.equal(response.status, 201);
  const saved = edge.tables.interests[0];
  assert.equal(saved.email, 'ada@example.com'); assert.equal(saved.name, 'Ada');
  assert.equal(saved.interest_type, 'pathways'); assert.equal(saved.metadata.selected_pathway, 'see-and-be-seen');
  assert.equal(saved.metadata.consent_to_contact, true); assert.equal(saved.stage, 'new');
  assert.equal(p.status.dataset.state, 'success'); assert.equal(p.email.value, '');
  const admin = await edge.handler(new Request('https://test.invalid/api/admin/interests', { headers: { Authorization: 'Bearer admin' } }));
  assert.equal(admin.status, 200); assert.equal((await admin.json()).interests[0].metadata.selected_pathway, 'see-and-be-seen');
  const adminPage = page(t, 'admin/interests/index.html');
  adminPage.eval(read('admin/admin.js'));
  assert.equal(adminPage.SthirAdmin.formatSelectedPathway(saved), 'See, and Be Seen! email series');
});

test('email form rejects invalid addresses, permits an optional name, and prevents duplicate clicks', async t => {
  let calls = 0, resolve;
  const p = series(t, () => { calls++; return new Promise(done => { resolve = done; }); });
  p.email.value = 'not-an-email'; p.form.requestSubmit(); assert.equal(calls, 0);
  p.email.value = 'reader@localhost'; p.form.requestSubmit(); assert.equal(calls, 0); assert.equal(p.email.getAttribute('aria-invalid'), 'true');
  p.email.value = 'reader@example.com'; p.form.requestSubmit(); p.form.requestSubmit();
  assert.equal(calls, 1); assert.equal(p.form.getAttribute('aria-busy'), 'true');
  assert.equal(p.form.querySelector('button').disabled, true);
  resolve({ interest: { id: 'saved' } }); await flush();
  assert.equal(p.status.dataset.state, 'success'); assert.equal(p.form.querySelector('button').disabled, false);
});

test('failed saves retain input and allow retry without claiming success', async t => {
  let fail = true, calls = 0;
  const p = series(t, () => { calls++; return fail ? Promise.reject(new Error('Offline')) : Promise.resolve({ interest: { id: 'saved' } }); });
  p.email.value = 'reader@example.com'; p.form.requestSubmit(); await flush();
  assert.equal(p.status.dataset.state, 'error'); assert.equal(p.email.value, 'reader@example.com');
  assert.equal(p.form.querySelector('button').disabled, false);
  fail = false; p.form.requestSubmit(); await flush();
  assert.equal(calls, 2); assert.equal(p.status.dataset.state, 'success');
});

test('unconfirmed saves and a missing runtime never report a successful registration', async t => {
  const p = series(t, () => Promise.resolve({})); p.email.value = 'reader@example.com'; p.form.requestSubmit(); await flush();
  assert.equal(p.status.dataset.state, 'error'); assert.equal(p.email.value, 'reader@example.com');
  const w = page(t, 'pathways/see-and-be-seen/index.html'); w.eval(read('pathways/see-and-be-seen/interest.js'));
  assert.equal(w.document.querySelector('#email-series-interest button').disabled, true);
  assert.equal(w.document.getElementById('email-series-status').dataset.state, 'error');
});

test('Pathways combines backend events with local experiences and preserves filters and interest capture', async t => {
  const w = page(t, 'pathways/index.html'); const calls = [];
  const remote = [{ id: 'future', title: '<img src=x onerror=alert(1)>Future cohort', description: 'Next cohort', start_at: '2099-01-01', format: 'cohort', path_type: '4-week', price_usd: 295 }, { id: 'archived', title: 'Past workshop', status: 'archived', start_at: '2020-01-01', format: 'live', path_type: 'general' }, { id: 'remote-demand', title: 'Video exercise', format: 'on-demand', path_type: 'general' }];
  w.SthirRuntime = { apiFetch(route, options) { calls.push({ route, options }); return Promise.resolve(route === '/events' ? { events: remote } : { interest: { id: 'cohort-interest' } }); } };
  w.eval(read('pathways/pathways.js')); await flush();
  const d = w.document, upcoming = d.getElementById('upcoming-sessions'), demand = d.getElementById('ondemand-sessions');
  assert.match(upcoming.textContent, /Sthir Saturdays/); assert.match(upcoming.textContent, /Future cohort/);
  assert.equal(upcoming.querySelector('img'), null, 'event title is escaped');
  assert.match(demand.textContent, /See, and Be Seen!/); assert.match(demand.textContent, /Video exercise/);
  assert.match(d.getElementById('past-sessions').textContent, /Past workshop/);
  const signup = demand.querySelector('a.session-join-action');
  assert.equal(signup.textContent, 'Register interest'); assert.equal(signup.getAttribute('target'), null); assert.match(signup.href, /see-and-be-seen\/#register-interest$/);
  assert.equal(upcoming.querySelector('a.session-join-action').target, '_blank');
  d.getElementById('open-upcoming-filters').click();
  const format = d.getElementById('session-format-filter');format.value = 'cohort';format.dispatchEvent(new w.Event('change'));
  assert.doesNotMatch(upcoming.textContent, /Sthir Saturdays/); assert.match(upcoming.textContent, /Future cohort/);
  d.getElementById('reset-session-filters').click();assert.match(upcoming.textContent, /Sthir Saturdays/);
  d.querySelector('[data-open-interest="4-week"]').click();
  const form = d.getElementById('pathway-interest-form');form.elements.name.value = 'Cohort reader';form.elements.email.value = 'cohort@example.com';form.requestSubmit();await flush();
  const posted = calls.find(call => call.route === '/interests'); assert.equal(posted.options.body.metadata.selected_pathway, '4-week');assert.equal(posted.options.body.interest_type, 'pathways');
  assert.equal(d.getElementById('interest-submit').textContent, 'Register interest');
});

test('local experiences remain available if backend events cannot load', async t => {
  const w = page(t, 'pathways/index.html'); w.SthirRuntime = { apiFetch: () => Promise.reject(new Error('Sessions unavailable')) };
  w.eval(read('pathways/pathways.js'));await flush();
  assert.match(w.document.getElementById('upcoming-sessions').textContent, /Sthir Saturdays/);
  assert.match(w.document.getElementById('ondemand-sessions').textContent, /See, and Be Seen!/);
});

test('registration labels and shared button styling match across cards and detail pages', t => {
  const email = page(t, 'pathways/see-and-be-seen/index.html');
  const actions = [...email.document.querySelectorAll('.session-cta')];
  assert.equal(actions.length, 3); assert.ok(actions.every(a => a.textContent.trim() === 'Register interest'));
  assert.ok(actions.filter(a => a.tagName === 'A').every(a => a.hash === '#register-interest'));
  const saturday = page(t, 'pathways/saturdays/index.html');
  const links = [...saturday.document.querySelectorAll('.session-cta')];assert.ok(links.length >= 2);assert.ok(links.every(a => a.textContent.trim() === 'Join a Saturday'));
  for (const w of [email, saturday, page(t, 'pathways/index.html')]) assert.ok(w.document.querySelector('link[href*="session-actions.css"]'));
});

test('existing footer and contact forms still save through the Edge interest handler', async t => {
  const edge = edgeFixture();
  const w = page(t, 'contact/index.html');
  w.SthirRuntime = { async apiFetch(route, options) {
    const response = await edge.handler(new Request('https://test.invalid/api' + route, { method: options.method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(options.body) }));
    if (!response.ok) throw new Error('Interest rejected');return response.json();
  } };
  w.eval(read('shared/interest-forms.js'));
  const footer = w.document.querySelector('footer#contact form');footer.querySelector('input').value = 'footer@example.com';footer.requestSubmit();await flush();await flush();
  assert.equal(edge.tables.interests.length, 1);assert.equal(edge.tables.interests[0].metadata.form_location, 'footer');
  const contact = w.document.querySelector('.contact-page-form');
  w.document.getElementById('name').value = 'Contact reader';w.document.getElementById('email').value = 'contact@example.com';w.document.getElementById('message').value = 'A programme question.';
  contact.requestSubmit();await flush();await flush();assert.equal(edge.tables.interests.length, 2);assert.equal(edge.tables.interests[1].metadata.form_location, 'contact-page');
});
