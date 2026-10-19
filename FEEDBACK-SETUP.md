# Visitor feedback setup

The website remains a static Netlify site. Feedback uses a Netlify Function and a Supabase Postgres database; local file previews cannot save submissions.

1. Create a Supabase project and run `database/feedback.sql` in its SQL Editor. The script enables row level security and restricts access to the server role.
2. Set these environment variables in Netlify, available to Functions:
   - `SITE_URL`: `https://studyflyway.online` (must match the visitor-facing origin, with no path).
   - `SUPABASE_URL`: your project's HTTPS URL.
   - `SUPABASE_SECRET_KEY`: your Supabase server secret key (`sb_secret_…`). Never put it in HTML, browser JavaScript, or Git.
   - `FEEDBACK_ADMIN_TOKEN`: a long, randomly generated password, ideally at least 32 characters.
3. Deploy using the existing `node prepare.js` build. No packages are required. For local API testing, use Netlify Dev with these environment variables and a matching local `SITE_URL`.
4. Visit a university, scholarship, or country page. Test Yes, No with and without a comment, and a star rating. Refresh to verify duplicate prevention. Confirm rows appear in Supabase.
5. Open `/admin-feedback` and enter your admin password. Totals include every database row; the submission table shows 50 rows per page. The password stays in memory and is cleared on reload/sign out. Rotate the Netlify token to revoke access.

The overall rating appears before the footer on normal site pages. Page-specific voting also appears on university, scholarship, and destination directories and detail pages. The build installs the shared assets after regenerating content, so future university builds retain feedback.

Each browser stores a random visitor identifier and successful-submission flags in localStorage. The database enforces one vote per browser/page and one overall rating per browser, including concurrent requests and retries. Clearing browser storage or using another browser allows a new submission. This prevents accidental duplicates; it is not comprehensive bot protection.

No IP addresses or email addresses are stored in the feedback table. Page URLs exclude queries and fragments. Dates come from Postgres. Comments are capped at 2,000 characters and displayed as text in the dashboard. Manage retention/deletion in Supabase. Keep its Data API enabled for the server function. Preview domains need their own matching `SITE_URL` and preferably a separate database.

Run `node --test scripts/check-feedback.js` for API validation/authentication tests. Run `node prepare.js` to build all pages. Test live database connectivity and mobile/keyboard interactions after configuration; mocked API checks do not establish those.
