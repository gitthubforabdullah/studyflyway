'use strict';

const editorial = require('../research/university-editorial-content.json');
const sources = new Map(require('../research/university-profile-sources.json').map(record => [record.id, record]));

// Editorial text is deliberately stored independently of the generated HTML.
// New factual claims need an official source; planning suggestions are advice,
// not assertions that every university offers a particular service or route.
module.exports = function profileContent({escape, anchor, listings, countries}) {
  const date = '<time datetime="2026-10-04">4 October 2026</time>';
  const countryAdvice = {
    australia: 'For an Australian course, compare the exact campus, intake and attendance mode on each offer. If a degree includes professional training, check its accreditation and practical requirements for the country where you hope to work. Keep undergraduate study and any later graduate qualification as separate stages in your timeline and budget.',
    canada: 'For a Canadian programme, distinguish the degree, campus and intended major. Ask whether admission is directly to the specialisation or to a broader first-year category. If a work-experience route is offered, investigate selection, scheduling and additional fees separately; do not budget on the assumption that a paid position is guaranteed.',
    uk: 'For UK study, compare the full qualification and duration, including any foundation, placement or overseas-study year. Check whether your course uses the undergraduate application service or a university application route. Research and taught postgraduate programmes may have different documents, deadlines and academic contacts, even within the same department.',
    germany: 'For Germany, record the degree type, teaching language and application route before comparing institutions. Check how your previous qualification and individual modules are assessed. An English-language website is not evidence of an English-taught degree. Read the institution’s own tuition and semester-charge information instead of assuming that all German university programmes have the same costs.',
    'new-zealand': 'For New Zealand study, distinguish the qualification, major or specialisation, and the individual courses or papers that contribute to it. Confirm the campus and attendance mode for the whole programme. If comparing a conjoint, honours or research option, check its additional requirements and total duration rather than treating it as identical to a standard bachelor or taught degree.'
  };

  function researchLinks(u) {
    const record = sources.get(u.id);
    if (!editorial[u.id] || !record?.sources.length) throw Error('Missing editorial content or research sources: ' + u.id);
    return `<p class="credit">University background and academic context reviewed ${date}: ${record.sources.map(source => anchor(source.url, source.title)).join(' · ')}. The comparison questions below are StudyFlyway planning suggestions.</p>`;
  }

  function studyFit(u) {
    const record = editorial[u.id];
    return `<section id="study-fit"><h2>Understanding ${escape(u.name)}</h2>
      <p>${escape(record.overview)}</p>
      ${researchLinks(u)}
      <h3>What this means for your shortlist</h3><p>${escape(record.study)}</p>
      <ul>${record.checks.map(check => `<li>${escape(check)}</li>`).join('')}</ul>
    </section>`;
  }

  function applicationPlan(u) {
    return `<section id="application-planning"><h2>Build your application plan</h2>
      <p>${escape(countryAdvice[u.country])}</p>
      <h3>Choose the right study route</h3>
      <ul>
        <li><strong>First undergraduate degree:</strong> compare your secondary-school qualifications, required subjects and language evidence with the course requirements. If direct entry is unclear, ask admissions about recognised preparation routes before paying for one.</li>
        <li><strong>Taught postgraduate study:</strong> check the required degree background and relevant modules. Save your transcript, grading scale and course descriptions so you can explain your preparation accurately.</li>
        <li><strong>Research study:</strong> identify a relevant research group, investigate supervisor availability and check whether a proposal is needed. Keep admission, supervision and funding decisions separate.</li>
      </ul>
      <h3>Keep a course-specific deadline record</h3>
      <p>Record the application deadline, document deadline, scholarship deadline and offer-response date separately. Include the intake year and the official page where each date appears. If instructions conflict, send admissions the course code and ask which deadline applies to your applicant category.</p>
      <p>${anchor(u.links.admissions || u.links.website, 'Check ' + u.name + ' application instructions')} · ${anchor('../guides/application-checklist.html', 'Document checklist')} · ${anchor('../english-tests.html', 'Compare IELTS and PTE preparation')}</p>
    </section>`;
  }

  function budgetPlan(u) {
    return `<section id="offer-planning"><h2>Compare the full offer, not just tuition</h2>
      <p>Build a budget for the complete qualification at ${escape(u.name)}. A first-year tuition figure is not the same as the total course cost, and an advertised scholarship maximum is not a personal funding offer.</p>
      <div class="table-wrap" tabindex="0" role="region" aria-label="Study offer comparison checklist"><table><caption>Information to collect before accepting an offer</caption><thead><tr><th scope="col">Part of your plan</th><th scope="col">What to record</th></tr></thead><tbody>
      <tr><th scope="row">Academic costs</th><td>Programme fee, charging period, compulsory charges, deposit, refund terms and any practical materials or equipment.</td></tr>
      <tr><th scope="row">Living arrangements</th><td>Housing contract length, utilities, meals, transport to the teaching campus and costs during vacation periods.</td></tr>
      <tr><th scope="row">Funding</th><td>Confirmed award amount, duration, renewal conditions, permitted combinations and whether a separate application is required.</td></tr>
      <tr><th scope="row">Course commitments</th><td>Attendance, practical activities, research or placement requirements, and any travel between teaching locations.</td></tr>
      </tbody></table></div>
      <p>Keep amounts in the university’s billing currency and date your exchange-rate estimate. Treat unconfirmed scholarships and possible employment income as uncertain, then compare the same cost categories across your shortlisted institutions.</p>
      <p>${anchor(u.links.fees || u.links.website, 'Find official programme costs')} · ${anchor(u.links.scholarships || u.links.website, 'Investigate university funding')} · ${anchor('../guides/study-budget.html', 'Create a complete study budget')}</p>
    </section>`;
  }

  function related(u) {
    const peers = listings.filter(other => other.country === u.country && other.id !== u.id);
    const index = listings.filter(other => other.country === u.country).findIndex(other => other.id === u.id);
    const selected = Array.from({length: 3}, (_, offset) => peers[(index + offset) % peers.length]);
    return `<section id="compare-universities"><h2>Continue comparing universities in ${escape(countries[u.country])}</h2><p>Use the same subject, qualification level and cost checklist for each option. These links are browsing suggestions, not a ranking or a claim that the institutions offer equivalent courses.</p><ul>${selected.map(other => `<li>${anchor(other.slug + '.html', other.name)} — ${escape(other.city)}</li>`).join('')}</ul><p>${anchor('../countries/' + u.country + '.html', 'Read the ' + countries[u.country] + ' study guide')} · ${anchor('../universities.html?country=' + u.country, 'Browse all listed universities in ' + countries[u.country])}</p></section>`;
  }

  function navigation(u, gallery = false) {
    const items = [['study-fit', 'University and study fit'], ['academic-options', 'Academic options'], ['application-planning', 'Application planning'], ['tuition', 'Tuition and funding'], ['offer-planning', 'Compare the full offer'], ['campus-life', 'Campus and housing']];
    if (gallery) items.push(['gallery', 'Campus photographs']);
    items.push(['compare-universities', 'Other universities'], ['sources', 'Sources']);
    return `<aside class="sidebar"><h2>In this profile</h2>${items.map(([id,label]) => anchor('#' + id, label)).join('')}${anchor('../universities.html?country=' + u.country, 'Universities in ' + countries[u.country], 'btn')}</aside>`;
  }

  return {studyFit, applicationPlan, budgetPlan, related, navigation, date};
};
