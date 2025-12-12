import { describe, it, expect } from "vitest";
import {
  parseColor,
  isValidColor,
  UnitType,
  createUnitValue,
  createUICalculated,
  createLayoutContext,
  createLinearGradient,
} from "./types";

describe("Color Utilities", () => {
  describe("parseColor", () => {
    it("should parse hex colors with #", () => {
      expect(parseColor("#ff0000")).toBe("#ff0000");
      expect(parseColor("#FF0000")).toBe("#FF0000");
      expect(parseColor("#f00")).toBe("#f00");
    });

    it("should parse rgb colors", () => {
      expect(parseColor("rgb(255, 0, 0)")).toBe("rgb(255, 0, 0)");
      expect(parseColor("rgb(0,0,0)")).toBe("rgb(0,0,0)");
    });

    it("should parse rgba colors", () => {
      expect(parseColor("rgba(255, 0, 0, 0.5)")).toBe("rgba(255, 0, 0, 0.5)");
      expect(parseColor("rgba(0,0,0,1)")).toBe("rgba(0,0,0,1)");
    });

    it("should parse named colors", () => {
      expect(parseColor("red")).toBe("red");
      expect(parseColor("blue")).toBe("blue");
      expect(parseColor("transparent")).toBe("transparent");
    });

    it("should trim whitespace", () => {
      expect(parseColor("  #ff0000  ")).toBe("#ff0000");
      expect(parseColor("  red  ")).toBe("red");
    });
  });

  describe("isValidColor", () => {
    it("should validate hex colors", () => {
      expect(isValidColor("#ff0000")).toBe(true);
      expect(isValidColor("#f00")).toBe(true);
      expect(isValidColor("#FF0000")).toBe(true);
    });

    it("should validate rgb/rgba colors", () => {
      expect(isValidColor("rgb(255, 0, 0)")).toBe(true);
      expect(isValidColor("rgba(255, 0, 0, 0.5)")).toBe(true);
    });

    it("should validate named colors", () => {
      expect(isValidColor("red")).toBe(true);
      expect(isValidColor("blue")).toBe(true);
      expect(isValidColor("transparent")).toBe(true);
    });

    it("should reject invalid colors", () => {
      expect(isValidColor("")).toBe(false);
      expect(isValidColor("123")).toBe(false);
      expect(isValidColor("not-a-color")).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isValidColor("#")).toBe(true); // starts with #
      expect(isValidColor("rgb")).toBe(true); // starts with rgb
      expect(isValidColor("rgba")).toBe(true); // starts with rgba
    });
  });
});

describe("Unit Value", () => {
  describe("createUnitValue", () => {
    it("should create default unit value", () => {
      const value = createUnitValue();
      expect(value.unit).toBe(UnitType.None);
      expect(value.is_set).toBe(false);
      expect(value.pixels).toBe(0);
      expect(value.f_value).toBe(0);
      expect(value.s_value).toBe("");
    });

    it("should create unit value with defaults", () => {
      const value = createUnitValue({
        unit: UnitType.Pixels,
        is_set: true,
        pixels: 100,
        f_value: 100,
        s_value: "100px",
      });
      expect(value.unit).toBe(UnitType.Pixels);
      expect(value.is_set).toBe(true);
      expect(value.pixels).toBe(100);
      expect(value.f_value).toBe(100);
      expect(value.s_value).toBe("100px");
    });

    it("should create color unit value", () => {
      const value = createUnitValue({
        is_set: true,
        s_value: "#ff0000",
        color: "#ff0000",
      });
      expect(value.color).toBe("#ff0000");
      expect(value.s_value).toBe("#ff0000");
    });

    it("should create boolean unit value", () => {
      const value = createUnitValue({
        is_set: true,
        b_value: true,
      });
      expect(value.b_value).toBe(true);
    });
  });
});

describe("Calculated Dimensions", () => {
  describe("createUICalculated", () => {
    it("should create default calculated dimensions", () => {
      const calc = createUICalculated();
      expect(calc.x).toBe(0);
      expect(calc.y).toBe(0);
      expect(calc.width).toBe(0);
      expect(calc.height).toBe(0);
      expect(calc.render_width).toBe(0);
      expect(calc.render_height).toBe(0);
      expect(calc.width_override).toBe(0);
      expect(calc.lineBreak).toBe(false);
      expect(calc.absolute).toBe(false);
    });
  });
});

describe("Layout Context", () => {
  describe("createLayoutContext", () => {
    it("should create default layout context", () => {
      const ctx = createLayoutContext();
      expect(ctx.parentWidth).toBe(0);
      expect(ctx.parentHeight).toBe(0);
      expect(ctx.parentFontSize).toBe(14);
      expect(ctx.parentFontFamily).toBe("Helvetica");
      expect(ctx.parentColor).toBe("#000000");
    });

    it("should create layout context with dimensions", () => {
      const ctx = createLayoutContext(800, 600);
      expect(ctx.parentWidth).toBe(800);
      expect(ctx.parentHeight).toBe(600);
      expect(ctx.parentFontSize).toBe(14);
      expect(ctx.parentFontFamily).toBe("Helvetica");
      expect(ctx.parentColor).toBe("#000000");
    });
  });
});

describe("Linear Gradient", () => {
  describe("createLinearGradient", () => {
    it("should create default linear gradient", () => {
      const gradient = createLinearGradient();
      expect(gradient.is_set).toBe(false);
      expect(gradient.colors).toEqual([]);
      expect(gradient.stops).toEqual([]);
      expect(gradient.s_value).toBe("");
    });
  });
});

describe("UnitType Enum", () => {
  it("should have correct values", () => {
    expect(UnitType.None).toBe(0);
    expect(UnitType.Pixels).toBe(1);
    expect(UnitType.Percentage).toBe(2);
    expect(UnitType.Em).toBe(3);
    expect(UnitType.Fill).toBe(4);
    expect(UnitType.Auto).toBe(5);
  });
});
