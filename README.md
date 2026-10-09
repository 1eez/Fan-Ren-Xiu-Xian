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

构建结果为 `dist/`，可部署到静态网站托管服务。当前没有后端，也不需要 API Key。

## 技术与升级

Vite + TypeScript + CSS；核心使用独立 JavaScript 模块，保留原版计算语义。界面与模拟器解耦，后续可逐步迁移核心类型或替换 Vue/React 界面，而不用重写概率算法。

详细公式、数值表、事件、存档格式、已知原版行为和升级边界见 [核心算法文档](docs/ALGORITHMS.md)。

本机数据通过 localStorage 保存；清除网站数据会丢失记录。原站与新站的存档按域名隔离，不会自动迁移。字体有在线增强，离线时回退到系统中文衬线字体，游戏核心不依赖在线字体。

规则基准：2026-10-10 获取的 [原版公开 game.js](https://4m0qygtsyawf3.aiforce.cloud/app/app_17dt3bhhbyg/game.js)。测试目录保留只含核心逻辑的原版快照用于回归比较；未引入原站平台 SDK 或统计脚本。
