/**
 * EVG 3.0 Storm document types.
 *
 * These match the Ranger `EVGTreeJson` format (`{"evg":1,"css":...,"root":...}`)
 * so a TypeScript program and a Ranger program can exchange the same tree.
 */

export const EVG_STORM_VERSION = "3.0.0";
export const EVG_EDITION = "Storm";

export interface StormNode {
  tag: string;
  id?: string;
  key?: string;
  text?: string;
  role?: string;
  label?: string;
  hidden?: boolean;
  checked?: number;
  props?: Record<string, string>;
  children?: StormNode[];
}

export interface StormDocument {
  evg: 1;
  css?: string;
  root: StormNode;
}

export function isStormDocument(value: unknown): value is StormDocument {
  if (value == null || typeof value !== "object") return false;
  const doc = value as { evg?: unknown; root?: unknown };
  return doc.evg === 1 && doc.root != null && typeof doc.root === "object";
}
