---
title: The pipeline
description: How EVG turns a tree and a stylesheet into a display list that any painter can draw.
---

Each stage has one job. It hands on a simpler thing than it received.

```text
   tree  ──►  stylesheet  ──►  layout  ──►  display list  ──►  a painter
 (names)      (@media, vw,     (boxes,       (absolute px,      (PDF, PNG,
              themes, states)   text runs)    resolved colours)  SVG, GL, …)
```

## 1. The tree

`EVGElement` nodes: a class name, a type, children, and any inline attributes the author set. A well-written document carries no colours, sizes or spacing here. One tree can be a print page and a phone screen.

## 2. The cascade

`EVGStyleSheet.applyTree` resolves classes, theme, interaction state and the stated viewport into properties. It writes them with the same `setAttribute` the authoring layer uses. Inline attributes win. The sheet skips any property the author already set.

## 3. Layout

`EVGLayout.layout` resolves units, measures text, and writes `calculatedX`, `calculatedY`, `calculatedWidth`, `calculatedHeight` on every element. This is the flex / grid / flow engine. See [Layouts](/evg/layout/overview/).

## 4. The display list

`EVGDisplayList.build` walks the laid-out tree once and emits flat commands:

| Kind | Meaning |
| --- | --- |
| `RECT` | Filled box, optional radius, gradient, shadow |
| `BORDER` | Stroked outline |
| `IMAGE` | Textured quad |
| `TEXT` | One run on one line, already at its baseline |
| `PUSH_CLIP` / `POP_CLIP` | Scissor rectangle |
| `PATH` | Filled vector outline |
| `STROKE` | Stroked polyline |

Values are absolute pixels. Colours are 0–255 plus alpha. There is no tree and no unit left.

A GPU effect is not a fifth layout. It is extra data on the list: one instance per element that declared `evg-surface-effect`, plus `efx` on the rectangle where that element paints. See [Shaders](/evg/effects/shaders/).

## 5. A painter

Everything above the list is one body of code. Everything below it knows about quads, glyph runs and scissor rectangles.

| Painter | Use |
| --- | --- |
| WebGL 2 (`storm/gl/evg-webgl.js`) | Interactive pages |
| SoftCanvas | Tests, PNG |
| PDF | Print, selectable text |
| SVG / HTML | A picture a browser opens without WebGL |
| CoreGraphics / Android Canvas / SDL | Native hosts |

The claim of the engine: **the same tree, styled by the same sheet, comes out the same on every target.**

## Minimal Ranger program

```ranger
Import "pkg:evg/EVGElement.rgr"
Import "pkg:evg/EVGStyleSheet.rgr"
Import "pkg:evg/EVGLayout.rgr"
Import "pkg:evg/EVGDisplayList.rgr"

def page (EVGElement.createDiv())
page.className = "page"
def title (EVGElement.createSpan())
title.className = "title"
title.textContent = "Hello"
page.addChild(title)

def sheet (new EVGStyleSheet())
sheet.parse(".page { padding: 24px } .title { font-size: 28px; color: #10162b }")
sheet.setViewport(1200.0 800.0 false)
sheet.applyTree(page "")

def lay (new EVGLayout())
lay.setPageSize(1200.0 800.0)
lay.layout(page)

def dl (new EVGDisplayList())
dl.setTextEngine((lay.getTextEngine()))
dl.build(page)
print (dl.toJson())
```
