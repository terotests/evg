# EVG Refactoring Plan: Dependency Injection and Environment Abstraction

## Goal

**Primary Goal**: Enable EVG rendering engine to work in the browser, allowing the same layout definitions to render to PDF (server-side), Canvas, SVG, or HTML/CSS (client-side).

Refactor `src/layout/index.ts` to remove direct dependencies on:

- `pdfkit` renderer
- `fs` (file system)
- `path` module
- XML parsing (xmldom)

Instead, use dependency injection and interfaces to allow different environments (Node.js, browser, etc.) to provide their own implementations.

## Current Problems

1. **Tight coupling**: `EVG` class directly imports `Renderer` from pdfkit
2. **Node.js specific**: Uses `fs` and `path` for font installation
3. **XML parsing hardcoded**: Uses `xmldom` directly, but browsers have native `DOMParser`
4. **Mixed responsibilities**: Layout logic mixed with rendering, serialization, and file I/O

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         EVG Environment                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  IRenderer   │  │  ISerializer │  │  IFontProvider       │   │
│  │  Interface   │  │  Interface   │  │  Interface           │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                 │                    │                 │
│         ▼                 ▼                    ▼                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ PDFRenderer  │  │ XMLSerializer│  │ NodeFontProvider     │   │
│  │ CanvasRender │  │ JSONSerializer│ │ BrowserFontProvider  │   │
│  │ SVGRenderer  │  │ etc.         │  │ etc.                 │   │
│  │ HTMLRenderer │  │              │  │                      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EVG Core (Pure Layout)                      │
├─────────────────────────────────────────────────────────────────┤
│  • EVG class (layout calculations only)                         │
│  • UICalculated, UIRenderPosition                               │
│  • No external dependencies                                      │
│  • Accepts IMeasurer for text measurement                       │
└─────────────────────────────────────────────────────────────────┘
```

## Interfaces to Define

### 1. `IMeasurer` - Text Measurement

```typescript
interface IMeasurer {
  measureText(
    text: string,
    fontFamily: string,
    fontSize: number
  ): { width: number; height: number };
}
```

### 2. `IRenderer` - Rendering Output

```typescript
interface IRenderer {
  // Document lifecycle
  beginDocument(width: number, height: number): void;
  endDocument(): void;
  addPage(): void;

  // Drawing primitives
  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: DrawOptions
  ): void;
  drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    options: DrawOptions
  ): void;
  drawText(text: string, x: number, y: number, options: TextOptions): void;
  drawImage(
    url: string,
    x: number,
    y: number,
    width: number,
    height: number
  ): void;
  drawPath(
    pathData: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options: DrawOptions
  ): void;

  // State management
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  scale(factor: number): void;
  clip(): void;

  // Measurement (implements IMeasurer)
  measureText(
    text: string,
    fontFamily: string,
    fontSize: number
  ): { width: number; height: number };
}
```

### 3. `ISerializer` - EVG Object Creation

```typescript
interface ISerializer {
  parse(input: string): EVG;
  serialize(evg: EVG): string;
}
```

### 4. `IFontProvider` - Font Management

```typescript
interface IFontProvider {
  registerFont(name: string, source: string | ArrayBuffer): void;
  getFont(name: string): string | ArrayBuffer | null;
  listFonts(): string[];
  installShippedFonts?(): Promise<void>;
}
```

### 5. `IComponentRegistry` - Component Management

```typescript
interface IComponentRegistry {
  register(name: string, component: string): void;
  get(name: string): string | undefined;
  list(): string[];
}
```

### 6. `IOutputTarget` - Output Destination

```typescript
interface IOutputTarget {
  write(data: Buffer | Uint8Array): void;
  end(): void;
}

// Implementations:
// - FileOutputTarget (Node.js fs.createWriteStream)
// - StreamOutputTarget (any writable stream)
// - BlobOutputTarget (browser Blob creation)
```

### 7. `IHTMLRenderer` - HTML/CSS Output

```typescript
interface IHTMLRenderer extends IRenderer {
  // Returns the rendered HTML string
  toHTML(): string;

  // Returns standalone CSS for the rendered elements
  toCSS(): string;

  // Returns complete HTML document with embedded CSS
  toDocument(): string;

  // Returns a DOM element (for browser environments)
  toElement?(): HTMLElement;

  // Configuration options
  setOption(key: HTMLRendererOption, value: any): void;
}

type HTMLRendererOption =
  | "cssMode" // 'inline' | 'classes' | 'styled-components'
  | "cssPrefix" // prefix for generated class names
  | "useFlexbox" // use flexbox for layout (vs absolute positioning)
  | "responsive" // generate responsive breakpoints
  | "minify" // minify output HTML/CSS
  | "prettyPrint"; // format output for readability

interface HTMLRendererConfig {
  cssMode?: "inline" | "classes" | "styled-components";
  cssPrefix?: string;
  useFlexbox?: boolean;
  responsive?: boolean;
  minify?: boolean;
  prettyPrint?: boolean;
}

// Example usage:
// const renderer = new HTMLRenderer({ cssMode: 'classes', cssPrefix: 'evg-' });
// env.render(evg, renderer);
// const html = renderer.toHTML();
// const css = renderer.toCSS();
```

#### HTML Renderer Output Modes

1. **Inline Styles** (`cssMode: 'inline'`)

   ```html
   <div style="width: 100px; height: 50px; background-color: red;">
     <span style="font-size: 14px; color: white;">Hello</span>
   </div>
   ```

2. **CSS Classes** (`cssMode: 'classes'`)

   ```html
   <div class="evg-view-1">
     <span class="evg-label-1">Hello</span>
   </div>
   ```

   ```css
   .evg-view-1 {
     width: 100px;
     height: 50px;
     background-color: red;
   }
   .evg-label-1 {
     font-size: 14px;
     color: white;
   }
   ```

3. **Flexbox Layout** (`useFlexbox: true`)
   - Converts EVG layout calculations to CSS flexbox
   - More responsive and adaptable than absolute positioning
   - Better for web integration

## New File Structure

```
src/
├── core/
│   ├── index.ts           # EVG class (pure layout logic)
│   ├── types.ts           # UICalculated, UIRenderPosition, etc.
│   └── interfaces.ts      # All interface definitions
│
├── environment/
│   ├── index.ts           # EVGEnvironment class
│   ├── node.ts            # Node.js environment setup
│   └── browser.ts         # Browser environment setup (future)
│
├── renderers/
│   ├── pdfkit.ts          # PDFKit implementation of IRenderer
│   ├── canvas.ts          # HTML Canvas implementation (future)
│   ├── svg.ts             # SVG output implementation (future)
│   └── html.ts            # HTML/CSS output implementation
│
├── serializers/
│   ├── xml.ts             # XML serializer (xmldom for Node, native for browser)
│   └── json.ts            # JSON serializer (future)
│
├── providers/
│   ├── fonts.ts           # Font provider implementations
│   └── components.ts      # Component registry implementation
│
└── bin/
    └── evg.ts             # CLI tool
```

## Migration Steps

### Phase 1: Define Interfaces

- [ ] Create `src/core/interfaces.ts` with all interface definitions
- [ ] Create `src/core/types.ts` with data types (UICalculated, etc.)

### Phase 2: Extract Pure Layout Logic

- [ ] Create `src/core/index.ts` with EVG class
- [ ] Remove all `fs`, `path`, `pdfkit` imports from EVG class
- [ ] Accept `IMeasurer` in layout calculation methods
- [ ] Move registries to external providers

### Phase 3: Create Environment Class

- [ ] Create `src/environment/index.ts` with `EVGEnvironment` class
- [ ] Environment holds renderer, serializer, font provider, component registry
- [ ] Add factory methods: `renderToFile()`, `renderToStream()`, `parse()`

### Phase 4: Refactor Renderer

- [ ] Update `src/renderers/pdfkit.ts` to implement `IRenderer`
- [ ] Move font path resolution to font provider
- [ ] Remove direct EVG dependency from renderer

### Phase 5: Create Serializers

- [ ] Create `src/serializers/xml.ts` implementing `ISerializer`
- [ ] Move XML parsing logic from EVG class
- [ ] Support both xmldom (Node) and native DOMParser (browser)

### Phase 6: Create Providers

- [ ] Create `src/providers/fonts.ts` with `NodeFontProvider`
- [ ] Create `src/providers/components.ts` with `ComponentRegistry`
- [ ] Move `installShippedFonts()` to font provider

### Phase 7: Update Entry Points

- [ ] Update `src/layout/index.ts` to re-export from new locations (backward compatibility)
- [ ] Update `src/bin/evg.ts` to use new environment
- [ ] Update build configuration

### Phase 8: Documentation & Tests

- [ ] Update README with new architecture
- [ ] Add examples for custom renderer/serializer
- [ ] Update tests for new structure

## Example Usage After Refactoring

### Node.js (Current Behavior)

```typescript
import { createNodeEnvironment } from "evg/environment/node";

const env = createNodeEnvironment();
env.fonts.installShippedFonts();

const evg = env.parse('<View width="100%" height="100%">...</View>');
await env.renderToFile("output.pdf", 595, 842, evg);
```

### Browser (Future)

```typescript
import { createBrowserEnvironment } from "evg/environment/browser";
import { CanvasRenderer } from "evg/renderers/canvas";

const env = createBrowserEnvironment({
  renderer: new CanvasRenderer(document.getElementById("canvas")),
});

const evg = env.parse(xmlString); // Uses native DOMParser
env.render(evg);
```

### Custom Renderer

```typescript
import { EVGEnvironment } from "evg/environment";
import { EVG } from "evg/core";

class MySVGRenderer implements IRenderer {
  // ... implement interface
}

const env = new EVGEnvironment({
  renderer: new MySVGRenderer(),
  serializer: new XMLSerializer(),
  fonts: new MyFontProvider(),
});
```

## Breaking Changes

1. `EVG.installShippedFonts()` → `env.fonts.installShippedFonts()`
2. `EVG.installFont()` → `env.fonts.registerFont()`
3. `EVG.installComponent()` → `env.components.register()`
4. `EVG.renderToFile()` → `env.renderToFile()`
5. `EVG.renderToStream()` → `env.renderToStream()`
6. `new EVG(xmlString)` → `env.parse(xmlString)` or `new EVG(params)` (no XML)

## Backward Compatibility

To maintain backward compatibility during transition:

- Keep old static methods on EVG class but mark as deprecated
- Old methods internally create a default Node environment
- Console warnings for deprecated usage
- Full removal in next major version

## Benefits

1. **Testability**: Pure layout logic can be unit tested without rendering
2. **Flexibility**: Support multiple renderers (PDF, Canvas, SVG)
3. **Browser support**: Remove Node.js dependencies for browser builds
4. **Tree-shaking**: Only include needed renderers/serializers in bundle
5. **Plugin architecture**: Easy to add custom renderers/serializers
6. **Separation of concerns**: Clear boundaries between layout, rendering, I/O

## Notes

- Consider using a DI container library (like `tsyringe`) or keep it simple with manual injection
- Browser environment can be a separate npm package (`evg-browser`) to avoid bundling Node deps
- XML parsing can use a facade pattern to switch between xmldom and native DOMParser

## Browser Test Application

A Vite-based test application to demonstrate and test EVG rendering across different engines.

### Location

```
examples/
└── browser-demo/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    ├── src/
    │   ├── main.ts
    │   ├── App.tsx           # or App.vue / App.svelte
    │   ├── components/
    │   │   ├── RendererSelector.tsx
    │   │   ├── EVGEditor.tsx
    │   │   ├── PreviewPanel.tsx
    │   │   └── ExampleGallery.tsx
    │   ├── renderers/
    │   │   ├── canvas-preview.ts
    │   │   ├── svg-preview.ts
    │   │   └── html-preview.ts
    │   └── examples/
    │       ├── basic-layout.xml
    │       ├── nested-views.xml
    │       ├── text-styling.xml
    │       ├── images.xml
    │       └── complex-document.xml
    └── public/
        └── fonts/
            └── (subset of shipped fonts for browser)
```

### Features

1. **Live XML Editor**

   - Edit EVG XML in real-time
   - Syntax highlighting
   - Error reporting

2. **Multi-Renderer Preview**

   - Side-by-side comparison of different renderers
   - Canvas, SVG, HTML output
   - Toggle between renderers

3. **Example Gallery**

   - Pre-built EVG examples
   - Click to load into editor
   - Demonstrates various layout features

4. **Export Options**

   - Download as SVG
   - Download as PNG (from canvas)
   - Copy HTML/CSS output
   - Generate PDF (via server API or client-side library)

5. **Performance Metrics**
   - Render time for each engine
   - Memory usage comparison
   - Layout calculation time

### Example App Code

```typescript
// examples/browser-demo/src/main.ts
import { createBrowserEnvironment } from "evg/environment/browser";
import { CanvasRenderer } from "evg/renderers/canvas";
import { SVGRenderer } from "evg/renderers/svg";
import { HTMLRenderer } from "evg/renderers/html";

const env = createBrowserEnvironment();

// Load example XML
const xmlInput = `
<View width="100%" height="100%" background-color="#f0f0f0" padding="20">
  <View width="200" height="100" background-color="blue" border-radius="10">
    <Label text="Hello EVG!" color="white" font-size="18" />
  </View>
</View>
`;

const evg = env.parse(xmlInput);

// Render to Canvas
const canvasRenderer = new CanvasRenderer(
  document.getElementById("canvas-output")
);
env.render(evg, canvasRenderer);

// Render to SVG
const svgRenderer = new SVGRenderer();
env.render(evg, svgRenderer);
document.getElementById("svg-output").innerHTML = svgRenderer.toSVG();

// Render to HTML
const htmlRenderer = new HTMLRenderer({ cssMode: "classes" });
env.render(evg, htmlRenderer);
document.getElementById("html-output").innerHTML = htmlRenderer.toHTML();
document.getElementById("css-output").textContent = htmlRenderer.toCSS();
```

### Running the Demo

```bash
cd examples/browser-demo
npm install
npm run dev
# Opens http://localhost:5173
```

### Test Scenarios

The demo app should cover these test scenarios:

| Feature           | Canvas | SVG | HTML |
| ----------------- | ------ | --- | ---- |
| Basic rectangles  | ✅     | ✅  | ✅   |
| Rounded corners   | ✅     | ✅  | ✅   |
| Text rendering    | ✅     | ✅  | ✅   |
| Font families     | ✅     | ✅  | ✅   |
| Images            | ✅     | ✅  | ✅   |
| Nested layouts    | ✅     | ✅  | ✅   |
| Flexbox alignment | N/A    | N/A | ✅   |
| Gradients         | ✅     | ✅  | ✅   |
| Opacity           | ✅     | ✅  | ✅   |
| Rotation          | ✅     | ✅  | ✅   |
| Clipping/overflow | ✅     | ✅  | ✅   |
| QR codes          | ✅     | ✅  | ✅   |
| SVG paths         | ✅     | ✅  | ❌   |

### Phase 9: Browser Demo App (New Phase)

- [ ] Create `examples/browser-demo` folder structure
- [ ] Set up Vite + React/Vue project
- [ ] Implement CanvasRenderer for browser
- [ ] Implement SVGRenderer for browser
- [ ] Implement HTMLRenderer
- [ ] Create XML editor component with syntax highlighting
- [ ] Create multi-renderer preview panel
- [ ] Add example gallery with sample EVG documents
- [ ] Add export functionality
- [ ] Deploy demo to GitHub Pages or similar

### Updated Timeline

- Phase 1-2: 2-3 hours (interfaces and core extraction)
- Phase 3-4: 3-4 hours (environment and renderer refactor)
- Phase 5-6: 2-3 hours (serializers and providers)
- Phase 7-8: 2-3 hours (entry points, docs, tests)
- **Phase 9: 4-6 hours (browser demo app)**

**Total: ~14-19 hours of work**
