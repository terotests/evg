---
title: Syntax
description: "The document formats EVG reads: Thunderstruck XML, Storm JSON, a Ranger element tree, and a CSS stylesheet."
---

EVG does not have one file format. It has one **element tree**. Several syntaxes build that tree.

## Thunderstruck XML

The original markup is HTML-shaped XML. Attribute names are the same CSS-like names the Storm tree uses.

```xml
<div width="400" height="300" background-color="#ffffff">
  <div padding="20" background-color="#3498db" border-radius="10">
    <span font-size="24" font-family="Helvetica" color="#ffffff">
      Hello, EVG!
    </span>
  </div>
</div>
```

| Tag | Role |
| --- | --- |
| `div` / `View` | A box that can hold children |
| `span` / `Label` | A text run |
| `img` / `Image` | A bitmap (`src`) |
| `path` / `Path` | An SVG path (`d`, `viewBox`) |
| `input` / `textarea` | Interactive hosts (browser) |

`component` registers a reusable fragment. `header` and `footer` are page chrome on the print path. See `storm/SPEC.md` for the full XML attribute list.

Coordinates start at the **top-left**. X increases to the right. Y increases down.

## Storm JSON

A Storm document is a JSON object with `"evg": 1` and a `root` node. Each node has `tag`, optional `props`, optional `text`, and optional `children`.

```json
{
  "evg": 1,
  "root": {
    "tag": "div",
    "props": {
      "width": "400px",
      "padding": "20px",
      "background-color": "#f6f7f9"
    },
    "children": [
      {
        "tag": "span",
        "props": { "font-size": "22px", "color": "#10162b" },
        "text": "EVG 3.0 Storm"
      }
    ]
  }
}
```

The CLI accepts this file: `evg examples/storm-hello.evg.json out.pdf`.

## Ranger tree

A Ranger program builds the same nodes in code. Documents in the gallery often come from JSX (`JSXToEVG`) or from a tree literal. Downstream layout cannot tell which authoring path was used.

```ranger
def page (EVGElement.createDiv())
page.className = "page"
def title (EVGElement.createSpan())
title.className = "title"
title.textContent = "Hello"
page.addChild(title)
```

Every property goes through `EVGElement.setAttribute(name value)`. Both spellings work: `font-size` and `fontSize`. The stylesheet uses the same function, so inline attributes and CSS declarations cannot drift apart.

## Stylesheet

Look is not on the tree. A stylesheet assigns properties from class names, a theme, interaction state, and a viewport:

```css
.page { padding: 24px; }
.title { font-size: 28px; color: #10162b; }

@media (max-width: 640px) {
  .page { padding: 12px; }
}
```

```ranger
def sheet (new EVGStyleSheet())
sheet.parse(".page { padding: 24px } .title { font-size: 28px; color: #10162b }")
sheet.setViewport(1200.0 800.0 false)
sheet.applyTree(page "")
```

See [The CSS subset](/evg/css/overview/) for selectors, `@media`, and `@vars`.

## What a node is not

A node is not a DOM element. There is no browser under the layout. Selectors are class names, not tag names. There is no `document.querySelector`. Hit testing walks the paint order of the laid-out tree.
