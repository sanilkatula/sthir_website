# Sthir Website

<!-- sthir-release:start -->
<!-- sthir-release-version: v2.1 -->
## v2.1 — Discernment in motion

**Minor release** · Previous version: **v2.0**

The homepage now explains Sthir through one edge, three muscles, and seven
dispositions. A concentric diagram replaces the network background: branded
icons orbit Discernment, then leave in numbered order and follow one shared
track into the Seven Dispositions beside “Why Sthir exists.” Each icon gets a
visible on-screen approach, including the final three.

The larger hero headline stays on three lines across screen sizes. The story
and dispositions share an aligned, balanced layout, with the Viola Spolin quote
spanning the full content width below them. The illustration uses the supplied
Sthir artwork and official purple, orange, red, and pale-yellow palette; the
courage mark is rotated upright. The three muscles open explanations, and the
Clarity Check remains available from the hero.

This version also adds the repository release skill: future releases get a new
version branch, fresh README previews and change notes, then a merge into main.
Older version branches retain their own visual snapshots.

[Compare with v2.0](https://github.com/sanilkatula/sthir_website/compare/v2.0...v2.1)

### Preview

Screenshots are omitted for this release at the repository owner's request.
The fresh-screenshot requirement remains in place for future releases.

### Other changes

- The hero headline scales with its text column and keeps each sentence on its
  own line; supporting text and the Clarity Check button are larger.
- The seven-disposition heading aligns with the opening story paragraph, and
  the component is centred further right. The quote spans both content columns.
- Branded illustrations replace the earlier line icons in both the orbit and
  the list. Source artwork is preserved, framed for legibility, and the courage
  icon is rotated 90 degrees anticlockwise.
- Original icon files and the brand guide are included for future work. PDF
  files use binary diffs so the guide does not produce an unreadable text diff.
- Each numbered disposition uses the same exit and curved track. Scroll timing
  gives all seven a visible descent, including the last three. Returning to the
  hero reverses the sequence; reduced-motion settings show the static diagram.
- Clarity, Courage, and Conscious Choice open explanations, with actions for
  the Clarity Check, Pathways, and ways to work with Sthir.
- The legacy scroll handler now schedules one update per frame instead of
  starting repeated animation loops.
- The repository release skill adds incremental branches, screenshot-backed
  README notes, and the version-branch-to-main release workflow.
- Earlier hero layouts, icons, and animation implementations remain archived
  in comments or inactive source files.

### Validation

- JavaScript, inline script, and CSS syntax checks passed.
- Homepage structure, unique element IDs, local asset links, and the seven
  original brand illustrations were checked; the courage rotation is verified.
- DOM motion checks passed for all seven visible, ordered landings, reverse
  scroll, and reduced-motion handling. Muscle-dialog navigation and Clarity
  Check handoff checks also passed.
- The repository release skill passed validation.
- The local homepage and changed assets returned HTTP 200 and matched the
  release files.
- Visual browser review was unavailable because no browser was connected.
  The owner waived screenshots for this release; DOM checks do not replace
  visual review.
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
