/**
 * pwa/cloudflare-worker.js
 *
 * 当 MiniMax API 直接从浏览器调用被 CORS 阻挡时,部署这个 Worker 当代理。
 *
 * 部署步骤(5 分钟):
 *   1. 注册/登录 Cloudflare: https://dash.cloudflare.com/sign-up(免费)
 *   2. 左侧 Workers & Pages → Create application → Create Worker
 *   3. 把本文件代码贴进去,Save and Deploy
 *   4. Settings → Variables → 添加:
 *        MINIMAX_API_KEY = sk-cp-...(你的订阅 key)
 *   5. 部署后给一个 URL,例如 https://jingkan-proxy.xxx.workers.dev
 *   6. 在 PWA 的 设置 → 代理 URL 填这个 URL(去掉末尾 /image_generation)
 *
 * 之后所有图片生成请求都走 worker → worker 拿 MINIMAX_API_KEY 调 MiniMax。
 * ⚠️ API key 只在 Cloudflare 那边,浏览器永远看不到。
 */

export default {
  async fetch(request, env) {
    // 1. CORS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 2. 只允许 POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // 3. 拿 body,转发给 MiniMax
    const body = await request.text();
    const resp = await fetch('https://api.minimaxi.com/v1/image_generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.MINIMAX_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    // 4. 把 MiniMax 的响应原样返回,加 CORS 头
    const respBody = await resp.text();
    return new Response(respBody, {
      status: resp.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
