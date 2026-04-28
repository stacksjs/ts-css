---
layout: home

hero:
  name: "@stacksjs/ts-css"
  text: "Pure-TypeScript CSS toolkit."
  tagline: "Parser, walker, generator, selector engine, minifier — zero runtime deps."
  actions:
    - theme: brand
      text: Get started
      link: /intro
    - theme: alt
      text: Migration guide
      link: /migration
    - theme: alt
      text: View on GitHub
      link: https://github.com/stacksjs/ts-css

features:
  - title: "All-in-one CSS pipeline"
    icon: "🧩"
    details: "Replaces css-tree + css-select + css-what + csso. One install, no transitive deps."
  - title: "Drop-in compatible"
    icon: "🔁"
    details: "Namespace re-exports keep existing call sites unchanged. Migrate by editing imports."
  - title: "Selector engine"
    icon: "🎯"
    details: "Run any CSS selector against any tree. Adapter pattern preserved verbatim."
  - title: "Minifier"
    icon: "📦"
    details: "Number / color / unit compression, declaration dedup, comment cleanup, specificity calc."
  - title: "Bun-first"
    icon: "🥟"
    details: "Built on Bun, runs on Node ≥18. Strict TypeScript with isolatedDeclarations."
  - title: "Small surface, full coverage"
    icon: "✂️"
    details: "Pragmatic — every API real consumers (CSSO, SVGO, lint tools) actually use."
---
