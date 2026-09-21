import { describe, it, expect } from "vitest";
import { EVG } from "../layout/index";
import {
  Storm,
  parseStorm,
  stormToXml,
  toLegacyEVG,
  fromLegacyEVG,
  isStormDocument,
  EVG_STORM_VERSION,
  EVG_EDITION,
} from "./index";
import type { StormDocument } from "./types";

const CARD: StormDocument = {
  evg: 1,
  root: {
    tag: "div",
    props: {
      "class-name": "page",
      width: "600px",
      height: "400px",
      "padding-left": "24px",
      "padding-top": "24px",
      "background-color": "rgb(246,247,249)",
    },
    children: [
      {
        tag: "div",
        props: {
          "class-name": "card",
          width: "320px",
          height: "120px",
          "background-color": "rgb(255,255,255)",
          "border-radius": "8px",
          "padding-left": "16px",
          "padding-top": "12px",
          "flex-direction": "column",
        },
        children: [
          {
            tag: "span",
            key: "title",
            props: {
              "font-size": "20px",
              "font-weight": "bold",
              color: "rgb(31,41,51)",
            },
            text: "Orders",
          },
        ],
      },
    ],
  },
};

describe("EVG 3.0 Storm", () => {
  it("names the edition", () => {
    expect(EVG_STORM_VERSION).toBe("3.0.0");
    expect(EVG_EDITION).toBe("Storm");
    expect(isStormDocument(CARD)).toBe(true);
    expect(isStormDocument({ evg: 2 })).toBe(false);
  });

  it("serialises Storm JSON to Thunderstruck XML", () => {
    const xml = stormToXml(CARD);
    expect(xml).toContain("<div");
    expect(xml).toContain('width="600px"');
    expect(xml).toContain("<Label");
    expect(xml).toContain('text="Orders"');
    expect(xml).toContain("background-color");
  });

  it("parses Thunderstruck XML into a Storm tree", () => {
    const doc = parseStorm(
      `<View width="200px" height="80px" background-color="#3b82f6">
         <Label text="Hello Storm" font-size="18px" color="white"/>
       </View>`
    );
    expect(doc.evg).toBe(1);
    expect(doc.root.tag).toBe("div");
    expect(doc.root.props?.width).toBe("200px");
    expect(doc.root.props?.["background-color"]).toBe("#3b82f6");
    expect(doc.root.children?.[0].tag).toBe("span");
    expect(doc.root.children?.[0].text).toBe("Hello Storm");
  });

  it("round-trips Storm JSON through the v2 EVG constructor", () => {
    const xml = stormToXml(CARD);
    const v2 = new EVG(xml);
    expect(v2.tagName?.toLowerCase()).toBe("div");
    expect(v2.width.is_set).toBe(true);
    expect(v2.width.f_value).toBe(600);

    const json = JSON.stringify(CARD);
    const fromJson = new EVG(json);
    expect(fromJson.tagName?.toLowerCase()).toBe("div");
    expect(fromJson.width.f_value).toBe(600);
  });

  it("bridges Storm → v2 → Storm without dropping the title", () => {
    const v2 = toLegacyEVG(CARD);
    const back = fromLegacyEVG(v2);
    expect(back.evg).toBe(1);
    expect(back.root.tag).toBe("div");
    const title = back.root.children?.[0].children?.[0];
    expect(title?.text).toBe("Orders");
  });

  it("keeps the Thunderstruck XML constructor working", () => {
    const node = new EVG(`<View width="100" height="50"><Label text="Hi"/></View>`);
    expect(node.tagName).toBe("View");
    expect(node.items.length).toBeGreaterThan(0);
    const storm = Storm.fromLegacyEVG(node);
    expect(storm.root.children?.length).toBeGreaterThan(0);
  });
});
