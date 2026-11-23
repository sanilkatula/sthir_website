const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

// Run the real Edge handler with in-memory database/auth adapters. No live writes.
module.exports = function edgeFixture() {
  const tables = {
    events: [{ id: 'published', title: 'Published session', status: 'live', format: 'live', path_type: 'general', start_at: '2099-01-01' }, { id: 'draft', status: 'draft' }],
    interests: [],
    users: ['reader', 'admin'].map(id => ({ id, email: id + '@example.com', full_name: id, is_admin: id === 'admin' }))
  };
  let failInserts = false;
  let handler;
  const client = {
    auth: { async getUser(token) {
      const profile = tables.users.find(row => row.id === token);
      return { data: { user: profile ? { id: profile.id, email: profile.email, user_metadata: { full_name: profile.full_name } } : null }, error: null };
    } },
    from(table) {
      let filters = [], operation = 'select', payload, single = false, limit;
      const query = {
        select() { return query; },
        order() { return query; },
        neq(key, value) { filters.push(row => row[key] !== value); return query; },
        eq(key, value) { filters.push(row => row[key] === value); return query; },
        gte(key, value) { filters.push(row => row[key] >= value); return query; },
        limit(value) { limit = value; return query; },
        single() { single = true; return query; },
        maybeSingle() { single = true; return query; },
        insert(value) { operation = 'insert'; payload = value; return query; },
        update(value) { operation = 'update'; payload = value; return query; },
        delete() { operation = 'delete'; return query; },
        then(resolve, reject) {
          if (operation === 'insert' && failInserts) return Promise.resolve({ data: null, error: new Error('Database unavailable') }).then(resolve, reject);
          let rows = tables[table].filter(row => filters.every(filter => filter(row)));
          if (operation === 'insert') {
            const row = { id: 'interest-' + (tables[table].length + 1), stage: 'new', created_at: new Date().toISOString(), ...payload };
            tables[table].push(row); rows = [row];
          } else if (operation === 'update') rows.forEach(row => Object.assign(row, payload));
          else if (operation === 'delete') tables[table] = tables[table].filter(row => !rows.includes(row));
          if (limit) rows = rows.slice(0, limit);
          return Promise.resolve({ data: single ? rows[0] || null : rows, error: null }).then(resolve, reject);
        }
      };
      return query;
    }
  };
  const source = fs.readFileSync(path.join(__dirname, '../supabase/functions/api/index.ts'), 'utf8').replace(/^import .*;\s*/m, '');
  vm.runInNewContext(stripTypeScriptTypes(source), {
    createClient: () => client, Request, Response, URL,
    console: { error() {} },
    Deno: { env: { get: () => 'test-only' }, serve(fn) { handler = fn; } }
  }, { filename: 'edge-api.js' });
  return { tables, handler, failInserts() { failInserts = true; } };
};
