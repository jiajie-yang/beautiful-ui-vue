# Beautiful UI Vue Validation

**English** | [简体中文](MIGRATION_VALIDATION.zh-CN.md)

Automated validation date: 2026-10-09; UI comparison and independent component installation validation date: 2026-10-08.
Original source baseline: `44a274e598395ab61e7c96c26fda2758780253b7`. See [UPSTREAM](../UPSTREAM.md) for sources and licenses.

## Implementation scope

An independent Vue 3 + Vite + TypeScript + Tailwind CSS 4 application, including 11 atoms, 22 primitives, 21 gallery components with 16 variant options, the license page, and all 10 scripted Harness scenarios. Components use native Vue JSX / SFCs, with no React, React DOM, or Next.js runtime dependencies, and no runtime imports or symbolic links pointing to the original repository.

The project includes themes, fonts, images, source viewing and copying, component installation instructions, email interfaces, interaction sounds, and Canvas charts. An independent Node service implements the subscription API. The Harness and audio input retain scripted demo behavior; they do not integrate with real model, supplier, or microphone services.

## Automated validation

Run the system-installed pnpm from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

The latest build and test run passed: Vue type checking, generation of 33 component registry items, the Vite production build, and 83 tests across 6 test files. The regenerated registry matches the repository contents.

Tests cover component mounting and interactions, Vue template Boolean props and input takeover, Harness scenarios and chat tabs, the subscription API, production HTTP routes and request body limits, and the completeness of local dependencies and licenses in registry items.

Unit tests mock Canvas, audio, and browser measurement APIs; these tests do not establish actual visual or audible behavior. GitHub Actions is configured to check the build, tests, and registry consistency, but has not yet run on GitHub.

## Independent installation and UI comparison

On 2026-10-08, all 33 registry components were installed in an independent Vue + Tailwind 4 + Vue JSX project using the actual shadcn-vue CLI. Installation, Vue type checking, and the production build passed. Consumers still need to configure JSX, path aliases, font packages, and style imports as described in the [README](../README.md).

The original React application and the Vue production preview were compared on the same date:

- Desktop, 1440 × 1000: checked the dark and light appearance of all 21 default gallery components and all 16 variant options.
- Mobile, 390 × 844: checked the light layouts of all 21 default components, confirming no horizontal page overflow and preserved internal table scrolling.
- Harness: compared desktop dark and mobile light layouts, and checked supplier records, property configuration, and chat switching.
- Confirmed that actual Canvas charts were visible; no Vue warnings or unhandled JavaScript errors were captured during gallery and variant switching.
- Without an API key, subscriptions returned 503; the interface showed a retryable error, restored the button, and did not display a false success state.

The React baseline source was fixed to the commit above, with dependencies installed according to the original version ranges; this was not a byte-for-byte deployment reproduction using the original lockfile. Dynamic timing, streaming text, and charts need to be compared at equivalent stages. No claim is made that every animation frame is pixel-identical. The automated validation on 2026-10-09 did not repeat the full UI comparison or actual CLI installation.

The README retains chat and supplier workspace preview images. The maintainer has archived the complete migration screenshots, measurement records, and installation logs locally; they are not published with the source repository.

## Known differences and validation limits

- Commercial Central Icons have been replaced with local SVGs that preserve dimensions and semantics; some glyph shapes differ.
- React Agentation has been replaced with a local Vue feedback tool for selecting elements, entering feedback, and copying it, without external service integration.
- Fontsource local fonts may have minor rasterization differences compared with the original hosted font versions. The Surfer video still depends on the original remote service.
- The subscription API was validated with mocked Resend responses; no real contacts were written. Interaction sounds have not been checked by listening, and validation has not covered every browser or a production deployment.
- Confirmed upstream issues are deferred: custom approval text is not passed to the submission callback, pending automatic submission is not cancelled when the approval card is closed, and old children remain mounted after rapid chart switching. The existing 83 tests do not cover these cases.
