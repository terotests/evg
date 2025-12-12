import { describe, it, expect, beforeEach, vi } from "vitest";
import { EVGEnvironment } from "./index";
import { ComponentRegistry, MemoryFontProvider, NullRenderer } from "../core";

describe("EVGEnvironment", () => {
  describe("Constructor", () => {
    it("should create environment with default values", () => {
      const env = new EVGEnvironment();
      expect(env.renderer).toBeNull();
      expect(env.serializer).toBeNull();
      expect(env.fontProvider).toBeNull();
      expect(env.componentRegistry).toBeDefined();
      expect(env.defaultWidth).toBe(612);
      expect(env.defaultHeight).toBe(792);
    });

    it("should create environment with custom config", () => {
      const renderer = new NullRenderer();
      const fontProvider = new MemoryFontProvider();
      const componentRegistry = new ComponentRegistry();

      const env = new EVGEnvironment({
        renderer,
        fontProvider,
        componentRegistry,
        defaultWidth: 800,
        defaultHeight: 600,
      });

      expect(env.renderer).toBe(renderer);
      expect(env.fontProvider).toBe(fontProvider);
      expect(env.componentRegistry).toBe(componentRegistry);
      expect(env.defaultWidth).toBe(800);
      expect(env.defaultHeight).toBe(600);
    });
  });

  describe("Getters and Setters", () => {
    let env: EVGEnvironment;

    beforeEach(() => {
      env = new EVGEnvironment();
    });

    it("should set and get renderer", () => {
      const renderer = new NullRenderer();
      env.renderer = renderer;
      expect(env.renderer).toBe(renderer);
    });

    it("should set and get fontProvider", () => {
      const fontProvider = new MemoryFontProvider();
      env.fontProvider = fontProvider;
      expect(env.fontProvider).toBe(fontProvider);
    });

    it("should set and get componentRegistry", () => {
      const registry = new ComponentRegistry();
      env.componentRegistry = registry;
      expect(env.componentRegistry).toBe(registry);
    });

    it("should set and get default dimensions", () => {
      env.defaultWidth = 1000;
      env.defaultHeight = 800;
      expect(env.defaultWidth).toBe(1000);
      expect(env.defaultHeight).toBe(800);
    });

    it("should return renderer as measurer", () => {
      const renderer = new NullRenderer();
      env.renderer = renderer;
      expect(env.measurer).toBe(renderer);
    });
  });

  describe("Font Management", () => {
    let env: EVGEnvironment;
    let fontProvider: MemoryFontProvider;

    beforeEach(() => {
      fontProvider = new MemoryFontProvider();
      env = new EVGEnvironment({ fontProvider });
    });

    it("should register fonts", () => {
      env.registerFont("Arial", "/path/to/arial.ttf");
      expect(env.getFont("Arial")).toBe("/path/to/arial.ttf");
    });

    it("should list fonts", () => {
      env.registerFont("Arial", "/path/to/arial.ttf");
      env.registerFont("Helvetica", "/path/to/helvetica.ttf");
      expect(env.listFonts()).toEqual(["Arial", "Helvetica"]);
    });

    it("should return null for unknown fonts", () => {
      expect(env.getFont("Unknown")).toBeNull();
    });

    it("should handle missing font provider", () => {
      const envNoFonts = new EVGEnvironment();
      envNoFonts.registerFont("Arial", "/path/to/arial.ttf");
      expect(envNoFonts.getFont("Arial")).toBeNull();
      expect(envNoFonts.listFonts()).toEqual([]);
    });
  });

  describe("Component Management", () => {
    let env: EVGEnvironment;

    beforeEach(() => {
      env = new EVGEnvironment();
    });

    it("should register components", () => {
      env.registerComponent("Button", '<View><Label text="Click"/></View>');
      expect(env.hasComponent("Button")).toBe(true);
      expect(env.getComponent("Button")).toBe(
        '<View><Label text="Click"/></View>'
      );
    });

    it("should list components", () => {
      env.registerComponent("Button", "<View/>");
      env.registerComponent("Card", "<View/>");
      expect(env.listComponents()).toEqual(["Button", "Card"]);
    });

    it("should return undefined for unknown components", () => {
      expect(env.getComponent("Unknown")).toBeUndefined();
    });
  });

  describe("Rendering", () => {
    it("should throw error when rendering without renderer", () => {
      const env = new EVGEnvironment();
      expect(() => env.render({} as any)).toThrow(
        "No renderer configured for this environment"
      );
    });

    it("should call beginDocument with dimensions", () => {
      const renderer = new NullRenderer();
      const beginSpy = vi.spyOn(renderer, "beginDocument");

      const env = new EVGEnvironment({
        renderer,
        defaultWidth: 800,
        defaultHeight: 600,
      });

      env.render({} as any);
      expect(beginSpy).toHaveBeenCalledWith(800, 600);
    });

    it("should use custom dimensions from options", () => {
      const renderer = new NullRenderer();
      const beginSpy = vi.spyOn(renderer, "beginDocument");

      const env = new EVGEnvironment({ renderer });
      env.render({} as any, { width: 1000, height: 800 });

      expect(beginSpy).toHaveBeenCalledWith(1000, 800);
    });
  });

  describe("Static Factory Methods", () => {
    it("should create minimal environment", () => {
      const env = EVGEnvironment.createMinimal();
      expect(env.renderer).toBeNull();
      expect(env.serializer).toBeNull();
    });

    it("should create environment with custom config", () => {
      const renderer = new NullRenderer();
      const env = EVGEnvironment.create({ renderer });
      expect(env.renderer).toBe(renderer);
    });
  });
});

describe("EVGEnvironment Integration", () => {
  it("should work with all components configured", () => {
    const renderer = new NullRenderer();
    const fontProvider = new MemoryFontProvider();
    const componentRegistry = new ComponentRegistry();

    const env = new EVGEnvironment({
      renderer,
      fontProvider,
      componentRegistry,
      defaultWidth: 800,
      defaultHeight: 600,
    });

    // Register a font
    env.registerFont("TestFont", "/path/to/font.ttf");

    // Register a component
    env.registerComponent("Button", '<View background-color="blue"/>');

    // Verify configuration
    expect(env.getFont("TestFont")).toBe("/path/to/font.ttf");
    expect(env.getComponent("Button")).toBe('<View background-color="blue"/>');
    expect(env.measurer).toBe(renderer);
  });
});
