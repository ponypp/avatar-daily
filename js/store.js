// js/store.js
// localStorage 状态管理
// 存:user(基础信息)、avatars(历史)、favorites(收藏)、settings(配置)

const KEYS = {
  user:      'jingkan_user',           // { birthDate, birthTime, gender, style, materialType, faceReference, scene, outputType, motto, tone, name }
  avatars:   'jingkan_avatars',        // [{ date, bazi, imageDataUrl, prompt, style, dailyLevel, fortune }]
  favorites: 'jingkan_favorites',      // [date1, date2, ...]
  settings:  'jingkan_settings',       // { proxyUrl, minimaxKey, lastGenerateDate, ... }
  dailyFortune: 'jingkan_daily_fortune', // { date: { ... } } - 缓存当日运势
};

const MAX_HISTORY = 60; // 增加到 60 天(从 30)

export const Store = {
  // ---- User ----
  getUser() {
    try { return JSON.parse(localStorage.getItem(KEYS.user) || 'null'); }
    catch { return null; }
  },
  setUser(u) { localStorage.setItem(KEYS.user, JSON.stringify(u)); },

  // ---- Avatars ----
  getAvatars() {
    try { return JSON.parse(localStorage.getItem(KEYS.avatars) || '[]'); }
    catch { return []; }
  },
  setAvatars(list) {
    if (list.length > MAX_HISTORY) list = list.slice(0, MAX_HISTORY);
    localStorage.setItem(KEYS.avatars, JSON.stringify(list));
  },
  addAvatar(rec) {
    const list = this.getAvatars().filter(a => a.date !== rec.date);
    list.unshift(rec);
    this.setAvatars(list);
  },
  getAvatarByDate(date) {
    return this.getAvatars().find(a => a.date === date);
  },

  // ---- Favorites ----
  getFavorites() {
    try { return JSON.parse(localStorage.getItem(KEYS.favorites) || '[]'); }
    catch { return []; }
  },
  isFavorite(date) { return this.getFavorites().includes(date); },
  toggleFavorite(date) {
    const list = this.getFavorites();
    const idx = list.indexOf(date);
    if (idx >= 0) list.splice(idx, 1);
    else list.unshift(date);
    localStorage.setItem(KEYS.favorites, JSON.stringify(list));
    return list.includes(date);
  },

  // ---- Settings ----
  getSettings() {
    try { return JSON.parse(localStorage.getItem(KEYS.settings) || '{}'); }
    catch { return {}; }
  },
  setSetting(k, v) {
    const s = this.getSettings();
    s[k] = v;
    localStorage.setItem(KEYS.settings, JSON.stringify(s));
  },
  getSetting(k, defaultVal) {
    const s = this.getSettings();
    return k in s ? s[k] : defaultVal;
  },

  // ---- Daily Fortune Cache ----
  getDailyFortune(date) {
    try {
      const all = JSON.parse(localStorage.getItem(KEYS.dailyFortune) || '{}');
      return all[date] || null;
    } catch { return null; }
  },
  setDailyFortune(date, fortune) {
    try {
      const all = JSON.parse(localStorage.getItem(KEYS.dailyFortune) || '{}');
      all[date] = fortune;
      // 只保留最近 30 天
      const dates = Object.keys(all).sort().reverse();
      if (dates.length > 30) {
        for (const d of dates.slice(30)) delete all[d];
      }
      localStorage.setItem(KEYS.dailyFortune, JSON.stringify(all));
    } catch {}
  },
};

export { KEYS, MAX_HISTORY };
