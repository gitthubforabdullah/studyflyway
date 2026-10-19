'use strict';
const { createHash, timingSafeEqual } = require('node:crypto');
const reply = (statusCode, data) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, body: JSON.stringify(data) });
exports.handler = async event => {
  const env = process.env;
  if (!['GET', 'POST'].includes(event.httpMethod)) return reply(405, { error: 'Method not allowed.' });
  const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
  if (event.httpMethod === 'GET') {
    if (!env.FEEDBACK_ADMIN_TOKEN) return reply(503, { error: 'Admin access is not configured.' });
    const hash = value => createHash('sha256').update(value).digest();
    if (!timingSafeEqual(hash(headers.authorization || ''), hash('Bearer ' + env.FEEDBACK_ADMIN_TOKEN))) return reply(401, { error: 'Invalid admin password.' });
  }
  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY || !env.SITE_URL) return reply(503, { error: 'Feedback is temporarily unavailable. Please try again later.' });
  let site;
  try { site = new URL(env.SITE_URL).origin; } catch { return reply(503, { error: 'Feedback configuration is incomplete.' }); }
  const db = async (path, options = {}) => {
    const response = await fetch(env.SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path, {
      ...options, signal: AbortSignal.timeout(10000), headers: { apikey: env.SUPABASE_SECRET_KEY, 'Content-Type': 'application/json', ...options.headers }
    });
    if (!response.ok) throw Error('Database request failed');
    return response.status === 204 ? null : response.text().then(text => text ? JSON.parse(text) : null);
  };
  try {
    if (event.httpMethod === 'GET') {
      const page = Math.max(0, Math.min(1000000, Number.parseInt(event.queryStringParameters?.page || '0', 10) || 0));
      const [totals, rows] = await Promise.all([
        db('rpc/feedback_totals', { method: 'POST', body: '{}' }),
        db('feedback?select=id,kind,page_url,helpful,rating,comment,created_at&order=created_at.desc,id.desc&limit=51&offset=' + page * 50)
      ]);
      return reply(200, { totals, rows: rows.slice(0, 50), more: rows.length > 50 });
    }
    if (headers.origin !== site) return reply(403, { error: 'Please submit feedback from StudyFlyway.' });
    if (!headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'JSON required.' });
    if (!event.body || Buffer.byteLength(event.body) > 12000) return reply(400, { error: 'Feedback is too long.' });
    let data;
    try { data = JSON.parse(event.body); } catch { return reply(400, { error: 'Invalid feedback.' }); }
    if (!data || typeof data !== 'object') return reply(400, { error: 'Invalid feedback.' });
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.visitor_id || '')) return reply(400, { error: 'Invalid visitor identifier.' });
    let url;
    try { url = new URL(data.page_url); } catch { return reply(400, { error: 'Invalid page URL.' }); }
    url.search = ''; url.hash = '';
    url.pathname = url.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
    if (url.origin !== site || url.href.length > 2048 || !['page', 'overall'].includes(data.kind) || typeof data.comment !== 'string' || data.comment.length > 2000) return reply(400, { error: 'Invalid feedback.' });
    if (data.kind === 'page' && (typeof data.helpful !== 'boolean' || !/^\/(universities|scholarships|countries)(\/[^/]+)?$|^\/destinations$/.test(url.pathname))) return reply(400, { error: 'Invalid page feedback.' });
    if (data.kind === 'overall' && (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5)) return reply(400, { error: 'Choose a rating from 1 to 5.' });
    const row = { visitor_id: data.visitor_id, kind: data.kind, page_url: url.href, helpful: data.kind === 'page' ? data.helpful : null, rating: data.kind === 'overall' ? data.rating : null, comment: data.comment.trim() };
    await db('feedback', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=minimal' }, body: JSON.stringify(row) });
    return reply(200, { success: true });
  } catch {
    return reply(503, { error: 'Feedback could not be loaded or saved. Please try again.' });
  }
};
