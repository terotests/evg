/**
 * Abstract Font Provider
 *
 * Base implementation of IFontProvider with common functionality.
 * Concrete implementations extend this for Node.js (file system) or browser (FontFace API).
 */

import { IFontProvider, FontSource, FontInfo } from "./interfaces";

/**
 * Abstract base class for font providers
 */
export abstract class AbstractFontProvider implements IFontProvider {
  protected fonts: Map<string, FontInfo> = new Map();

  /**
   * Register a font with the provider
   * @param name - Font family name
   * @param source - Font source (path, ArrayBuffer, or Uint8Array)
   * @param options - Additional font options
   */
  registerFont(
    name: string,
    source: FontSource,
    options?: Partial<FontInfo>
  ): void {
    const fontInfo: FontInfo = {
      name,
      source,
      weight: options?.weight ?? 400,
      style: options?.style ?? "normal",
    };
    this.fonts.set(name, fontInfo);
  }

  /**
   * Get font source by name
   * @param name - Font family name
   * @returns Font source or null if not found
   */
  getFont(name: string): FontSource | null {
    const info = this.fonts.get(name);
    return info?.source ?? null;
  }

  /**
   * Check if a font is registered
   * @param name - Font family name
   */
  hasFont(name: string): boolean {
    return this.fonts.has(name);
  }

  /**
   * List all registered font names
   */
  listFonts(): string[] {
    return Array.from(this.fonts.keys());
  }

  /**
   * Get font info by name
   * @param name - Font family name
   * @returns Font info or null if not found
   */
  getFontInfo(name: string): FontInfo | null {
    return this.fonts.get(name) ?? null;
  }

  /**
   * Get the number of registered fonts
   */
  get size(): number {
    return this.fonts.size;
  }

  /**
   * Clear all registered fonts
   */
  clear(): void {
    this.fonts.clear();
  }
}

/**
 * Simple in-memory font provider
 * Used when no file system access is needed (e.g., fonts loaded from network)
 */
export class MemoryFontProvider extends AbstractFontProvider {
  // No additional implementation needed - base class handles everything
}

/**
 * Global singleton font registry for backward compatibility
 */
let globalFontProvider: AbstractFontProvider | null = null;

export function getGlobalFontProvider(): AbstractFontProvider {
  if (!globalFontProvider) {
    globalFontProvider = new MemoryFontProvider();
  }
  return globalFontProvider;
}

export function setGlobalFontProvider(provider: AbstractFontProvider): void {
  globalFontProvider = provider;
}

export function resetGlobalFontProvider(): void {
  globalFontProvider = null;
}
