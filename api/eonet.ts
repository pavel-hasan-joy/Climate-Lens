import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Serverless proxy for NASA EONET v3 API.
 * Keeps external requests first-party, avoids browser CORS issues or ISP blocks.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow browser CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { bbox = '87.5,27.0,93.0,20.0', status = 'open', days = '30', limit = '100' } = req.query;
    const url = `https://eonet.gsfc.nasa.gov/api/v3/events?bbox=${bbox}&status=${status}&days=${days}&limit=${limit}`;

    const apiRes = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ClimateLens-Bangladesh/1.0',
      },
    });

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `NASA EONET responded with ${apiRes.status}` });
    }

    const data = await apiRes.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=1800');
    return res.status(200).json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Failed to proxy NASA EONET request', details: message });
  }
}
