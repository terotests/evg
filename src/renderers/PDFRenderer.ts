/**
 * PDFKit Renderer Implementation
 *
 * Implements IRenderer interface using PDFKit for PDF generation.
 * This is a Node.js-only renderer.
 */

import {
  AbstractRenderer,
  DrawOptions,
  TextOptions,
  LinearGradient,
  TextMeasurement,
  IFontProvider,
} from "../core";

// Import PDFKit with dynamic require for CommonJS compatibility
const PDFKit = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * Find the default font file path
 */
function findDefaultFont(): string {
  const fontPaths = [
    "fonts/Open_Sans/OpenSans-Regular.ttf",
    path.join(__dirname, "../fonts/Open_Sans/OpenSans-Regular.ttf"),
    path.join(__dirname, "../../fonts/Open_Sans/OpenSans-Regular.ttf"),
    path.join(process.cwd(), "fonts/Open_Sans/OpenSans-Regular.ttf"),
    path.join(
      process.cwd(),
      "node_modules/evg/dist/fonts/Open_Sans/OpenSans-Regular.ttf"
    ),
  ];

  // Add platform-specific paths
  if (process.env.APPDATA) {
    fontPaths.push(
      path.join(
        process.env.APPDATA,
        "npm/node_modules/evg/dist/fonts/Open_Sans/OpenSans-Regular.ttf"
      )
    );
  } else if (process.env.HOME) {
    fontPaths.push(
      path.join(
        process.env.HOME,
        ".npm/node_modules/evg/dist/fonts/Open_Sans/OpenSans-Regular.ttf"
      )
    );
  }

  for (const fontPath of fontPaths) {
    try {
      if (fs.existsSync(fontPath)) {
        return fontPath;
      }
    } catch {
      // Continue trying other paths
    }
  }

  console.warn("Warning: Could not find OpenSans-Regular.ttf font file");
  return fontPaths[0];
}

/**
 * PDFKit-based renderer for generating PDF documents
 */
export class PDFRenderer extends AbstractRenderer {
  private doc: any = null;
  private fontProvider: IFontProvider | null = null;
  private defaultFont: string;
  private currentFont: string;
  private currentFontSize: number = 12;
  private currentColor: string = "#000000";
  private outputStream: any = null;

  constructor(fontProvider?: IFontProvider) {
    super();
    this.fontProvider = fontProvider ?? null;
    this.defaultFont = findDefaultFont();
    this.currentFont = this.defaultFont;
  }

  /**
   * Set the font provider
   */
  setFontProvider(fontProvider: IFontProvider): void {
    this.fontProvider = fontProvider;
  }

  // ============================================================================
  // Document Lifecycle
  // ============================================================================

  beginDocument(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.doc = new PDFKit({ size: [width, height] });
  }

  endDocument(): void {
    if (this.doc) {
      this.doc.save();
      this.doc.end();
    }
  }

  addPage(width?: number, height?: number): void {
    if (!this.doc) return;

    const pageWidth = width ?? this.width;
    const pageHeight = height ?? this.height;
    this.doc.addPage({ size: [pageWidth, pageHeight] });
  }

  /**
   * Pipe the document to a writable stream
   */
  pipe(stream: NodeJS.WritableStream): void {
    if (this.doc) {
      this.outputStream = stream;
      this.doc.pipe(stream);
    }
  }

  /**
   * Write document to a file
   */
  async writeToFile(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.doc) {
        reject(new Error("Document not initialized"));
        return;
      }

      const stream = fs.createWriteStream(filename);
      stream.on("finish", resolve);
      stream.on("error", reject);
      this.doc.pipe(stream);
    });
  }

  /**
   * Get the underlying PDFKit document (for advanced usage)
   */
  getDocument(): any {
    return this.doc;
  }

  // ============================================================================
  // Drawing Primitives
  // ============================================================================

  drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: DrawOptions
  ): void {
    if (!this.doc) return;

    const pos = this.applyTransform(x, y);
    this.applyDrawOptions(options);

    this.doc.rect(pos.x, pos.y, width, height);
    this.fillAndStroke(options);
  }

  drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    options?: DrawOptions
  ): void {
    if (!this.doc) return;

    const pos = this.applyTransform(x, y);
    this.applyDrawOptions(options);

    this.doc.roundedRect(pos.x, pos.y, width, height, radius);
    this.fillAndStroke(options);
  }

  drawText(text: string, x: number, y: number, options?: TextOptions): void {
    if (!this.doc) return;

    const pos = this.applyTransform(x, y);

    // Apply font settings
    const fontFamily = options?.fontFamily ?? "Helvetica";
    const fontSize = options?.fontSize ?? this.currentFontSize;
    const color = options?.color ?? this.currentColor;

    // Resolve font file
    const fontFile = this.resolveFont(fontFamily);
    this.doc.font(fontFile);
    this.doc.fontSize(fontSize);
    this.doc.fillColor(color);

    // Draw text
    this.doc.text(text, pos.x, pos.y, {
      lineGap: 0,
      paragraphGap: 0,
    });
  }

  drawImage(
    source: string | ArrayBuffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    if (!this.doc) return;

    const pos = this.applyTransform(x, y);

    this.doc.fillOpacity(1);
    this.doc.opacity(1);
    this.doc.image(source, pos.x, pos.y, { width, height });
  }

  drawPath(
    pathData: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: DrawOptions
  ): void {
    if (!this.doc) return;

    const pos = this.applyTransform(x, y);
    this.applyDrawOptions(options);

    // Scale path to fit dimensions
    const scaledPath = this.scalePath(pathData, width, height);

    this.doc.save();
    this.doc.translate(pos.x, pos.y);
    this.doc.path(scaledPath);
    this.fillAndStroke(options);
    this.doc.restore();
  }

  drawLinearGradient(
    x: number,
    y: number,
    width: number,
    height: number,
    gradient: LinearGradient
  ): void {
    if (!this.doc) return;

    const pos = this.applyTransform(x, y);

    // Create gradient
    const grad = this.doc.linearGradient(
      pos.x + gradient.x1 * width,
      pos.y + gradient.y1 * height,
      pos.x + gradient.x2 * width,
      pos.y + gradient.y2 * height
    );

    for (const stop of gradient.stops) {
      grad.stop(stop.offset, stop.color);
    }

    this.doc.rect(pos.x, pos.y, width, height);
    this.doc.fill(grad);
  }

  // ============================================================================
  // Text Measurement
  // ============================================================================

  measureText(
    text: string,
    fontFamily: string,
    fontSize: number
  ): TextMeasurement {
    if (!this.doc) {
      // Return approximate measurement if no document
      return {
        width: text.length * fontSize * 0.6,
        height: fontSize * 1.2,
      };
    }

    const fontFile = this.resolveFont(fontFamily);
    this.doc.font(fontFile);
    this.doc.fontSize(fontSize);

    return {
      width: this.doc.widthOfString(text),
      height: fontSize,
    };
  }

  /**
   * Measure an EVG element's custom size (for elements like Label that need text measurement)
   * This implements IMeasurer.measureElement for EVG layout compatibility
   */
  measureElement(element: any): TextMeasurement | undefined {
    // Only measure Label elements
    if (element.tagName !== "Label") {
      return undefined;
    }

    if (!this.doc) {
      return undefined;
    }

    // Get font family
    let fontFile = this.defaultFont;
    if (element.fontFamily?.is_set) {
      const resolvedFont = element.findFont?.(element.fontFamily.s_value);
      if (resolvedFont) {
        fontFile = resolvedFont;
      } else {
        fontFile = this.resolveFont(element.fontFamily.s_value);
      }
    }

    // Get font size
    const fontSize = element.fontSize?.is_set
      ? element.fontSize.pixels || element.fontSize.f_value || 12
      : 12;

    // Set font and measure
    this.doc.font(fontFile);
    this.doc.fontSize(fontSize);

    const text = element.text?.s_value ?? "";
    return {
      width: this.doc.widthOfString(text),
      height: fontSize,
    };
  }

  // ============================================================================
  // State Management Overrides
  // ============================================================================

  save(): void {
    super.save();
    if (this.doc) {
      this.doc.save();
    }
  }

  restore(): void {
    super.restore();
    if (this.doc) {
      this.doc.restore();
    }
  }

  translate(x: number, y: number): void {
    super.translate(x, y);
    if (this.doc) {
      this.doc.translate(x, y);
    }
  }

  rotate(angle: number): void {
    super.rotate(angle);
    if (this.doc) {
      this.doc.rotate(angle);
    }
  }

  scale(sx: number, sy?: number): void {
    super.scale(sx, sy);
    if (this.doc) {
      this.doc.scale(sx, sy ?? sx);
    }
  }

  setOpacity(opacity: number): void {
    super.setOpacity(opacity);
    if (this.doc) {
      this.doc.fillOpacity(opacity);
      this.doc.strokeOpacity(opacity);
    }
  }

  setClipRect(x: number, y: number, width: number, height: number): void {
    super.setClipRect(x, y, width, height);
    if (this.doc) {
      const pos = this.applyTransform(x, y);
      this.doc.rect(pos.x, pos.y, width, height);
      this.doc.clip();
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private resolveFont(fontFamily: string): string {
    // First check font provider
    if (this.fontProvider) {
      const fontSource = this.fontProvider.getFont(fontFamily);
      if (fontSource && typeof fontSource === "string") {
        return fontSource;
      }
    }

    // Fall back to default font
    return this.defaultFont;
  }

  private applyDrawOptions(options?: DrawOptions): void {
    if (!this.doc || !options) return;

    const opacity = options.opacity ?? this.getOpacity();

    if (options.fillColor) {
      this.doc.fillColor(options.fillColor, opacity);
    } else {
      this.doc.fillColor("white", 0);
    }

    if (options.strokeColor) {
      this.doc.strokeColor(options.strokeColor, opacity);
      this.doc.lineWidth(options.strokeWidth ?? 1);
    } else {
      this.doc.strokeColor("white", 0);
    }
  }

  private fillAndStroke(options?: DrawOptions): void {
    if (!this.doc) return;

    const hasFill = options?.fillColor;
    const hasStroke = options?.strokeColor && (options?.strokeWidth ?? 0) > 0;

    if (hasFill && hasStroke) {
      this.doc.fillAndStroke();
    } else if (hasFill) {
      this.doc.fill();
    } else if (hasStroke) {
      this.doc.stroke();
    } else {
      this.doc.fillAndStroke();
    }
  }

  private scalePath(pathData: string, width: number, height: number): string {
    // Import path utilities dynamically to avoid circular dependencies
    try {
      const { EVGPathParser, PathScaler } = require("../svg/path");
      const parser = new EVGPathParser();
      const scaler = new PathScaler();
      parser.parsePath(pathData, scaler);
      return scaler.getString(width, height);
    } catch {
      // Return original path if scaling fails
      return pathData;
    }
  }
}
