"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs = require('fs');
const doc = new pdfkit_1.default;
doc.pipe(fs.createWriteStream('./output.pdf'));
// Write text using the font...
doc.font('./fonts/Open_Sans/OpenSans-Regular.ttf')
    .fontSize(25)
    .text('Some text with an embedded font!', 100, 100);
doc.font('./fonts/Great_Vibes/GreatVibes-Regular.ttf')
    .fontSize(25)
    .text('Some text with an embedded font!', 100, 130);
doc.save();
doc.end();
//# sourceMappingURL=pdfkit.js.map