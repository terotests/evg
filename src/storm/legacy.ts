/**
 * Bridge between the Thunderstruck (v2) EVG tree and Storm JSON.
 */

import { EVG } from "../layout/index";
import { StormDocument, StormNode } from "./types";
import { stormToXml } from "./xml";

type UnitField = {
  is_set?: boolean;
  unit?: number;
  f_value?: number;
  s_value?: string;
  b_value?: boolean;
  color?: string;
};

const TAG_TO_STORM: Record<string, string> = {
  view: "div",
  label: "span",
  image: "img",
};

/**
 * Layout-engine unit codes (not the enum in types.ts):
 * 1 = %, 2 = em, 3 = px, 4 = hp, 5 = fill.
 */
function formatUnit(field: UnitField | undefined): string | undefined {
  if (!field || !field.is_set) return undefined;
  if (field.s_value) return field.s_value;
  if (typeof field.b_value === "boolean") {
    return field.b_value ? "true" : "false";
  }
  const n = field.f_value;
  if (n == null && !field.color) return undefined;
  switch (field.unit) {
    case 1:
      return `${n}%`;
    case 2:
      return `${n}em`;
    case 4:
      return `${n}hp`;
    case 5:
      return "fill";
    case 3:
      if (n == null) return undefined;
      return Number.isInteger(n) ? `${n}px` : `${n}px`;
    default:
      if (n == null) return undefined;
      return Number.isInteger(n) ? String(n) : String(n);
  }
}

function formatColor(field: UnitField | undefined): string | undefined {
  if (!field || !field.is_set) return undefined;
  if (field.s_value) return field.s_value;
  if (field.color && field.color !== "#000000") return field.color;
  return undefined;
}

function setProp(props: Record<string, string>, name: string, value?: string) {
  if (value == null || value === "") return;
  props[name] = value;
}

function stormTag(tagName: string | null | undefined): string {
  const raw = (tagName || "div").trim();
  const lower = raw.toLowerCase();
  return TAG_TO_STORM[lower] || raw;
}

/**
 * Walk a Thunderstruck EVG node into a Storm tree node.
 */
export function fromLegacyEVG(node: EVG, css?: string): StormDocument {
  return {
    evg: 1,
    ...(css ? { css } : {}),
    root: legacyNode(node),
  };
}

function legacyNode(node: EVG): StormNode {
  const tag = stormTag(node.tagName);
  const out: StormNode = { tag };
  const id = node.id?.s_value;
  if (id) out.id = id;

  const text = node.text?.s_value;
  if (text) out.text = text;

  const props: Record<string, string> = {};
  setProp(props, "width", formatUnit(node.width));
  setProp(props, "height", formatUnit(node.height));
  setProp(props, "left", formatUnit(node.left));
  setProp(props, "top", formatUnit(node.top));
  setProp(props, "right", formatUnit(node.right));
  setProp(props, "bottom", formatUnit(node.bottom));
  setProp(props, "margin", formatUnit(node.margin));
  setProp(props, "margin-left", formatUnit(node.marginLeft));
  setProp(props, "margin-right", formatUnit(node.marginRight));
  setProp(props, "margin-top", formatUnit(node.marginTop));
  setProp(props, "margin-bottom", formatUnit(node.marginBottom));
  setProp(props, "padding", formatUnit(node.padding));
  setProp(props, "padding-left", formatUnit(node.paddingLeft));
  setProp(props, "padding-right", formatUnit(node.paddingRight));
  setProp(props, "padding-top", formatUnit(node.paddingTop));
  setProp(props, "padding-bottom", formatUnit(node.paddingBottom));
  setProp(props, "font-size", formatUnit(node.fontSize));
  setProp(props, "font-family", node.fontFamily?.is_set ? node.fontFamily.s_value : undefined);
  setProp(props, "color", formatColor(node.color));
  setProp(props, "background-color", formatColor(node.backgroundColor));
  setProp(props, "opacity", formatUnit(node.opacity));
  setProp(props, "overflow", node.overflow?.is_set ? node.overflow.s_value : undefined);
  setProp(props, "border-width", formatUnit(node.borderWidth));
  setProp(props, "border-color", formatColor(node.borderColor));
  setProp(props, "border-radius", formatUnit(node.borderRadius));
  setProp(props, "text-align", node.align?.is_set ? node.align.s_value : undefined);
  setProp(props, "vertical-align", node.verticalAlign?.is_set ? node.verticalAlign.s_value : undefined);
  setProp(props, "flex-direction", node.direction?.is_set ? node.direction.s_value : undefined);
  setProp(props, "src", node.imageUrl?.is_set ? node.imageUrl.s_value : undefined);
  setProp(props, "d", node.svgPath?.is_set ? node.svgPath.s_value : undefined);
  setProp(props, "view-box", node.viewBox?.is_set ? node.viewBox.s_value : undefined);
  if (node.rotate?.is_set) setProp(props, "rotate", String(node.rotate.f_value));
  if (node.scale?.is_set) setProp(props, "scale", String(node.scale.f_value));
  setProp(props, "background-gradient", node.linearGradient?.is_set ? node.linearGradient.s_value : undefined);
  setProp(props, "box-shadow-color", formatColor(node.shadowColor));
  setProp(props, "shadow-offset-x", formatUnit(node.shadowOffsetX));
  setProp(props, "shadow-offset-y", formatUnit(node.shadowOffsetY));
  setProp(props, "shadow-radius", formatUnit(node.shadowRadius));

  if (Object.keys(props).length > 0) out.props = props;

  const kids = (node.items || [])
    .filter((child) => child && child.tagName && child.tagName !== "content")
    .map(legacyNode);
  if (kids.length > 0) out.children = kids;
  return out;
}

/**
 * Build a Thunderstruck EVG tree from a Storm document (via XML, so the
 * existing parser, components and PDF path stay in charge).
 */
export function toLegacyEVG(doc: StormDocument): EVG {
  return new EVG(stormToXml(doc));
}
