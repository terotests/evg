/**
 * Abstract Renderer
 *
 * Base implementation of IRenderer with common functionality.
 * Concrete implementations extend this for PDF, Canvas, SVG, or HTML output.
 */

import {
  IRenderer,
  DrawOptions,
  TextOptions,
  LinearGradient,
  TextMeasurement,
} from "./interfaces";

/**
 * Abstract base class for renderers
 * Provides common state management and utility methods
 */
export abstract class AbstractRenderer implements IRenderer {
  protected width: number = 0;
  protected height: number = 0;
  protected stateStack: RendererState[] = [];
  protected currentState: RendererState;

  constructor() {
    this.currentState = this.createDefaultState();
  }

  protected createDefaultState(): RendererState {
    return {
      translateX: 0,
      translateY: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      clipRect: null,
    };
  }

  // ============================================================================
  // Document Lifecycle - Must be implemented by subclasses
  // ============================================================================

  abstract beginDocument(width: number, height: number): void;
  abstract endDocument(): void;
  abstract addPage(width?: number, height?: number): void;

  // ============================================================================
  // Drawing Primitives - Must be implemented by subclasses
  // ============================================================================

  abstract drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options?: DrawOptions
  ): void;

  abstract drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    options?: DrawOptions
  ): void;

  abstract drawText(
    text: string,
    x: number,
    y: number,
    options?: TextOptions
  ): void;

  abstract drawImage(
    source: string | ArrayBuffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): void;

  abstract drawPath(
    pathData: string,
    x: number,
    y: number,
    width: number,
    height: number,
    options?: DrawOptions
  ): void;

  abstract drawLinearGradient(
    x: number,
    y: number,
    width: number,
    height: number,
    gradient: LinearGradient
  ): void;

  // ============================================================================
  // Text Measurement - Must be implemented by subclasses
  // ============================================================================

  abstract measureText(
    text: string,
    fontFamily: string,
    fontSize: number
  ): TextMeasurement;

  // ============================================================================
  // State Management - Common implementation
  // ============================================================================

  save(): void {
    this.stateStack.push({ ...this.currentState });
  }

  restore(): void {
    const state = this.stateStack.pop();
    if (state) {
      this.currentState = state;
    }
  }

  translate(x: number, y: number): void {
    this.currentState.translateX += x;
    this.currentState.translateY += y;
  }

  rotate(angle: number): void {
    this.currentState.rotation += angle;
  }

  scale(sx: number, sy?: number): void {
    this.currentState.scaleX *= sx;
    this.currentState.scaleY *= sy ?? sx;
  }

  setClipRect(x: number, y: number, width: number, height: number): void {
    this.currentState.clipRect = { x, y, width, height };
  }

  setOpacity(opacity: number): void {
    this.currentState.opacity = opacity;
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get current transform offset
   */
  protected getTransform(): { x: number; y: number } {
    return {
      x: this.currentState.translateX,
      y: this.currentState.translateY,
    };
  }

  /**
   * Apply current transform to coordinates
   */
  protected applyTransform(x: number, y: number): { x: number; y: number } {
    return {
      x: x + this.currentState.translateX,
      y: y + this.currentState.translateY,
    };
  }

  /**
   * Get current opacity
   */
  protected getOpacity(): number {
    return this.currentState.opacity;
  }

  /**
   * Get current clip rect
   */
  protected getClipRect(): ClipRect | null {
    return this.currentState.clipRect;
  }

  /**
   * Get document dimensions
   */
  getDocumentSize(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }
}

/**
 * Renderer state for save/restore
 */
interface RendererState {
  translateX: number;
  translateY: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  clipRect: ClipRect | null;
}

interface ClipRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Null renderer - does nothing, useful for testing layout calculations
 */
export class NullRenderer extends AbstractRenderer {
  private defaultFontSize = 14;
  private charWidthRatio = 0.6; // Approximate character width ratio

  beginDocument(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  endDocument(): void {
    // No-op
  }

  addPage(width?: number, height?: number): void {
    if (width) this.width = width;
    if (height) this.height = height;
  }

  drawRect(): void {
    // No-op
  }

  drawRoundedRect(): void {
    // No-op
  }

  drawText(): void {
    // No-op
  }

  drawImage(): void {
    // No-op
  }

  drawPath(): void {
    // No-op
  }

  drawLinearGradient(): void {
    // No-op
  }

  measureText(
    text: string,
    _fontFamily: string,
    fontSize: number
  ): TextMeasurement {
    // Simple approximation for testing
    const width = text.length * fontSize * this.charWidthRatio;
    const height = fontSize * 1.2;
    return { width, height };
  }
}
