// js/fortune.js
// 5 维运势(事业/财运/感情/健康/社交) + 7 天预报 + 大运/流年
// 基于 v5 八字 + 流日干支 + 喜神集

import { getDailyGanzhi, calculateQiYun, TIANGAN_WUXING, DIZHI_WUXING, calculateDaYun } from './bazi.js';
import { FORTUNE_DIMENSIONS, WUXING } from './constants.js';

const WUXING_KE = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

/**
 * 计算单日 5 维运势
 * @param {object} baziV5 - baziV5Full() 返回
 * @param {Date} targetDate - 目标日期
 * @returns {object} { date, dailyLevel, ganzhi, fortune: { 事业, 财运, 感情, 健康, 社交 }, totalStars }
 */
export function calculateDailyFortune(baziV5, targetDate = new Date()) {
  const { bazi, strength, yongShen } = baziV5;
  const dailyGz = getDailyGanzhi(targetDate);
  const dailyGan = dailyGz[0];
  const dailyZhi = dailyGz[1];
  const dailyWuxing = TIANGAN_WUXING[dailyGan];

  // 综合气运
  const qiYun = calculateQiYun(bazi.day.zhi, dailyGz, yongShen.xiSet, yongShen.jiSet);

  // 5 维运势:基于五行相生克 + 日主强弱
  const fortune = {};
  for (const dim of FORTUNE_DIMENSIONS) {
    fortune[dim.id] = scoreDimension(dim.id, dailyWuxing, yongShen, strength);
  }

  // 综合星数(平均)
  const scores = Object.values(fortune).map(f => f.stars);
  const totalStars = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return {
    date: formatDate(targetDate),
    ganzhi: dailyGz,
    dailyLevel: getDailyLevelName(qiYun.stars),
    qiYun,
    fortune,
    totalStars,
  };
}

/**
 * 单维度评分
 */
function scoreDimension(dimId, dailyWuxing, yongShen, strength) {
  // 基础分(1-5)
  let score = 3;

  // 1. 流日五行 vs 喜神集 / 忌神集
  if (yongShen.xiSet.includes(dailyWuxing)) score += 1;
  if (yongShen.jiSet.includes(dailyWuxing)) score -= 1;

  // 2. 用神加成(主要影响事业/财运)
  if (dimId === '事业' || dimId === '财运') {
    if (yongShen.yong === dailyWuxing) score += 0.5;
  }

  // 3. 身强/弱影响(健康)
  if (dimId === '健康') {
    if (strength.state === '近中和') score += 0.5;
    if (strength.state === '身弱' && dailyWuxing === WUXING_KE[strength.dayMasterElement]) score -= 1;
  }

  // 4. 感情/社交与日主阴阳关系(简化:全 +0 看日主五行)
  if (dimId === '感情' && yongShen.tiaoHou === dailyWuxing) score += 0.5;
  if (dimId === '社交' && yongShen.primaryElement === dailyWuxing) score += 0.5;

  // 限 1-5
  score = Math.max(1, Math.min(5, Math.round(score)));

  // 5 维描述
  const desc = dimensionDescription(dimId, score, dailyWuxing, yongShen);

  return { stars: score, desc };
}

function dimensionDescription(dim, stars, dailyWuxing, yongShen) {
  const WUXING_LABEL = { '金': '金', '木': '木', '水': '水', '火': '火', '土': '土' };
  const templates = {
    1: {
      '事业': `今日受${WUXING_LABEL[dailyWuxing]}气干扰,事倍功半,宜静守。`,
      '财运': `财星不明,守为上,避冲动消费。`,
      '感情': `情绪易波动,宜独处,避免争执。`,
      '健康': `留意身体,作息规律为先。`,
      '社交': `人际关系平淡,宜少言多观察。`,
    },
    2: {
      '事业': `进度一般,需稳扎稳打,不宜冒进。`,
      '财运': `小财可得,大财莫贪。`,
      '感情': `关系平淡,日常相处无波澜。`,
      '健康': `略有疲惫,注意休息。`,
      '社交': `普通社交,无特别亮点。`,
    },
    3: {
      '事业': `平稳推进,按部就班即可。`,
      '财运': `收支平衡,无大起落。`,
      '感情': `与伴侣/朋友日常互动顺畅。`,
      '健康': `状态尚可,适度运动。`,
      '社交': `普通聚会,气氛融洽。`,
    },
    4: {
      '事业': `今日灵感佳,适合推进重要项目。`,
      '财运': `正财稳进,小有进账。`,
      '感情': `关系升温,主动表达更佳。`,
      '健康': `精力充沛,适合户外活动。`,
      '社交': `人缘佳,适合结交新朋友。`,
    },
    5: {
      '事业': `气场全开,如有神助,大胆前进!`,
      '财运': `财星高照,正偏财皆有机会。`,
      '感情': `桃花旺盛,情感互动甜蜜。`,
      '健康': `活力满满,身心舒畅。`,
      '社交': `人气爆棚,聚会焦点。`,
    },
  };
  return (templates[stars] && templates[stars][dim]) || `${stars}★`;
}

function getDailyLevelName(stars) {
  return { 5: '喜用日', 4: '喜神日', 3: '平稳日', 2: '忌神日', 1: '大忌日' }[stars] || '平稳日';
}

function formatDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * 7 天预报
 */
export function calculate7DayForecast(baziV5, startDate = new Date()) {
  const forecast = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    forecast.push(calculateDailyFortune(baziV5, d));
  }
  return forecast;
}

/**
 * 大运/流年(完整版)
 */
export function calculateDaYunFull(bazi, birthYear, currentYear = new Date().getFullYear()) {
  return calculateDaYun(bazi, birthYear, currentYear);
}

/**
 * 生成每日宜忌(简化版)
 * @param {object} dailyFortune - calculateDailyFortune() 返回
 * @returns {string[]}
 */
export function generateDailyAdvice(dailyFortune) {
  const advice = [];
  const high = Object.entries(dailyFortune.fortune).filter(([_, v]) => v.stars >= 4);
  const low = Object.entries(dailyFortune.fortune).filter(([_, v]) => v.stars <= 2);

  if (high.length > 0) {
    advice.push(`✅ 宜:${high.map(([k]) => k).join(' / ')}`);
  }
  if (low.length > 0) {
    advice.push(`⚠️ 慎:${low.map(([k]) => k).join(' / ')}`);
  }
  advice.push(`📊 综合:${dailyFortune.dailyLevel} · ${dailyFortune.totalStars}★`);
  return advice;
}
