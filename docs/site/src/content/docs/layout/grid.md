---
title: Grid
description: "EVG's CSS grid subset: tracks, repeat, minmax, named areas, and row subgrid."
---

`display: grid` places children on a track list.

```css
.page {
  display: grid;
  grid-template-columns: 200px 1fr 40%;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
}

.page {
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: minmax(40px, 1fr);
}

.layout {
  display: grid;
  grid-template-areas:
    "nav nav"
    "side main"
    "foot foot";
}
.side { grid-area: side; }
.main { grid-area: main; }
```

## Track lists

| Token | Meaning |
| --- | --- |
| `120px` `40%` `2em` | Fixed or percentage tracks |
| `1fr` | A share of leftover space |
| `auto` | Fit the content |
| `repeat(3, 1fr)` | Repeat a pattern a **fixed** number of times |
| `minmax(40px, 1fr)` | Lower and upper bound on a track |
| `subgrid` | On **rows**: take the parent's row tracks |

`repeat(auto-fit, …)` and `repeat(auto-fill, …)` are not implemented. They warn through `EVGReject`.

## Placement

| Property | Meaning |
| --- | --- |
| `grid-column` `grid-row` | Line numbers and spans (`1 / 3`, `span 2`) |
| `grid-area` | A name from `grid-template-areas`, or a four-edge shorthand |
| `grid-auto-flow` | `row` (default) or `column` |

A repeated name in `grid-template-areas` is one rectangle. Holes in the picture are empty cells.

## Subgrid

`grid-template-rows: subgrid` on a nested grid takes the parent's row tracks. Column `subgrid` is not the supported path; prefer explicit column tracks on the child.

## Gaps

`gap`, `row-gap` and `column-gap` work as in flex. The longhands override the shorthand per axis.

## Auto placement

Items without an explicit area fill empty cells in `grid-auto-flow` order. Spanned items occupy every cell in their rectangle. The engine does not pack around holes the way the CSS spec's dense packing does unless you set that flow; `dense` is not a value here.
