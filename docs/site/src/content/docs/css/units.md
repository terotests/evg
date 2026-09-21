---
title: Units
description: Length units EVG resolves during layout.
---

A length is an `EVGUnit`: a number, a unit type, and the pixels it resolved to.

| Suffix | Resolves against |
| --- | --- |
| `px` (or a bare number) | Itself. The CSS reference pixel |
| `%` | The parent's **width** on a width property, the parent's **height** on a height property |
| `hp` | The parent's height, on any property |
| `em` | The element's own font size |
| `rem` | The **root** font size |
| `vw` `vh` | The layout's page size (`EVGLayout.setPageSize`) |
| `fill` | Whatever space is left |
| `pt` `pc` `in` `mm` `cm` | `96/72`, `16`, `96`, `96/25.4`, `96/2.54` px — as CSS defines them |

`vw` and `vh` are the viewport, which is a different thing from the parent. On paper that viewport is the **page area** (the sheet less its margins), because that is what CSS says viewport-percentage lengths mean in paged media. So `100vh` is the text column on A4 and the window in a browser.

## Resolution order

Units are resolved during layout, not during parse:

1. Pixels — used directly.
2. Percentage — against the parent's inner size for that axis.
3. `em` — `fontSize × value`.
4. `hp` — against the parent's inner height.
5. `fill` — expands into leftover space.

`resolveUnits` refuses to run twice on the same element, so a percentage is never resolved against an already-resolved parent. A second layout pass must start from `resetLayoutState()`. `layout()` calls that.

## Unrecognised suffixes

An unrecognised suffix leaves the unit **unset** (auto). It does not fall through to pixels. `10ch` is not `10px`. `ch` and `ex` are not implemented. `calc()` is not implemented. Each of those is a warning through `EVGReject`, not a silent `width: 100%`.
