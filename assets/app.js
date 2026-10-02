'use strict';
document.documentElement.classList.add('js');
const menu = document.querySelector('[data-menu]');
const nav = document.querySelector('[data-nav]');
if (menu && nav) {
  menu.addEventListener('click', () => {
    const expanded = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!expanded));
    menu.textContent = expanded ? 'Menu' : 'Close';
    nav.classList.toggle('expanded', !expanded);
  });
  document.addEventListener('keydown', event => {
    if(event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') {
      menu.click(); menu.focus();
    }
  });
}
const now = Date.now();
document.querySelectorAll('[data-destinations-menu]').forEach(dropdown => {
  const toggle = dropdown.querySelector('.nav-dropdown-toggle');
  const setOpen = open => {
    dropdown.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  dropdown.addEventListener('pointerenter', event => {
    if (event.pointerType === 'mouse') setOpen(true);
  });
  dropdown.addEventListener('pointerleave', event => {
    if (event.pointerType === 'mouse' && !dropdown.contains(document.activeElement)) setOpen(false);
  });
  toggle.addEventListener('focus', () => setOpen(true));
  dropdown.addEventListener('focusout', event => {
    if (!dropdown.contains(event.relatedTarget)) setOpen(false);
  });
  dropdown.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      toggle.focus();
      setOpen(false);
    }
    if (event.key === 'ArrowDown' && event.target === toggle) {
      event.preventDefault();
      setOpen(true);
      dropdown.querySelector('.nav-dropdown-panel a').focus();
    }
  });
  document.addEventListener('click', event => {
    if (!dropdown.contains(event.target)) setOpen(false);
  });
  if (menu) menu.addEventListener('click', () => setOpen(false));
});
document.querySelectorAll('[data-scholarship]').forEach(card => {
  let status = card.dataset.status;
  if (card.dataset.closes && now > Date.parse(card.dataset.closes)) status = 'Closed';
  if (card.dataset.opens && status === 'Upcoming' && now >= Date.parse(card.dataset.opens)) status = 'Check dates';
  card.dataset.status = status;
  const badge = card.querySelector('[data-status-label]');
  if(badge) { badge.textContent = status; badge.className = 'badge ' + status.toLowerCase().replaceAll(' ', '-'); }
});
const filterForm = document.querySelector('[data-filters]');
if(filterForm) {
  const controls = [...filterForm.querySelectorAll('[name]')];
  const cards = [...document.querySelectorAll('[data-scholarship]')];
  const count = document.querySelector('[data-count]');
  const empty = document.querySelector('[data-empty]');
  const parameters = new URLSearchParams(location.search);
  for (const control of controls) {
    const value = parameters.get(control.name);
    if(value !== null && (control.tagName !== 'SELECT' || [...control.options].some(o => o.value === value))) control.value = value;
  }
  function applyFilters(updateUrl = true) {
    const values = Object.fromEntries(controls.map(control => [control.name, control.value.trim()]));
    const keywords = (values.q || '').toLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    for(const card of cards) {
      const haystack = card.textContent.toLowerCase();
      const matches = keywords.every(word => haystack.includes(word)) &&
        (!values.country || card.dataset.country === values.country) &&
        (!values.level || card.dataset.level.split('|').includes(values.level)) &&
        (!values.funding || card.dataset.funding === values.funding) &&
        (!values.status || card.dataset.status === values.status);
      card.hidden = !matches;
      if(matches) visible++;
    }
    count.textContent = `${visible} scholarship${visible === 1 ? '' : 's'} found`;
    empty.hidden = visible !== 0;
    if(updateUrl && location.protocol !== 'file:') {
      const next = new URLSearchParams();
      Object.entries(values).forEach(([key,value]) => {if(value) next.set(key,value)});
      history.replaceState(null, '', location.pathname + (next.size ? '?' + next.toString() : ''));
    }
  }
  controls.forEach(control => control.addEventListener(control.tagName === 'INPUT' ? 'input' : 'change', () => applyFilters()));
  filterForm.addEventListener('submit', event => {event.preventDefault(); applyFilters()});
  document.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', () => {
    filterForm.reset(); controls.forEach(control => control.value = ''); applyFilters(); controls[0].focus();
  }));
  applyFilters(false);
}
document.querySelectorAll('img[data-fallback]').forEach(img => {
  function fallback() {img.hidden = true; img.parentElement.setAttribute('aria-label', img.alt);}
  img.addEventListener('error', fallback);
  if(img.complete && img.naturalWidth === 0) fallback();
});
const contact = document.querySelector('[data-contact]');
document.querySelectorAll('img[data-campus-image]').forEach(img => {
  function showImageStatus() {
    const parent = img.parentElement;
    if (parent.classList.contains('campus-image-failed')) return;
    parent.classList.add('campus-image-failed');
    const status = document.createElement('p');
    status.className = 'campus-image-status';
    status.textContent = 'Campus photo is temporarily unavailable. The image source and credit remain linked below.';
    parent.insertBefore(status, img.nextSibling);
  }
  img.addEventListener('error', showImageStatus);
  if (img.complete && img.naturalWidth === 0) showImageStatus();
});
if(contact) contact.addEventListener('submit', event => {
  if(location.protocol === 'file:' || ['localhost','127.0.0.1','terminal.local'].includes(location.hostname)) {
    event.preventDefault();
    const message = document.querySelector('[data-form-message]');
    message.textContent = 'This preview cannot send messages. The form becomes available after Netlify Forms is enabled and the website is deployed.';
    message.focus();
  }
});
