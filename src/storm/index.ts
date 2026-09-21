/**
 * EVG 3.0 Storm — TypeScript face of the Ranger layout engine.
 *
 * The engine itself is the Ranger package in `/storm` (`Import "pkg:evg/…"`).
 * This module is the NPM-side document format and a bridge to the
 * Thunderstruck (v2) parser / PDF renderer:
 *
 *   XML  ──►  v2 EVG tree  ──►  PDF / Canvas          (unchanged)
 *                 │
 *                 └──►  Storm JSON   ──►  Ranger 3.x
 *
 *   Storm JSON  ──►  XML  ──►  v2 EVG tree  ──►  PDF  (new)
 */

export {
  EVG_STORM_VERSION,
  EVG_EDITION,
  isStormDocument,
} from "./types";
export type { StormDocument, StormNode } from "./types";

export { stormToXml, parseStormJson, stormToJson } from "./xml";
export { fromLegacyEVG, toLegacyEVG } from "./legacy";

import { EVG } from "../layout/index";
import { StormDocument } from "./types";
import { parseStormJson, stormToJson, stormToXml } from "./xml";
import { fromLegacyEVG, toLegacyEVG } from "./legacy";

/**
 * Parse XML (Thunderstruck markup) or Storm JSON into a Storm document.
 */
export function parse(input: string, css?: string): StormDocument {
  const trimmed = input.trim();
  if (trimmed.startsWith("{")) {
    const doc = parseStormJson(trimmed);
    if (css && !doc.css) doc.css = css;
    return doc;
  }
  return fromLegacyEVG(new EVG(trimmed), css);
}

export const parseStorm = parse;

/**
 * Render a Storm document through the v2 PDF path.
 */
export async function renderToFile(
  fileName: string,
  width: number,
  height: number,
  doc: StormDocument | string
): Promise<void> {
  const storm = typeof doc === "string" ? parse(doc) : doc;
  const node = toLegacyEVG(storm);
  await EVG.renderToFile(fileName, width, height, node);
}

export const Storm = {
  parse,
  parseJson: parseStormJson,
  toJson: stormToJson,
  toXml: stormToXml,
  fromLegacyEVG,
  toLegacyEVG,
  renderToFile,
};

export default Storm;
