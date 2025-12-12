/**
 * Node.js Environment for EVG
 *
 * Provides Node.js specific functionality like rendering to files and streams.
 */

import { EVGEnvironment, EVGEnvironmentConfig, RenderOptions } from "./index";
import type { IEVG } from "../core/interfaces";

// Node.js specific imports
import * as fs from "fs";
import * as path from "path";

/**
 * Options for file rendering
 */
export interface FileRenderOptions extends RenderOptions {
  /** File path to write to */
  filename: string;
}

/**
 * Options for stream rendering
 */
export interface StreamRenderOptions extends RenderOptions {
  /** Writable stream to pipe to */
  stream: NodeJS.WritableStream;
}

/**
 * NodeEnvironment - Node.js specific EVG environment
 *
 * Extends EVGEnvironment with file and stream rendering capabilities.
 *
 * @example
 * ```typescript
 * const env = await NodeEnvironment.create();
 * const doc = env.parse('<View><Label text="Hello"/></View>');
 * await env.renderToFile('output.pdf', doc);
 * ```
 */
export class NodeEnvironment extends EVGEnvironment {
  constructor(config: EVGEnvironmentConfig = {}) {
    super(config);
  }

  // ============================================================================
  // File and Stream Rendering
  // ============================================================================

  /**
   * Render EVG document to a file
   * @param filename - Output file path
   * @param evg - EVG document to render
   * @param options - Render options
   */
  async renderToFile(
    filename: string,
    evg: IEVG,
    options: RenderOptions = {}
  ): Promise<void> {
    if (!this.renderer) {
      throw new Error("No renderer configured for this environment");
    }

    const width = options.width ?? this.defaultWidth;
    const height = options.height ?? this.defaultHeight;

    // Calculate layout
    this.calculateLayout(evg, width, height);

    // Get the underlying document from the renderer
    const doc = (this.renderer as any).getDocument?.();
    if (!doc) {
      throw new Error("Renderer does not support document export");
    }

    // Create output stream and pipe
    const outputStream = fs.createWriteStream(filename);

    return new Promise((resolve, reject) => {
      outputStream.on("finish", () => resolve());
      outputStream.on("error", reject);

      doc.pipe(outputStream);

      // Render the document tree
      this.renderTree(evg, options);

      doc.end();
    });
  }

  /**
   * Render EVG document to a stream
   * @param stream - Output stream
   * @param evg - EVG document to render
   * @param options - Render options
   */
  async renderToStream(
    stream: NodeJS.WritableStream,
    evg: IEVG,
    options: RenderOptions = {}
  ): Promise<void> {
    if (!this.renderer) {
      throw new Error("No renderer configured for this environment");
    }

    const width = options.width ?? this.defaultWidth;
    const height = options.height ?? this.defaultHeight;

    // Calculate layout
    this.calculateLayout(evg, width, height);

    // Get the underlying document from the renderer
    const doc = (this.renderer as any).getDocument?.();
    if (!doc) {
      throw new Error("Renderer does not support document export");
    }

    return new Promise((resolve, reject) => {
      stream.on("finish", () => resolve());
      stream.on("error", reject);

      doc.pipe(stream);

      // Render the document tree
      this.renderTree(evg, options);

      doc.end();
    });
  }

  /**
   * Render EVG document to a Buffer
   * @param evg - EVG document to render
   * @param options - Render options
   */
  async renderToBuffer(
    evg: IEVG,
    options: RenderOptions = {}
  ): Promise<Buffer> {
    if (!this.renderer) {
      throw new Error("No renderer configured for this environment");
    }

    const width = options.width ?? this.defaultWidth;
    const height = options.height ?? this.defaultHeight;

    // Calculate layout
    this.calculateLayout(evg, width, height);

    // Get the underlying document from the renderer
    const doc = (this.renderer as any).getDocument?.();
    if (!doc) {
      throw new Error("Renderer does not support document export");
    }

    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Render the document tree
      this.renderTree(evg, options);

      doc.end();
    });
  }

  // ============================================================================
  // Internal Rendering
  // ============================================================================

  /**
   * Render the EVG tree using the configured renderer
   * This is called by the file/stream rendering methods
   */
  private renderTree(evg: IEVG, options: RenderOptions): void {
    // For now, delegate to the legacy rendering system
    // This will be refactored in a future phase to use the IRenderer interface directly
    const renderer = this.renderer as any;
    if (renderer.renderItem) {
      // Legacy PDFKit renderer path
      const headers = [options.header, options.footer];
      renderer.renderItem(evg, renderer.getDocument(), headers, true);
    }
  }

  // ============================================================================
  // Static Factory Methods
  // ============================================================================

  /**
   * Create a Node.js PDF environment
   */
  static async createPDF(
    options: {
      width?: number;
      height?: number;
      installFonts?: boolean;
    } = {}
  ): Promise<NodeEnvironment> {
    // Dynamically import Node.js specific modules
    const { PDFRenderer } = await import("../renderers/PDFRenderer");
    const { NodeFontProvider } = await import("../providers/NodeFontProvider");
    const { NodeXMLSerializer } = await import("../serializers/XMLSerializer");

    const fontProvider = new NodeFontProvider();
    const renderer = new PDFRenderer(fontProvider);
    const serializer = new NodeXMLSerializer();

    const env = new NodeEnvironment({
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
   * Create a Node.js environment with a custom renderer
   */
  static createWithRenderer(
    renderer: any,
    options: EVGEnvironmentConfig = {}
  ): NodeEnvironment {
    return new NodeEnvironment({
      ...options,
      renderer,
    });
  }
}
