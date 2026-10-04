[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.3.6...v0.3.7)

## 🐛 Bug Fixes

- keep bunfig out of the library bundle, and load it only for a config file ([d2868a8](https://github.com/stacksjs/ts-css/commit/d2868a8)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.3.7 ([dfe0a5b](https://github.com/stacksjs/ts-css/commit/dfe0a5b)) _(by Chris <chrisbreuer93@gmail.com>)_
- run @stacksjs/logsmith, not the unrelated npm 'logsmith' ([9ef4890](https://github.com/stacksjs/ts-css/commit/9ef4890)) _(by Chris <chrisbreuer93@gmail.com>)_
- release through @stacksjs/bumpx, not the unrelated npm 'bumpx' ([d7dd148](https://github.com/stacksjs/ts-css/commit/d7dd148)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.3.5...v0.3.6)

## 💚 Continuous Integration

- drop dotenvx from the release, publish on OIDC alone ([04403c1](https://github.com/stacksjs/ts-css/commit/04403c1)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🔧 Chores

- release v0.3.6 ([01e636e](https://github.com/stacksjs/ts-css/commit/01e636e)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🎉 Miscellaneous

- Revert "ci: publish with the npm token, not OIDC" ([b307233](https://github.com/stacksjs/ts-css/commit/b307233)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.3.4...v0.3.5)

## 💚 Continuous Integration

- publish with the npm token, not OIDC ([9e33fdb](https://github.com/stacksjs/ts-css/commit/9e33fdb)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🔧 Chores

- release v0.3.5 ([d5aea94](https://github.com/stacksjs/ts-css/commit/d5aea94)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.3.3...v0.3.4)

## 🔧 Chores

- release v0.3.4 ([19d3516](https://github.com/stacksjs/ts-css/commit/19d3516)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: declare bun.sh ^1.4.1 ([b7681a8](https://github.com/stacksjs/ts-css/commit/b7681a8)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/cwcss/crosswind/compare/v0.3.2...v0.3.3)

## 🐛 Bug Fixes

- **config**: follow the CssOptions rename in the repo's own config ([759cc86](https://github.com/cwcss/crosswind/commit/759cc86)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🔧 Chores

- release v0.3.3 ([388137c](https://github.com/cwcss/crosswind/commit/388137c)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/cwcss/crosswind/compare/v0.3.1...v0.3.2)

## 💥 Breaking Changes

- refactor!: rename the TsCss type family to Css ([6758e2b](https://github.com/cwcss/crosswind/commit/6758e2b)) _(by Chris <chrisbreuer93@gmail.com>)_

## 👷 Build System

- ship only the cssx binary, not a ts-css one ([f511c0e](https://github.com/cwcss/crosswind/commit/f511c0e)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🔧 Chores

- release v0.3.2 ([26559ed](https://github.com/cwcss/crosswind/commit/26559ed)) _(by Chris <chrisbreuer93@gmail.com>)_
- update links ([5051d5a](https://github.com/cwcss/crosswind/commit/5051d5a)) _(by Chris <chrisbreuer93@gmail.com>)_
- adjust name ([07b0128](https://github.com/cwcss/crosswind/commit/07b0128)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.3.0...v0.3.1)

## 💥 Breaking Changes

- refactor(ts-css)!: fold the utility engine into @stacksjs/ts-css ([b234a9b](https://github.com/stacksjs/ts-css/commit/b234a9b)) _(by Chris <chrisbreuer93@gmail.com>)_

## ✨ Features

- merge @stacksjs/ts-css as packages/toolkit ([aa959a0](https://github.com/stacksjs/ts-css/commit/aa959a0)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **style**: collect and emit styles at build time ([47ac1ab](https://github.com/stacksjs/ts-css/commit/47ac1ab)) _(by Chris <chrisbreuer93@gmail.com>)_
- **style**: add a StyleX-style typed style API ([ee04754](https://github.com/stacksjs/ts-css/commit/ee04754)) _(by Chris <chrisbreuer93@gmail.com>)_
- extract utility classes from string literals in code ([e3de131](https://github.com/stacksjs/ts-css/commit/e3de131)) _(by Chris <chrisbreuer93@gmail.com>)_
- fill in missing Tailwind v4 utility families ([4597589](https://github.com/stacksjs/ts-css/commit/4597589)) _(by Chris <chrisbreuer93@gmail.com>)_
- support the v4 bg-linear-* gradient spelling ([90aae7d](https://github.com/stacksjs/ts-css/commit/90aae7d)) _(by Chris <chrisbreuer93@gmail.com>)_
- add CSS containment utilities ([b647e3b](https://github.com/stacksjs/ts-css/commit/b647e3b)) _(by Chris <chrisbreuer93@gmail.com>)_
- reload the config file during watch mode ([90f1b6b](https://github.com/stacksjs/ts-css/commit/90f1b6b)) _(by Chris <chrisbreuer93@gmail.com>)_
- adopt the Tailwind v4 radius and shadow scales ([b2c62ea](https://github.com/stacksjs/ts-css/commit/b2c62ea)) _(by Chris <chrisbreuer93@gmail.com>)_
- nest stacked at-rule variants and add darkMode media strategy ([e319366](https://github.com/stacksjs/ts-css/commit/e319366)) _(by Chris <chrisbreuer93@gmail.com>)_
- support max-* breakpoint variants and order media types first ([ded1272](https://github.com/stacksjs/ts-css/commit/ded1272)) _(by Chris <chrisbreuer93@gmail.com>)_
- extract classes from clsx/array/class:list/:class expressions ([a24a2cc](https://github.com/stacksjs/ts-css/commit/a24a2cc)) _(by Chris <chrisbreuer93@gmail.com>)_
- load web fonts via a `fonts` config ([504a485](https://github.com/stacksjs/ts-css/commit/504a485)) _(by Chris <chrisbreuer93@gmail.com>)_
- **rules**: table display family, flow-root/list-item/contents, arbitrary accent/caret ([b5b0d5d](https://github.com/stacksjs/ts-css/commit/b5b0d5d)) _(by Chris <chrisbreuer93@gmail.com>)_
- add `css` alias ([a20c714](https://github.com/stacksjs/ts-css/commit/a20c714)) _(by Chris <chrisbreuer93@gmail.com>)_
- **rules**: pure-CSS iconify rule for any @iconify-json/* collection ([6986e44](https://github.com/stacksjs/ts-css/commit/6986e44)) _(by Chris <chrisbreuer93@gmail.com>)_
- improve arbitrary values ([ac5f9a2](https://github.com/stacksjs/ts-css/commit/ac5f9a2)) _(by Chris <chrisbreuer93@gmail.com>)_
- handle arbitrary bracket opacity on named colors ([74046a9](https://github.com/stacksjs/ts-css/commit/74046a9)) _(by Chris <chrisbreuer93@gmail.com>)_
- add bun plugin ([9fbc89a](https://github.com/stacksjs/ts-css/commit/9fbc89a)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🐛 Bug Fixes

- **css**: route a typed arbitrary value to the property its hint names ([fe664e9](https://github.com/stacksjs/ts-css/commit/fe664e9)) _(by Chris <chrisbreuer93@gmail.com>)_
- **css**: make rtl:/ltr: match the element that carries dir ([8f06123](https://github.com/stacksjs/ts-css/commit/8f06123)) _(by Chris <chrisbreuer93@gmail.com>)_
- build the toolkit on install so a clean checkout can run tests ([82b369e](https://github.com/stacksjs/ts-css/commit/82b369e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **build**: build the toolkit before the package that imports it ([48872c2](https://github.com/stacksjs/ts-css/commit/48872c2)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- silence an inherited lint error and point buddy-bot at this repo ([cc68883](https://github.com/stacksjs/ts-css/commit/cc68883)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **test**: narrow iconRule's return type for the typechecker ([2f09533](https://github.com/stacksjs/ts-css/commit/2f09533)) _(by Chris <chrisbreuer93@gmail.com>)_
- **ci**: regenerate the lockfile for the renamed workspace ([6a8a05f](https://github.com/stacksjs/ts-css/commit/6a8a05f)) _(by Chris <chrisbreuer93@gmail.com>)_
- **generator**: let an explicit utility override an icon's defaults ([67ff161](https://github.com/stacksjs/ts-css/commit/67ff161)) _(by Chris <chrisbreuer93@gmail.com>)_
- **parser**: generate the classes an stx x-class binding names ([f74e77f](https://github.com/stacksjs/ts-css/commit/f74e77f)) _(by Chris <chrisbreuer93@gmail.com>)_
- **divide**: resolve arbitrary colours instead of re-implementing the resolver ([eb41f41](https://github.com/stacksjs/ts-css/commit/eb41f41)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#262625](https://github.com/stacksjs/ts-css/issues/262625), [#262625](https://github.com/stacksjs/ts-css/issues/262625))
- **build**: build the CLI the bin field points at ([72c2f9c](https://github.com/stacksjs/ts-css/commit/72c2f9c)) _(by Chris <chrisbreuer93@gmail.com>)_
- **preflight**: default uncoloured borders to grey, not currentColor ([26c031f](https://github.com/stacksjs/ts-css/commit/26c031f)) _(by Chris <chrisbreuer93@gmail.com>)_
- **icons**: resolve collections whose names contain hyphens ([de69481](https://github.com/stacksjs/ts-css/commit/de69481)) _(by Chris <chrisbreuer93@gmail.com>)_
- **parser**: ignore unrelated markup attributes ([236cb5d](https://github.com/stacksjs/ts-css/commit/236cb5d)) _(by Chris <chrisbreuer93@gmail.com>)_
- **types**: declare transform constants ([dd8bae9](https://github.com/stacksjs/ts-css/commit/dd8bae9)) _(by Chris <chrisbreuer93@gmail.com>)_
- **colors**: preserve functional slash alpha ([3bb83bd](https://github.com/stacksjs/ts-css/commit/3bb83bd)) _(by Chris <chrisbreuer93@gmail.com>)_
- normalize arbitrary math operators ([5a5c6e1](https://github.com/stacksjs/ts-css/commit/5a5c6e1)) _(by Chris <chrisbreuer93@gmail.com>)_
- rank stateful utilities by their class, not their pseudo-class ([c2b2086](https://github.com/stacksjs/ts-css/commit/c2b2086)) _(by Chris <chrisbreuer93@gmail.com>)_
- bring the scroll-snap fallback rule back in step with the fast path ([7529e10](https://github.com/stacksjs/ts-css/commit/7529e10)) _(by Chris <chrisbreuer93@gmail.com>)_
- register font-stretch and list-image as compound utilities ([f034685](https://github.com/stacksjs/ts-css/commit/f034685)) _(by Chris <chrisbreuer93@gmail.com>)_
- cap generated percentages at six decimals ([4f165de](https://github.com/stacksjs/ts-css/commit/4f165de)) _(by Chris <chrisbreuer93@gmail.com>)_
- match whole-class utilities on the variant-stripped class ([089bdb7](https://github.com/stacksjs/ts-css/commit/089bdb7)) _(by Chris <chrisbreuer93@gmail.com>)_
- compose filter utilities instead of overwriting each other ([3689be1](https://github.com/stacksjs/ts-css/commit/3689be1)) _(by Chris <chrisbreuer93@gmail.com>)_
- give the scroll-snap strictness variable a proximity fallback ([40ba80c](https://github.com/stacksjs/ts-css/commit/40ba80c)) _(by Chris <chrisbreuer93@gmail.com>)_
- emit CSS for arbitrary box shadows and shadow colors ([43e5118](https://github.com/stacksjs/ts-css/commit/43e5118)) _(by Chris <chrisbreuer93@gmail.com>)_
- remove consumer postinstall hook ([44d1ee3](https://github.com/stacksjs/ts-css/commit/44d1ee3)) _(by Chris <chrisbreuer93@gmail.com>)_
- use Tailwind v4's adaptive placeholder color in preflight ([8aa005f](https://github.com/stacksjs/ts-css/commit/8aa005f)) _(by Chris <chrisbreuer93@gmail.com>)_ ([#9](https://github.com/stacksjs/ts-css/issues/9))
- resolve iconify collections from Bun's isolated-install store ([d3c255d](https://github.com/stacksjs/ts-css/commit/d3c255d)) _(by Chris <chrisbreuer93@gmail.com>)_
- compose touch pan/pinch utilities through variables ([a2e85da](https://github.com/stacksjs/ts-css/commit/a2e85da)) _(by Chris <chrisbreuer93@gmail.com>)_
- emit only custom colors as :root CSS variables ([e74963c](https://github.com/stacksjs/ts-css/commit/e74963c)) _(by Chris <chrisbreuer93@gmail.com>)_
- canonical colon-syntax negatives and valid bracket color families ([ba2745f](https://github.com/stacksjs/ts-css/commit/ba2745f)) _(by Chris <chrisbreuer93@gmail.com>)_
- correct utility cascade ranking for important, rounded corners, and gaps ([90bb970](https://github.com/stacksjs/ts-css/commit/90bb970)) _(by Chris <chrisbreuer93@gmail.com>)_
- stop fast-path lookup tables shadowing theme overrides ([07dc355](https://github.com/stacksjs/ts-css/commit/07dc355)) _(by Chris <chrisbreuer93@gmail.com>)_
- compose ring utilities through the variable system with fallbacks ([1a0aed7](https://github.com/stacksjs/ts-css/commit/1a0aed7)) _(by Chris <chrisbreuer93@gmail.com>)_
- give transition utilities Tailwind's default duration and easing ([b4992a7](https://github.com/stacksjs/ts-css/commit/b4992a7)) _(by Chris <chrisbreuer93@gmail.com>)_
- make form-* utilities generate CSS at all ([e377b3c](https://github.com/stacksjs/ts-css/commit/e377b3c)) _(by Chris <chrisbreuer93@gmail.com>)_
- reject negative padding utilities ([7b44148](https://github.com/stacksjs/ts-css/commit/7b44148)) _(by Chris <chrisbreuer93@gmail.com>)_
- clear compiled-class state in generator reset ([afdf839](https://github.com/stacksjs/ts-css/commit/afdf839)) _(by Chris <chrisbreuer93@gmail.com>)_
- honor config watch/verbose fields and warn on zero-match content patterns ([a6e0b9a](https://github.com/stacksjs/ts-css/commit/a6e0b9a)) _(by Chris <chrisbreuer93@gmail.com>)_
- apply preset rules, shortcuts, variants, and preflights ([f7bdac5](https://github.com/stacksjs/ts-css/commit/f7bdac5)) _(by Chris <chrisbreuer93@gmail.com>)_
- make analyze stats honest and dedupe overlapping scan patterns ([dd1eac1](https://github.com/stacksjs/ts-css/commit/dd1eac1)) _(by Chris <chrisbreuer93@gmail.com>)_
- ignore non-string safelist entries instead of crashing the build ([ff8d776](https://github.com/stacksjs/ts-css/commit/ff8d776)) _(by Chris <chrisbreuer93@gmail.com>)_
- emit real CSS for compile-class groups under the hashed selector ([c43b839](https://github.com/stacksjs/ts-css/commit/c43b839)) _(by Chris <chrisbreuer93@gmail.com>)_
- deep-merge plugin theme overrides, honor extract options, inject into fragments ([17c5ab7](https://github.com/stacksjs/ts-css/commit/17c5ab7)) _(by Chris <chrisbreuer93@gmail.com>)_
- stop watch mode crashing on non-** content patterns and debounce rebuilds ([9182ef1](https://github.com/stacksjs/ts-css/commit/9182ef1)) _(by Chris <chrisbreuer93@gmail.com>)_
- make --no-preflight work and scan .stx in the init template ([8907d4e](https://github.com/stacksjs/ts-css/commit/8907d4e)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate decoration, SVG dash, and text-emphasis values; accept hwb() and short-hex alpha ([6dec71a](https://github.com/stacksjs/ts-css/commit/6dec71a)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate border-radius side/corner values and support bare side forms ([771decc](https://github.com/stacksjs/ts-css/commit/771decc)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate outline, mask, and text-shadow values ([5a30c72](https://github.com/stacksjs/ts-css/commit/5a30c72)) _(by Chris <chrisbreuer93@gmail.com>)_
- drop rules with unknown variants and support arbitrary variants ([d6c3ed8](https://github.com/stacksjs/ts-css/commit/d6c3ed8)) _(by Chris <chrisbreuer93@gmail.com>)_

## ⚡ Performance Improvements

- **generator**: memoise theme-derived tables and cut serialiser allocations ([36a854d](https://github.com/stacksjs/ts-css/commit/36a854d)) _(by Chris <chrisbreuer93@gmail.com>)_
- **generator**: memoise toCSS output ([5fede11](https://github.com/stacksjs/ts-css/commit/5fede11)) _(by Chris <chrisbreuer93@gmail.com>)_
- **build**: cut the waste out of the published output ([4f2d4e9](https://github.com/stacksjs/ts-css/commit/4f2d4e9)) _(by Chris <chrisbreuer93@gmail.com>)_
- **build**: minify the published bundles ([ab79be3](https://github.com/stacksjs/ts-css/commit/ab79be3)) _(by Chris <chrisbreuer93@gmail.com>)_
- read scanned files through a bounded pool ([0bcb3de](https://github.com/stacksjs/ts-css/commit/0bcb3de)) _(by Chris <chrisbreuer93@gmail.com>)_
- split utility and value in linear time ([28e7a16](https://github.com/stacksjs/ts-css/commit/28e7a16)) _(by Chris <chrisbreuer93@gmail.com>)_
- hoist rule lookup tables to module scope ([720a73f](https://github.com/stacksjs/ts-css/commit/720a73f)) _(by Chris <chrisbreuer93@gmail.com>)_
- memoize utility cascade ranking per selector ([7209b48](https://github.com/stacksjs/ts-css/commit/7209b48)) _(by Chris <chrisbreuer93@gmail.com>)_
- bound the parse caches and memoize bracket alias resolution ([f60ab05](https://github.com/stacksjs/ts-css/commit/f60ab05)) _(by Chris <chrisbreuer93@gmail.com>)_
- actually minify preflight and keyframes in minified output ([f64c006](https://github.com/stacksjs/ts-css/commit/f64c006)) _(by Chris <chrisbreuer93@gmail.com>)_

## ♻️ Code Refactoring

- use the toolkit's optimiser and free up css.config.ts ([2be5e9c](https://github.com/stacksjs/ts-css/commit/2be5e9c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- publish under a scoped name ([99415b3](https://github.com/stacksjs/ts-css/commit/99415b3)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- default the class prefix to tc ([c846c2d](https://github.com/stacksjs/ts-css/commit/c846c2d)) _(by Chris <chrisbreuer93@gmail.com>)_
- **cli**: rename the binary to cssx and the config to css.config.ts ([94056cc](https://github.com/stacksjs/ts-css/commit/94056cc)) _(by Chris <chrisbreuer93@gmail.com>)_
- rename the package to ts-css ([6a17895](https://github.com/stacksjs/ts-css/commit/6a17895)) _(by Chris <chrisbreuer93@gmail.com>)_
- rename Headwind/hw to Crosswind/cw ([4d71e0b](https://github.com/stacksjs/ts-css/commit/4d71e0b)) _(by Chris <chrisbreuer93@gmail.com>)_

## 📝 Documentation

- document text direction, logical utilities and the rtl:/ltr: variants ([b6afc1f](https://github.com/stacksjs/ts-css/commit/b6afc1f)) _(by Chris <chrisbreuer93@gmail.com>)_
- update benchmark numbers after the generator optimisations ([1534796](https://github.com/stacksjs/ts-css/commit/1534796)) _(by Chris <chrisbreuer93@gmail.com>)_
- rewrite the READMEs around both APIs ([0643cb3](https://github.com/stacksjs/ts-css/commit/0643cb3)) _(by Chris <chrisbreuer93@gmail.com>)_
- complete the ts-css rename across the docs site ([5af78f6](https://github.com/stacksjs/ts-css/commit/5af78f6)) _(by Chris <chrisbreuer93@gmail.com>)_
- link the community as stacksjs.com/discord ([01f92f4](https://github.com/stacksjs/ts-css/commit/01f92f4)) _(by Chris <chrisbreuer93@gmail.com>)_
- declare Tailwind v4 semantics as the compass ([af77e90](https://github.com/stacksjs/ts-css/commit/af77e90)) _(by Chris <chrisbreuer93@gmail.com>)_
- align README init snippet with the actual scaffold ([36058eb](https://github.com/stacksjs/ts-css/commit/36058eb)) _(by Chris <chrisbreuer93@gmail.com>)_

## 💄 Styles

- build the color fast-path overlay from a diff map ([7a0da30](https://github.com/stacksjs/ts-css/commit/7a0da30)) _(by Chris <chrisbreuer93@gmail.com>)_

## ✅ Tests

- **variants**: cover the cursor family under variants ([fc14dab](https://github.com/stacksjs/ts-css/commit/fc14dab)) _(by Chris <chrisbreuer93@gmail.com>)_
- **performance**: account for CI scheduler variance ([376694e](https://github.com/stacksjs/ts-css/commit/376694e)) _(by Chris <chrisbreuer93@gmail.com>)_

## 💚 Continuous Integration

- confirm the package reached the registry before reporting success ([9807e65](https://github.com/stacksjs/ts-css/commit/9807e65)) _(by Chris <chrisbreuer93@gmail.com>)_
- verify the npm token before writing or pushing anything ([96f3fc6](https://github.com/stacksjs/ts-css/commit/96f3fc6)) _(by Chris <chrisbreuer93@gmail.com>)_
- add a one-command publishing setup script ([dd9ff95](https://github.com/stacksjs/ts-css/commit/dd9ff95)) _(by Chris <chrisbreuer93@gmail.com>)_
- let the release read credentials from an encrypted .env.production ([3068893](https://github.com/stacksjs/ts-css/commit/3068893)) _(by Chris <chrisbreuer93@gmail.com>)_
- drop redundant setup-bun (pantry installs bun via deps.yaml) ([711b697](https://github.com/stacksjs/ts-css/commit/711b697)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- drop redundant setup-bun (pantry installs bun via deps.yaml) ([7fafadf](https://github.com/stacksjs/ts-css/commit/7fafadf)) _(by glennmichael123 <gtorregosa@gmail.com>)_

## 🔧 Chores

- release v0.3.1 ([8223c1e](https://github.com/stacksjs/ts-css/commit/8223c1e)) _(by Chris <chrisbreuer93@gmail.com>)_
- drop the grafted .github and repoint the toolkit at this repo ([0de9558](https://github.com/stacksjs/ts-css/commit/0de9558)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- release v0.3.0 ([30964cf](https://github.com/stacksjs/ts-css/commit/30964cf)) _(by Chris <chrisbreuer93@gmail.com>)_
- add a release:minor script ([e4986c0](https://github.com/stacksjs/ts-css/commit/e4986c0)) _(by Chris <chrisbreuer93@gmail.com>)_
- gitignore env files ([d9da68b](https://github.com/stacksjs/ts-css/commit/d9da68b)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.21 ([161a5a3](https://github.com/stacksjs/ts-css/commit/161a5a3)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.20 ([4f0c2bb](https://github.com/stacksjs/ts-css/commit/4f0c2bb)) _(by Chris <chrisbreuer93@gmail.com>)_
- untrack the compiled CLI binary ([ee98c52](https://github.com/stacksjs/ts-css/commit/ee98c52)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.19 ([98d3e72](https://github.com/stacksjs/ts-css/commit/98d3e72)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.18 ([5d830f8](https://github.com/stacksjs/ts-css/commit/5d830f8)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.17 ([5b2d5a2](https://github.com/stacksjs/ts-css/commit/5b2d5a2)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.1.4 ([817e67e](https://github.com/stacksjs/ts-css/commit/817e67e)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.1.3 ([ec02452](https://github.com/stacksjs/ts-css/commit/ec02452)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.1.2 ([6486b75](https://github.com/stacksjs/ts-css/commit/6486b75)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.16 ([403e997](https://github.com/stacksjs/ts-css/commit/403e997)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.15 ([93a2bb3](https://github.com/stacksjs/ts-css/commit/93a2bb3)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: raise the bunfig floor to 0.15.17 ([414ec12](https://github.com/stacksjs/ts-css/commit/414ec12)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.14 ([35f6257](https://github.com/stacksjs/ts-css/commit/35f6257)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.13 ([b51fcac](https://github.com/stacksjs/ts-css/commit/b51fcac)) _(by Chris <chrisbreuer93@gmail.com>)_
- drop a scratch probe script committed by accident ([21f303e](https://github.com/stacksjs/ts-css/commit/21f303e)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.12 ([f393969](https://github.com/stacksjs/ts-css/commit/f393969)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.11 ([de33fd0](https://github.com/stacksjs/ts-css/commit/de33fd0)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.1.1 ([d9d2b0c](https://github.com/stacksjs/ts-css/commit/d9d2b0c)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: refresh pantry lockfile ([15ee434](https://github.com/stacksjs/ts-css/commit/15ee434)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: update bunfig to 0.15.15 ([70fa775](https://github.com/stacksjs/ts-css/commit/70fa775)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: declare bun ^1.3.14 in deps.yaml ([83f0002](https://github.com/stacksjs/ts-css/commit/83f0002)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: declare bun ^1.3.14 in deps.yaml ([c4a8f31](https://github.com/stacksjs/ts-css/commit/c4a8f31)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.10 ([5df6bc3](https://github.com/stacksjs/ts-css/commit/5df6bc3)) _(by Chris <chrisbreuer93@gmail.com>)_
- **pkg**: add sideEffects:false for bundler tree-shaking (publint) ([a3712cf](https://github.com/stacksjs/ts-css/commit/a3712cf)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.9 ([669ef64](https://github.com/stacksjs/ts-css/commit/669ef64)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.8 ([26bf736](https://github.com/stacksjs/ts-css/commit/26bf736)) _(by Chris <chrisbreuer93@gmail.com>)_
- release v0.2.7 ([c530097](https://github.com/stacksjs/ts-css/commit/c530097)) _(by Chris <chrisbreuer93@gmail.com>)_
- upgrade to TypeScript 7 ([c19c6b2](https://github.com/stacksjs/ts-css/commit/c19c6b2)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: refresh bun.lock to pick up pickier 0.1.37 ([6b8d86c](https://github.com/stacksjs/ts-css/commit/6b8d86c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up pickier 0.1.37 ([99f1169](https://github.com/stacksjs/ts-css/commit/99f1169)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **config**: move crosswind.config.ts to config/crosswind.ts ([e623a3e](https://github.com/stacksjs/ts-css/commit/e623a3e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- release v0.2.6 ([d755a58](https://github.com/stacksjs/ts-css/commit/d755a58)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up pickier 0.1.35 ([2dc313e](https://github.com/stacksjs/ts-css/commit/2dc313e)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up pickier 0.1.35 ([e5e3b52](https://github.com/stacksjs/ts-css/commit/e5e3b52)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up pickier 0.1.33 ([a89a742](https://github.com/stacksjs/ts-css/commit/a89a742)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up pickier 0.1.33 ([eacc15f](https://github.com/stacksjs/ts-css/commit/eacc15f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- release v0.2.5 ([86d3905](https://github.com/stacksjs/ts-css/commit/86d3905)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: refresh bun.lock to pick up @stacksjs/logsmith 0.2.3 ([0b2e754](https://github.com/stacksjs/ts-css/commit/0b2e754)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up @stacksjs/logsmith 0.2.3 ([557588f](https://github.com/stacksjs/ts-css/commit/557588f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up buddy-bot 0.9.20 ([66d94f2](https://github.com/stacksjs/ts-css/commit/66d94f2)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: refresh bun.lock to pick up buddy-bot 0.9.20 ([172a40f](https://github.com/stacksjs/ts-css/commit/172a40f)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- wip ([2b9a1c0](https://github.com/stacksjs/ts-css/commit/2b9a1c0)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: bump better-dx to ^0.2.15 ([cbe57f9](https://github.com/stacksjs/ts-css/commit/cbe57f9)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **deps**: bump better-dx to ^0.2.15 ([42844fe](https://github.com/stacksjs/ts-css/commit/42844fe)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **ci**: bump actions/checkout to v6, actions/cache to v5 ([7ed4b33](https://github.com/stacksjs/ts-css/commit/7ed4b33)) _(by glennmichael123 <gtorregosa@gmail.com>)_

## ⏪ Reverts

- keep staged-lint kebab + bunx gitlint shorthand ([cb5bcc0](https://github.com/stacksjs/ts-css/commit/cb5bcc0)) _(by glennmichael123 <gtorregosa@gmail.com>)_

## 🎉 Miscellaneous

- Merge @stacksjs/ts-css into this repo as packages/toolkit (#27) ([e210205](https://github.com/stacksjs/ts-css/commit/e210205)) _(by Glenn Michael Torregosa <gtorregosa@gmail.com>)_ ([#27](https://github.com/stacksjs/ts-css/issues/27), [#27](https://github.com/stacksjs/ts-css/issues/27))
- Update release.yml ([78805d4](https://github.com/stacksjs/ts-css/commit/78805d4)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- Merge pull request #14 from cwcss/feat/pantry-release ([8c7ae71](https://github.com/stacksjs/ts-css/commit/8c7ae71)) _(by Glenn Michael Torregosa <gtorregosa@gmail.com>)_ ([#14](https://github.com/stacksjs/ts-css/issues/14), [#14](https://github.com/stacksjs/ts-css/issues/14))

## bench

- fix the methodology and add a StyleX comparison ([4afe0c0](https://github.com/stacksjs/ts-css/commit/4afe0c0)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_
- _Glenn Michael Torregosa <gtorregosa@gmail.com>_
- _glennmichael123 <gtorregosa@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.21...v0.3.0)

## ⚡ Performance Improvements

- **generator**: memoise theme-derived tables and cut serialiser allocations ([1fb675c](https://github.com/stacksjs/ts-css/commit/1fb675c)) _(by Chris <chrisbreuer93@gmail.com>)_

## 📝 Documentation

- update benchmark numbers after the generator optimisations ([13258c3](https://github.com/stacksjs/ts-css/commit/13258c3)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🔧 Chores

- release v0.3.0 ([7b37ab8](https://github.com/stacksjs/ts-css/commit/7b37ab8)) _(by Chris <chrisbreuer93@gmail.com>)_
- add a release:minor script ([7c07dd6](https://github.com/stacksjs/ts-css/commit/7c07dd6)) _(by Chris <chrisbreuer93@gmail.com>)_
- gitignore env files ([449a297](https://github.com/stacksjs/ts-css/commit/449a297)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.20...v0.2.21)

## 🐛 Bug Fixes

- **test**: narrow iconRule's return type for the typechecker ([68ced3b](https://github.com/stacksjs/ts-css/commit/68ced3b)) _(by Chris <chrisbreuer93@gmail.com>)_
- **ci**: regenerate the lockfile for the renamed workspace ([4450160](https://github.com/stacksjs/ts-css/commit/4450160)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🔧 Chores

- release v0.2.21 ([960b911](https://github.com/stacksjs/ts-css/commit/960b911)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.19...v0.2.20)

## 🚀 Features

- **style**: collect and emit styles at build time ([2c0eca8](https://github.com/stacksjs/ts-css/commit/2c0eca8)) _(by Chris <chrisbreuer93@gmail.com>)_
- **style**: add a StyleX-style typed style API ([0f5df5c](https://github.com/stacksjs/ts-css/commit/0f5df5c)) _(by Chris <chrisbreuer93@gmail.com>)_

## ⚡ Performance Improvements

- **generator**: memoise toCSS output ([29b6e2f](https://github.com/stacksjs/ts-css/commit/29b6e2f)) _(by Chris <chrisbreuer93@gmail.com>)_

## ♻️ Code Refactoring

- default the class prefix to tc ([5210211](https://github.com/stacksjs/ts-css/commit/5210211)) _(by Chris <chrisbreuer93@gmail.com>)_
- **cli**: rename the binary to cssx and the config to css.config.ts ([c84d85f](https://github.com/stacksjs/ts-css/commit/c84d85f)) _(by Chris <chrisbreuer93@gmail.com>)_
- rename the package to ts-css ([6489387](https://github.com/stacksjs/ts-css/commit/6489387)) _(by Chris <chrisbreuer93@gmail.com>)_

## 📚 Documentation

- rewrite the READMEs around both APIs ([0833060](https://github.com/stacksjs/ts-css/commit/0833060)) _(by Chris <chrisbreuer93@gmail.com>)_
- complete the ts-css rename across the docs site ([6688376](https://github.com/stacksjs/ts-css/commit/6688376)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.20 ([e6e2717](https://github.com/stacksjs/ts-css/commit/e6e2717)) _(by Chris <chrisbreuer93@gmail.com>)_
- untrack the compiled CLI binary ([70a5a2d](https://github.com/stacksjs/ts-css/commit/70a5a2d)) _(by Chris <chrisbreuer93@gmail.com>)_

## bench

- fix the methodology and add a StyleX comparison ([18a7e6c](https://github.com/stacksjs/ts-css/commit/18a7e6c)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.18...v0.2.19)

## 🐛 Bug Fixes

- **generator**: let an explicit utility override an icon's defaults ([fd033ff](https://github.com/stacksjs/ts-css/commit/fd033ff)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.19 ([1e3a91e](https://github.com/stacksjs/ts-css/commit/1e3a91e)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.17...v0.2.18)

## 🐛 Bug Fixes

- **parser**: generate the classes an stx x-class binding names ([82f3077](https://github.com/stacksjs/ts-css/commit/82f3077)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.18 ([b9c15b0](https://github.com/stacksjs/ts-css/commit/b9c15b0)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.16...v0.2.17)

## 🐛 Bug Fixes

- **divide**: resolve arbitrary colours instead of re-implementing the resolver ([007fa2a](https://github.com/stacksjs/ts-css/commit/007fa2a)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.17 ([2bc65d9](https://github.com/stacksjs/ts-css/commit/2bc65d9)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.15...v0.2.16)

## 🐛 Bug Fixes

- **preflight**: default uncoloured borders to grey, not currentColor ([d1ec7a0](https://github.com/stacksjs/ts-css/commit/d1ec7a0)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.16 ([1c87195](https://github.com/stacksjs/ts-css/commit/1c87195)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.13...v0.2.14)

## 🐛 Bug Fixes

- **parser**: ignore unrelated markup attributes ([1d46197](https://github.com/stacksjs/ts-css/commit/1d46197)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.14 ([73eb5bc](https://github.com/stacksjs/ts-css/commit/73eb5bc)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.12...v0.2.13)

## 🚀 Features

- extract utility classes from string literals in code ([3f48fe5](https://github.com/stacksjs/ts-css/commit/3f48fe5)) _(by Chris <chrisbreuer93@gmail.com>)_
- fill in missing Tailwind v4 utility families ([8f228fb](https://github.com/stacksjs/ts-css/commit/8f228fb)) _(by Chris <chrisbreuer93@gmail.com>)_
- support the v4 bg-linear-* gradient spelling ([79cead8](https://github.com/stacksjs/ts-css/commit/79cead8)) _(by Chris <chrisbreuer93@gmail.com>)_
- add CSS containment utilities ([19806d6](https://github.com/stacksjs/ts-css/commit/19806d6)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🐛 Bug Fixes

- **types**: declare transform constants ([21b9336](https://github.com/stacksjs/ts-css/commit/21b9336)) _(by Chris <chrisbreuer93@gmail.com>)_
- **colors**: preserve functional slash alpha ([c59a59b](https://github.com/stacksjs/ts-css/commit/c59a59b)) _(by Chris <chrisbreuer93@gmail.com>)_
- normalize arbitrary math operators ([6145562](https://github.com/stacksjs/ts-css/commit/6145562)) _(by Chris <chrisbreuer93@gmail.com>)_
- rank stateful utilities by their class, not their pseudo-class ([93ad42a](https://github.com/stacksjs/ts-css/commit/93ad42a)) _(by Chris <chrisbreuer93@gmail.com>)_
- bring the scroll-snap fallback rule back in step with the fast path ([f2755ef](https://github.com/stacksjs/ts-css/commit/f2755ef)) _(by Chris <chrisbreuer93@gmail.com>)_
- register font-stretch and list-image as compound utilities ([968c937](https://github.com/stacksjs/ts-css/commit/968c937)) _(by Chris <chrisbreuer93@gmail.com>)_
- cap generated percentages at six decimals ([9f19da7](https://github.com/stacksjs/ts-css/commit/9f19da7)) _(by Chris <chrisbreuer93@gmail.com>)_
- match whole-class utilities on the variant-stripped class ([1fa45c5](https://github.com/stacksjs/ts-css/commit/1fa45c5)) _(by Chris <chrisbreuer93@gmail.com>)_

## ⚡ Performance Improvements

- read scanned files through a bounded pool ([868e2fc](https://github.com/stacksjs/ts-css/commit/868e2fc)) _(by Chris <chrisbreuer93@gmail.com>)_
- split utility and value in linear time ([284a0cd](https://github.com/stacksjs/ts-css/commit/284a0cd)) _(by Chris <chrisbreuer93@gmail.com>)_
- hoist rule lookup tables to module scope ([2bc83a8](https://github.com/stacksjs/ts-css/commit/2bc83a8)) _(by Chris <chrisbreuer93@gmail.com>)_
- memoize utility cascade ranking per selector ([a81d4f2](https://github.com/stacksjs/ts-css/commit/a81d4f2)) _(by Chris <chrisbreuer93@gmail.com>)_
- bound the parse caches and memoize bracket alias resolution ([af5da84](https://github.com/stacksjs/ts-css/commit/af5da84)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.13 ([31661e2](https://github.com/stacksjs/ts-css/commit/31661e2)) _(by Chris <chrisbreuer93@gmail.com>)_
- drop a scratch probe script committed by accident ([26a3b10](https://github.com/stacksjs/ts-css/commit/26a3b10)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.11...v0.2.12)

## 🐛 Bug Fixes

- compose filter utilities instead of overwriting each other ([7462d1d](https://github.com/stacksjs/ts-css/commit/7462d1d)) _(by Chris <chrisbreuer93@gmail.com>)_
- give the scroll-snap strictness variable a proximity fallback ([5adeefc](https://github.com/stacksjs/ts-css/commit/5adeefc)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.12 ([ac10410](https://github.com/stacksjs/ts-css/commit/ac10410)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.10...v0.2.11)

## 🐛 Bug Fixes

- emit CSS for arbitrary box shadows and shadow colors ([5ec4b94](https://github.com/stacksjs/ts-css/commit/5ec4b94)) _(by Chris <chrisbreuer93@gmail.com>)_

## 📚 Documentation

- link the community as stacksjs.com/discord ([1ba2f60](https://github.com/stacksjs/ts-css/commit/1ba2f60)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧪 Tests

- **performance**: account for CI scheduler variance ([6ba83a9](https://github.com/stacksjs/ts-css/commit/6ba83a9)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.11 ([799efe4](https://github.com/stacksjs/ts-css/commit/799efe4)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: refresh pantry lockfile ([001ec62](https://github.com/stacksjs/ts-css/commit/001ec62)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: update bunfig to 0.15.15 ([aa5635d](https://github.com/stacksjs/ts-css/commit/aa5635d)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: declare bun ^1.3.14 in deps.yaml ([30e3874](https://github.com/stacksjs/ts-css/commit/30e3874)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.9...v0.2.10)

## 🚀 Features

- reload the config file during watch mode ([807b74d](https://github.com/stacksjs/ts-css/commit/807b74d)) _(by Chris <chrisbreuer93@gmail.com>)_
- adopt the Tailwind v4 radius and shadow scales ([deac57c](https://github.com/stacksjs/ts-css/commit/deac57c)) _(by Chris <chrisbreuer93@gmail.com>)_
- nest stacked at-rule variants and add darkMode media strategy ([53e0fda](https://github.com/stacksjs/ts-css/commit/53e0fda)) _(by Chris <chrisbreuer93@gmail.com>)_
- support max-* breakpoint variants and order media types first ([362c833](https://github.com/stacksjs/ts-css/commit/362c833)) _(by Chris <chrisbreuer93@gmail.com>)_
- extract classes from clsx/array/class:list/:class expressions ([2d45ae5](https://github.com/stacksjs/ts-css/commit/2d45ae5)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🐛 Bug Fixes

- use Tailwind v4's adaptive placeholder color in preflight ([67b8176](https://github.com/stacksjs/ts-css/commit/67b8176)) _(by Chris <chrisbreuer93@gmail.com>)_
- resolve iconify collections from Bun's isolated-install store ([1a0d618](https://github.com/stacksjs/ts-css/commit/1a0d618)) _(by Chris <chrisbreuer93@gmail.com>)_
- compose touch pan/pinch utilities through variables ([c229564](https://github.com/stacksjs/ts-css/commit/c229564)) _(by Chris <chrisbreuer93@gmail.com>)_
- emit only custom colors as :root CSS variables ([3160b0a](https://github.com/stacksjs/ts-css/commit/3160b0a)) _(by Chris <chrisbreuer93@gmail.com>)_
- canonical colon-syntax negatives and valid bracket color families ([597e2b3](https://github.com/stacksjs/ts-css/commit/597e2b3)) _(by Chris <chrisbreuer93@gmail.com>)_
- correct utility cascade ranking for important, rounded corners, and gaps ([0427381](https://github.com/stacksjs/ts-css/commit/0427381)) _(by Chris <chrisbreuer93@gmail.com>)_
- stop fast-path lookup tables shadowing theme overrides ([a6065ab](https://github.com/stacksjs/ts-css/commit/a6065ab)) _(by Chris <chrisbreuer93@gmail.com>)_
- compose ring utilities through the variable system with fallbacks ([faa09db](https://github.com/stacksjs/ts-css/commit/faa09db)) _(by Chris <chrisbreuer93@gmail.com>)_
- give transition utilities Tailwind's default duration and easing ([14e0799](https://github.com/stacksjs/ts-css/commit/14e0799)) _(by Chris <chrisbreuer93@gmail.com>)_
- make form-* utilities generate CSS at all ([a03b48d](https://github.com/stacksjs/ts-css/commit/a03b48d)) _(by Chris <chrisbreuer93@gmail.com>)_
- reject negative padding utilities ([aee4139](https://github.com/stacksjs/ts-css/commit/aee4139)) _(by Chris <chrisbreuer93@gmail.com>)_
- clear compiled-class state in generator reset ([0c19f0c](https://github.com/stacksjs/ts-css/commit/0c19f0c)) _(by Chris <chrisbreuer93@gmail.com>)_
- honor config watch/verbose fields and warn on zero-match content patterns ([2dc0a15](https://github.com/stacksjs/ts-css/commit/2dc0a15)) _(by Chris <chrisbreuer93@gmail.com>)_
- apply preset rules, shortcuts, variants, and preflights ([36302ad](https://github.com/stacksjs/ts-css/commit/36302ad)) _(by Chris <chrisbreuer93@gmail.com>)_
- make analyze stats honest and dedupe overlapping scan patterns ([b600be6](https://github.com/stacksjs/ts-css/commit/b600be6)) _(by Chris <chrisbreuer93@gmail.com>)_
- ignore non-string safelist entries instead of crashing the build ([182fa84](https://github.com/stacksjs/ts-css/commit/182fa84)) _(by Chris <chrisbreuer93@gmail.com>)_
- emit real CSS for compile-class groups under the hashed selector ([154b7c7](https://github.com/stacksjs/ts-css/commit/154b7c7)) _(by Chris <chrisbreuer93@gmail.com>)_
- deep-merge plugin theme overrides, honor extract options, inject into fragments ([f1925b5](https://github.com/stacksjs/ts-css/commit/f1925b5)) _(by Chris <chrisbreuer93@gmail.com>)_
- stop watch mode crashing on non-** content patterns and debounce rebuilds ([05b9f7d](https://github.com/stacksjs/ts-css/commit/05b9f7d)) _(by Chris <chrisbreuer93@gmail.com>)_
- make --no-preflight work and scan .stx in the init template ([202a5d2](https://github.com/stacksjs/ts-css/commit/202a5d2)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate decoration, SVG dash, and text-emphasis values; accept hwb() and short-hex alpha ([4b9ba1b](https://github.com/stacksjs/ts-css/commit/4b9ba1b)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate border-radius side/corner values and support bare side forms ([a6f2529](https://github.com/stacksjs/ts-css/commit/a6f2529)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate outline, mask, and text-shadow values ([3a3d788](https://github.com/stacksjs/ts-css/commit/3a3d788)) _(by Chris <chrisbreuer93@gmail.com>)_
- drop rules with unknown variants and support arbitrary variants ([7d54f25](https://github.com/stacksjs/ts-css/commit/7d54f25)) _(by Chris <chrisbreuer93@gmail.com>)_
- emit media query blocks in mobile-first breakpoint order ([900bf90](https://github.com/stacksjs/ts-css/commit/900bf90)) _(by Chris <chrisbreuer93@gmail.com>)_
- generate static-map utilities under variants ([fdb6304](https://github.com/stacksjs/ts-css/commit/fdb6304)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate scroll margin/padding, column-gap, and perspective values ([16fdc32](https://github.com/stacksjs/ts-css/commit/16fdc32)) _(by Chris <chrisbreuer93@gmail.com>)_
- expand short hex with alpha correctly in opacity modifiers ([b54a337](https://github.com/stacksjs/ts-css/commit/b54a337)) _(by Chris <chrisbreuer93@gmail.com>)_
- reject unknown words in gradient color stops ([323b9f1](https://github.com/stacksjs/ts-css/commit/323b9f1)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate divide, space-between, and ring/border opacity values ([268d6d0](https://github.com/stacksjs/ts-css/commit/268d6d0)) _(by Chris <chrisbreuer93@gmail.com>)_
- escape all non-identifier characters in class selectors ([45d9cd8](https://github.com/stacksjs/ts-css/commit/45d9cd8)) _(by Chris <chrisbreuer93@gmail.com>)_
- stop the important modifier mutating shared rule property objects ([2b3a5ab](https://github.com/stacksjs/ts-css/commit/2b3a5ab)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate filter, ring, columns, aspect, align-self, and border-spacing values ([d53348d](https://github.com/stacksjs/ts-css/commit/d53348d)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate spacing-derived utility values ([c5fd362](https://github.com/stacksjs/ts-css/commit/c5fd362)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate width, height, size, and min/max sizing values ([5670e7a](https://github.com/stacksjs/ts-css/commit/5670e7a)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate typography values and stop quoting bare words as content ([b2ef16c](https://github.com/stacksjs/ts-css/commit/b2ef16c)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate transform scale, rotate, skew, and translate values ([dfa7487](https://github.com/stacksjs/ts-css/commit/dfa7487)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate transition and animation time values ([fbd1e87](https://github.com/stacksjs/ts-css/commit/fbd1e87)) _(by Chris <chrisbreuer93@gmail.com>)_
- validate z-index, order, and opacity values instead of passing words through ([52a5c42](https://github.com/stacksjs/ts-css/commit/52a5c42)) _(by Chris <chrisbreuer93@gmail.com>)_

## ⚡ Performance Improvements

- actually minify preflight and keyframes in minified output ([f27abc5](https://github.com/stacksjs/ts-css/commit/f27abc5)) _(by Chris <chrisbreuer93@gmail.com>)_

## 📚 Documentation

- declare Tailwind v4 semantics as the compass ([c40c586](https://github.com/stacksjs/ts-css/commit/c40c586)) _(by Chris <chrisbreuer93@gmail.com>)_
- align README init snippet with the actual scaffold ([8123862](https://github.com/stacksjs/ts-css/commit/8123862)) _(by Chris <chrisbreuer93@gmail.com>)_

## 💅 Styles

- build the color fast-path overlay from a diff map ([c9bc43b](https://github.com/stacksjs/ts-css/commit/c9bc43b)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.10 ([8cbe056](https://github.com/stacksjs/ts-css/commit/8cbe056)) _(by Chris <chrisbreuer93@gmail.com>)_
- **pkg**: add sideEffects:false for bundler tree-shaking (publint) ([1bd41bc](https://github.com/stacksjs/ts-css/commit/1bd41bc)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.8...v0.2.9)

## 🐛 Bug Fixes

- resolve CLI --config from cwd and auto-discover project config ([f1a2b0a](https://github.com/stacksjs/ts-css/commit/f1a2b0a)) _(by Chris <chrisbreuer93@gmail.com>)_
- use printable delimiter in shortcut selector cache key ([2fa55ef](https://github.com/stacksjs/ts-css/commit/2fa55ef)) _(by Chris <chrisbreuer93@gmail.com>)_
- expand shortcut variants onto the shortcut's own selector ([e474ca3](https://github.com/stacksjs/ts-css/commit/e474ca3)) _(by Chris <chrisbreuer93@gmail.com>)_
- apply opacity modifiers to var()-based theme colors via color-mix ([8da8ace](https://github.com/stacksjs/ts-css/commit/8da8ace)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.9 ([345e14a](https://github.com/stacksjs/ts-css/commit/345e14a)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.7...v0.2.8)

## 🐛 Bug Fixes

- add repository metadata to crosswind-vscode for npm provenance ([1976b04](https://github.com/stacksjs/ts-css/commit/1976b04)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.8 ([65acc86](https://github.com/stacksjs/ts-css/commit/65acc86)) _(by Chris <chrisbreuer93@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.6...v0.2.7)

## 🐛 Bug Fixes

- restrict grid template and auto track values to counts, keywords, and arbitrary ([9258172](https://github.com/stacksjs/ts-css/commit/9258172)) _(by Chris <chrisbreuer93@gmail.com>)_
- restrict col/row span, start, and end values to numbers, auto, and arbitrary ([ee32313](https://github.com/stacksjs/ts-css/commit/ee32313)) _(by Chris <chrisbreuer93@gmail.com>)_
- stop bare row-/col-<word> classes emitting named grid lines ([09cad29](https://github.com/stacksjs/ts-css/commit/09cad29)) _(by Chris <chrisbreuer93@gmail.com>)_
- **preflight**: emit reset in an @layer so author styles win ([086871e](https://github.com/stacksjs/ts-css/commit/086871e)) _(by Chris <chrisbreuer93@gmail.com>)_

## ♻️ Code Refactoring

- rename Headwind/hw to Crosswind/cw ([fc6280c](https://github.com/stacksjs/ts-css/commit/fc6280c)) _(by Chris <chrisbreuer93@gmail.com>)_

## 🧹 Chores

- release v0.2.7 ([e9d38fe](https://github.com/stacksjs/ts-css/commit/e9d38fe)) _(by Chris <chrisbreuer93@gmail.com>)_
- upgrade to TypeScript 7 ([65d8e26](https://github.com/stacksjs/ts-css/commit/65d8e26)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: refresh bun.lock to pick up pickier 0.1.37 ([035ca9b](https://github.com/stacksjs/ts-css/commit/035ca9b)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **config**: move crosswind.config.ts to config/crosswind.ts ([5316196](https://github.com/stacksjs/ts-css/commit/5316196)) _(by glennmichael123 <gtorregosa@gmail.com>)_

## Contributors

- _Chris <chrisbreuer93@gmail.com>_
- _glennmichael123 <gtorregosa@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.4...v0.2.5)

### 🚀 Features

- load web fonts via a `fonts` config ([4d881d7](https://github.com/stacksjs/ts-css/commit/4d881d7)) _(by Chris <chrisbreuer93@gmail.com>)_

### 🐛 Bug Fixes

- **scripts**: stop double-generating CHANGELOG on release ([525a512](https://github.com/stacksjs/ts-css/commit/525a512)) _(by Glenn Michael Torregosa <gtorregosa@gmail.com>)_

### 🧹 Chores

- release v0.2.5 ([7fa5e3f](https://github.com/stacksjs/ts-css/commit/7fa5e3f)) _(by Chris <chrisbreuer93@gmail.com>)_
- wip ([47efff3](https://github.com/stacksjs/ts-css/commit/47efff3)) _(by Chris <chrisbreuer93@gmail.com>)_
- **deps**: bump better-dx to ^0.2.15 ([1affc1c](https://github.com/stacksjs/ts-css/commit/1affc1c)) _(by glennmichael123 <gtorregosa@gmail.com>)_
- **ci**: bump actions/checkout to v6, actions/cache to v5 ([acd6fc4](https://github.com/stacksjs/ts-css/commit/acd6fc4)) _(by glennmichael123 <gtorregosa@gmail.com>)_

### Contributors

- _Chris <chrisbreuer93@gmail.com>_
- _Glenn Michael Torregosa <gtorregosa@gmail.com>_
- _glennmichael123 <gtorregosa@gmail.com>_

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.3...v0.2.4)

### 🚀 Features

- **rules**: table display family, flow-root/list-item/contents, arbitrary accent/caret ([f31d55c](https://github.com/stacksjs/ts-css/commit/f31d55c))

### 🧹 Chores

- release v0.2.4 ([09382bd](https://github.com/stacksjs/ts-css/commit/09382bd))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.3...HEAD)

### 🚀 Features

- **rules**: table display family, flow-root/list-item/contents, arbitrary accent/caret ([f31d55c](https://github.com/stacksjs/ts-css/commit/f31d55c))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.2...v0.2.3)

### 🧹 Chores

- release v0.2.3 ([0af1adb](https://github.com/stacksjs/ts-css/commit/0af1adb))
- split and minify dist ([23aef98](https://github.com/stacksjs/ts-css/commit/23aef98))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.2...HEAD)

### 🧹 Chores

- split and minify dist ([23aef98](https://github.com/stacksjs/ts-css/commit/23aef98))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.1...v0.2.2)

### 🐛 Bug Fixes

- **build**: emit dist/index.js + dist/cli.js to match exports/bin paths ([1544b47](https://github.com/stacksjs/ts-css/commit/1544b47))

### 🧹 Chores

- release v0.2.2 ([a0ceda7](https://github.com/stacksjs/ts-css/commit/a0ceda7))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.1...HEAD)

### 🐛 Bug Fixes

- **build**: emit dist/index.js + dist/cli.js to match exports/bin paths ([1544b47](https://github.com/stacksjs/ts-css/commit/1544b47))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.0...v0.2.1)

### 🚀 Features

- add `css` alias ([bcc203d](https://github.com/stacksjs/ts-css/commit/bcc203d))
- **rules**: pure-CSS iconify rule for any @iconify-json/* collection ([d57a427](https://github.com/stacksjs/ts-css/commit/d57a427))

### 🐛 Bug Fixes

- add setup-bun to publish-commit job ([1a02e04](https://github.com/stacksjs/ts-css/commit/1a02e04))
- resolve typecheck errors ([e6caa08](https://github.com/stacksjs/ts-css/commit/e6caa08))

### 🤖 Continuous Integration

- drop redundant setup-bun (pantry installs bun via deps.yaml) ([b506af1](https://github.com/stacksjs/ts-css/commit/b506af1))

### 🧹 Chores

- release v0.2.1 ([fb65a3d](https://github.com/stacksjs/ts-css/commit/fb65a3d))
- remove headwind refs ([2290f5e](https://github.com/stacksjs/ts-css/commit/2290f5e))
- fresh install to pick up dtsx 0.9.14 and bunfig 0.15.9 ([074e1fa](https://github.com/stacksjs/ts-css/commit/074e1fa))
- fresh install to pick up pickier 0.1.21 ([c7d15c0](https://github.com/stacksjs/ts-css/commit/c7d15c0))
- cascade order improvements ([126617c](https://github.com/stacksjs/ts-css/commit/126617c))
- several minor improvements ([04caac1](https://github.com/stacksjs/ts-css/commit/04caac1))
- improve arbitrary values ([36d341d](https://github.com/stacksjs/ts-css/commit/36d341d))
- wip ([38d57fd](https://github.com/stacksjs/ts-css/commit/38d57fd))
- merge and resolve conflict ([1e00cce](https://github.com/stacksjs/ts-css/commit/1e00cce))
- fix lint errors ([12526b8](https://github.com/stacksjs/ts-css/commit/12526b8))
- minor improvements ([0a2924a](https://github.com/stacksjs/ts-css/commit/0a2924a))
- improve `group-has-*` and `peer-has-*` ([7de7dc3](https://github.com/stacksjs/ts-css/commit/7de7dc3))
- several minor improvements ([cc6ffe4](https://github.com/stacksjs/ts-css/commit/cc6ffe4))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.2.0...HEAD)

### 🚀 Features

- add `css` alias ([bcc203d](https://github.com/stacksjs/ts-css/commit/bcc203d))
- **rules**: pure-CSS iconify rule for any @iconify-json/* collection ([d57a427](https://github.com/stacksjs/ts-css/commit/d57a427))

### 🐛 Bug Fixes

- add setup-bun to publish-commit job ([1a02e04](https://github.com/stacksjs/ts-css/commit/1a02e04))
- resolve typecheck errors ([e6caa08](https://github.com/stacksjs/ts-css/commit/e6caa08))

### 🤖 Continuous Integration

- drop redundant setup-bun (pantry installs bun via deps.yaml) ([b506af1](https://github.com/stacksjs/ts-css/commit/b506af1))

### 🧹 Chores

- remove headwind refs ([2290f5e](https://github.com/stacksjs/ts-css/commit/2290f5e))
- fresh install to pick up dtsx 0.9.14 and bunfig 0.15.9 ([074e1fa](https://github.com/stacksjs/ts-css/commit/074e1fa))
- fresh install to pick up pickier 0.1.21 ([c7d15c0](https://github.com/stacksjs/ts-css/commit/c7d15c0))
- cascade order improvements ([126617c](https://github.com/stacksjs/ts-css/commit/126617c))
- several minor improvements ([04caac1](https://github.com/stacksjs/ts-css/commit/04caac1))
- improve arbitrary values ([36d341d](https://github.com/stacksjs/ts-css/commit/36d341d))
- wip ([38d57fd](https://github.com/stacksjs/ts-css/commit/38d57fd))
- merge and resolve conflict ([1e00cce](https://github.com/stacksjs/ts-css/commit/1e00cce))
- fix lint errors ([12526b8](https://github.com/stacksjs/ts-css/commit/12526b8))
- minor improvements ([0a2924a](https://github.com/stacksjs/ts-css/commit/0a2924a))
- improve `group-has-*` and `peer-has-*` ([7de7dc3](https://github.com/stacksjs/ts-css/commit/7de7dc3))
- several minor improvements ([cc6ffe4](https://github.com/stacksjs/ts-css/commit/cc6ffe4))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.6...v0.2.0)

### 🚀 Features

- improve arbitrary values ([9c6af1e](https://github.com/stacksjs/ts-css/commit/9c6af1e))
- handle arbitrary bracket opacity on named colors ([af6f0f3](https://github.com/stacksjs/ts-css/commit/af6f0f3))

### 🐛 Bug Fixes

- resolve typecheck errors ([8876156](https://github.com/stacksjs/ts-css/commit/8876156))
- resolve typecheck errors ([18bbc68](https://github.com/stacksjs/ts-css/commit/18bbc68))

### 🧹 Chores

- release v0.2.0 ([74a6cfa](https://github.com/stacksjs/ts-css/commit/74a6cfa))
- update lockfile ([a95e37f](https://github.com/stacksjs/ts-css/commit/a95e37f))
- release updates ([c3908da](https://github.com/stacksjs/ts-css/commit/c3908da))
- adjust test ([ce9472c](https://github.com/stacksjs/ts-css/commit/ce9472c))
- repo cleanup and modernization ([9f1d450](https://github.com/stacksjs/ts-css/commit/9f1d450))
- repo cleanup and modernization ([f5e5369](https://github.com/stacksjs/ts-css/commit/f5e5369))
- remove unocss ([4446ec1](https://github.com/stacksjs/ts-css/commit/4446ec1))
- remove @stacksjs/docs ([8ca150e](https://github.com/stacksjs/ts-css/commit/8ca150e))
- remove redundant docs/.vitepress ([9496179](https://github.com/stacksjs/ts-css/commit/9496179))
- use Pantry action for publish-commit and add job dependencies ([35b820a](https://github.com/stacksjs/ts-css/commit/35b820a))
- fix better-dx version to ^0.2.7 ([4afffd7](https://github.com/stacksjs/ts-css/commit/4afffd7))
- migrate to better-dx ([2489f19](https://github.com/stacksjs/ts-css/commit/2489f19))
- wip ([c636898](https://github.com/stacksjs/ts-css/commit/c636898))
- remove file ignores from pickier config ([2d048d6](https://github.com/stacksjs/ts-css/commit/2d048d6))
- add CLAUDE.md and CHANGELOG.md to pickier ignores ([4cfef69](https://github.com/stacksjs/ts-css/commit/4cfef69))
- fix lint warnings ([a5cba77](https://github.com/stacksjs/ts-css/commit/a5cba77))
- remove .pickierignore ([b7ba810](https://github.com/stacksjs/ts-css/commit/b7ba810))
- update better-dx to ^0.2.7 ([1f8781a](https://github.com/stacksjs/ts-css/commit/1f8781a))
- enrich CLAUDE.md with detailed project context from README ([2d63389](https://github.com/stacksjs/ts-css/commit/2d63389))
- update CLAUDE.md with project context and crosswind details ([b904cf8](https://github.com/stacksjs/ts-css/commit/b904cf8))
- add proper claude code guidelines ([5a9eda4](https://github.com/stacksjs/ts-css/commit/5a9eda4))
- use pantry monorepo action instead of pantry-setup ([521ecd4](https://github.com/stacksjs/ts-css/commit/521ecd4))
- ignore claude config in linter ([0661f46](https://github.com/stacksjs/ts-css/commit/0661f46))
- add claude code guidelines ([083b738](https://github.com/stacksjs/ts-css/commit/083b738))
- wip ([2c27184](https://github.com/stacksjs/ts-css/commit/2c27184))
- wip ([8737237](https://github.com/stacksjs/ts-css/commit/8737237))
- wip ([ac03495](https://github.com/stacksjs/ts-css/commit/ac03495))
- wip ([a9b683a](https://github.com/stacksjs/ts-css/commit/a9b683a))
- wip ([decfd0c](https://github.com/stacksjs/ts-css/commit/decfd0c))
- wip ([73a2c17](https://github.com/stacksjs/ts-css/commit/73a2c17))
- wip ([82f534d](https://github.com/stacksjs/ts-css/commit/82f534d))
- wip ([e02936f](https://github.com/stacksjs/ts-css/commit/e02936f))
- wip ([29df3e3](https://github.com/stacksjs/ts-css/commit/29df3e3))
- wip ([06de5a7](https://github.com/stacksjs/ts-css/commit/06de5a7))
- wip ([d62a10b](https://github.com/stacksjs/ts-css/commit/d62a10b))
- wip ([686497b](https://github.com/stacksjs/ts-css/commit/686497b))
- wip ([c8e4b32](https://github.com/stacksjs/ts-css/commit/c8e4b32))
- wip ([e8abd7b](https://github.com/stacksjs/ts-css/commit/e8abd7b))
- wip ([1734035](https://github.com/stacksjs/ts-css/commit/1734035))
- wip ([9f100ba](https://github.com/stacksjs/ts-css/commit/9f100ba))
- wip ([592599c](https://github.com/stacksjs/ts-css/commit/592599c))
- wip ([c3bea5d](https://github.com/stacksjs/ts-css/commit/c3bea5d))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.6...HEAD)

### 🚀 Features

- improve arbitrary values ([9c6af1e](https://github.com/stacksjs/ts-css/commit/9c6af1e))
- handle arbitrary bracket opacity on named colors ([af6f0f3](https://github.com/stacksjs/ts-css/commit/af6f0f3))

### 🐛 Bug Fixes

- resolve typecheck errors ([8876156](https://github.com/stacksjs/ts-css/commit/8876156))
- resolve typecheck errors ([18bbc68](https://github.com/stacksjs/ts-css/commit/18bbc68))

### 🧹 Chores

- update lockfile ([a95e37f](https://github.com/stacksjs/ts-css/commit/a95e37f))
- release updates ([c3908da](https://github.com/stacksjs/ts-css/commit/c3908da))
- adjust test ([ce9472c](https://github.com/stacksjs/ts-css/commit/ce9472c))
- repo cleanup and modernization ([9f1d450](https://github.com/stacksjs/ts-css/commit/9f1d450))
- repo cleanup and modernization ([f5e5369](https://github.com/stacksjs/ts-css/commit/f5e5369))
- remove unocss ([4446ec1](https://github.com/stacksjs/ts-css/commit/4446ec1))
- remove @stacksjs/docs ([8ca150e](https://github.com/stacksjs/ts-css/commit/8ca150e))
- remove redundant docs/.vitepress ([9496179](https://github.com/stacksjs/ts-css/commit/9496179))
- use Pantry action for publish-commit and add job dependencies ([35b820a](https://github.com/stacksjs/ts-css/commit/35b820a))
- fix better-dx version to ^0.2.7 ([4afffd7](https://github.com/stacksjs/ts-css/commit/4afffd7))
- migrate to better-dx ([2489f19](https://github.com/stacksjs/ts-css/commit/2489f19))
- wip ([c636898](https://github.com/stacksjs/ts-css/commit/c636898))
- remove file ignores from pickier config ([2d048d6](https://github.com/stacksjs/ts-css/commit/2d048d6))
- add CLAUDE.md and CHANGELOG.md to pickier ignores ([4cfef69](https://github.com/stacksjs/ts-css/commit/4cfef69))
- fix lint warnings ([a5cba77](https://github.com/stacksjs/ts-css/commit/a5cba77))
- remove .pickierignore ([b7ba810](https://github.com/stacksjs/ts-css/commit/b7ba810))
- update better-dx to ^0.2.7 ([1f8781a](https://github.com/stacksjs/ts-css/commit/1f8781a))
- enrich CLAUDE.md with detailed project context from README ([2d63389](https://github.com/stacksjs/ts-css/commit/2d63389))
- update CLAUDE.md with project context and crosswind details ([b904cf8](https://github.com/stacksjs/ts-css/commit/b904cf8))
- add proper claude code guidelines ([5a9eda4](https://github.com/stacksjs/ts-css/commit/5a9eda4))
- use pantry monorepo action instead of pantry-setup ([521ecd4](https://github.com/stacksjs/ts-css/commit/521ecd4))
- ignore claude config in linter ([0661f46](https://github.com/stacksjs/ts-css/commit/0661f46))
- add claude code guidelines ([083b738](https://github.com/stacksjs/ts-css/commit/083b738))
- wip ([2c27184](https://github.com/stacksjs/ts-css/commit/2c27184))
- wip ([8737237](https://github.com/stacksjs/ts-css/commit/8737237))
- wip ([ac03495](https://github.com/stacksjs/ts-css/commit/ac03495))
- wip ([a9b683a](https://github.com/stacksjs/ts-css/commit/a9b683a))
- wip ([decfd0c](https://github.com/stacksjs/ts-css/commit/decfd0c))
- wip ([73a2c17](https://github.com/stacksjs/ts-css/commit/73a2c17))
- wip ([82f534d](https://github.com/stacksjs/ts-css/commit/82f534d))
- wip ([e02936f](https://github.com/stacksjs/ts-css/commit/e02936f))
- wip ([29df3e3](https://github.com/stacksjs/ts-css/commit/29df3e3))
- wip ([06de5a7](https://github.com/stacksjs/ts-css/commit/06de5a7))
- wip ([d62a10b](https://github.com/stacksjs/ts-css/commit/d62a10b))
- wip ([686497b](https://github.com/stacksjs/ts-css/commit/686497b))
- wip ([c8e4b32](https://github.com/stacksjs/ts-css/commit/c8e4b32))
- wip ([e8abd7b](https://github.com/stacksjs/ts-css/commit/e8abd7b))
- wip ([1734035](https://github.com/stacksjs/ts-css/commit/1734035))
- wip ([9f100ba](https://github.com/stacksjs/ts-css/commit/9f100ba))
- wip ([592599c](https://github.com/stacksjs/ts-css/commit/592599c))
- wip ([c3bea5d](https://github.com/stacksjs/ts-css/commit/c3bea5d))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.4...v0.1.5)

### 🧹 Chores

- release v0.1.5 ([663f6dc](https://github.com/stacksjs/ts-css/commit/663f6dc))

### Contributors

- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.3...v0.1.4)

### 🧹 Chores

- release v0.1.4 ([3719b4c](https://github.com/stacksjs/ts-css/commit/3719b4c))
- wip ([311a34a](https://github.com/stacksjs/ts-css/commit/311a34a))
- wip ([a8f0eac](https://github.com/stacksjs/ts-css/commit/a8f0eac))
- wip ([666877a](https://github.com/stacksjs/ts-css/commit/666877a))
- wip ([cf2d716](https://github.com/stacksjs/ts-css/commit/cf2d716))
- wip ([9d4fc6f](https://github.com/stacksjs/ts-css/commit/9d4fc6f))
- wip ([6a58870](https://github.com/stacksjs/ts-css/commit/6a58870))
- wip ([7a891d8](https://github.com/stacksjs/ts-css/commit/7a891d8))
- wip ([b8d8d0d](https://github.com/stacksjs/ts-css/commit/b8d8d0d))
- wip ([a365623](https://github.com/stacksjs/ts-css/commit/a365623))
- wip ([a189f76](https://github.com/stacksjs/ts-css/commit/a189f76))
- wip ([266fdc5](https://github.com/stacksjs/ts-css/commit/266fdc5))
- release v0.1.4 ([d3c7763](https://github.com/stacksjs/ts-css/commit/d3c7763))
- wip ([5c3b3f2](https://github.com/stacksjs/ts-css/commit/5c3b3f2))
- wip ([ca1795c](https://github.com/stacksjs/ts-css/commit/ca1795c))
- wip ([bcb554e](https://github.com/stacksjs/ts-css/commit/bcb554e))
- wip ([0b35e2b](https://github.com/stacksjs/ts-css/commit/0b35e2b))
- wip ([6ad0cc4](https://github.com/stacksjs/ts-css/commit/6ad0cc4))
- wip ([5ca440d](https://github.com/stacksjs/ts-css/commit/5ca440d))
- wip ([155be12](https://github.com/stacksjs/ts-css/commit/155be12))
- wip ([1b1ff35](https://github.com/stacksjs/ts-css/commit/1b1ff35))
- wip ([fc69e98](https://github.com/stacksjs/ts-css/commit/fc69e98))
- release v0.1.4 ([27a66ba](https://github.com/stacksjs/ts-css/commit/27a66ba))
- wip ([a4c6d8a](https://github.com/stacksjs/ts-css/commit/a4c6d8a))
- wip ([e1e3f4f](https://github.com/stacksjs/ts-css/commit/e1e3f4f))
- wip ([352b160](https://github.com/stacksjs/ts-css/commit/352b160))
- wip ([46b97c2](https://github.com/stacksjs/ts-css/commit/46b97c2))
- wip ([e15e163](https://github.com/stacksjs/ts-css/commit/e15e163))
- wip ([b5c003b](https://github.com/stacksjs/ts-css/commit/b5c003b))
- wip ([0547ef5](https://github.com/stacksjs/ts-css/commit/0547ef5))
- wip ([56b34ea](https://github.com/stacksjs/ts-css/commit/56b34ea))
- wip ([23e3c54](https://github.com/stacksjs/ts-css/commit/23e3c54))
- wip ([69a9fbc](https://github.com/stacksjs/ts-css/commit/69a9fbc))
- wip ([c31cbbd](https://github.com/stacksjs/ts-css/commit/c31cbbd))
- wip ([66adcf1](https://github.com/stacksjs/ts-css/commit/66adcf1))
- wip ([385d534](https://github.com/stacksjs/ts-css/commit/385d534))

### 📄 Miscellaneous

- Update release.yml ([ded3699](https://github.com/stacksjs/ts-css/commit/ded3699))
- Merge pull request #14 from cwcss/feat/pantry-release ([1e8e98c](https://github.com/stacksjs/ts-css/commit/1e8e98c)) ([#14](https://github.com/stacksjs/ts-css/issues/14), [#14](https://github.com/stacksjs/ts-css/issues/14))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- Glenn Michael Torregosa <gtorregosa@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.3...HEAD)

### 🧹 Chores

- wip ([311a34a](https://github.com/stacksjs/ts-css/commit/311a34a))
- wip ([a8f0eac](https://github.com/stacksjs/ts-css/commit/a8f0eac))
- wip ([666877a](https://github.com/stacksjs/ts-css/commit/666877a))
- wip ([cf2d716](https://github.com/stacksjs/ts-css/commit/cf2d716))
- wip ([9d4fc6f](https://github.com/stacksjs/ts-css/commit/9d4fc6f))
- wip ([6a58870](https://github.com/stacksjs/ts-css/commit/6a58870))
- wip ([7a891d8](https://github.com/stacksjs/ts-css/commit/7a891d8))
- wip ([b8d8d0d](https://github.com/stacksjs/ts-css/commit/b8d8d0d))
- wip ([a365623](https://github.com/stacksjs/ts-css/commit/a365623))
- wip ([a189f76](https://github.com/stacksjs/ts-css/commit/a189f76))
- wip ([266fdc5](https://github.com/stacksjs/ts-css/commit/266fdc5))
- release v0.1.4 ([d3c7763](https://github.com/stacksjs/ts-css/commit/d3c7763))
- wip ([5c3b3f2](https://github.com/stacksjs/ts-css/commit/5c3b3f2))
- wip ([ca1795c](https://github.com/stacksjs/ts-css/commit/ca1795c))
- wip ([bcb554e](https://github.com/stacksjs/ts-css/commit/bcb554e))
- wip ([0b35e2b](https://github.com/stacksjs/ts-css/commit/0b35e2b))
- wip ([6ad0cc4](https://github.com/stacksjs/ts-css/commit/6ad0cc4))
- wip ([5ca440d](https://github.com/stacksjs/ts-css/commit/5ca440d))
- wip ([155be12](https://github.com/stacksjs/ts-css/commit/155be12))
- wip ([1b1ff35](https://github.com/stacksjs/ts-css/commit/1b1ff35))
- wip ([fc69e98](https://github.com/stacksjs/ts-css/commit/fc69e98))
- release v0.1.4 ([27a66ba](https://github.com/stacksjs/ts-css/commit/27a66ba))
- wip ([a4c6d8a](https://github.com/stacksjs/ts-css/commit/a4c6d8a))
- wip ([e1e3f4f](https://github.com/stacksjs/ts-css/commit/e1e3f4f))
- wip ([352b160](https://github.com/stacksjs/ts-css/commit/352b160))
- wip ([46b97c2](https://github.com/stacksjs/ts-css/commit/46b97c2))
- wip ([e15e163](https://github.com/stacksjs/ts-css/commit/e15e163))
- wip ([b5c003b](https://github.com/stacksjs/ts-css/commit/b5c003b))
- wip ([0547ef5](https://github.com/stacksjs/ts-css/commit/0547ef5))
- wip ([56b34ea](https://github.com/stacksjs/ts-css/commit/56b34ea))
- wip ([23e3c54](https://github.com/stacksjs/ts-css/commit/23e3c54))
- wip ([69a9fbc](https://github.com/stacksjs/ts-css/commit/69a9fbc))
- wip ([c31cbbd](https://github.com/stacksjs/ts-css/commit/c31cbbd))
- wip ([66adcf1](https://github.com/stacksjs/ts-css/commit/66adcf1))
- wip ([385d534](https://github.com/stacksjs/ts-css/commit/385d534))

### 📄 Miscellaneous

- Update release.yml ([ded3699](https://github.com/stacksjs/ts-css/commit/ded3699))
- Merge pull request #14 from cwcss/feat/pantry-release ([1e8e98c](https://github.com/stacksjs/ts-css/commit/1e8e98c)) ([#14](https://github.com/stacksjs/ts-css/issues/14), [#14](https://github.com/stacksjs/ts-css/issues/14))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- Glenn Michael Torregosa <gtorregosa@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.3...HEAD)

### 🧹 Chores

- wip ([a8f0eac](https://github.com/stacksjs/ts-css/commit/a8f0eac))
- wip ([666877a](https://github.com/stacksjs/ts-css/commit/666877a))
- wip ([cf2d716](https://github.com/stacksjs/ts-css/commit/cf2d716))
- wip ([9d4fc6f](https://github.com/stacksjs/ts-css/commit/9d4fc6f))
- wip ([6a58870](https://github.com/stacksjs/ts-css/commit/6a58870))
- wip ([7a891d8](https://github.com/stacksjs/ts-css/commit/7a891d8))
- wip ([b8d8d0d](https://github.com/stacksjs/ts-css/commit/b8d8d0d))
- wip ([a365623](https://github.com/stacksjs/ts-css/commit/a365623))
- wip ([a189f76](https://github.com/stacksjs/ts-css/commit/a189f76))
- wip ([266fdc5](https://github.com/stacksjs/ts-css/commit/266fdc5))
- release v0.1.4 ([d3c7763](https://github.com/stacksjs/ts-css/commit/d3c7763))
- wip ([5c3b3f2](https://github.com/stacksjs/ts-css/commit/5c3b3f2))
- wip ([ca1795c](https://github.com/stacksjs/ts-css/commit/ca1795c))
- wip ([bcb554e](https://github.com/stacksjs/ts-css/commit/bcb554e))
- wip ([0b35e2b](https://github.com/stacksjs/ts-css/commit/0b35e2b))
- wip ([6ad0cc4](https://github.com/stacksjs/ts-css/commit/6ad0cc4))
- wip ([5ca440d](https://github.com/stacksjs/ts-css/commit/5ca440d))
- wip ([155be12](https://github.com/stacksjs/ts-css/commit/155be12))
- wip ([1b1ff35](https://github.com/stacksjs/ts-css/commit/1b1ff35))
- wip ([fc69e98](https://github.com/stacksjs/ts-css/commit/fc69e98))
- release v0.1.4 ([27a66ba](https://github.com/stacksjs/ts-css/commit/27a66ba))
- wip ([a4c6d8a](https://github.com/stacksjs/ts-css/commit/a4c6d8a))
- wip ([e1e3f4f](https://github.com/stacksjs/ts-css/commit/e1e3f4f))
- wip ([352b160](https://github.com/stacksjs/ts-css/commit/352b160))
- wip ([46b97c2](https://github.com/stacksjs/ts-css/commit/46b97c2))
- wip ([e15e163](https://github.com/stacksjs/ts-css/commit/e15e163))
- wip ([b5c003b](https://github.com/stacksjs/ts-css/commit/b5c003b))
- wip ([0547ef5](https://github.com/stacksjs/ts-css/commit/0547ef5))
- wip ([56b34ea](https://github.com/stacksjs/ts-css/commit/56b34ea))
- wip ([23e3c54](https://github.com/stacksjs/ts-css/commit/23e3c54))
- wip ([69a9fbc](https://github.com/stacksjs/ts-css/commit/69a9fbc))
- wip ([c31cbbd](https://github.com/stacksjs/ts-css/commit/c31cbbd))
- wip ([66adcf1](https://github.com/stacksjs/ts-css/commit/66adcf1))
- wip ([385d534](https://github.com/stacksjs/ts-css/commit/385d534))

### 📄 Miscellaneous

- Update release.yml ([ded3699](https://github.com/stacksjs/ts-css/commit/ded3699))
- Merge pull request #14 from cwcss/feat/pantry-release ([1e8e98c](https://github.com/stacksjs/ts-css/commit/1e8e98c)) ([#14](https://github.com/stacksjs/ts-css/issues/14), [#14](https://github.com/stacksjs/ts-css/issues/14))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- Glenn Michael Torregosa <gtorregosa@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.3...v0.1.4)

### 🧹 Chores

- release v0.1.4 ([3810aff](https://github.com/stacksjs/ts-css/commit/3810aff))
- wip ([5c3b3f2](https://github.com/stacksjs/ts-css/commit/5c3b3f2))
- wip ([ca1795c](https://github.com/stacksjs/ts-css/commit/ca1795c))
- wip ([bcb554e](https://github.com/stacksjs/ts-css/commit/bcb554e))
- wip ([0b35e2b](https://github.com/stacksjs/ts-css/commit/0b35e2b))
- wip ([6ad0cc4](https://github.com/stacksjs/ts-css/commit/6ad0cc4))
- wip ([5ca440d](https://github.com/stacksjs/ts-css/commit/5ca440d))
- wip ([155be12](https://github.com/stacksjs/ts-css/commit/155be12))
- wip ([1b1ff35](https://github.com/stacksjs/ts-css/commit/1b1ff35))
- wip ([fc69e98](https://github.com/stacksjs/ts-css/commit/fc69e98))
- release v0.1.4 ([27a66ba](https://github.com/stacksjs/ts-css/commit/27a66ba))
- wip ([a4c6d8a](https://github.com/stacksjs/ts-css/commit/a4c6d8a))
- wip ([e1e3f4f](https://github.com/stacksjs/ts-css/commit/e1e3f4f))
- wip ([352b160](https://github.com/stacksjs/ts-css/commit/352b160))
- wip ([46b97c2](https://github.com/stacksjs/ts-css/commit/46b97c2))
- wip ([e15e163](https://github.com/stacksjs/ts-css/commit/e15e163))
- wip ([b5c003b](https://github.com/stacksjs/ts-css/commit/b5c003b))
- wip ([0547ef5](https://github.com/stacksjs/ts-css/commit/0547ef5))
- wip ([56b34ea](https://github.com/stacksjs/ts-css/commit/56b34ea))
- wip ([23e3c54](https://github.com/stacksjs/ts-css/commit/23e3c54))
- wip ([69a9fbc](https://github.com/stacksjs/ts-css/commit/69a9fbc))
- wip ([c31cbbd](https://github.com/stacksjs/ts-css/commit/c31cbbd))
- wip ([66adcf1](https://github.com/stacksjs/ts-css/commit/66adcf1))
- wip ([385d534](https://github.com/stacksjs/ts-css/commit/385d534))

### 📄 Miscellaneous

- Merge pull request #14 from cwcss/feat/pantry-release ([1e8e98c](https://github.com/stacksjs/ts-css/commit/1e8e98c)) ([#14](https://github.com/stacksjs/ts-css/issues/14), [#14](https://github.com/stacksjs/ts-css/issues/14))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- Glenn Michael Torregosa <gtorregosa@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.3...HEAD)

### 🧹 Chores

- wip ([5c3b3f2](https://github.com/stacksjs/ts-css/commit/5c3b3f2))
- wip ([ca1795c](https://github.com/stacksjs/ts-css/commit/ca1795c))
- wip ([bcb554e](https://github.com/stacksjs/ts-css/commit/bcb554e))
- wip ([0b35e2b](https://github.com/stacksjs/ts-css/commit/0b35e2b))
- wip ([6ad0cc4](https://github.com/stacksjs/ts-css/commit/6ad0cc4))
- wip ([5ca440d](https://github.com/stacksjs/ts-css/commit/5ca440d))
- wip ([155be12](https://github.com/stacksjs/ts-css/commit/155be12))
- wip ([1b1ff35](https://github.com/stacksjs/ts-css/commit/1b1ff35))
- wip ([fc69e98](https://github.com/stacksjs/ts-css/commit/fc69e98))
- release v0.1.4 ([27a66ba](https://github.com/stacksjs/ts-css/commit/27a66ba))
- wip ([a4c6d8a](https://github.com/stacksjs/ts-css/commit/a4c6d8a))
- wip ([e1e3f4f](https://github.com/stacksjs/ts-css/commit/e1e3f4f))
- wip ([352b160](https://github.com/stacksjs/ts-css/commit/352b160))
- wip ([46b97c2](https://github.com/stacksjs/ts-css/commit/46b97c2))
- wip ([e15e163](https://github.com/stacksjs/ts-css/commit/e15e163))
- wip ([b5c003b](https://github.com/stacksjs/ts-css/commit/b5c003b))
- wip ([0547ef5](https://github.com/stacksjs/ts-css/commit/0547ef5))
- wip ([56b34ea](https://github.com/stacksjs/ts-css/commit/56b34ea))
- wip ([23e3c54](https://github.com/stacksjs/ts-css/commit/23e3c54))
- wip ([69a9fbc](https://github.com/stacksjs/ts-css/commit/69a9fbc))
- wip ([c31cbbd](https://github.com/stacksjs/ts-css/commit/c31cbbd))
- wip ([66adcf1](https://github.com/stacksjs/ts-css/commit/66adcf1))
- wip ([385d534](https://github.com/stacksjs/ts-css/commit/385d534))

### 📄 Miscellaneous

- Merge pull request #14 from cwcss/feat/pantry-release ([1e8e98c](https://github.com/stacksjs/ts-css/commit/1e8e98c)) ([#14](https://github.com/stacksjs/ts-css/issues/14), [#14](https://github.com/stacksjs/ts-css/issues/14))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- Glenn Michael Torregosa <gtorregosa@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.3...v0.1.4)

### 🧹 Chores

- release v0.1.4 ([233963b](https://github.com/stacksjs/ts-css/commit/233963b))
- wip ([a4c6d8a](https://github.com/stacksjs/ts-css/commit/a4c6d8a))
- wip ([e1e3f4f](https://github.com/stacksjs/ts-css/commit/e1e3f4f))
- wip ([352b160](https://github.com/stacksjs/ts-css/commit/352b160))
- wip ([46b97c2](https://github.com/stacksjs/ts-css/commit/46b97c2))
- wip ([e15e163](https://github.com/stacksjs/ts-css/commit/e15e163))
- wip ([b5c003b](https://github.com/stacksjs/ts-css/commit/b5c003b))
- wip ([0547ef5](https://github.com/stacksjs/ts-css/commit/0547ef5))
- wip ([56b34ea](https://github.com/stacksjs/ts-css/commit/56b34ea))
- wip ([23e3c54](https://github.com/stacksjs/ts-css/commit/23e3c54))
- wip ([69a9fbc](https://github.com/stacksjs/ts-css/commit/69a9fbc))
- wip ([c31cbbd](https://github.com/stacksjs/ts-css/commit/c31cbbd))
- wip ([66adcf1](https://github.com/stacksjs/ts-css/commit/66adcf1))
- wip ([385d534](https://github.com/stacksjs/ts-css/commit/385d534))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.3...HEAD)

### 🧹 Chores

- wip ([a4c6d8a](https://github.com/stacksjs/ts-css/commit/a4c6d8a))
- wip ([e1e3f4f](https://github.com/stacksjs/ts-css/commit/e1e3f4f))
- wip ([352b160](https://github.com/stacksjs/ts-css/commit/352b160))
- wip ([46b97c2](https://github.com/stacksjs/ts-css/commit/46b97c2))
- wip ([e15e163](https://github.com/stacksjs/ts-css/commit/e15e163))
- wip ([b5c003b](https://github.com/stacksjs/ts-css/commit/b5c003b))
- wip ([0547ef5](https://github.com/stacksjs/ts-css/commit/0547ef5))
- wip ([56b34ea](https://github.com/stacksjs/ts-css/commit/56b34ea))
- wip ([23e3c54](https://github.com/stacksjs/ts-css/commit/23e3c54))
- wip ([69a9fbc](https://github.com/stacksjs/ts-css/commit/69a9fbc))
- wip ([c31cbbd](https://github.com/stacksjs/ts-css/commit/c31cbbd))
- wip ([66adcf1](https://github.com/stacksjs/ts-css/commit/66adcf1))
- wip ([385d534](https://github.com/stacksjs/ts-css/commit/385d534))

### Contributors

- Chris <chrisbreuer93@gmail.com>
- glennmichael123 <gtorregosa@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.2...v0.1.3)

### 🧹 Chores

- release v0.1.3 ([bf49808](https://github.com/stacksjs/ts-css/commit/bf49808))
- update `bun-git-hooks`([9e24c59](https://github.com/stacksjs/ts-css/commit/9e24c59))
- adjust expectation ([6d9ca20](https://github.com/stacksjs/ts-css/commit/6d9ca20))
- use`clapp`([355811b](https://github.com/stacksjs/ts-css/commit/355811b))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.2...HEAD)

### 🧹 Chores

- update`bun-git-hooks`([9e24c59](https://github.com/stacksjs/ts-css/commit/9e24c59))
- adjust expectation ([6d9ca20](https://github.com/stacksjs/ts-css/commit/6d9ca20))
- use`clapp`([355811b](https://github.com/stacksjs/ts-css/commit/355811b))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.1...v0.1.2)

### 🚀 Features

- add bun plugin ([63d0176](https://github.com/stacksjs/ts-css/commit/63d0176))

### 🧹 Chores

- release v0.1.2 ([26255be](https://github.com/stacksjs/ts-css/commit/26255be))
- lint ([1bf7619](https://github.com/stacksjs/ts-css/commit/1bf7619))
- minor updates ([c4367f9](https://github.com/stacksjs/ts-css/commit/c4367f9))
- rename to`hw`prefix ([92a4264](https://github.com/stacksjs/ts-css/commit/92a4264))
- add crosswind ([7f4b4e9](https://github.com/stacksjs/ts-css/commit/7f4b4e9))
- allow for multi-segment color names ([a07301a](https://github.com/stacksjs/ts-css/commit/a07301a))
- resolve typecheck ([78be83a](https://github.com/stacksjs/ts-css/commit/78be83a))
- add crosswind path ([afca37b](https://github.com/stacksjs/ts-css/commit/afca37b))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.1...HEAD)

### 🚀 Features

- add bun plugin ([63d0176](https://github.com/stacksjs/ts-css/commit/63d0176))

### 🧹 Chores

- lint ([1bf7619](https://github.com/stacksjs/ts-css/commit/1bf7619))
- minor updates ([c4367f9](https://github.com/stacksjs/ts-css/commit/c4367f9))
- rename to`hw` prefix ([92a4264](https://github.com/stacksjs/ts-css/commit/92a4264))
- add crosswind ([7f4b4e9](https://github.com/stacksjs/ts-css/commit/7f4b4e9))
- allow for multi-segment color names ([a07301a](https://github.com/stacksjs/ts-css/commit/a07301a))
- resolve typecheck ([78be83a](https://github.com/stacksjs/ts-css/commit/78be83a))
- add crosswind path ([afca37b](https://github.com/stacksjs/ts-css/commit/afca37b))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.0...v0.1.1)

### 🧹 Chores

- release v0.1.1 ([0bc1686](https://github.com/stacksjs/ts-css/commit/0bc1686))
- adjust permission ([9a9f5e1](https://github.com/stacksjs/ts-css/commit/9a9f5e1))
- wip ([85f06be](https://github.com/stacksjs/ts-css/commit/85f06be))

### Contributors

- Chris <chrisbreuer93@gmail.com>

[Compare changes](https://github.com/stacksjs/ts-css/compare/v0.1.0...HEAD)

### 🧹 Chores

- adjust permission ([9a9f5e1](https://github.com/stacksjs/ts-css/commit/9a9f5e1))
- wip ([85f06be](https://github.com/stacksjs/ts-css/commit/85f06be))

### Contributors

- Chris <chrisbreuer93@gmail.com>

### 🧹 Chores

- wip ([3e3542b](https://github.com/stacksjs/ts-css/commit/3e3542b))
- wip ([4369902](https://github.com/stacksjs/ts-css/commit/4369902))
- wip ([3bcb09c](https://github.com/stacksjs/ts-css/commit/3bcb09c))
- wip ([5386559](https://github.com/stacksjs/ts-css/commit/5386559))
- wip ([d3bd93a](https://github.com/stacksjs/ts-css/commit/d3bd93a))
- wip ([11ce8e7](https://github.com/stacksjs/ts-css/commit/11ce8e7))
- wip ([2c5faf0](https://github.com/stacksjs/ts-css/commit/2c5faf0))
- wip ([1db0349](https://github.com/stacksjs/ts-css/commit/1db0349))
- wip ([298a2e7](https://github.com/stacksjs/ts-css/commit/298a2e7))
- wip ([edfa7f4](https://github.com/stacksjs/ts-css/commit/edfa7f4))
- wip ([32f94f1](https://github.com/stacksjs/ts-css/commit/32f94f1))
- wip ([f3ca297](https://github.com/stacksjs/ts-css/commit/f3ca297))
- wip ([63f7efc](https://github.com/stacksjs/ts-css/commit/63f7efc))
- wip ([c948bc7](https://github.com/stacksjs/ts-css/commit/c948bc7))
- wip ([3f61664](https://github.com/stacksjs/ts-css/commit/3f61664))
- wip ([c4e1a63](https://github.com/stacksjs/ts-css/commit/c4e1a63))
- wip ([4a1d104](https://github.com/stacksjs/ts-css/commit/4a1d104))
- wip ([b9b7a7d](https://github.com/stacksjs/ts-css/commit/b9b7a7d))
- wip ([462be98](https://github.com/stacksjs/ts-css/commit/462be98))
- wip ([751b30f](https://github.com/stacksjs/ts-css/commit/751b30f))
- wip ([d768974](https://github.com/stacksjs/ts-css/commit/d768974))
- wip ([a759581](https://github.com/stacksjs/ts-css/commit/a759581))
- wip ([23c1356](https://github.com/stacksjs/ts-css/commit/23c1356))
- wip ([7cbee34](https://github.com/stacksjs/ts-css/commit/7cbee34))
- wip ([b71e60f](https://github.com/stacksjs/ts-css/commit/b71e60f))
- wip ([a036bd9](https://github.com/stacksjs/ts-css/commit/a036bd9))
- wip ([9453e16](https://github.com/stacksjs/ts-css/commit/9453e16))
- wip ([a75b2cd](https://github.com/stacksjs/ts-css/commit/a75b2cd))
- wip ([57b7141](https://github.com/stacksjs/ts-css/commit/57b7141))
- wip ([71a4c5f](https://github.com/stacksjs/ts-css/commit/71a4c5f))
- wip ([5581a78](https://github.com/stacksjs/ts-css/commit/5581a78))

### Contributors

- Chris <chrisbreuer93@gmail.com>
