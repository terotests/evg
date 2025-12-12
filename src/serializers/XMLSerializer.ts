/**
 * XML Serializer for EVG
 *
 * Provides XML parsing and serialization using xmldom (Node.js).
 * For browser environments, use BrowserXMLSerializer which uses native DOMParser.
 */

import {
  XMLSerializerBase,
  IEVG,
  ISerializerContext,
  EVGParseError,
  IComponentRegistry,
} from "../core";

// Import xmldom for Node.js environment
const { DOMParser, XMLSerializer: XMLSerializerImpl } = require("xmldom");

/**
 * Attribute name mappings from XML to EVG properties
 */
const ATTRIBUTE_ALIASES: Record<string, string> = {
  "background-color": "backgroundColor",
  "border-width": "borderWidth",
  "border-color": "borderColor",
  "border-radius": "borderRadius",
  "font-size": "fontSize",
  "font-family": "fontFamily",
  "margin-left": "marginLeft",
  "margin-right": "marginRight",
  "margin-top": "marginTop",
  "margin-bottom": "marginBottom",
  "padding-left": "paddingLeft",
  "padding-right": "paddingRight",
  "padding-top": "paddingTop",
  "padding-bottom": "paddingBottom",
  "vertical-align": "verticalAlign",
  "inner-width": "innerWidth",
  "inner-height": "innerHeight",
  "line-break": "lineBreak",
  "page-break": "pageBreak",
  "image-url": "imageUrl",
  "svg-path": "svgPath",
  "view-box": "viewBox",
  "linear-gradient": "linearGradient",
  "v-color-slide": "vColorSlide",
  "v-color-slide-break": "vColorSlideBreak",
  "v-color-slide-top": "vColorSlideTop",
  "v-color-slide-bottom": "vColorSlideBottom",
  "shadow-color": "shadowColor",
  "shadow-offset-x": "shadowOffsetX",
  "shadow-offset-y": "shadowOffsetY",
  "shadow-blur": "shadowBlur",
  "shadow-opacity": "shadowOpacity",
  "shadow-radius": "shadowRadius",
};

/**
 * Node.js XML Serializer using xmldom
 */
export class NodeXMLSerializer extends XMLSerializerBase {
  private componentRegistry: IComponentRegistry | null = null;
  private context: any = null;

  constructor(componentRegistry?: IComponentRegistry) {
    super();
    this.componentRegistry = componentRegistry ?? null;
  }

  /**
   * Set the component registry
   */
  setComponentRegistry(registry: IComponentRegistry): void {
    this.componentRegistry = registry;
  }

  /**
   * Set context for object references
   */
  setContext(context: any): void {
    this.context = context;
  }

  /**
   * Parse XML string into EVG object tree
   */
  parse(input: string, context?: ISerializerContext): IEVG {
    if (context?.componentRegistry) {
      this.componentRegistry = context.componentRegistry;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(input, "text/xml");

      // Check for parse errors
      const parseError = xmlDoc.getElementsByTagName("parsererror");
      if (parseError.length > 0) {
        throw this.createParseError(
          "XML parse error: " + parseError[0].textContent,
          undefined,
          undefined,
          input.slice(0, 100)
        );
      }

      const rootNode = xmlDoc.childNodes[0];
      if (!rootNode) {
        throw this.createParseError("Empty XML document");
      }

      return this.readXMLNode(rootNode, null) as IEVG;
    } catch (error) {
      if (error instanceof EVGParseError) {
        throw error;
      }
      throw this.createParseError(
        `XML parse error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        undefined,
        undefined,
        input.slice(0, 100)
      );
    }
  }

  /**
   * Serialize EVG object tree to XML string
   */
  serialize(evg: IEVG): string {
    return this.serializeNode(evg, 0);
  }

  /**
   * Read an XML node and convert to EVG object
   */
  private readXMLNode(
    node: any,
    parentNode: IEVG | null
  ): IEVG | IEVG[] | null {
    // Element node
    if (node.nodeType === 1) {
      return this.readElementNode(node, parentNode);
    }

    // Text node or CDATA
    if (node.nodeType === 3 || node.nodeType === 4) {
      return this.readTextNode(node);
    }

    return null;
  }

  /**
   * Read an element node
   */
  private readElementNode(node: any, parentNode: IEVG | null): IEVG {
    const tagName = node.nodeName;
    const attributes = this.readAttributes(node);

    // Check for component
    let evg: IEVG;
    let contentTarget: IEVG;
    let isComponent = false;

    const componentTemplate = this.findComponent(tagName);
    if (componentTemplate) {
      // Parse component template
      evg = this.parse(componentTemplate) as IEVG;
      contentTarget = this.findContentTarget(evg) || evg;
      this.applyAttributes(evg, attributes);
      isComponent = true;
    } else {
      evg = this.createEVGNode(tagName, attributes);
      contentTarget = evg;
    }

    // Store ID reference in context
    if (attributes.id && this.context) {
      this.context.set_object(attributes.id, evg);
    }

    // Inherit properties from parent
    if (parentNode) {
      this.inheritProperties(evg, parentNode);
    }

    // Process child nodes
    for (let i = 0; i < node.childNodes.length; i++) {
      const childNode = node.childNodes[i];
      const childEVG = this.readXMLNode(childNode, evg);

      if (Array.isArray(childEVG)) {
        // Text nodes return arrays of Label nodes
        for (const child of childEVG) {
          this.inheritProperties(child, contentTarget);
          contentTarget.items.push(child);
        }
      } else if (childEVG) {
        // Handle special nodes
        if (childEVG.tagName === "component") {
          this.registerComponentFromNode(childNode, childEVG);
          continue;
        }
        if (childEVG.tagName === "header") {
          evg.header = childEVG;
          continue;
        }
        if (childEVG.tagName === "footer") {
          evg.footer = childEVG;
          continue;
        }

        contentTarget.items.push(childEVG);
      }
    }

    return evg;
  }

  /**
   * Read a text node and convert to Label nodes
   */
  private readTextNode(node: any): IEVG[] | null {
    const text = node.nodeValue?.trim();
    if (!text) return null;

    // Split text into words and create Label nodes
    const words = text.split(/\s+/).filter((w: string) => w.length > 0);

    return words.map((word: string, index: number, arr: string[]) => {
      const labelNode = this.createEVGNode("Label", {});
      labelNode.text = {
        unit: 0,
        is_set: true,
        pixels: 0,
        f_value: 0,
        s_value: word + (index < arr.length - 1 ? " " : ""),
      };
      return labelNode;
    });
  }

  /**
   * Read attributes from an XML node
   */
  private readAttributes(node: any): Record<string, string> {
    const attrs: Record<string, string> = {};

    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes[i];
      const name = attr.nodeName;
      const value = attr.nodeValue;

      // Handle style attribute
      if (name === "style") {
        const styles = value.split(";");
        for (const style of styles) {
          const [key, val] = style.split(":").map((s: string) => s.trim());
          if (key && val) {
            attrs[this.normalizeAttributeName(key)] = val;
          }
        }
      } else {
        attrs[this.normalizeAttributeName(name)] = value;
      }
    }

    return attrs;
  }

  /**
   * Normalize attribute name (convert kebab-case to camelCase)
   */
  private normalizeAttributeName(name: string): string {
    return ATTRIBUTE_ALIASES[name] || name;
  }

  /**
   * Create a new EVG node with the given tag name and attributes
   */
  private createEVGNode(
    tagName: string,
    attributes: Record<string, string>
  ): IEVG {
    const node: IEVG = {
      tagName,
      items: [],
    };

    this.applyAttributes(node, attributes);
    return node;
  }

  /**
   * Apply attributes to an EVG node
   */
  private applyAttributes(
    node: IEVG,
    attributes: Record<string, string>
  ): void {
    for (const [key, value] of Object.entries(attributes)) {
      (node as any)[key] = this.parseAttributeValue(key, value);
    }
  }

  /**
   * Parse an attribute value based on the attribute name
   */
  private parseAttributeValue(name: string, value: string): any {
    // Color attributes
    if (name.toLowerCase().includes("color")) {
      return {
        unit: 0,
        is_set: true,
        f_value: 0,
        s_value: value,
        color: value,
      };
    }

    // Boolean attributes
    if (value === "true" || value === "false") {
      return {
        unit: 0,
        is_set: true,
        b_value: value === "true",
        s_value: value,
      };
    }

    // Numeric/dimension values
    const parsed = this.parseValueWithUnit(value);
    if (parsed) {
      return parsed;
    }

    // String value
    return {
      unit: 0,
      is_set: true,
      pixels: 0,
      f_value: 0,
      s_value: value,
    };
  }

  /**
   * Parse a value with unit (e.g., "100px", "50%", "2em")
   */
  private parseValueWithUnit(value: string): any | null {
    const match = value.match(/^(-?\d*\.?\d+)(px|%|em|fill)?$/);
    if (!match) return null;

    const num = parseFloat(match[1]);
    const unit = match[2] || "px";

    const unitMap: Record<string, number> = {
      "%": 1,
      em: 2,
      px: 3,
      vh: 4,
      fill: 5,
    };

    return {
      unit: unitMap[unit] || 3,
      is_set: true,
      pixels: unit === "px" ? num : 0,
      f_value: num,
      s_value: value,
    };
  }

  /**
   * Find a component by name
   */
  private findComponent(name: string): string | undefined {
    return this.componentRegistry?.get(name);
  }

  /**
   * Find the content target in a component (element with cname="content")
   */
  private findContentTarget(evg: IEVG): IEVG | null {
    if ((evg as any).cname?.s_value === "content") {
      return evg;
    }

    for (const child of evg.items) {
      const found = this.findContentTarget(child);
      if (found) return found;
    }

    return null;
  }

  /**
   * Register a component from a <component> node
   */
  private registerComponentFromNode(node: any, evg: IEVG): void {
    if (!this.componentRegistry) return;

    const id = (evg as any).id?.s_value;
    if (!id) return;

    // Find the first element child
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child.nodeType === 1) {
        const serializer = new XMLSerializerImpl();
        this.componentRegistry.register(
          id,
          serializer.serializeToString(child)
        );
        break;
      }
    }
  }

  /**
   * Inherit properties from parent node
   */
  private inheritProperties(child: IEVG, parent: IEVG): void {
    const inheritableProps = ["fontFamily", "fontSize", "color", "align"];

    for (const prop of inheritableProps) {
      const childProp = (child as any)[prop];
      const parentProp = (parent as any)[prop];

      if (parentProp?.is_set && !childProp?.is_set) {
        (child as any)[prop] = { ...parentProp };
      }
    }
  }

  /**
   * Serialize an EVG node to XML string
   */
  private serializeNode(node: IEVG, indent: number): string {
    const spaces = "  ".repeat(indent);
    const tagName = node.tagName || "View";

    // Collect non-default attributes
    const attrs = this.collectSerializableAttributes(node);
    const attrStr = Object.entries(attrs)
      .map(([key, value]) => `${key}="${this.escapeXML(String(value))}"`)
      .join(" ");

    const openTag = attrStr ? `<${tagName} ${attrStr}>` : `<${tagName}>`;

    if (node.items.length === 0) {
      return `${spaces}<${tagName}${attrStr ? " " + attrStr : ""}/>`;
    }

    const children = node.items
      .map((child) => this.serializeNode(child, indent + 1))
      .join("\n");

    return `${spaces}${openTag}\n${children}\n${spaces}</${tagName}>`;
  }

  /**
   * Collect attributes that should be serialized
   */
  private collectSerializableAttributes(node: IEVG): Record<string, string> {
    const attrs: Record<string, string> = {};
    const skipProps = [
      "tagName",
      "items",
      "calculated",
      "header",
      "footer",
      "metaTags",
      "eventHandlers",
    ];

    for (const [key, value] of Object.entries(node)) {
      if (skipProps.includes(key)) continue;
      if (value && typeof value === "object" && value.is_set) {
        if (value.s_value) {
          attrs[key] = value.s_value;
        } else if (value.color) {
          attrs[key] = value.color;
        } else if (typeof value.f_value === "number" && value.f_value !== 0) {
          attrs[key] = String(value.f_value);
        }
      }
    }

    return attrs;
  }
}

/**
 * Browser XML Serializer using native DOMParser
 * This is a placeholder - actual implementation would use window.DOMParser
 */
export class BrowserXMLSerializer extends XMLSerializerBase {
  parse(input: string, _context?: ISerializerContext): IEVG {
    // In browser, use native DOMParser
    if (typeof window !== "undefined" && window.DOMParser) {
      const parser = new window.DOMParser();
      const xmlDoc = parser.parseFromString(input, "text/xml");

      // Check for parse errors
      const parseError = xmlDoc.getElementsByTagName("parsererror");
      if (parseError.length > 0) {
        throw this.createParseError(
          "XML parse error: " + parseError[0].textContent,
          undefined,
          undefined,
          input.slice(0, 100)
        );
      }

      // For now, delegate to Node serializer logic
      // In a real implementation, this would have its own parsing
      throw this.createParseError("Browser serializer not fully implemented");
    }

    throw this.createParseError("DOMParser not available in this environment");
  }

  serialize(evg: IEVG): string {
    // Placeholder - would use XMLSerializer in browser
    throw new Error("Browser serializer not fully implemented");
  }
}

/**
 * Factory function to get the appropriate XML serializer
 */
export function createXMLSerializer(
  componentRegistry?: IComponentRegistry
): NodeXMLSerializer | BrowserXMLSerializer {
  // Check if we're in a browser environment
  if (typeof window !== "undefined" && window.DOMParser) {
    return new BrowserXMLSerializer();
  }

  // Default to Node.js serializer
  return new NodeXMLSerializer(componentRegistry);
}
