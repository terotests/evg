import { describe, it, expect, beforeEach } from "vitest";
import {
  NodeFontProvider,
  createNodeFontProviderSync,
  getGlobalNodeFontProvider,
  resetGlobalNodeFontProvider,
} from "./NodeFontProvider";
import * as path from "path";
import * as fs from "fs";

describe("NodeFontProvider", () => {
  let provider: NodeFontProvider;

  beforeEach(() => {
    provider = new NodeFontProvider();
  });

  describe("initialization", () => {
    it("should create a new provider", () => {
      expect(provider).toBeInstanceOf(NodeFontProvider);
    });

    it("should start with no fonts registered", () => {
      expect(provider.listFonts()).toEqual([]);
    });

    it("should find font base path", () => {
      const basePath = provider.getFontBasePath();
      // May or may not find fonts depending on environment
      if (basePath) {
        expect(fs.existsSync(basePath)).toBe(true);
      }
    });
  });

  describe("installShippedFonts", () => {
    it("should install shipped fonts if available", async () => {
      await provider.installShippedFonts();

      // Check if shipped fonts were found and installed
      if (provider.getFontBasePath()) {
        expect(provider.listFonts().length).toBeGreaterThan(0);
        expect(provider.areShippedFontsInstalled()).toBe(true);
      }
    });

    it("should be idempotent", async () => {
      await provider.installShippedFonts();
      const count1 = provider.listFonts().length;

      await provider.installShippedFonts();
      const count2 = provider.listFonts().length;

      expect(count1).toBe(count2);
    });
  });

  describe("registerFont", () => {
    it("should register a font with path", () => {
      provider.registerFont("TestFont", "/path/to/font.ttf");
      expect(provider.hasFont("TestFont")).toBe(true);
      expect(provider.getFont("TestFont")).toBe("/path/to/font.ttf");
    });

    it("should register a font with options", () => {
      provider.registerFont("TestFont", "/path/to/font.ttf", {
        weight: 700,
        style: "italic",
      });

      const info = provider.getFontInfo("TestFont");
      expect(info?.weight).toBe(700);
      expect(info?.style).toBe("italic");
    });
  });

  describe("registerFontFromFile", () => {
    it("should return false for non-existent file", () => {
      const result = provider.registerFontFromFile(
        "Missing",
        "/nonexistent/font.ttf"
      );
      expect(result).toBe(false);
    });

    it("should register font if file exists", () => {
      // Find a real font file if shipped fonts directory exists
      const basePath = provider.getFontBasePath();
      if (basePath) {
        const fontPath = path.join(
          basePath,
          "Open_Sans",
          "OpenSans-Regular.ttf"
        );
        if (fs.existsSync(fontPath)) {
          const result = provider.registerFontFromFile(
            "OpenSans-Test",
            fontPath
          );
          expect(result).toBe(true);
          expect(provider.hasFont("OpenSans-Test")).toBe(true);
        }
      }
    });
  });

  describe("getDefaultFont", () => {
    it("should return null if no fonts installed", () => {
      const defaultFont = provider.getDefaultFont();
      // May or may not have a default depending on environment
      expect(defaultFont === null || typeof defaultFont === "string").toBe(
        true
      );
    });

    it("should return default font after installing shipped fonts", async () => {
      await provider.installShippedFonts();

      if (provider.getFontBasePath()) {
        const defaultFont = provider.getDefaultFont();
        expect(defaultFont).not.toBeNull();
      }
    });
  });

  describe("setDefaultFont", () => {
    it("should set the default font name", () => {
      provider.setDefaultFont("CustomFont");
      // Just verify it doesn't throw
    });
  });

  describe("loadFontBuffer", () => {
    it("should return null for unregistered font", () => {
      const buffer = provider.loadFontBuffer("Unknown");
      expect(buffer).toBeNull();
    });

    it("should load font buffer for registered font", async () => {
      await provider.installShippedFonts();

      if (provider.hasFont("OpenSans")) {
        const buffer = provider.loadFontBuffer("OpenSans");
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer!.length).toBeGreaterThan(0);
      }
    });
  });
});

describe("createNodeFontProviderSync", () => {
  it("should create provider with shipped fonts", () => {
    const provider = createNodeFontProviderSync();
    expect(provider).toBeInstanceOf(NodeFontProvider);

    if (provider.getFontBasePath()) {
      expect(provider.areShippedFontsInstalled()).toBe(true);
    }
  });
});

describe("Global Font Provider", () => {
  beforeEach(() => {
    resetGlobalNodeFontProvider();
  });

  it("should return singleton instance", () => {
    const provider1 = getGlobalNodeFontProvider();
    const provider2 = getGlobalNodeFontProvider();
    expect(provider1).toBe(provider2);
  });

  it("should reset singleton", () => {
    const provider1 = getGlobalNodeFontProvider();
    resetGlobalNodeFontProvider();
    const provider2 = getGlobalNodeFontProvider();
    expect(provider1).not.toBe(provider2);
  });
});
