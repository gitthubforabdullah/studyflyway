'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
for (const name of ['privacy-policy.html', 'privacy.html']) {
  const file = path.join(root, name);
  let html = fs.readFileSync(file, 'utf8');
  if (!html.includes('id="visitor-feedback-privacy"')) {
    html = html.replace('<section id="privacy-choices"', '<section id="visitor-feedback-privacy"><h2>Visitor Feedback</h2><p>If you submit feedback, we store your helpfulness vote or star rating, the page URL without query parameters or fragments, any optional comment, a random browser identifier, and the submission date in a Supabase database through our Netlify hosting. Please avoid including personal or sensitive information in comments. Your browser stores the random identifier and successful-submission flags in local storage to prevent accidental duplicates. Clearing browser storage removes those local records but does not delete feedback already submitted. Feedback is accessible to the site administrator and retained while needed to improve our content; contact us about deletion requests and include the page and approximate submission date to help locate your feedback.</p></section><section id="privacy-choices"');
    fs.writeFileSync(file, html);
  }
}
for (const directory of ['', 'universities', 'scholarships', 'countries', 'guides', 'consultants']) {
  for (const name of fs.readdirSync(path.join(root, directory))) {
    if (!name.endsWith('.html') || name === 'admin-feedback.html') continue;
    const file = path.join(root, directory, name);
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('<footer') || html.includes('/assets/feedback.js')) continue;
    html = html.replace('</head>', '<link rel="stylesheet" href="/assets/feedback.css"><script src="/assets/feedback.js" defer></script></head>');
    fs.writeFileSync(file, html);
  }
}
