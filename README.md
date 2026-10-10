# 凡人修仙 · 一生问长生

浏览器修仙模拟器。保留十档灵根、十境百层、21种随机事件、飞升、20项成就、经验成长、存档、人生回顾和历史；排行榜仅存本机。

## 启动

需要 Node.js 20.19+ 或 22.12+（建议使用当前 LTS）。

```bash
npm install
npm run dev
```

打开终端打印的本地地址。

```bash
npm test       # 与原版核心逐年对照
npm run build  # TypeScript检查及生产构建
npm run preview
```

构建结果在 `dist/`，可部署到宝塔等静态网站托管服务：

1. 执行 `npm run build`。
2. 将 `dist/` **里面的所有文件和文件夹**上传到网站根目录（例如 `/www/wwwroot/Fan_Ren_Xiu_Xian`），不要额外套一层 `dist`。
3. 确认宝塔的网站根目录指向该目录，然后访问绑定的域名。

部署后的目录结构如下，背景图和 `seal.svg` 也需要上传：

```text
Fan_Ren_Xiu_Xian/
├── index.html
├── seal.svg
├── apple-touch-icon.png
├── assets/
│   ├── index-<构建生成的名称>.js
│   └── index-<构建生成的名称>.css
└── backgrounds/
    ├── landscape-desktop.png
    └── landscape-mobile.png
```

当前没有后端，也不需要 API Key。

## 分享预览

`index.html` 中的 Open Graph 和 Twitter 标签指定分享标题、简介和封面。当前站点地址为 `https://fanren.tommymao.cn/`，封面复用 `public/backgrounds/landscape-desktop.png`；iPhone 图标使用 `public/apple-touch-icon.png`。

更换封面时，将新的 PNG 或 JPEG 放入 `public/`，同步修改 `og:image`、`twitter:image` 的完整 HTTPS 地址，以及 `og:image:type`、宽高和图片说明。更换域名时也需更新 `og:url` 和图片地址。执行 `npm run build`，将 `dist/` 的全部内容重新上传。图片地址需无需登录即可直接访问。

社交平台可能缓存旧预览；更换图片建议使用新文件名并更新标签。实际预览样式以目标平台为准。

## 技术与升级

Vite + TypeScript + CSS；核心使用独立 JavaScript 模块，保留原版计算语义。界面与模拟器解耦，后续可逐步迁移核心类型或替换 Vue/React 界面，而不用重写概率算法。

详细公式、数值表、事件、存档格式、已知原版行为和升级边界见 [核心算法文档](docs/ALGORITHMS.md)。

本机数据通过 localStorage 保存；清除网站数据会丢失记录。原站与新站的存档按域名隔离，不会自动迁移。界面使用系统无衬线字体（macOS 优先苹方，Windows 优先微软雅黑），不请求在线字体；桌面正文以 14px 为主，手机正文以 13px 为主，辅助文字不小于 12px，默认使用中等字重。不同系统的字形会略有差异。
