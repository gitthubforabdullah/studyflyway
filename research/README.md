# University editorial records

The directory starts with the 15 institutions previously linked in the five country guides. All profiles are independent information, with no ranking or partnership claims.

- `universities.json`: original summaries, verified founding dates, campus context and official source links. Last checked 2 October 2026.
- `campus-photos.json`: 45 authentic university photographs, with creator, file title, source page, original dimensions and a verified reuse licence.

Run `node scripts/build-universities.js` after editing these records. It regenerates the static directory and profiles, adds country-guide profile links and updates university photo credits. The normal Netlify build, `node prepare.js`, also performs this step and includes the new pages in canonical metadata and the sitemap when a deployment URL is available.

Run `node scripts/check-universities.js` to check source pages, or add `--dist` to check the deployment output.

Campus images load from Wikimedia Commons. The photos are authentic, but some are historical; captions and source pages identify their subjects. Image failure messages preserve the source and credits. Header and directory previews use CSS cropping; gallery images preserve their original proportions. Per-image licences apply independently of the site's code and text. Do not replace them with unrelated campus imagery or generated photographs.

No numerical fee estimates are published. The university's current programme and study-year schedule is the source for fees. UK and German scholarship cross-links are regional research starting points, not claims that a university or programme participates in every award.

When updating a profile, check the source links, qualification-specific entry route, teaching language, fees and student services. Update the checked date only after reviewing the sources. Founding dates distinguish incorporation or predecessor history where needed (notably UBC and Manchester). RWTH links clearly identify student-union funding and housing guidance and distinguish International Academy fee conditions.
