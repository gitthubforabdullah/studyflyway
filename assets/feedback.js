(() => {
  'use strict';
  const footer = document.querySelector('footer');
  if (!footer || document.querySelector('[data-feedback]')) return;
  const path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  const pageFeedback = /^\/(universities|scholarships|countries)(\/[^/]+)?$|^\/destinations$/.test(path);
  const section = document.createElement('section');
  section.className = 'feedback wrap'; section.dataset.feedback = '';
  section.setAttribute('aria-label', 'Visitor feedback');
  const icon = down => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true" ${down ? 'style="transform:rotate(180deg)"' : ''}><path d="M7 10H3v11h4zm0 10h11a2 2 0 0 0 2-1.6l1-7A2 2 0 0 0 19 9h-6l1-5c.3-2-2-3-3-1L7 10z"/></svg>`;
  section.innerHTML = `${pageFeedback ? `<form class="feedback-card" data-kind="page"><span class="eyebrow">Help us improve</span><h2>Was this information helpful?</h2><div class="feedback-actions"><button type="button" data-vote="yes">${icon(false)} Yes</button><button type="button" data-vote="no">${icon(true)} No</button></div><div data-improve hidden><label for="feedback-comment">How can we improve this information? <small>(optional)</small></label><textarea id="feedback-comment" maxlength="2000" rows="3" placeholder="Tell us what was missing or unclear"></textarea><button type="submit">Send feedback</button></div><p class="feedback-status" role="status" aria-live="polite"></p></form>` : ''}
  <form class="feedback-card" data-kind="overall"><span class="eyebrow">Your experience matters</span><h2>How helpful was StudyFlyway?</h2><fieldset class="feedback-stars"><legend class="feedback-hint">Choose a rating from 1 to 5 stars</legend>${[1,2,3,4,5].map(n => `<label><input type="radio" name="rating" value="${n}" required><span aria-hidden="true">★</span><span class="feedback-sr">${n} ${n === 1 ? 'star' : 'stars'}</span></label>`).join('')}</fieldset><button type="submit">Submit rating</button><p class="feedback-status" role="status" aria-live="polite"></p></form><p class="feedback-privacy">Feedback includes this page’s URL and submission date. Please avoid personal information. <a href="/privacy-policy">Privacy policy</a></p>`;
  footer.before(section);
  let visitor;
  try { visitor = localStorage.getItem('sf-feedback-visitor'); } catch {}
  if (!/^[0-9a-f-]{36}$/i.test(visitor || '')) {
    visitor = crypto.randomUUID();
    try { localStorage.setItem('sf-feedback-visitor', visitor); } catch {}
  }
  section.querySelectorAll('form').forEach(form => {
    const kind = form.dataset.kind;
    const key = 'sf-feedback:' + (kind === 'overall' ? kind : path);
    const status = form.querySelector('[role="status"]');
    const controls = () => form.querySelectorAll('button,input,textarea');
    const done = () => { controls().forEach(el => { el.disabled = true; }); status.textContent = 'Thank you! Your feedback helps us improve StudyFlyway.'; };
    try { if (localStorage.getItem(key)) done(); } catch {}
    let busy = false, helpful;
    const send = async () => {
      if (busy) return;
      busy = true; controls().forEach(el => { el.disabled = true; }); status.textContent = 'Saving your feedback…';
      const rating = form.querySelector('input:checked');
      try {
        const response = await fetch('/.netlify/functions/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000), body: JSON.stringify({ visitor_id: visitor, kind, page_url: location.origin + path, helpful, rating: rating ? Number(rating.value) : null, comment: form.querySelector('textarea')?.value || '' }) });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || 'Please try again.');
        try { localStorage.setItem(key, '1'); } catch {}
        done();
      } catch (error) {
        status.textContent = error.name === 'TimeoutError' ? 'The request timed out. Please try again.' : (error.message || 'Could not save feedback. Please try again.');
        controls().forEach(el => { el.disabled = false; });
      } finally { busy = false; }
    };
    form.querySelectorAll('[data-vote]').forEach(button => button.addEventListener('click', () => {
      helpful = button.dataset.vote === 'yes';
      form.querySelectorAll('[data-vote]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
      form.querySelector('[data-improve]').hidden = helpful;
      if (helpful) send(); else { status.textContent = 'Thanks for letting us know. You can add a comment or send without one.'; form.querySelector('textarea').focus(); }
    }));
    form.addEventListener('change', () => { const value = Number(form.querySelector('input:checked')?.value); form.querySelectorAll('.feedback-stars label').forEach((el, index) => el.classList.toggle('selected', index < value)); });
    form.addEventListener('submit', event => { event.preventDefault(); if (form.reportValidity()) send(); });
  });
})();
