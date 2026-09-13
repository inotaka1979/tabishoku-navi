/* 旅食Navi — ホットペッパーグルメ Web サービス中継 Worker
 *
 * ブラウザから webservice.recruit.co.jp を直接呼べない（CORS / JSONP 不可）ため、
 * この Worker が代わりに取得して、CORS ヘッダ付きで返します。
 *
 * 使い方（Cloudflare ダッシュボード）
 *   Workers & Pages → Create → Start with Hello World! → 名前 tabishoku-proxy → Deploy
 *   → Edit code → このファイルの中身を全部貼り付け → Deploy
 *   → 表示される URL（https://tabishoku-proxy.xxxx.workers.dev）を firebase-config.js の
 *     window.HOTPEPPER_PROXY に設定
 *
 * エンドポイント
 *   GET /hotpepper?key=...&lat=..&lng=..&range=1-5&count=1-100
 *   同じ位置の結果は 10 分キャッシュ（API の 1 日上限を節約）
 */

const ALLOWED_ORIGINS = [
  'https://inotaka1979.github.io',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(body, status, extra) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, extra || {})
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'GET') return json({ error: 'method' }, 405, cors);

    if (url.pathname === '/' || url.pathname === '/health') {
      return json({ ok: true, service: 'tabishoku-proxy' }, 200, cors);
    }
    if (url.pathname !== '/hotpepper') return json({ error: 'not found' }, 404, cors);

    const key = (env && env.HOTPEPPER_KEY) || url.searchParams.get('key') || '';
    const lat = parseFloat(url.searchParams.get('lat'));
    const lng = parseFloat(url.searchParams.get('lng'));
    let range = parseInt(url.searchParams.get('range') || '3', 10);
    let count = parseInt(url.searchParams.get('count') || '100', 10);
    if (!key || !/^[0-9a-f]{16}$/i.test(key)) return json({ error: 'key' }, 400, cors);
    if (!(lat >= 20 && lat <= 46 && lng >= 122 && lng <= 154)) return json({ error: 'latlng' }, 400, cors);
    if (!(range >= 1 && range <= 5)) range = 3;
    if (!(count >= 1 && count <= 100)) count = 100;

    // 位置を約 100m 単位に丸めてキャッシュキーにする（近い場所の連打で API を叩かない）
    const cacheKey = new Request(
      'https://cache.local/hotpepper?k=' + key + '&lat=' + lat.toFixed(3) + '&lng=' + lng.toFixed(3) + '&range=' + range + '&count=' + count,
      { method: 'GET' }
    );
    const cache = caches.default;
    const hit = await cache.match(cacheKey);
    if (hit) {
      const h = new Headers(hit.headers);
      Object.keys(cors).forEach(k => h.set(k, cors[k]));
      h.set('X-Cache', 'HIT');
      return new Response(hit.body, { status: hit.status, headers: h });
    }

    const upstream = 'https://webservice.recruit.co.jp/hotpepper/gourmet/v1/?key=' + encodeURIComponent(key)
      + '&lat=' + lat + '&lng=' + lng + '&range=' + range + '&count=' + count + '&format=json';
    let res;
    try {
      res = await fetch(upstream, { headers: { 'User-Agent': 'tabishoku-navi-proxy/1.0' }, cf: { cacheTtl: 0 } });
    } catch (e) {
      return json({ error: 'upstream', message: String(e && e.message || e) }, 502, cors);
    }
    const text = await res.text();
    const out = new Response(text, {
      status: res.status,
      headers: Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=600', 'X-Cache': 'MISS' }, cors)
    });
    if (res.ok) ctx.waitUntil(cache.put(cacheKey, out.clone()));
    return out;
  }
};
