"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const pdfkit_1 = __importDefault(require("pdfkit"));
class Renderer {
    render(filename, item, width, height) {
        const fs = require('fs');
        const doc = new pdfkit_1.default({ size: [width, height] });
        doc.pipe(fs.createWriteStream(filename));
        this.renderItem(item, doc);
        // Write text using the font...
        /*
        doc.font('./fonts/Open_Sans/OpenSans-Regular.ttf')
          .fontSize(25)
          .text('Some text with an embedded font!', 100, 100)
    
        doc.font('./fonts/Great_Vibes/GreatVibes-Regular.ttf')
          .fontSize(25)
          .text('Some text with an embedded font!', 100, 130)
        */
        doc.save();
        doc.end();
    }
    renderItem(item, ctx) {
        switch (item.tagName) {
            case 'View':
                const r = new View(item);
                r.render(ctx);
                break;
        }
        for (let child of item.items) {
            this.renderItem(child, ctx);
        }
    }
}
exports.Renderer = Renderer;
class View {
    constructor(ui) {
        this.ui = ui;
    }
    initEngine() {
        // nothing to init here...
    }
    remove() {
    }
    render(ctx) {
        const ui = this.ui;
        const box = ui.calculated;
        // console.log('render ', box)
        if (ui.borderRadius.is_set) {
            ctx.roundedRect(box.x, box.y, box.render_width, box.render_height, ui.borderRadius.pixels);
        }
        else {
            ctx.rect(box.x, box.y, box.render_width, box.render_height);
        }
        if (ui.backgroundColor.is_set) {
            if (ui.opacity.is_set) {
                ctx.fillColor(ui.backgroundColor.s_value, ui.opacity.f_value);
            }
            else {
                console.log('Fill', ui.backgroundColor.s_value);
                ctx.fillColor(ui.backgroundColor.s_value, 1);
            }
            ctx.fill();
        }
        else {
            ctx.fillColor('white', 0);
            ctx.fill();
        }
        if (ui.borderWidth.is_set && ui.borderColor.is_set) {
            ctx.lineWidth(ui.borderWidth.pixels);
            if (ui.opacity.is_set) {
                ctx.strokeColor(ui.borderColor.s_value, ui.opacity.f_value);
            }
            else {
                ctx.strokeColor(ui.borderColor.s_value, 1);
            }
            ctx.stroke();
        }
        else {
            ctx.strokeColor('white', 0).stroke();
        }
        // ctx.closePath()
    }
}
//# sourceMappingURL=pdfkit.js.map