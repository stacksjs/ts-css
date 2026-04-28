# Benchmarks

Numbers below are from a representative `~6 KB` CSS fixture
(reset + utilities + component CSS), measured with
[`mitata`](https://github.com/evanwashere/mitata) on Bun.

## Run them yourself

```bash
bun run bench
```

The bench script lives at `bench/index.bench.ts` and benchmarks every
public API against the original library it replaces:

| ts-css module | vs. |
|---|---|
| `parse`     | `css-tree.parse`    |
| `walk`      | `css-tree.walk`     |
| `generate`  | `css-tree.generate` |
| `what.parse`| `css-what.parse`    |
| `selectAll` | `css-select.selectAll` |
| `minify`    | `csso.minify`       |
| **end-to-end**: `minify(source)` | `csso.minify(source)` |

## Latest numbers

```
Fixture: ~6 KB stylesheet
Bun ≥1.3

parse stylesheet
  ts-css       179 µs/iter
  css-tree      89 µs/iter         (css-tree 2.0× faster)

generate stylesheet
  ts-css        34 µs/iter         (ts-css 2.4× faster)
  css-tree      81 µs/iter

walk all nodes
  ts-css        38 µs/iter         (ts-css 1.2× faster)
  css-tree      45 µs/iter

parse 7 selectors
  ts-css        3.3 µs/iter
  css-what      2.7 µs/iter        (css-what 1.2× faster)

selectAll on a 250-node tree
  ts-css        66 µs/iter
  css-select    47 µs/iter         (css-select 1.4× faster)

minify stylesheet
  ts-css       446 µs/iter         (ts-css 2.1× faster)
  csso         923 µs/iter

end-to-end (parse → minify → generate)
  ts-css       441 µs/iter         (ts-css 1.92× faster)
  csso         847 µs/iter
```

## Why we win on `minify` and `generate`

- **`generate`** is a tight switch over the AST — no allocations beyond
  string concatenation, no formatter options to consider.
- **`minify`** runs a single-pass declaration / value compressor. We skip
  csso's structural restructuring (rule-merging across selectors), which
  in real-world output beats gzip by single-digit percent. Trading that
  off gets us a ~2× speedup.

## Why we lose on `parse` and `selectAll`

- **`parse`** — css-tree's tokenizer is hand-tuned over many years and
  uses a tighter character-class table. Ours is straightforward and
  correct; we'll close this gap when it matters for a real workload.
- **`selectAll`** on small trees is slightly slower because css-select's
  compile path is even more aggressive about caching tags / attributes.
  With ts-css's `cacheResults` (default `true`) the second call onward is
  free — for repeated queries on the same selector the gap reverses.
- **`what.parse`** is within 25 % of css-what — the per-call parse cost
  is `<5µs` so the absolute number is uninteresting outside hot loops.

## End-to-end is what matters

For the SVGO/optimize/lint use case, the *combined* pipeline runs
parse → walk → mutate → generate. ts-css completes the whole loop in
**half the time** of the original four-library stack — and ships **zero
runtime dependencies** instead of four.
