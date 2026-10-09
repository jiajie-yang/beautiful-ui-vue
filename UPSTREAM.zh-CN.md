# 来源与许可

[English](UPSTREAM.md) | **简体中文**

- Beautiful UI: [原版仓库](https://github.com/slev12397/beautiful-ui)
- 源码快照: `44a274e598395ab61e7c96c26fda2758780253b7`
- 迁移日期: 2026-10-08
- 原版 atoms / primitives / site、画廊 / Harness / license / subscribe API 的布局与行为在本仓库中实现为 Vue 和独立 Node 服务。
- app/globals.css 复制为 src/styles/globals.css；logo.png、turbo-flourish.png、agent-desktop.webp 和 icon.png 均本地保存。

保留 Beautiful UI 原作者 Shane Levine 的版权声明。新增 Jiajie Yang 的版权声明对应 Vue 迁移及后续修改；第三方代码保留各自的版权声明与许可。

## 第三方代码

- Liveline 0.0.7: [上游仓库](https://github.com/benjitaylor/liveline) ，源码提交 `069899598a11e00094ea1eb6b838404825f828be`。保留原有 Canvas 绘制 / 数学 / 配色代码，将组件与生命周期适配为 Vue。MIT 许可见 [图表许可证](src/components/charts/LICENSE)。
- glimm 0.3.0: 仅本地保存框架无关核心；[许可证](src/vendor/glimm-LICENSE)、[来源说明](src/vendor/glimm-NOTICE.md)。
- @web-kits/audio 0.1.0: 仅本地保存框架无关核心；[许可证](src/vendor/audio-LICENSE)、[来源说明](src/vendor/audio-NOTICE.md)。
- Iconoir Vue 7.11.0: 本地保存 SelectionActions 使用的 10 个 SVG 组件。MIT 许可见 [图标许可证](src/components/icons/LICENSE)。
- Inter / JetBrains Mono: Fontsource 包提供本地字体，字体遵循其 SIL Open Font License。

不打包商业 Central Icons 的源码或图标资产，侧栏用本地绘制 SVG 替代。React Agentation 由 Vue 本地反馈工具替代。没有 React、React DOM 或 Next.js 运行时依赖。

本仓库独立维护，不依赖原仓库的 workspace、submodule 或符号链接；原版源码快照仅作为迁移来源。
