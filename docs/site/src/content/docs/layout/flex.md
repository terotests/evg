---
title: Flex
description: EVG's flex layout, including the places it differs from CSS.
---

`display: flex` runs CSS's "resolve flexible lengths" in both directions.

```css
.row {
  display: flex;
  flex-direction: row;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
}
.grow { flex: 1; }
```

## Properties

| Property | Values | Notes |
| --- | --- | --- |
| `flex-direction` | `row`, `column` | `row-reverse` and `column-reverse` parse and then **warn**. Nothing lays them out |
| `flex-wrap` | `nowrap`, `wrap`, `wrap-reverse` | See the default below |
| `justify-content` | `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly` | Main axis |
| `align-items` | `flex-start`, `center`, `flex-end`, `stretch`, `baseline` | Cross axis, on the container |
| `align-self` | The same set | On the item, overrides `align-items` |
| `align-content` | The same set | Packed lines, when the container wraps |
| `flex` | shorthand | Sets grow, shrink, and basis |
| `flex-grow` `flex-shrink` `flex-basis` | | A `flex-basis` is the starting main size whether or not the item grows |
| `gap` `row-gap` `column-gap` | lengths | In a row, `column-gap` is between items and `row-gap` is between wrapped lines |

A text leaf shrink-wraps to its measured content. It does not claim the parent's width.

## How a line is sized

1. Each item starts at its `flex-basis` (or its content size).
2. Free space is shared by `flex-grow`.
3. Overflow is shared by `flex-shrink` × base size.
4. An item that hits `min-width` or `max-width` is **frozen** at the limit. What it did not take is offered to the rest.
5. `max-width` is applied before `min-width`. When the two contradict, the minimum wins.

[`EVGFlexRulesTest.rgr`](https://github.com/terotests/evg/blob/master/storm/EVGFlexRulesTest.rgr) is the statement of those rules.

## Differences from CSS

These defaults are load-bearing. A sheet copied from a browser will not look the same until you set them.

| | EVG | CSS initial |
| --- | --- | --- |
| `align-items` | **`flex-start`** | `stretch` |
| `flex-wrap` | **`wrap`** | `nowrap` |

An auto cross size is therefore fit-content. A column whose children should fill it must say `width: 100%` or `align-items: stretch`.

A row that must stay on one line must say `flex-wrap: nowrap`. That also enables the row-axis shrink pass.

The wrap test allows a hundredth of a pixel of overflow. A `flex: 1` child's width is computed out of the line it is then measured against, and the parts do not always add back up to the whole.

## XML `direction`

On the Thunderstruck XML path, `direction="row"` on a `div` is the older flow-axis attribute, not CSS `flex-direction`. Storm documents use `display: flex` and `flex-direction`.
