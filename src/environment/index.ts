/**
 * EVG Environment
 *
 * The EVGEnvironment class bundles together all the dependencies needed
 * to parse, layout, and render EVG documents. This allows easy configuration
 * for different target environments (Node.js PDF, browser Canvas, etc.)
 */

import type {
  IRenderer,
  IMeasurer,
  ISerializer,
  IFontProvider,
  IComponentRegistry,
  IEVG,
} from "../core/interfaces";
import { ComponentRegistry } from "../core/ComponentRegistry";

/**
 * Configuration options for creating an EVG environment
 */
export interface EVGEnvironmentConfig {
  /** The renderer to use for output (required for rendering) */
  renderer?: IRenderer;

  /** The serializer to use for parsing EVG documents */
  serializer?: ISerializer;

  /** The font provider for font management */
  fontProvider?: IFontProvider;

  /** The component registry for reusable components */
  componentRegistry?: IComponentRegistry;

  /** Default document width */
  defaultWidth?: number;

  /** Default document height */
  defaultHeight?: number;
}

/**
 * Render options for document rendering
 */
export interface RenderOptions {
  /** Document width (overrides environment default) */
  width?: number;

  /** Document height (overrides environment default) */
  height?: number;

  /** Header generator function */
  header?: (evg: IEVG) => IEVG;

  /** Footer generator function */
  footer?: (evg: IEVG) => IEVG;
}

/**
 * EVGEnvironment - A complete environment for EVG document processing
 *
 * This class provides a unified interface for:
 * - Parsing EVG documents (XML, JSON)
 * - Managing fonts and components
 * - Calculating layouts
 * - Rendering to various outputs (PDF, Canvas, SVG, HTML)
 *
 * @example
 * ```typescript
 * // Node.js PDF environment
 * const env = EVGEnvironment.createNodePDF();
 * const doc = env.parse('<View width="100%"><Label text="Hello"/></View>');
 * await env.renderToFile('output.pdf', doc);
 *
 * // Browser Canvas environment (future)
 * const env = EVGEnvironment.createBrowserCanvas(canvas);
 * const doc = env.parse('<View><Label text="Hello"/></View>');
 * env.render(doc);
 * ```
 */
export class EVGEnvironment {
  private _renderer: IRenderer | null = null;
  private _serializer: ISerializer | null = null;
  private _fontProvider: IFontProvider | null = null;
  private _componentRegistry: IComponentRegistry;
  private _defaultWidth: number = 612; // Letter size width in points
  private _defaultHeight: number = 792; // Letter size height in points

  constructor(config: EVGEnvironmentConfig = {}) {
    this._renderer = config.renderer ?? null;
    this._serializer = config.serializer ?? null;
    this._fontProvider = config.fontProvider ?? null;
    this._componentRegistry =
      config.componentRegistry ?? new ComponentRegistry();
    this._defaultWidth = config.defaultWidth ?? 612;
    this._defaultHeight = config.defaultHeight ?? 792;
  }

  // ============================================================================
  // Getters and Setters
  // ============================================================================

  get renderer(): IRenderer | null {
    return this._renderer;
  }

  set renderer(value: IRenderer | null) {
    this._renderer = value;
  }

  get serializer(): ISerializer | null {
    return this._serializer;
  }

  set serializer(value: ISerializer | null) {
    this._serializer = value;
  }

  get fontProvider(): IFontProvider | null {
    return this._fontProvider;
  }

  set fontProvider(value: IFontProvider | null) {
    this._fontProvider = value;
  }

  get componentRegistry(): IComponentRegistry {
    return this._componentRegistry;
  }

  set componentRegistry(value: IComponentRegistry) {
    this._componentRegistry = value;
  }

  get defaultWidth(): number {
    return this._defaultWidth;
  }

  set defaultWidth(value: number) {
    this._defaultWidth = value;
  }

  get defaultHeight(): number {
    return this._defaultHeight;
  }

  set defaultHeight(value: number) {
    this._defaultHeight = value;
  }

  /**
   * Get the measurer interface (typically the renderer)
   */
  get measurer(): IMeasurer | null {
    return this._renderer as IMeasurer | null;
  }

  // ============================================================================
  // Font Management
  // ============================================================================

  /**
   * Register a font with the environment
   */
  registerFont(name: string, source: string | ArrayBuffer): void {
    if (this._fontProvider) {
      this._fontProvider.registerFont(name, source);
    }
  }

  /**
   * Get a registered font
   */
  getFont(name: string): string | ArrayBuffer | null {
    return this._fontProvider?.getFont(name) ?? null;
  }

  /**
   * List all registered fonts
   */
  listFonts(): string[] {
    return this._fontProvider?.listFonts() ?? [];
  }

  /**
   * Install shipped fonts (Node.js only)
   */
  async installShippedFonts(): Promise<void> {
    if (this._fontProvider?.installShippedFonts) {
      await this._fontProvider.installShippedFonts();
    }
  }

  // ============================================================================
  // Component Management
  // ============================================================================

  /**
   * Register a reusable component
   */
  registerComponent(name: string, definition: string): void {
    this._componentRegistry.register(name, definition);
  }

  /**
   * Get a registered component definition
   */
  getComponent(name: string): string | undefined {
    return this._componentRegistry.get(name);
  }

  /**
   * Check if a component is registered
   */
  hasComponent(name: string): boolean {
    return this._componentRegistry.has(name);
  }

  /**
   * List all registered components
   */
  listComponents(): string[] {
    return this._componentRegistry.list();
  }

  // ============================================================================
  // Parsing
  // ============================================================================

  /**
   * Check if the serializer can parse the given input
   */
  canParse(input: string): boolean {
    return this._serializer?.canParse(input) ?? false;
  }

  /**
   * Parse an EVG document from string (XML or JSON)
   * @param input - The EVG document string
   * @returns The parsed EVG object
   * @throws EVGParseError if parsing fails
   */
  parse(input: string): IEVG {
    if (!this._serializer) {
      throw new Error("No serializer configured for this environment");
    }
    return this._serializer.parse(input);
  }

  /**
   * Serialize an EVG object to string
   */
  serialize(evg: IEVG): string {
    if (!this._serializer) {
      throw new Error("No serializer configured for this environment");
    }
    return this._serializer.serialize(evg);
  }

  // ============================================================================
  // Layout Calculation
  // ============================================================================

  /**
   * Calculate layout for an EVG document
   * @param evg - The EVG document to calculate layout for
   * @param width - Document width (default: environment default)
   * @param height - Document height (default: environment default)
   */
  calculateLayout(evg: IEVG, width?: number, height?: number): void {
    const w = width ?? this._defaultWidth;
    const h = height ?? this._defaultHeight;

    // Use the renderer as the measurer if available
    const measurer = this._renderer as IMeasurer | undefined;
    if (evg.calculate && measurer) {
      evg.calculate(w, h, measurer);
    }
  }

  // ============================================================================
  // Rendering (Abstract - implemented by specific environments)
  // ============================================================================

  /**
   * Render an EVG document using the configured renderer
   * @param evg - The EVG document to render
   * @param options - Render options
   */
  render(evg: IEVG, options: RenderOptions = {}): void {
    if (!this._renderer) {
      throw new Error("No renderer configured for this environment");
    }

    const width = options.width ?? this._defaultWidth;
    const height = options.height ?? this._defaultHeight;

    // Begin document
    this._renderer.beginDocument(width, height);

    // Calculate layout
    this.calculateLayout(evg, width, height);

    // The actual rendering is delegated to specific environment implementations
    // This base implementation just sets up the document
  }

  /**
   * End the current document rendering
   */
  endDocument(): void {
    if (this._renderer) {
      this._renderer.endDocument();
    }
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  /**
   * Create a Node.js PDF environment
   * Lazily imports Node.js specific modules
   */
  static async createNodePDF(
    options: {
      width?: number;
      height?: number;
      installFonts?: boolean;
    } = {}
  ): Promise<EVGEnvironment> {
    // Dynamically import Node.js specific modules
    const { PDFRenderer } = await import("../renderers/PDFRenderer");
    const { NodeFontProvider } = await import("../providers/NodeFontProvider");
    const { NodeXMLSerializer } = await import("../serializers/XMLSerializer");

    const fontProvider = new NodeFontProvider();
    const renderer = new PDFRenderer(fontProvider);
    const serializer = new NodeXMLSerializer();

    const env = new EVGEnvironment({
      renderer,
      serializer,
      fontProvider,
      defaultWidth: options.width ?? 612,
      defaultHeight: options.height ?? 792,
    });

    // Install shipped fonts if requested (default: true)
    if (options.installFonts !== false) {
      await fontProvider.installShippedFonts();
    }

    return env;
  }

  /**
   * Create a minimal environment for testing (no renderer)
   */
  static createMinimal(): EVGEnvironment {
    return new EVGEnvironment();
  }

  /**
   * Create an environment with a custom configuration
   */
  static create(config: EVGEnvironmentConfig): EVGEnvironment {
    return new EVGEnvironment(config);
  }
}
