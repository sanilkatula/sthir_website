import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaderValues = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

const EVENT_FORMATS = ['live', 'on-demand', 'cohort'] as const;
const EVENT_PATH_TYPES = ['ai', '4-week', '6-week', 'general'] as const;
const EVENT_STATUSES = ['draft', 'live', 'archived'] as const;
const INTEREST_TYPES = ['pathways', 'sprints', 'coaching', 'general'] as const;
const INTEREST_STAGES = ['new', 'contacted', 'qualified', 'closed'] as const;
const USER_COLUMNS = 'id, email, full_name, is_admin, created_at, updated_at';

type JsonObject = Record<string, unknown>;

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Edge API.');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

function corsHeaders(request: Request) {
  return {
    ...corsHeaderValues,
    'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
    Vary: 'Origin'
  };
}

function jsonResponse(request: Request, payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: corsHeaders(request)
  });
}

function emptyResponse(request: Request, status = 204) {
  const headers = corsHeaders(request);
  delete headers['Content-Type'];

  return new Response(null, {
    status,
    headers
  });
}

function createHttpError(status: number, message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
}

function hasOwn(payload: JsonObject, key: string) {
  return Object.prototype.hasOwnProperty.call(payload, key);
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isPlainObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function slugify(value: unknown) {
  return cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseDateValue(value: unknown, fieldName: string, errors: string[]) {
  const raw = cleanString(value);

  if (!raw) {
    return null;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    errors.push(`${fieldName} must be a valid date.`);
    return null;
  }

  return parsed.toISOString();
}

function parseInteger(value: unknown, fieldName: string, errors: string[]) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    errors.push(`${fieldName} must be a non-negative whole number.`);
    return null;
  }

  return parsed;
}

function normalizeEventPayload(payload: JsonObject, { partial = false } = {}) {
  const errors: string[] = [];
  const next: JsonObject = {};
  const title = cleanString(payload.title);
  const description = cleanString(payload.description);
  const format = cleanString(payload.format);
  const pathType = cleanString(payload.path_type);
  const status = cleanString(payload.status);
  const slugSource = cleanString(payload.slug) || title;

  if (!partial || hasOwn(payload, 'title')) {
    if (!title) {
      errors.push('title is required.');
    } else {
      next.title = title;
    }
  }

  if (!partial || hasOwn(payload, 'slug') || hasOwn(payload, 'title')) {
    const slug = slugify(slugSource);
    if (!slug) {
      errors.push('slug is required.');
    } else {
      next.slug = slug;
    }
  }

  if (!partial || hasOwn(payload, 'description')) {
    if (!description) {
      errors.push('description is required.');
    } else {
      next.description = description;
    }
  }

  if (!partial || hasOwn(payload, 'format')) {
    if (!EVENT_FORMATS.includes(format as (typeof EVENT_FORMATS)[number])) {
      errors.push(`format must be one of: ${EVENT_FORMATS.join(', ')}.`);
    } else {
      next.format = format;
    }
  }

  if (!partial || hasOwn(payload, 'path_type')) {
    if (!EVENT_PATH_TYPES.includes(pathType as (typeof EVENT_PATH_TYPES)[number])) {
      errors.push(`path_type must be one of: ${EVENT_PATH_TYPES.join(', ')}.`);
    } else {
      next.path_type = pathType;
    }
  }

  if (!partial || hasOwn(payload, 'status')) {
    if (!EVENT_STATUSES.includes(status as (typeof EVENT_STATUSES)[number])) {
      errors.push(`status must be one of: ${EVENT_STATUSES.join(', ')}.`);
    } else {
      next.status = status;
    }
  }

  if (!partial || hasOwn(payload, 'price_usd')) {
    const price = parseInteger(payload.price_usd, 'price_usd', errors);
    if (price !== null) {
      next.price_usd = price;
    }
  }

  if (!partial || hasOwn(payload, 'start_at')) {
    next.start_at = parseDateValue(payload.start_at, 'start_at', errors);
  }

  if (!partial || hasOwn(payload, 'end_at')) {
    next.end_at = parseDateValue(payload.end_at, 'end_at', errors);
  }

  if (!partial || hasOwn(payload, 'cta_label')) {
    const ctaLabel = cleanString(payload.cta_label);
    next.cta_label = ctaLabel || 'Join Waitlist';
  }

  if (!partial || hasOwn(payload, 'cta_url')) {
    next.cta_url = cleanString(payload.cta_url) || null;
  }

  if (!partial || hasOwn(payload, 'location')) {
    next.location = cleanString(payload.location) || null;
  }

  if (!partial || hasOwn(payload, 'is_featured')) {
    next.is_featured = Boolean(payload.is_featured);
  }

  if (errors.length > 0) {
    throw createHttpError(400, errors.join(' '));
  }

  if (partial && Object.keys(next).length === 0) {
    throw createHttpError(400, 'Provide at least one event field to update.');
  }

  next.updated_at = new Date().toISOString();

  return next;
}

function normalizeInterestPayload(payload: JsonObject, { partial = false, admin = false } = {}) {
  const errors: string[] = [];
  const next: JsonObject = {};
  const name = cleanString(payload.name);
  const email = cleanString(payload.email).toLowerCase();
  const phone = cleanString(payload.phone);
  const interestType = cleanString(payload.interest_type);
  const sourcePage = cleanString(payload.source_page);
  const notes = cleanString(payload.notes);
  const stage = cleanString(payload.stage);

  if (!partial || hasOwn(payload, 'name')) {
    if (!name) {
      errors.push('name is required.');
    } else {
      next.name = name;
    }
  }

  if (!partial || hasOwn(payload, 'email')) {
    if (!email) {
      errors.push('email is required.');
    } else if (!validateEmail(email)) {
      errors.push('email must be a valid email address.');
    } else {
      next.email = email;
    }
  }

  if (!partial || hasOwn(payload, 'phone')) {
    next.phone = phone || null;
  }

  if (!partial || hasOwn(payload, 'interest_type')) {
    const normalizedType = interestType || 'general';

    if (!INTEREST_TYPES.includes(normalizedType as (typeof INTEREST_TYPES)[number])) {
      errors.push(`interest_type must be one of: ${INTEREST_TYPES.join(', ')}.`);
    } else {
      next.interest_type = normalizedType;
    }
  }

  if (!partial || hasOwn(payload, 'source_page')) {
    next.source_page = sourcePage || null;
  }

  if (!partial || hasOwn(payload, 'notes')) {
    next.notes = notes || null;
  }

  if (hasOwn(payload, 'metadata')) {
    if (!isPlainObject(payload.metadata)) {
      errors.push('metadata must be a JSON object.');
    } else {
      next.metadata = payload.metadata;
    }
  }

  if (admin && (!partial || hasOwn(payload, 'stage'))) {
    const normalizedStage = stage || 'new';

    if (!INTEREST_STAGES.includes(normalizedStage as (typeof INTEREST_STAGES)[number])) {
      errors.push(`stage must be one of: ${INTEREST_STAGES.join(', ')}.`);
    } else {
      next.stage = normalizedStage;
    }
  }

  if (errors.length > 0) {
    throw createHttpError(400, errors.join(' '));
  }

  if (partial && Object.keys(next).length === 0) {
    throw createHttpError(400, 'Provide at least one interest field to update.');
  }

  next.updated_at = new Date().toISOString();

  return next;
}

async function parseJsonBody(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!isPlainObject(payload)) {
    throw createHttpError(400, 'Request body must be a JSON object.');
  }

  return payload;
}

function deriveFullName(user: { email?: string | null; user_metadata?: JsonObject | null }) {
  return (
    cleanString(user?.user_metadata?.full_name) ||
    cleanString(user?.user_metadata?.name) ||
    cleanString(user?.email).split('@')[0] ||
    'Sthir member'
  );
}

function getBearerToken(authorizationHeader = '') {
  if (!authorizationHeader.startsWith('Bearer ')) {
    return '';
  }

  return authorizationHeader.slice('Bearer '.length).trim();
}

async function getUserFromAccessToken(accessToken: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data?.user) {
    return null;
  }

  return data.user;
}

async function ensureUserProfile(user: { id: string; email?: string | null; user_metadata?: JsonObject | null }) {
  const nextEmail = cleanString(user.email);
  const nextFullName = deriveFullName(user);
  const { data: existing, error: selectError } = await supabaseAdmin
    .from('users')
    .select(USER_COLUMNS)
    .eq('id', user.id)
    .maybeSingle();

  if (selectError) {
    throw selectError;
  }

  if (!existing) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: user.id,
        email: nextEmail,
        full_name: nextFullName,
        updated_at: new Date().toISOString()
      })
      .select(USER_COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  if (existing.email === nextEmail && existing.full_name === nextFullName) {
    return existing;
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({
      email: nextEmail,
      full_name: nextFullName,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.id)
    .select(USER_COLUMNS)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function requireAuth(request: Request) {
  const accessToken = getBearerToken(request.headers.get('authorization') || '');

  if (!accessToken) {
    throw createHttpError(401, 'Missing bearer token.');
  }

  const user = await getUserFromAccessToken(accessToken);
  if (!user) {
    throw createHttpError(401, 'Invalid or expired session.');
  }

  const profile = await ensureUserProfile({
    id: user.id,
    email: user.email,
    user_metadata: isPlainObject(user.user_metadata) ? user.user_metadata : {}
  });

  return {
    accessToken,
    user,
    profile
  };
}

function requireAdmin(auth: { profile?: { is_admin?: boolean } }) {
  if (!auth.profile?.is_admin) {
    throw createHttpError(403, 'Admin access is required.');
  }
}

function getRouteSegments(url: URL) {
  const knownRootSegments = ['health', 'events', 'interests', 'admin'];
  let segments = url.pathname.split('/').filter(Boolean);

  if (segments[0] === 'functions' && segments[1] === 'v1') {
    // Supabase function URLs are /functions/v1/<function-name>/...
    // Strip the platform prefix and the actual deployed function name
    // so the rest of the router can stay function-name agnostic.
    segments = segments.slice(3);
  } else if (segments[0] === 'api') {
    segments = segments.slice(1);
  } else if (segments.length > 1 && knownRootSegments.indexOf(segments[0]) === -1) {
    // Dashboard-hosted functions can surface as /<function-name>/...
    // Keep routing resilient regardless of the deployed function name.
    segments = segments.slice(1);
  }

  return segments;
}

async function listEvents(request: Request, url: URL) {
  const limit = Number(url.searchParams.get('limit') || 0) || null;
  const format = cleanString(url.searchParams.get('format'));
  const status = cleanString(url.searchParams.get('status'));
  const pathType = cleanString(url.searchParams.get('path_type'));
  const upcomingOnly = url.searchParams.get('upcoming') === 'true';

  let query = supabaseAdmin
    .from('events')
    .select('*')
    .order('start_at', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (format) {
    query = query.eq('format', format);
  }

  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.neq('status', 'draft');
  }

  if (pathType) {
    query = query.eq('path_type', pathType);
  }

  if (upcomingOnly) {
    query = query.gte('start_at', new Date().toISOString());
  }

  if (limit) {
    query = query.limit(Math.min(limit, 50));
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return jsonResponse(request, { events: data || [] });
}

async function createInterest(request: Request) {
  const payload = normalizeInterestPayload(await parseJsonBody(request));
  const { data, error } = await supabaseAdmin
    .from('interests')
    .insert(payload)
    .select('id, name, email, interest_type, source_page, stage, created_at')
    .single();

  if (error) {
    throw error;
  }

  return jsonResponse(request, {
    message: 'Interest received.',
    interest: data
  }, 201);
}

async function handleAdminRequest(request: Request, segments: string[]) {
  const auth = await requireAuth(request);

  if (request.method === 'GET' && segments.length === 2 && segments[1] === 'me') {
    return jsonResponse(request, {
      user: {
        id: auth.user.id,
        email: auth.user.email,
        full_name: auth.profile.full_name,
        is_admin: Boolean(auth.profile.is_admin)
      }
    });
  }

  requireAdmin(auth);

  if (request.method === 'GET' && segments.length === 2 && segments[1] === 'users') {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(USER_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return jsonResponse(request, { users: data || [] });
  }

  if (request.method === 'PATCH' && segments.length === 3 && segments[1] === 'users') {
    const payload = await parseJsonBody(request);

    if (typeof payload.is_admin !== 'boolean') {
      throw createHttpError(400, 'is_admin must be a boolean.');
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        is_admin: payload.is_admin,
        updated_at: new Date().toISOString()
      })
      .eq('id', segments[2])
      .select(USER_COLUMNS)
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse(request, { user: data });
  }

  if (request.method === 'GET' && segments.length === 2 && segments[1] === 'events') {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('start_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return jsonResponse(request, { events: data || [] });
  }

  if (request.method === 'POST' && segments.length === 2 && segments[1] === 'events') {
    const payload = normalizeEventPayload(await parseJsonBody(request));
    const { data, error } = await supabaseAdmin
      .from('events')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse(request, { event: data }, 201);
  }

  if (request.method === 'PATCH' && segments.length === 3 && segments[1] === 'events') {
    const payload = normalizeEventPayload(await parseJsonBody(request), { partial: true });
    const { data, error } = await supabaseAdmin
      .from('events')
      .update(payload)
      .eq('id', segments[2])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse(request, { event: data });
  }

  if (request.method === 'DELETE' && segments.length === 3 && segments[1] === 'events') {
    const { error } = await supabaseAdmin
      .from('events')
      .delete()
      .eq('id', segments[2]);

    if (error) {
      throw error;
    }

    return emptyResponse(request);
  }

  if (request.method === 'GET' && segments.length === 2 && segments[1] === 'interests') {
    const { data, error } = await supabaseAdmin
      .from('interests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return jsonResponse(request, { interests: data || [] });
  }

  if (request.method === 'PATCH' && segments.length === 3 && segments[1] === 'interests') {
    const payload = normalizeInterestPayload(await parseJsonBody(request), {
      admin: true,
      partial: true
    });
    const { data, error } = await supabaseAdmin
      .from('interests')
      .update(payload)
      .eq('id', segments[2])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return jsonResponse(request, { interest: data });
  }

  throw createHttpError(404, 'Not found.');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders(request)
    });
  }

  try {
    const url = new URL(request.url);
    const segments = getRouteSegments(url);

    if (request.method === 'GET' && segments.length === 0) {
      return jsonResponse(request, {
        message: 'Sthir Edge API is running.',
        routes: ['/health', '/events', '/interests', '/admin/*']
      });
    }

    if (request.method === 'GET' && segments.length === 1 && segments[0] === 'health') {
      return jsonResponse(request, { status: 'ok' });
    }

    if (request.method === 'GET' && segments.length === 1 && segments[0] === 'events') {
      return await listEvents(request, url);
    }

    if (request.method === 'POST' && segments.length === 1 && segments[0] === 'interests') {
      return await createInterest(request);
    }

    if (segments[0] === 'admin') {
      return await handleAdminRequest(request, segments);
    }

    return jsonResponse(request, { error: 'Not found.' }, 404);
  } catch (error) {
    const status = Number((error as { status?: number } | null)?.status) || 500;
    const message = error instanceof Error ? error.message : 'Unexpected error.';

    if (status >= 500) {
      console.error(error);
    }

    return jsonResponse(request, { error: message }, status);
  }
});
