/**
 * EVG Core Module
 *
 * Exports all interfaces, types, and utilities for the EVG system
 */

// Re-export everything from interfaces
export * from "./interfaces";

// Re-export everything from types
export * from "./types";

// Re-export component registry
export {
  ComponentRegistry,
  getGlobalComponentRegistry,
  resetGlobalComponentRegistry,
} from "./ComponentRegistry";

// Re-export font providers
export {
  AbstractFontProvider,
  MemoryFontProvider,
  getGlobalFontProvider,
  setGlobalFontProvider,
  resetGlobalFontProvider,
} from "./FontProvider";

// Re-export renderers
export { AbstractRenderer, NullRenderer } from "./AbstractRenderer";

// Re-export serializers
export {
  AbstractSerializer,
  XMLSerializerBase,
  JSONSerializer,
} from "./AbstractSerializer";
