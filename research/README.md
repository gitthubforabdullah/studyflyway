# University editorial records

The directory lists 88 universities: 20 each in Australia, Canada, the United Kingdom and Germany, plus all eight universities in New Zealand. The original 15 detailed profiles are preserved. All profiles are independent information, with no ranking or partnership claims.

- `universities.json`: original summaries, verified founding dates, campus context and official source links. Last checked 2 October 2026.
- `campus-photos.json`: 45 authentic university photographs, with creator, file title, source page, original dimensions and a verified reuse licence.
- `additional-universities.json`: 73 additional institutions with locations, original short introductions and official resources. These concise profiles omit founding dates, detailed facilities descriptions and photographs pending a separate factual and licensing review. Lettermarks in directory cards are typographic identifiers, not university logos or campus photographs.

Official institutional websites were reviewed on 2 October 2026, with university-sector listings used to cross-check identities: [Study Australia](https://www.studyaustralia.gov.au/en/plan-your-studies/list-of-australian-universities), [Universities Canada](https://univcan.ca/about-universities-canada/our-members/) and [Universities New Zealand](https://www.universitiesnz.ac.nz/universities). Adelaide University is listed using its current identity, rather than counting its predecessor institutions separately.

`node scripts/research-additional-universities.js` retrieves public homepages and collects candidate resource links. Review the candidates before publication: a link labelled International may serve staff or outgoing exchange students, and a fee page may cover domestic applicants. A blocked automated request is recorded in `fetchStatus`; it is not proof that a public website is unavailable. This utility does not run during Netlify builds.

Run `node scripts/build-universities.js` after editing these records. It regenerates the static directory and profiles, adds country-guide profile links and updates university photo credits. The normal Netlify build, `node prepare.js`, also performs this step and includes the new pages in canonical metadata and the sitemap when a deployment URL is available.

Run `node scripts/check-universities.js` to check source pages, or add `--dist` to check the deployment output.

Campus images load from Wikimedia Commons. The photos are authentic, but some are historical; captions and source pages identify their subjects. Image failure messages preserve the source and credits. Header and directory previews use CSS cropping; gallery images preserve their original proportions. Per-image licences apply independently of the site's code and text. Do not replace them with unrelated campus imagery or generated photographs.

No numerical fee estimates are published. The university's current programme and study-year schedule is the source for fees. UK and German scholarship cross-links are regional research starting points, not claims that a university or programme participates in every award.

When updating a profile, check the source links, qualification-specific entry route, teaching language, fees and student services. Update the checked date only after reviewing the sources. Founding dates distinguish incorporation or predecessor history where needed (notably UBC and Manchester). RWTH links clearly identify student-union funding and housing guidance and distinguish International Academy fee conditions.
