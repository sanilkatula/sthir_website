# Sthir Website

<!-- sthir-release:start -->
<!-- sthir-release-version: v2.2 -->
## v2.2 — Text-only release notes

**Minor release** · Previous version: **v2.1**

Release notes now document changes in text, while the repository owner handles
screenshots separately. Publishing a version no longer waits for screenshot
capture or a browser connection.

[Compare with v2.1](https://github.com/sanilkatula/sthir_website/compare/v2.1...v2.2)

### Changes

- Update the release skill to write README change notes without capturing,
  requiring, replacing, or removing screenshots. Owner-added images and
  captions are preserved.
- Remove screenshot-count requirements, preview placeholders, and screenshot
  blockers from the release workflow and README template.
- Update the repository instructions and skill invocation prompt to reflect
  the owner's responsibility for screenshots.
- Keep incremental major/minor version branches and the version-branch-to-main
  merge workflow. Each branch retains notes specific to its own release.
- This is a documentation and workflow update; the website layout, assets,
  and animations are unchanged.

### Validation

- Release skill validation passed.
- Skill metadata and local reference links were checked.
- Git whitespace checks passed.
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
