import {EVG} from '../layout/'
import PDFDocument from 'pdfkit'


export class Renderer {

  doc:PDFDocument 

  constructor( width:number, height:number) {
    this.doc = new PDFDocument({size:[width, height]})
  }

  hasCustomSize(item:EVG) : any {
    console.log('Tag ', item.tagName)
    if(item.tagName == 'Label') {
      if(item.fontFamily.is_set) {
        this.doc.font('fonts/Open_Sans/OpenSans-Regular.ttf')
      } else {
        this.doc.font('fonts/Open_Sans/OpenSans-Regular.ttf')
      }
      if(item.fontSize.is_set) {
        this.doc.fontSize(item.fontSize.pixels)
      } else {
        this.doc.fontSize(12)
      }
      // TODO: render multiline text
      return {
        width : this.doc.widthOfString(item.text.s_value),
        height : item.fontSize.pixels || 12
      }
    }  
  }
  
  render( filename:string, item:EVG ) : any {

    const fs = require('fs')
    const doc = this.doc

    doc.pipe( fs.createWriteStream(filename) )

    this.renderItem( item, doc )

    // Write text using the font...
    /*
    doc.font('./fonts/Open_Sans/OpenSans-Regular.ttf')
      .fontSize(25)
      .text('Some text with an embedded font!', 100, 100)

    doc.font('./fonts/Great_Vibes/GreatVibes-Regular.ttf')
      .fontSize(25)
      .text('Some text with an embedded font!', 100, 130)
    */
    doc.save()
    doc.end()
  }

  renderItem( item:EVG, ctx:any ) {
    switch(item.tagName) {
      case 'View' :
        const r = new View(item)
        r.render(ctx)
      break;
      case 'Label' :
        const label = new Label(item)
        label.render(ctx)
      break;      
    }
    for( let child of item.items ) {
      this.renderItem( child, ctx )
    }
  } 
}

class View {
  ui:EVG  
  constructor(ui:EVG) {
    this.ui = ui
  }
	initEngine () {}
	remove() {}
	render(ctx?:any) {
    const ui = this.ui;
    const box = ui.calculated
    if(ui.borderRadius.is_set) {
      ctx.roundedRect(box.x, box.y, box.render_width, box.render_height, ui.borderRadius.pixels)
    } else {
      ctx.rect(box.x, box.y, box.render_width, box.render_height)
    }
    if( ui.backgroundColor.is_set) {
      if(ui.opacity.is_set) {
        ctx.fillColor(ui.backgroundColor.s_value, ui.opacity.f_value)
      } else {
        console.log('Fill', ui.backgroundColor.s_value)
        ctx.fillColor(ui.backgroundColor.s_value, 1)
      }
      ctx.fill()
    } else {
      ctx.fillColor('white', 0)
      ctx.fill()
    }

    if( ui.borderWidth.is_set && ui.borderColor.is_set) {
      ctx.lineWidth(ui.borderWidth.pixels)
      if(ui.opacity.is_set) {
        ctx.strokeColor(ui.borderColor.s_value, ui.opacity.f_value)
      } else {
        ctx.strokeColor(ui.borderColor.s_value, 1)
      }
      ctx.stroke()
    } else {
      ctx.strokeColor('white', 0).stroke()
    }
    // ctx.closePath()
	}
}

class Label {
  ui:EVG  
  constructor(ui:EVG) {
    this.ui = ui
  }
	initEngine () {}
	remove() {}
	render(ctx?:any) {
    const ui = this.ui;
    const box = ui.calculated
    if(ui.fontFamily.is_set) {
      ctx.font('fonts/Open_Sans/OpenSans-Regular.ttf')
    } else {
      ctx.font('fonts/Open_Sans/OpenSans-Regular.ttf')
    }
    if(ui.fontSize.is_set) {
      ctx.fontSize(ui.fontSize.pixels)
    } else {
      ctx.fontSize(12)
    }   
    console.log('TEXT', ui.text.s_value)
    console.log(box)
    ctx.fillColor('black', 1)
    ctx.text(ui.text.s_value, box.x, box.y)
	}
}
