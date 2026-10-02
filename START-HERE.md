# StudyFlyway — Sky & Lilac

A complete plain HTML, CSS and JavaScript information website for Pakistani students considering Australia, Canada, the United Kingdom, Germany and New Zealand.

## Open it on your Windows laptop

1. Extract the ZIP first (right-click it and choose **Extract All**).
2. Open the extracted `studyflyway` folder.
3. Double-click **index.html**. No Python, npm install, database, or account is needed to preview the pages.

The homepage student image is included locally. Destination photos use Unsplash and fonts use Google Fonts, so those need an internet connection. If these services are unavailable, the site keeps its country labels, navigation, and system-font fallback. The contact form deliberately does not send messages in a local preview.

## Publish with Netlify and GitHub

Use a new repository for StudyFlyway so your existing HealthTrack website stays separate.

1. Put the contents of this folder into your new GitHub repository. `index.html` and `netlify.toml` should be at the repository root.
2. Import that repository into Netlify.
3. Base directory: leave blank. Build command: **node prepare.js**. Publish directory: **dist**. Netlify also reads these values from `netlify.toml`.
4. Deploy. Choose an available site address in Netlify; this project does not claim `studyflyway.netlify.app` for you.
5. On later updates, commit and push your changes to the connected branch. Netlify builds the new version automatically when automatic publishing is enabled.

There are no package dependencies to install. Node is only used by Netlify to copy the static files and prepare SEO metadata. Visitors receive HTML, CSS, JavaScript and images.

### Contact form setup

In Netlify, enable form detection/Netlify Forms for this site, then redeploy. The detected form is named **studyflyway-contact**. Test a submission on the live site and check that it appears in Netlify's form submissions. Configure email notifications there if desired. The form cannot receive messages on a generic static host without a compatible form service. No email address has been invented for you.

If you do not want Netlify Forms, remove the form and add your own real contact method before publishing. Review the included privacy page to ensure it matches your actual operation.

## Included

- Sky & Lilac responsive homepage with the selected visual direction.
- Five country pages with admissions, costs guidance, university links, scholarships and official resources.
- Ten scholarship detail pages and a searchable directory with destination, degree, funding and status filters.
- Six application guides, including an interactive document checklist.
- Three external consultant links (informational listings, not endorsements).
- About, Contact, Editorial Policy, Privacy, Disclaimer, Image Credits, thank-you and custom 404 pages.
- Keyboard focus styles, mobile navigation, reduced-motion support and static readable content when JavaScript is off.
- Unique page titles/descriptions and build-generated canonical URLs, structured data, sitemap and robots.txt.

## SEO setup after publishing

`prepare.js` uses Netlify's production **URL** variable for sitemap and canonical URLs. If you use a custom domain, set **SITE_URL** to its full origin (for example `https://your-real-domain.com`) and redeploy. Verify that the live `/sitemap.xml` uses your final address, then submit that URL in Google Search Console. Indexing or rankings are not guaranteed.

Do not use an all-paths-to-index.html redirect; this is a real multi-page site, not a React app. Links use `.html` for local compatibility; Netlify Pretty URLs serves the corresponding clean addresses.

## Update your website

Open this folder in VS Code:

- Homepage content: `index.html`
- Colours, spacing and responsive layout: `assets/style.css`
- Menus, filters, date labels and local form handling: `assets/app.js`
- Country guides: `countries/*.html`
- Scholarship listings: `scholarships.html`; detail pages: `scholarships/*.html`
- Application guides: `guides/*.html`
- Consultant links: `consultants.html`
- University directory: `universities.html`; profiles: `universities/*.html`
- University content and official sources: `research/universities.json`
- Additional university records and official resources: `research/additional-universities.json` (73 concise profiles; directory total 88)
- Campus photo sources, creators and licences: `research/campus-photos.json`
- University-specific layout and filters: `assets/universities.css` and `assets/universities.js`

After editing university records, run **node scripts/build-universities.js** to regenerate the static pages. The Netlify build does this automatically. All university profiles and directory cards are readable without JavaScript; search and country filters use JavaScript. Campus photographs load from Wikimedia Commons and need an internet connection. Each photo has its own linked credit and reuse licence; some photographs are historical. See `research/README.md` for the editorial workflow. Run **node scripts/check-universities.js** to check internal links, or **node scripts/check-universities-browser.js** for search and responsive checks in an installed Chrome or Edge browser.

Because this is plain HTML, shared navigation/footer edits must be repeated across pages. When adding or changing a scholarship, update its card in `scholarships.html`, its detail page, and any related country/homepage links. Cards use `data-country`, `data-level`, `data-funding`, and `data-status` for filtering. Match the existing values exactly.

`data-closes` accepts an ISO date-time including timezone; after it passes, the display changes to Closed. `data-opens` changes an Upcoming label to Check dates on the scheduled opening day. This avoids claiming an application actually opened without an editorial review. Remove old date attributes when updating a new round. The date text itself is not automatically refreshed.

## Content and images

Initial information was researched on **2 October 2026**. Deadlines, prices, eligibility and policy can change. Fees are presented as cost-planning guidance with official resources, not invented live prices. Review provider sources before launch, particularly time-sensitive scholarship windows. The site is a curated starting point, not an exhaustive university or scholarship database.

All university, scholarship and consultant names belong to their respective organisations. No partner relationships, awards, rankings, student testimonials, or success rates have been fabricated. The campus hero is an AI-generated illustrative image, not a real student endorsement. Destination-photo credits and licenses are linked on `credits.html`.

The university lists are starter links, not rankings. Source summaries do not establish eligibility for every Pakistani applicant. The site does not provide individual immigration or financial advice.

## Optional local build

If Node.js is installed, run `node prepare.js`. Open `dist/index.html` to inspect the generated copy. To test final metadata, run `node prepare.js --url=https://your-real-domain.com`. Do not publish a test hostname.

This ZIP is ready to upload; it has not been deployed or connected to your Netlify account yet.
