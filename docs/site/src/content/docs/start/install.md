---
title: Install
description: How to install EVG as an NPM package and how to import it as a Ranger package.
---

EVG is two packages in one repository.

## TypeScript (NPM)

Node.js 20 or a later version is required.

```sh
npm install evg
```

The CLI writes a PDF from XML or from Storm JSON:

```sh
npx evg hello.xml hello.pdf
npx evg examples/storm-hello.evg.json storm.pdf
```

A program uses the Thunderstruck API:

```javascript
import { EVG, Storm } from "evg";

const node = new EVG(`<View>
  <span font-size="24" text="Hello"/>
</View>`);
EVG.renderToFile("./out.pdf", 400, 200, node);
```

`new EVG(xml)` parses the original markup. `new EVG(stormJson)` accepts a Storm document (`{"evg":1,"root":…}`) and renders it through the same PDF path.

## Ranger 3.x

A Ranger application depends on this git repository. The package root is the `storm/` directory:

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

Then:

```ranger
Import "pkg:evg/EVGElement.rgr"
Import "pkg:evg/EVGStyleSheet.rgr"
Import "pkg:evg/EVGLayout.rgr"
Import "pkg:evg/EVGDisplayList.rgr"
```

Run `rgrc install` so the compiler fetches the git dependency. A path dependency needs no fetch.

The `image` and `zip` packages sit next to `storm/` and come along as path dependencies of that package.

## Engine tests

```sh
npm test
npm run storm:test
```

`storm:test` compiles the Ranger suites when a Ranger 3.x checkout is on `RANGER_ROOT`. GitHub Actions always runs those suites. See [CI](https://github.com/terotests/evg/blob/master/.github/CI.md).
