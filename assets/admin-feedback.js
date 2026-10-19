(() => {
  'use strict';
  let token = '', page = 0, busy = false;
  const el = id => document.getElementById('admin-' + id);
  const load = async () => {
    if (busy) return; busy = true;
    el('status').textContent = 'Loading feedback…';
    el('prev').disabled = el('next').disabled = true;
    try {
      const response = await fetch('/.netlify/functions/feedback?page=' + page, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store', signal: AbortSignal.timeout(15000) });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || 'Could not load feedback.');
      el('login').hidden = true; el('results').hidden = false;
      const totals = data.totals;
      el('totals').replaceChildren();
      for (const text of [`${totals.total} submissions`, `${totals.yes} helpful votes`, `${totals.no} unhelpful votes`, `${totals.average ?? '—'} / 5 average (${totals.ratings} ratings)`]) { const p = document.createElement('p'); p.textContent = text; el('totals').append(p); }
      el('rows').replaceChildren();
      for (const row of data.rows) {
        const tr = document.createElement('tr');
        for (const value of [new Date(row.created_at).toLocaleString(), row.page_url, row.kind === 'overall' ? row.rating + ' / 5 stars' : row.helpful ? 'Yes' : 'No', row.comment || '—']) { const td = document.createElement('td'); td.textContent = value; tr.append(td); }
        el('rows').append(tr);
      }
      el('prev').disabled = page === 0; el('next').disabled = !data.more;
      el('status').textContent = data.rows.length ? `Page ${page + 1} · newest first` : 'No feedback yet.';
    } catch (error) { el('status').textContent = error.message; el('prev').disabled = page === 0; el('next').disabled = false; }
    finally { busy = false; }
  };
  el('login').addEventListener('submit', event => { event.preventDefault(); token = el('password').value; el('password').value = ''; page = 0; load(); });
  el('prev').addEventListener('click', () => { if (!busy && page > 0) { page--; load(); } });
  el('next').addEventListener('click', () => { if (!busy) { page++; load(); } });
  el('logout').addEventListener('click', () => location.reload());
})();
