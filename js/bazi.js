// js/bazi.js
// 八字算法 v5 · JS 翻译版
// 源:expo-app/src/utils/baziV5.ts (port from algorithm/bazi.py v5, 命理师审核通过 2026-07-05)
// 依赖:lunar-typescript (通过 importmap 在 index.html 引入)

const { Solar } = window.Lunar; // lunar-typescript UMD 暴露

// ============ 1. 枚举 / 类型 ============

export const TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
export const WUXING = ['金', '木', '水', '火', '土'];

const TIANGAN_WUXING = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
  '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const DIZHI_WUXING = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

// 月令旺相休囚死(得令分:旺=50 / 相=30 / 休=15 / 囚死=0)
const WANG_XIANG_SCORE = {
  '寅': { '木': 50, '火': 30, '土': 0,  '金': 0,  '水': 15 },
  '卯': { '木': 50, '火': 30, '土': 0,  '金': 0,  '水': 15 },
  '辰': { '土': 50, '金': 30, '火': 15, '木': 0,  '水': 0 },
  '巳': { '火': 50, '土': 30, '木': 15, '金': 0,  '水': 0 },
  '午': { '火': 50, '土': 30, '木': 15, '金': 0,  '水': 0 },
  '未': { '土': 50, '金': 30, '火': 15, '木': 0,  '水': 0 },
  '申': { '金': 50, '水': 30, '土': 15, '火': 0,  '木': 0 },
  '酉': { '金': 50, '水': 30, '土': 15, '火': 0,  '木': 0 },
  '戌': { '土': 50, '金': 30, '火': 15, '木': 0,  '水': 0 },
  '亥': { '水': 50, '木': 30, '金': 15, '土': 0,  '火': 0 },
  '子': { '水': 50, '木': 30, '金': 15, '土': 0,  '火': 0 },
  '丑': { '土': 50, '金': 30, '火': 15, '木': 0,  '水': 0 },
};

// 十天干在地支本气强根(得地 30)
const BENQI_IN_DIZHI = {
  '甲': ['寅', '卯'], '乙': ['卯'],
  '丙': ['巳', '午'], '丁': ['午', '未'],
  '戊': ['辰', '戌', '丑', '未'], '己': ['丑', '未', '辰', '戌'],
  '庚': ['申', '酉'], '辛': ['酉'],
  '壬': ['亥', '子'], '癸': ['子', '亥'],
};

// 十天干在地支余气微根(得地 10)
const YUQI_IN_DIZHI = {
  '甲': ['亥', '未'], '乙': ['辰', '未'],
  '丙': ['寅', '卯', '巳'], '丁': ['卯', '巳', '酉', '亥'],
  '戊': ['寅', '巳', '申'], '己': ['子', '卯', '巳', '酉'],
  '庚': ['巳', '戌', '未'], '辛': ['子', '辰', '戌'],
  '壬': ['申', '卯'], '癸': ['卯', '未', '酉'],
};

// 调候用神第一优先(12 月令 × 10 天干)·Partial 因为原数据有缺失
const TIAO_HOU_PRIMARY = {
  '寅': { '甲': '火', '乙': '火', '丙': '水', '丁': '水', '戊': '火', '庚': '火', '辛': '火', '壬': '金', '癸': '金' },
  '卯': { '甲': '火', '乙': '火', '丙': '水', '丁': '水', '戊': '火', '庚': '火', '辛': '火', '壬': '金', '癸': '金' },
  '辰': { '甲': '火', '乙': '火', '丙': '水', '丁': '水', '戊': '火', '庚': '火', '辛': '火', '壬': '金', '癸': '金' },
  '巳': { '甲': '水', '乙': '水', '丙': '水', '丁': '水', '戊': '水', '庚': '水', '辛': '水', '壬': '水', '癸': '水' },
  '午': { '甲': '水', '乙': '水', '丙': '水', '丁': '水', '戊': '水', '庚': '水', '辛': '水', '壬': '水', '癸': '水' },
  '未': { '甲': '水', '乙': '水', '丙': '水', '丁': '水', '戊': '水', '庚': '水', '辛': '水', '壬': '水', '癸': '水' },
  '申': { '甲': '水', '乙': '水', '丙': '水', '丁': '水', '戊': '金', '庚': '木', '辛': '木', '壬': '木', '癸': '木' },
  '酉': { '甲': '水', '乙': '水', '丙': '水', '丁': '水', '戊': '金', '庚': '木', '辛': '木', '壬': '木', '癸': '木' },
  '戌': { '甲': '火', '乙': '火', '丙': '水', '丁': '水', '戊': '火', '庚': '火', '辛': '火', '壬': '金', '癸': '金' },
  '亥': { '甲': '火', '乙': '火', '丙': '火', '丁': '火', '戊': '火', '庚': '火', '辛': '火', '壬': '火', '癸': '火' },
  '子': { '甲': '火', '乙': '火', '丙': '火', '丁': '火', '戊': '火', '庚': '火', '辛': '火', '壬': '火', '癸': '火' },
  '丑': { '甲': '火', '乙': '火', '丙': '火', '丁': '火', '戊': '火', '庚': '火', '辛': '火', '壬': '火', '癸': '火' },
};

const TIAO_HOU_SECONDARY = {
  '寅': { '甲': '金', '乙': '水', '丙': '木', '丁': '金', '戊': '木', '庚': '水', '辛': '水', '壬': '土', '癸': '木' },
  '卯': { '甲': '金', '乙': '水', '丙': '木', '丁': '金', '戊': '木', '庚': '水', '辛': '水', '壬': '土', '癸': '木' },
  '辰': { '甲': '木', '乙': '木', '丙': '木', '丁': '木', '戊': '木', '庚': '木', '辛': '木', '壬': '木', '癸': '木' },
  '巳': { '甲': '金', '乙': '金', '丙': '金', '丁': '金', '戊': '金', '庚': '木', '辛': '木', '壬': '土', '癸': '金' },
  '午': { '甲': '金', '乙': '金', '丙': '金', '丁': '金', '戊': '金', '庚': '木', '辛': '木', '壬': '土', '癸': '金' },
  '未': { '甲': '木', '乙': '木', '丙': '木', '丁': '木', '戊': '木', '庚': '木', '辛': '木', '壬': '木', '癸': '木' },
  '申': { '甲': '火', '乙': '火', '丙': '土', '丁': '木', '戊': '水', '庚': '火', '辛': '火', '壬': '火', '癸': '火' },
  '酉': { '甲': '火', '乙': '火', '丙': '土', '丁': '木', '戊': '水', '庚': '火', '辛': '火', '壬': '火', '癸': '火' },
  '戌': { '甲': '水', '乙': '水', '丙': '土', '丁': '土', '戊': '木', '庚': '水', '辛': '水', '壬': '土', '癸': '土' },
  '亥': { '甲': '木', '乙': '木', '丙': '土', '丁': '土', '戊': '木', '庚': '土', '辛': '土', '壬': '木', '癸': '木' },
  '子': { '甲': '木', '乙': '木', '丙': '土', '丁': '土', '戊': '木', '庚': '土', '辛': '土', '壬': '木', '癸': '木' },
  '丑': { '甲': '木', '乙': '木', '丙': '土', '丁': '土', '戊': '木', '庚': '土', '辛': '土', '壬': '木', '癸': '木' },
};

// 地支六合 / 六冲 / 三害 / 三刑
const LIU_HE = [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']];
const LIU_CHONG = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
const LIU_HAI = [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']];
const SAN_XING = [['寅', '巳', '申'], ['丑', '戌', '未'], ['子', '卯']];

const WUXING_KE = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
const WUXING_SHENG = { '金': '土', '木': '水', '水': '金', '火': '木', '土': '火' };
const WUXING_SHENGED = { '金': '水', '木': '火', '水': '木', '火': '土', '土': '金' };
const WUXING_KELED = { '金': '木', '木': '土', '水': '火', '火': '金', '土': '水' };

// ============ 2. 核心函数 ============

/**
 * 从公历日期获取八字
 */
export function calculateBazi(year, month, day, hour) {
  const solar = Solar.fromYmdHms(year, month, day, hour, 0, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  return {
    year:  { gan: ec.getYearGan(),  zhi: ec.getYearZhi()  },
    month: { gan: ec.getMonthGan(), zhi: ec.getMonthZhi() },
    day:   { gan: ec.getDayGan(),   zhi: ec.getDayZhi()   },
    time:  { gan: ec.getTimeGan(),  zhi: ec.getTimeZhi()  },
  };
}

/**
 * 获取当日干支(60 甲子循环)
 */
export function getDailyGanzhi(date = new Date()) {
  const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return solar.getLunar().getDayInGanZhi();
}

/**
 * 获取当月干支
 */
export function getMonthlyGanzhi(date = new Date()) {
  const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
  return solar.getLunar().getMonthInGanZhi();
}

/**
 * v5 100 分制身强/弱判定
 */
export function determineStrength(bazi) {
  const dayMasterGan = bazi.day.gan;
  const dayMasterElem = TIANGAN_WUXING[dayMasterGan];
  const monthZhi = bazi.month.zhi;

  // 1. 得令分(50)
  const wangXiangScore = WANG_XIANG_SCORE[monthZhi][dayMasterElem] || 0;
  const scoreDeLing = wangXiangScore;

  // 2. 得地分(30)—— 本气强根 / 余气微根
  const benqi = BENQI_IN_DIZHI[dayMasterGan] || [];
  const yuqi = YUQI_IN_DIZHI[dayMasterGan] || [];
  let scoreDeDi = 0;
  const allZhi = [bazi.year.zhi, bazi.month.zhi, bazi.day.zhi, bazi.time.zhi];
  for (const zhi of allZhi) {
    if (benqi.includes(zhi)) scoreDeDi = Math.max(scoreDeDi, 30);
    else if (yuqi.includes(zhi)) scoreDeDi = Math.max(scoreDeDi, 10);
  }

  // 3. 得势分(20)—— 天干比劫数
  let bijieCount = 0;
  const allGan = [bazi.year.gan, bazi.month.gan, bazi.day.gan, bazi.time.gan];
  for (const gan of allGan) {
    if (TIANGAN_WUXING[gan] === dayMasterElem) bijieCount += 1;
  }
  const scoreDeShi = bijieCount >= 2 ? 20 : bijieCount === 1 ? 10 : 0;

  const scoreTotal = scoreDeLing + scoreDeDi + scoreDeShi;

  let state;
  if (scoreTotal >= 60) state = '身强';
  else if (scoreTotal <= 35) state = '身弱';
  else state = '近中和';

  const monthState = wangXiangScore >= 50 ? '旺'
    : wangXiangScore >= 30 ? '相'
    : wangXiangScore >= 15 ? '休'
    : '囚/死';

  return {
    state, scoreTotal, scoreDeLing, scoreDeDi, scoreDeShi,
    bijieCount, monthState, dayMasterElement: dayMasterElem,
  };
}

/**
 * v5 喜忌用神 + 调候冲突降级
 */
export function determineYongShen(bazi, strength) {
  const dayMasterGan = bazi.day.gan;
  const dayMasterElem = TIANGAN_WUXING[dayMasterGan];
  const monthZhi = bazi.month.zhi;

  let yong, xiSet, jiSet;

  if (strength.state === '身强') {
    xiSet = [WUXING_KELED[dayMasterElem], WUXING_SHENGED[dayMasterElem], WUXING_KE[dayMasterElem]];
    jiSet = [WUXING_SHENG[dayMasterElem], dayMasterElem];
    yong = WUXING_KELED[dayMasterElem];
  } else if (strength.state === '身弱') {
    xiSet = [WUXING_SHENG[dayMasterElem], dayMasterElem];
    jiSet = [WUXING_KELED[dayMasterElem], WUXING_SHENGED[dayMasterElem], WUXING_KE[dayMasterElem]];
    yong = WUXING_SHENG[dayMasterElem];
  } else {
    xiSet = [dayMasterElem];
    jiSet = [WUXING_KE[dayMasterElem]];
    yong = dayMasterElem;
  }

  const tiaoHou = (TIAO_HOU_PRIMARY[monthZhi] || {})[dayMasterGan] || null;
  const tiaoHouSecondary = (TIAO_HOU_SECONDARY[monthZhi] || {})[dayMasterGan] || null;

  const isConflict = (a, b) => WUXING_KE[a] === b || WUXING_KE[b] === a;

  let conflictFlag = false;
  let primaryElement = tiaoHou || yong;
  let secondaryElement = yong;

  if (tiaoHou && isConflict(tiaoHou, yong)) {
    conflictFlag = true;
    if (tiaoHouSecondary && !isConflict(tiaoHouSecondary, yong)) {
      primaryElement = tiaoHouSecondary;
      secondaryElement = yong;
    } else {
      primaryElement = yong;
      secondaryElement = yong;
    }
  }

  return {
    yong, xiSet: [...xiSet].sort(), jiSet: [...jiSet].sort(),
    tiaoHou, tiaoHouSecondary,
    primaryElement, secondaryElement, conflictFlag,
    swState: strength.state,
  };
}

/**
 * 流日 5 星评分(基础 ±3 + 加成 ±2 - 降级硬触发)
 */
export function calculateQiYun(dayZhi, dailyGanzhi, xiSet, jiSet) {
  const dailyGan = dailyGanzhi[0];
  const dailyZhi = dailyGanzhi[1];
  if (!dailyGan || !dailyZhi) {
    throw new Error(`calculateQiYun: malformed dailyGanzhi ${JSON.stringify(dailyGanzhi)}`);
  }
  const dailyGanWuxing = TIANGAN_WUXING[dailyGan];

  // 基础分
  let baseScore = 0;
  if (xiSet.includes(dailyGanWuxing)) baseScore = 3;
  else if (jiSet.includes(dailyGanWuxing)) baseScore = -3;

  // 加成分:地支关系
  let bonusScore = 0;
  let relationName = '无';
  const pair = new Set([dayZhi, dailyZhi]);

  if (LIU_HE.some(([a, b]) => pair.has(a) && pair.has(b))) {
    bonusScore = 1; relationName = '合';
  } else if (LIU_CHONG.some(([a, b]) => pair.has(a) && pair.has(b))) {
    bonusScore = -2; relationName = '冲';
  } else if (LIU_HAI.some(([a, b]) => pair.has(a) && pair.has(b))) {
    bonusScore = -1; relationName = '害';
  } else if (SAN_XING.some((xs) => xs.every((x) => pair.has(x)))) {
    bonusScore = -1; relationName = '刑';
  }

  const downgraded = bonusScore <= -1;
  let total = baseScore + bonusScore;
  if (downgraded) total -= 1;

  let stars, level;
  if (total >= 3)      { stars = 5; level = '上等吉日'; }
  else if (total >= 2) { stars = 4; level = '小吉之日'; }
  else if (total >= 1) { stars = 3; level = '平稳平运'; }
  else if (total >= 0) { stars = 2; level = '平淡收敛'; }
  else                 { stars = 1; level = '守静之日'; }

  return { stars, level, baseScore, bonusScore, downgraded, relationName };
}

/**
 * 大运/流年(简化版)
 * - 大运:每 10 年一个十年大运,基于月柱推算
 * - 流年:当前年的年干支
 */
export function calculateDaYun(bazi, birthYear, currentYear = new Date().getFullYear()) {
  // 简化:每 10 年一个固定大运(用出生月柱地支往后/往前推 10 步)
  // 实际命理:男阳女阴顺排,男阴女阳逆排。这里用简易算法(性别 = female → 顺排)
  const monthZhi = bazi.month.zhi;
  const startZhiIdx = DIZHI.indexOf(monthZhi);

  const ageThisYear = currentYear - birthYear;
  const daYunIdx = Math.floor(ageThisYear / 10);

  // 顺排 10 步
  const daYun = [];
  for (let i = 0; i < 8; i++) {
    const zhiIdx = (startZhiIdx + (i + 1) * 10) % 12;
    daYun.push({
      startAge: i * 10,
      endAge: (i + 1) * 10,
      zhi: DIZHI[zhiIdx],
      wuxing: DIZHI_WUXING[DIZHI[zhiIdx]],
    });
  }

  // 当前所在大运
  const currentDaYun = daYun.find(d => d.startAge <= ageThisYear && ageThisYear < d.endAge) || daYun[0];

  // 流年:当前年干支
  const liuNianGanZhi = getYearGanzhi(currentYear);

  return {
    daYun,
    currentDaYun,
    ageThisYear,
    liuNian: liuNianGanZhi,
  };
}

function getYearGanzhi(year) {
  const solar = Solar.fromYmd(year, 1, 1);
  return solar.getLunar().getYearInGanZhi();
}

/**
 * 完整 v5 流程
 */
export function baziV5Full(year, month, day, hour, targetDate = new Date()) {
  const bazi = calculateBazi(year, month, day, hour);
  const strength = determineStrength(bazi);
  const yongShen = determineYongShen(bazi, strength);
  const ganzhi = getDailyGanzhi(targetDate);
  const qiYun = calculateQiYun(bazi.day.zhi, ganzhi, yongShen.xiSet, yongShen.jiSet);

  return { bazi, strength, yongShen, qiYun, ganzhi };
}

// ============ 3. 辅助函数 ============

/**
 * 找神煞
 */
export function findShenSha(dayGan, bazi) {
  // 简化版:基于 lookup 表
  const lookup = (typeof window !== 'undefined' && window.SHENSHA_LOOKUP) || {
    '甲': { '天乙贵人': ['丑', '未'], '驿马': ['寅'], '桃花': ['子'] },
    '乙': { '天乙贵人': ['子', '申'], '驿马': ['卯'], '桃花': ['丑'] },
    '丙': { '天乙贵人': ['亥', '酉'], '驿马': ['巳'], '桃花': ['寅'] },
    '丁': { '天乙贵人': ['亥', '酉'], '驿马': ['巳'], '桃花': ['卯'] },
    '戊': { '天乙贵人': ['丑', '未'], '驿马': ['申'], '桃花': ['辰'] },
    '己': { '天乙贵人': ['子', '申'], '驿马': ['申'], '桃花': ['巳'] },
    '庚': { '天乙贵人': ['丑', '未'], '驿马': ['申'], '桃花': ['午'] },
    '辛': { '天乙贵人': ['午', '寅'], '驿马': ['酉'], '桃花': ['未'] },
    '壬': { '天乙贵人': ['卯', '巳'], '驿马': ['亥'], '桃花': ['申'] },
    '癸': { '天乙贵人': ['卯', '巳'], '驿马': ['亥'], '桃花': ['酉'] },
  };
  const map = lookup[dayGan] || {};
  const allZhi = [bazi.year.zhi, bazi.month.zhi, bazi.day.zhi, bazi.time.zhi];
  const results = [];
  for (const [name, zhiList] of Object.entries(map)) {
    for (const z of allZhi) {
      if (zhiList.includes(z)) {
        results.push({ name, zhi: z, position: ['年', '月', '日', '时'][allZhi.indexOf(z)] });
      }
    }
  }
  return results;
}

/**
 * 纳音(60 甲子 → 5 行,简化版)
 * 完整 60 甲子表过大,只覆盖常用 12 甲子 × 5 行
 */
export function getNaYin(gan, zhi) {
  // 简化:用甲子纳音表
  const NAYIN_TABLE = {
    '甲子': '海中金', '乙丑': '海中金',
    '丙寅': '炉中火', '丁卯': '炉中火',
    '戊辰': '大林木', '己巳': '大林木',
    '庚午': '路旁土', '辛未': '路旁土',
    '壬申': '剑锋金', '癸酉': '剑锋金',
    '甲戌': '山头火', '乙亥': '山头火',
    '丙子': '涧下水', '丁丑': '涧下水',
    '戊寅': '城头土', '己卯': '城头土',
    '庚辰': '白蜡金', '辛巳': '白蜡金',
    '壬午': '杨柳木', '癸未': '杨柳木',
    '甲申': '泉中水', '乙酉': '泉中水',
    '丙戌': '屋上土', '丁亥': '屋上土',
    '戊子': '霹雳火', '己丑': '霹雳火',
    '庚寅': '松柏木', '辛卯': '松柏木',
    '壬辰': '长流水', '癸巳': '长流水',
    '甲午': '沙中金', '乙未': '沙中金',
    '丙申': '山下火', '丁酉': '山下火',
    '戊戌': '平地木', '己亥': '平地木',
    '庚子': '壁上土', '辛丑': '壁上土',
    '壬寅': '金箔金', '癸卯': '金箔金',
    '甲辰': '覆灯火', '乙巳': '覆灯火',
    '丙午': '天河水', '丁未': '天河水',
    '戊申': '大驿土', '己酉': '大驿土',
    '庚戌': '钗钏金', '辛亥': '钗钏金',
    '壬子': '桑柘木', '癸丑': '桑柘木',
    '甲寅': '大溪水', '乙卯': '大溪水',
    '丙辰': '沙中土', '丁巳': '沙中土',
    '戊午': '天上火', '己未': '天上火',
    '庚申': '石榴木', '辛酉': '石榴木',
    '壬戌': '大海水', '癸亥': '大海水',
  };
  return NAYIN_TABLE[gan + zhi] || '未知';
}

export { TIANGAN_WUXING, DIZHI_WUXING };
