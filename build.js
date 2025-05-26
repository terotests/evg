const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

// Configuration
const BUILD_DIR = "dist";
const ENTRY_POINTS = [
  // Only two main entry points
  { input: "src/bin/evg.ts", output: "bin/evg.js" }, // CLI tool
  { input: "src/layout/index.ts", output: "index.js" }, // Main module
];

// Clean and recreate build directory
if (fs.existsSync(BUILD_DIR)) {
  console.log("Cleaning previous build...");
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR, { recursive: true });
console.log("Created fresh build directory.");

// Build function
async function build() {
  try {
    // Process each entry point separately
    for (const entry of ENTRY_POINTS) {
      console.log(`Building ${entry.input} -> ${entry.output}`);

      const options = {
        entryPoints: [entry.input],
        bundle: true,
        platform: "node",
        target: ["node12"],
        outfile: path.join(BUILD_DIR, entry.output),
        format: "cjs",
        sourcemap: true,
        external: ["pdfkit", "qrcode", "xmldom", "chai", "jspdf", "minimist"], // External dependencies
        loader: {
          ".ttf": "file",
          ".jpeg": "file",
          ".jpg": "file",
          ".png": "file",
        },
      };

      // Add shebang only to CLI file
      /*
      if (entry.output.includes("bin/")) {
        options.banner = {
          js: "#!/usr/bin/env node",
        };
      }
      */

      await esbuild.build(options);
    }

    console.log("Build complete!");
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

// Generate type definitions
function generateTypes() {
  const { execSync } = require("child_process");
  try {
    console.log("Generating TypeScript declarations...");

    // Create a simple declaration for the main module
    const declarationContent = `
// Type definitions for EVG module
import { Renderer } from "./bin/evg";

export class UIRenderPosition {
    x: number;
    y: number;
    renderer: any;
    constructor(x: number, y: number, renderer: any);
}

export class UICalculated {
    x: number;
    y: number;
    width: number;
    height: number;
    render_width: number;
    render_height: number;
    width_override: number;
    lineBreak: boolean;
    absolute: boolean;
}

export function register_font(name: string, fontFile: string): void;
export function register_component(name: string, component: string): void;
export function register_renderer(name: string, component: any): void;

export class EVG {
    static installShippedFonts(): void;
    static installFont(name: string, fileName: string): void;
    static installComponent(name: string, componentData: string): void;
    static async renderToStream(inputStream: any, width: number, height: number, item: EVG, header?: (item: EVG) => EVG, footer?: (item: EVG) => EVG): Promise<void>;
    static async renderToFile(fileName: string, width: number, height: number, item: EVG, header?: (item: EVG) => EVG, footer?: (item: EVG) => EVG): Promise<void>;
    findComponent(name: string): string;
    findFont(name: string): string;
    add(childView: any): EVG | undefined;
    calculate(width: number, height: number, renderer?: any): EVG;
    static fromXML(xmlData: string): EVG;
    // ... other methods and properties
}
`;

    fs.writeFileSync("dist/index.d.ts", declarationContent);
    console.log("TypeScript declarations generated successfully.");
  } catch (error) {
    console.error("Failed to generate TypeScript declarations:", error);
  }
}

// Copy additional files needed for the package
function copyAdditionalFiles() {
  try {
    console.log("Adding additional files to build...");

    // Ensure bin directory exists
    const binDir = path.join(BUILD_DIR, "bin");
    if (!fs.existsSync(binDir)) {
      fs.mkdirSync(binDir, { recursive: true });
    }

    // Try to make bin file executable on Unix systems
    const binFilePath = path.join(BUILD_DIR, "bin/evg.js");
    if (fs.existsSync(binFilePath)) {
      fs.chmodSync(binFilePath, "755");
      console.log("Made CLI tool executable:", binFilePath);
    } else {
      console.warn("Warning: Bin file not found at:", binFilePath);
    }

    // Copy fonts directory to dist
    const srcFontsDir = path.join(__dirname, "fonts");
    const destFontsDir = path.join(BUILD_DIR, "fonts");

    if (!fs.existsSync(destFontsDir)) {
      fs.mkdirSync(destFontsDir, { recursive: true });
    }

    if (fs.existsSync(srcFontsDir)) {
      copyFolderSync(srcFontsDir, destFontsDir);
      console.log("Font files copied successfully.");
    } else {
      console.warn("Warning: Fonts directory not found at:", srcFontsDir);
    }

    // Clean up any TypeScript declaration files that might have been generated in src/
    try {
      // Delete all .d.ts files in src and test directories
      cleanupTypeScriptDeclarations("src");
      cleanupTypeScriptDeclarations("test");

      // Remove any other directories in dist/ except bin/ and fonts/
      const distContents = fs.readdirSync(BUILD_DIR);
      distContents.forEach((item) => {
        const itemPath = path.join(BUILD_DIR, item);
        if (
          fs.statSync(itemPath).isDirectory() &&
          item !== "bin" &&
          item !== "fonts"
        ) {
          fs.rmSync(itemPath, { recursive: true, force: true });
          console.log(`Removed unnecessary directory: ${item}`);
        }
      });
    } catch (cleanupError) {
      console.warn("Warning: Error during cleanup:", cleanupError);
    }
  } catch (error) {
    console.warn("Warning: Error during file operations:", error);
  }
}

// Helper function to clean up TypeScript declaration files
function cleanupTypeScriptDeclarations(directory) {
  if (fs.existsSync(directory)) {
    const files = fs.readdirSync(directory);

    files.forEach((file) => {
      const filePath = path.join(directory, file);
      if (fs.statSync(filePath).isDirectory()) {
        cleanupTypeScriptDeclarations(filePath);
      } else if (file.endsWith(".d.ts")) {
        fs.unlinkSync(filePath);
      }
    });
  }
}

// Helper function to copy a folder recursively
function copyFolderSync(source, target) {
  // Check if folder needs to be created
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // Copy each file to the target directory
  const files = fs.readdirSync(source);
  files.forEach((file) => {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    // Recursive copy for directories
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolderSync(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }
  });
}

// Run all build steps
async function main() {
  await build();
  generateTypes();
  copyAdditionalFiles();
}

main();
