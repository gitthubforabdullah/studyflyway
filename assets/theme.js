'use strict';
// Country refinement buttons reuse the directory's existing accessible filters.
const refinementButtons = [...document.querySelectorAll('[data-refine-country]')];
const countryControl = document.querySelector('[data-university-filters] [name="country"], [data-filters] [name="country"]');
if (countryControl && refinementButtons.length) {
  const refreshRefinements = () => {
    refinementButtons.forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.refineCountry === countryControl.value));
    });
  };
  refinementButtons.forEach(button => {
    button.addEventListener('click', () => {
      countryControl.value = button.dataset.refineCountry;
      countryControl.dispatchEvent(new Event('change', {bubbles: true}));
      refreshRefinements();
    });
  });
  countryControl.addEventListener('change', refreshRefinements);
  document.querySelectorAll('[data-reset], [data-university-reset]').forEach(button => {
    button.addEventListener('click', () => setTimeout(refreshRefinements, 0));
  });
  refreshRefinements();
}

const headerSearchToggle = document.querySelector('[data-header-search]');
const headerSearchForm = document.querySelector('#header-search');
if (headerSearchToggle && headerSearchForm) {
  const closeSearch = () => {
    headerSearchForm.hidden = true;
    headerSearchToggle.setAttribute('aria-expanded', 'false');
  };
  headerSearchToggle.addEventListener('click', () => {
    const open = headerSearchForm.hidden;
    headerSearchForm.hidden = !open;
    headerSearchToggle.setAttribute('aria-expanded', String(open));
    if (open) headerSearchForm.elements.q.focus();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !headerSearchForm.hidden) {
      closeSearch();
      headerSearchToggle.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!headerSearchForm.contains(event.target) && !headerSearchToggle.contains(event.target)) closeSearch();
  });
}

const homeSearch = document.querySelector('.reference-home .hero-search');
if (homeSearch) {
  homeSearch.addEventListener('submit', event => {
    const query = homeSearch.elements.q.value.trim();
    const normal = query.toLowerCase().replace(/^study in\s+/, '');
    const countryAliases = {germany:'germany', uk:'uk', 'united kingdom':'uk', canada:'canada', australia:'australia', 'new zealand':'new-zealand'};
    let target;
    if (countryAliases[normal]) target = '/countries/' + countryAliases[normal];
    else if (/\b(ielts|pte)\b/.test(normal)) target = '/english-tests' + (/\bielts\b/.test(normal) ? '#ielts' : '#pte');
    else if (/\b(scholarship|scholarships|funding|daad|chevening|awards)\b/.test(normal)) {
      const keywords = query.replace(/\b(scholarships?|funding)\b/gi, '').trim();
      target = '/scholarships' + (keywords ? '?q=' + encodeURIComponent(keywords) : '');
    } else if (/personal statement|statement of purpose/.test(normal)) target = '/guides/personal-statement';
    else if (/document|checklist/.test(normal)) target = '/guides/application-checklist';
    else if (/budget|cost of living/.test(normal)) target = '/guides/study-budget';
    else if (/\bguide/.test(normal)) target = '/guides';
    if (target) {
      event.preventDefault();
      location.assign(target);
    }
  });
}

// Bookmark controls store a private shortlist in this browser only.
const saveButtons = [...document.querySelectorAll('[data-save]')];
let savedItems = [];
try {
  const stored = JSON.parse(localStorage.getItem('studyflyway-shortlist') || '[]');
  if (Array.isArray(stored)) savedItems = stored.filter(item => typeof item === 'string');
} catch (_) { /* The shortlist still works for this page when storage is unavailable. */ }
for (const button of saveButtons) {
  const update = () => {
    const saved = savedItems.includes(button.dataset.save);
    button.setAttribute('aria-pressed', String(saved));
    button.title = saved ? 'Remove from your shortlist' : 'Save to your shortlist';
  };
  update();
  button.addEventListener('click', () => {
    const key = button.dataset.save;
    savedItems = savedItems.includes(key) ? savedItems.filter(item => item !== key) : [...savedItems, key];
    try { localStorage.setItem('studyflyway-shortlist', JSON.stringify(savedItems)); } catch (_) {}
    update();
  });
}

const destinationForm = document.querySelector('.reference-destinations form[role="search"]');
const destinationCards = [...document.querySelectorAll('[data-country-card]')];
const categoryButtons = [...document.querySelectorAll('[data-country-category]')];
if (destinationForm && destinationCards.length) {
  let category = 'all';
  const input = destinationForm.elements.q;
  input.value = new URLSearchParams(location.search).get('q') || '';
  const matchesCategory = key => {
    if (key === 'choosing-a-course') return category === 'all';
    if (category === 'popular') return ['uk', 'canada', 'australia'].includes(key);
    if (category === 'english') return key !== 'germany';
    if (category === 'funding') return ['germany', 'uk', 'australia'].includes(key);
    return true;
  };
  const empty = document.createElement('p');
  empty.className = 'notice';
  empty.textContent = 'No destinations match your search. Try another country or choose All destinations.';
  empty.hidden = true;
  destinationCards[0].parentElement.after(empty);
  const filterDestinations = (updateUrl = true) => {
    const query = input.value.trim().toLowerCase();
    let visible = 0;
    destinationCards.forEach(card => {
      const matches = card.textContent.toLowerCase().includes(query) && matchesCategory(card.dataset.countryCard);
      card.hidden = !matches;
      if (matches) visible++;
    });
    empty.hidden = visible !== 0;
    if (updateUrl && location.protocol !== 'file:') {
      history.replaceState(null, '', location.pathname + (query ? '?q=' + encodeURIComponent(input.value.trim()) : ''));
    }
  };
  categoryButtons.forEach(button => button.addEventListener('click', () => {
    category = button.dataset.countryCategory;
    categoryButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    filterDestinations();
  }));
  destinationForm.addEventListener('submit', event => { event.preventDefault(); filterDestinations(); });
  input.addEventListener('input', () => filterDestinations());
  filterDestinations(false);
}

// Full reviewed guides remain reachable through every original section link.
function revealTarget(hash) {
  if (!hash || hash === '#') return;
  let target;
  try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch (_) { return; }
  if (!target) return;
  let parent = target.parentElement;
  while (parent) {
    if (parent.tagName === 'DETAILS') parent.open = true;
    parent = parent.parentElement;
  }
}
revealTarget(location.hash);
window.addEventListener('hashchange', () => revealTarget(location.hash));
document.addEventListener('click', event => {
  const link = event.target.closest('a[href^="#"]');
  if (link) revealTarget(link.getAttribute('href'));
});

// The reference shows five directory rows followed by the footer. Preserve all
// records in HTML, and paginate the filtered matches when JavaScript is enabled.
const resultList = document.querySelector('.reference-result-list');
if (resultList) {
  const cards = [...resultList.querySelectorAll(':scope > article')];
  const filterForm = document.querySelector('[data-university-filters], [data-filters]');
  const pageSize = 5;
  let matches = cards.filter(card => !card.hidden);
  let page = 1;
  const pagination = document.createElement('nav');
  pagination.className = 'reference-pagination';
  pagination.setAttribute('aria-label', 'Directory pages');
  const status = document.createElement('span');
  status.setAttribute('aria-live', 'polite');
  const previous = document.createElement('button');
  previous.type = 'button';
  previous.textContent = '‹ Previous';
  const next = document.createElement('button');
  next.type = 'button';
  next.textContent = 'Next ›';
  const pageLabel = document.createElement('span');
  pageLabel.className = 'pagination-current';
  pagination.append(status, previous, pageLabel, next);
  resultList.after(pagination);
  const renderPage = () => {
    const pages = Math.max(1, Math.ceil(matches.length / pageSize));
    page = Math.min(page, pages);
    const current = matches.slice((page - 1) * pageSize, page * pageSize);
    const visible = new Set(current);
    cards.forEach(card => { card.hidden = !visible.has(card); });
    resultList.dataset.matchCount = String(matches.length);
    resultList.dataset.page = String(page);
    status.textContent = matches.length ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, matches.length)} of ${matches.length}` : '0 results';
    pageLabel.textContent = `${page} / ${pages}`;
    previous.disabled = page === 1;
    next.disabled = page === pages;
    pagination.hidden = matches.length <= pageSize;
  };
  previous.addEventListener('click', () => { page--; renderPage(); });
  next.addEventListener('click', () => { page++; renderPage(); });
  const refilter = () => {
    // Existing filter handlers have just evaluated every record.
    matches = cards.filter(card => !card.hidden);
    page = 1;
    renderPage();
  };
  if (filterForm) {
    [...filterForm.elements].forEach(control => {
      if (!control.name) return;
      control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', refilter);
    });
    filterForm.addEventListener('submit', refilter);
    document.querySelectorAll('[data-reset], [data-university-reset]').forEach(button => button.addEventListener('click', refilter));
  }
  renderPage();
}
