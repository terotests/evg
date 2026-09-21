/**
 * Storm JSON ↔ XML. No dependency on the Thunderstruck EVG class, so the
 * v2 constructor can call into this without a cycle.
 */

import { StormDocument, StormNode } from "./types";

const TAG_TO_XML: Record<string, string> = {
  span: "Label",
  view: "View",
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function xmlTag(tag: string): string {
  const lower = tag.toLowerCase();
  return TAG_TO_XML[lower] || tag;
}

function attrString(node: StormNode): string {
  const parts: string[] = [];
  if (node.id) parts.push(`id="${xmlEscape(node.id)}"`);
  if (node.key) parts.push(`key="${xmlEscape(node.key)}"`);
  if (node.role) parts.push(`role="${xmlEscape(node.role)}"`);
  if (node.label) parts.push(`aria-label="${xmlEscape(node.label)}"`);
  if (node.hidden) parts.push(`aria-hidden="true"`);
  if (node.props) {
    for (const [name, value] of Object.entries(node.props)) {
      if (value == null || value === "") continue;
      parts.push(`${name}="${xmlEscape(value)}"`);
    }
  }
  if (node.text) parts.push(`text="${xmlEscape(node.text)}"`);
  return parts.join(" ");
}

function nodeToXml(node: StormNode, indent: number): string {
  const pad = "  ".repeat(indent);
  const tag = xmlTag(node.tag);
  const attrs = attrString(node);
  const open = attrs ? `<${tag} ${attrs}` : `<${tag}`;
  const kids = node.children || [];
  if (kids.length === 0) {
    return `${pad}${open} />`;
  }
  const inner = kids.map((child) => nodeToXml(child, indent + 1)).join("\n");
  return `${pad}${open}>\n${inner}\n${pad}</${tag}>`;
}

/**
 * Serialise a Storm document to Thunderstruck-compatible XML.
 * `span` becomes `Label` so the v2 parser treats it as text.
 */
export function stormToXml(doc: StormDocument): string {
  return nodeToXml(doc.root, 0) + "\n";
}

/**
 * Parse a Storm JSON string or object. Throws if the document is not Storm.
 */
export function parseStormJson(input: string | StormDocument): StormDocument {
  if (typeof input !== "string") {
    if (input && input.evg === 1 && input.root) return input;
    throw new Error("Not an EVG Storm document (missing evg:1 root)");
  }
  const trimmed = input.trim();
  const parsed = JSON.parse(trimmed) as StormDocument;
  if (!parsed || parsed.evg !== 1 || !parsed.root) {
    throw new Error("Not an EVG Storm document (missing evg:1 root)");
  }
  return parsed;
}

export function stormToJson(doc: StormDocument, pretty = false): string {
  return pretty ? JSON.stringify(doc, null, 2) : JSON.stringify(doc);
}
