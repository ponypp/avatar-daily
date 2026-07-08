// js/prompts.js
// 5 层 prompt 拼装(对齐 PRD L0-L4 + algorithm/prompt_template.py)
// 输入:profile + baziV5 + 当日干支
// 输出:{ positive, negative }

import {
  STYLE_BASE, FACE_REFERENCE, MATERIAL_TYPE, OUTPUT_TYPE,
  DAY_MASTER_PERSONA, TIAO_HOU_MODIFIER,
  DAY_LEVEL_INTENSITY, DIZHI_MOTIF, DAILY_GAN_COLOR,
  MOTTO_MODIFIER, TONE_MODIFIER, SCENE_MODIFIER,
  DEFAULT_FACE_REFERENCE, DEFAULT_MATERIAL_TYPE, DEFAULT_OUTPUT_TYPE,
  STYLE_FACE_DEFAULT, STYLE_MATERIAL_DEFAULT, STYLE_ORDER,
} from './constants.js';

/**
 * 5 层 prompt 拼装
 * @param {object} args
 * @param {string} args.style - 5 风格之一
 * @param {string} args.dayMasterElem - 日主五行(金木水火土)
 * @param {string|null} args.tiaoHouElem - 调候五行
 * @param {string} args.yongShenElem - 用神五行
 * @param {string[]} args.xiShenSet - 喜神集
 * @param {string} args.dailyGan - 流日天干
 * @param {string} args.dailyZhi - 流日地支
 * @param {string} args.dailyLevel - 流日判定(喜用日/喜神日/平稳日/忌神日/大忌日)
 * @param {string} args.motto - 用户格言(可空)
 * @param {string} args.tone - 调性(温柔/锐利/神秘)
 * @param {string} [args.faceReference] - 人脸引用强度
 * @param {string} [args.materialType] - 素材类型
 * @param {string} [args.outputType] - 输出类型
 * @param {string} [args.gender='female'] - 性别
 * @param {string} [args.scene] - 场景(室内/户外/静物)
 * @returns {{positive: string, negative: string}}
 */
export function buildPrompt(args) {
  const {
    style, dayMasterElem, tiaoHouElem, yongShenElem, xiShenSet,
    dailyGan, dailyZhi, dailyLevel,
    motto = '', tone = '神秘',
    faceReference, materialType, outputType = '人像',
    gender = 'female', scene = '室内',
  } = args;

  // 校验 + 默认
  let useOutputType = OUTPUT_TYPE[outputType] ? outputType : DEFAULT_OUTPUT_TYPE;
  let useStyle = STYLE_BASE[style] ? style : STYLE_ORDER[0];
  if (!OUTPUT_TYPE[useOutputType].compatibleStyles.includes(useStyle)) {
    useStyle = OUTPUT_TYPE[useOutputType].compatibleStyles[0];
  }
  let useMaterialType = MATERIAL_TYPE[materialType] ? materialType
    : STYLE_MATERIAL_DEFAULT[useStyle] || DEFAULT_MATERIAL_TYPE;
  let useFaceRef = FACE_REFERENCE[faceReference] ? faceReference
    : STYLE_FACE_DEFAULT[useStyle] || DEFAULT_FACE_REFERENCE;

  const parts = [];

  // === L0 风格基底 ===
  parts.push(STYLE_BASE[useStyle].positive);

  // === L0.7 输出类型 · 主体 ===
  if (useOutputType === '人像') {
    parts.push(`${gender} portrait`);
  } else {
    parts.push(OUTPUT_TYPE[useOutputType].subject);
  }

  // === L0.6 素材类型(非人像场景)===
  if (useMaterialType !== '人像') {
    parts.push(MATERIAL_TYPE[useMaterialType].positive);
  }

  // === L0.5 人脸引用强度(仅人像 + 人像素材)===
  if (useOutputType === '人像' && useMaterialType === '人像') {
    parts.push(FACE_REFERENCE[useFaceRef].positive);
  }

  // === L1 八字人格底色 ===
  const persona = DAY_MASTER_PERSONA[dayMasterElem];
  if (persona) {
    parts.push(persona.keywords.join(', '));
    parts.push(`color palette: ${persona.colors.join(', ')}`);
    parts.push(`core element: ${persona.core}`);
    parts.push(persona.mood);
  }

  // === L1 调候 ===
  if (tiaoHouElem && TIAO_HOU_MODIFIER[tiaoHouElem]) {
    parts.push(TIAO_HOU_MODIFIER[tiaoHouElem]);
  }

  // === L2 流日叠加 ===
  const intensity = DAY_LEVEL_INTENSITY[dailyLevel] || DAY_LEVEL_INTENSITY['平稳日'];
  const motif = DIZHI_MOTIF[dailyZhi] || '';

  if (intensity.value >= 0.7) {
    parts.push(`strong ${motif}, vivid color accent`);
  } else if (intensity.value >= 0.4) {
    parts.push(`subtle ${motif}`);
  } else if (intensity.value >= 0.2) {
    parts.push(`faint ${motif}, muted tones`);
  } else {
    parts.push('almost no decorative motif, austere composition');
  }

  const dailyColor = DAILY_GAN_COLOR[dailyGan];
  if (dailyColor && intensity.value >= 0.5) {
    parts.push(`subtle ${dailyColor} undertone`);
  }

  // === L3 格言情绪 ===
  if (motto) {
    let matched = false;
    for (const [kw, mod] of Object.entries(MOTTO_MODIFIER)) {
      if (motto.includes(kw)) {
        parts.push(mod);
        matched = true;
        break;
      }
    }
    if (!matched) parts.push('thoughtful, contemplative');
  }

  // === L4 调性 ===
  const toneCfg = TONE_MODIFIER[tone] || TONE_MODIFIER['神秘'];
  parts.push(toneCfg.style);
  parts.push(toneCfg.lighting);

  // === 场景(L4 子集)===
  if (SCENE_MODIFIER[scene]) {
    parts.push(SCENE_MODIFIER[scene]);
  }

  const positive = parts.filter(Boolean).join(', ');

  // === Negative ===
  let negative = STYLE_BASE[useStyle].negative;
  if (useOutputType === '人像' && useMaterialType === '人像') {
    negative += ', ' + FACE_REFERENCE[useFaceRef].negativeExtra;
  }
  if (tone === '锐利') negative += ', soft edges, blurry details';
  else if (tone === '温柔') negative += ', sharp edges, harsh contrast';

  return { positive, negative };
}

/**
 * 流日判定:基于喜神集 + 流日天干五行
 * @returns {string} 喜用日/喜神日/平稳日/忌神日/大忌日
 */
export function classifyDailyLevel(dailyGanWuxing, xiSet, jiSet, dailyGan, dailyZhi, dayZhi) {
  if (xiSet.includes(dailyGanWuxing)) {
    // 进一步看地支关系
    const pair = new Set([dayZhi, dailyZhi]);
    const isChong = pairChong(pair);
    if (isChong) return '平稳日';
    return '喜用日';
  } else if (jiSet.includes(dailyGanWuxing)) {
    const pair = new Set([dayZhi, dailyZhi]);
    const isChong = pairChong(pair);
    if (isChong) return '大忌日';
    return '忌神日';
  }
  return '平稳日';
}

function pairChong(pair) {
  const LIU_CHONG = [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']];
  return LIU_CHONG.some(([a, b]) => pair.has(a) && pair.has(b));
}
