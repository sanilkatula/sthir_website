# Sthir Website

<!-- sthir-release:start -->
<!-- sthir-release-version: v2.3 -->
## v2.3 — Story, Journal, and smoother motion

**Minor release** · Previous version: **v2.2**

Refined Sthir's content and brand presentation, with a calmer homepage journey
and Pathways styles ready before the page appears.

[Compare with v2.2](https://github.com/sanilkatula/sthir_website/compare/v2.2...v2.3)

### Changes

- **Brand typography:** use local Noka Medium headings and Work Sans body text
  across the homepage, Story, Pathways, Journal, posts, Contact, and admin pages.
  Keep punctuation fallbacks for characters missing from the supplied Noka font.
  Include the original font downloads and Journal reference artwork.
- **Homepage content:** refine the opening story and What we do copy around
  education-to-work choices. Present educational institutions and young adults
  aged 16–25 in two clear audience columns, with programme and cohort links.
  Give the Viola Spolin quote its own full-width purple band with warm accents
  and attribution, and update the invitation to learn more.
- **Sthir Story:** introduce Shalu with a portrait and a chapter-based founder
  story, credentials, formative conversations, and the Making Choice a Play
  section. Add supporting artwork, a Curiosity / Structure / Play band, and
  separate invitations for institutions and young adults.
- **Sthir Journal:** rename Sthir Reflections throughout navigation and footers.
  Add the illustrated "middle muddle" introduction, a founder-story link, and
  a contact invitation while retaining the WordPress article feed.
- **Next-step navigation:** replace Apply Now with the purple Find Your Next
  Step pill, linking to the homepage audience section from desktop and mobile
  menus, footer links, and other existing entry points.
- **Homepage circle motion:** the seven branded circles orbit, gather at a
  shared exit, then descend in order beside Why Sthir exists. Spend more of each
  scroll interval on visible travel and apply a single gentle easing curve.
  Remove a backward step as the route leaves the viewport. Keep arrivals in
  view, catch up during fast scrolling, and return smoothly on reverse scroll.
  Respect reduced-motion preferences.
- **Scrolling performance:** explicitly enable native smooth scrolling for
  homepage anchors, with reduced-motion support. Batch navbar and progress
  updates per frame and animate progress with a transform. Make testimonial
  scrolling consistent on 60 Hz and 120 Hz displays, cache its measurements,
  and pause it offscreen, in hidden tabs, or when reduced motion is requested.
  Preserve hover and drag controls.
- **Pathways loading:** replace browser-generated Tailwind styles with a small
  prebuilt local stylesheet to address the navigation flicker. Preload the
  heading font and connect to font hosts early. Include the stylesheet source,
  configuration, and pinned rebuild command, preserving responsive grids,
  dynamic session utilities, hidden modals, and existing controls.

### Validation

- Parsed all 10 HTML files, 25 external/inline scripts, and 20 external/inline
  stylesheets without syntax errors.
- Verified 10 local routes and 41 local assets return HTTP 200 and match this
  checkout, including the new artwork, fonts, and Pathways stylesheet.
- Scripted motion simulations passed for desktop, short viewports, mobile,
  fast scrolling, reverse scrolling, all seven ordered landings, and reduced
  motion. Visible descents take roughly twice as long in the sampled runs,
  with substantially lower peak speeds.
- Testimonial checks passed for 60/120 Hz timing, hover pause, offscreen idle,
  reduced motion, and cached layout measurements. Checked native/reduced-motion
  scrolling rules and prebuilt Pathways responsive/visibility utilities.
- Git whitespace checks passed. Live browser visual and interaction checks
  were unavailable because no browser was connected.
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
