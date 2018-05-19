"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
global.window = { document: { createElementNS: () => { return {}; } } };
global.navigator = {};
global.btoa = () => { };
const jspdf_1 = __importDefault(require("jspdf"));
var doc = new jspdf_1.default();
doc.text('Hello world!', 10, 10);
// doc.save('a4.pdf')
var data = doc.output();
const fs = require('fs');
fs.writeFileSync('./document.pdf', data);
//# sourceMappingURL=pdfhello.js.map