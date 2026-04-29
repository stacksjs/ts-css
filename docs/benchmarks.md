# Benchmarks

Numbers below are from a representative `~6 KB` CSS fixture
(reset + utilities + component CSS), measured with
[`mitata`](https://github.com/evanwashere/mitata) on Bun.

## Run them yourself

```bash
bun run bench
```

The bench script lives at `bench/index.bench.ts` and benchmarks every
public API against the closest community equivalent:

| ts-css module | compared with |
|---|---|
| `parse`     | `css-tree.parse`    |
| `walk`      | `css-tree.walk`     |
| `generate`  | `css-tree.generate` |
| `what.parse`| `css-what.parse`    |
| `selectAll` | `css-select.selectAll` |
| `minify`    | `csso.minify`       |
| **end-to-end**: `minify(source)` | `csso.minify(source)` |

## Latest numbers (Apple M3 Pro, Bun 1.3)

```
Fixture: ~6 KB stylesheet

parse stylesheet
  ts-css        83 µs/iter         (ts-css 1.10× faster)
  css-tree      92 µs/iter

generate stylesheet
  ts-css        19 µs/iter         (ts-css 4.0× faster)
  css-tree      77 µs/iter

walk all nodes
  ts-css        32 µs/iter         (ts-css 1.34× faster)
  css-tree      43 µs/iter

parse 7 selectors
  ts-css       1.6 µs/iter         (ts-css 1.65× faster)
  css-what     2.7 µs/iter

selectAll on a 250-node tree
  ts-css        40 µs/iter         (ts-css 1.13× faster)
  css-select    45 µs/iter

minify stylesheet
  ts-css       277 µs/iter         (ts-css 3.3× faster)
  csso         907 µs/iter

end-to-end (parse → minify → generate)
  ts-css       271 µs/iter         (ts-css 3.28× faster)
  csso         890 µs/iter
```

## Why we win on `generate` and `minify`

- **`generate`** is a tight switch over the AST that walks the doubly
  linked list directly — no allocations beyond string concatenation, no
  array materialization to support lookahead, no formatter options.
- **`minify`** does a single AST walk that combines value compression and
  whitespace compaction (no second tree traversal), short-circuits
  declaration dedup on blocks with fewer than two declarations, and uses
  manual scans where css-select / csso fall back to per-call regex.

## Why we win on `parse` and `selectAll`

- **`parse`** — declaration values and at-rule preludes are parsed
  directly off the existing token stream by temporarily lowering an
  in-state `end` index. Re-tokenizing each declaration value text (the
  obvious approach) is what makes other parsers slower; we never do it.
- **`selectAll`** — we ship our own iterative `findAll` so the consumer
  adapter's `findAll` (often a recursive `[].push(...spread)` shape that
  allocates per node) doesn't gate selector matching. The compile chain
  uses fail-fast leaves (`ALWAYS_TRUE` short-circuits `&& next(e)` calls)
  and procedure-cost sorting so the cheapest test in a compound runs
  first. Compile results are cached two-level (adapter + flags →
  selector) so per-call key allocation is gone.
- **`what.parse`** — sticky regex (`/.../y`) lets us match identifier
  tokens without slicing. `charCodeAt` dispatch instead of `charAt`
  string allocation.

## End-to-end is what matters

For build-tool pipelines that run parse → walk → mutate → generate, the
combined pipeline completes in **roughly a third of the time** of the
csso default — and ships **zero runtime dependencies**.
