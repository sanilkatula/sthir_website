# Sthir Website

<!-- sthir-release:start -->
<!-- sthir-release-version: v2.4 -->
## v2.4 — Pathways experiences and email-series interests

**Minor release** · Previous version: **v2.3**

Add Sthir Saturdays and See, and Be Seen! to Pathways, with dedicated experience
pages, a working email-series interest form, and consistent next-step actions.

[Compare with v2.3](https://github.com/sanilkatula/sthir_website/compare/v2.3...v2.4)

### Changes

- **Pathways directory:** introduce local featured experiences alongside
  sessions from the existing backend. Add dates, location, eligibility,
  free-session ribbons, and View details links. Keep Sthir Saturdays in live
  sessions and classify the self-paced email series as on-demand. Existing
  session search, format/pathway filters, date grouping, and cohort forms remain
  available. Keep both local experiences visible during an events-loading
  failure and show a helpful retry message.
- **Sthir Saturdays:** add a dedicated workshop page with the December session
  schedule, external registration links, host introduction, FAQ, illustrations,
  and a workshop video. Include local brand fonts, imagery, video assets, and
  shared site navigation/footer with mobile menu controls.
- **See, and Be Seen!:** add the illustrated 12-day email-series page with
  journaling prompts, practical information, and the latest opening/closing
  copy and emphasis from the source branch.
- **Interest capture:** replace disabled email-series signup buttons with
  Register interest links to a compact form. Require email, allow an optional
  name, validate input, prevent duplicate clicks while saving, retain input on
  failure, allow retry, and confirm only a completed save. Include accessible
  labels, status feedback, keyboard focus styles, and a no-JavaScript contact
  option. This captures interest for follow-up; it does not start automated
  email delivery.
- **Backend compatibility:** submit to the existing `/interests` endpoint using
  the supported `pathways` type and series metadata. Add a readable series
  label in admin interests. Existing Supabase functions, schema, authentication,
  and access rules require no changes or migrations.
- **Consistent actions:** use the same pill shape, sizing, typography, focus,
  hover, and disabled states across session pages, cards, and interest forms,
  with a contrasting fill on purple backgrounds. Use Register interest for
  cohorts and the email series, Join a Saturday for the workshop, Try AI tools
  for the free tool, and View details for secondary links. Show cohort prices
  separately. Keep internal actions in the same tab and external registration
  links in a new tab. Reject unsupported action URL protocols.
- **Navigation and loading:** label homepage and founder-story entry points
  Explore Pathways. Preserve the prebuilt Pathways stylesheet to avoid the
  previous style-generation flash, rebuild its utilities, and version updated
  script/style URLs. Detail-page anchors use native scrolling with reduced-motion
  support.
- **Local development:** serve MP4/MOV video and OTF/TTF fonts with their proper
  content types. Add `npm test` and 13 regression tests using the real Edge API
  handler with in-memory database/auth adapters and DOM-based form checks.
  Refresh the dependency lockfile to match the static-site workspace, remove
  obsolete framework/backend lock entries, and add the development-only DOM
  test dependency with its WebSocket advisory resolved. Document how to run
  checks without writing to production or sending email.

### Validation

- All 13 automated tests passed: email-series form-to-API integration and admin
  visibility, validation, optional name, duplicate-click prevention, failed and
  unconfirmed saves, retry, missing runtime, event merging/filtering, local
  fallbacks, consistent calls to action, existing cohort/contact/footer forms,
  API validation, published events, CORS, database errors, and admin access.
- Live backend checks passed: health and published events returned HTTP 200,
  invalid interest input returned HTTP 400, and unauthenticated admin interests
  returned HTTP 401. No valid test contacts were inserted into production.
- Verified 12 local routes and 63 local assets, including nested-page images,
  fonts, scripts, styles, and workshop video; video uses `video/mp4`.
- Parsed 12 HTML files, 27 external/inline scripts, 24 stylesheets, both Edge
  functions, and checked for duplicate HTML IDs. Git whitespace checks passed.
- Dependency audit reported zero vulnerabilities after updating the test-only
  WebSocket dependency. Live visual browser review was unavailable because no
  browser was connected.
<!-- sthir-release:end -->

- `frontend/` hosted as a plain static site on Cloudflare Pages or GitHub Pages
- Supabase handles the database, auth, and Edge Functions
- `supabase/functions/api` replaces the deployed Express backend

## Structure

- `frontend/`
  Static site, with a small local server available in `frontend/server.js`
- `supabase/schema.sql`
  Tables, triggers, and RLS for `users`, `events`, and `interests`
- `supabase/functions/api/index.ts`
  Supabase Edge API for public events, admin actions, and interest submissions
- `supabase/functions/groq-proxy/index.ts`
  Supabase Edge Function that hides the Groq API key

## Checks

Install development dependencies with `npm install`, then run `npm test`.
The tests use Node's `module.stripTypeScriptTypes` API; they were verified on
Node 26. They exercise the actual Edge API handler with in-memory database and
authentication fixtures, plus the signup forms and Pathways interactions.
Automated tests do not write to the live Supabase database or send emails.
