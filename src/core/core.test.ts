import { describe, it, expect, beforeEach } from "vitest";
import {
  UnitType,
  createUnitValue,
  createUICalculated,
  createLayoutContext,
  EVGParseError,
  EVGRenderError,
  ComponentRegistry,
  MemoryFontProvider,
  NullRenderer,
  JSONSerializer,
} from "./index";

describe("EVG Core Types", () => {
  describe("UnitValue", () => {
    it("should create default UnitValue", () => {
      const value = createUnitValue();
      expect(value.unit).toBe(UnitType.None);
      expect(value.is_set).toBe(false);
      expect(value.pixels).toBe(0);
      expect(value.f_value).toBe(0);
      expect(value.s_value).toBe("");
    });

    it("should create UnitValue with custom defaults", () => {
      const value = createUnitValue({
        unit: UnitType.Pixels,
        is_set: true,
        pixels: 100,
        f_value: 100,
      });
      expect(value.unit).toBe(UnitType.Pixels);
      expect(value.is_set).toBe(true);
      expect(value.pixels).toBe(100);
    });
  });

  describe("UICalculated", () => {
    it("should create default UICalculated", () => {
      const calc = createUICalculated();
      expect(calc.x).toBe(0);
      expect(calc.y).toBe(0);
      expect(calc.width).toBe(0);
      expect(calc.height).toBe(0);
      expect(calc.lineBreak).toBe(false);
      expect(calc.absolute).toBe(false);
    });
  });

  describe("LayoutContext", () => {
    it("should create default LayoutContext", () => {
      const ctx = createLayoutContext();
      expect(ctx.parentWidth).toBe(0);
      expect(ctx.parentHeight).toBe(0);
      expect(ctx.parentFontSize).toBe(14);
      expect(ctx.parentFontFamily).toBe("Helvetica");
    });

    it("should create LayoutContext with dimensions", () => {
      const ctx = createLayoutContext(800, 600);
      expect(ctx.parentWidth).toBe(800);
      expect(ctx.parentHeight).toBe(600);
    });
  });

  describe("Error Types", () => {
    it("should create EVGParseError", () => {
      const error = new EVGParseError("Test error", 10, 5, "<View>");
      expect(error.name).toBe("EVGParseError");
      expect(error.message).toBe("Test error");
      expect(error.line).toBe(10);
      expect(error.column).toBe(5);
      expect(error.source).toBe("<View>");
    });

    it("should create EVGRenderError", () => {
      const error = new EVGRenderError("Render failed");
      expect(error.name).toBe("EVGRenderError");
      expect(error.message).toBe("Render failed");
    });
  });
});

describe("ComponentRegistry", () => {
  let registry: ComponentRegistry;

  beforeEach(() => {
    registry = new ComponentRegistry();
  });

  it("should register and retrieve components", () => {
    registry.register("Button", '<View><Label text="Click me"/></View>');
    expect(registry.has("Button")).toBe(true);
    expect(registry.get("Button")).toBe(
      '<View><Label text="Click me"/></View>'
    );
  });

  it("should list all registered components", () => {
    registry.register("Button", "<View/>");
    registry.register("Card", "<View/>");
    expect(registry.list()).toEqual(["Button", "Card"]);
  });

  it("should unregister components", () => {
    registry.register("Button", "<View/>");
    expect(registry.unregister("Button")).toBe(true);
    expect(registry.has("Button")).toBe(false);
    expect(registry.unregister("Button")).toBe(false);
  });

  it("should clear all components", () => {
    registry.register("Button", "<View/>");
    registry.register("Card", "<View/>");
    registry.clear();
    expect(registry.size).toBe(0);
  });
});

describe("MemoryFontProvider", () => {
  let fontProvider: MemoryFontProvider;

  beforeEach(() => {
    fontProvider = new MemoryFontProvider();
  });

  it("should register and retrieve fonts", () => {
    fontProvider.registerFont("Arial", "/path/to/arial.ttf");
    expect(fontProvider.hasFont("Arial")).toBe(true);
    expect(fontProvider.getFont("Arial")).toBe("/path/to/arial.ttf");
  });

  it("should return null for unknown fonts", () => {
    expect(fontProvider.getFont("Unknown")).toBeNull();
    expect(fontProvider.getFontInfo("Unknown")).toBeNull();
  });

  it("should list all registered fonts", () => {
    fontProvider.registerFont("Arial", "/path/to/arial.ttf");
    fontProvider.registerFont("Helvetica", "/path/to/helvetica.ttf");
    expect(fontProvider.listFonts()).toEqual(["Arial", "Helvetica"]);
  });

  it("should store font info with options", () => {
    fontProvider.registerFont("Arial", "/path/to/arial.ttf", {
      weight: 700,
      style: "italic",
    });
    const info = fontProvider.getFontInfo("Arial");
    expect(info?.weight).toBe(700);
    expect(info?.style).toBe("italic");
  });
});

describe("NullRenderer", () => {
  let renderer: NullRenderer;

  beforeEach(() => {
    renderer = new NullRenderer();
  });

  it("should initialize document with dimensions", () => {
    renderer.beginDocument(800, 600);
    expect(renderer.getDocumentSize()).toEqual({ width: 800, height: 600 });
  });

  it("should measure text approximately", () => {
    const measurement = renderer.measureText("Hello", "Arial", 14);
    expect(measurement.width).toBeGreaterThan(0);
    expect(measurement.height).toBeGreaterThan(0);
  });

  it("should save and restore state", () => {
    renderer.beginDocument(800, 600);
    renderer.save();
    renderer.translate(100, 50);
    renderer.restore();
    // State should be restored (no error thrown)
  });
});

describe("JSONSerializer", () => {
  let serializer: JSONSerializer;

  beforeEach(() => {
    serializer = new JSONSerializer();
  });

  it("should detect JSON input", () => {
    expect(serializer.canParse('{"tagName": "View"}')).toBe(true);
    expect(serializer.canParse('[{"tagName": "View"}]')).toBe(true);
    expect(serializer.canParse("<View/>")).toBe(false);
  });

  it("should parse valid JSON", () => {
    const evg = serializer.parse('{"tagName": "View", "items": []}');
    expect(evg.tagName).toBe("View");
    expect(evg.items).toEqual([]);
  });

  it("should serialize EVG to JSON", () => {
    const evg = { tagName: "View", items: [] };
    const json = serializer.serialize(evg as any);
    expect(JSON.parse(json)).toEqual(evg);
  });

  it("should throw EVGParseError for invalid JSON", () => {
    expect(() => serializer.parse("invalid json")).toThrow(EVGParseError);
  });
});
