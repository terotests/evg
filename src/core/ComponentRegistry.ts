/**
 * Component Registry Implementation
 *
 * Manages reusable EVG component templates that can be referenced by name
 */

import { IComponentRegistry } from "./interfaces";

/**
 * Default implementation of IComponentRegistry
 * Stores component templates as XML strings keyed by name
 */
export class ComponentRegistry implements IComponentRegistry {
  private components: Map<string, string> = new Map();

  /**
   * Register a component template
   * @param name - Unique name for the component
   * @param template - XML template string
   */
  register(name: string, template: string): void {
    this.components.set(name, template);
  }

  /**
   * Get component template by name
   * @param name - Component name
   * @returns Template string or undefined if not found
   */
  get(name: string): string | undefined {
    return this.components.get(name);
  }

  /**
   * Check if a component is registered
   * @param name - Component name
   */
  has(name: string): boolean {
    return this.components.has(name);
  }

  /**
   * List all registered component names
   */
  list(): string[] {
    return Array.from(this.components.keys());
  }

  /**
   * Remove a component registration
   * @param name - Component name
   * @returns true if component was removed, false if it didn't exist
   */
  unregister(name: string): boolean {
    return this.components.delete(name);
  }

  /**
   * Clear all registered components
   */
  clear(): void {
    this.components.clear();
  }

  /**
   * Get the number of registered components
   */
  get size(): number {
    return this.components.size;
  }
}

/**
 * Global singleton component registry for backward compatibility
 */
let globalRegistry: ComponentRegistry | null = null;

export function getGlobalComponentRegistry(): ComponentRegistry {
  if (!globalRegistry) {
    globalRegistry = new ComponentRegistry();
  }
  return globalRegistry;
}

export function resetGlobalComponentRegistry(): void {
  globalRegistry = null;
}
