import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NodeEnvironment } from "./node";
import * as fs from "fs";
import * as path from "path";
import { PassThrough } from "stream";

// Mock file to clean up after tests
const TEST_OUTPUT_DIR = path.join(__dirname, "../../test-output");
const TEST_PDF_FILE = path.join(TEST_OUTPUT_DIR, "test-output.pdf");

describe("NodeEnvironment", () => {
  beforeEach(() => {
    // Ensure test output directory exists
    if (!fs.existsSync(TEST_OUTPUT_DIR)) {
      fs.mkdirSync(TEST_OUTPUT_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (fs.existsSync(TEST_PDF_FILE)) {
      fs.unlinkSync(TEST_PDF_FILE);
    }
  });

  describe("Static Factory Methods", () => {
    it("should create PDF environment with createPDF", async () => {
      const env = await NodeEnvironment.createPDF({
        width: 800,
        height: 600,
        installFonts: false, // Skip font installation for faster tests
      });

      expect(env).toBeInstanceOf(NodeEnvironment);
      expect(env.renderer).toBeDefined();
      expect(env.serializer).toBeDefined();
      expect(env.fontProvider).toBeDefined();
      expect(env.defaultWidth).toBe(800);
      expect(env.defaultHeight).toBe(600);
    });

    it("should create environment with custom renderer", () => {
      const mockRenderer = {
        beginDocument: vi.fn(),
        endDocument: vi.fn(),
        measureText: vi.fn().mockReturnValue({ width: 100, height: 14 }),
      };

      const env = NodeEnvironment.createWithRenderer(mockRenderer);
      expect(env.renderer).toBe(mockRenderer);
    });
  });

  describe("Constructor", () => {
    it("should extend EVGEnvironment", () => {
      const env = new NodeEnvironment();
      expect(env.defaultWidth).toBe(612);
      expect(env.defaultHeight).toBe(792);
    });

    it("should accept config options", () => {
      const env = new NodeEnvironment({
        defaultWidth: 1000,
        defaultHeight: 800,
      });
      expect(env.defaultWidth).toBe(1000);
      expect(env.defaultHeight).toBe(800);
    });
  });

  describe("renderToFile", () => {
    it("should throw error without renderer", async () => {
      const env = new NodeEnvironment();
      await expect(env.renderToFile("test.pdf", {} as any)).rejects.toThrow(
        "No renderer configured"
      );
    });
  });

  describe("renderToStream", () => {
    it("should throw error without renderer", async () => {
      const env = new NodeEnvironment();
      const stream = new PassThrough();
      await expect(env.renderToStream(stream, {} as any)).rejects.toThrow(
        "No renderer configured"
      );
    });
  });

  describe("renderToBuffer", () => {
    it("should throw error without renderer", async () => {
      const env = new NodeEnvironment();
      await expect(env.renderToBuffer({} as any)).rejects.toThrow(
        "No renderer configured"
      );
    });
  });
});

describe("NodeEnvironment Integration", () => {
  // These tests require actual rendering and are slower
  // Skip if PDFKit is not available

  it("should create full PDF environment", async () => {
    const env = await NodeEnvironment.createPDF({
      installFonts: false,
    });

    expect(env.renderer).toBeDefined();
    expect(env.serializer).toBeDefined();
    expect(env.fontProvider).toBeDefined();
  });
});
