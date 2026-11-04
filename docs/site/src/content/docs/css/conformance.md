---
title: CSS conformance
description: "EVGLite and EVGFull, the W3C WPT CSS layout results, and the known gaps."
---

EVG has two layout tiers. Both write the same display list, so a painter does not know which tier made it.

| Tier | Sources | Who uses it |
| --- | --- | --- |
| **EVGLite** | [`EVGLayout.rgr`](https://github.com/terotests/evg/blob/master/storm/EVGLayout.rgr), [`EVGGrid.rgr`](https://github.com/terotests/evg/blob/master/storm/EVGGrid.rgr), [`EVGUnit.rgr`](https://github.com/terotests/evg/blob/master/storm/EVGUnit.rgr) | Every native port (C++, Swift, Kotlin, Go, JavaScript). Native EVG documents |
| **EVGFull** | Lite + [`EVGLayoutFull.rgr`](https://github.com/terotests/evg/blob/master/storm/EVGLayoutFull.rgr) through the hooks of [`EVGLayoutExt.rgr`](https://github.com/terotests/evg/blob/master/storm/EVGLayoutExt.rgr) | A front end that lays out browser CSS, for example HTML pages and React dashboards through `web/dom` in MFilesAPI |

## EVGLite

Lite is the core layout. Flex, grid, flow, absolute, fixed, overlays, text, `calc()` of `px` and `%`, `min-content` / `max-content` / `fit-content`, `aspect-ratio`, auto margins and `box-sizing` are all in Lite.

A layout with nothing installed is a Lite layout. The native port contract (display-list kinds, text measurer, image decode, engine queue) is the same for both tiers. The CSS layer adds no painter work.

## EVGFull

A front end installs the CSS layer once, before its first layout:

```ranger
Import "pkg:evg/EVGLayoutFull.rgr"

EVGLayoutFull.install()
```

Every `EVGLayout` made after that consults it. The layer answers the hooks of `EVGLayoutExt` the CSS way:

- Containing blocks above the parent and the initial containing block (`cb`, `cb-outer`, `icb`)
- Static positions of absolute boxes in flex containers, blocks and grid areas (`static-flex`, `static-flow`)
- Line rows of inline content (`height-through`, `line-join`, `baseline-from-bottom`, `baseline-from-top`)
- First, last and synthesized baselines of flex and grid items and containers
- Wrapping flex columns and the intrinsic sizes of their lines
- Grid line rules beyond simple lines: negative lines, `N name`, `span N name`, unknown names, area edges, leading implicit tracks
- Spanning grid items: the base size and growth limit algorithm (CSS Grid 12.5.3)
- `grid-auto-flow: column` and the implicit columns placement makes
- Floats and clearance (CSS 2.1 9.5.1): `float-row`, `float-side`, `clear-floats`, `beside-floats`
- `position: sticky` against the nearest scroll container (`sticky-top`, `sticky-left`)
- Size containment of the width (`contain-w`)

The words in brackets are attributes on the element. They are not CSS properties. The front end translates CSS into them. They live in one lazily made object, [`EVGCssExtra`](https://github.com/terotests/evg/blob/master/storm/EVGCssExtra.rgr), so an element of a Lite layout carries one empty pointer for all of them.

**Write native EVG documents for Lite.** In a document that has no browser CSS to match, `position: sticky` is `relative`, and there is no `float` property.

## Cost

[`storm/EvgPerfGate.rgr`](https://github.com/terotests/evg/blob/master/storm/EvgPerfGate.rgr) lays out and lists four pages of 10 000 elements (flex, grid, text, dashboard). It also lays out the grid and the dashboard with EVGFull installed. `npm run storm:perf` compiles base and head to C++ and compares the callgrind instruction count of each fixture. A fixture more than 5 % over the base fails the **Storm perf gate** CI job, and `test-gate` needs that job.

## WPT results

The measure is the [W3C web-platform-tests](https://github.com/web-platform-tests/wpt) CSS layout tests that use `check-layout-th.js`. Each test states the box every element must get. The runner is `desktop/tests/css-layout.mjs --wpt` in MFilesAPI. It lays the page out through `web/dom`, MfdDomView and EVGFull, and compares each box with the expected one.

Result on 2026-10-26 (evg `491c1a0`, WPT `fc50dee`):

| Suite | Pass | Tests | % |
| --- | ---: | ---: | ---: |
| `css/css-grid` | 475 | 564 | 84 |
| `css/css-flexbox` | 174 | 223 | 78 |
| `css/css-sizing` | 60 | 92 | 65 |
| `css/CSS2` | 15 | 18 | 83 |
| `css/css-position` | 3 | 4 | 75 |
| **All** | **727** | **901** | **81** |

The list of passing tests is `desktop/tests/css/wpt-css.txt` in MFilesAPI. A test in that list that fails, fails the test run.

## Known gaps

The 174 tests that fail fall into these groups.

| Group | Tests | What is missing |
| --- | ---: | --- |
| Baseline alignment | ~65 | `align-items: baseline` / `align-self: baseline` where the item is a table, fieldset, multicol box, line-clamped box, scroll container, or a nested flex or grid with its own baseline rules. Grid baselines with cyclic sizing |
| Writing modes | ~15 | `writing-mode: vertical-lr` / `vertical-rl` and orthogonal flows. EVG lays out horizontally only |
| Grid details | ~25 | Percentage tracks and gutters of an indefinite grid, absolute boxes in implicit tracks, scroll bars in intrinsic sizes, a second pass of content alignment, add and remove of items |
| Flex details | ~25 | Some `flex-basis` intrinsics, negative overflow of scroll containers, `overflow: auto` sizes, some wrapped `align-content` cases |
| `subgrid` | 17 | Row and column `subgrid` take the parent's tracks. Line names, gaps and margins of subgridded items do not carry over |
| `stretch` keyword sizes | 14 | `width: stretch` / `height: stretch` and the block-size rules in css-sizing/stretch |
| `contain-intrinsic-size` | 9 | Not implemented |
| Tables as items | 7 | No table layout. A table is a block |
| Keyword sizes in intrinsic contributions | 5 | `min-content` / `max-content` / `fit-content` on absolute boxes, floats and replaced elements |
| Floats | 2 | Text lines do not wrap around floats. A block formatting context moves beside floats only when it comes right after them |

The groups overlap a little. A test can be in two of them.

Other limits, outside the WPT suites above:

- `flex-direction: row-reverse` and `column-reverse` parse and warn. The core does not lay them out.
- `ch`, `ex`, `vmin`, `vmax` are not units. `calc()` takes only `px` and `%` terms with `+` and `-`.
- No `z-index`. Paint order is tree order. Overlay surfaces paint last.
- No `order` property.
- `place-items`, `place-self` and `place-content` are not shorthands here. Set the longhands.

## Recent fixes

| Change | Effect |
| --- | --- |
| [evg#74](https://github.com/terotests/evg/pull/74) | A column with `justify-content: center` and an auto height centres its content in the content height. Before, it centred against an inner height of 0 and button labels moved up by half their height |
| [evg#76](https://github.com/terotests/evg/pull/76) | Flexed column items resolve their children's percentage heights. Column items grow into `min-height`. Size containment of the width. Floats that clear go under the earlier floats of their side |
| [evg#77](https://github.com/terotests/evg/pull/77) | SVG `<pattern>` fills. See [Properties](/evg/css/properties/#svg-paint) |
