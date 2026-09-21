---
title: Properties
description: CSS properties EVG accepts on an element, through the stylesheet or as inline attributes.
---

Every property is set through `EVGElement.setAttribute(name value)`. Every name below is accepted in **both** spellings: `font-size` and `fontSize`. The stylesheet and the inline attributes share that function.

The source of this list is `storm/README.md` (Property reference) and `storm/SPEC.md`.

## Box

| Property | Notes |
| --- | --- |
| `width` `height` | Any [unit](/evg/css/units/). Unset = auto |
| `min-width` `max-width` `min-height` `max-height` | Clamps, applied after the size is computed |
| `padding` | 1–4 values, CSS order (`all`, `v h`, `t h b`, `t r b l`) |
| `padding-top` `padding-right` `padding-bottom` `padding-left` | Longhands |
| `margin` and the four sides | Same shorthand |
| `border` | `<width> solid <color>`. `none` clears it. The style keyword is accepted and ignored — EVG strokes one way |
| `border-width` `border-color` | |
| `border-radius` | One value, or four. Percentages resolve against the box |
| `box-shadow` | `<dx> <dy> <blur> <color>` |
| `shadow-offset-x` `shadow-offset-y` `shadow-radius` `shadow-color` | The long form |
| `opacity` | `0`–`1`, multiplied through the subtree |
| `overflow` | `visible` is the default. Every other value clips the subtree and makes the box scrollable |
| `scroll-top` `scroll-left` | Where a scrollable box is scrolled to |

The box model is CSS's: `padding` and `border` sit inside the declared width.

## Layout

| Property | Values |
| --- | --- |
| `display` | `flex`, `grid`. Anything else is block flow |
| `flex-direction` | `row`, `column`. Reversed directions parse and then warn: nothing lays them out |
| `flex-wrap` | `nowrap`, `wrap`, `wrap-reverse` |
| `justify-content` | `flex-start`, `center`, `flex-end`, `space-between`, `space-around`, `space-evenly` |
| `align-items` `align-content` | `flex-start`, `center`, `flex-end`, `stretch`, `baseline` |
| `align-self` | The same set, on the item |
| `flex` | The shorthand. `flex-basis` and `flex-shrink` also exist separately |
| `gap` `row-gap` `column-gap` | Longhands override the shorthand, per axis |
| `grid-template-columns` `grid-template-rows` | `120px 1fr 40%`, `repeat(3, 1fr)`, `minmax(40px, 1fr)`, `subgrid` |
| `grid-template-areas` | A picture of names. A repeated name is one rectangle |
| `grid-column` `grid-row` `grid-area` | Placement and spans |
| `grid-auto-flow` | `row`, `column` |
| `direction` | `ltr`, `rtl` — set once on the root and the whole tree turns around |
| `position` | `relative` (default), `absolute`, `fixed` |
| `top` `right` `bottom` `left` | Insets. `left`/`top`/`right`/`bottom` without `position` also take the box out of flow (XML path) |
| `vertical-align` | `baseline` participation for inline-ish content |
| `inline` | `true` — inline-block on the XML path |
| `line-break` | Force a break after the element (XML path) |

See [Layouts](/evg/layout/overview/), [Flex](/evg/layout/flex/), and [Grid](/evg/layout/grid/).

## Paint

| Property | Notes |
| --- | --- |
| `background-color` `color` | `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb()`, `rgba()`, `hsl()`, named colours, `transparent` |
| `background-gradient` | `linear-gradient(…)` / `radial-gradient(…)` |
| `linear-gradient` `radial-gradient` | XML-path aliases |
| `gradient-from` `gradient-to` `gradient-dir` | The long form |
| `background-image` | A source the host can decode |
| `backdrop-filter` | `blur(Npx)` — softens what is already behind the box |
| `scrollbar-width` `scrollbar-color` | `auto` / `thin` / `none`; thumb colour then track colour |
| `evg-scrollbar-label` | `percent` (default) or `none` |
| `fill` `stroke` `stroke-width` `stroke-dasharray` `stroke-dashoffset` `fill-rule` | Vector paint |
| `clip-path` | |
| `transform` `transform-origin` `rotate` `scale` `translate-x` `translate-y` | |
| `object-fit` | `cover`, `contain`, `fill`, `none` |
| `image-offset-x` `image-offset-y` `image-quality` `maxImageSize` | How a bitmap is placed and resampled |
| `cursor` | Inherited |
| `full-bleed` | The box ignores the page margins |

### Gradient syntax

```css
background-gradient: linear-gradient(135deg, red, yellow 20%, blue);
background-gradient: radial-gradient(white, rgba(255,255,255,0.1) 10%, blue);
```

On the XML path the same strings sit in `linear-gradient="…"` and `radial-gradient="…"`.

## Type

| Property | Notes |
| --- | --- |
| `font-family` | Inherited |
| `font-size` | Inherited through `em`. `rem` stays with the root |
| `font-weight` | |
| `line-height` | A number (multiplier) or a length. `normal` is the face's own line box, which is **not** 1.2 |
| `text-align` | `left`, `center`, `right` |
| `line-break` | How lines may be broken |
| `emoji-color` | Colour of fallback glyphs. Defaults to `color` |

## Surfaces (popovers)

A surface is out of flow and is drawn after the whole normal tree, outside every clip.

| Property | Notes |
| --- | --- |
| `anchor-name` | Names this element: `--file` |
| `position-anchor` | What this surface is positioned against: an `anchor-name` or an `#id` |
| `overlay` | Marks a surface without naming an anchor |
| `position-area` | `bottom start`, `top end`, `right center`, `center`, `cover` |
| `position-try-fallbacks` | Areas to try when the declared one does not fit |
| `position-try-order` | `most-space` takes the roomiest candidate |
| `overlay-gap` | Distance from the anchor |
| `fit-viewport` | Clamp the surface to the page |
| `presentation` | `anchored` (default), `sheet`, `fullscreen` |
| `sheet-below` | Become a sheet at or below this page width |

`popover` is a tag that implies a surface. See `storm/README.md` under Surfaces.

## Connectors

A `connector` tag is a line between two named boxes. The layout writes the path.

| Property | Notes |
| --- | --- |
| `from` / `to` | An `anchor-name` or an `#id` |
| `from-side` / `to-side` | `left`, `right`, `top`, `bottom`, `center`, corners, or `auto` |
| `routing` | `straight`, `orthogonal`, `bezier` |
| `from-offset` / `to-offset` | Gap between the box edge and the line end |
| `arrow-start` / `arrow-end` | `none`, `open`, `triangle` |
| `arrow-size` | Head length |
| `stroke` `stroke-width` `stroke-linecap` `stroke-linejoin` `stroke-dasharray` | Same as a path |

## Effects

| Property | Notes |
| --- | --- |
| `evg-surface-effect` | Plugin name: `ripple`, `starfield`, `liquid-glass`, … |
| `evg-effect-on` | What starts it: `press`, `drag`, `hover`, `always` |
| `evg-fx-<name>` | A number the plugin reads. The engine does not interpret it |
| `evg-ripple-*` | Long form still accepted for the ripple plugin |

See [Shaders and surface effects](/evg/effects/shaders/).

## Identity and meaning

| Property | Notes |
| --- | --- |
| `id` | Global. Hit test and accessibility tree |
| `key` | Sibling-scoped. Reconciliation identity |
| `class` / `className` | Stylesheet hook |
| `theme` | Theme name for `.theme-x` rules |
| `role` | Accessibility role |
| `transition` | Interpolated properties between trees |

A declaration the engine cannot use is a warning, not a silent no-op. `width: calc(100% - 40px)` does not become `width: 100%`.
