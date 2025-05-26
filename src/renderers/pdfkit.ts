import { EVG } from "../layout/";
import { EVGPathParser, PathCollector, PathScaler } from "../svg/path";
// Import PDFKit with a dynamic require to ensure it works in both ESM and CommonJS environments
const PDFKit = require("pdfkit");
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

// Try multiple possible font paths to handle different installation scenarios
let fontPaths = [
  "fonts/Open_Sans/OpenSans-Regular.ttf", // Local development
  path.join(__dirname, "../fonts/Open_Sans/OpenSans-Regular.ttf"), // When imported as a dependency
  path.join(process.cwd(), "fonts/Open_Sans/OpenSans-Regular.ttf"), // From current working directory
  path.join(
    path.dirname(process.execPath),
    "fonts/Open_Sans/OpenSans-Regular.ttf"
  ), // From executable path
  path.join(
    path.dirname(process.execPath),
    "../fonts/Open_Sans/OpenSans-Regular.ttf"
  ), // One level up from executable
];

// Add absolute path for global NPM installation
if (process.env.APPDATA) {
  // Windows
  fontPaths.push(
    path.join(
      process.env.APPDATA,
      "npm/node_modules/evg/fonts/Open_Sans/OpenSans-Regular.ttf"
    )
  );
} else if (process.env.HOME) {
  // Linux/Mac
  fontPaths.push(
    path.join(
      process.env.HOME,
      ".npm/node_modules/evg/fonts/Open_Sans/OpenSans-Regular.ttf"
    )
  );
}

let default_font = null;

// Find the first path that exists
for (const fontPath of fontPaths) {
  try {
    if (fs.existsSync(fontPath)) {
      default_font = fontPath;
      break;
    }
  } catch (e) {
    // Continue trying other paths
  }
}

// If no font path worked, use the first one (it will fail later with a clearer error)
if (!default_font) {
  console.warn("Warning: Could not find OpenSans-Regular.ttf font file");
  default_font = fontPaths[0];
}

export class Renderer {
  width: number;
  height: number;
  doc: any;
  opacity_now = 1.0;
  text_color = "black";
  font_family = default_font;

  static_header = null;
  static_footer = null;
  constructor(width: number, height: number) {
    // Create a new PDFKit document instance
    this.doc = new PDFKit({ size: [width, height] });
    this.height = height;
    this.width = width;
  }

  hasCustomSize(item: EVG): any {
    if (item.tagName == "Label") {
      if (item.fontFamily.is_set) {
        const font_file = item.findFont(item.fontFamily.s_value);
        if (font_file) {
          this.doc.font(font_file);
        } else {
          this.doc.font(default_font);
        }
      } else {
        this.doc.font(default_font);
      }
      if (item.fontSize.is_set) {
        this.doc.fontSize(item.fontSize.pixels);
      } else {
        this.doc.fontSize(12);
      }
      // TODO: render multiline text
      return {
        width: this.doc.widthOfString(item.text.s_value),
        height: item.fontSize.f_value || 12,
      };
    }
  }

  async render(filename: string, item: EVG, headers?: any[]): Promise<any> {
    const fs = require("fs");
    const doc = this.doc;
    doc.pipe(fs.createWriteStream(filename));
    await this.renderItem(item, doc, headers, true);
    doc.save();
    doc.end();
  }

  async renderToStream(
    inputStream: any,
    item: EVG,
    headers?: any[]
  ): Promise<any> {
    const fs = require("fs");
    const doc = this.doc;
    doc.pipe(inputStream);
    await this.renderItem(item, doc, headers, true);
    doc.save();
    doc.end();
  }

  setColors(ui: EVG, ctx: any) {
    if (ui.color.is_set) {
      this.text_color = ui.color.s_value;
    }
    if (ui.backgroundColor.is_set) {
      if (ui.opacity.is_set) {
        ctx.fillColor(ui.backgroundColor.s_value, ui.opacity.f_value);
        this.opacity_now = ui.opacity.f_value;
      } else {
        ctx.fillColor(ui.backgroundColor.s_value, this.opacity_now);
      }
    } else {
      ctx.fillColor("white", 0);
    }
    if (ui.borderWidth.is_set && ui.borderColor.is_set) {
      ctx.lineWidth(ui.borderWidth.pixels);
      if (ui.opacity.is_set) {
        ctx.strokeColor(ui.borderColor.s_value, ui.opacity.f_value);
      } else {
        ctx.strokeColor(ui.borderColor.s_value, this.opacity_now);
      }
    } else {
      ctx.strokeColor("white", 0).stroke();
    }
  }

  async renderItem(item: EVG, ctx: any, headers?: any[], is_first?: boolean) {
    const old_opacity = this.opacity_now;
    const old_font = this.font_family;
    const old_color = this.text_color;
    if (item.opacity.is_set) {
      this.opacity_now = item.opacity.f_value;
    }
    ctx.fillOpacity(this.opacity_now);
    ctx.opacity(this.opacity_now);
    if (item.rotate.is_set) {
      // ctx.rotate(item.rotate.f_value, { origin: [item.calculated.render_width/2, item.calculated.render_height/2] })
      ctx.rotate(item.rotate.f_value);
    }
    if (item.scale.is_set && item.scale.f_value > 0.01) {
      ctx.scale(item.scale.f_value);
    }
    if (item.fontFamily.is_set) {
      const font_file = item.findFont(item.fontFamily.s_value);
      if (font_file) {
        this.font_family = font_file;
      }
    }
    this.setColors(item, ctx);
    switch (item.tagName) {
      case "header":
      case "footer":
      case "div":
      case "View":
        const r = new View(item);
        await r.render(ctx);
        break;
      case "Label":
        const label = new Label(item);
        ctx.save();
        ctx.fillOpacity(this.opacity_now);
        ctx.fillColor(this.text_color);
        await label.render(ctx, this);
        ctx.restore();
        break;
      case "path":
        const path = new Path(item);
        await path.render(ctx);
        break;
      case "img":
        const im = new Image(item);
        await im.render(ctx);
        break;
      case "QRCode":
        const qr = new QR_Code(item);
        await qr.render(ctx);
        break;
    }

    let page_y_pos = item.calculated.y;
    let page_item_cnt = 0;
    let top_margin = 0;
    let bottom_margin = 0;
    let y_adjust = 0;

    if (item.header) this.static_header = item.header;
    if (item.footer) this.static_footer = item.footer;

    const render_headers = async (item?: EVG) => {
      if (headers || this.static_header || this.static_footer) {
        const page_header =
          headers && headers[0] ? headers[0]() : this.static_header;
        const page_footer =
          headers && headers[1] ? headers[1]() : this.static_footer;
        if (page_header) {
          page_header.calculate(this.width, this.height, this);
          await this.renderItem(page_header, ctx);
          top_margin = page_header.calculated.render_height;
        }
        if (page_footer) {
          page_footer.calculate(this.width, this.height, this);
          ctx.translate(0, this.height - page_footer.calculated.render_height);
          await this.renderItem(page_footer, ctx);
          ctx.translate(
            0,
            -(this.height - page_footer.calculated.render_height)
          );
          bottom_margin = page_footer.calculated.render_height;
        }
        if (page_header) {
          ctx.translate(0, top_margin);
        }
      }
    };
    if (is_first) await render_headers(item[0]);
    const total_margin = bottom_margin + top_margin;
    const vertical_area = this.height - total_margin;

    for (let child of item.items) {
      if (
        is_first &&
        page_item_cnt > 0 &&
        (child.pageBreak.is_set ||
          (!child.left.is_set &&
            !child.top.is_set &&
            child.calculated.y + child.calculated.render_height - y_adjust >
              vertical_area))
      ) {
        ctx.addPage();
        await render_headers(child);
        page_y_pos += this.height;
        page_item_cnt = 0;
        y_adjust = child.calculated.y;
      }
      const dx = child.calculated.x;
      const dy = child.calculated.y;
      ctx.translate(dx, dy - y_adjust);
      ctx.save();
      await this.renderItem(child, ctx);
      ctx.restore();
      ctx.translate(-dx, -dy + y_adjust);
      page_item_cnt++;
    }

    if (item.scale.is_set && item.scale.f_value > 0.01) {
      ctx.scale(1 / item.scale.f_value);
    }
    if (item.rotate.is_set) {
      // ctx.rotate( - item.rotate.f_value, { origin: [item.calculated.render_width/2, item.calculated.render_height/2] })
      ctx.rotate(-item.rotate.f_value);
    }
    this.opacity_now = old_opacity;
    this.font_family = old_font;
    this.text_color = old_color;
  }
}

class Image {
  ui: EVG;
  constructor(ui: EVG) {
    this.ui = ui;
  }
  initEngine() {}
  remove() {}
  render(ctx: any) {
    const ui = this.ui;
    const box = ui.calculated;
    if (ui.imageUrl.is_set) {
      ctx.fillOpacity(1);
      ctx.opacity(1);
      ctx.image(ui.imageUrl.s_value, 0, 0, {
        width: box.render_width,
        height: box.render_height,
      });
    }
  }
}

class QR_Code {
  ui: EVG;
  constructor(ui: EVG) {
    this.ui = ui;
  }
  initEngine() {}
  remove() {}
  async render(ctx: any) {
    const ui = this.ui;
    const box = ui.calculated;
    if (ui.text.is_set) {
      const url = await QRCode.toDataURL(ui.text.s_value);
      ctx.fillOpacity(1);
      ctx.opacity(1);
      ctx.image(url, 0, 0, {
        width: box.render_width,
        height: box.render_height,
      });
    }
  }
}

class View {
  ui: EVG;
  constructor(ui: EVG) {
    this.ui = ui;
  }
  initEngine() {}
  remove() {}
  render(ctx: any) {
    const ui = this.ui;
    const box = ui.calculated;
    if (ui.borderRadius.is_set) {
      ctx.roundedRect(
        0,
        0,
        box.render_width,
        box.render_height,
        ui.borderRadius.pixels
      );
    } else {
      ctx.rect(0, 0, box.render_width, box.render_height);
    }

    // overflow property is set hidden, create the clip path and path again...
    if (ui.overflow.is_set) {
      if (ui.overflow.s_value === "hidden") {
        // creates the clip path
        ctx.clip();
        // needs to re-create the path
        if (ui.borderRadius.is_set) {
          ctx.roundedRect(
            0,
            0,
            box.render_width,
            box.render_height,
            ui.borderRadius.pixels
          );
        } else {
          ctx.rect(0, 0, box.render_width, box.render_height);
        }
      }
    }
    // overflow...
    ctx.fillAndStroke();
    // ctx.stroke()
  }
}

class Label {
  ui: EVG;
  constructor(ui: EVG) {
    this.ui = ui;
  }
  initEngine() {}
  remove() {}
  render(ctx: any, r: Renderer) {
    const ui = this.ui;
    const box = ui.calculated;
    if (ui.fontFamily.is_set) {
      const font_file = ui.findFont(ui.fontFamily.s_value);
      if (font_file) {
        ctx.font(font_file);
      } else {
        ctx.font(r.font_family);
      }
    } else {
      ctx.font(r.font_family);
    }
    if (ui.fontSize.is_set) {
      ctx.fontSize(ui.fontSize.pixels);
    } else {
      ctx.fontSize(12);
    }
    ctx.text(ui.text.s_value, 0, -3, {
      lineGap: 0,
      paragraphGap: 0,
    });
  }
}

class Path {
  ui: EVG;
  constructor(ui: EVG) {
    this.ui = ui;
  }
  initEngine() {}
  remove() {}
  render(ctx: any) {
    const ui = this.ui;
    const parser = new EVGPathParser();
    const coll = new PathScaler();
    parser.parsePath(ui.svgPath.s_value, coll);
    const svgStr = coll.getString(
      ui.calculated.render_width,
      ui.calculated.render_height
    );
    ctx.path(svgStr);
    if (ui.overflow.is_set) {
      if (ui.overflow.s_value === "hidden") {
        // creates the clip path
        ctx.clip();
        // needs to re-create the path
        ctx.path(svgStr);
      }
    }
    ctx.fill().stroke();
  }
}
