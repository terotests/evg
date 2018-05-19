
import PDFDocument from 'pdfkit'

const fs = require('fs')
const doc = new PDFDocument

doc.pipe( fs.createWriteStream('./output.pdf') )

// Write text using the font...
doc.font('./fonts/Open_Sans/OpenSans-Regular.ttf')
   .fontSize(25)
   .text('Some text with an embedded font!', 100, 100)

doc.font('./fonts/Great_Vibes/GreatVibes-Regular.ttf')
   .fontSize(25)
   .text('Some text with an embedded font!', 100, 130)

doc.save()
doc.end()