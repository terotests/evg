# ⚡ EVG ⚡

## THUNDERSTRUCK EDITION 2.0

Layout engine to create vector graphics (like PDF) using JavaScript and XML based declarative markup.

**Now with browser support! ⚡**

```s
npm i -g evg
```

Example of markup:
```html
<div>
  <div padding="20">
    <QRCode text="https://github.com/terotests/evg" width="20%" height="20%"/>
    <div width="80%" padding="20">
    Here is your personal QR code
    </div>
  </div>
</div>
```

See `hello.xml` and `hello.pdf` to get started quickly.
 
The engine supports following commands (and more):

- `div`, `img` and `path` for common layout elements
- `color`, `background-color`, `border-color`, `opacity`
- `border-width`, `border-radius`
- basic `padding`, `margin`, `margin-top` etc. supported
- units `px`, `%` (%of available width) or `hp` (% of height)
- width, height as `50%` or `50` or `50px`, `
- text can be added like `<div>Hello World</div>`
- `font-size`, `font-family` can be used to specify TTF fonts used (or `fonts/` dir for CLI)
- horizontal align `align=center`, `align=left`, `align=right`
- absolute positioning `top` and `left`, `bottom`, `right`
- flag `overflow="hidden"` for View and Path elements 

Extra features include:

- support for QR codes using `<QRCode text="foobar"/>`
- `page-break` to change pages
- `footer` and `header` to specify page header and footer
- `<component id=""></component>` to declare re-usable components
- `id="content"` to hold component contents
- `<path d=""/>` elements which can contain SVG path are scaled automatically to fit viewport

## Command line

Running from command line
```
evg hello.xml hello.pdf
```

Subdirectories:
- `fonts/` can include TTF files
- `components/` can include XML components which are used in the file. 

Components can use `id="content"` to indicate place for child nodes.

The .git reposity has example directory `testfiles/` where is example XML file.

## Using as library 

Elastic View Graphics

```javascript
import {EVG} from 'evg'

// you have to install some fonts...
EVG.installFont('candal', '../evg/fonts/Candal/Candal.ttf')

// create a text element component....
EVG.installComponent('t', `<Label font-family="candal" background-color="blue" />`)

// create node and render it to PDF
const node = new EVG(`<View>
  <t text="Hello World!"/>
</View>
`)
EVG.renderToFile('./out.pdf', 600,800, node)

// or render to stream 
const fs = require('fs')
EVG.renderToStream(fs.createWriteStream('fileName.pdf'), 600,800, node)
```

## Creating own components using inline XML

You can define own components, which receive the child elements under a certain tag.

To define your own custom `<h1>Hello</h1>` component as inline XML like this

```html
<component id="h1">
  <div margin-top="10" margin-bottom="20" margin-left="20">
    <div font-size="28" color="#666" id="content"/>
  </div>
</component> 
```
The `id="content"` marks the spot where component children are to be inserted.

## Architecture

EVG uses a dependency injection architecture that allows the same layout engine to work in different environments (Node.js, browser, etc.).

### Core Interfaces

The system is built around these key interfaces (defined in `src/core/interfaces.ts`):

- **IRenderer** - Abstraction for rendering operations (drawing shapes, text, images, paths)
- **IMeasurer** - Abstraction for measuring text dimensions (used by the layout engine)
- **ISerializer** - Abstraction for parsing XML/JSON into EVG structures
- **IFontProvider** - Abstraction for font management and registration
- **IComponentRegistry** - Abstraction for managing reusable EVG components

### Implementations

| Interface | Node.js Implementation | Browser Implementation |
|-----------|----------------------|----------------------|
| IRenderer | `PDFRenderer` (PDFKit) | `CanvasRenderer` (Canvas 2D) |
| IMeasurer | `PDFRenderer` | `CanvasRenderer` |
| ISerializer | `XMLSerializer` (xmldom) | `XMLSerializer` (DOMParser) |
| IFontProvider | `NodeFontProvider` | (custom implementation) |

### Environment Classes

For convenience, EVG provides environment classes that bundle the appropriate implementations:

```typescript
// Node.js - using the NodeEnvironment
import { NodeEnvironment } from 'evg/environment/node';

const env = NodeEnvironment.createPDF();
env.parse('<View><Label text="Hello"/></View>');
await env.renderToFile('output.pdf', 600, 800);
```

```typescript
// Browser - using EVGEnvironment with CanvasRenderer
import { EVGEnvironment } from 'evg/environment';
import { CanvasRenderer } from 'evg/renderers/CanvasRenderer';

const renderer = new CanvasRenderer(canvas);
const env = EVGEnvironment.create({ renderer });
const evg = env.parse('<View><Label text="Hello"/></View>');
env.render(evg, 600, 800);
```

### Project Structure

```
src/
├── core/           # Interfaces and abstract base classes
│   ├── interfaces.ts
│   ├── AbstractRenderer.ts
│   └── AbstractSerializer.ts
├── environment/    # Environment bundles for different platforms
│   ├── index.ts    # EVGEnvironment base class
│   └── node.ts     # NodeEnvironment for Node.js
├── layout/         # EVG layout engine (platform-agnostic)
│   └── index.ts
├── renderers/      # IRenderer implementations
│   ├── PDFRenderer.ts
│   └── CanvasRenderer.ts
├── serializers/    # ISerializer implementations
│   └── XMLSerializer.ts
└── providers/      # Provider implementations
    └── NodeFontProvider.ts
```

## Browser Demo

EVG can also run in the browser using the HTML5 Canvas API. A demo application is included in the `examples/browser-demo` directory.

### Running the Browser Demo

```bash
cd examples/browser-demo
npm install
npm run dev
```

This will start a Vite development server (typically at `http://localhost:5173/`) with an interactive EVG editor where you can:

- Edit EVG XML in real-time and see the rendered output
- Choose from several example templates (Basic Layout, Nested Views, Text Styling, Colors, Dashboard, Tablet Mockup)
- Download the rendered output as a PNG image

### Browser Usage

The browser version uses:
- **CanvasRenderer** - An `IRenderer` implementation that renders to HTML5 Canvas
- **EVG class** - The same layout engine used in Node.js, now with dependency injection support

```typescript
import { EVG } from 'evg/layout';
import { CanvasRenderer } from 'evg/renderers/CanvasRenderer';

const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new CanvasRenderer(canvas);

const evg = new EVG(`<View width="400" height="300" background-color="#f0f0f0">
  <View padding="20" background-color="#3b82f6" border-radius="8">
    <Label text="Hello Browser!" color="white" font-size="24" />
  </View>
</View>`);

renderer.beginDocument(400, 300);
evg.calculate(400, 300, renderer);
// Render the EVG tree to canvas...
```

## License

MIT