'use strict';
const consultantSearch = document.querySelector('[data-consultant-search]');
if (consultantSearch) {
  const input = consultantSearch.elements.q;
  const cards = [...document.querySelectorAll('[data-consultant]')];
  const count = document.querySelector('[data-consultant-count]');
  const empty = document.querySelector('[data-consultant-empty]');
  const normalise = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  input.value = new URLSearchParams(location.search).get('q') || '';
  function apply(updateUrl = true) {
    const words = normalise(input.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      card.hidden = !words.every(word => normalise(card.dataset.search).includes(word));
      if (!card.hidden) visible++;
    }
    count.textContent = `${visible} consultant${visible === 1 ? '' : 's'} found`;
    empty.hidden = visible !== 0;
    if (updateUrl && location.protocol !== 'file:') {
      const query = new URLSearchParams();
      if (input.value.trim()) query.set('q', input.value.trim());
      history.replaceState(null, '', location.pathname + (query.size ? '?' + query : '') + location.hash);
    }
  }
  input.addEventListener('input', () => apply());
  consultantSearch.addEventListener('submit', event => { event.preventDefault(); apply(); });
  consultantSearch.addEventListener('reset', event => { event.preventDefault(); input.value = ''; apply(); input.focus(); });
  document.querySelector('[data-consultant-reset]').addEventListener('click', () => consultantSearch.reset());
  apply(false);
  consultantSearch.hidden = false;
}
