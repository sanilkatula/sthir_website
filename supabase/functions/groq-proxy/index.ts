const corsHeaderValues = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

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

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders(request)
    });
  }

  if (request.method !== 'POST') {
    return jsonResponse(request, { error: 'Use POST.' }, 405);
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const userPrompt = String(payload?.userPrompt ?? payload?.prompt ?? '').trim();
    const systemInstruction = String(payload?.systemInstruction ?? '').trim();
    const chosenModel = String(
      payload?.model ?? Deno.env.get('GROQ_MODEL') ?? 'llama-3.1-8b-instant'
    ).trim();
    const groqApiKey = Deno.env.get('GROQ_API_KEY') ?? '';

    if (!userPrompt) {
      return jsonResponse(request, { error: 'Missing userPrompt.' }, 400);
    }

    if (!groqApiKey) {
      return jsonResponse(request, { error: 'Missing GROQ_API_KEY secret.' }, 500);
    }

    const messages = [];

    if (systemInstruction) {
      messages.push({
        role: 'system',
        content: systemInstruction
      });
    }

    messages.push({
      role: 'user',
      content: userPrompt
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: chosenModel,
        temperature: 0.2,
        messages
      })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return jsonResponse(
        request,
        {
          error: 'Groq request failed.',
          details: data
        },
        response.status
      );
    }

    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      '';

    return jsonResponse(request, {
      content,
      raw: data
    });
  } catch (error) {
    return jsonResponse(request, {
      error: 'Unexpected error.',
      details: error instanceof Error ? error.message : String(error)
    }, 500);
  }
});
