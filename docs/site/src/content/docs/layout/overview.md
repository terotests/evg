---
title: Layouts
description: "The layout modes EVG implements: flow, flex, grid, absolute, fixed, and overlay surfaces."
---

[`EVGLayout`](https://github.com/terotests/evg/blob/master/storm/EVGLayout.rgr) resolves units, measures text, and gives every element a rectangle (`calculatedX`, `calculatedY`, `calculatedWidth`, `calculatedHeight`).

## The modes

| Mode | How you ask for it | What it does |
| --- | --- | --- |
| **Flow** | Default (`display` is not `flex` or `grid`) | A column of boxes, CSS block layout |
| **Flex** | `display: flex` | One axis, wrap, grow, shrink, gaps. See [Flex](/evg/layout/flex/) |
| **Grid** | `display: grid` | Tracks, areas, spans, row `subgrid`. See [Grid](/evg/layout/grid/) |
| **Absolute** | `position: absolute` (or `left`/`top`/`right`/`bottom` on the XML path) | Out of flow, against the nearest positioned ancestor |
| **Fixed** | `position: fixed` | Out of flow, against the **viewport**. A scroll does not move it |
| **Overlay / popover** | `overlay: true`, `popover` tag, or `position-anchor` | Out of flow **and** out of the clip stack. Drawn after the whole tree |

## Box model

`padding` and `border` sit inside the declared width, as in CSS `box-sizing: border-box`. `EVGBox` holds the resolved pixels after `resolveUnits`.

The root with no stated size becomes the page: `pageWidth` × `pageHeight`. That is right for paper. A window host that wants the document's own height measures the children's lowest edge.

## Absolute and fixed

`left` and `right` both set, with no `width`, stretches the box between them (CSS 2.1 §10.3.7). The same rule applies to `top` / `bottom` and `height`. It applies to `absolute` and to `fixed`.

`position: fixed` differs from `absolute` in two ways:

1. Insets and percentages resolve against the **page**, not the parent.
2. A scroll does not move the box. Content slides under the furniture.

One limit: a fixed box inside a container that clips still clips against that container. In CSS a fixed box escapes an ancestor's `overflow`. Here the clip stack is built from the tree, so it does not. Put the bar beside the scroller rather than inside it.

## Overlay surfaces

A surface takes **no space** in its parent. It is drawn **after the whole normal tree, outside every clip**. An ancestor's `overflow: hidden` cannot cut it. No `z-index` is involved.

It still lives where it belongs in the tree. A menu declared inside its button is a child of that button for events, state and the accessibility tree. It is only *drawn* somewhere else.

```json
{
  "tag": "div",
  "props": { "anchor-name": "--file" },
  "text": "File"
}
```

```json
{
  "tag": "popover",
  "props": {
    "position-anchor": "--file",
    "position-area": "bottom start",
    "position-try-fallbacks": "top start, right start",
    "fit-viewport": "true",
    "sheet-below": "600px"
  }
}
```

`presentation: sheet` drops the anchor: the surface becomes as wide as the page, pinned to the bottom. `fullscreen` takes the page. `sheet-below: 600px` is the usual phone fold.

Placement uses CSS Anchor Positioning vocabulary: `anchor-name`, `position-anchor`, `position-area`, `position-try-fallbacks`, `anchor()` in insets.

## Connectors

A `connector` is a line between two `anchor-name`s. The layout writes `d`. `from-side: auto` picks the side from where the boxes ended up, so a reflow from a row to a column moves the line with them.

## RTL

`direction: rtl` on the root turns the whole tree around. Flex rows, grid auto-placement, and overlay `start` / `end` follow it.

## Warnings

Layout warnings are collected, not printed: `warningCount()` / `warningAt(i)`. A declaration the engine cannot use is one of them (`calc()`, `repeat(auto-fit, …)`, a reversed flex direction). `EVGReject` de-duplicates, so one bad rule on 20 000 elements is one warning.
