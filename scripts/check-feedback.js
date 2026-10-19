'use strict';
const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../netlify/functions/feedback');
const originalFetch = global.fetch;
process.env.SITE_URL = 'https://studyflyway.online';
process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'server-secret';
process.env.FEEDBACK_ADMIN_TOKEN = 'test-admin';
afterEach(() => { global.fetch = originalFetch; });
const event = data => ({ httpMethod: 'POST', headers: { origin: process.env.SITE_URL, 'content-type': 'application/json' }, body: JSON.stringify({ visitor_id: '12345678-1234-4123-8123-123456789abc', kind: 'page', page_url: 'https://studyflyway.online/countries/canada.html?tracking=1#fees', helpful: false, comment: 'More details', ...data }) });
test('valid page submission strips tracking and uses database duplicate protection', async () => {
  let calls = 0;
  global.fetch = async (url, options) => {
    calls++;
    const row = JSON.parse(options.body);
    assert.equal(row.page_url, 'https://studyflyway.online/countries/canada');
    assert.equal(row.helpful, false);
    assert.equal(row.rating, null);
    assert.equal(options.headers.Prefer, 'resolution=ignore-duplicates,return=minimal');
    assert.equal(row.created_at, undefined);
    return { ok: true, status: 204 };
  };
  assert.equal((await handler(event())).statusCode, 200);
  assert.equal(calls, 1);
});
test('reject invalid ratings, URLs, comments, origins and malformed bodies', async () => {
  global.fetch = () => { throw Error('Database must not be called'); };
  for (const data of [{ kind: 'overall', rating: 6 }, { page_url: 'https://evil.example/countries/canada' }, { comment: 'x'.repeat(2001) }, { helpful: 'false' }, { page_url: 'https://studyflyway.online/contact' }]) assert.equal((await handler(event(data))).statusCode, 400);
  assert.equal((await handler({ ...event(), headers: { origin: 'https://evil.example' } })).statusCode, 403);
  assert.equal((await handler({ ...event(), body: '{' })).statusCode, 400);
});
test('admin rejects missing and incorrect passwords before database access', async () => {
  global.fetch = () => { throw Error('Database must not be called'); };
  for (const authorization of ['', 'Bearer wrong']) assert.equal((await handler({ httpMethod: 'GET', headers: { authorization } })).statusCode, 401);
});
test('admin returns database aggregates and paginated rows without visitor IDs', async () => {
  global.fetch = async url => ({ ok: true, status: 200, text: async () => JSON.stringify(url.includes('/rpc/') ? { total: 60, yes: 40, no: 10, ratings: 10, average: 4.2 } : Array.from({ length: 51 }, () => ({ comment: '<script>text only</script>' }))) });
  const response = await handler({ httpMethod: 'GET', headers: { authorization: 'Bearer test-admin' } });
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.body);
  assert.equal(body.rows.length, 50); assert.equal(body.more, true); assert.equal(body.totals.average, 4.2);
});
test('database failures return a retryable error without leaking details', async () => {
  global.fetch = async () => ({ ok: false });
  const result = await handler(event());
  assert.equal(result.statusCode, 503); assert.ok(!result.body.includes('server-secret'));
});
