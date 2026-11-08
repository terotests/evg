---
title: Grid
description: "EVG's CSS grid: tracks, repeat, auto-fill, minmax, named lines and areas, placement, alignment, and subgrid."
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
| `min-content` `max-content` | The narrowest or widest content of the items in the track |
| `fit-content(200px)` | `auto`, clamped to the limit, never under `min-content` |
| `repeat(3, 1fr)` | Repeat a pattern a fixed number of times |
| `repeat(auto-fill, minmax(100px, 1fr))` | As many repetitions as fit |
| `repeat(auto-fit, …)` | As `auto-fill`. Repetitions that no item is in collapse to 0 |
| `minmax(40px, 1fr)` | Lower and upper bound on a track. The min can be `auto`, `min-content` or `max-content` |
| `[main-start] 1fr [main-end]` | Named lines |
| `subgrid` | Take the parent's tracks |

Track sizing follows CSS Grid 11: intrinsic tracks start at `min-content` and grow to their limit while there is room. `fr` tracks share what is left, are floored at their items' `min-content`, and factors under 1 take less than the whole. Spanning items use the base size and growth limit algorithm in EVGFull.

## Placement

| Property | Meaning |
| --- | --- |
| `grid-column` `grid-row` | Line numbers, names and spans (`1 / 3`, `span 2`, `main / main-end`) |
| `grid-area` | A name from `grid-template-areas`, or a four-edge shorthand |
| `grid-auto-flow` | `row` (default), `column`, `dense` |
| `grid-auto-rows` `grid-auto-columns` | Size of implicit tracks |

The core resolves simple lines. Negative lines, `N name`, `span N name`, names that are not in the grid, and leading implicit tracks are in EVGFull.

A repeated name in `grid-template-areas` is one rectangle. Holes in the picture are empty cells.

## Alignment

| Property | Values |
| --- | --- |
| `justify-content` `align-content` | Distribution of the tracks in the grid: `start`, `center`, `end`, `stretch`, `space-between`, `space-around`, `space-evenly` |
| `justify-items` `justify-self` | An item in its area on the inline axis: `start`, `center`, `end`, `stretch`, `left`, `right`, `self-start`, `self-end` |
| `align-items` `align-self` | The same on the block axis, and `baseline`, `last baseline` |

Auto margins on a grid item take the free space of its area. An item with `aspect-ratio` stretches along one axis and keeps its ratio.

An absolutely positioned child with a grid area is laid out in that area. With EVGFull installed, an axis without insets takes its static position from `justify-self` / `align-self`.

## Subgrid

`grid-template-rows: subgrid` and `grid-template-columns: subgrid` on a nested grid take the parent's tracks. Line names, gaps and margins of subgridded items do not carry over (see [CSS conformance](/evg/css/conformance/#known-gaps)).

## Gaps

`gap`, `row-gap` and `column-gap` work as in flex. The longhands override the shorthand per axis.

## Auto placement

Items without an explicit area fill empty cells in `grid-auto-flow` order. Spanned items occupy every cell in their rectangle. With `dense`, a later small item fills a hole an earlier large one left.
