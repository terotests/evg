# EVG 3.0 Storm

Storm is the Ranger-native layout engine that used to live in
`Ranger/lib/evg`. This repository is now its home: the same sources are a
**Ranger 3.x package** (`Import "pkg:evg/EVGElement.rgr"`) and a
**TypeScript NPM module** (`import { EVG, Storm } from "evg"`).

```
   XML / JSON          Thunderstruck 2.x              PDF, Canvas, CLI
   (old markup)   ──►  src/  (parser, box model)  ──►  evg hello.xml out.pdf

   Storm JSON          Ranger engine                  display list
   .evg.json      ──►  storm/  (flex, grid, CSS)  ──►  PDF / GL / SVG / …
                       image/  zip/   (codecs)
```

The Thunderstruck `EVG` class is unchanged: `new EVG(xml)`,
`EVG.renderToFile`, `installFont`, `installComponent` still work. Storm
documents (`{"evg":1,"root":…}`) are accepted by that constructor too —
they are lowered to XML and rendered through the existing PDF path.

## Ranger 3.x

A Ranger application depends on this git repository, not on
`Ranger/lib/evg`:

```json
{
  "dependencies": {
    "evg": {
      "git": "https://github.com/terotests/evg.git",
      "rev": "<commit>",
      "subdir": "storm"
    }
  }
}
```

During development against a sibling checkout:

```json
{
  "dependencies": {
    "evg": { "path": "../evg/storm" }
  }
}
```

```ranger
Import "pkg:evg/EVGElement.rgr"
Import "pkg:evg/EVGLayout.rgr"
Import "pkg:evg/EVGStyleSheet.rgr"
Import "pkg:evg/EVGDisplayList.rgr"
```

`storm/ranger.json` names the `image` package (JPEG / PNG codecs) as a
sibling path dependency; `image` in turn names `zip` (DEFLATE). A Git
fetch of `subdir: "storm"` brings both along at the same commit.

The engine README — pipeline, CSS subset, hosts — is
[`storm/README.md`](storm/README.md).

Gallery programs (PDF writer, Rave, the window layer) stay in Ranger.
They import EVG as a package; they are not part of this tree.

## TypeScript NPM

```javascript
import { EVG, Storm } from "evg";

EVG.installFont("candal", "./fonts/Candal/Candal.ttf");
const node = new EVG(`<View><Label text="Hello"/></View>`);
await EVG.renderToFile("./out.pdf", 600, 800, node);

const storm = Storm.parse(`<div width="400px"><span text="Storm"/></div>`);
console.log(Storm.toJson(storm, true));
await Storm.renderToFile("./storm.pdf", 400, 200, storm);
```

`evg examples/storm-hello.evg.json out.pdf` uses the same CLI as
`evg hello.xml hello.pdf`.

## Layout of this repository

| Path | What |
| --- | --- |
| `src/` | Thunderstruck 2.x TypeScript: XML parser, layout, PDF / Canvas |
| `src/storm/` | Storm JSON types and the XML ↔ v2 bridge |
| `storm/` | EVG 3.0 Ranger sources (`ranger.json` name `"evg"`) |
| `image/` | JPEG / PNG codecs (`pkg:image`) |
| `zip/` | DEFLATE (`pkg:zip`) |
| `examples/` | XML and Storm JSON samples |
| `dist/` | published NPM bundle |

Ranger's gallery still path-depends on its vendor copy of this tree
(`lib/evg`) until Storm is on this repository's `master`. After that,
gallery `ranger.json` files can name this package as a git dependency
(`subdir: "storm"`) and `rgrc install` fetches it — no extra checkout
script.

Engine unit tests run here (`npm run storm:test`) and must pass before
merge to `master`: CI checks out Ranger, compiles the `.rgr` suites, and
`test-gate` stays red if they fail or if the compiler is missing.
Testdrive is the first Ranger app that imports Storm as `pkg:evg` from a
sibling checkout.

New engine work lands in this repository, not in Ranger.
