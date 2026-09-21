---
title: The CSS subset
description: How EVG's stylesheet works. It is CSS-shaped. It is not a browser cascade.
---

[`EVGStyleSheet`](https://github.com/terotests/evg/blob/master/storm/EVGStyleSheet.rgr) is deliberately not a browser cascade. It supports what a document needs in order to change its look without editing its tree.

```css
.caption                    { color: #444; }      /* class rule, every theme */
.theme-classic .caption     { color: #1b1a17; }   /* only under theme "classic" */
.a, .b                      { padding: 8px; }     /* selector lists */
.btn:hover                  { background-color: #eee; }

@media (max-width: 640px)                            { .page { padding: 12px; } }
@media (min-width: 900px) and (orientation: landscape) { .rail { display: flex; } }
@media (pointer: coarse)                             { .hit { min-height: 44px; } }

@vars           { --ink: #09090b; }
@vars classic   { --ink: #1b1a17; }
.caption { color: var(--ink); }
```

## What is in the picture

| Piece | Role |
| --- | --- |
| Class selectors | `.name` is the only selector. There are no tag selectors and no id selectors |
| Theme scope | `.theme-classic .caption` applies only when the tree's theme is `classic` |
| Pseudo-classes | `:hover`, `:focus`, `:active`, `:disabled` |
| `@media` | Conditions on the viewport the **caller states** |
| `@vars` | Custom properties (`--ink`) resolved by `var(--ink)` |
| Inline attributes | Always win over the sheet |

## Resolution order

Source order breaks ties inside each group:

```text
unscoped class rules  <  theme-scoped class rules  <  inline attributes
```

Inline always wins. The applier skips any property the authoring layer already set. `EVGElement` records those names in `inlineProps`.

There is no `!important`. There are no descendant combinators beyond the theme scope. There is no specificity arithmetic beyond "theme-scoped beats unscoped".

## Pseudo-classes

`:hover`, `:focus`, `:active` and `:disabled` read the element's own flags: `isHovered`, `isFocused`, `isPressed`, `a11yDisabled`. A controller does not write a second class name for a state the sheet can ask about.

## `@media`

A media block is a **condition on the rules inside it**, not a new kind of selector. The rules keep the specificity they would have had outside. A block that does not match contributes nothing.

| Feature | Values |
| --- | --- |
| `min-width` `max-width` | CSS pixels |
| `min-height` `max-height` | CSS pixels |
| `orientation` | `portrait`, `landscape` |
| `pointer` | `coarse` (a finger), `fine` (a mouse) |

Combine with `and`. Nested blocks mean both conditions hold. The tighter bound wins. A condition nobody could parse is **kept** rather than dropped, so the rules inside it never apply.

Conditions are evaluated against a viewport the caller states, because a Ranger program has no window to ask:

```ranger
sheet.setViewport(w h coarse)     ; before applyTree
sheet.applyTreeIn(root theme w h coarse)
```

**With no viewport stated, a conditional rule does not apply at all.** Guessing "yes" would style a print page for a phone.

## Custom properties

```css
@vars          { --ink: #09090b; --line: #e4e4e7; --brand: #14b8a6; }
@vars marine   { --ink: #0a3344; --line: #b6d4e0; }
@media (max-width: 640px) { @vars { --gap: 8px; } }

.caption { color: var(--ink); padding: var(--gap); }
```

`@vars` is the palette. A theme name after `@vars` scopes that block. `var(--name)` is the only substitution. There is no `var(--name, fallback)` in the sheet.

## Transitions

`transition` is a CSS property on the element, not a keyframe language. The engine interpolates layout and paint values between trees. See `storm/README.md` under Interaction.

## What this is not

EVG does not run in a browser layout engine. `display: flex` is EVG's flex, measured with EVG's text engine. A property the engine cannot use is not dropped in silence: [`EVGReject`](https://github.com/terotests/evg/blob/master/storm/EVGReject.rgr) records it, and `layout()` drains the list into warnings.

Not implemented: `calc()`, `ch`, `ex`, container queries, element selectors, `!important`, and most of CSS cascade layers.

The property list is on [Properties](/evg/css/properties/). Length units are on [Units](/evg/css/units/).
