/**
 * EVG Core Interfaces
 *
 * These interfaces define the contracts for the EVG rendering system,
 * allowing different implementations for various environments (Node.js, browser, etc.)
 */

// ============================================================================
// Measurement Types
// ============================================================================

export interface TextMeasurement {
  width: number;
  height: number;
}

/**
 * IMeasurer - Interface for measuring text dimensions
 * Implementations: PDFKit measurer, Canvas measurer, browser DOM measurer
 */
export interface IMeasurer {
  measureText(
    text: string,
    fontFamily: string,
    fontSize: number
  ): TextMeasurement;

  /**
   * Measure an EVG element's custom size (for elements like Label that need text measurement)
   * Returns undefined if the element doesn't have a custom size
   */
  measureElement?(element: any): TextMeasurement | undefined;
}

// ============================================================================
// Drawing Options
// ============================================================================

export interface DrawOptions {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface TextOptions extends DrawOptions {
  fontFamily?: string;
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
  baseline?: "top" | "middle" | "bottom";
}

export interface GradientStop {
  offset: number; // 0 to 1
  color: string;
}

export interface LinearGradient {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stops: GradientStop[];
}

// ============================================================================
// Renderer Interface
// ============================================================================

/**
 * IRenderer - Interface for rendering EVG output
 * Implementations: PDFRenderer, CanvasRenderer, SVGRenderer, HTMLRenderer
 */
export interface IRenderer extends IMeasurer {
  // Document lifecycle
  beginDocument(width: number, height: number): void;
  endDocument(): void;
  addPage(width?: number, height?: number): void;

  // Drawing primitives
  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: DrawOptions
  ): void;

  drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    options?: DrawOptions
  ): void;

  drawText(text: string, x: number, y: number, options?: TextOptions): void;

  drawImage(
    source: string | ArrayBuffer,
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
    options?: DrawOptions
  ): void;

  drawLinearGradient(
    x: number,
    y: number,
    width: number,
    height: number,
    gradient: LinearGradient
  ): void;

  // State management
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  scale(sx: number, sy?: number): void;
  setClipRect(x: number, y: number, width: number, height: number): void;
  setOpacity(opacity: number): void;
}

// ============================================================================
// HTML Renderer Interface (extends IRenderer)
// ============================================================================

export type CSSMode = "inline" | "classes" | "styled-components";

export interface HTMLRendererConfig {
  cssMode?: CSSMode;
  cssPrefix?: string;
  useFlexbox?: boolean;
  responsive?: boolean;
  minify?: boolean;
  prettyPrint?: boolean;
}

/**
 * IHTMLRenderer - Extended renderer for HTML/CSS output
 */
export interface IHTMLRenderer extends IRenderer {
  toHTML(): string;
  toCSS(): string;
  toDocument(): string;
  toElement?(): HTMLElement;
  setConfig(config: HTMLRendererConfig): void;
  getConfig(): HTMLRendererConfig;
}

// ============================================================================
// SVG Renderer Interface (extends IRenderer)
// ============================================================================

export interface SVGRendererConfig {
  standalone?: boolean; // Include XML declaration
  prettyPrint?: boolean;
  includeViewBox?: boolean;
}

/**
 * ISVGRenderer - Extended renderer for SVG output
 */
export interface ISVGRenderer extends IRenderer {
  toSVG(): string;
  toDataURL(): string;
  setConfig(config: SVGRendererConfig): void;
}

// ============================================================================
// Serializer Interface
// ============================================================================

/**
 * Forward declaration for EVG type (actual implementation in types.ts)
 * This is a minimal interface - the actual EVG class has many more properties
 */
export interface IEVG {
  tagName: string | null;
  items: IEVG[];
  header?: IEVG;
  footer?: IEVG;
  text?: any;
  [key: string]: any; // Allow additional properties from the full EVG implementation
}

/**
 * ISerializer - Interface for parsing and serializing EVG objects
 * Implementations: XMLSerializer (xmldom/native), JSONSerializer
 */
export interface ISerializer {
  /**
   * Parse input string into EVG object tree
   */
  parse(input: string, context?: ISerializerContext): IEVG;

  /**
   * Serialize EVG object tree back to string
   */
  serialize(evg: IEVG): string;

  /**
   * Check if the serializer can handle the given input format
   */
  canParse(input: string): boolean;
}

export interface ISerializerContext {
  componentRegistry?: IComponentRegistry;
  fontProvider?: IFontProvider;
}

// ============================================================================
// Font Provider Interface
// ============================================================================

export type FontSource = string | ArrayBuffer | Uint8Array;

export interface FontInfo {
  name: string;
  source: FontSource;
  weight?: number | string;
  style?: "normal" | "italic";
}

/**
 * IFontProvider - Interface for font management
 * Implementations: NodeFontProvider (file system), BrowserFontProvider (FontFace API)
 */
export interface IFontProvider {
  /**
   * Register a font with the provider
   */
  registerFont(
    name: string,
    source: FontSource,
    options?: Partial<FontInfo>
  ): void;

  /**
   * Get font source by name
   */
  getFont(name: string): FontSource | null;

  /**
   * Check if a font is registered
   */
  hasFont(name: string): boolean;

  /**
   * List all registered font names
   */
  listFonts(): string[];

  /**
   * Get font info by name
   */
  getFontInfo(name: string): FontInfo | null;

  /**
   * Install bundled/shipped fonts (optional, Node.js specific)
   */
  installShippedFonts?(): Promise<void>;
}

// ============================================================================
// Component Registry Interface
// ============================================================================

/**
 * IComponentRegistry - Interface for managing reusable EVG components
 */
export interface IComponentRegistry {
  /**
   * Register a component template
   */
  register(name: string, template: string): void;

  /**
   * Get component template by name
   */
  get(name: string): string | undefined;

  /**
   * Check if a component is registered
   */
  has(name: string): boolean;

  /**
   * List all registered component names
   */
  list(): string[];

  /**
   * Remove a component registration
   */
  unregister(name: string): boolean;

  /**
   * Clear all registered components
   */
  clear(): void;
}

// ============================================================================
// Output Target Interface
// ============================================================================

/**
 * IOutputTarget - Interface for output destinations
 * Implementations: FileOutputTarget, StreamOutputTarget, BlobOutputTarget
 */
export interface IOutputTarget {
  write(data: Buffer | Uint8Array | string): void;
  end(): void | Promise<void>;
}

/**
 * IFileOutputTarget - File-based output target (Node.js)
 */
export interface IFileOutputTarget extends IOutputTarget {
  readonly filePath: string;
}

/**
 * IBlobOutputTarget - Blob-based output target (Browser)
 */
export interface IBlobOutputTarget extends IOutputTarget {
  getBlob(): Blob;
  getDataURL(): Promise<string>;
}

// ============================================================================
// Environment Interface
// ============================================================================

export interface EnvironmentConfig {
  renderer?: IRenderer;
  serializer?: ISerializer;
  fontProvider?: IFontProvider;
  componentRegistry?: IComponentRegistry;
}

/**
 * IEnvironment - Main environment interface that ties everything together
 */
export interface IEnvironment {
  readonly renderer: IRenderer;
  readonly serializer: ISerializer;
  readonly fonts: IFontProvider;
  readonly components: IComponentRegistry;

  /**
   * Parse input string to EVG object tree
   */
  parse(input: string): IEVG;

  /**
   * Render EVG to the configured renderer
   */
  render(evg: IEVG, width: number, height: number): void;

  /**
   * Render EVG to a file (Node.js)
   */
  renderToFile?(
    filePath: string,
    width: number,
    height: number,
    evg: IEVG,
    options?: RenderOptions
  ): Promise<void>;

  /**
   * Render EVG to a stream (Node.js)
   */
  renderToStream?(
    stream: IOutputTarget,
    width: number,
    height: number,
    evg: IEVG,
    options?: RenderOptions
  ): Promise<void>;
}

export interface RenderOptions {
  header?: (evg: IEVG) => IEVG;
  footer?: (evg: IEVG) => IEVG;
}

// ============================================================================
// Error Types
// ============================================================================

export class EVGParseError extends Error {
  constructor(
    message: string,
    public readonly line?: number,
    public readonly column?: number,
    public readonly source?: string
  ) {
    super(message);
    this.name = "EVGParseError";
  }
}

export class EVGRenderError extends Error {
  constructor(message: string, public readonly element?: IEVG) {
    super(message);
    this.name = "EVGRenderError";
  }
}
