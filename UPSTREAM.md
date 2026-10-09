# Sources and licenses

**English** | [简体中文](UPSTREAM.zh-CN.md)

- Beautiful UI: [original repository](https://github.com/slev12397/beautiful-ui)
- Source snapshot: `44a274e598395ab61e7c96c26fda2758780253b7`
- Migration date: 2026-10-08
- The layout and behavior of the original atoms, primitives, site components, gallery, Harness, license page, and subscription API are implemented in this repository using Vue and an independent Node service.
- `app/globals.css` was copied to `src/styles/globals.css`. `logo.png`, `turbo-flourish.png`, `agent-desktop.webp`, and `icon.png` are stored locally.

The original Beautiful UI copyright notice for Shane Levine is preserved. The additional copyright notice for Jiajie Yang covers the Vue migration and subsequent modifications. Third-party code retains its own copyright and license notices.

## Third-party code

- Liveline 0.0.7: [upstream repository](https://github.com/benjitaylor/liveline), source commit `069899598a11e00094ea1eb6b838404825f828be`. The original Canvas drawing, math, and color code is retained, with the component and lifecycle adapted to Vue. See the [chart license](src/components/charts/LICENSE) for the MIT license.
- glimm 0.3.0: only the framework-independent core is stored locally. See the [license](src/vendor/glimm-LICENSE) and [source notice](src/vendor/glimm-NOTICE.md).
- @web-kits/audio 0.1.0: only the framework-independent core is stored locally. See the [license](src/vendor/audio-LICENSE) and [source notice](src/vendor/audio-NOTICE.md).
- Iconoir Vue 7.11.0: the 10 SVG components used by SelectionActions are stored locally. See the [icon license](src/components/icons/LICENSE) for the MIT license.
- Inter / JetBrains Mono: Fontsource packages provide local fonts under the SIL Open Font License.

Commercial Central Icons source code and icon assets are not bundled; the sidebar uses locally drawn SVGs instead. React Agentation is replaced with a local Vue feedback tool. There are no React, React DOM, or Next.js runtime dependencies.

This repository is maintained independently and does not depend on the original repository's workspace, submodules, or symbolic links. The original source snapshot serves only as the migration source.
