---
title: About this documentation
description: Technical documentation of EVG, the layout engine. The site uses the same Astro Starlight engine as the Ranger language documentation.
---

EVG (Elastic View Graphics) is a layout engine. It takes a tree of boxes, a CSS-shaped stylesheet, and a viewport. It writes a display list of draw commands. A painter then draws that list to PDF, PNG, SVG, WebGL, or a native canvas.

This site documents **how you write documents for that engine**: the syntax, the CSS subset, the layouts, the properties, and the GPU shaders.

The pages use the same documentation engine as the [Ranger language documentation](https://terotests.github.io/Ranger/docs/): Astro and Starlight, the same chrome and the same writing rules.

## What this site holds

| Part | Content |
| --- | --- |
| Start | Install, document syntax, and the layout pipeline |
| CSS | The cascade, the property list, and the length units |
| Layout | Flow, flex, grid, absolute, fixed, and overlay surfaces |
| Effects | Surface-effect shaders, their CSS, and the GLSL plugin shape |

The engine sources live in this repository under `storm/`. The TypeScript NPM face (`import { EVG } from "evg"`) lives under `src/` and still speaks the Thunderstruck 2.x XML API.

## Two faces

| Face | Input | Typical output |
| --- | --- | --- |
| Thunderstruck 2.x | XML (`<div>`, `<span>`, `<path>`) | PDF from `evg hello.xml hello.pdf` |
| Storm 3.0 | Ranger tree, Storm JSON, or XML lowered to the same tree, plus a stylesheet | Display list → PDF / GL / SVG / PNG |

Both faces end at boxes with the same attributes. Storm adds the CSS cascade, flex, grid, overlays, and GPU effects.

## Related sites

| Site | Content |
| --- | --- |
| [Ranger language documentation](https://terotests.github.io/Ranger/docs/) | The Ranger language and the operator reference |
| [Ranger EVG showcase](https://terotests.github.io/Ranger/evg/) | Live pages the engine draws |
| [Office reference](https://terotests.github.io/Ranger/office/reference/evg/) | How Office applications paint through EVG |

## The rules of the text

The text follows the same Simplified Technical English rules as the Ranger language site. It gives technical information. It does not sell the engine.

The source of each table on this site is `storm/README.md`, `storm/SPEC.md`, and `storm/PLAN_EFFECTS.md` in this repository.
