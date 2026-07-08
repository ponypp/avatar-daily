// js/app.js
// 主入口:事件绑定 + 主流程

import {
  calculateBazi, baziV5Full, calculateDaYun, getDailyGanzhi, findShenSha,
} from './bazi.js';
import {
  calculateDailyFortune, calculate7DayForecast, generateDailyAdvice,
} from './fortune.js';
import { buildPrompt, classifyDailyLevel } from './prompts.js';
import { generateAvatar, saveImage, getProxyUrl } from './api.js';
import { Store, KEYS, MAX_HISTORY } from './store.js';
import { UI } from './ui.js';
import {
  AVATAR_STYLES, SCENES, GENDERS, MATERIAL_TYPES, FACE_REFERENCE_LEVELS, TONES,
  MOTTO_EXAMPLES, PUSH_COPY, FORTUNE_DIMENSIONS, QI_YUN_CONFIG, DEFAULT_STYLE,
} from './constants.js';

// ============ 1. 初始化选项按钮组 ============
function initOptionRows() {
  UI.renderOptionRow('modalGenderRow', GENDERS);
  UI.renderOptionRow('modalStyleRow', AVATAR_STYLES.map(s => ({ ...s, value: s.id })));
  UI.renderOptionRow('modalSceneRow', SCENES);
  UI.renderOptionRow('modalMaterialRow', MATERIAL_TYPES);
  UI.renderOptionRow('modalFaceRefRow', FACE_REFERENCE_LEVELS);
  UI.renderOptionRow('modalToneRow', TONES);

  // 格言快捷
  const mottoRow = document.getElementById('modalMottoRow');
  if (mottoRow) {
    mottoRow.innerHTML = MOTTO_EXAMPLES.map(m =>
      `<button class="opt-btn opt-btn--mini" data-motto="${m.text}">${m.label}</button>`
    ).join('');
    mottoRow.addEventListener('click', (e) => {
      if (e.target.dataset.motto) {
        document.getElementById('modalMotto').value = e.target.dataset.motto;
      }
    });
  }

  // 选项按钮单选逻辑
  document.querySelectorAll('.opt-row').forEach(row => {
    row.addEventListener('click', (e) => {
      if (e.target.classList.contains('opt-btn')) {
        row.querySelectorAll('.opt-btn').forEach(b => b.classList.remove('opt-btn--active'));
        e.target.classList.add('opt-btn--active');
      }
    });
  });
}

// ============ 2. 主流程 ============
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function hourFromTime(timeStr) {
  if (!timeStr) return 12;
  const [h] = timeStr.split(':').map(Number);
  return h;
}

function getBaziForUser(user) {
  if (!user || !user.birthDate) return null;
  const [y, m, d] = user.birthDate.split('-').map(Number);
  const h = hourFromTime(user.birthTime);
  return baziV5Full(y, m, d, h);
}

function getTodayFortune(user) {
  const today = todayIso();
  let f = Store.getDailyFortune(today);
  if (f) return f;
  const baziV5 = getBaziForUser(user);
  if (!baziV5) return null;
  f = calculateDailyFortune(baziV5);
  Store.setDailyFortune(today, f);
  return f;
}

// ============ 3. 渲染主视图 ============
function renderMain() {
  const user = Store.getUser();
  if (!user) {
    UI.openProfileModal({});
    return;
  }

  UI.renderUser(user);

  const baziV5 = getBaziForUser(user);
  if (!baziV5) return;

  UI.renderBazi(baziV5.bazi, baziV5.yongShen);

  // 神煞(放命盘旁)
  const shenSha = findShenSha(baziV5.bazi.day.gan, baziV5.bazi);
  const shenShaEl = document.getElementById('shensha-block');
  if (shenShaEl) {
    shenShaEl.innerHTML = shenSha.length > 0
      ? shenSha.map(s => `<span class="shensha-tag">${s.name}(${s.position})</span>`).join('')
      : '<span class="muted">无主要神煞</span>';
  }

  const todayFortune = getTodayFortune(user);
  UI.renderHeader(todayFortune);
  UI.renderFortune(todayFortune.fortune);

  // 7 天
  const forecast = calculate7DayForecast(baziV5);
  UI.renderForecast(forecast);

  // 大运/流年
  const [y] = user.birthDate.split('-').map(Number);
  const daYunResult = calculateDaYun(baziV5.bazi, y);
  UI.renderDaYun(daYunResult);

  // 今日头像
  const todayAvatar = Store.getAvatarByDate(todayIso());
  UI.renderTodayAvatar(todayAvatar);

  // 历史
  const avatars = Store.getAvatars();
  UI.renderHistory(avatars);
}

// ============ 4. 生成头像(带全屏进度遮罩)============
let _genStartTime = 0;
let _genTimer = null;
let _genAborted = false;

function showGenOverlay() {
  _genAborted = false;
  _genStartTime = Date.now();
  const overlay = document.getElementById('genOverlay');
  if (overlay) overlay.classList.remove('hidden');
  // 重置所有步骤
  for (let i = 1; i <= 4; i++) {
    const step = document.getElementById(`genStep${i}`);
    if (step) {
      step.classList.remove('gen-overlay__step--done', 'gen-overlay__step--active');
      step.classList.add('gen-overlay__step--pending');
    }
  }
  const bar = document.getElementById('genBar');
  if (bar) bar.style.width = '0%';
  // 启动计时器
  if (_genTimer) clearInterval(_genTimer);
  _genTimer = setInterval(() => {
    const t = ((Date.now() - _genStartTime) / 1000).toFixed(1);
    const el = document.getElementById('genTime');
    if (el) el.textContent = `已等待 ${t} 秒`;
  }, 100);
  // 标记第一步 active
  updateGenStep(1, 'active');
}

function updateGenStep(stepNum, state) {
  const step = document.getElementById(`genStep${stepNum}`);
  if (!step) return;
  step.classList.remove('gen-overlay__step--pending', 'gen-overlay__step--active', 'gen-overlay__step--done');
  step.classList.add(`gen-overlay__step--${state}`);
  // 更新进度条
  const bar = document.getElementById('genBar');
  if (bar) {
    const pct = { 1: 15, 2: 30, 3: 60, 4: 90 }[stepNum] || 0;
    bar.style.width = pct + '%';
  }
}

function hideGenOverlay() {
  const overlay = document.getElementById('genOverlay');
  if (overlay) overlay.classList.add('hidden');
  if (_genTimer) { clearInterval(_genTimer); _genTimer = null; }
}

async function onGenerate() {
  const user = Store.getUser();
  if (!user) { UI.openProfileModal({}); return; }
  if (!getProxyUrl()) { alert('请先在设置中配置代理 URL'); UI.openSettingsModal(); return; }

  const btn = document.getElementById('btnGenerate');
  if (btn) btn.disabled = true;

  showGenOverlay();
  let success = false;

  try {
    // 步骤 1: 排盘
    updateGenStep(1, 'active');
    await new Promise(r => setTimeout(r, 50)); // 让 UI 渲染
    const baziV5 = getBaziForUser(user);
    if (!baziV5) throw new Error('八字计算失败');
    if (_genAborted) throw new Error('用户取消');
    updateGenStep(1, 'done');
    updateGenStep(1, 'done');
    document.getElementById('genStep1Text').textContent = `排盘完成 · ${baziV5.strength.state}`;

    // 步骤 2: 拼装 prompt
    updateGenStep(2, 'active');
    await new Promise(r => setTimeout(r, 50));

    const today = todayIso();
    const todayFortune = getTodayFortune(user);

    const dailyLevel = classifyDailyLevel(
      null,
      baziV5.yongShen.xiSet,
      baziV5.yongShen.jiSet,
      todayFortune.ganzhi[0],
      todayFortune.ganzhi[1],
      baziV5.bazi.day.zhi,
    );

    const { positive, negative } = buildPrompt({
      style: user.style,
      dayMasterElem: baziV5.strength.dayMasterElement,
      tiaoHouElem: baziV5.yongShen.tiaoHou,
      yongShenElem: baziV5.yongShen.yong,
      xiShenSet: baziV5.yongShen.xiSet,
      dailyGan: todayFortune.ganzhi[0],
      dailyZhi: todayFortune.ganzhi[1],
      dailyLevel,
      motto: user.motto,
      tone: user.tone || '神秘',
      faceReference: user.faceReference,
      materialType: user.materialType,
      outputType: '人像',
      gender: user.gender,
      scene: user.scene,
    });
    if (_genAborted) throw new Error('用户取消');
    updateGenStep(2, 'done');
    document.getElementById('genStep2Text').textContent = `Prompt 就绪 · ${positive.length} 字`;

    // 步骤 3: 调 worker
    updateGenStep(3, 'active');
    document.getElementById('genStep3Text').textContent = 'MiniMax 生成中(可能 10-20 秒)...';
    const t0 = Date.now();
    const { dataUrl, rawUrl } = await generateAvatar({ positive, negative });
    if (_genAborted) throw new Error('用户取消');
    const workerSec = ((Date.now() - t0) / 1000).toFixed(1);
    updateGenStep(3, 'done');
    document.getElementById('genStep3Text').textContent = `生成完成 · ${workerSec}s`;

    // 步骤 4: 拉取图片
    updateGenStep(4, 'active');
    document.getElementById('genStep4Text').textContent = '存储中...';
    await new Promise(r => setTimeout(r, 50));

    // 保存
    const rec = {
      date: today,
      bazi: baziV5.bazi,
      strength: baziV5.strength,
      yongShen: baziV5.yongShen,
      qiYun: todayFortune.qiYun,
      fortune: todayFortune.fortune,
      imageDataUrl: dataUrl,
      rawUrl,
      prompt: positive,
      negative,
      style: user.style,
      dailyLevel,
    };
    Store.addAvatar(rec);
    if (_genAborted) throw new Error('用户取消');
    updateGenStep(4, 'done');
    document.getElementById('genStep4Text').textContent = '已保存到历史';
    const bar = document.getElementById('genBar');
    if (bar) bar.style.width = '100%';
    success = true;
    renderMain();
  } catch (err) {
    if (err.message === '用户取消') {
      // 隐藏遮罩,直接返回
    } else {
      const msg = (err && err.message) || String(err);
      const isCors = msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS');
      const hint = isCors
        ? '浏览器无法直连 MiniMax(CORS 限制)。默认代理 URL 已填好,确认 设置 → CORS 代理 URL 没被清空;如代理也连不上,可能是 worker 失效或网络问题。'
        : '请检查 API key、网络、模型余额。';
      alert('生成失败:\n\n' + msg + '\n\n' + hint);
    }
  } finally {
    hideGenOverlay();
    if (btn) btn.disabled = false;
  }
}

// ============ 5. 保存图片 / 收藏 ============
function onSaveImage() {
  const today = todayIso();
  const avatar = Store.getAvatarByDate(today);
  if (!avatar) return;
  saveImage(avatar.imageDataUrl, `avatar-${today}.jpg`);
}

function onToggleFav() {
  const today = todayIso();
  const avatar = Store.getAvatarByDate(today);
  if (!avatar) return;
  const isFav = Store.toggleFavorite(today);
  renderMain();
  if (isFav) {
    // 简单提示
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = '已收藏 ⭐';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

// ============ 6. 历史点击 → 大图查看 ============
function onHistoryClick(e) {
  const item = e.target.closest('.history-item');
  if (!item) return;
  const date = item.dataset.date;
  const avatar = Store.getAvatarByDate(date);
  if (!avatar) return;
  // 简易 modal 显示
  const modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.innerHTML = `
    <div class="modal-card modal-card--large">
      <div class="modal-header">${date} · ${avatar.dailyLevel}</div>
      <img src="${avatar.imageDataUrl}" class="modal-image" />
      <div class="modal-actions">
        <button class="btn-secondary" data-action="fav">${Store.isFavorite(date) ? '★ 已收藏' : '☆ 收藏'}</button>
        <button class="btn-secondary" data-action="save">保存</button>
        <button class="btn-primary" data-action="close">关闭</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (ev) => {
    if (ev.target === modal || ev.target.dataset.action === 'close') modal.remove();
    if (ev.target.dataset.action === 'fav') {
      Store.toggleFavorite(date);
      renderMain();
      modal.remove();
    }
    if (ev.target.dataset.action === 'save') saveImage(avatar.imageDataUrl, `avatar-${date}.jpg`);
  });
}

// ============ 7. 启动 ============
function start() {
  initOptionRows();

  // 按钮绑定
  document.getElementById('btnGenerate')?.addEventListener('click', onGenerate);
  document.getElementById('btnEditProfile')?.addEventListener('click', () => UI.openProfileModal(Store.getUser()));
  document.getElementById('btnSettings')?.addEventListener('click', () => UI.openSettingsModal());

  // 监听头像区自定义事件(由 ui.js 渲染头像时绑定后 dispatch)
  document.addEventListener('app:generate', () => onGenerate());
  document.addEventListener('app:regenerate', () => onGenerate());

  // 取消生成按钮
  document.getElementById('btnCancelGen')?.addEventListener('click', () => {
    _genAborted = true;
    const el = document.getElementById('genStep3Text');
    if (el) el.textContent = '已请求取消...';
  });

  // Modal 操作
  document.getElementById('btnModalCancel')?.addEventListener('click', () => UI.hide('modalBg'));
  document.getElementById('btnModalSave')?.addEventListener('click', () => {
    const title = document.getElementById('modalTitle').textContent;
    if (title === '个人资料') {
      const u = UI.collectProfileForm();
      if (!u.birthDate) { alert('请填写生日'); return; }
      // 收集参考图
      const refImg = document.getElementById('modalRefPreview')?.src;
      if (refImg && refImg.startsWith('data:')) u.referenceImage = refImg;
      Store.setUser(u);
      UI.hide('modalBg');
      renderMain();
    } else {
      // 设置
      const proxy = document.getElementById('modalProxy').value.trim();
      const key = document.getElementById('modalKey').value.trim();
      Store.setSetting('proxyUrl', proxy);
      Store.setSetting('minimaxKey', key);
      UI.hide('modalBg');
    }
  });

  // 参考图上传处理(自动压缩 + 错误显示 + 重复选择支持)
  const refErr = document.getElementById('modalRefErr');
  const refOk = document.getElementById('modalRefOk');
  const setRefError = (msg) => {
    if (refErr) { refErr.textContent = msg; refErr.classList.remove('hidden'); }
    if (refOk) refOk.classList.add('hidden');
  };
  const setRefOk = (msg) => {
    if (refOk) { refOk.textContent = msg; refOk.classList.remove('hidden'); }
    if (refErr) refErr.classList.add('hidden');
  };
  const clearRefStatus = () => {
    if (refErr) refErr.classList.add('hidden');
    if (refOk) refOk.classList.add('hidden');
  };

  // 图片自动压缩:限制最大边 800px,JPEG 质量 0.85,几乎任何原图都能压到 < 200KB
  const compressImage = (file, maxEdge = 800, quality = 0.85) => new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) { reject(new Error('不是图片')); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(1, maxEdge / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('canvas.toBlob 失败')); return; }
          const r2 = new FileReader();
          r2.onload = () => resolve({
            dataUrl: r2.result,
            originalSize: file.size,
            compressedSize: blob.size,
            width: canvas.width,
            height: canvas.height,
            name: file.name,
          });
          r2.onerror = () => reject(new Error('压缩后读取失败'));
          r2.readAsDataURL(blob);
        }, 'image/jpeg', quality);
      };
      img.onerror = () => reject(new Error('图片解码失败'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });

  document.getElementById('modalRefUpload')?.addEventListener('change', async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) { clearRefStatus(); return; }
      if (!file.type.startsWith('image/')) {
        setRefError('请选择图片文件(支持 jpg/png/gif/webp)');
        e.target.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setRefError(`图片过大: ${(file.size / 1024 / 1024).toFixed(2)}MB,最大 5MB(超 5MB 需要先在相册/微信里压缩)`);
        e.target.value = '';
        return;
      }
      setRefOk(`已选择 ${file.name} (${(file.size / 1024).toFixed(0)}KB),正在压缩到 800px...`);

      const result = await compressImage(file);
      const preview = document.getElementById('modalRefPreview');
      if (preview) {
        preview.src = result.dataUrl;
        preview.classList.remove('hidden');
      }
      const removeBtn = document.getElementById('btnRefRemove');
      if (removeBtn) removeBtn.classList.remove('hidden');
      const ratio = result.compressedSize / result.originalSize;
      setRefOk(
        `已压缩 ${(result.originalSize / 1024).toFixed(0)}KB → ${(result.compressedSize / 1024).toFixed(0)}KB ` +
        `(${(ratio * 100).toFixed(0)}%, ${result.width}×${result.height}),点保存生效`
      );
    } catch (err) {
      setRefError('上传处理异常: ' + err.message);
    }
  });

  document.getElementById('btnRefRemove')?.addEventListener('click', () => {
    const preview = document.getElementById('modalRefPreview');
    if (preview) {
      preview.src = '';
      preview.classList.add('hidden');
    }
    const removeBtn = document.getElementById('btnRefRemove');
    if (removeBtn) removeBtn.classList.add('hidden');
    const upload = document.getElementById('modalRefUpload');
    if (upload) upload.value = '';
    clearRefStatus();
  });

  // 历史点击
  document.getElementById('history-grid')?.addEventListener('click', onHistoryClick);

  // 启动
  renderMain();
}

// lunar-typescript 通过 ESM 导入,在 bazi.js 顶层已经完成,直接启动
start();
