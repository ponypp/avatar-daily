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

// ============ 4. 生成头像 ============
async function onGenerate() {
  const user = Store.getUser();
  if (!user) { UI.openProfileModal({}); return; }
  const settings = Store.getSettings();
  if (!getProxyUrl()) { alert('请先在设置中配置代理 URL'); UI.openSettingsModal(); return; }

  const btn = document.getElementById('btnGenerate') || document.getElementById('btnRegen');
  if (btn) btn.disabled = true;
  UI.show('genStatus');

  try {
    const baziV5 = getBaziForUser(user);
    if (!baziV5) throw new Error('八字计算失败');

    const today = todayIso();
    const todayFortune = getTodayFortune(user);

    // 流日判定
    const dailyLevel = classifyDailyLevel(
      null, // 不需要 dailyWuxing,函数内部从 dailyGan 推
      baziV5.yongShen.xiSet,
      baziV5.yongShen.jiSet,
      todayFortune.ganzhi[0],
      todayFortune.ganzhi[1],
      baziV5.bazi.day.zhi,
    );

    // 5 层 prompt
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

    // 调 worker
    const { dataUrl, rawUrl } = await generateAvatar({ positive, negative });

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
    renderMain();
  } catch (err) {
    const msg = (err && err.message) || String(err);
    const isCors = msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS');
    const hint = isCors
      ? '浏览器无法直连 MiniMax(CORS 限制)。默认代理 URL 已填好,确认 设置 → CORS 代理 URL 没被清空;如代理也连不上,可能是 worker 失效或网络问题。'
      : '请检查 API key、网络、模型余额。';
    alert('生成失败:\n\n' + msg + '\n\n' + hint);
  } finally {
    UI.hide('genStatus');
    const btn = document.getElementById('btnGenerate') || document.getElementById('btnRegen');
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

  // 参考图上传处理
  document.getElementById('modalRefUpload')?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('参考图请小于 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const preview = document.getElementById('modalRefPreview');
      if (preview) {
        preview.src = reader.result;
        preview.classList.remove('hidden');
      }
      const removeBtn = document.getElementById('btnRefRemove');
      if (removeBtn) removeBtn.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
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
  });

  // 历史点击
  document.getElementById('history-grid')?.addEventListener('click', onHistoryClick);

  // 启动
  renderMain();
}

// lunar-typescript 通过 ESM 导入,在 bazi.js 顶层已经完成,直接启动
start();
