import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const searchPaths = [
    path.join(process.cwd(), 'artifacts', 'roma-store', 'public', 'products.json'),
    path.join(process.cwd(), 'dist', 'products.json'),
    path.join(process.cwd(), 'products.json'),
    path.join(process.cwd(), 'public', 'products.json'),
  ];

  for (const filePath of searchPaths) {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.status(200).json(parsed);
        }
      }
    } catch (_) {}
  }

  return res.status(200).json([]);
}
