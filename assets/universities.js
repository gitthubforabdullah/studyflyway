'use strict';
const universityFilters = document.querySelector('[data-university-filters]');
if (universityFilters) {
  const search = universityFilters.elements.q;
  const country = universityFilters.elements.country;
  const cards = [...document.querySelectorAll('[data-university]')];
  const groups = [...document.querySelectorAll('[data-university-country]')];
  const count = document.querySelector('[data-university-count]');
  const empty = document.querySelector('[data-university-empty]');
  const normalise = text => text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/['’]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const parameters = new URLSearchParams(location.search);
  search.value = parameters.get('q') || '';
  if ([...country.options].some(option => option.value === parameters.get('country'))) country.value = parameters.get('country');
  function apply(updateUrl = true) {
    const words = normalise(search.value).split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const name = normalise(card.dataset.universityName);
      const matches = words.every(word => name.includes(word)) && (!country.value || card.dataset.country === country.value);
      card.hidden = !matches;
      if (matches) visible++;
    }
    groups.forEach(group => { group.hidden = ![...group.querySelectorAll('[data-university]')].some(card => !card.hidden); });
    count.textContent = `${visible} universit${visible === 1 ? 'y' : 'ies'} found`;
    empty.hidden = visible !== 0;
    if (updateUrl && location.protocol !== 'file:') {
      const query = new URLSearchParams();
      if (search.value.trim()) query.set('q', search.value.trim());
      if (country.value) query.set('country', country.value);
      history.replaceState(null, '', location.pathname + (query.size ? '?' + query.toString() : '') + location.hash);
    }
  }
  search.addEventListener('input', () => apply());
  country.addEventListener('change', () => apply());
  universityFilters.addEventListener('submit', event => { event.preventDefault(); apply(); });
  universityFilters.addEventListener('reset', event => {
    event.preventDefault();
    search.value = '';
    country.value = '';
    apply();
    search.focus();
  });
  document.querySelector('[data-university-reset]').addEventListener('click', () => universityFilters.reset());
  apply(false);
  universityFilters.hidden = false;
}
