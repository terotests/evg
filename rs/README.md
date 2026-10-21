# EVG core in Rust

Storm's base types (`storm/EVGUnit`, `EVGColor`, `EVGCodepoint`,
`EVGGrapheme`, `EVGEasing`) written in the strict Rust subset that the
Ranger compiler reads. The same source builds with cargo and with `rgrc`
for JavaScript, Go and C++.

| module | from | contents |
| --- | --- | --- |
| `num` | | CSS number prefix (parseFloat-like), `fmt6` number text |
| `unit` | EVGUnit | px, %, em, rem, hp, vw / vh, fill, pt / pc / in / mm / cm; resolve |
| `color` | EVGColor | hex, rgb(a), hsl(a), names; CSS / hex / PDF text, lighten, darken |
| `codepoint` | EVGCodepoint | break and space classes, code point lists |
| `grapheme` | EVGGrapheme | cluster ends, boundaries, count, cluster at an index |
| `easing` | EVGEasing | named easings, cubic-bezier(), steps(); evaluation |

Differences from Storm:

- `Unit` and `Color` are plain values. Storm shares one unset unit and
  one no-colour object and forbids writing to them; here each field owns
  its copy.
- Strings are UTF-8 and handled as code point lists, so Storm's UTF-16 /
  byte helpers (`codeAt`, `unitsAt`, `encodeUtf8`) have no counterpart.
  `grapheme::cluster_at` takes a code point index.
- A number that does not parse inside `rgb()` / `hsl()` is 0 (Storm gives
  NaN on JavaScript).
- Text output writes numbers with `num::fmt6` (six decimals, no exponent),
  the same on every target.

## Parity

```sh
RANGER_ROOT=../Ranger npm run rs:parity
```

`rs/parity` prints parse and resolve results for a fixed list of inputs.
cargo, rgrc es6 / go / cpp of the same `main.rs`, and
`rs/parity/StormParity.rgr` (built from `storm/` itself) must print
identical lines.
