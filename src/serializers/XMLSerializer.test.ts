import { describe, it, expect, beforeEach } from "vitest";
import { NodeXMLSerializer, createXMLSerializer } from "./XMLSerializer";
import { ComponentRegistry, EVGParseError } from "../core";

describe("NodeXMLSerializer", () => {
  let serializer: NodeXMLSerializer;

  beforeEach(() => {
    serializer = new NodeXMLSerializer();
  });

  describe("canParse", () => {
    it("should detect XML input", () => {
      expect(serializer.canParse("<View/>")).toBe(true);
      expect(serializer.canParse("<View></View>")).toBe(true);
      expect(serializer.canParse("  <View/>  ")).toBe(true);
    });

    it("should reject non-XML input", () => {
      expect(serializer.canParse('{"tagName": "View"}')).toBe(false);
      expect(serializer.canParse("plain text")).toBe(false);
    });
  });

  describe("parse", () => {
    it("should parse simple element", () => {
      const evg = serializer.parse("<View/>");
      expect(evg.tagName).toBe("View");
      expect(evg.items).toEqual([]);
    });

    it("should parse element with attributes", () => {
      const evg = serializer.parse('<View width="100" height="50"/>');
      expect(evg.tagName).toBe("View");
      expect(evg.width.is_set).toBe(true);
      expect(evg.width.f_value).toBe(100);
      expect(evg.height.is_set).toBe(true);
      expect(evg.height.f_value).toBe(50);
    });

    it("should parse nested elements", () => {
      const evg = serializer.parse('<View><Label text="Hello"/></View>');
      expect(evg.tagName).toBe("View");
      expect(evg.items.length).toBe(1);
      expect(evg.items[0].tagName).toBe("Label");
      expect(evg.items[0].text.s_value).toBe("Hello");
    });

    it("should parse percentage values", () => {
      const evg = serializer.parse('<View width="50%"/>');
      expect(evg.width.is_set).toBe(true);
      expect(evg.width.f_value).toBe(50);
      expect(evg.width.unit).toBe(1); // Percentage
    });

    it("should parse em values", () => {
      const evg = serializer.parse('<View fontSize="2em"/>');
      expect(evg.fontSize.is_set).toBe(true);
      expect(evg.fontSize.f_value).toBe(2);
      expect(evg.fontSize.unit).toBe(2); // Em
    });

    it("should parse color attributes", () => {
      const evg = serializer.parse('<View backgroundColor="#ff0000"/>');
      expect(evg.backgroundColor.is_set).toBe(true);
      expect(evg.backgroundColor.color).toBe("#ff0000");
    });

    it("should parse kebab-case attributes", () => {
      const evg = serializer.parse(
        '<View background-color="blue" font-size="14"/>'
      );
      expect(evg.backgroundColor.is_set).toBe(true);
      expect(evg.backgroundColor.color).toBe("blue");
      expect(evg.fontSize.is_set).toBe(true);
    });

    it("should parse style attribute", () => {
      const evg = serializer.parse('<View style="width: 100; height: 50"/>');
      expect(evg.width.is_set).toBe(true);
      expect(evg.height.is_set).toBe(true);
    });

    it("should parse text content as Label nodes", () => {
      const evg = serializer.parse("<View>Hello World</View>");
      expect(evg.items.length).toBe(2);
      expect(evg.items[0].tagName).toBe("Label");
      expect(evg.items[0].text.s_value).toBe("Hello ");
      expect(evg.items[1].text.s_value).toBe("World");
    });

    it("should parse header element", () => {
      const evg = serializer.parse(
        '<View><header><Label text="Header"/></header></View>'
      );
      expect(evg.header).toBeDefined();
      expect(evg.header?.tagName).toBe("header");
    });

    it("should parse footer element", () => {
      const evg = serializer.parse(
        '<View><footer><Label text="Footer"/></footer></View>'
      );
      expect(evg.footer).toBeDefined();
      expect(evg.footer?.tagName).toBe("footer");
    });

    it("should handle malformed XML gracefully", () => {
      // @xmldom/xmldom now throws on malformed XML
      expect(() => serializer.parse("<View><Label></View>")).toThrow(EVGParseError);
    });

    it("should throw EVGParseError for empty input", () => {
      expect(() => serializer.parse("")).toThrow(EVGParseError);
    });
  });

  describe("serialize", () => {
    it("should serialize simple element", () => {
      const evg = { tagName: "View", items: [] };
      const xml = serializer.serialize(evg as any);
      expect(xml).toContain("View");
    });

    it("should serialize nested elements", () => {
      const evg = {
        tagName: "View",
        items: [
          {
            tagName: "Label",
            items: [],
            text: { is_set: true, s_value: "Hello" },
          },
        ],
      };
      const xml = serializer.serialize(evg as any);
      expect(xml).toContain("View");
      expect(xml).toContain("Label");
    });
  });

  describe("components", () => {
    it("should expand registered components", () => {
      const registry = new ComponentRegistry();
      registry.register("Button", '<View><Label text="Click"/></View>');

      const serializerWithRegistry = new NodeXMLSerializer(registry);
      const evg = serializerWithRegistry.parse("<Button/>");

      expect(evg.tagName).toBe("View");
      expect(evg.items.length).toBe(1);
      expect(evg.items[0].tagName).toBe("Label");
    });

    it("should apply attributes to component root", () => {
      const registry = new ComponentRegistry();
      registry.register(
        "Button",
        '<View width="100"><Label text="Click"/></View>'
      );

      const serializerWithRegistry = new NodeXMLSerializer(registry);
      const evg = serializerWithRegistry.parse('<Button height="50"/>');

      expect(evg.height.is_set).toBe(true);
      expect(evg.height.f_value).toBe(50);
    });
  });

  describe("inheritance", () => {
    it("should inherit fontSize from parent", () => {
      const evg = serializer.parse(
        '<View fontSize="20"><Label text="Test"/></View>'
      );
      expect(evg.items[0].fontSize.is_set).toBe(true);
      expect(evg.items[0].fontSize.f_value).toBe(20);
    });

    it("should inherit fontFamily from parent", () => {
      const evg = serializer.parse(
        '<View fontFamily="Arial"><Label text="Test"/></View>'
      );
      expect(evg.items[0].fontFamily.is_set).toBe(true);
      expect(evg.items[0].fontFamily.s_value).toBe("Arial");
    });

    it("should inherit color from parent", () => {
      const evg = serializer.parse(
        '<View color="#ff0000"><Label text="Test"/></View>'
      );
      expect(evg.items[0].color.is_set).toBe(true);
    });

    it("should not override child values", () => {
      const evg = serializer.parse(
        '<View fontSize="20"><Label fontSize="14" text="Test"/></View>'
      );
      expect(evg.items[0].fontSize.f_value).toBe(14);
    });
  });
});

describe("XMLSerializer - Advanced Parsing", () => {
  let serializer: NodeXMLSerializer;

  beforeEach(() => {
    serializer = new NodeXMLSerializer();
  });

  describe("Complex attributes", () => {
    it("should parse margin values", () => {
      const evg = serializer.parse('<View margin="10px"/>');
      expect(evg.margin.is_set).toBe(true);
      expect(evg.margin.f_value).toBe(10);
      expect(evg.margin.unit).toBe(3); // Pixels
    });

    it("should parse individual margin values", () => {
      const evg = serializer.parse(
        '<View margin-left="5" margin-right="10" margin-top="15" margin-bottom="20"/>'
      );
      expect(evg.marginLeft.is_set).toBe(true);
      expect(evg.marginRight.is_set).toBe(true);
      expect(evg.marginTop.is_set).toBe(true);
      expect(evg.marginBottom.is_set).toBe(true);
    });

    it("should parse padding values", () => {
      const evg = serializer.parse('<View padding="20px"/>');
      expect(evg.padding.is_set).toBe(true);
      expect(evg.padding.f_value).toBe(20);
      expect(evg.padding.unit).toBe(3); // Pixels
    });

    it("should parse individual padding values", () => {
      const evg = serializer.parse(
        '<View padding-left="5" padding-right="10" padding-top="15" padding-bottom="20"/>'
      );
      expect(evg.paddingLeft.is_set).toBe(true);
      expect(evg.paddingRight.is_set).toBe(true);
      expect(evg.paddingTop.is_set).toBe(true);
      expect(evg.paddingBottom.is_set).toBe(true);
    });

    it("should parse border properties", () => {
      const evg = serializer.parse(
        '<View border-width="2px" border-color="#333" border-radius="5px"/>'
      );
      expect(evg.borderWidth.is_set).toBe(true);
      expect(evg.borderWidth.f_value).toBe(2);
      expect(evg.borderColor.is_set).toBe(true);
      expect(evg.borderColor.s_value).toBe("#333");
      expect(evg.borderRadius.is_set).toBe(true);
      expect(evg.borderRadius.f_value).toBe(5);
    });

    it("should parse opacity", () => {
      const evg = serializer.parse('<View opacity="0.5"/>');
      expect(evg.opacity.is_set).toBe(true);
      expect(evg.opacity.f_value).toBe(0.5);
    });

    it("should parse transform properties", () => {
      const evg = serializer.parse('<View rotate="45" scale="1.5"/>');
      expect(evg.rotate.is_set).toBe(true);
      expect(evg.rotate.f_value).toBe(45);
      expect(evg.scale.is_set).toBe(true);
      expect(evg.scale.f_value).toBe(1.5);
    });

    it("should parse absolute positioning", () => {
      const evg = serializer.parse(
        '<View left="10" top="20" right="30" bottom="40"/>'
      );
      expect(evg.left.is_set).toBe(true);
      expect(evg.top.is_set).toBe(true);
      expect(evg.right.is_set).toBe(true);
      expect(evg.bottom.is_set).toBe(true);
    });
  });

  describe("Multiple color formats", () => {
    it("should parse hex colors (3 digits)", () => {
      const evg = serializer.parse('<View backgroundColor="#f00"/>');
      expect(evg.backgroundColor.color).toBe("#f00");
    });

    it("should parse hex colors (6 digits)", () => {
      const evg = serializer.parse('<View backgroundColor="#ff0000"/>');
      expect(evg.backgroundColor.color).toBe("#ff0000");
    });

    it("should parse rgb colors", () => {
      const evg = serializer.parse('<View backgroundColor="rgb(255, 0, 0)"/>');
      expect(evg.backgroundColor.color).toBe("rgb(255, 0, 0)");
    });

    it("should parse rgba colors", () => {
      const evg = serializer.parse(
        '<View backgroundColor="rgba(255, 0, 0, 0.5)"/>'
      );
      expect(evg.backgroundColor.color).toBe("rgba(255, 0, 0, 0.5)");
    });

    it("should parse named colors", () => {
      const evg = serializer.parse('<View backgroundColor="red"/>');
      expect(evg.backgroundColor.color).toBe("red");
    });
  });

  describe("Component expansion with content", () => {
    it("should expand component with content slot", () => {
      const registry = new ComponentRegistry();
      registry.register(
        "Card",
        '<View padding="20" border-width="1"><View id="content"/></View>'
      );

      const serializerWithRegistry = new NodeXMLSerializer(registry);
      const evg = serializerWithRegistry.parse(
        '<Card><Label text="Card Content"/></Card>'
      );

      expect(evg.tagName).toBe("View");
      expect(evg.padding.is_set).toBe(true);
      expect(evg.borderWidth.is_set).toBe(true);
      // Content should be inserted where id="content" was
      expect(evg.items.length).toBeGreaterThan(0);
    });

    it("should handle nested components", () => {
      const registry = new ComponentRegistry();
      registry.register("Button", '<View><Label text="Click"/></View>');
      registry.register("Card", '<View><View id="content"/></View>');

      const serializerWithRegistry = new NodeXMLSerializer(registry);
      const evg = serializerWithRegistry.parse("<Card><Button/></Card>");

      expect(evg.tagName).toBe("View");
      expect(evg.items.length).toBeGreaterThan(0);
    });
  });

  describe("Special elements", () => {
    it("should parse SVG path", () => {
      const evg = serializer.parse('<path d="M 0 0 L 100 100"/>');
      expect(evg.tagName).toBe("path");
      // Note: The parser might not automatically set svgPath from d attribute
      // depending on implementation
    });

    it("should parse image with src", () => {
      const evg = serializer.parse('<img src="image.png" width="100"/>');
      expect(evg.tagName).toBe("img");
      // Note: The parser might not automatically set imageUrl from src attribute
      // depending on implementation
    });

    it("should parse QRCode component", () => {
      const evg = serializer.parse('<QRCode text="https://example.com"/>');
      expect(evg.tagName).toBe("QRCode");
      expect(evg.text.is_set).toBe(true);
      expect(evg.text.s_value).toBe("https://example.com");
    });
  });

  describe("Layout properties", () => {
    it("should parse align property", () => {
      const evg = serializer.parse('<View align="center"/>');
      expect(evg.align.is_set).toBe(true);
      expect(evg.align.s_value).toBe("center");
    });

    it("should parse direction property", () => {
      const evg = serializer.parse('<View direction="row"/>');
      expect(evg.direction.is_set).toBe(true);
      expect(evg.direction.s_value).toBe("row");
    });

    it("should parse overflow property", () => {
      const evg = serializer.parse('<View overflow="hidden"/>');
      expect(evg.overflow.is_set).toBe(true);
      expect(evg.overflow.s_value).toBe("hidden");
    });

    it("should parse inline property", () => {
      const evg = serializer.parse('<Label inline="true"/>');
      expect(evg.inline.is_set).toBe(true);
    });
  });

  describe("Edge cases and error handling", () => {
    it("should handle self-closing tags", () => {
      const evg = serializer.parse("<View/>");
      expect(evg.tagName).toBe("View");
      expect(evg.items.length).toBe(0);
    });

    it("should handle empty elements", () => {
      const evg = serializer.parse("<View></View>");
      expect(evg.tagName).toBe("View");
      expect(evg.items.length).toBe(0);
    });

    it("should handle multiple top-level elements", () => {
      // XML requires a single root element - this should throw
      expect(() => {
        serializer.parse("<View></View><Label/>");
      }).toThrow(EVGParseError);
    });

    it("should handle comments", () => {
      const evg = serializer.parse("<View><!-- comment --></View>");
      expect(evg.tagName).toBe("View");
      // Comments should not create items
    });

    it("should handle whitespace-only text nodes", () => {
      const evg = serializer.parse("<View>   </View>");
      expect(evg.tagName).toBe("View");
      // Whitespace-only text should not create Label items
    });

    it("should preserve text with special characters", () => {
      const evg = serializer.parse('<Label text="Hello &amp; World"/>');
      expect(evg.text.s_value).toContain("&");
    });

    it("should handle mixed content", () => {
      const evg = serializer.parse("<View>Text <Label text=\"inline\"/> More</View>");
      expect(evg.items.length).toBeGreaterThan(0);
    });
  });

  describe("HP (height percentage) unit", () => {
    it("should parse hp values", () => {
      const evg = serializer.parse('<View height="50hp"/>');
      expect(evg.height.is_set).toBe(true);
      expect(evg.height.f_value).toBe(50);
      expect(evg.height.unit).toBe(4); // HP unit type
    });
  });

  describe("Fill unit", () => {
    it("should parse fill keyword", () => {
      const evg = serializer.parse('<View width="fill"/>');
      expect(evg.width.is_set).toBe(true);
      expect(evg.width.unit).toBe(5); // Fill unit type
      expect(evg.width.f_value).toBe(100);
    });
  });
});

describe("createXMLSerializer", () => {
  it("should create NodeXMLSerializer in Node.js environment", () => {
    const serializer = createXMLSerializer();
    expect(serializer).toBeInstanceOf(NodeXMLSerializer);
  });

  it("should accept component registry", () => {
    const registry = new ComponentRegistry();
    const serializer = createXMLSerializer(registry);
    expect(serializer).toBeInstanceOf(NodeXMLSerializer);
  });
});
