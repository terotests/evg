/**
 * EVG Core Types
 *
 * Type definitions for the EVG layout and rendering system
 */

// ============================================================================
// Unit System
// ============================================================================

/**
 * Unit types supported by EVG
 */
export enum UnitType {
  None = 0,
  Pixels = 1,
  Percentage = 2,
  Em = 3,
  Fill = 4, // Flexible fill (like CSS flex: 1)
  Auto = 5,
}

/**
 * A dimension value with unit information
 */
export interface UnitValue {
  unit: UnitType;
  is_set: boolean;
  pixels: number;
  f_value: number; // Float value
  s_value: string; // String value
  b_value?: boolean; // Boolean value
  color?: string; // Color value
}

/**
 * Create a default UnitValue
 */
export function createUnitValue(defaults?: Partial<UnitValue>): UnitValue {
  return {
    unit: UnitType.None,
    is_set: false,
    pixels: 0,
    f_value: 0,
    s_value: "",
    ...defaults,
  };
}

// ============================================================================
// Calculated Dimensions
// ============================================================================

/**
 * Calculated layout dimensions after layout pass
 */
export interface UICalculated {
  x: number;
  y: number;
  width: number;
  height: number;
  render_width: number;
  render_height: number;
  width_override: number;
  lineBreak: boolean;
  absolute: boolean;
}

/**
 * Create a default UICalculated
 */
export function createUICalculated(): UICalculated {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    render_width: 0,
    render_height: 0,
    width_override: 0,
    lineBreak: false,
    absolute: false,
  };
}

// ============================================================================
// Render Position
// ============================================================================

import type { IRenderer } from "./interfaces";

/**
 * Position context during rendering
 */
export interface UIRenderPosition {
  x: number;
  y: number;
  renderer: IRenderer;
}

/**
 * Create a render position
 */
export function createRenderPosition(
  x: number,
  y: number,
  renderer: IRenderer
): UIRenderPosition {
  return { x, y, renderer };
}

// ============================================================================
// Gradient Types
// ============================================================================

export interface LinearGradientValue {
  is_set: boolean;
  colors: string[];
  stops: number[];
  s_value: string;
}

export function createLinearGradient(): LinearGradientValue {
  return {
    is_set: false,
    colors: [],
    stops: [],
    s_value: "",
  };
}

// ============================================================================
// Direction and Alignment
// ============================================================================

export type Direction = "row" | "column";
export type Align = "left" | "center" | "right" | "justify";
export type VerticalAlign = "top" | "middle" | "bottom";
export type Overflow = "visible" | "hidden" | "clip" | "page-break";

// ============================================================================
// EVG Node Interface
// ============================================================================

/**
 * Full EVG node interface - represents an element in the EVG tree
 */
export interface EVGNode {
  // Core properties
  tagName: string | null;
  items: EVGNode[];
  calculated: UICalculated;

  // Visibility
  isHidden: boolean;

  // Header/Footer
  header?: EVGNode;
  footer?: EVGNode;

  // Meta tags for custom attributes
  metaTags: Record<string, unknown>;

  // Event handlers (future use)
  eventHandlers: Record<string, unknown>;

  // Layout properties
  x: UnitValue;
  y: UnitValue;
  left: UnitValue;
  top: UnitValue;
  bottom: UnitValue;
  right: UnitValue;

  // Dimensions
  width: UnitValue;
  height: UnitValue;
  innerWidth: UnitValue;
  innerHeight: UnitValue;

  // Layout behavior
  inline: UnitValue;
  direction: UnitValue;
  align: UnitValue;
  verticalAlign: UnitValue;
  overflow: UnitValue;
  lineBreak: UnitValue;
  pageBreak: UnitValue;

  // Margin
  margin: UnitValue;
  marginLeft: UnitValue;
  marginRight: UnitValue;
  marginTop: UnitValue;
  marginBottom: UnitValue;

  // Padding
  padding: UnitValue;
  paddingLeft: UnitValue;
  paddingRight: UnitValue;
  paddingTop: UnitValue;
  paddingBottom: UnitValue;

  // Typography
  fontSize: UnitValue;
  fontFamily: UnitValue;
  text: UnitValue;

  // Colors
  color: UnitValue;
  backgroundColor: UnitValue;

  // Border
  borderWidth: UnitValue;
  borderColor: UnitValue;
  borderRadius: UnitValue;

  // Transform
  opacity: UnitValue;
  rotate: UnitValue;
  scale: UnitValue;

  // SVG
  svgPath: UnitValue;
  viewBox: UnitValue;

  // Image
  imageUrl: UnitValue;

  // Gradient
  linearGradient: LinearGradientValue;
  vColorSlide: UnitValue;
  vColorSlideBreak: UnitValue;
  vColorSlideTop: UnitValue;
  vColorSlideBottom: UnitValue;

  // Shadow
  shadowColor: UnitValue;
  shadowOffsetX: UnitValue;
  shadowOffsetY: UnitValue;
  shadowBlur: UnitValue;

  // Component
  id: UnitValue;
  cname: UnitValue;
}

// ============================================================================
// EVG Element Types (Tag Names)
// ============================================================================

export type EVGElementType =
  | "View"
  | "Container"
  | "Block"
  | "Label"
  | "Text"
  | "Image"
  | "Rect"
  | "SVG"
  | "Header"
  | "Footer"
  | "Component"
  | string; // Custom components

// ============================================================================
// Parsing/Serialization Types
// ============================================================================

/**
 * Options for parsing EVG from string
 */
export interface ParseOptions {
  /**
   * Whether to expand component references
   */
  expandComponents?: boolean;

  /**
   * Whether to validate the structure
   */
  validate?: boolean;

  /**
   * Custom component registry for expansion
   */
  componentRegistry?: Map<string, string>;
}

/**
 * Options for serializing EVG to string
 */
export interface SerializeOptions {
  /**
   * Whether to pretty-print with indentation
   */
  prettyPrint?: boolean;

  /**
   * Indentation string (default: two spaces)
   */
  indent?: string;

  /**
   * Whether to include calculated values
   */
  includeCalculated?: boolean;
}

// ============================================================================
// Layout Calculation Types
// ============================================================================

/**
 * Context passed during layout calculation
 */
export interface LayoutContext {
  parentWidth: number;
  parentHeight: number;
  parentFontSize: number;
  parentFontFamily: string;
  parentColor: string;
}

/**
 * Create a default layout context
 */
export function createLayoutContext(
  width: number = 0,
  height: number = 0
): LayoutContext {
  return {
    parentWidth: width,
    parentHeight: height,
    parentFontSize: 14,
    parentFontFamily: "Helvetica",
    parentColor: "#000000",
  };
}

// ============================================================================
// Attribute Mapping
// ============================================================================

/**
 * Mapping from XML attribute names to EVG property names
 */
export const ATTRIBUTE_MAP: Record<string, keyof EVGNode> = {
  x: "x",
  y: "y",
  left: "left",
  top: "top",
  bottom: "bottom",
  right: "right",
  width: "width",
  height: "height",
  innerWidth: "innerWidth",
  innerHeight: "innerHeight",
  inline: "inline",
  direction: "direction",
  align: "align",
  verticalAlign: "verticalAlign",
  overflow: "overflow",
  lineBreak: "lineBreak",
  pageBreak: "pageBreak",
  margin: "margin",
  marginLeft: "marginLeft",
  marginRight: "marginRight",
  marginTop: "marginTop",
  marginBottom: "marginBottom",
  padding: "padding",
  paddingLeft: "paddingLeft",
  paddingRight: "paddingRight",
  paddingTop: "paddingTop",
  paddingBottom: "paddingBottom",
  fontSize: "fontSize",
  fontFamily: "fontFamily",
  text: "text",
  color: "color",
  backgroundColor: "backgroundColor",
  borderWidth: "borderWidth",
  borderColor: "borderColor",
  borderRadius: "borderRadius",
  opacity: "opacity",
  rotate: "rotate",
  scale: "scale",
  svgPath: "svgPath",
  viewBox: "viewBox",
  imageUrl: "imageUrl",
  linearGradient: "linearGradient",
  vColorSlide: "vColorSlide",
  vColorSlideBreak: "vColorSlideBreak",
  vColorSlideTop: "vColorSlideTop",
  vColorSlideBottom: "vColorSlideBottom",
  shadowColor: "shadowColor",
  shadowOffsetX: "shadowOffsetX",
  shadowOffsetY: "shadowOffsetY",
  shadowBlur: "shadowBlur",
  id: "id",
  cname: "cname",
};

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Parse a color string to a normalized format
 */
export function parseColor(color: string): string {
  // Handle named colors, hex, rgb, rgba, etc.
  return color.trim();
}

/**
 * Check if a string is a valid color
 */
export function isValidColor(color: string): boolean {
  if (!color) return false;
  // Basic validation - starts with # or is rgb/rgba/named color
  return (
    color.startsWith("#") ||
    color.startsWith("rgb") ||
    color.startsWith("rgba") ||
    /^[a-z]+$/i.test(color)
  );
}
