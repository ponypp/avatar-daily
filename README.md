# 精看日常 PWA · 部署与使用

> 微信小程序架构撤了,改成 **PWA(Progressive Web App)** —— 1 个 HTML 文件部署到 **GitHub Pages**,手机和电脑都能用,零服务器成本。

---

## 🎯 一图概览

```
GitHub Pages(免费 HTTPS)
    │
    └── pwa/index.html(单文件:UI + 八字 + 提示词 + MiniMax 调用)
            │
            ├─ localStorage:用户档案 / 历史头像 / API key
            │
            └─ fetch → MiniMax API(sk-cp-...)
                 │
                 └─ (可选)通过 Cloudflare Worker 代理,绕过 CORS
```

**总成本**:
- GitHub Pages:0 元
- Cloudflare Worker(可选):0 元
- MiniMax API:你的订阅 key(已经 `sk-cp-...`)
- 数据库:无
- 域名:无(用 `xxx.github.io/avatar-daily/` 即可)

---

## 🚀 部署步骤(15 分钟一次性)

### 1️⃣ 建 GitHub 仓库

打开 https://github.com/new
- Repository name: `avatar-daily`(或任意)
- **Private**(避免 API key 风险,虽然 key 在 localStorage 但谨慎点)
- 不勾 Add README(空仓库)
- Create repository

### 2️⃣ 上传 pwa/ 内容

在你的 PowerShell:

```powershell
# 1. 初始化本地仓库 + 提交
cd C:\Users\panji\.mavis\agents\coder\workspace\ai-avatar-app-dev\pwa
git init
git add .
git commit -m "feat: pwa v1 - 玄学风 + MiniMax 直调"

# 2. 关联你的 GitHub 仓库(替换 USERNAME / REPO_NAME)
git remote add origin https://github.com/USERNAME/avatar-daily.git
git branch -M main
git push -u origin main
```

> ⚠️ 我没用 `gh` CLI(没确认你装没装),上面是 `git` + `https://github.com/...` 走 PAT 推送。如果你装了 `gh`,可以用 `gh repo create ...`。

### 3️⃣ 开 Pages

GitHub 仓库页面 → **Settings** → **Pages**(左侧)→ **Build and deployment**:
- Source: **Deploy from a branch**
- Branch: `main` / `(root)` ← 因为 pwa/ 文件直接放仓库根
- Save

等 1-2 分钟,出现绿色 ✅ "Your site is live at https://USERNAME.github.io/avatar-daily/"

### 4️⃣ 首次进入配置

手机浏览器打开那个 URL:
- 显示"精看日常"标题
- 点 **设置** → 填 **MiniMax API Key** (`sk-cp-...`)→ 保存
- 弹回主界面
- 点 **编辑** → 填生日 + 时辰 + 选风格 → 保存
- 点 **生成今日头像** → 等 10-20 秒
- 头像出来 ✅

### 5️⃣ 加到主屏(iOS / Android)

**iOS Safari**:
- 打开页面 → 分享按钮 → "添加到主屏幕"
- 主屏出现"精看日常"图标,点开跟原生 app 一样

**Android Chrome**:
- 打开页面 → 右上角菜单 → "添加到主屏幕" / "安装应用"

之后从主屏打开,跟普通 app 一样,无地址栏无 Safari 工具栏。

---

## 🛠 故障排查

### A. 生成失败:`Failed to fetch` 或 CORS 错

**原因**:浏览器直接调 `api.minimaxi.com` 被 CORS 政策挡了。

**解决**:部署 Cloudflare Worker 代理(5 分钟):
1. 打开 https://dash.cloudflare.com/sign-up(免费)
2. Workers & Pages → Create application → Create Worker
3. 粘贴 `cloudflare-worker.js` 的代码 → Save
4. Settings → Variables → 添加 `MINIMAX_API_KEY = sk-cp-...`(你的 key)→ 加密保存
5. 顶部 → 部署 → 复制 URL(形如 `https://jingkan-proxy.USERNAME.workers.dev`)
6. 回到 PWA → 设置 → 代理 URL 填这个 URL(只到 `https://jingkan-proxy.USERNAME.workers.dev`,别带 `/image_generation`)
7. 重试生成

### B. 生成失败:`401 Unauthorized` / `1008 余额不足`

- 401 → API key 错了,或填成 `sk-api-`(按量付费)而不是 `sk-cp-`(订阅)
- 1008 → MiniMax 账户余额 0,去 https://api.minimaxi.com/user-center 充值或换订阅

### C. 历史头像不见了

- localStorage 在浏览器隐私模式 / 清缓存 / 换浏览器都会丢
- 每天生成时**自动保存**当天头像,删了之后没法恢复(只有当天的 raw URL 24h 过期)
- 想保留?在头像上**长按 → 保存到相册**(数据已经下载到本地)

### D. PWA 装不上去

- iOS Safari 需 iOS 16.4+(2023 年 3 月后)
- 部分国产浏览器(UC / QQ)支持 PWA 但入口不同

---

## 📁 文件清单

```
pwa/
├── index.html              ← 全部代码在这(单文件,~600 行)
├── manifest.json           ← PWA 元数据
├── cloudflare-worker.js     ← CORS 代理 fallback(只在直接调被挡时部署)
└── README.md               ← 你正在看的
```

> **注意**: 早期版本带 `sw.js`(离线缓存静态资源),已移除。原因:单用户自用 + API key 在 Worker 里,不需要离线缓存;反而 SW 把 index.html 缓存后,代码升级需要用户手动清浏览器缓存,容易踩坑。现 index.html 启动时会主动 `unregister()` 掉旧 SW + 清 `jingkan-*` 缓存,后续 PWA 直连 GitHub Pages,每次都拿最新代码。

**没有**:
- `package.json` ← 不需要,纯 HTML/JS
- `node_modules/` ← 零依赖,直接 git push
- `tsconfig.json` ← 不需要
- `.env` ← API key 在 localStorage,不在文件里

---

## 🧠 给未来自己留的钩子

- **API key 在浏览器**:`localStorage['jingkan_minimax_key']` —— 仅你浏览器可见,不上传任何服务器
- **历史最大 30 天**:`localStorage['jingkan_avatars']` 数组长度上限,改 `MAX_HISTORY` 调整
- **bazi 算法是简化版**:`calculateBazi()` 用日主元素 + 用神查表简化。要更精确可以接 v5 完整版(在 archive/expo-app-ios-prep/ 里)
- **想导出历史**:控制台跑 `JSON.stringify(JSON.parse(localStorage['jingkan_avatars']))` → 复制到文件

---

## 🐛 已知小限制

- **离线不能生图**:图片生成必须联网,UI 部分离线能开
- **iOS Web App** 没有推送:每天想用的时候主动打开
- **没有分享卡片**:长按 → 保存到相册 → 手动发朋友

这些都不影响每天自用,以后要加再说。
