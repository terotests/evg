

global.window = {document: {createElementNS: () => {return {}} }};
global.navigator = {};
global.btoa = () => {};

import jsPDF from 'jspdf'

var doc = new jsPDF()

doc.text('Hello world!', 10, 10)
// doc.save('a4.pdf')

var data = doc.output();
const fs = require('fs')
fs.writeFileSync('./document.pdf', data);