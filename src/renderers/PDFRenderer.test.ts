import { describe, it, expect, beforeEach } from "vitest";
import { PDFRenderer } from "./PDFRenderer";
import { MemoryFontProvider } from "../core";

describe("PDFRenderer", () => {
  let renderer: PDFRenderer;

  beforeEach(() => {
    renderer = new PDFRenderer();
  });

  describe("Document Lifecycle", () => {
    it("should initialize document with dimensions", () => {
      renderer.beginDocument(800, 600);
      expect(renderer.getDocumentSize()).toEqual({ width: 800, height: 600 });
    });

    it("should get the underlying PDFKit document", () => {
      renderer.beginDocument(800, 600);
      const doc = renderer.getDocument();
      expect(doc).toBeDefined();
    });
  });

  describe("Text Measurement", () => {
    it("should measure text with document", () => {
      renderer.beginDocument(800, 600);
      const measurement = renderer.measureText("Hello World", "Helvetica", 14);
      expect(measurement.width).toBeGreaterThan(0);
      expect(measurement.height).toBe(14);
    });

    it("should measure text without document (approximation)", () => {
      // Don't call beginDocument - should use approximation
      const measurement = renderer.measureText("Hello", "Helvetica", 14);
      expect(measurement.width).toBeGreaterThan(0);
      expect(measurement.height).toBeGreaterThan(0);
    });
  });

  describe("State Management", () => {
    it("should save and restore state", () => {
      renderer.beginDocument(800, 600);
      renderer.save();
      renderer.translate(100, 50);
      renderer.restore();
      // No error should be thrown
    });

    it("should set opacity", () => {
      renderer.beginDocument(800, 600);
      renderer.setOpacity(0.5);
      // No error should be thrown
    });

    it("should handle rotation", () => {
      renderer.beginDocument(800, 600);
      renderer.rotate(45);
      // No error should be thrown
    });

    it("should handle scaling", () => {
      renderer.beginDocument(800, 600);
      renderer.scale(2, 2);
      // No error should be thrown
    });
  });

  describe("Drawing Operations", () => {
    it("should draw rectangle", () => {
      renderer.beginDocument(800, 600);
      renderer.drawRect(10, 10, 100, 50, {
        fillColor: "#ff0000",
        strokeColor: "#000000",
        strokeWidth: 2,
      });
      // No error should be thrown
    });

    it("should draw rounded rectangle", () => {
      renderer.beginDocument(800, 600);
      renderer.drawRoundedRect(10, 10, 100, 50, 10, {
        fillColor: "#00ff00",
      });
      // No error should be thrown
    });

    it("should draw text", () => {
      renderer.beginDocument(800, 600);
      renderer.drawText("Hello World", 100, 100, {
        fontSize: 16,
        color: "#000000",
      });
      // No error should be thrown
    });
  });

  describe("Font Provider Integration", () => {
    it("should accept a font provider", () => {
      const fontProvider = new MemoryFontProvider();
      // Register a font that doesn't exist - the renderer should fall back to default
      fontProvider.registerFont("CustomFont", "/path/to/font.ttf");

      renderer.setFontProvider(fontProvider);
      renderer.beginDocument(800, 600);

      // Use default font (Helvetica) which PDFKit has built-in
      renderer.drawText("Test", 10, 10, { fontFamily: "Helvetica" });
      // No error should be thrown
    });

    it("should work with font provider in constructor", () => {
      const fontProvider = new MemoryFontProvider();
      const rendererWithFont = new PDFRenderer(fontProvider);
      rendererWithFont.beginDocument(800, 600);
      expect(rendererWithFont.getDocument()).toBeDefined();
    });

    it("should fall back to default font for unknown fonts", () => {
      renderer.beginDocument(800, 600);
      // This should not throw - it falls back to default font
      renderer.drawText("Test", 10, 10, { fontFamily: "UnknownFont" });
    });
  });

  describe("Clipping", () => {
    it("should set clip rect", () => {
      renderer.beginDocument(800, 600);
      renderer.setClipRect(10, 10, 100, 100);
      // No error should be thrown
    });
  });

  describe("Add Page", () => {
    it("should add new page", () => {
      renderer.beginDocument(800, 600);
      renderer.addPage();
      // No error should be thrown
    });

    it("should add page with custom dimensions", () => {
      renderer.beginDocument(800, 600);
      renderer.addPage(1200, 800);
      // No error should be thrown
    });
  });

  describe("measureElement", () => {
    it("should measure Label elements", () => {
      renderer.beginDocument(800, 600);
      const labelElement = {
        tagName: "Label",
        text: { is_set: true, s_value: "Hello World" },
        fontSize: { is_set: true, pixels: 14, f_value: 14 },
        fontFamily: { is_set: false },
        findFont: () => null,
      };
      const measurement = renderer.measureElement(labelElement);
      expect(measurement).toBeDefined();
      expect(measurement!.width).toBeGreaterThan(0);
      expect(measurement!.height).toBe(14);
    });

    it("should return undefined for non-Label elements", () => {
      renderer.beginDocument(800, 600);
      const viewElement = {
        tagName: "View",
        width: { is_set: true, pixels: 100 },
        height: { is_set: true, pixels: 50 },
      };
      const measurement = renderer.measureElement(viewElement);
      expect(measurement).toBeUndefined();
    });

    it("should use default font size when not specified", () => {
      renderer.beginDocument(800, 600);
      const labelElement = {
        tagName: "Label",
        text: { is_set: true, s_value: "Test" },
        fontSize: { is_set: false },
        fontFamily: { is_set: false },
        findFont: () => null,
      };
      const measurement = renderer.measureElement(labelElement);
      expect(measurement).toBeDefined();
      expect(measurement!.height).toBe(12); // Default font size
    });
  });
});
