// js/ui.js
// 渲染函数:所有视图在这里组装

import { Store } from './store.js';
import { calculateDaYun, getNaYin, findShenSha } from './bazi.js';
import { FORTUNE_DIMENSIONS, QI_YUN_CONFIG, AVATAR_STYLES, SCENES, GENDERS, MATERIAL_TYPES, FACE_REFERENCE_LEVELS, TONES } from './constants.js';

const $ = (id) => document.getElementById(id);

export const UI = {
  show(id) { $(id)?.classList.remove('hidden'); },
  hide(id) { $(id)?.classList.add('hidden'); },

  // ---- 顶部:今日干支 + 综合气运 ----
  renderHeader(dailyFortune) {
    if (!dailyFortune) return;
    const cfg = QI_YUN_CONFIG[dailyFortune.totalStars];
    const el = $('today-header');
    if (!el) return;
    el.innerHTML = `
      <div class="today-date">${dailyFortune.date}</div>
      <div class="today-ganzhi">${dailyFortune.ganzhi}日</div>
      <div class="today-qiyun" style="color: ${cfg.color}">
        <div class="qiyun-stars">${cfg.stars}</div>
        <div class="qiyun-mood">${cfg.mood} · ${dailyFortune.dailyLevel}</div>
      </div>
    `;
  },

  // ---- 命盘(四柱)----
  renderBazi(bazi, yongShen) {
    const el = $('bazi-pillars');
    if (!el) return;
    const pillars = [
      { label: '年柱', ...bazi.year,  naYin: getNaYin(bazi.year.gan, bazi.year.zhi)  },
      { label: '月柱', ...bazi.month, naYin: getNaYin(bazi.month.gan, bazi.month.zhi) },
      { label: '日柱', ...bazi.day,   naYin: getNaYin(bazi.day.gan, bazi.day.zhi)   , isDay: true },
      { label: '时柱', ...bazi.time,  naYin: getNaYin(bazi.time.gan, bazi.time.zhi)  },
    ];
    el.innerHTML = pillars.map(p => `
      <div class="pillar ${p.isDay ? 'pillar--day' : ''}">
        <div class="pillar__label">${p.label}</div>
        <div class="pillar__gan">${p.gan}</div>
        <div class="pillar__zhi">${p.zhi}</div>
        <div class="pillar__nayin">${p.naYin}</div>
      </div>
    `).join('');
  },

  // ---- 用神 + 五行 ----
  renderYongShen(yongShen) {
    const el = $('yongshen-block');
    if (!el) return;
    el.innerHTML = `
      <div class="ys-row">
        <span class="ys-label">用神</span>
        <span class="ys-value ys-yong">${yongShen.yong}</span>
        ${yongShen.tiaoHou ? `<span class="ys-tag">调候:${yongShen.tiaoHou}</span>` : ''}
        ${yongShen.conflictFlag ? '<span class="ys-tag ys-tag--warn">冲突</span>' : ''}
      </div>
      <div class="ys-row">
        <span class="ys-label">喜神</span>
        <span class="ys-value">${yongShen.xiSet.join(' · ')}</span>
      </div>
      <div class="ys-row">
        <span class="ys-label">忌神</span>
        <span class="ys-value">${yongShen.jiSet.join(' · ')}</span>
      </div>
    `;
  },

  // ---- 5 维运势 ----
  renderFortune(fortune) {
    const el = $('fortune-grid');
    if (!el) return;
    el.innerHTML = FORTUNE_DIMENSIONS.map(dim => {
      const f = fortune[dim.id];
      const stars = '★'.repeat(f.stars) + '☆'.repeat(5 - f.stars);
      return `
        <div class="fortune-card" style="border-color: ${dim.color}33">
          <div class="fortune-card__header">
            <span class="fortune-card__emoji">${dim.emoji}</span>
            <span class="fortune-card__label" style="color: ${dim.color}">${dim.label}</span>
          </div>
          <div class="fortune-card__stars" style="color: ${dim.color}">${stars}</div>
          <div class="fortune-card__desc">${f.desc}</div>
        </div>
      `;
    }).join('');
  },

  // ---- 7 天预报 ----
  renderForecast(forecast) {
    const el = $('forecast-list');
    if (!el) return;
    el.innerHTML = forecast.map((f, i) => {
      const cfg = QI_YUN_CONFIG[f.totalStars];
      const dayLabel = i === 0 ? '今' : i === 1 ? '明' : new Date(f.date).toLocaleDateString('zh-CN', { weekday: 'short' });
      return `
        <div class="forecast-item">
          <div class="forecast-item__day">${dayLabel}</div>
          <div class="forecast-item__date">${f.date.slice(5)}</div>
          <div class="forecast-item__gz">${f.ganzhi}</div>
          <div class="forecast-item__stars" style="color: ${cfg.color}">${cfg.stars}</div>
        </div>
      `;
    }).join('');
  },

  // ---- 大运/流年 ----
  renderDaYun(daYunResult) {
    const el = $('dayun-block');
    if (!el) return;
    const { currentDaYun, ageThisYear, liuNian, daYun } = daYunResult;
    el.innerHTML = `
      <div class="dayun-header">
        <div>
          <div class="dayun-label">当前大运</div>
          <div class="dayun-current">${currentDaYun.startAge}-${currentDaYun.endAge}岁 · ${currentDaYun.zhi}(${currentDaYun.wuxing})</div>
        </div>
        <div>
          <div class="dayun-label">流年</div>
          <div class="dayun-liunian">${liuNian}</div>
        </div>
        <div>
          <div class="dayun-label">今年虚岁</div>
          <div class="dayun-age">${ageThisYear}</div>
        </div>
      </div>
      <div class="dayun-track">
        ${daYun.map((d, i) => `
          <div class="dayun-step ${d === currentDaYun ? 'dayun-step--current' : ''}">
            <div class="dayun-step__age">${d.startAge}</div>
            <div class="dayun-step__zhi">${d.zhi}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ---- 今日头像 ----
  renderTodayAvatar(avatar) {
    const el = $('today-avatar');
    if (!el) return;
    if (avatar && avatar.imageDataUrl) {
      el.innerHTML = `
        <div class="avatar-card">
          <img src="${avatar.imageDataUrl}" alt="今日头像" class="avatar-img" />
          <div class="avatar-actions">
            <button class="btn-secondary" data-action="save">保存到相册</button>
            <button class="btn-secondary" data-action="fav">${Store.isFavorite(avatar.date) ? '★ 已收藏' : '☆ 收藏'}</button>
            <button class="btn-primary" data-action="regen">重新生成</button>
          </div>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="avatar-empty">
          <div class="avatar-empty__text">今日头像还没生成</div>
          <button class="btn-primary" data-action="generate">生成今日头像</button>
        </div>
      `;
    }
  },

  // ---- 历史缩略图 ----
  renderHistory(avatars) {
    const el = $('history-grid');
    if (!el) return;
    if (avatars.length === 0) {
      el.innerHTML = '<div class="empty">还没有生成过</div>';
      return;
    }
    el.innerHTML = avatars.map(a => `
      <div class="history-item ${Store.isFavorite(a.date) ? 'history-item--fav' : ''}" data-date="${a.date}">
        <img src="${a.imageDataUrl}" alt="${a.date}" />
        <div class="history-item__date">${a.date.slice(5)}</div>
        ${Store.isFavorite(a.date) ? '<div class="history-item__star">★</div>' : ''}
      </div>
    `).join('');
  },

  // ---- 用户信息卡 ----
  renderUser(user) {
    const el = $('user-card');
    if (!el || !user) return;
    el.innerHTML = `
      <div class="user-row"><span class="user-label">生日</span><span>${user.birthDate} ${user.birthTime || '?'}</span></div>
      <div class="user-row"><span class="user-label">性别</span><span>${GENDERS.find(g => g.id === user.gender)?.label || '?'}</span></div>
      <div class="user-row"><span class="user-label">风格</span><span>${user.style}</span></div>
      <div class="user-row"><span class="user-label">场景</span><span>${user.scene || '?'}</span></div>
      <div class="user-row"><span class="user-label">格言</span><span>${user.motto || '(空)'}</span></div>
    `;
  },

  // ---- 编辑 profile modal ----
  openProfileModal(user) {
    this._fillProfileForm(user || {});
    this.show('modalBg');
  },

  _fillProfileForm(u) {
    $('modalTitle').textContent = '个人资料';
    $('modalProfileForm').classList.remove('hidden');
    $('modalSettingsForm').classList.add('hidden');
    $('modalBirthDate').value = u.birthDate || '';
    $('modalBirthTime').value = u.birthTime || '';
    $('modalMotto').value = u.motto || '';

    // 性别
    const genderBtns = document.querySelectorAll('#modalGenderRow .opt-btn');
    genderBtns.forEach(b => b.classList.toggle('opt-btn--active', b.dataset.value === (u.gender || 'female')));
    // 风格
    const styleBtns = document.querySelectorAll('#modalStyleRow .opt-btn');
    styleBtns.forEach(b => b.classList.toggle('opt-btn--active', b.dataset.value === (u.style || '东方插画')));
    // 场景
    const sceneBtns = document.querySelectorAll('#modalSceneRow .opt-btn');
    sceneBtns.forEach(b => b.classList.toggle('opt-btn--active', b.dataset.value === (u.scene || '室内')));
    // 素材
    const matBtns = document.querySelectorAll('#modalMaterialRow .opt-btn');
    matBtns.forEach(b => b.classList.toggle('opt-btn--active', b.dataset.value === (u.materialType || '人像')));
    // 参照
    const refBtns = document.querySelectorAll('#modalFaceRefRow .opt-btn');
    refBtns.forEach(b => b.classList.toggle('opt-btn--active', b.dataset.value === (u.faceReference || '中度保留')));
    // 调性
    const toneBtns = document.querySelectorAll('#modalToneRow .opt-btn');
    toneBtns.forEach(b => b.classList.toggle('opt-btn--active', b.dataset.value === (u.tone || '神秘')));
  },

  collectProfileForm() {
    const gender = document.querySelector('#modalGenderRow .opt-btn--active')?.dataset.value || 'female';
    const style = document.querySelector('#modalStyleRow .opt-btn--active')?.dataset.value || '东方插画';
    const scene = document.querySelector('#modalSceneRow .opt-btn--active')?.dataset.value || '室内';
    const materialType = document.querySelector('#modalMaterialRow .opt-btn--active')?.dataset.value || '人像';
    const faceReference = document.querySelector('#modalFaceRefRow .opt-btn--active')?.dataset.value || '中度保留';
    const tone = document.querySelector('#modalToneRow .opt-btn--active')?.dataset.value || '神秘';
    return {
      birthDate: $('modalBirthDate').value,
      birthTime: $('modalBirthTime').value,
      gender, style, scene, materialType, faceReference, tone,
      motto: $('modalMotto').value.trim(),
    };
  },

  // ---- 设置 modal ----
  openSettingsModal() {
    $('modalTitle').textContent = '设置';
    $('modalProfileForm').classList.add('hidden');
    $('modalSettingsForm').classList.remove('hidden');
    $('modalProxy').value = getProxyUrl();
    $('modalKey').value = Store.getSetting('minimaxKey', '');
    this.show('modalBg');
  },

  // ---- 渲染 modal 内的选项按钮组(供初始化)----
  renderOptionRow(rowId, options) {
    const row = $(rowId);
    if (!row) return;
    row.innerHTML = options.map(o => `
      <button class="opt-btn" data-value="${o.id || o.value}">
        ${o.emoji || ''}${o.label}
        ${o.desc ? `<div class="opt-btn__desc">${o.desc}</div>` : ''}
      </button>
    `).join('');
  },
};

import { getProxyUrl } from './api.js';
