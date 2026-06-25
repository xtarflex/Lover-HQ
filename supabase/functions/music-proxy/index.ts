// supabase/functions/music-proxy/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight options request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Range, Authorization, apikey',
      },
    });
  }

  const u = new URL(req.url);
  const targetUrl = u.searchParams.get('url');
  if (!targetUrl) {
    return new Response('Missing url parameter', { status: 400 });
  }

  // Echo origin or allow all for public access
  const origin = req.headers.get('origin') ?? '*';

  // Forward the Range header so browser seek and partial chunk requests work
  const range = req.headers.get('range');
  const headers = new Headers();
  if (range) {
    headers.set('Range', range);
  }

  try {
    const upstream = await fetch(targetUrl, { headers });

    // If upstream returns an error that is not 206 (Partial Content), forward it
    if (!upstream.ok && upstream.status !== 206) {
      return new Response(upstream.body, { status: upstream.status });
    }

    const resHeaders = new Headers(upstream.headers);
    resHeaders.set('Access-Control-Allow-Origin', origin);
    resHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    resHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization, apikey');
    resHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    resHeaders.set('Access-Control-Max-Age', '86400');

    return new Response(upstream.body, {
      status: upstream.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error('Proxy request failed:', err);
    return new Response('Internal Proxy Error: ' + err.message, { status: 500 });
  }
});
