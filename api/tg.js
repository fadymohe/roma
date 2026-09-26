export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const rawUrl = req.url || '';
    // Extract path after /api/tg (e.g. /botTOKEN/method?params)
    const targetPath = rawUrl.replace(/^\/api\/tg/, '');
    const tgUrl = `https://api.telegram.org${targetPath}`;

    const headers = { 'Content-Type': 'application/json' };
    const fetchOptions = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const tgRes = await fetch(tgUrl, fetchOptions);
    const data = await tgRes.json();
    res.status(tgRes.status).json(data);
  } catch (error) {
    console.error('Telegram proxy error:', error);
    res.status(500).json({ ok: false, error: String(error) });
  }
}
