// js/constants.js
// 5 风格 / 4 参照 / 3 素材 / 3 场景 / 性别 / 5 维运势 / 5 档气运
// 对齐 docs/PRD.md 4.1 节 + expo-app/src/constants/onboarding.ts

// ============ 5 风格(PRD 4.1.1 · 2026-07-04 最终确认)============
export const AVATAR_STYLES = [
  { id: '东方插画', label: '东方插画', emoji: '🎨', desc: '柔和光影 · 东方意境', recommended: true },
  { id: 'Q版',     label: 'Q版',     emoji: '🧸', desc: '萌系大头 · 治愈系' },
  { id: '二次元',   label: '二次元',   emoji: '✨', desc: '动漫风 · 鲜艳色彩' },
  { id: '像素艺术', label: '像素艺术', emoji: '👾', desc: '复古游戏 · 怀旧像素' },
  { id: '韩系',     label: '韩系',     emoji: '💄', desc: '韩流美颜 · 时尚摄影' },
];
export const DEFAULT_STYLE = '东方插画';
export const STYLE_ORDER = ['东方插画', 'Q版', '二次元', '像素艺术', '韩系'];

// ============ 3 输出类型(人像 / 宠物 / 风景·物品)============
export const OUTPUT_TYPES = [
  { id: '人像',   label: '人像',   emoji: '👤', desc: '5 风格可选', compatibleStyles: ['东方插画', 'Q版', '二次元', '像素艺术', '韩系'] },
  { id: '宠物',   label: '宠物',   emoji: '🐾', desc: '4 风格(去韩系)', compatibleStyles: ['东方插画', 'Q版', '二次元', '像素艺术'] },
  { id: '风景·物品', label: '风景·物品', emoji: '🌄', desc: '3 风格(去韩系/二次元/Q版)', compatibleStyles: ['东方插画', 'Q版', '像素艺术'] },
];
export const DEFAULT_OUTPUT_TYPE = '人像';

// ============ 4 档人脸引用强度(PRD 4.1.2)============
export const FACE_REFERENCE_LEVELS = [
  { id: '神韵借鉴', label: '神韵借鉴', value: 0.3, desc: '只借你的气质(推荐 Q版/二次元)' },
  { id: '轻度保留', label: '轻度保留', value: 0.5, desc: '保留轮廓' },
  { id: '中度保留', label: '中度保留', value: 0.7, desc: '五官 70%(默认/通用)' },
  { id: '高度写实', label: '高度写实', value: 0.9, desc: '更像本人(推荐韩系)' },
];
export const DEFAULT_FACE_REFERENCE = '中度保留';
export const FACE_REFERENCE_ORDER = ['神韵借鉴', '轻度保留', '中度保留', '高度写实'];

// 风格 × 参照强度默认推荐
export const STYLE_FACE_DEFAULT = {
  '东方插画': '中度保留',
  'Q版':     '神韵借鉴',
  '二次元':   '神韵借鉴',
  '像素艺术': '神韵借鉴',
  '韩系':     '中度保留',
};

// ============ 3 素材类型(PRD 4.1.3)============
export const MATERIAL_TYPES = [
  { id: '人像',     label: '人像',     desc: '用你本人做参考(默认)' },
  { id: '风格参考', label: '风格参考', desc: '上传艺术品/风景/物品' },
  { id: '角色原型', label: '角色原型', desc: '上传宠物/二次元角色' },
];
export const DEFAULT_MATERIAL_TYPE = '人像';
export const MATERIAL_TYPE_ORDER = ['人像', '风格参考', '角色原型'];

// 风格 × 素材类型默认推荐
export const STYLE_MATERIAL_DEFAULT = {
  '东方插画': '人像',
  'Q版':     '角色原型',
  '二次元':   '角色原型',
  '像素艺术': '角色原型',
  '韩系':     '人像',
};

// ============ 3 场景(PRD 4.1.4)============
export const SCENES = [
  { id: '室内', label: '室内', emoji: '🏛', desc: '书房/茶室/暖光室内' },
  { id: '户外', label: '户外', emoji: '🌅', desc: '山/林/海/城市' },
  { id: '静物', label: '静物', emoji: '🍵', desc: '背景素雅/构图居中' },
];
export const DEFAULT_SCENE = '室内';
export const SCENE_ORDER = ['室内', '户外', '静物'];

// ============ 性别(PRD 4.1.5)============
export const GENDERS = [
  { id: 'female', label: '女', emoji: '🌸' },
  { id: 'male',   label: '男', emoji: '🌿' },
  { id: 'other',  label: '其他', emoji: '✨' },
];
export const DEFAULT_GENDER = 'female';

// ============ 5 维运势(PRD 4.1 · 每日)============
// 维度 + 1-5 星 + 调性
export const FORTUNE_DIMENSIONS = [
  { id: '事业', label: '事业', emoji: '💼', color: '#3b82f6' },
  { id: '财运', label: '财运', emoji: '💰', color: '#f59e0b' },
  { id: '感情', label: '感情', emoji: '💕', color: '#ec4899' },
  { id: '健康', label: '健康', emoji: '💪', color: '#10b981' },
  { id: '社交', label: '社交', emoji: '🤝', color: '#8b5cf6' },
];

// ============ 5 档气运配置(综合指数)============
export const QI_YUN_CONFIG = {
  5: { color: '#fbbf24', mood: '气场全开', stars: '★★★★★' },
  4: { color: '#22c55e', mood: '顺心顺意', stars: '★★★★' },
  3: { color: '#00d4ff', mood: '平常心',   stars: '★★★' },
  2: { color: '#a0a0b8', mood: '守静内敛', stars: '★★' },
  1: { color: '#6b6b80', mood: '静观其变', stars: '★' },
};

// ============ 调性(PRD L4 · 3 选 1)============
export const TONES = [
  { id: '温柔', label: '温柔', desc: '柔和水彩 · 柔和光' },
  { id: '锐利', label: '锐利', desc: '清晰线条 · 强对比' },
  { id: '神秘', label: '神秘', desc: '朦胧雾感 · 神秘感' },
];
export const DEFAULT_TONE = '神秘';

// ============ 格言示例(PRD OB4)============
export const MOTTO_EXAMPLES = [
  { label: '勇气', text: '做对的事,不怕慢' },
  { label: '平静', text: '心若不动,风又奈何' },
  { label: '希望', text: '光总会照进来的' },
  { label: '坚持', text: '慢慢来比较快' },
  { label: '自由', text: '不被定义,自在如风' },
];

// ============ 时辰(23 时辰制 · 0-23)============
export const CHINESE_HOURS = [
  { value: 0,  label: '子时 (23:00-01:00)', zhi: '子' },
  { value: 2,  label: '丑时 (01:00-03:00)', zhi: '丑' },
  { value: 4,  label: '寅时 (03:00-05:00)', zhi: '寅' },
  { value: 6,  label: '卯时 (05:00-07:00)', zhi: '卯' },
  { value: 8,  label: '辰时 (07:00-09:00)', zhi: '辰' },
  { value: 10, label: '巳时 (09:00-11:00)', zhi: '巳' },
  { value: 12, label: '午时 (11:00-13:00)', zhi: '午' },
  { value: 14, label: '未时 (13:00-15:00)', zhi: '未' },
  { value: 16, label: '申时 (15:00-17:00)', zhi: '申' },
  { value: 18, label: '酉时 (17:00-19:00)', zhi: '酉' },
  { value: 20, label: '戌时 (19:00-21:00)', zhi: '戌' },
  { value: 22, label: '亥时 (21:00-23:00)', zhi: '亥' },
];

// ============ 5 档推送文案(PRD 8.1)============
export const PUSH_COPY = {
  5: { title: '今日气场全开 ✨', body: '今天的头像已就绪' },
  4: { title: '今日顺心顺意 🌸',  body: '今日头像已生成' },
  3: { title: '今日平常心 🌿',    body: '今日头像已就绪' },
  2: { title: '今日宜静观内守 🍵', body: '今日头像已生成' },
  1: { title: '今日宜静一静 🌙',  body: '今日头像已生成' },
};

// ============ L0 prompt 风格基底 ============
// 跟 algorithm/prompt_template.py STYLE_BASE 一致
export const STYLE_BASE = {
  '东方插画': {
    positive: 'portrait illustration, half-body composition, Asian-inspired aesthetic, digital painting, soft cinematic lighting, matte finish, depth of field, 8k detail, masterpiece quality, in the style of contemporary oriental concept art',
    negative: 'photorealistic, photograph, real person, anime, cartoon, chibi, pixel art, Korean idol, K-pop, ugly, deformed, extra fingers, blurry, low quality, nude, naked, offensive, violent, watermark, text, signature, logo, caption, title, letters, words, writing, inscription',
  },
  'Q版': {
    positive: 'chibi style portrait, kawaii, big head small body proportions, large expressive eyes, pastel colors, cute aesthetic, sticker style, half-body composition, 8k detail, masterpiece quality',
    negative: 'photorealistic, photograph, realistic proportions, anime, oil painting, pixel art, Korean idol, ugly, deformed, blurry, low quality, nude, naked, offensive, violent, watermark, text, signature, logo, caption, title, letters, words, writing, inscription',
  },
  '二次元': {
    positive: 'anime style portrait, studio ghibli inspired, cel shading, vivid colors, expressive eyes, clean linework, half-body composition, 8k detail, masterpiece quality',
    negative: 'photorealistic, photograph, real person, 3d render, oil painting, pixel art, Korean idol, chibi, ugly, deformed, extra fingers, blurry, low quality, nude, naked, offensive, violent, watermark, text, signature, logo, caption, title, letters, words, writing, inscription',
  },
  '像素艺术': {
    positive: 'pixel art portrait, retro 16-bit game style, blocky pixels, low resolution aesthetic, vintage game character, nostalgic, half-body composition',
    negative: 'photorealistic, photograph, smooth gradients, 3d render, anime, Korean idol, oil painting, watercolor, chibi, ugly, deformed, blurry, low quality, nude, naked, offensive, violent, watermark, text, signature, logo, caption, title, letters, words, writing, inscription',
  },
  '韩系': {
    positive: 'Korean style portrait, soft Korean idol aesthetic, pastel color palette, clean minimalist, soft focus, dreamy glow, ethereal beauty, half-body composition, 8k detail, masterpiece quality',
    negative: 'anime, cartoon, chibi, 3d render, oil painting, pixel art, photorealistic photograph, ugly, deformed, extra fingers, blurry, low quality, nude, naked, offensive, violent, watermark, text, signature, logo, caption, title, letters, words, writing, inscription',
  },
};

// ============ L0.5 人脸引用强度 ============
export const FACE_REFERENCE = {
  '神韵借鉴': { positive: 'inspired by reference photo, artistic interpretation, mood-driven, focus on aesthetic over likeness, stylized portrait capturing essence and atmosphere', negativeExtra: '', value: 0.3 },
  '轻度保留': { positive: 'loose facial reference, preserve general structure and hairstyle, approximate likeness, artistic interpretation with subtle resemblance', negativeExtra: 'exact facial replication, photorealistic face', value: 0.5 },
  '中度保留': { positive: 'preserve facial features, recognizable likeness, stylized but identifiable, balanced artistic and personal representation', negativeExtra: 'completely different person, unrecognizable', value: 0.7 },
  '高度写实': { positive: 'high fidelity portrait, preserve exact facial features, photorealistic likeness, identity preserved, sharp facial details, accurate facial structure', negativeExtra: 'cartoon face, stylized face, distorted features', value: 0.9 },
};

// ============ L0.6 素材类型 ============
export const MATERIAL_TYPE = {
  '人像':     { positive: '', processing: 'ip_adapter_face_reference', desc: '上传自己人像' },
  '风格参考': { positive: 'inspired by reference aesthetic, extract color palette and brushstroke style, reference atmosphere incorporated, apply reference artistic style to portrait, harmonize reference visual language with character design', processing: 'style_extraction_color_brushstroke_mood', desc: '上传艺术品/风景/物品' },
  '角色原型': { positive: 'character inspired by reference creature or fictional character, incorporate reference distinctive features into anthropomorphic portrait, blend reference characteristics with human form, reference-inspired character design', processing: 'character_template_with_features', desc: '上传宠物/二次元角色' },
};

// ============ L0.7 输出类型(主体)============
export const OUTPUT_TYPE = {
  '人像':     { subject: 'portrait', compatibleStyles: ['东方插画', 'Q版', '二次元', '像素艺术', '韩系'] },
  '宠物':     { subject: 'animal character portrait, inspired pet portrait, animal stylized into artistic character design, preserve pet distinctive features, cute animal head portrait', compatibleStyles: ['东方插画', 'Q版', '二次元', '像素艺术'] },
  '风景·物品': { subject: 'artistic object portrait, inspired object still life, stylized interpretation preserving object essence, apply character design principles to non-living subject', compatibleStyles: ['东方插画', 'Q版', '像素艺术'] },
};

// ============ L1 八字人格底色(基于日主五行)============
export const DAY_MASTER_PERSONA = {
  '金': { keywords: ['metallic sheen', 'silver-white aura', 'autumn leaves', 'sharp geometric lines'], colors: ['silver', 'white', 'pale gold', 'cool grey'], mood: 'precise, refined, with inner strength', core: 'shimmering metallic aura' },
  '木': { keywords: ['verdant vines', 'spring growth', 'bamboo', 'jade accents'], colors: ['forest green', 'emerald', 'sage', 'morning dew'], mood: 'gentle, growing, deeply rooted', core: 'flowing vines and leaves' },
  '水': { keywords: ['flowing water', 'moonlit reflection', 'ink ripples', 'mist'], colors: ['deep blue', 'ink black', 'silver grey', 'midnight'], mood: 'introspective, fluid, adaptable', core: 'rippling water surface' },
  '火': { keywords: ['warm glow', 'sunset rays', 'rising flame', 'molten gold'], colors: ['crimson', 'warm orange', 'molten gold', 'amber'], mood: 'passionate, radiant, transformative', core: 'rising flame aura' },
  '土': { keywords: ['earthen textures', 'mountain silhouette', 'sandstone', 'ceramic glaze'], colors: ['ochre', 'terracotta', 'warm brown', 'sand'], mood: 'stable, grounded, enduring', core: 'mountain silhouette backdrop' },
};

// ============ L1 调候 modifier ============
export const TIAO_HOU_MODIFIER = {
  '金': 'cool silver-blue ambient light, slight chill',
  '木': 'soft spring green ambient light, gentle warmth',
  '水': 'moonlit silver ambient light, misty atmosphere',
  '火': 'warm golden ambient light, summer heat',
  '土': 'warm autumn amber ambient light, harvest glow',
};

// ============ L2 流日叠加 ============
export const DAY_LEVEL_INTENSITY = {
  '喜用日': { name: 'strong',   value: 1.0 },
  '喜神日': { name: 'moderate', value: 0.65 },
  '平稳日': { name: 'balanced', value: 0.45 },
  '忌神日': { name: 'subtle',   value: 0.25 },
  '大忌日': { name: 'minimal',  value: 0.1 },
};

export const DIZHI_MOTIF = {
  '子': 'subtle water ripple motif',
  '丑': 'earthen clay texture accents',
  '寅': 'morning forest light streaks',
  '卯': 'soft green leaf patterns',
  '辰': 'misty mountain layer',
  '巳': 'warm flame wisps',
  '午': 'bright sun ray burst',
  '未': 'gentle cloud patterns',
  '申': 'metallic glint details',
  '酉': 'autumn gold leaf accents',
  '戌': 'rich soil tones',
  '亥': 'flowing mist and stars',
};

export const DAILY_GAN_COLOR = {
  '甲': 'verdant', '乙': 'soft green', '丙': 'bright red', '丁': 'warm crimson',
  '戊': 'ochre',   '己': 'sand',       '庚': 'silver',    '辛': 'white',
  '壬': 'deep blue','癸': 'ink',
};

// ============ L3 格言情绪 modifier ============
export const MOTTO_MODIFIER = {
  '平静': 'serene expression, still pose',
  '勇敢': 'determined gaze, confident posture',
  '自由': 'flowing hair, open composition',
  '坚持': 'focused expression, strong stance',
  '温柔': 'soft gaze, gentle hand gesture',
  '力量': 'powerful stance, dynamic pose',
  '智慧': 'thoughtful gaze, scholarly elements',
  '爱':   'warm smile, heart motif',
  '孤独': 'solitary composition, distant background',
  '希望': 'upward gaze, light from above',
  '成长': 'upward composition, growing elements',
  '突破': 'dynamic pose, breaking through barrier',
};

// ============ L4 调性 ============
export const TONE_MODIFIER = {
  '温柔': { style: 'soft watercolor edges, dreamy glow, pastel highlights', lighting: 'diffused soft lighting, no harsh shadows' },
  '锐利': { style: 'sharp linework, high contrast edges, crystalline details', lighting: 'dramatic side lighting, deep shadows' },
  '神秘': { style: 'mysterious fog, hidden details, ethereal glow',         lighting: 'rim lighting, silhouette emphasis' },
};

// ============ 场景 modifier(L4 子集)============
export const SCENE_MODIFIER = {
  '室内': 'indoor setting, warm ambient light, soft furniture background, shallow depth of field',
  '户外': 'outdoor natural setting, atmospheric landscape, dynamic sky, cinematic depth',
  '静物': 'clean minimalist backdrop, central composition, restrained palette, gallery aesthetic',
};

// ============ 五行 / 十神 / 神煞 / 纳音(简化版)============
// 纳音(60 甲子 → 5 行)
export const NAYIN = (() => {
  // 简化:用五行直接映射;完整版需要 60 甲子对照表
  const map = {};
  return map;
})();

// 十神:基于日主 + 他干
export const SHISHEN = {
  '金': { same: '比肩', diff: ['劫财', '食神', '伤官', '偏财', '正财', '七杀', '偏官', '正印', '偏印'] },
  '木': { same: '比肩', diff: ['劫财', '食神', '伤官', '偏财', '正财', '七杀', '偏官', '正印', '偏印'] },
  // ... 简化为 helper 函数计算
};

// 神煞(简化版 · 4 个常用)
export const SHENSHA = {
  '天乙贵人': ['丑', '未', '子', '申'],  // 日干见此
  '文昌贵人': ['亥', '酉', '丑', '巳'],
  '驿马':       ['申', '寅', '巳', '亥'],
  '桃花':       ['子', '午', '卯', '酉'],
};

// 日干 → 神煞对应的支
export const SHENSHA_LOOKUP = {
  '甲': { '天乙贵人': ['丑', '未'], '文昌贵人': ['巳'], '驿马': ['寅'], '桃花': ['子'] },
  '乙': { '天乙贵人': ['子', '申'], '文昌贵人': ['午'], '驿马': ['卯'], '桃花': ['丑'] },
  '丙': { '天乙贵人': ['亥', '酉'], '文昌贵人': ['申'], '驿马': ['巳'], '桃花': ['寅'] },
  '丁': { '天乙贵人': ['亥', '酉'], '文昌贵人': ['酉'], '驿马': ['巳'], '桃花': ['卯'] },
  '戊': { '天乙贵人': ['丑', '未'], '文昌贵人': ['申'], '驿马': ['申'], '桃花': ['辰'] },
  '己': { '天乙贵人': ['子', '申'], '文昌贵人': ['酉'], '驿马': ['申'], '桃花': ['巳'] },
  '庚': { '天乙贵人': ['丑', '未'], '文昌贵人': ['亥'], '驿马': ['申'], '桃花': ['午'] },
  '辛': { '天乙贵人': ['午', '寅'], '文昌贵人': ['寅'], '驿马': ['酉'], '桃花': ['未'] },
  '壬': { '天乙贵人': ['卯', '巳'], '文昌贵人': ['卯'], '驿马': ['亥'], '桃花': ['申'] },
  '癸': { '天乙贵人': ['卯', '巳'], '文昌贵人': ['辰'], '驿马': ['亥'], '桃花': ['酉'] },
};
