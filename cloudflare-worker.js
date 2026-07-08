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
 * Worker 干两件事:
 *   - 给浏览器加 CORS 头(直接调 api.minimaxi.com 没 CORS)
 *   - 拿到 MiniMax 返回的 OSS 签名 URL 后,服务端 fetch 该图片并转 base64
 *     (OSS 桶 hailuo-image-algeng-data.oss-cn-wulanchabu.aliyuncs.com
 *      没配浏览器 CORS,但服务端 fetch 没问题,这样浏览器只走 worker 一个域)
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

    try {
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

      const contentType = resp.headers.get('content-type') || 'application/json';
      const respText = await resp.text();

      // 4. 只对 200 + JSON 响应做 OSS 代理优化
      if (resp.ok && contentType.includes('application/json')) {
        const data = JSON.parse(respText);
        // 4a. 拿到 MiniMax 返回的签名图 URL
        const imageUrl = data?.data?.image_urls?.[0];
        if (imageUrl && imageUrl.startsWith('http')) {
          try {
            // 4b. 服务端 fetch OSS 图(无 CORS 限制)
            const imgResp = await fetch(imageUrl);
            if (imgResp.ok) {
              // 4c. 转 base64 dataUrl,塞进响应的 dataUrl 字段
              const imgContentType = imgResp.headers.get('content-type') || 'image/jpeg';
              const arrayBuffer = await imgResp.arrayBuffer();
              // 用 chunk 拼接避免 spread 大数组触发 call stack 限制
              const bytes = new Uint8Array(arrayBuffer);
              let binary = '';
              const chunkSize = 8192;
              for (let i = 0; i < bytes.length; i += chunkSize) {
                binary += String.fromCharCode.apply(
                  null,
                  bytes.subarray(i, Math.min(i + chunkSize, bytes.length))
                );
              }
              const base64 = btoa(binary);
              data.data = data.data || {};
              data.data.dataUrl = `data:${imgContentType};base64,${base64}`;
            } else {
              data.data = data.data || {};
              data.data.dataUrlError = `OSS fetch returned HTTP ${imgResp.status}`;
            }
          } catch (ossErr) {
            data.data = data.data || {};
            data.data.dataUrlError = String(ossErr.message || ossErr);
          }
        }
        return new Response(JSON.stringify(data), {
          status: resp.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // 4d. 非 JSON 或非 200 → 原样透传
      return new Response(respText, {
        status: resp.status,
        headers: {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'worker_error', message: String(err.message || err) }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
