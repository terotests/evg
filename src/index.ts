/**
 * EVG public NPM surface.
 *
 * Default export path (`import { EVG } from "evg"`) is the Thunderstruck 2.x
 * layout engine, parser and PDF renderer — unchanged.
 *
 * Storm 3.0 (`import { Storm } from "evg"` or `import … from "evg/storm"`)
 * is the Ranger-compatible document format and the bridge into that engine.
 */

export * from "./layout/index";
export {
  Storm,
  EVG_STORM_VERSION,
  EVG_EDITION,
  isStormDocument,
  parse as parseStorm,
  stormToXml,
  parseStormJson,
  stormToJson,
  fromLegacyEVG,
  toLegacyEVG,
} from "./storm/index";
export type { StormDocument, StormNode } from "./storm/index";
