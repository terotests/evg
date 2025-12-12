# EVG Refactoring Plan: Dependency Injection and Environment Abstraction

## Goal

**Primary Goal**: Enable EVG rendering engine to work in the browser, allowing the same layout definitions to render to PDF (server-side), Canvas, SVG, or HTML/CSS (client-side).

Refactor `src/layout/index.ts` to remove direct dependencies on:

- `pdfkit` renderer
- `fs` (file system)
- `path` module
- XML parsing (xmldom)

Instead, use dependency injection and interfaces to allow different environments (Node.js, browser, etc.) to provide their own implementations.

## Progress

- [x] **Phase 1**: Define Interfaces (`src/core/interfaces.ts`, `src/core/types.ts`)
- [x] **Phase 2**: Create Abstract Base Classes (`ComponentRegistry`, `AbstractFontProvider`, `AbstractRenderer`, `AbstractSerializer`)
- [x] **Phase 3**: Refactor PDFKit Renderer (`src/renderers/PDFRenderer.ts` implementing `IRenderer`)
- [x] **Phase 4**: Extract XML Serializer (`src/serializers/XMLSerializer.ts` with Node/Browser variants)
- [x] **Phase 5**: Create Font Provider (`src/providers/NodeFontProvider.ts` with shipped font discovery)
- [x] **Phase 6**: Refactor EVG Class (dependency injection support, lazy-loaded Node.js modules)
- [x] **Phase 7**: Create Environment Factory (`src/environment/index.ts`, `src/environment/node.ts`)
- [ ] **Phase 8**: Unit Testing
- [ ] **Phase 9**: Browser Demo Application

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

### Phase 8: Unit Tests for Core Functionality

- [ ] Create `test/core/` directory for core unit tests
- [ ] Test XML string → EVG node tree conversion
- [ ] Test EVG node tree → XML string serialization (round-trip)
- [ ] Test JSON string → EVG node conversion
- [ ] Test layout parameter parsing (width, height, percentages, pixels, em, etc.)
- [ ] Test layout calculations without renderer dependency
- [ ] Test component registration and instantiation
- [ ] Test font registration lookup
- [ ] Test inheritance of styles (fontSize, fontFamily, color)

#### Test Cases for EVG Parsing

```typescript
// test/core/test_parsing.ts

describe("EVG XML Parsing", () => {
  describe("Basic Element Parsing", () => {
    it("should parse empty View element", () => {
      const xml = "<View />";
      const evg = parseEVG(xml);
      expect(evg.tagName).to.equal("View");
      expect(evg.items.length).to.equal(0);
    });

    it("should parse View with attributes", () => {
      const xml = '<View width="100" height="50" background-color="red" />';
      const evg = parseEVG(xml);
      expect(evg.width.pixels).to.equal(100);
      expect(evg.height.pixels).to.equal(50);
      expect(evg.backgroundColor.s_value).to.equal("red");
    });

    it("should parse nested elements", () => {
      const xml = `
        <View width="100%">
          <View width="50%" />
          <Label text="Hello" />
        </View>
      `;
      const evg = parseEVG(xml);
      expect(evg.items.length).to.equal(2);
      expect(evg.items[0].tagName).to.equal("View");
      expect(evg.items[1].tagName).to.equal("Label");
    });
  });

  describe("Unit Parsing", () => {
    it("should parse pixel values", () => {
      const evg = parseEVG('<View width="100px" />');
      expect(evg.width.unit).to.equal(3); // pixels
      expect(evg.width.f_value).to.equal(100);
    });

    it("should parse percentage values", () => {
      const evg = parseEVG('<View width="50%" />');
      expect(evg.width.unit).to.equal(1); // percentage
      expect(evg.width.f_value).to.equal(50);
    });

    it("should parse em values", () => {
      const evg = parseEVG('<View width="2em" />');
      expect(evg.width.unit).to.equal(2); // em
      expect(evg.width.f_value).to.equal(2);
    });

    it("should parse fill value", () => {
      const evg = parseEVG('<View width="fill" />');
      expect(evg.width.unit).to.equal(5); // fill
    });
  });

  describe("Style Inheritance", () => {
    it("should inherit fontSize from parent", () => {
      const xml = `
        <View font-size="20">
          <Label text="Child" />
        </View>
      `;
      const evg = parseEVG(xml);
      // After inheritance processing
      expect(evg.items[0].fontSize.f_value).to.equal(20);
    });

    it("should inherit fontFamily from parent", () => {
      const xml = `
        <View font-family="OpenSans">
          <Label text="Child" />
        </View>
      `;
      const evg = parseEVG(xml);
      expect(evg.items[0].fontFamily.s_value).to.equal("OpenSans");
    });

    it("should not override explicitly set child values", () => {
      const xml = `
        <View font-size="20">
          <Label text="Child" font-size="14" />
        </View>
      `;
      const evg = parseEVG(xml);
      expect(evg.items[0].fontSize.f_value).to.equal(14);
    });
  });

  describe("Text Content Parsing", () => {
    it("should parse inline text as Label nodes", () => {
      const xml = "<View>Hello World</View>";
      const evg = parseEVG(xml);
      expect(evg.items.length).to.equal(2); // "Hello" and "World"
      expect(evg.items[0].tagName).to.equal("Label");
      expect(evg.items[0].text.s_value).to.equal("Hello ");
    });
  });

  describe("Component Parsing", () => {
    it("should expand registered components", () => {
      registerComponent(
        "Button",
        '<View background-color="blue"><content/></View>'
      );
      const xml = '<Button><Label text="Click me"/></Button>';
      const evg = parseEVG(xml);
      expect(evg.backgroundColor.s_value).to.equal("blue");
      expect(evg.items[0].text.s_value).to.equal("Click me");
    });
  });
});

describe("EVG Serialization", () => {
  it("should serialize EVG back to XML (round-trip)", () => {
    const original =
      '<View width="100" height="50"><Label text="Test"/></View>';
    const evg = parseEVG(original);
    const serialized = serializeEVG(evg);
    const reparsed = parseEVG(serialized);

    expect(reparsed.width.pixels).to.equal(evg.width.pixels);
    expect(reparsed.height.pixels).to.equal(evg.height.pixels);
    expect(reparsed.items[0].text.s_value).to.equal(evg.items[0].text.s_value);
  });
});

describe("Layout Calculations", () => {
  it("should calculate pixel dimensions from percentages", () => {
    const xml = '<View width="50%" height="25%" />';
    const evg = parseEVG(xml);

    // Create mock measurer
    const mockMeasurer: IMeasurer = {
      measureText: () => ({ width: 0, height: 0 }),
    };

    // Calculate with parent dimensions 400x200
    evg.calculate(400, 200, mockMeasurer);

    expect(evg.width.pixels).to.equal(200); // 50% of 400
    expect(evg.height.pixels).to.equal(50); // 25% of 200
  });
});
```

### Phase 9: Documentation & Examples

- [ ] Update README with new architecture
- [ ] Add examples for custom renderer/serializer
- [ ] Document all interfaces

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

---

## Phase 6 Implementation Summary

Phase 6 has been completed with the following changes to `src/layout/index.ts`:

### Changes Made

1. **Lazy-loaded Node.js modules**:

   - `Renderer`, `path`, `fs`, `DOMParser`, and `XMLSerializer` are now dynamically imported only when needed
   - This allows the EVG class to be imported in browser environments without errors

2. **Dependency Injection Support**:

   - Added `setFontProvider(provider: IFontProvider)` - inject custom font handling
   - Added `setComponentRegistry(registry: IComponentRegistry)` - inject custom component management
   - Added `setSerializer(serializer: ISerializer)` - inject custom XML/JSON parsing
   - Added corresponding getter functions: `getFontProvider()`, `getComponentRegistry()`

3. **Interface-based Types**:

   - `UIRenderPosition.renderer` now uses `IMeasurer` interface instead of concrete `Renderer` type
   - `calculate()` method accepts `IMeasurer` instead of `Renderer`
   - `adjustLayoutParams()` method accepts `IMeasurer` instead of `Renderer`

4. **Backward Compatible API**:

   - All existing static methods (`renderToFile`, `renderToStream`, `installShippedFonts`) still work in Node.js
   - Legacy global registries (`UIFonts`, `UICompRegistry`) are still used when no DI providers are set
   - `register_font()` and `register_component()` now route to DI providers when available

5. **Browser-compatible XML Parsing**:

   - `parseXML()` now checks for `window.DOMParser` (browser) before falling back to `xmldom` (Node.js)
   - Component serialization uses `window.XMLSerializer` when available

6. **IMeasurer.measureElement**:
   - Added optional `measureElement?(element: any)` method to `IMeasurer` interface
   - `PDFRenderer` implements this method for measuring Label elements
   - Layout code uses `measureElement` when available, falling back to `hasCustomSize` for legacy renderers

### New Exports from `src/layout/index.ts`

```typescript
// Dependency injection setters
export function setFontProvider(provider: IFontProvider): void;
export function setComponentRegistry(registry: IComponentRegistry): void;
export function setSerializer(serializer: ISerializer): void;

// Dependency injection getters
export function getFontProvider(): IFontProvider | null;
export function getComponentRegistry(): IComponentRegistry | null;
```

### Usage Examples

#### Node.js (Legacy - unchanged)

```typescript
import { EVG } from "evg";
EVG.installShippedFonts();
const doc = new EVG('<View width="100" height="100"/>');
await EVG.renderToFile("output.pdf", 800, 600, doc);
```

#### Node.js (with DI)

```typescript
import { EVG, setFontProvider, setComponentRegistry } from "evg/layout";
import { NodeFontProvider } from "evg/providers";
import { ComponentRegistry } from "evg/core";

setFontProvider(new NodeFontProvider());
setComponentRegistry(new ComponentRegistry());

const doc = new EVG('<View width="100" height="100"/>');
// ... render with custom renderer
```

#### Browser (future)

```typescript
import { EVG, setFontProvider, setSerializer } from "evg/layout";
import { BrowserFontProvider } from "evg/providers";
import { BrowserXMLSerializer } from "evg/serializers";

setFontProvider(new BrowserFontProvider());
setSerializer(new BrowserXMLSerializer());

const doc = new EVG('<View width="100" height="100"/>');
// ... render with CanvasRenderer or SVGRenderer
```

### Test Results

- All 84 tests pass (22 core + 20 renderer + 25 serializer + 17 provider)
- Build successful with TypeScript declarations generated

---

## Phase 7 Implementation Summary

Phase 7 has been completed with the creation of the Environment Factory pattern.

### New Files Created

1. **`src/environment/index.ts`** - Base `EVGEnvironment` class
2. **`src/environment/node.ts`** - Node.js specific `NodeEnvironment` class
3. **`src/environment/EVGEnvironment.test.ts`** - Tests for base environment (20 tests)
4. **`src/environment/NodeEnvironment.test.ts`** - Tests for Node environment (8 tests)

### EVGEnvironment Class

The base `EVGEnvironment` class provides:

- **Configuration**: Bundles renderer, serializer, font provider, and component registry
- **Font Management**: `registerFont()`, `getFont()`, `listFonts()`, `installShippedFonts()`
- **Component Management**: `registerComponent()`, `getComponent()`, `hasComponent()`, `listComponents()`
- **Parsing**: `parse()`, `serialize()`, `canParse()`
- **Layout**: `calculateLayout()`
- **Rendering**: `render()`, `endDocument()`
- **Factory Methods**: `createNodePDF()`, `createMinimal()`, `create()`

### NodeEnvironment Class

The `NodeEnvironment` class extends `EVGEnvironment` with Node.js specific features:

- **File Rendering**: `renderToFile(filename, evg, options)`
- **Stream Rendering**: `renderToStream(stream, evg, options)`
- **Buffer Rendering**: `renderToBuffer(evg, options)`
- **Factory Methods**: `createPDF()`, `createWithRenderer()`

### Usage Examples

#### Quick Start (Node.js PDF)

```typescript
import { NodeEnvironment } from "evg/environment/node";

// Create PDF environment with all defaults
const env = await NodeEnvironment.createPDF();

// Parse and render
const doc = env.parse('<View width="100%"><Label text="Hello World"/></View>');
await env.renderToFile("output.pdf", doc);
```

#### Custom Configuration

```typescript
import { EVGEnvironment } from "evg/environment";
import { PDFRenderer } from "evg/renderers";
import { NodeFontProvider } from "evg/providers";
import { NodeXMLSerializer } from "evg/serializers";

const env = EVGEnvironment.create({
  renderer: new PDFRenderer(),
  serializer: new NodeXMLSerializer(),
  fontProvider: new NodeFontProvider(),
  defaultWidth: 800,
  defaultHeight: 600,
});

// Register custom fonts and components
env.registerFont("MyFont", "/path/to/font.ttf");
env.registerComponent("Button", '<View background-color="blue"/>');

// Parse and render
const doc = env.parse("<View><Button/></View>");
env.render(doc);
```

### Test Results

- **112 tests passing** (22 core + 20 EVGEnvironment + 8 NodeEnvironment + 20 renderer + 25 serializer + 17 provider)
- Build successful
