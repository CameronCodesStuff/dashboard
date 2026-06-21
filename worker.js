const ALLOWED_ORIGIN = 'https://cameroncodesstuff.github.io';

export default {
  async fetch(req, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const ghPath = url.pathname + url.search;

    const ghRes = await fetch('https://api.github.com' + ghPath, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: 'Bearer ' + env.GITHUB_TOKEN,
        'User-Agent': 'CameronDashboard',
      },
    });

    const body = await ghRes.text();

    return new Response(body, {
      status: ghRes.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  },
};
