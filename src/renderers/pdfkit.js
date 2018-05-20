"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const pdfkit_1 = __importDefault(require("pdfkit"));
const svg = require('../svg/');
class Renderer {
    constructor(width, height) {
        this.opacity_now = 1.0;
        this.doc = new pdfkit_1.default({ size: [width, height] });
        this.height = height;
        this.width = width;
    }
    hasCustomSize(item) {
        if (item.tagName == 'Label') {
            if (item.fontFamily.is_set) {
                const font_file = item.findFont(item.fontFamily.s_value);
                if (font_file) {
                    this.doc.font(font_file);
                }
                else {
                    this.doc.font('fonts/Open_Sans/OpenSans-Regular.ttf');
                }
            }
            else {
                this.doc.font('fonts/Open_Sans/OpenSans-Regular.ttf');
            }
            if (item.fontSize.is_set) {
                this.doc.fontSize(item.fontSize.pixels);
            }
            else {
                this.doc.fontSize(12);
            }
            // TODO: render multiline text
            return {
                width: this.doc.widthOfString(item.text.s_value),
                height: item.fontSize.f_value || 12
            };
        }
    }
    render(filename, item, headers) {
        const fs = require('fs');
        const doc = this.doc;
        doc.pipe(fs.createWriteStream(filename));
        this.renderItem(item, doc, headers);
        doc.save();
        doc.end();
    }
    setColors(ui, ctx) {
        if (ui.backgroundColor.is_set) {
            if (ui.opacity.is_set) {
                ctx.fillColor(ui.backgroundColor.s_value, ui.opacity.f_value);
                this.opacity_now = ui.opacity.f_value;
            }
            else {
                ctx.fillColor(ui.backgroundColor.s_value, this.opacity_now);
            }
        }
        else {
            ctx.fillColor('white', 0);
        }
        if (ui.borderWidth.is_set && ui.borderColor.is_set) {
            ctx.lineWidth(ui.borderWidth.pixels);
            if (ui.opacity.is_set) {
                ctx.strokeColor(ui.borderColor.s_value, ui.opacity.f_value);
            }
            else {
                ctx.strokeColor(ui.borderColor.s_value, this.opacity_now);
            }
        }
        else {
            ctx.strokeColor('white', 0).stroke();
        }
    }
    renderItem(item, ctx, headers) {
        const old_opacity = this.opacity_now;
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
        this.setColors(item, ctx);
        switch (item.tagName) {
            case 'div':
            case 'View':
                const r = new View(item);
                r.render(ctx);
                break;
            case 'Label':
                const label = new Label(item);
                label.render(ctx);
                break;
            case 'path':
                const path = new Path(item);
                path.render(ctx);
                break;
            case 'img':
                const im = new Image(item);
                im.render(ctx);
                break;
        }
        let page_y_pos = item.calculated.y;
        let page_item_cnt = 0;
        let top_margin = 0;
        let bottom_margin = 0;
        let y_adjust = 0;
        const render_headers = (item) => {
            if (headers) {
                const page_header = headers[0] ? headers[0]() : null;
                const page_footer = headers[1] ? headers[1]() : null;
                if (page_header) {
                    page_header.calculate(this.width, this.height, this);
                    this.renderItem(page_header, ctx);
                    top_margin = page_header.calculated.render_height;
                }
                if (page_footer) {
                    page_footer.calculate(this.width, this.height, this);
                    ctx.translate(0, this.height - page_footer.calculated.render_height);
                    this.renderItem(page_footer, ctx);
                    ctx.translate(0, -(this.height - page_footer.calculated.render_height));
                    bottom_margin = page_footer.calculated.render_height;
                }
                if (page_header) {
                    ctx.translate(0, top_margin);
                }
            }
        };
        render_headers(item[0]);
        const total_margin = bottom_margin + top_margin;
        const vertical_area = this.height - total_margin;
        for (let child of item.items) {
            if (page_item_cnt > 0 && ((child.calculated.y + child.calculated.render_height - y_adjust) > vertical_area)) {
                ctx.addPage();
                render_headers(child);
                page_y_pos += this.height;
                page_item_cnt = 0;
                y_adjust = child.calculated.y;
            }
            const dx = child.calculated.x;
            const dy = child.calculated.y;
            ctx.translate(dx, dy - y_adjust);
            this.renderItem(child, ctx);
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
    }
}
exports.Renderer = Renderer;
class Image {
    constructor(ui) {
        this.ui = ui;
    }
    initEngine() { }
    remove() { }
    render(ctx) {
        const ui = this.ui;
        const box = ui.calculated;
        if (ui.imageUrl.is_set) {
            console.log(ui.imageUrl.s_value);
            console.log(box);
            const fs = require('fs');
            ctx.fillOpacity(1);
            ctx.opacity(1);
            ctx.image(ui.imageUrl.s_value, 0, 0, { width: box.render_width, height: box.render_height });
        }
    }
}
class View {
    constructor(ui) {
        this.ui = ui;
    }
    initEngine() { }
    remove() { }
    render(ctx) {
        const ui = this.ui;
        const box = ui.calculated;
        if (ui.borderRadius.is_set) {
            ctx.roundedRect(0, 0, box.render_width, box.render_height, ui.borderRadius.pixels);
        }
        else {
            ctx.rect(0, 0, box.render_width, box.render_height);
        }
        ctx.fill();
        ctx.stroke();
    }
}
class Label {
    constructor(ui) {
        this.ui = ui;
    }
    initEngine() { }
    remove() { }
    render(ctx) {
        const ui = this.ui;
        const box = ui.calculated;
        if (ui.fontFamily.is_set) {
            const font_file = ui.findFont(ui.fontFamily.s_value);
            if (font_file) {
                ctx.font(font_file);
            }
            else {
                ctx.font('fonts/Open_Sans/OpenSans-Regular.ttf');
            }
        }
        else {
            ctx.font('fonts/Open_Sans/OpenSans-Regular.ttf');
        }
        if (ui.fontSize.is_set) {
            ctx.fontSize(ui.fontSize.pixels);
        }
        else {
            ctx.fontSize(12);
        }
        ctx.text(ui.text.s_value, 0, 0);
    }
}
// doc.path('M 0,20 L 100,160 Q 130,200 150,120 C 190,-40 200,200 300,150 L 400,90')
// .stroke()
class Path {
    constructor(ui) {
        this.ui = ui;
    }
    initEngine() { }
    remove() { }
    render(ctx) {
        const ui = this.ui;
        const parser = new svg.svgPathParser();
        parser.parse(ui.svgPath.s_value);
        parser.makePathAbsolute();
        parser.fitPathInto(ui.calculated.render_width, ui.calculated.render_height);
        const svgStr = parser.svgString();
        ctx.path(svgStr).fill().stroke();
    }
}
//# sourceMappingURL=pdfkit.js.map