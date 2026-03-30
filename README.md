# Sthir Website

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
