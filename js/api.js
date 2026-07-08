// js/api.js
// 调用 Cloudflare Worker 生成图片 + 拉取结果
// Worker: 代理 CORS + 代理 OSS 图 → dataUrl

import { Store, KEYS } from './store.js';

const DEFAULT_PROXY = 'https://twilight-mouse-eceb.dadagigi1240.workers.dev';

/**
 * 获取代理 URL
 */
export function getProxyUrl() {
  return Store.getSetting('proxyUrl') || DEFAULT_PROXY;
}

/**
 * 生成头像
 * @param {object} args - { positive, negative }
 * @returns {Promise<{dataUrl: string, rawUrl: string}>}
 */
export async function generateAvatar({ positive, negative }) {
  const proxy = getProxyUrl();
  const body = {
    model: 'image-01',
    prompt: positive,
    negative_prompt: negative,
    aspect_ratio: '1:1',
    n: 1,
    response_format: 'url',
  };

  const url = proxy.replace(/\/$/, '') + '/image_generation';
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${JSON.stringify(data).slice(0, 200)}`);
  if (data.base_resp && data.base_resp.status_code !== 0) {
    throw new Error(`MiniMax ${data.base_resp.status_code}: ${data.base_resp.status_msg}`);
  }
  const imageUrl = data?.data?.image_urls?.[0];
  if (!imageUrl) throw new Error('无 image_urls[0]: ' + JSON.stringify(data).slice(0, 300));

  // 优先用 worker 返回的 dataUrl(避免浏览器直连 OSS CORS)
  if (data?.data?.dataUrl && data.data.dataUrl.startsWith('data:')) {
    return { dataUrl: data.data.dataUrl, rawUrl: imageUrl };
  }

  // 兜底:直连 OSS(可能被 CORS 挡)
  const imgResp = await fetch(imageUrl);
  if (!imgResp.ok) throw new Error(`OSS fetch HTTP ${imgResp.status}`);
  const blob = await imgResp.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  return { dataUrl, rawUrl: imageUrl };
}

/**
 * 保存图片到本地(触发下载)
 */
export function saveImage(dataUrl, filename) {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename || `avatar-${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
