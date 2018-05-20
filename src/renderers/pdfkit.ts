import {EVG} from '../layout/'
import PDFDocument from 'pdfkit'

const svg = require('../svg/')
 
export class Renderer {

  doc:PDFDocument 

  opacity_now = 1.0

  constructor( width:number, height:number) {
    this.doc = new PDFDocument({size:[width, height]})
  }

  hasCustomSize(item:EVG) : any {
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
    this.renderItem( item, doc  )
    doc.save()
    doc.end()
  }

  setColors( ui:EVG, ctx:any) {
    if( ui.backgroundColor.is_set) {
      if(ui.opacity.is_set) {
        ctx.fillColor(ui.backgroundColor.s_value, ui.opacity.f_value)
        this.opacity_now = ui.opacity.f_value
      } else {        
        ctx.fillColor(ui.backgroundColor.s_value, this.opacity_now)
      }
    } else {
      ctx.fillColor('white', 0)
    }
    if( ui.borderWidth.is_set && ui.borderColor.is_set) {
      ctx.lineWidth(ui.borderWidth.pixels)
      if(ui.opacity.is_set) {
        ctx.strokeColor(ui.borderColor.s_value, ui.opacity.f_value)
      } else {
        ctx.strokeColor(ui.borderColor.s_value, this.opacity_now)
      }
    } else {
      ctx.strokeColor('white', 0).stroke()
    }
  }  

  renderItem( item:EVG, ctx:any ) {
    const old_opacity = this.opacity_now
    if(item.opacity.is_set) {
      this.opacity_now = item.opacity.f_value
    }
    ctx.fillOpacity(this.opacity_now)
    ctx.opacity(this.opacity_now)    
    if(item.rotate.is_set) {
      // ctx.rotate(item.rotate.f_value, { origin: [item.calculated.render_width/2, item.calculated.render_height/2] })      
      ctx.rotate(item.rotate.f_value)      
    }
    if(item.scale.is_set && item.scale.f_value > 0.01 ) {
      ctx.scale(item.scale.f_value)
    }
    this.setColors( item, ctx  )    
    switch(item.tagName) {
      case 'View' :
        const r = new View(item)
        r.render(ctx)
      break;
      case 'Label' :
        const label = new Label(item)
        label.render(ctx)
      break;      
      case 'path' :
        const path = new Path(item)
        path.render(ctx)
      break;   
      case 'img' :
        const im = new Image(item)
        im.render(ctx)
      break;   

    }

    for( let child of item.items ) {
      const dx = child.calculated.x
      const dy = child.calculated.y
      ctx.translate( dx, dy)
      this.renderItem( child, ctx )
      ctx.translate( -dx, -dy)
    }
    if(item.scale.is_set && item.scale.f_value > 0.01) {
      ctx.scale(1/item.scale.f_value)
    }    
    if(item.rotate.is_set) {
      // ctx.rotate( - item.rotate.f_value, { origin: [item.calculated.render_width/2, item.calculated.render_height/2] })      
      ctx.rotate( - item.rotate.f_value )
    }    

    this.opacity_now = old_opacity
    
  }
  
  
}

class Image {
  ui:EVG  
  constructor(ui:EVG) {
    this.ui = ui
  }
	initEngine () {}
	remove() {}
	render(ctx:any ) {
    const ui = this.ui;
    const box = ui.calculated
    if(ui.imageUrl.is_set) {
      console.log(ui.imageUrl.s_value)
      console.log(box)
      const fs = require('fs')

      ctx.fillOpacity(1)
      ctx.opacity(1)          
      ctx.image(ui.imageUrl.s_value,0,0, {width: box.render_width, height: box.render_height})

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
	render(ctx:any ) {
    const ui = this.ui;
    const box = ui.calculated
    if(ui.borderRadius.is_set) {
      ctx.roundedRect(0,0, box.render_width, box.render_height, ui.borderRadius.pixels)
    } else {
      ctx.rect(0,0, box.render_width, box.render_height)
    }
    ctx.fill()
    ctx.stroke()
	}
}

class Label {
  ui:EVG  
  constructor(ui:EVG) {
    this.ui = ui
  }
	initEngine () {}
	remove() {}
	render(ctx:any  ) {
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
    ctx.text(ui.text.s_value, 0, 0)
	}
}
// doc.path('M 0,20 L 100,160 Q 130,200 150,120 C 190,-40 200,200 300,150 L 400,90')
// .stroke()

class Path {
  ui:EVG  
  constructor(ui:EVG) {
    this.ui = ui
  }
	initEngine () {}
	remove() {}
	render(ctx:any  ) {
    const ui = this.ui
    const parser = new svg.svgPathParser()
    parser.parse( ui.svgPath.s_value)
    parser.makePathAbsolute();
    parser.fitPathInto( ui.calculated.render_width, ui.calculated.render_height );
    const svgStr = parser.svgString()    
    ctx.path( svgStr ).fill().stroke()
    
	}
}
