# Sthir Website

This repo now supports the low-cost deployment shape we discussed:

- `frontend/` can be hosted as a plain static site on Cloudflare Pages or GitHub Pages
- Supabase handles the database, auth, and Edge Functions
- `supabase/functions/api` replaces the deployed Express backend
- `backend/` remains here as the original local Node reference if you still want it during development

## Structure

- `frontend/`
  Static site, with a small local server available in `frontend/server.js`
- `backend/`
  Original Express API reference used during local development
- `supabase/schema.sql`
  Tables, triggers, and RLS for `users`, `events`, and `interests`
- `supabase/functions/api/index.ts`
  Supabase Edge API for public events, admin actions, and interest submissions
- `supabase/functions/groq-proxy/index.ts`
  Supabase Edge Function that hides the Groq API key

## What is implemented

- Existing public frontend kept in the same visual style
- New `frontend/pathways/` page following the same folder-per-page pattern as `about`, `contact`, and `blog`
- New `frontend/admin/` page:
  - Supabase email/password sign-in
  - admin check against `public.users.is_admin`
  - user role management
  - create/update/delete events
  - review and update pathway interests
- Homepage AI tools now call the Supabase Edge Function instead of a local Groq proxy
- Public pathway interest form writes to the `interests` table through the Edge API
- Navigation updated so `Pathways` points to the new dedicated page
- Static-host frontend support now uses `frontend/config.json` instead of relying on `/api/config`

## Frontend Config For Static Hosting

Copy `frontend/config.example.json` to `frontend/config.json` and fill:

- `supabaseUrl`
- `supabaseAnonKey`
- optional: `apiBaseUrl`
- optional: `groqFunctionUrl`

If you leave `apiBaseUrl` blank, the site will use:

`<supabaseUrl>/functions/v1/api`

If your deployed Edge function has a different name, set `apiBaseUrl` to the exact function URL instead.
Example: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/database-api-calls`

If you leave `groqFunctionUrl` blank, the site will use:

`<supabaseUrl>/functions/v1/groq-proxy`

For local frontend-only development, you can still use `frontend/.env` with:

- `BACKEND_API_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- optional: `HOST`, `PORT`, `GROQ_EDGE_FUNCTION_URL`

### Backend

Copy `backend/.env.example` to `backend/.env` and set:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional: `HOST`, `PORT`, `FRONTEND_ORIGIN`

## Supabase setup

1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql`.
3. Create at least one auth user in Supabase Auth.
4. Mark that user as admin in `public.users` by setting `is_admin = true`.
5. Add Edge Function secrets:
   - `GROQ_API_KEY`
   - optional: `GROQ_MODEL`
6. Deploy the Edge Functions:

```bash
supabase functions deploy api --no-verify-jwt
supabase functions deploy groq-proxy --no-verify-jwt
```

## Static Frontend Deployment

### Cloudflare Pages

- Framework preset: `None`
- Build command: leave empty
- Output directory: `frontend`
- Make sure `frontend/config.json` is present in the deployed site

### GitHub Pages

- Publish the `frontend/` directory
- Keep `frontend/.nojekyll`
- Make sure `frontend/config.json` is committed with your public Supabase values
- The root URL now works because `frontend/index.html` redirects to `hybrid_positive_framing.html`

## Run locally

Install dependencies from the repo root:

```bash
npm install
```

Start the frontend:

```bash
npm --workspace frontend run start
```

If you still want the original Express backend locally, start it in another terminal:

```bash
npm run dev:backend
```

## Main assumptions

- Admin authentication happens in Supabase Auth
- Admin authorization happens through `public.users.is_admin`
- Public pages only show published events
- `interests` is currently used for pathway interest capture
- Production hosting is now expected to be:
  - static frontend on Cloudflare Pages or GitHub Pages
  - Supabase Edge Functions for API and Groq proxy
