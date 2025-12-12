/**
 * Abstract Serializer
 *
 * Base implementation of ISerializer for parsing and serializing EVG objects.
 * Concrete implementations handle XML (xmldom for Node.js, native DOMParser for browser).
 */

import {
  ISerializer,
  ISerializerContext,
  IEVG,
  EVGParseError,
} from "./interfaces";

/**
 * Abstract base class for serializers
 */
export abstract class AbstractSerializer implements ISerializer {
  /**
   * Parse input string into EVG object tree
   * Must be implemented by subclasses
   */
  abstract parse(input: string, context?: ISerializerContext): IEVG;

  /**
   * Serialize EVG object tree back to string
   * Must be implemented by subclasses
   */
  abstract serialize(evg: IEVG): string;

  /**
   * Check if the serializer can handle the given input format
   */
  abstract canParse(input: string): boolean;

  /**
   * Helper to create parse error with location info
   */
  protected createParseError(
    message: string,
    line?: number,
    column?: number,
    source?: string
  ): EVGParseError {
    return new EVGParseError(message, line, column, source);
  }
}

/**
 * XML Serializer base class
 * Provides common XML parsing utilities
 */
export abstract class XMLSerializerBase extends AbstractSerializer {
  /**
   * Check if input looks like XML
   */
  canParse(input: string): boolean {
    const trimmed = input.trim();
    return trimmed.startsWith("<") && trimmed.endsWith(">");
  }

  /**
   * Escape XML special characters
   */
  protected escapeXML(text: string): string {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Unescape XML special characters
   */
  protected unescapeXML(text: string): string {
    return text
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&gt;/g, ">")
      .replace(/&lt;/g, "<")
      .replace(/&amp;/g, "&");
  }
}

/**
 * JSON Serializer for EVG objects
 * Alternative format for EVG definitions
 */
export class JSONSerializer extends AbstractSerializer {
  /**
   * Parse JSON string into EVG object tree
   */
  parse(input: string, _context?: ISerializerContext): IEVG {
    try {
      const parsed = JSON.parse(input);
      return this.validateAndNormalize(parsed);
    } catch (error) {
      throw this.createParseError(
        `Invalid JSON: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        undefined,
        undefined,
        input.slice(0, 100)
      );
    }
  }

  /**
   * Serialize EVG object tree to JSON string
   */
  serialize(evg: IEVG): string {
    return JSON.stringify(evg, null, 2);
  }

  /**
   * Check if input looks like JSON
   */
  canParse(input: string): boolean {
    const trimmed = input.trim();
    return (
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]"))
    );
  }

  /**
   * Validate and normalize parsed JSON to match IEVG interface
   */
  private validateAndNormalize(obj: unknown): IEVG {
    if (typeof obj !== "object" || obj === null) {
      throw this.createParseError("EVG must be an object");
    }

    const evg = obj as Record<string, unknown>;

    // Ensure required properties exist
    return {
      tagName: (evg.tagName as string) ?? null,
      items: Array.isArray(evg.items)
        ? evg.items.map((item) => this.validateAndNormalize(item))
        : [],
      ...evg,
    } as IEVG;
  }
}
