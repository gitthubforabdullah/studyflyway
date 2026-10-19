# Content review — 19 October 2026

This refresh corrects verified information and records what still needs review. It is not a certification that every sentence on the website has been independently reverified. Existing review dates remain on background, alumni and provider records unless their specific claims were checked again.

| Area | Review and changes |
| --- | --- |
| 10 scholarships | Reviewed provider eligibility, coverage and application instructions. Rebuilt details, homepage and directory statuses from `research/scholarships.json`. |
| Commonwealth Master’s | Confirmed the 2027–28 round and both portals. HEC: 20 October at 16:00 Pakistan time; CSC: 16:00 BST / 20:00 Pakistan time. The listing uses the earlier required cutoff. |
| Chevening / Australia Awards | Confirmed closed rounds. Added current post-graduation work-experience guidance for Chevening and Pakistan intake conditions for Australia Awards. |
| UBC / Pearson | UBC’s September 2027 applications are open. Pearson’s nomination and admission cutoffs have passed; the later scholarship deadline is relevant only to eligible applicants who completed earlier steps. |
| Auckland / Otago / Melbourne / DAAD | Clarified invitation requirements and 25% tuition support at Auckland, quarterly doctoral allocation and funding review at Otago, automatic consideration at Melbourne, and course-specific EPOS deadlines. Commonwealth Shared remains closed for the round shown by CSC. |
| 88 university rankings | Checked all publisher listings for edition and position. Added 2027 to previously unlabelled entries and corrected UCL from 9 to =8. Hamburg’s ranking was confirmed through the publisher’s indexed listing because its full page timed out. |
| International-student counts | Rechecked 87 publisher tables; UCL changed from 25,672 to 29,881. Hamburg’s earlier 3,612 total could not be rechecked and keeps its 4 October review date. QS does not identify the census year in these displayed tables, so these are publisher-profile figures, not guaranteed current enrolments. |
| University resources | Added FAU’s non-EU fee changes, Memorial’s international entrance-award conditions, and Münster’s international-student advice resource. Removed three dead candidate links from stored research; those candidates were not the published admission links. |
| Five destinations | Added dated, sourced immigration checks for Australian student documentation, Canadian PAL/TAL exemptions, UK Graduate-route duration changes, German Consular Services Portal procedures and New Zealand offer/funding requirements. |
| English tests and application guides | Corrected PTE’s score range to 10–90 and IELTS speaking duration typography. Rechecked IELTS delivery and university language sources. Added the UCAS three-question format and character limits. Other general planning guides remain course-specific advice, not institutional admission promises. |
| Consultants and alumni | Audited available source links and inspected contact/source discrepancies. Automated checks cannot certify provider service quality, every current office, or every biography/degree. Existing factual review dates remain; inaccessible material and archival documents need further manual review. |

Official links supporting the changes are published next to the relevant information and retained in the research records. Rankings/student evidence is in `research/university-facts-review.json`; no ranking value was guessed from an inaccessible page.

## Source availability audit

The initial audit checked 1,432 stored or linked HTML URLs: 1,145 returned readable pages; 287 were unavailable, restricted, throttled or unreadable to the automated client. The latter include 170 HTTP 403 responses, four HTTP 429 responses, three HTTP 404 responses, one unresolved redirect and 94 failed requests. Fifteen HTTP 200 responses were also not readable enough to classify as retrieved. Some restricted sources, including ranking profiles, were subsequently inspected through the browser/search research tools. The HTTP report preserves the original automated results rather than pretending those requests succeeded.

See `research/source-audit.json` for URLs, references, status codes, retrieval times and content hashes. An HTTP 200 result only establishes retrieval; it does not prove factual accuracy. An access failure does not prove a public page is broken. PDF/Word documents, images, social links and photo licences are outside this HTML availability check. The first run included unused research candidates; future runs omit those candidates and check the maintained source records and page links.

## Keeping information current

After this change is pushed to the default branch and GitHub Actions is enabled, `.github/workflows/source-review.yml` runs every Monday at 08:20 Pakistan time, and can also be run manually. It downloads public sources, compares their text hashes with the committed baseline and uploads an **information-source-review** report for 30 days. Its job summary lists access failures and changed pages. Schedule execution is subject to GitHub availability and repository settings.

This workflow has read-only repository permission: it produces a review report and does not edit or deploy factual content. A changed page can mean navigation or promotional content changed; review the official material before changing fees, eligibility, visa guidance or dates. A human still needs to review scholarship deadlines frequently around closing periods, other time-sensitive content at least monthly, and stable institutional background when a source change warrants it.

Update scholarship records in `research/scholarships.json`, university statistics in `research/university-detailed-facts.json`, and dated application notices in `research/university-updates.json` or `research/destination-updates.json`. Use the actual claim-review date. Run `node prepare.js` after editing. Known closing instants switch badges to Closed; Open and Upcoming badges with expired review dates switch to Check dates. This does not open new rounds automatically or change the source-reviewed date.

Validation: static build, source/deployment internal links and anchors, 88 university profiles, 16 consultant profiles, source consistency and scholarship cutoff/expiry tests passed. The legacy browser suite starts and loads the directory but fails its expected three-column desktop assertion (the browser reports four); it does not establish a browser-regression pass for this refresh.
