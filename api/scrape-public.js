// /api/scrape-public.js
// Vercel serverless function: fetches and parses public pages from gerardfanals.online
// Called by the AI assistant to get up-to-date public web content

const SITE_URL = 'https://gerardfanals.online';

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'blog', path: '/blog' },
  { name: 'comunidad', path: '/comunidad' },
];

function extractText(html) {
  // Remove script, style, svg, noscript blocks
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
    .replace(/&#[0-9]+;/g, ' ').replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean;
}

function extractMeta(html, field) {
  const m = html.match(new RegExp(`<meta[^>]+name="${field}"[^>]+content="([^"]+)"`, 'i'))
    || html.match(new RegExp(`<meta[^>]+content="([^"]+)"[^>]+name="${field}"`, 'i'));
  return m ? m[1] : '';
}

function extractHeadings(html, tag) {
  const matches = [...html.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))];
  return matches.map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : '';
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600'); // 5 min cache

  const results = [];

  for (const page of PAGES) {
    try {
      const url = SITE_URL + page.path;
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 GerardFanals-AdminBot/1.0' },
        signal: AbortSignal.timeout(6000),
      });
      if (!r.ok) { results.push({ name: page.name, url, error: `HTTP ${r.status}` }); continue; }
      const html = await r.text();
      results.push({
        name: page.name,
        url,
        title: extractTitle(html),
        description: extractMeta(html, 'description'),
        h1: extractHeadings(html, 'h1')[0] || '',
        h2s: extractHeadings(html, 'h2'),
        h3s: extractHeadings(html, 'h3').slice(0, 20),
        fullText: extractText(html).substring(0, 8000),
      });
    } catch (e) {
      results.push({ name: page.name, url: SITE_URL + page.path, error: e.message });
    }
  }

  res.status(200).json({ pages: results, scrapedAt: new Date().toISOString() });
};
