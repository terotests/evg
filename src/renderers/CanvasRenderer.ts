/**
 * Canvas Renderer for EVG
 *
 * Implements IRenderer using HTML5 Canvas API for browser rendering.
 */

import {
  AbstractRenderer,
  DrawOptions,
  TextOptions,
  LinearGradient,
  TextMeasurement,
} from "../core";

/**
 * CanvasRenderer - Browser-based renderer using HTML5 Canvas
 */
export class CanvasRenderer extends AbstractRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  constructor(canvas: HTMLCanvasElement) {
    super();
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to get 2D rendering context");
    }
    this.ctx = ctx;
  }

  // ============================================================================
  // Document Lifecycle
  // ============================================================================

  beginDocument(width: number, height: number): void {
    this.width = width;
    this.height = height;

    // Set canvas size
    this.canvas.width = width;
    this.canvas.height = height;

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Reset state
    this.stateStack = [];
    this.currentState = this.createDefaultState();
  }

  endDocument(): void {
    // Nothing special needed for canvas
  }

  addPage(width?: number, height?: number): void {
    // Canvas doesn't support multiple pages
    // For now, just clear and resize
    const w = width ?? this.width;
    const h = height ?? this.height;
    this.canvas.width = w;
    this.canvas.height = h;
    this.ctx.clearRect(0, 0, w, h);
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
    const pos = this.applyTransform(x, y);

    this.ctx.save();
    this.applyOptions(options);

    if (options?.fillColor) {
      this.ctx.fillRect(pos.x, pos.y, width, height);
    }
    if (options?.strokeColor && options?.strokeWidth) {
      this.ctx.strokeRect(pos.x, pos.y, width, height);
    }

    this.ctx.restore();
  }

  drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    options?: DrawOptions
  ): void {
    const pos = this.applyTransform(x, y);

    this.ctx.save();
    this.applyOptions(options);

    // Draw rounded rectangle path
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x + radius, pos.y);
    this.ctx.lineTo(pos.x + width - radius, pos.y);
    this.ctx.quadraticCurveTo(
      pos.x + width,
      pos.y,
      pos.x + width,
      pos.y + radius
    );
    this.ctx.lineTo(pos.x + width, pos.y + height - radius);
    this.ctx.quadraticCurveTo(
      pos.x + width,
      pos.y + height,
      pos.x + width - radius,
      pos.y + height
    );
    this.ctx.lineTo(pos.x + radius, pos.y + height);
    this.ctx.quadraticCurveTo(
      pos.x,
      pos.y + height,
      pos.x,
      pos.y + height - radius
    );
    this.ctx.lineTo(pos.x, pos.y + radius);
    this.ctx.quadraticCurveTo(pos.x, pos.y, pos.x + radius, pos.y);
    this.ctx.closePath();

    if (options?.fillColor) {
      this.ctx.fill();
    }
    if (options?.strokeColor && options?.strokeWidth) {
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawText(text: string, x: number, y: number, options?: TextOptions): void {
    const pos = this.applyTransform(x, y);

    this.ctx.save();

    // Set font
    const fontSize = options?.fontSize ?? 14;
    const fontFamily = options?.fontFamily ?? "sans-serif";
    this.ctx.font = `${fontSize}px ${fontFamily}`;

    // Set color
    this.ctx.fillStyle = options?.color ?? "#000000";

    // Set opacity
    if (options?.opacity !== undefined) {
      this.ctx.globalAlpha = options.opacity;
    }

    // Set alignment
    this.ctx.textAlign = options?.align ?? "left";
    this.ctx.textBaseline = options?.baseline ?? "top";

    // Draw text
    this.ctx.fillText(text, pos.x, pos.y);

    this.ctx.restore();
  }

  drawImage(
    source: string | ArrayBuffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    const pos = this.applyTransform(x, y);

    if (typeof source === "string") {
      // Load image asynchronously
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, pos.x, pos.y, width, height);
      };
      img.src = source;
    } else {
      // ArrayBuffer - create blob URL
      const blob = new Blob([source]);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        this.ctx.drawImage(img, pos.x, pos.y, width, height);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }
  }

  drawPath(
    pathData: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: DrawOptions
  ): void {
    const pos = this.applyTransform(x, y);

    this.ctx.save();
    this.applyOptions(options);

    // Create Path2D from SVG path data
    const path = new Path2D(pathData);

    // Translate to position
    this.ctx.translate(pos.x, pos.y);

    if (options?.fillColor) {
      this.ctx.fill(path);
    }
    if (options?.strokeColor && options?.strokeWidth) {
      this.ctx.stroke(path);
    }

    this.ctx.restore();
  }

  drawLinearGradient(
    x: number,
    y: number,
    width: number,
    height: number,
    gradient: LinearGradient
  ): void {
    const pos = this.applyTransform(x, y);

    this.ctx.save();

    // Create gradient
    const grad = this.ctx.createLinearGradient(
      pos.x + gradient.x1 * width,
      pos.y + gradient.y1 * height,
      pos.x + gradient.x2 * width,
      pos.y + gradient.y2 * height
    );

    for (const stop of gradient.stops) {
      grad.addColorStop(stop.offset, stop.color);
    }

    this.ctx.fillStyle = grad;
    this.ctx.fillRect(pos.x, pos.y, width, height);

    this.ctx.restore();
  }

  // ============================================================================
  // Text Measurement
  // ============================================================================

  measureText(
    text: string,
    fontFamily: string,
    fontSize: number
  ): TextMeasurement {
    this.ctx.save();
    this.ctx.font = `${fontSize}px ${fontFamily}`;
    const metrics = this.ctx.measureText(text);
    this.ctx.restore();

    return {
      width: metrics.width,
      height: fontSize * 1.2, // Approximate line height
    };
  }

  /**
   * Measure an EVG element (for Label elements)
   */
  measureElement(element: any): TextMeasurement | undefined {
    if (element.tagName !== "Label") {
      return undefined;
    }

    const text = element.text?.s_value ?? "";
    const fontSize = element.fontSize?.is_set
      ? element.fontSize.pixels || element.fontSize.f_value || 12
      : 12;
    const fontFamily = element.fontFamily?.is_set
      ? element.fontFamily.s_value
      : "sans-serif";

    return this.measureText(text, fontFamily, fontSize);
  }

  // ============================================================================
  // State Management
  // ============================================================================

  save(): void {
    super.save();
    this.ctx.save();
  }

  restore(): void {
    super.restore();
    this.ctx.restore();
  }

  translate(x: number, y: number): void {
    super.translate(x, y);
    this.ctx.translate(x, y);
  }

  rotate(angle: number): void {
    super.rotate(angle);
    this.ctx.rotate((angle * Math.PI) / 180);
  }

  scale(sx: number, sy?: number): void {
    super.scale(sx, sy);
    this.ctx.scale(sx, sy ?? sx);
  }

  setOpacity(opacity: number): void {
    super.setOpacity(opacity);
    this.ctx.globalAlpha = opacity;
  }

  setClipRect(x: number, y: number, width: number, height: number): void {
    const pos = this.applyTransform(x, y);
    this.ctx.beginPath();
    this.ctx.rect(pos.x, pos.y, width, height);
    this.ctx.clip();
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private applyOptions(options?: DrawOptions): void {
    if (options?.fillColor) {
      this.ctx.fillStyle = options.fillColor;
    }
    if (options?.strokeColor) {
      this.ctx.strokeStyle = options.strokeColor;
    }
    if (options?.strokeWidth) {
      this.ctx.lineWidth = options.strokeWidth;
    }
    if (options?.opacity !== undefined) {
      this.ctx.globalAlpha = options.opacity;
    }
  }

  // ============================================================================
  // Canvas-specific Methods
  // ============================================================================

  /**
   * Get the canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Get the 2D rendering context
   */
  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * Export canvas to data URL
   */
  toDataURL(type?: string, quality?: number): string {
    return this.canvas.toDataURL(type, quality);
  }

  /**
   * Export canvas to Blob
   */
  toBlob(type?: string, quality?: number): Promise<Blob | null> {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, type, quality);
    });
  }

  /**
   * Clear the canvas
   */
  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
