# University editorial records

## Consultant directory

`consultants.json` records the original six providers with expanded services, destinations, offices and contact details reviewed on 18 October 2026. `additional-consultants.json` records the five additions. Official source links appear on every profile; unverified email addresses and prices are omitted. Update these records and run `node scripts/build-consultants.js`; the normal `node prepare.js` build also regenerates the directory and all 11 profiles, copies their assets and adds clean routes.

`consultant-icons.json` records locally cached provider marks. The five new header logos were retrieved from official websites by `python scripts/cache-consultant-logos.py`; this network utility is manual and never runs during deployment. Marks remain owned by their respective organisations and do not imply affiliation.

`specialist-consultants.json` adds AusPak International, Edify Group, HS Consultants, ISAS Consultants and Conzept Connection, reviewed on 18 October 2026. These additions collectively cover Australia, Canada, the UK, New Zealand and Germany; each profile lists only the destinations supported by its official information. All 16 providers use the same compact cards and profile sections. Conzept's phone comes from its official WhatsApp link; its branch street addresses are omitted pending confirmation. ISAS uses its public website icon, retrieved through the favicon cache, rather than a recreated logo.

Run `node scripts/check-consultants.js` and `node scripts/check-consultants.js --dist` to verify profile coverage, local resources and deployment routes.

## Notable alumni

`university-alumni.json` contains two sourced alumni examples for each of the 88 universities (176 entries), reviewed on 4 October 2026. Each entry records the person's name, study connection, a short career summary and an institutional source. Study connections distinguish former students from confirmed graduates; historical institutional names and predecessor universities are identified where relevant. An honorary degree alone is not treated as an earned qualification. Alumni examples are not promises of student outcomes.

The shared profile generator renders these records into static HTML under `#notable-alumni`, including source links. Profile sidebars and directory cards link directly to that section. Edit the JSON and rebuild instead of editing generated profile HTML. `node scripts/check-universities.js` checks all 88 sections, names, source links, navigation anchors and minimum coverage; `--dist` checks the deployment copy.

The directory lists 88 universities: 20 each in Australia, Canada, the United Kingdom and Germany, plus all eight universities in New Zealand. The original 15 detailed profiles are preserved. All profiles are independent information, with no ranking or partnership claims.

- `universities.json`: original summaries, verified founding dates, campus context and official source links. Last checked 18 October 2026.
- `campus-photos.json`: 45 authentic university photographs, with creator, file title, source page, original dimensions and a verified reuse licence.
- `additional-universities.json`: 73 additional institutions with locations, original short introductions and official resources. These concise profiles omit founding dates, detailed facilities descriptions and photographs pending a separate factual and licensing review. Lettermarks in directory cards are typographic identifiers, not university logos or campus photographs.

Official institutional websites were reviewed on 18 October 2026, with university-sector listings used to cross-check identities: [Study Australia](https://www.studyaustralia.gov.au/en/plan-your-studies/list-of-australian-universities), [Universities Canada](https://univcan.ca/about-universities-canada/our-members/) and [Universities New Zealand](https://www.universitiesnz.ac.nz/universities). Adelaide University is listed using its current identity, rather than counting its predecessor institutions separately.

`node scripts/research-additional-universities.js` retrieves public homepages and collects candidate resource links. Review the candidates before publication: a link labelled International may serve staff or outgoing exchange students, and a fee page may cover domestic applicants. A blocked automated request is recorded in `fetchStatus`; it is not proof that a public website is unavailable. This utility does not run during static builds.

Run `node scripts/build-universities.js` after editing these records. It regenerates the static directory and profiles, adds country-guide profile links and updates university photo credits. The normal static build, `node prepare.js`, also performs this step and includes the new pages in canonical metadata and the sitemap when a deployment URL is available.

Run `node scripts/check-universities.js` to check source pages, or add `--dist` to check the deployment output.

All 45 reviewed campus images are served locally from `assets/campus/`. Their original Wikimedia Commons sources, creator credits and reuse licences remain in `campus-photos.json` and beneath each photograph. Some are historical; captions and source pages identify their subjects. Header previews use CSS cropping; gallery images preserve their original proportions. Per-image licences apply independently of the site's code and text. Do not replace them with unrelated campus imagery or generated photographs.

Directory cards use 87 locally cached institutional website icons in `assets/university-icons/`, with sources recorded in `university-icons.json`. These are identification marks owned by their institutions, not campus photographs or claims of affiliation. McMaster retains a lettermark because a suitable site icon could not be retrieved. The shared stylesheet includes university layout rules through `scripts/sync-university-styles.js`; content-derived URL versions prevent stale stylesheet caching. Edit `assets/universities.css`, then rebuild to synchronise the shared styles.

No numerical fee estimates are published. The university's current programme and study-year schedule is the source for fees. UK and German scholarship cross-links are regional research starting points, not claims that a university or programme participates in every award.

When updating a profile, check the source links, qualification-specific entry route, teaching language, fees and student services. Update the checked date only after reviewing the sources. Founding dates distinguish incorporation or predecessor history where needed (notably UBC and Manchester). RWTH links clearly identify student-union funding and housing guidance and distinguish International Academy fee conditions.
