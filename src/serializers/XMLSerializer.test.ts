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
      // xmldom doesn't throw on malformed XML, it tries to parse what it can
      // This is acceptable behavior - the parsed result may be incomplete
      const evg = serializer.parse("<View><Label></View>");
      expect(evg.tagName).toBe("View");
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
