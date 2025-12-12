/**
 * Node.js Font Provider
 *
 * Provides file system-based font management for Node.js environments.
 * Handles loading fonts from disk, finding shipped fonts, and registering custom fonts.
 */

import {
  AbstractFontProvider,
  FontSource,
  FontInfo,
  IFontProvider,
} from "../core";

const fs = require("fs");
const path = require("path");

/**
 * Font directory configuration
 */
interface FontDirectory {
  name: string;
  path: string;
  fonts: FontFileInfo[];
}

interface FontFileInfo {
  name: string;
  filename: string;
  weight?: number;
  style?: "normal" | "italic";
}

/**
 * Shipped font definitions
 */
const SHIPPED_FONTS: FontDirectory[] = [
  {
    name: "Open Sans",
    path: "Open_Sans",
    fonts: [
      {
        name: "OpenSans",
        filename: "OpenSans-Regular.ttf",
        weight: 400,
        style: "normal",
      },
      {
        name: "OpenSans-Bold",
        filename: "OpenSans-Bold.ttf",
        weight: 700,
        style: "normal",
      },
      {
        name: "OpenSans-Italic",
        filename: "OpenSans-Italic.ttf",
        weight: 400,
        style: "italic",
      },
      {
        name: "OpenSans-BoldItalic",
        filename: "OpenSans-BoldItalic.ttf",
        weight: 700,
        style: "italic",
      },
      {
        name: "OpenSans-Light",
        filename: "OpenSans-Light.ttf",
        weight: 300,
        style: "normal",
      },
      {
        name: "OpenSans-LightItalic",
        filename: "OpenSans-LightItalic.ttf",
        weight: 300,
        style: "italic",
      },
      {
        name: "OpenSans-Semibold",
        filename: "OpenSans-Semibold.ttf",
        weight: 600,
        style: "normal",
      },
      {
        name: "OpenSans-SemiboldItalic",
        filename: "OpenSans-SemiboldItalic.ttf",
        weight: 600,
        style: "italic",
      },
      {
        name: "OpenSans-ExtraBold",
        filename: "OpenSans-ExtraBold.ttf",
        weight: 800,
        style: "normal",
      },
      {
        name: "OpenSans-ExtraBoldItalic",
        filename: "OpenSans-ExtraBoldItalic.ttf",
        weight: 800,
        style: "italic",
      },
    ],
  },
  {
    name: "Helvetica",
    path: "Helvetica",
    fonts: [
      {
        name: "Helvetica",
        filename: "Helvetica.ttf",
        weight: 400,
        style: "normal",
      },
    ],
  },
  {
    name: "Audiowide",
    path: "audiowide",
    fonts: [
      {
        name: "Audiowide",
        filename: "audiowide.ttf",
        weight: 400,
        style: "normal",
      },
    ],
  },
  {
    name: "Candal",
    path: "Candal",
    fonts: [
      { name: "Candal", filename: "Candal.ttf", weight: 400, style: "normal" },
    ],
  },
  {
    name: "Cinzel",
    path: "Cinzel",
    fonts: [
      {
        name: "Cinzel",
        filename: "Cinzel-Regular.ttf",
        weight: 400,
        style: "normal",
      },
      {
        name: "Cinzel-Bold",
        filename: "Cinzel-Bold.ttf",
        weight: 700,
        style: "normal",
      },
      {
        name: "Cinzel-Black",
        filename: "Cinzel-Black.ttf",
        weight: 900,
        style: "normal",
      },
    ],
  },
  {
    name: "Monoton",
    path: "Monoton",
    fonts: [
      {
        name: "Monoton",
        filename: "Monoton-Regular.ttf",
        weight: 400,
        style: "normal",
      },
    ],
  },
];

/**
 * Node.js Font Provider
 * Manages fonts from the file system
 */
export class NodeFontProvider extends AbstractFontProvider {
  private fontBasePaths: string[] = [];
  private shippedFontsInstalled: boolean = false;
  private defaultFontName: string = "OpenSans";

  constructor() {
    super();
    this.initializeFontPaths();
  }

  /**
   * Initialize the list of possible font base paths
   */
  private initializeFontPaths(): void {
    this.fontBasePaths = [
      // Local development
      path.join(process.cwd(), "fonts"),
      // When used as a dependency (dist folder)
      path.join(__dirname, "../fonts"),
      path.join(__dirname, "../../fonts"),
      path.join(__dirname, "../../dist/fonts"),
      // Node modules installation
      path.join(process.cwd(), "node_modules/evg/dist/fonts"),
    ];

    // Platform-specific global installation paths
    if (process.env.APPDATA) {
      // Windows
      this.fontBasePaths.push(
        path.join(process.env.APPDATA, "npm/node_modules/evg/dist/fonts")
      );
    } else if (process.env.HOME) {
      // Linux/Mac
      this.fontBasePaths.push(
        path.join(process.env.HOME, ".npm/node_modules/evg/dist/fonts")
      );
    }
  }

  /**
   * Find the font base directory that exists
   */
  private findFontBasePath(): string | null {
    for (const basePath of this.fontBasePaths) {
      try {
        if (fs.existsSync(basePath)) {
          return basePath;
        }
      } catch {
        // Continue trying other paths
      }
    }
    return null;
  }

  /**
   * Install all shipped fonts
   */
  async installShippedFonts(): Promise<void> {
    if (this.shippedFontsInstalled) {
      return;
    }

    const basePath = this.findFontBasePath();
    if (!basePath) {
      console.warn("NodeFontProvider: Could not find font directory");
      return;
    }

    for (const fontDir of SHIPPED_FONTS) {
      const fontDirPath = path.join(basePath, fontDir.path);

      if (!fs.existsSync(fontDirPath)) {
        continue;
      }

      for (const font of fontDir.fonts) {
        const fontPath = path.join(fontDirPath, font.filename);

        if (fs.existsSync(fontPath)) {
          this.registerFont(font.name, fontPath, {
            weight: font.weight,
            style: font.style,
          });
        }
      }
    }

    this.shippedFontsInstalled = true;
  }

  /**
   * Register a font from a file path
   */
  registerFontFromFile(
    name: string,
    filePath: string,
    options?: Partial<FontInfo>
  ): boolean {
    try {
      const absolutePath = path.isAbsolute(filePath)
        ? filePath
        : path.join(process.cwd(), filePath);

      if (!fs.existsSync(absolutePath)) {
        console.warn(`NodeFontProvider: Font file not found: ${absolutePath}`);
        return false;
      }

      this.registerFont(name, absolutePath, options);
      return true;
    } catch (error) {
      console.warn(`NodeFontProvider: Error registering font ${name}:`, error);
      return false;
    }
  }

  /**
   * Register all fonts from a directory
   */
  registerFontsFromDirectory(dirPath: string, namePrefix?: string): number {
    let count = 0;

    try {
      const absolutePath = path.isAbsolute(dirPath)
        ? dirPath
        : path.join(process.cwd(), dirPath);

      if (!fs.existsSync(absolutePath)) {
        console.warn(`NodeFontProvider: Directory not found: ${absolutePath}`);
        return 0;
      }

      const files = fs.readdirSync(absolutePath);

      for (const file of files) {
        if (
          file.endsWith(".ttf") ||
          file.endsWith(".otf") ||
          file.endsWith(".woff")
        ) {
          const fontName =
            (namePrefix || "") + path.basename(file, path.extname(file));
          const fontPath = path.join(absolutePath, file);

          this.registerFont(fontName, fontPath);
          count++;
        }
      }
    } catch (error) {
      console.warn(`NodeFontProvider: Error scanning directory:`, error);
    }

    return count;
  }

  /**
   * Get the default font path
   */
  getDefaultFont(): string | null {
    // Try to get the registered default font
    const defaultFont = this.getFont(this.defaultFontName);
    if (defaultFont && typeof defaultFont === "string") {
      return defaultFont;
    }

    // Try to find OpenSans-Regular directly
    const basePath = this.findFontBasePath();
    if (basePath) {
      const openSansPath = path.join(
        basePath,
        "Open_Sans",
        "OpenSans-Regular.ttf"
      );
      if (fs.existsSync(openSansPath)) {
        return openSansPath;
      }
    }

    return null;
  }

  /**
   * Set the default font name
   */
  setDefaultFont(name: string): void {
    this.defaultFontName = name;
  }

  /**
   * Check if shipped fonts are installed
   */
  areShippedFontsInstalled(): boolean {
    return this.shippedFontsInstalled;
  }

  /**
   * Get the font base path if found
   */
  getFontBasePath(): string | null {
    return this.findFontBasePath();
  }

  /**
   * Load font file as buffer (useful for embedding)
   */
  loadFontBuffer(name: string): Buffer | null {
    const fontPath = this.getFont(name);
    if (!fontPath || typeof fontPath !== "string") {
      return null;
    }

    try {
      return fs.readFileSync(fontPath);
    } catch {
      return null;
    }
  }
}

/**
 * Create a Node font provider with shipped fonts pre-installed
 */
export async function createNodeFontProvider(): Promise<NodeFontProvider> {
  const provider = new NodeFontProvider();
  await provider.installShippedFonts();
  return provider;
}

/**
 * Synchronous version - creates provider but fonts loaded lazily
 */
export function createNodeFontProviderSync(): NodeFontProvider {
  const provider = new NodeFontProvider();
  // Install shipped fonts synchronously (the method is actually sync internally)
  provider.installShippedFonts();
  return provider;
}

/**
 * Global singleton for backward compatibility
 */
let globalNodeFontProvider: NodeFontProvider | null = null;

export function getGlobalNodeFontProvider(): NodeFontProvider {
  if (!globalNodeFontProvider) {
    globalNodeFontProvider = createNodeFontProviderSync();
  }
  return globalNodeFontProvider;
}

export function resetGlobalNodeFontProvider(): void {
  globalNodeFontProvider = null;
}
