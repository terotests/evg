
"use strict"; 

function escapeXml(unsafe) {
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

 function $(strings, ...values) {

 	var s = "",i=0;
 	for(; i<values.length; i++) {
 		if(typeof(values[i])=="string") {
 			s+=strings[i]+escapeXml(values[i]);
 		} else {
 			var o = values[i];
 			if( typeof o == 'object' && o.constructor == Object ) {
 				var list = Object.keys(o);
 				s+=strings[i]+" "+list.map((key)=>{
 					return key+"=\""+escapeXml(o[key]+"")+"\"";
 				}).join(" ")+" ";
 			} else {
		 		s+=strings[i]+values[i];
		 	}
	 	}
 	}
 	s+=strings[i];
 	// console.log("Building ",s);
 	return new UIStructure(s);
 }


function ela(str) {

  var s;
  if(typeof(str)=="object") {
  	s = str;
  } else {
    s = new UIStructure(str);
  }
  var container = new UIStructure({innerWidth:window.innerWidth+"px",                                   
  							       innerHeight:window.innerHeight+"px"});
  s.calculateLayout(container, new UIRenderPosition({x:0, y:0}));
  s.render();  
  return s.renderer.view;
}


var TextMeasure = {

};

var UIViewRenderEngine = function( initWithUI ) {
	this.ui = initWithUI;

	var colorSlide;
	var usedFont;
	var last_x  = 0;
	var last_y  = 0;
	var last_width   = 0;
	var last_height  = 0;
	var last_radius  = 0;
	var last_color;
	// var last_render = new UIStructure();

	this.initEngine = function(){

		if(this.b_init_done) { return; }

		var view = document.createElement('DIV');
		view.style.position='absolute';
		this.view = view;
		if( this.ui.parentView && this.ui.parentView.renderer && this.ui.parentView.renderer.view) {
			this.ui.parentView.renderer.view.appendChild( view );

		}
		this.b_init_done = true;

	}

	this.createCSS = function(ui) {

		var styles = {}
		if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
			styles["overflow"] = "hidden";
		}
		if(ui.color.is_set) {
			styles["color"] = ui.color.s_value;
		}
		if(ui.backgroundColor.is_set) {
			styles["background-color"] = ui.backgroundColor.s_value;
		}
		if(ui.opacity.is_set) {
			styles["opacity"] = ui.opacity.f_value;
		}
		if(ui.borderRadius.is_set) {
			styles["border-radius"] = ui.borderRadius.pixels;
		}
		if(ui.borderWidth.is_set) {
			styles["border-width"] = ui.borderWidth.pixels;
		}		
		if(ui.borderColor.is_set) {
			styles["border-color"] = ui.borderWidth.pixels;
		}			
		if(ui.fontSize.is_set) {
			styles["font-size"] = ui.fontSize.pixels;
		}

		if(ui.linearGradient.is_set) {
			styles["background"] = "linear-gradient("+ui.linearGradient.s_value+")";
		}

		if(ui.shadowRadius.is_set) {
			var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
			styles["box-shadow"]  = " 0px 0px "+ui.shadowRadius.pixels+"px "+parseInt(ui.shadowRadius.pixels/2)+"px "+shadowColor+"";
		}
		var transformStr = "";
		if(ui.scale.is_set) {
			transformStr += "scale("+ui.scale.f_value+") ";
		}
		if(ui.rotate.is_set) {
			transformStr += "rotate("+ui.rotate.f_value+"deg) ";
		}		

		if(transformStr) {
			styles["transform"] = transformStr;
		}

		styles["transition"] = "all 0.5s";

		return styles;	
	}

	// fix: remove child function
	this.remove = function() {
		if(this.view && this.view.parentNode) {
			this.view.parentNode.removeChild( this.view );
			this.ui = null;
			if(this.clickListener) {
				this.view.removeEventListener("click", this.clickListener);
			}
			this.clickListener = null;
		}
	}

	this.render = function() {
		var plainView = this.view;
		if (plainView) {
			var view = plainView;
			var ui = this.ui;
			var c = ui.calculated;
			var animating_opacity = false;
			if(ui.isHidden && !view.hidden) {
			}

			// maybe faster local styles assign...
			var styles = []
			styles.push("position:absolute;");
			styles.push("left:"+c.x+"px;");
			styles.push("top:"+c.y+"px;");
			styles.push("width:"+c.render_width+"px;");
			styles.push("height:"+c.render_height+"px;");
			// styles.push("box-sizing: border-box;");

			if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
				styles.push("overflow:hidden;");
			}
			if(ui.color.is_set) {
				styles.push("color:"+ui.color.s_value+";");
			}
			if(ui.backgroundColor.is_set) {
				styles.push("background-color:"+ui.backgroundColor.s_value+";");
			}
			if(ui.opacity.is_set) {
				styles.push("opacity:"+ui.opacity.f_value+";");
			}
			if(ui.borderRadius.is_set) {
				styles.push("border-radius:"+ui.borderRadius.pixels+"px;");
			}

			// fix: border width, color
			if(ui.borderWidth.is_set) {
				styles.push("border-style:solid;");
				styles.push("border-width:"+ui.borderWidth.pixels+"px;");
			}
			if(ui.borderColor.is_set) {
				styles.push("border-color:"+ui.borderColor.s_value+";");
			}						

			if(ui.fontSize.is_set) {
				styles.push("font-size:"+ui.fontSize.pixels+"px;");
			}

			if(ui.linearGradient.is_set) {
				styles.push("background-image:-webkit-linear-gradient("+ui.linearGradient.s_value+");");
				styles.push("background-image:linear-gradient("+ui.linearGradient.s_value+");");
			}

			if(ui.shadowRadius.is_set) {
				var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
				// fix: shadow to correspond canvas shadow
				styles.push("box-shadow: 0px 0px "+ui.shadowRadius.pixels+"px 0px "+shadowColor+";");
			}


			var transformStr = "";
			if(ui.scale.is_set) {
				transformStr += "scale("+ui.scale.f_value+") ";
			}
			if(ui.rotate.is_set) {
				transformStr += "rotate("+ui.rotate.f_value+"deg) ";
			}		

			if(transformStr) {
				styles.push("transform:"+transformStr);
			}			

			// FIX: add hover metatag
			if(ui.metaTags["Hover"]) {
				var hover = ui.metaTags["Hover"];
				var styleObj = this.createCSS(hover);
				if(!ui.guid) ui.guid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
				view.className= "view"+ui.guid;
				css().bind(".view"+ui.guid+":hover", styleObj);
				styles.push("transition: all 0.3s");
			}

			view.setAttribute('style', styles.join(''));

			if( ui.eventOnClick && !ui.eventOnClickSet) {
				// ...
				view.addEventListener("click", ()=>{

					var ctx = ui.findContext();
					if(ctx) {
						ctx[ui.eventOnClick] = {
							hadEvent : true
						}
					}

				}, false);

				ui.eventOnClickSet = true;
			}

			// FIX: add event handlers
			if(ui.eventHandlers["click"] && !this.clickListener) {

				this.clickListener = function(){
					// ui.sendEvent("click", this)
					ui.eventHandlers["click"].call(ui,ui);
				}.bind(this);
				
				view.addEventListener("click", this.clickListener , false);

			}
		}
	}


}

var UILabelRenderEngine = function( initWithUI ) {
	this.ui = initWithUI;

	var colorSlide;
	var usedFont;
	var last_x  = 0;
	var last_y  = 0;
	var last_width   = 0;
	var last_height  = 0;
	var last_radius  = 0;
	var last_color;
	// var last_render = new UIStructure();

	this.initEngine = function(){

		if(this.b_init_done) { return; }

		var view = document.createElement('DIV');
		view.style.position='absolute';
		this.view = view;
		if( this.ui.parentView ) {
			this.ui.parentView.renderer.view.appendChild( view );

		}
		this.b_init_done = true;

	}

	// fix: remove child function
	this.remove = function() {
		if(this.view && this.view.parentNode) {
			this.view.parentNode.removeChild( this.view );
			this.ui = null;
		}
	}	

	this.render = function() {
		var plainView = this.view;
		if (plainView) {
			var view = plainView;
			var ui = this.ui;
			var c = ui.calculated;
			var animating_opacity = false;
			if(ui.isHidden && !view.hidden) {
			}
			var styles = []
			styles.push("position:absolute;");
			styles.push("left:"+c.x+"px;");
			styles.push("top:"+c.y+"px;");
			styles.push("width:"+c.render_width+"px;");
			styles.push("height:"+c.render_height+"px;");
			if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
				styles.push("overflow:hidden;");
			}
			if(ui.color.is_set) {
				styles.push("color:"+ui.color.s_value+";");
			}
			if(ui.backgroundColor.is_set) {
				styles.push("background-color:"+ui.backgroundColor.s_value+";");
			}
			if(ui.opacity.is_set) {
				styles.push("opacity:"+ui.opacity.f_value+";");
			}
			if(ui.borderRadius.is_set) {
				styles.push("border-radius:"+ui.borderRadius.pixels+"px;");
			}

			// FIX: font family
			if(ui.fontFamily.is_set) {
				styles.push("font-family:"+ui.fontFamily.s_value+";");
			} else {
				styles.push("font-family:Arial;");
			}

			if(ui.fontSize.is_set) {
				styles.push("font-size:"+ui.fontSize.pixels+"px;");
			} else {
				// fix: set default font size
				styles.push("font-size:14px;");
			}
			if(ui.shadowRadius.is_set) {
				var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
				styles.push("box-shadow: 0px 0px "+ui.shadowRadius.pixels+"px "+parseInt(ui.shadowRadius.pixels/2)+"px "+shadowColor+";");
			}
			if(ui.text.is_set) {
				styles.push("white-space: pre-line;");
				view.textContent = ui.text.s_value;
			}
			if(ui.align.is_set) {
				styles.push("text-align: "+ui.align.s_value+";");
			}
			view.setAttribute('style', styles.join(''));

		}
	}

	this.customSize = function( usingWidth ) {

		if(!this.ui.text.is_set) {
			return false;
		}
		var ui = this.ui;
		var view;
		return MeasureTextCanvas(ui.fontFamily.s_value || "Arial", ui.fontSize.pixels || 14, usingWidth, ui.text.s_value);

		// debugger;
		if(!this.view) {

			return MeasureTextCached(ui.fontFamily.s_value || "Arial", ui.fontSize.pixels || 14, usingWidth, ui.text.s_value);

			// debugger;
			var testView = document.createElement('DIV');
			testView.style.position='absolute';
		    //testView.style.left = -1000+"px";
		    //testView.style.top = 11000+"px";	


		    testView.style.left = 100+"px";
		    testView.style.top = 100+"px";	

		    testView.style.width = usingWidth+"px";		
		    // fix: default font size
		    testView.style.fontSize =  (ui.fontSize.pixels || 14)+"px";
		    testView.style.fontFamily = ui.fontFamily.is_set ? ui.fontFamily.s_value : "Arial";

		    // fix
		    testView.style.whiteSpace = "pre-line";

		    testView.textContent = ui.text.s_value;
			document.body.appendChild(testView);

			var res = {
				width  : testView.clientWidth,
				height : testView.clientHeight
			};
			if(res.height < ( ui.fontSize.pixels *2) ) {
				testView.style.width = "auto";	
				res.width = testView.clientWidth+2;
			}
			document.body.removeChild(testView);
			testView  = null;
			return res;

		} else {

			view = this.view;
			view.style.width = usingWidth;
			view.textContent = ui.text.s_value;

			return {
				width  : view.clientWidth,
				height : view.clientHeight
			}
		}

	}


}

var UISvgPathRenderEngine = function( initWithUI ) {
	this.ui = initWithUI;

	var colorSlide;
	var usedFont;
	var last_x  = 0;
	var last_y  = 0;
	var last_width   = 0;
	var last_height  = 0;
	var last_radius  = 0;
	var last_color;
	/// var last_render = new UIStructure();

	this.initEngine = function(){

		if(this.b_init_done) { return; }

		var view = document.createElementNS("http://www.w3.org/2000/svg", "svg");
		// var view  = document.createElement('SVG');

	    var svg   = document.documentElement;
    	var svgNS = svg.namespaceURI;	

		var g     = document.createElementNS("http://www.w3.org/2000/svg", "g");
		var path  = document.createElementNS("http://www.w3.org/2000/svg", "path");

		this.g = g;
		this.path = path;

		view.appendChild( g );
		g. appendChild( path );		

		// g.setAttributeNS(null, "transform", 'translate(-2, -2)')

		var ui = this.ui;
			if(ui && ui.viewBox.is_set) {
				view.setAttribute("viewBox", ui.viewBox.s_value);
				// styles.push("background-color:"+ui.backgroundColor.s_value+";");
				view.setAttribute("preserveAspectRatio", "xMinYMin meet");
			}

		view.style.position='absolute';
		this.view = view;
		if( this.ui.parentView ) {
			this.ui.parentView.renderer.view.appendChild( view );


		}
		this.b_init_done = true;

	}

	// fix: remove child function
	this.remove = function() {
	
		if(this.view && this.view.parentNode) {
			if(this.clickListener) this.view.removeEventListener("click", this.clickListener);
			this.view.parentNode.removeChild( this.view );
			this.ui = null;
			if(this.clickListener) {
				this.view.removeEventListener("click", this.clickListener);
			}
			this.clickListener = null;			
		}
	}

	this.render = function() {
		var plainView = this.view;
		if (plainView) {
			var view = plainView;
			var ui = this.ui;
			var c = ui.calculated;
			var animating_opacity = false;
			if(ui.isHidden && !view.hidden) {

			}
			var styles = []
			styles.push("position:absolute;");
			styles.push("left:"+c.x+"px;");
			styles.push("top:"+c.y+"px;");


			//styles.push("width:"+c.render_width+"px;");
			//styles.push("height:"+c.render_height+"px;");

			view.setAttributeNS(null, 'width', c.render_width+"px");
			view.setAttributeNS(null, 'height', c.render_height+"px");

			// view.setAttribute('style', styles.join(''));

			// problem: the viewBox should be defined perhaps???

			if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
				styles.push("overflow:hidden;");
			}
			if(ui.borderColor.is_set) {
				// styles.push("color:"+ui.color.s_value+";");
				this.path.setAttributeNS(null, 'stroke',ui.borderColor.s_value);
			}
			if(ui.backgroundColor.is_set) {
				this.path.setAttributeNS(null, 'fill',ui.backgroundColor.s_value);
				// styles.push("background-color:"+ui.backgroundColor.s_value+";");
			}
			if(ui.opacity.is_set) {
				// styles.push("opacity:"+ui.opacity.f_value+";");
				this.path.setAttributeNS(null, 'fill-opacity',ui.opacity.f_value+"");
				this.path.setAttributeNS(null, 'stroke-opacity',ui.opacity.f_value+"");
			}
			if(ui.svgPath.is_set) {
				// styles.push("opacity:"+ui.opacity.f_value+";");
				this.path.setAttributeNS(null, 'd',ui.svgPath.s_value);
			}			


			if(ui.shadowRadius.is_set) {
				var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
				styles.push("-webkit-filter: drop-shadow(0px 0px "+ui.shadowRadius.pixels+"px "+shadowColor+");");
				styles.push("filter: drop-shadow(0px 0px "+ui.shadowRadius.pixels+"px "+shadowColor+");");
			}

			// FIX: add event handlers
			if(ui.eventHandlers["click"] && !this.clickListener) {
				this.clickListener = function(){
					// ui.sendEvent("click", this)
					ui.eventHandlers["click"].call(ui,ui);
				}.bind(this);
				
				view.addEventListener("click", this.clickListener , false);
			}			

			// FIX: SVG PATH element...
			view.setAttribute('style', styles.join(''));

		}
	}


}

var UIImageRenderEngine = function( initWithUI ) {
	this.ui = initWithUI;

	var colorSlide;
	var usedFont;
	var last_x  = 0;
	var last_y  = 0;
	var last_width   = 0;
	var last_height  = 0;
	var last_radius  = 0;
	var last_color;
	// var last_render = new UIStructure();

	this.initEngine = function(){

		if(this.b_init_done) { return; }

		var view = document.createElement('img');
		view.style.position='absolute';
		this.view = view;
		if( this.ui.parentView ) {
			this.ui.parentView.renderer.view.appendChild( view );

		}
		this.b_init_done = true;

	}

	// fix: remove child function
	this.remove = function() {
		if(this.view && this.view.parentNode) {
			this.view.parentNode.removeChild( this.view );
			this.ui = null;
		}
	}

	this.dom = function() {
		return this.renderer.view;
	}

	this.render = function() {
		var plainView = this.view;
		if (plainView) {
			var view = plainView;
			var ui = this.ui;
			var c = ui.calculated;
			var animating_opacity = false;
			if(ui.isHidden && !view.hidden) {
			}
			var styles = []
			styles.push("position:absolute;");
			styles.push("left:"+c.x+"px;");
			styles.push("top:"+c.y+"px;");
			styles.push("width:"+c.render_width+"px;");
			styles.push("height:"+c.render_height+"px;");
			if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
				styles.push("overflow:hidden;");
			}
			if(ui.color.is_set) {
				styles.push("color:"+ui.color.s_value+";");
			}
			if(ui.backgroundColor.is_set) {
				styles.push("background-color:"+ui.backgroundColor.s_value+";");
			}
			if(ui.opacity.is_set) {
				styles.push("opacity:"+ui.opacity.f_value+";");
			}
			if(ui.borderRadius.is_set) {
				styles.push("border-radius:"+ui.borderRadius.pixels+"px;");
			}
			if(ui.fontSize.is_set) {
				styles.push("font-size:"+ui.fontSize.pixels+"px;");
			}
			if(ui.shadowRadius.is_set) {
				var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
				styles.push("box-shadow: 0px 0px "+ui.shadowRadius.pixels+"px "+parseInt(ui.shadowRadius.pixels/2)+"px "+shadowColor+";");
			}
			if(ui.imageUrl.is_set) {
				view.src = ui.imageUrl.s_value;
			}
			view.setAttribute('style', styles.join(''));

		}
	}


}

var UITextFieldRenderEngine = function( initWithUI ) {
	this.ui = initWithUI;

	var colorSlide;
	var usedFont;
	var last_x  = 0;
	var last_y  = 0;
	var last_width   = 0;
	var last_height  = 0;
	var last_radius  = 0;
	var last_color;
	// var last_render = new UIStructure();

	this.initEngine = function(){

		if(this.b_init_done) { return; }

		var view = document.createElement('textarea');
		view.style.position='absolute';
		this.view = view;
		if( this.ui.parentView ) {
			this.ui.parentView.renderer.view.appendChild( view );

		}
		this.b_init_done = true;

	}

	// fix: remove child function
	this.remove = function() {
		if(this.view && this.view.parentNode) {
			this.view.parentNode.removeChild( this.view );
			this.ui = null;

			if(this.valueListener) {
				this.view.removeEventListener("keyup", this.valueListener);
			}
			this.valueListener = null;			
		}
	}

	this.createCSS = function(ui) {

		var styles = {}
		if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
			styles["overflow"] = "hidden";
		}
		if(ui.color.is_set) {
			styles["color"] = ui.color.s_value;
		}
		if(ui.backgroundColor.is_set) {
			styles["background-color"] = ui.backgroundColor.s_value;
		}
		if(ui.opacity.is_set) {
			styles["opacity"] = ui.opacity.f_value;
		}
		if(ui.borderRadius.is_set) {
			styles["border-radius"] = ui.borderRadius.pixels;
		}
		if(ui.fontSize.is_set) {
			styles["font-size"] = ui.fontSize.pixels;
		}

		if(ui.linearGradient.is_set) {
			styles["background"] = "linear-gradient("+ui.linearGradient.s_value+")";
		}

		if(ui.shadowRadius.is_set) {
			var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
			styles["box-shadow"]  = " 0px 0px "+ui.shadowRadius.pixels+"px "+parseInt(ui.shadowRadius.pixels/2)+"px "+shadowColor+"";
		}
		var transformStr = "";
		if(ui.scale.is_set) {
			transformStr += "scale("+ui.scale.f_value+") ";
		}
		if(ui.rotate.is_set) {
			transformStr += "rotate("+ui.rotate.f_value+"deg) ";
		}		

		if(transformStr) {
			styles["transform"] = transformStr;
		}

		styles["transition"] = "all 0.5s";

		return styles;	
	}	


	this.render = function() {
		var plainView = this.view;
		if (plainView) {
			var view = plainView;
			var ui = this.ui;
			var c = ui.calculated;
			var animating_opacity = false;
			if(ui.isHidden && !view.hidden) {
			}
			var styles = []

			styles.push("position:absolute;");
			styles.push("left:"+c.x+"px;");
			styles.push("top:"+c.y+"px;");
			styles.push("width:"+c.render_width+"px;");
			styles.push("height:"+c.render_height+"px;");
			if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
				styles.push("overflow:hidden;");
			}
			if(ui.color.is_set) {
				styles.push("color:"+ui.color.s_value+";");
			}
			if(ui.backgroundColor.is_set) {
				styles.push("background-color:"+ui.backgroundColor.s_value+";");
			}
			if(ui.opacity.is_set) {
				styles.push("opacity:"+ui.opacity.f_value+";");
			}
			if(ui.borderRadius.is_set) {
				styles.push("border-radius:"+ui.borderRadius.pixels+"px;");
			}
			// fix: border width
			if(ui.borderWidth.is_set) {
				styles.push("border-width:"+ui.borderWidth.pixels+"px;");
			} else {
				styles.push("border-width:0px;");
			}			

			if(ui.fontSize.is_set) {
				styles.push("font-size:"+ui.fontSize.pixels+"px;");
			}
			if(ui.shadowRadius.is_set) {
				var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
				styles.push("box-shadow: 0px 0px "+ui.shadowRadius.pixels+"px "+parseInt(ui.shadowRadius.pixels/2)+"px "+shadowColor+";");
			}

			if(ui.text.is_set && (!view.value)) {
				view.value = ui.text.s_value; // .push("opacity:"+ui.opacity.f_value+";");
			}			

			if(ui.metaTags["Hover"]) {
				var hover = ui.metaTags["Hover"];
				var styleObj = this.createCSS(hover);
				if(!ui.guid) ui.guid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
				view.className= "view"+ui.guid;
				css().bind(".view"+ui.guid+":hover", styleObj);
				styles.push("transition: all 0.3s");
			}			

			// FIX: add event handlers
			if(ui.eventHandlers["value"] && !this.valueListener) {

				this.valueListener = function(){
					// ui.sendEvent("click", this)
					ui.text.s_value = view.value;
					ui.eventHandlers["value"].call(ui,ui, view.value);
				}.bind(this);
				
				view.addEventListener("keyup", this.valueListener , false);

			}			

			view.setAttribute('style', styles.join(''));



		}
	}


}

var UIInputRenderEngine = function( initWithUI ) {
	this.ui = initWithUI;

	var colorSlide;
	var usedFont;
	var last_x  = 0;
	var last_y  = 0;
	var last_width   = 0;
	var last_height  = 0;
	var last_radius  = 0;
	var last_color;
	// var last_render = new UIStructure();

	this.initEngine = function(){

		if(this.b_init_done) { return; }

		var view = document.createElement('INPUT');
		view.style.position='absolute';
		this.view = view;
		if( this.ui.parentView ) {
			this.ui.parentView.renderer.view.appendChild( view );

		}
		this.b_init_done = true;

	}

	// fix: remove child function
	this.remove = function() {
		if(this.view && this.view.parentNode) {
			this.view.parentNode.removeChild( this.view );
			this.ui = null;

			if(this.valueListener) {
				this.view.removeEventListener("keyup", this.valueListener);
			}
			this.valueListener = null;			
		}
	}

	this.createCSS = function(ui) {

		var styles = {}
		if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
			styles["overflow"] = "hidden";
		}
		if(ui.color.is_set) {
			styles["color"] = ui.color.s_value;
		}
		if(ui.backgroundColor.is_set) {
			styles["background-color"] = ui.backgroundColor.s_value;
		}
		if(ui.opacity.is_set) {
			styles["opacity"] = ui.opacity.f_value;
		}
		if(ui.borderRadius.is_set) {
			styles["border-radius"] = ui.borderRadius.pixels;
		}
		if(ui.fontSize.is_set) {
			styles["font-size"] = ui.fontSize.pixels;
		}

		if(ui.linearGradient.is_set) {
			styles["background"] = "linear-gradient("+ui.linearGradient.s_value+")";
		}

		if(ui.shadowRadius.is_set) {
			var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
			styles["box-shadow"]  = " 0px 0px "+ui.shadowRadius.pixels+"px "+parseInt(ui.shadowRadius.pixels/2)+"px "+shadowColor+"";
		}
		var transformStr = "";
		if(ui.scale.is_set) {
			transformStr += "scale("+ui.scale.f_value+") ";
		}
		if(ui.rotate.is_set) {
			transformStr += "rotate("+ui.rotate.f_value+"deg) ";
		}		

		if(transformStr) {
			styles["transform"] = transformStr;
		}

		styles["transition"] = "all 0.5s";

		return styles;	
	}	


	this.render = function() {
		var plainView = this.view;
		if (plainView) {
			var view = plainView;
			var ui = this.ui;
			var c = ui.calculated;
			var animating_opacity = false;
			if(ui.isHidden && !view.hidden) {
			}
			var styles = []

			styles.push("position:absolute;");
			styles.push("left:"+c.x+"px;");
			styles.push("top:"+c.y+"px;");
			styles.push("width:"+c.render_width+"px;");
			styles.push("height:"+c.render_height+"px;");
			if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
				styles.push("overflow:hidden;");
			}
			if(ui.color.is_set) {
				styles.push("color:"+ui.color.s_value+";");
			}
			if(ui.backgroundColor.is_set) {
				styles.push("background-color:"+ui.backgroundColor.s_value+";");
			}
			if(ui.opacity.is_set) {
				styles.push("opacity:"+ui.opacity.f_value+";");
			}
			if(ui.borderRadius.is_set) {
				styles.push("border-radius:"+ui.borderRadius.pixels+"px;");
			}
			// fix: border width
			if(ui.borderWidth.is_set) {
				styles.push("border-width:"+ui.borderWidth.pixels+"px;");
			} else {
				styles.push("border-width:0px;");
			}			

			if(ui.fontSize.is_set) {
				styles.push("font-size:"+ui.fontSize.pixels+"px;");
			}
			if(ui.shadowRadius.is_set) {
				var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
				styles.push("box-shadow: 0px 0px "+ui.shadowRadius.pixels+"px "+parseInt(ui.shadowRadius.pixels/2)+"px "+shadowColor+";");
			}

			if(ui.text.is_set && (!view.value)) {
				view.value = ui.text.s_value; // .push("opacity:"+ui.opacity.f_value+";");
			}			

			if(ui.metaTags["Hover"]) {
				var hover = ui.metaTags["Hover"];
				var styleObj = this.createCSS(hover);
				if(!ui.guid) ui.guid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
				view.className= "view"+ui.guid;
				css().bind(".view"+ui.guid+":hover", styleObj);
				styles.push("transition: all 0.3s");
			}			

			// FIX: add event handlers
			if(ui.eventHandlers["value"] && !this.valueListener) {

				this.valueListener = function(){
					// ui.sendEvent("click", this)
					ui.text.s_value = view.value;
					ui.eventHandlers["value"].call(ui,ui, view.value);
				}.bind(this);
				
				view.addEventListener("keyup", this.valueListener , false);

			}			

			view.setAttribute('style', styles.join(''));



		}
	}


}

var UISwitchRenderEngine = function( initWithUI ) {
	this.ui = initWithUI;

	var colorSlide;
	var usedFont;
	var last_x  = 0;
	var last_y  = 0;
	var last_width   = 0;
	var last_height  = 0;
	var last_radius  = 0;
	var last_color;
	// var last_render = new UIStructure();

	this.initEngine = function(){

		if(this.b_init_done) { return; }

		var view = document.createElement('INPUT');
		view.style.position='absolute';
		this.view = view;
		if( this.ui.parentView ) {
			this.ui.parentView.renderer.view.appendChild( view );

		}
		this.b_init_done = true;

	}

	// fix: remove child function
	this.remove = function() {
		if(this.view && this.view.parentNode) {
			this.view.parentNode.removeChild( this.view );
		}
	}	

	this.render = function(elem) {



		var plainView = this.view;
		if (plainView) {
			var view = plainView;
			var ui = this.ui;
			var c = ui.calculated;
			var animating_opacity = false;
			if(ui.isHidden && !view.hidden) {
			}
			var styles = []
			styles.push("position:absolute;");
			styles.push("left:"+c.x+"px;");
			styles.push("top:"+c.y+"px;");
			styles.push("width:"+c.render_width+"px;");
			styles.push("height:"+c.render_height+"px;");
			if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
				styles.push("overflow:hidden;");
			}
			if(ui.color.is_set) {
				styles.push("color:"+ui.color.s_value+";");
			}
			if(ui.backgroundColor.is_set) {
				styles.push("background-color:"+ui.backgroundColor.s_value+";");
			}
			if(ui.opacity.is_set) {
				styles.push("opacity:"+ui.opacity.f_value+";");
			}
			if(ui.borderRadius.is_set) {
				styles.push("border-radius:"+ui.borderRadius.pixels+"px;");
			}
			if(ui.fontSize.is_set) {
				styles.push("font-size:"+ui.fontSize.pixels+"px;");
			}
			if(ui.shadowRadius.is_set) {
				var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
				styles.push("box-shadow: 0px 0px "+ui.shadowRadius.pixels+"px "+parseInt(ui.shadowRadius.pixels/2)+"px "+shadowColor+";");
			}
			view.setAttribute('style', styles.join(''));

		}
	}


}

var UISliderRenderEngine = function( initWithUI ) {
	this.ui = initWithUI;

	var colorSlide;
	var usedFont;
	var last_x  = 0;
	var last_y  = 0;
	var last_width   = 0;
	var last_height  = 0;
	var last_radius  = 0;
	var last_color;
	// var last_render = new UIStructure();

	this.initEngine = function(){

		if(this.b_init_done) { return; }

		var view = document.createElement('INPUT');
		view.style.position='absolute';
		this.view = view;
		if( this.ui.parentView ) {
			this.ui.parentView.renderer.view.appendChild( view );

		}
		this.b_init_done = true;

	}

	this.render = function() {
		var plainView = this.view;
		if (plainView) {
			var view = plainView;
			var ui = this.ui;
			var c = ui.calculated;
			var animating_opacity = false;
			if(ui.isHidden && !view.hidden) {
			}
			var styles = []
			styles.push("position:absolute;");
			styles.push("left:"+c.x+"px;");
			styles.push("top:"+c.y+"px;");
			styles.push("width:"+c.render_width+"px;");
			styles.push("height:"+c.render_height+"px;");
			if(ui.overflow.is_set && ui.overflow.s_value=="hidden") {
				styles.push("overflow:hidden;");
			}
			if(ui.color.is_set) {
				styles.push("color:"+ui.color.s_value+";");
			}
			if(ui.backgroundColor.is_set) {
				styles.push("background-color:"+ui.backgroundColor.s_value+";");
			}
			if(ui.opacity.is_set) {
				styles.push("opacity:"+ui.opacity.f_value+";");
			}
			if(ui.borderRadius.is_set) {
				styles.push("border-radius:"+ui.borderRadius.pixels+"px;");
			}
			if(ui.fontSize.is_set) {
				styles.push("font-size:"+ui.fontSize.pixels+"px;");
			}
			if(ui.shadowRadius.is_set) {
				var shadowColor = ui.shadowColor.s_value || "rgba(0,0,0,0.75)"  
				styles.push("box-shadow: 0px 0px "+ui.shadowRadius.pixels+"px "+parseInt(ui.shadowRadius.pixels/2)+"px "+shadowColor+";");
			}
			view.setAttribute('style', styles.join(''));

		}
	}


}
function UIRenderPosition(x,y) {
	this.x = x
	this.y = y
}

if (typeof String.prototype.endsWith !== 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
};
function UICalculated() {
	this.x = 0
	this.y = 0
	this.render_width = 0
	this.render_height = 0
	this.width  = 0
	this.height = 0
	this.lineBreak = false
	this.absolute = false
}

// fix custom tag handlers...
var UITagHandlers = {};
var UIAttributeHandlers = {};

var UICompRegistry = {};

// static variables placed inside the prototype...
var UIStructure_prototype = new (function() {

    // fix: list of objects
	var objectList = [{}];

	// fix: component definitions
	var components = {};


	this.registerComponent = function(name, xml) {
		UICompRegistry[name] = xml;
	}

	this.findComponent = function(name) {
		return UICompRegistry[name] 
	}

	this.findContent = function(list) {
		var list = list || [];
		if(this.id.is_set && this.id.s_value == "content") {
			list.push(this);
			return;
		}
		if(this.tagName == "content") {
			list.push(this);
			return;
		}
		for(var i=0; i<this.items.length; i++) {
			var item = this.items[i];
			item.findContent(list)
			if(list.length) return list[0];
		}
		return list[0]
	}

	this.findContext = function() {
		if(this._ctx) return this._ctx;
		if(this.parentView) return this.parentView.findContext();
	}

	this.add = function( childView  )  {
		if(!childView) return;
		if(childView.forEach) { childView.forEach((item)=>{ this.add(item) }); return; }
		childView.parentView = this;
		this.items.push( childView );
		return this;
	}

	// fix: find object by instance id
	this.getInstance = function(id) {
		return objectList[id]; 
	}

	this.toString = function() {
		if(!this._instanceId) {
			this._instanceId = objectList.length;
			objectList.push(this);
		}
		return "<o i=\""+this._instanceId+"\"/>";
	}

	this.render = function(elem) {
		
		if(elem) {
			return this.replace(elem);
		}

		if( this.renderer ) {
			this.renderer.initEngine();
			this.renderer.render();
		}
		this.items.forEach( (ch) => {
			ch.render()
		});
	}

	// free resources
	this.free = function() {
		if(this._instanceId) {
			objectList[this._instanceId] = null;
		}
		if(this.renderer) {
			this.renderer.remove();
			this.renderer = null;
		}
		for(var i=0;i<this.items.length; i++) {
			this.items[i].free();
		}
		this.items.length = 0;
	}

	// fix: replace element with other element...

	this.replace = function(newElem) {

		if(this.parentView) {
			var parent = this.parentView;
			var idx = parent.items.indexOf(this);
			if(idx >= 0 ) {
				parent.items.splice(idx,1,newElem);
			}
		}

		// fix: renderer must be able to remove
		if(this.renderer) {
			 newElem.renderer.initEngine();
			 if(this.renderer.view && this.renderer.view.parentNode) this.renderer.view.parentNode.replaceChild(newElem.renderer.view, this.renderer.view);
			 // this.renderer.view.parentNode
			 this.renderer.remove();
		}

		newElem.parentView = this.parentView;

		this.free();

		var top = this.parentView || newElem;
		this.parentView = null;
		while(top.parentView) top = top.parentView;

		var container = new UIStructure({innerWidth:window.innerWidth+"px",                                   
		  							       innerHeight:window.innerHeight+"px"});
		top.calculateLayout(container, new UIRenderPosition({x:0, y:0}));
		top.render();

		return newElem;

	}

	this.remove = function() {

		if(!this.parentView) return;


		var parent = this.parentView;
		var idx = parent.items.indexOf(this);
		if(idx >= 0 ) {
			parent.items.splice(idx,1,newElem);
		}

		var top = this.parentView;

		if(this.renderer) {
			 this.renderer.remove();
		}
		this.free();

		this.parentView = null;
		while(top.parentView) top = top.parentView;

		var container = new UIStructure({innerWidth:window.innerWidth+"px",                                   
		  							       innerHeight:window.innerHeight+"px"});

		top.calculateLayout(container, new UIRenderPosition({x:0, y:0}));
		top.render();

	}


	// fix: add mounting
	this.mount = function(dom) {

		if(typeof(dom)=="string") dom=document.getElementById(dom);

		  var width = dom.innerWidth || dom.clientWidth;
		  var height = dom.innerHeight || dom.clientHeight;

		  var container = new UIStructure({innerWidth:width+"px",                                   
		  							       innerHeight:height+"px"});

		  this._container = container;

		  this.calculateLayout(container, new UIRenderPosition({x:0, y:0}));

		  this.render();  
		  if(this.renderer) {
		  	dom.appendChild( this.renderer.view );
		  } else {
		  	debugger;
		  }
		  
		  return this;
	}

	this.refreshView = function() {
		  
		if(this._container) {
		  this.calculateLayout(this._container, new UIRenderPosition({x:0, y:0}));
		  this.render();  		
		}
	}

	// fix: event handler
	this.on = function(eventName, fn) {
		this.eventHandlers[eventName] = fn;
		return this;
	}	

	this.trigger = function(eventName, data) {
		if(this.eventHandlers[eventName]) {
			this.eventHandlers[eventName](this, data);
		}
	}

	// fix: event handler logic
	// 	ui.sendEvent("click", this)
	// ui.eventHandlers["click"](this);				

	// FIX: add tags for elements...
	this.findById = function(id,list) {
		var list = list || [];
		if(this.id.is_set && this.id.s_value == id) list.push(this);
		for(var i=0; i<this.items.length; i++) {
			var item = this.items[i];
			item.findById(id,list)
		}
		return list;
	}

	// FIX: getById
	this.getById = function(id) {
		return this.findById(id).pop();
	}

	// FIX: add tags for elements...
	this.findTags = function(n,list) {
		var list = list || [];
		if(this.tagName == n) list.push(this);
		for(var i=0; i<this.items.length; i++) {
			var item = this.items[i];
			item.findTags(n,list)
		}
		return list;
	}


	this.convertStrToValue = function( str ) {
		var b_had = false;
		var type  = 0;
		var value = 0.0;

		if(str.endsWith("%")) {
			let fs = str.substr(0, str.length-1) 
			value = parseFloat(fs)
			type = 1;
			b_had = true;
		}

		if(str.endsWith("em")) {
			let fs = str.substr(0, str.length-2) 
			value = parseFloat(fs)
			type = 2;
			b_had = true;
		}

		if(str.endsWith("px")) {
			let fs = str.substr(0, str.length-2) 
			value = parseFloat(fs)
			type = 3;
			b_had = true;
		}

		if(str.endsWith("hp")) {
			let fs = str.substr(0, str.length-2) 
			value = parseFloat(fs)
			type = 4;
			b_had = true;
		}

		// FIX: fill attribute
		if(str == "fill") {
			//let fs = str.substr(0, str.length-2) 
			value = 100
			type = 5;
			b_had = true;
		}		

		if(!b_had) {

			value = parseFloat(str)
			type = 3
			b_had = true;
		}
		return {value : value, type : type};
	}




	this.readParams = function( jsonDict ) {

		try {

			// fix: add Event handlers

			if(jsonDict["onClick"]) {
				console.log("hasClickHandler...", jsonDict["onClick"]);
				this.eventOnClick = jsonDict["onClick"]
				// How to add into the renderer???
			}				

			if(jsonDict["x"]) {
				var value_x =  jsonDict["x"];
				var x = this.convertStrToValue( value_x );
				this.x.f_value = x.value;
				this.x.unit    = x.type;
				if( this.x.unit == 3 ) { this.x.pixels = x.value }
				this.x.is_set = true;
			}
			if(jsonDict["y"]) {
				var value_y =  jsonDict["y"];
				var y = this.convertStrToValue( value_y );
				this.y.f_value = y.value;
				this.y.unit    = y.type;
				if( this.y.unit == 3 ) { this.y.pixels = y.value }
				this.y.is_set = true;
			}
			if(jsonDict["left"]) {
				var value_left =  jsonDict["left"];
				var left = this.convertStrToValue( value_left );
				this.left.f_value = left.value;
				this.left.unit    = left.type;
				if( this.left.unit == 3 ) { this.left.pixels = left.value }
				this.left.is_set = true;
			}
			if(jsonDict["top"]) {
				var value_top =  jsonDict["top"];
				var top = this.convertStrToValue( value_top );
				this.top.f_value = top.value;
				this.top.unit    = top.type;
				if( this.top.unit == 3 ) { this.top.pixels = top.value }
				this.top.is_set = true;
			}
			// fix: bottom
			if(jsonDict["bottom"]) {
				var value_bottom =  jsonDict["bottom"];
				var bottom = this.convertStrToValue( value_bottom );
				this.bottom.f_value = bottom.value;
				this.bottom.unit    = bottom.type;
				if( this.top.unit == 3 ) { this.bottom.pixels = bottom.value }
				this.bottom.is_set = true;
			}	
			// fix: right
			if(jsonDict["right"]) {
				var value_right=  jsonDict["right"];
				var right = this.convertStrToValue( value_right );
				this.right.f_value = right.value;
				this.right.unit    = right.type;
				if( this.top.unit == 3 ) { this.right.pixels = right.value }
				this.right.is_set = true;
			}						
			if(jsonDict["id"]) {
				var value_id =  jsonDict["id"];
				this.id.s_value = value_id
				this.id.is_set = true;
			}

			// component name...
			if(jsonDict["cname"]) {
				var value_id =  jsonDict["cname"];
				this.cname.s_value = value_id;
				this.cname.is_set = true;
				
			}

			if(jsonDict["width"]) {
				var value_width =  jsonDict["width"];
				var width = this.convertStrToValue( value_width );
				this.width.f_value = width.value;
				this.width.unit    = width.type;
				if( this.width.unit == 3 ) { this.width.pixels = width.value }
				this.width.is_set = true;
			}
			if(jsonDict["height"]) {
				var value_height =  jsonDict["height"];
				var height = this.convertStrToValue( value_height );
				this.height.f_value = height.value;
				this.height.unit    = height.type;
				if( this.height.unit == 3 ) { this.height.pixels = height.value }
				this.height.is_set = true;
			}
			if(jsonDict["inline"]) {
				var value_inline=  jsonDict["inline"];
				var lineBreak = value_inline;
				if( lineBreak == "true" || lineBreak == "1" ) {
					this.inline.b_value = true;
				} else {
					this.inline.b_value = false;
				}
				this.inline.is_set = true;
			}			
			if(jsonDict["direction"]) {
				var value_direction =  jsonDict["direction"];
				this.direction.s_value = value_direction
				this.direction.is_set = true;
			}
			if(jsonDict["align"]) {
				var value_align =  jsonDict["align"];
				this.align.s_value = value_align
				this.align.is_set = true;
			}
			if(jsonDict["verticalAlign"] || jsonDict["vertical-align"]) {
				var value_verticalAlign =  jsonDict["verticalAlign"] || jsonDict["vertical-align"];
				this.verticalAlign.s_value = value_verticalAlign
				this.verticalAlign.is_set = true;
			}
			if(jsonDict["innerWidth"]) {
				var value_innerWidth =  jsonDict["innerWidth"];
				var innerWidth = this.convertStrToValue( value_innerWidth );
				this.innerWidth.f_value = innerWidth.value;
				this.innerWidth.unit    = innerWidth.type;
				if( this.innerWidth.unit == 3 ) { this.innerWidth.pixels = innerWidth.value }
				this.innerWidth.is_set = true;
			}
			if(jsonDict["innerHeight"]) {
				var value_innerHeight =  jsonDict["innerHeight"];
				var innerHeight = this.convertStrToValue( value_innerHeight );
				this.innerHeight.f_value = innerHeight.value;
				this.innerHeight.unit    = innerHeight.type;
				if( this.innerHeight.unit == 3 ) { this.innerHeight.pixels = innerHeight.value }
				this.innerHeight.is_set = true;
			}
			if(jsonDict["lineBreak"] || jsonDict["line-break"]) {
				var value_lineBreak =  jsonDict["lineBreak"] || jsonDict["line-break"];
				var lineBreak = value_lineBreak;
				if( lineBreak == "true" || lineBreak == "1" ) {
					this.lineBreak.b_value = true;
				} else {
					this.lineBreak.b_value = false;
				}
				this.lineBreak.is_set = true;
			}
			if(jsonDict["overflow"]) {
				var value_overflow =  jsonDict["overflow"];
				this.overflow.s_value = value_overflow
				this.overflow.is_set = true;
			}
			if(jsonDict["fontSize"] || jsonDict["font-size"]) {
				var value_fontSize =  jsonDict["fontSize"] || jsonDict["font-size"];
				var fontSize = this.convertStrToValue( value_fontSize );
				this.fontSize.f_value = fontSize.value;
				this.fontSize.unit    = fontSize.type;
				if( this.fontSize.unit == 3 ) { this.fontSize.pixels = fontSize.value }
				this.fontSize.is_set = true;
			}
			if(jsonDict["fontFamily"] || jsonDict["font-family"]) {
				var value_fontFamily =  jsonDict["fontFamily"] || jsonDict["font-family"];
				this.fontFamily.s_value = value_fontFamily
				this.fontFamily.is_set = true;
			}
			if(jsonDict["color"]) {
				var value_color =  jsonDict["color"];
				this.color.s_value = value_color;
				this.color.is_set = true;
			}
			if(jsonDict["backgroundColor"] || jsonDict["background-color"]) {
				var value_backgroundColor =  jsonDict["backgroundColor"] || jsonDict["background-color"];
				this.backgroundColor.s_value = value_backgroundColor;
				this.backgroundColor.is_set = true;
			}

			// fix: parse linear-gradient values
			if(jsonDict["linear-gradient"] || jsonDict["linearGradient"]) {
				var value_linearGradient =  jsonDict["linearGradient"] || jsonDict["linear-gradient"];
				this.linearGradient.s_value = value_linearGradient;
				this.linearGradient.is_set = true;
			}			
			if(jsonDict["opacity"]) {
				var value_opacity =  jsonDict["opacity"];
				var opacity = this.convertStrToValue( value_opacity );
				this.opacity.f_value = opacity.value;
				this.opacity.unit    = opacity.type;
				if( this.opacity.unit == 3 ) { this.opacity.pixels = opacity.value }
				this.opacity.is_set = true;
			}
			if(jsonDict["rotate"]) {
				var value_rotate =  jsonDict["rotate"];
				var rotate = parseInt(value_rotate);
				this.rotate.f_value = rotate;
				this.rotate.is_set = true;
			}

			// fix add scale
			if(jsonDict["scale"]) {
				var value_scale =  parseFloat( jsonDict["scale"] )
				this.scale.f_value = value_scale;
				this.scale.is_set = true;
			}

			if(jsonDict["borderWidth"] || jsonDict["border-width"]) {
				var value_borderWidth =  jsonDict["borderWidth"] || jsonDict["border-width"];
				var borderWidth = this.convertStrToValue( value_borderWidth );
				this.borderWidth.f_value = borderWidth.value;
				this.borderWidth.unit    = borderWidth.type;
				if( this.borderWidth.unit == 3 ) { this.borderWidth.pixels = borderWidth.value }
				this.borderWidth.is_set = true;
			}
			if(jsonDict["borderColor"] || jsonDict["border-color"]) {
				var value_borderColor =  jsonDict["borderColor"] || jsonDict["border-color"];
				this.borderColor.s_value = value_borderColor;
				this.borderColor.is_set = true;
			}
			if(jsonDict["borderRadius"] || jsonDict["border-radius"]) {
				var value_borderRadius =  jsonDict["borderRadius"] || jsonDict["border-radius"];
				var borderRadius = this.convertStrToValue( value_borderRadius );
				this.borderRadius.f_value = borderRadius.value;
				this.borderRadius.unit    = borderRadius.type;
				if( this.borderRadius.unit == 3 ) { this.borderRadius.pixels = borderRadius.value }
				this.borderRadius.is_set = true;
			}

			// fix: add viewBox
			if(jsonDict["viewBox"]) {
				var value_viewBox = jsonDict["viewBox"];
				this.viewBox.s_value = value_viewBox;
				this.viewBox.is_set = true;
			}

			if(jsonDict["svgPath"] || jsonDict["path"]) {
				var value_svgPath =  jsonDict["svgPath"] || jsonDict["path"];
				this.svgPath.s_value = value_svgPath
				this.svgPath.is_set = true;
			}
			if(jsonDict["imageUrl"] || jsonDict["src"]) {
				var value_imageUrl =  jsonDict["imageUrl"] || jsonDict["src"];
				this.imageUrl.s_value = value_imageUrl
				this.imageUrl.is_set = true;
			}
			if(jsonDict["text"]) {
				var value_text =  jsonDict["text"];
				this.text.s_value = value_text
				this.text.is_set = true;
			}
			if(jsonDict["vColorSlide"]) {
				var value_vColorSlide =  jsonDict["vColorSlide"];
				var vColorSlide = value_vColorSlide;
				if( vColorSlide == "true" || vColorSlide == "1" ) {
					this.vColorSlide.b_value = true;
				} else {
					this.vColorSlide.b_value = false;
				}
				this.vColorSlide.is_set = true;
			}
			if(jsonDict["vColorSlideBreak"]) {
				var value_vColorSlideBreak =  jsonDict["vColorSlideBreak"];
				var vColorSlideBreak = this.convertStrToValue( value_vColorSlideBreak );
				this.vColorSlideBreak.f_value = vColorSlideBreak.value;
				this.vColorSlideBreak.unit    = vColorSlideBreak.type;
				if( this.vColorSlideBreak.unit == 3 ) { this.vColorSlideBreak.pixels = vColorSlideBreak.value }
				this.vColorSlideBreak.is_set = true;
			}
			if(jsonDict["vColorSlideTop"]) {
				var value_vColorSlideTop =  jsonDict["vColorSlideTop"];
				this.vColorSlideTop.s_value = value_vColorSlideTop;
				this.vColorSlideTop.is_set = true;
			}
			if(jsonDict["vColorSlideBottom"]) {
				var value_vColorSlideBottom =  jsonDict["vColorSlideBottom"];
				this.vColorSlideBottom.s_value = value_vColorSlideBottom;
				this.vColorSlideBottom.is_set = true;
			}
			if(jsonDict["margin"]) {
				var value_margin =  jsonDict["margin"];
				var margin = this.convertStrToValue( value_margin );
				this.margin.f_value = margin.value;
				this.margin.unit    = margin.type;
				if( this.margin.unit == 3 ) { this.margin.pixels = margin.value }
				this.margin.is_set = true;
			}
			if(jsonDict["marginLeft"] || jsonDict["margin-left"]) {
				var value_marginLeft =  jsonDict["marginLeft"] || jsonDict["margin-left"];
				var marginLeft = this.convertStrToValue( value_marginLeft );
				this.marginLeft.f_value = marginLeft.value;
				this.marginLeft.unit    = marginLeft.type;
				if( this.marginLeft.unit == 3 ) { this.marginLeft.pixels = marginLeft.value }
				this.marginLeft.is_set = true;
			}
			if(jsonDict["marginRight"] || jsonDict["margin-right"]) {
				var value_marginRight =  jsonDict["marginRight"] || jsonDict["margin-right"];
				var marginRight = this.convertStrToValue( value_marginRight );
				this.marginRight.f_value = marginRight.value;
				this.marginRight.unit    = marginRight.type;
				if( this.marginRight.unit == 3 ) { this.marginRight.pixels = marginRight.value }
				this.marginRight.is_set = true;
			}
			if(jsonDict["marginBottom"] || jsonDict["margin-bottom"]) {
				var value_marginBottom =  jsonDict["marginBottom"] || jsonDict["margin-bottom"];
				var marginBottom = this.convertStrToValue( value_marginBottom );
				this.marginBottom.f_value = marginBottom.value;
				this.marginBottom.unit    = marginBottom.type;
				if( this.marginBottom.unit == 3 ) { this.marginBottom.pixels = marginBottom.value }
				this.marginBottom.is_set = true;
			}
			if(jsonDict["marginTop"] || jsonDict["margin-top"]) {
				var value_marginTop =  jsonDict["marginTop"] || jsonDict["margin-top"];
				var marginTop = this.convertStrToValue( value_marginTop );
				this.marginTop.f_value = marginTop.value;
				this.marginTop.unit    = marginTop.type;
				if( this.marginTop.unit == 3 ) { this.marginTop.pixels = marginTop.value }
				this.marginTop.is_set = true;
			}
			if(jsonDict["padding"]) {
				var value_padding =  jsonDict["padding"];
				var padding = this.convertStrToValue( value_padding );
				this.padding.f_value = padding.value;
				this.padding.unit    = padding.type;
				if( this.padding.unit == 3 ) { this.padding.pixels = padding.value }
				this.padding.is_set = true;
			}
			if(jsonDict["paddingLeft"] || jsonDict["padding-left"]) {
				var value_paddingLeft =  jsonDict["paddingLeft"] || jsonDict["padding-left"];
				var paddingLeft = this.convertStrToValue( value_paddingLeft );
				this.paddingLeft.f_value = paddingLeft.value;
				this.paddingLeft.unit    = paddingLeft.type;
				if( this.paddingLeft.unit == 3 ) { this.paddingLeft.pixels = paddingLeft.value }
				this.paddingLeft.is_set = true;
			}
			if(jsonDict["paddingRight"] || jsonDict["padding-right"]) {
				var value_paddingRight =  jsonDict["paddingRight"] || jsonDict["padding-right"];
				var paddingRight = this.convertStrToValue( value_paddingRight );
				this.paddingRight.f_value = paddingRight.value;
				this.paddingRight.unit    = paddingRight.type;
				if( this.paddingRight.unit == 3 ) { this.paddingRight.pixels = paddingRight.value }
				this.paddingRight.is_set = true;
			}
			if(jsonDict["paddingBottom"] || jsonDict["padding-bottom"]) {
				var value_paddingBottom =  jsonDict["paddingBottom"] || jsonDict["padding-bottom"];
				var paddingBottom = this.convertStrToValue( value_paddingBottom );
				this.paddingBottom.f_value = paddingBottom.value;
				this.paddingBottom.unit    = paddingBottom.type;
				if( this.paddingBottom.unit == 3 ) { this.paddingBottom.pixels = paddingBottom.value }
				this.paddingBottom.is_set = true;
			}
			if(jsonDict["paddingTop"] || jsonDict["padding-top"]) {
				var value_paddingTop =  jsonDict["paddingTop"] || jsonDict["padding-top"];
				var paddingTop = this.convertStrToValue( value_paddingTop );
				this.paddingTop.f_value = paddingTop.value;
				this.paddingTop.unit    = paddingTop.type;
				if( this.paddingTop.unit == 3 ) { this.paddingTop.pixels = paddingTop.value }
				this.paddingTop.is_set = true;
			}
			if(jsonDict["shadowColor"] || jsonDict["shadow-color"]) {
				var value_shadowColor =  jsonDict["shadowColor"] || jsonDict["shadow-color"];
				this.shadowColor.s_value = value_shadowColor;
				this.shadowColor.is_set = true;
			}
			if(jsonDict["shadowOffsetX"] || jsonDict["shadow-offset-x"]) {
				var value_shadowOffsetX =  jsonDict["shadowOffsetX"] || jsonDict["shadow-offset-x"];
				var shadowOffsetX = this.convertStrToValue( value_shadowOffsetX );
				this.shadowOffsetX.f_value = shadowOffsetX.value;
				this.shadowOffsetX.unit    = shadowOffsetX.type;
				if( this.shadowOffsetX.unit == 3 ) { this.shadowOffsetX.pixels = shadowOffsetX.value }
				this.shadowOffsetX.is_set = true;
			}
			if(jsonDict["shadowOffsetY"] || jsonDict["shadow-offset-y"]) {
				var value_shadowOffsetY =  jsonDict["shadowOffsetY"] || jsonDict["shadow-offset-y"];
				var shadowOffsetY = this.convertStrToValue( value_shadowOffsetY );
				this.shadowOffsetY.f_value = shadowOffsetY.value;
				this.shadowOffsetY.unit    = shadowOffsetY.type;
				if( this.shadowOffsetY.unit == 3 ) { this.shadowOffsetY.pixels = shadowOffsetY.value }
				this.shadowOffsetY.is_set = true;
			}
			if(jsonDict["shadowOpacity"] || jsonDict["shadow-opacity"]) {
				var value_shadowOpacity =  jsonDict["shadowOpacity"] || jsonDict["shadow-opacity"];
				var shadowOpacity = this.convertStrToValue( value_shadowOpacity );
				this.shadowOpacity.f_value = shadowOpacity.value;
				this.shadowOpacity.unit    = shadowOpacity.type;
				if( this.shadowOpacity.unit == 3 ) { this.shadowOpacity.pixels = shadowOpacity.value }
				this.shadowOpacity.is_set = true;
			}
			if(jsonDict["shadowRadius"] || jsonDict["shadow-radius"]) {
				var value_shadowRadius =  jsonDict["shadowRadius"] || jsonDict["shadow-radius"];
				var shadowRadius = this.convertStrToValue( value_shadowRadius );
				this.shadowRadius.f_value = shadowRadius.value;
				this.shadowRadius.unit    = shadowRadius.type;
				if( this.shadowRadius.unit == 3 ) { this.shadowRadius.pixels = shadowRadius.value }
				this.shadowRadius.is_set = true;
			}
		} catch(e) { }

	}


	this.parseXML = function(xmlStr) {
		var parser = new DOMParser();
		var xmlDoc = parser.parseFromString(xmlStr, "text/xml");
		return this.readXMLDoc( xmlDoc.childNodes[0], null );
	}

	this.readXMLDoc = function(node, parentNode) {
		var uiObj;
		if(node.nodeType===1) {

			var name = node.nodeName;

			if(name=="o") {
				var attr = node.attributes[0];
				if(attr) {
					var idx = parseInt(attr.nodeValue);
					return objectList[idx];
				}
			}

			var attrObj = {}
			var id_value;
			for(var a=0; a<node.attributes.length; a++) {
				var attr = node.attributes[a];
				if(attr.nodeName=="style") {
					var s = attr.nodeValue;
					// console.log("STYLE", s);
					var parts = s.split(";");
					for(var ii=0; ii<parts.length;ii++) {
						var p = parts[ii];
						var p2 = p.split(":");
						if(p2[0] && p2[1]) {
							attrObj[p2[0]] = p2[1];
						}
					}
				}
				attrObj[attr.nodeName] = attr.nodeValue;

				if(attr.nodeName == "cname") {
					// serialize the object into XML string
					// components[value_id] = 

var oSerializer = new XMLSerializer();
var sXML = oSerializer.serializeToString(node);	

				    console.log("found XML string", sXML );			
				}

				if(attr.nodeName=="id") {
					id_value = attr.nodeValue;
				}
			}

			// 

			var compData = this.findComponent(name)
			var content;

			if(compData) {
				// debugger;
				uiObj = new UIStructure(compData);
				content = uiObj.findContent() || uiObj;
				uiObj.readParams( attrObj );

			} else {
				uiObj = parentNode ? new UIStructure(attrObj) : this;
				if( uiObj == this ) this.readParams(attrObj);
				content = uiObj;
			}


			if(uiObj && id_value) {
				if(this._context) this._context.set_object( id_value, uiObj );
			}
			
			// "<object id=\""+this._instanceId+"\"/>";

			if(this.tagHandlers && this.tagHandlers[name]) {
					
			}			

			// fix: read tagname
			uiObj.tagName = name;

			// Aliases...
			var r = UIStructure.renderers[name];
			if(r) {
				uiObj.renderer = new r(uiObj);
			}


			if(name=="Hover") {
				parentNode.metaTags[name] = uiObj; // <-- can be accessed by the renderers
			}

			for(var i=0; i<node.childNodes.length; i++) {
				var childNode = node.childNodes[i]
				var childUI = this.readXMLDoc(childNode, uiObj);
				if( childUI ) content.add(childUI); 
			}
			return uiObj;
		}

		if(node.nodeType===3) {
			var str = node.nodeValue;
			if(str && str.trim() && parentNode) parentNode.readParams({'text': str});
		}
	}
	this.init = function( strJSON ) {

		if(!strJSON) return;
		if(typeof(strJSON)=='object') {
			this.readParams(strJSON);
			return;
		}
		try {
			if(strJSON[0]=="<") {
				this.parseXML(strJSON);
				return;
			}

			var jsonDict = JSON.parse(strJSON);
			this.readParams(jsonDict);
		} catch(e) { }

	}

	this.adjustLayoutParams = function( node ) { 
		if(this.width.is_set) {
			switch(this.width.unit) {
				case 1 : this.width.pixels = node.innerWidth.pixels * this.width.f_value / 100; break;
				case 2 : this.width.pixels = node.fontSize.pixels * this.width.f_value; break;
				case 3 : this.width.pixels = this.width.f_value;break;
				case 4 : this.width.pixels = node.innerHeight.pixels * this.width.f_value / 100; break;

				// fix: for width fill
				case 5 : this.width.pixels = 0; break;
				default : break
			}
		} else {
			this.width.pixels = node.innerWidth.pixels;
		}
		if(this.height.is_set) {
			switch(this.height.unit) {
				case 1 : this.height.pixels = node.innerWidth.pixels * this.height.f_value / 100; break;
				case 2 : this.height.pixels = node.fontSize.pixels * this.height.f_value; break;
				case 3 : this.height.pixels = this.height.f_value;break;
				case 4 : this.height.pixels = node.innerHeight.pixels * this.height.f_value / 100; break;

				// fix: for height fill
				case 5 : this.height.pixels = node.innerHeight.pixels * this.width.f_value / 100; break;
				default : break
			}
		} else {
			this.height.pixels = node.innerHeight.pixels;
		}
		if(this.left.is_set) {
			switch(this.left.unit) {
				case 1 : this.left.pixels = node.innerWidth.pixels * this.left.f_value / 100; break;
				case 2 : this.left.pixels = node.fontSize.pixels * this.left.f_value; break;
				case 3 : this.left.pixels = this.left.f_value;break;
				case 4 : this.left.pixels = node.innerHeight.pixels * this.left.f_value / 100; break;
				default : break
			}
		}

		// fix: right
		if(this.right.is_set) {
			switch(this.right.unit) {
				case 1 : this.right.pixels = node.innerWidth.pixels * this.right.f_value / 100; break;
				case 2 : this.right.pixels = node.fontSize.pixels * this.right.f_value; break;
				case 3 : this.right.pixels = this.right.f_value;break;
				case 4 : this.right.pixels = node.innerHeight.pixels * this.right.f_value / 100; break;
				default : break
			}
		}

		if(this.top.is_set) {
			switch(this.top.unit) {
				case 1 : this.top.pixels = node.innerWidth.pixels * this.top.f_value / 100; break;
				case 2 : this.top.pixels = node.fontSize.pixels * this.top.f_value; break;
				case 3 : this.top.pixels = this.top.f_value;break;
				case 4 : this.top.pixels = node.innerHeight.pixels * this.top.f_value / 100; break;
				default : break
			}
		}
		// fix bottom...
		if(this.bottom.is_set) {
			switch(this.bottom.unit) {
				case 1 : this.bottom.pixels = node.innerWidth.pixels * this.bottom.f_value / 100; break;
				case 2 : this.bottom.pixels = node.fontSize.pixels * this.bottom.f_value; break;
				case 3 : this.bottom.pixels = this.bottom.f_value;break;
				case 4 : this.bottom.pixels = node.innerHeight.pixels * this.bottom.f_value / 100; break;
				default : break
			}
		}		
		if(this.borderWidth.is_set) {
			switch(this.borderWidth.unit) {
				case 1 : this.borderWidth.pixels = node.innerWidth.pixels * this.borderWidth.f_value / 100; break;
				case 2 : this.borderWidth.pixels = node.fontSize.pixels * this.borderWidth.f_value; break;
				case 3 : this.borderWidth.pixels = this.borderWidth.f_value;break;
				case 4 : this.borderWidth.pixels = node.innerHeight.pixels * this.borderWidth.f_value / 100; break;
				default : break
			}
		}
		if(this.margin.is_set) {
			switch(this.margin.unit) {
				case 1 : this.margin.pixels = node.innerWidth.pixels * this.margin.f_value / 100; break;
				case 2 : this.margin.pixels = node.fontSize.pixels * this.margin.f_value; break;
				case 3 : this.margin.pixels = this.margin.f_value;break;
				case 4 : this.margin.pixels = node.innerHeight.pixels * this.margin.f_value / 100; break;
				default : break
			}
			if(!this.marginLeft.is_set) { 
				this.marginLeft.pixels = this.margin.pixels;
			} else {
				switch(this.marginLeft.unit) {
					case 1 : this.marginLeft.pixels = node.innerWidth.pixels * this.marginLeft.f_value / 100; break;
					case 2 : this.marginLeft.pixels = node.fontSize.pixels * this.marginLeft.f_value; break;
					case 3 : this.marginLeft.pixels = this.marginLeft.f_value;break;
					case 4 : this.marginLeft.pixels = node.innerHeight.pixels * this.marginLeft.f_value / 100; break;
					default : break
				}
			}
			if(!this.marginRight.is_set) { 
				this.marginRight.pixels = this.margin.pixels;
			} else {
				switch(this.marginRight.unit) {
					case 1 : this.marginRight.pixels = node.innerWidth.pixels * this.marginRight.f_value / 100; break;
					case 2 : this.marginRight.pixels = node.fontSize.pixels * this.marginRight.f_value; break;
					case 3 : this.marginRight.pixels = this.marginRight.f_value;break;
					case 4 : this.marginRight.pixels = node.innerHeight.pixels * this.marginRight.f_value / 100; break;
					default : break
				}
			}
			if(!this.marginTop.is_set) { 
				this.marginTop.pixels = this.margin.pixels;
			} else {
				switch(this.marginTop.unit) {
					case 1 : this.marginTop.pixels = node.innerWidth.pixels * this.marginTop.f_value / 100; break;
					case 2 : this.marginTop.pixels = node.fontSize.pixels * this.marginTop.f_value; break;
					case 3 : this.marginTop.pixels = this.marginTop.f_value;break;
					case 4 : this.marginTop.pixels = node.innerHeight.pixels * this.marginTop.f_value / 100; break;
					default : break
				}
			}
			if(!this.marginBottom.is_set) { 
				this.marginBottom.pixels = this.margin.pixels;
			} else {
				switch(this.marginBottom.unit) {
					case 1 : this.marginBottom.pixels = node.innerWidth.pixels * this.marginBottom.f_value / 100; break;
					case 2 : this.marginBottom.pixels = node.fontSize.pixels * this.marginBottom.f_value; break;
					case 3 : this.marginBottom.pixels = this.marginBottom.f_value;break;
					case 4 : this.marginBottom.pixels = node.innerHeight.pixels * this.marginBottom.f_value / 100; break;
					default : break
				}
			}
		}
		if(this.padding.is_set) {
			switch(this.padding.unit) {
				case 1 : this.padding.pixels = node.innerWidth.pixels * this.padding.f_value / 100; break;
				case 2 : this.padding.pixels = node.fontSize.pixels * this.padding.f_value; break;
				case 3 : this.padding.pixels = this.padding.f_value;break;
				case 4 : this.padding.pixels = node.innerHeight.pixels * this.padding.f_value / 100; break;
				default : break
			}
			if(!this.paddingLeft.is_set) { 
				this.paddingLeft.pixels = this.padding.pixels;
			} else {
				switch(this.paddingLeft.unit) {
					case 1 : this.paddingLeft.pixels = node.innerWidth.pixels * this.paddingLeft.f_value / 100; break;
					case 2 : this.paddingLeft.pixels = node.fontSize.pixels * this.paddingLeft.f_value; break;
					case 3 : this.paddingLeft.pixels = this.paddingLeft.f_value;break;
					case 4 : this.paddingLeft.pixels = node.innerHeight.pixels * this.paddingLeft.f_value / 100; break;
					default : break
				}
			}
			if(!this.paddingRight.is_set) { 
				this.paddingRight.pixels = this.padding.pixels;
			} else {
				switch(this.paddingRight.unit) {
					case 1 : this.paddingRight.pixels = node.innerWidth.pixels * this.paddingRight.f_value / 100; break;
					case 2 : this.paddingRight.pixels = node.fontSize.pixels * this.paddingRight.f_value; break;
					case 3 : this.paddingRight.pixels = this.paddingRight.f_value;break;
					case 4 : this.paddingRight.pixels = node.innerHeight.pixels * this.paddingRight.f_value / 100; break;
					default : break
				}
			}
			if(!this.paddingTop.is_set) { 
				this.paddingTop.pixels = this.padding.pixels;
			} else {
				switch(this.paddingTop.unit) {
					case 1 : this.paddingTop.pixels = node.innerWidth.pixels * this.paddingTop.f_value / 100; break;
					case 2 : this.paddingTop.pixels = node.fontSize.pixels * this.paddingTop.f_value; break;
					case 3 : this.paddingTop.pixels = this.paddingTop.f_value;break;
					case 4 : this.paddingTop.pixels = node.innerHeight.pixels * this.paddingTop.f_value / 100; break;
					default : break
				}
			}
			if(!this.paddingBottom.is_set) { 
				this.paddingBottom.pixels = this.padding.pixels;
			} else {
				switch(this.paddingBottom.unit) {
					case 1 : this.paddingBottom.pixels = node.innerWidth.pixels * this.paddingBottom.f_value / 100; break;
					case 2 : this.paddingBottom.pixels = node.fontSize.pixels * this.paddingBottom.f_value; break;
					case 3 : this.paddingBottom.pixels = this.paddingBottom.f_value;break;
					case 4 : this.paddingBottom.pixels = node.innerHeight.pixels * this.paddingBottom.f_value / 100; break;
					default : break
				}
			}
		}
		this.width.pixels = this.width.pixels - (this.marginLeft.pixels + this.marginRight.pixels);
		this.height.pixels = this.height.pixels - (this.marginTop.pixels + this.marginBottom.pixels);
		this.innerWidth.pixels = this.width.pixels - (this.paddingRight.pixels + this.paddingLeft.pixels + this.borderWidth.pixels*2);
		this.innerHeight.pixels = this.height.pixels - (this.paddingTop.pixels + this.paddingBottom.pixels + this.borderWidth.pixels*2);

		// fix: fontsize
		if(this.fontSize.is_set) {
			switch(this.fontSize.unit) {
				case 1 : this.fontSize.pixels = this.width.pixels * this.fontSize.f_value / 100;break;
				case 2 : this.fontSize.pixels = this.fontSize.f_value;break;
				case 3 : this.fontSize.pixels = this.fontSize.f_value;break;
				case 4 : this.fontSize.pixels = this.height.pixels * this.fontSize.f_value / 100;break;
				default : break
			}
		}

		if(this.borderRadius.is_set) {
			switch(this.borderRadius.unit) {
				case 1 : this.borderRadius.pixels = this.width.pixels * this.borderRadius.f_value / 100;break;
				case 2 : this.borderRadius.pixels = this.fontSize.pixels * this.borderRadius.f_value;break;
				case 3 : this.borderRadius.pixels = this.borderRadius.f_value;break;
				case 4 : this.borderRadius.pixels = this.height.pixels * this.borderRadius.f_value / 100;break;
				default : break
			}
		}
	}

	this.calculateLayout = function( parentNode , render_pos  ) { 
		var newPOS = new UIRenderPosition( render_pos.x,  render_pos.y );
		var render_start_y = render_pos.y;
		var node = this;
		this.adjustLayoutParams(parentNode);
		var elem_h = this.default_layout(node, render_pos);
		node.calculated.render_height = elem_h
		node.calculated.render_width  = node.inline.is_set && node.inline.b_value && node.calculated.width_override ?  node.calculated.width_override : node.width.pixels;
		node.calculated.height = elem_h + node.marginTop.pixels + node.marginBottom.pixels;
		node.calculated.width  = node.calculated.render_width + node.marginLeft.pixels + node.marginRight.pixels;
		if( node.left.is_set ) {
			node.calculated.x = node.marginLeft.pixels + node.left.pixels;
			node.calculated.absolute = true;
		} else {
			node.calculated.x = render_pos.x + node.marginLeft.pixels;
		}
		if( node.top.is_set ) {
			node.calculated.y = node.marginTop.pixels + node.top.pixels;
			node.calculated.absolute = true;
		} else {
			// FIX: bottom...
			if(node.bottom.is_set) {
				node.calculated.y = node.marginTop.pixels + ( parentNode.innerHeight.pixels - node.bottom.pixels - node.calculated.height);
				node.calculated.absolute = true;
			} else {
				node.calculated.y = render_pos.y + node.marginTop.pixels;
			}	
			
		}
		if ( !node.left.is_set && !node.top.is_set) {
			newPOS.x += node.calculated.width;
			newPOS.y = render_start_y + elem_h + node.marginTop.pixels + node.marginBottom.pixels;
		}
		return newPOS;
	}

	this.default_layout = function( node ,  render_pos )  { 
		if(node.lineBreak.b_value) { node.calculated.lineBreak = true; }
		var elem_h  = node.paddingTop.pixels + node.paddingBottom.pixels;
		if(node.height.is_set) { elem_h += node.innerHeight.pixels; }
		var child_render_pos = new UIRenderPosition( node.paddingLeft.pixels, node.paddingTop.pixels);
		var child_heights = 0.0;
		var line_height   = 0.0;
		var row_width     = 0.0;
		var col_height    = 0.0;
		var current_y     = child_render_pos.y;
		var current_x     = child_render_pos.x;
		var current_row   = [];
		if (node.direction.is_set && (node.direction.s_value == "bottom-to-top")) { 
			for( var ii=0; ii<node.items.length;ii++){
				var childNode = node.items[ii];
				child_render_pos.y = current_y;
				child_render_pos.x = current_x;
				child_render_pos = childNode.calculateLayout(node,  child_render_pos);
				if( childNode.calculated.absolute ) { continue };
				childNode.calculated.y = current_y + (node.innerHeight.pixels - col_height - childNode.calculated.height);
				col_height     += childNode.calculated.height;
				if( childNode.calculated.lineBreak ||  (col_height > node.innerHeight.pixels && (col_height - node.innerHeight.pixels > 0.5))) {
					child_heights += line_height;
					current_x += row_width;
					line_height   = 0;
					col_height    = 0;
					row_width     = 0;
					child_render_pos.x = current_x;
					child_render_pos.y = node.paddingTop.pixels;
					child_render_pos = childNode.calculateLayout(node,  child_render_pos);
					childNode.calculated.y = current_y + (node.innerHeight.pixels - col_height - childNode.calculated.height);
					current_row = []
					current_row.push(childNode);
					line_height   = childNode.calculated.height;
					row_width     = childNode.calculated.width;
				} else {
					if(childNode.calculated.width > row_width) { row_width = childNode.calculated.width; }
					current_row.push(childNode);
				}
			};
			if(node.align.is_set && node.align.s_value == "right" || node.align.s_value == "center") {
				if(current_row.length > 0) {
					for( var i2=0; i2<current_row.length ; i2++){
						var row_item = current_row[i2];
						var deltaX = row_width - (row_item.calculated.width);
						if(node.align.s_value == "center") { deltaX = deltaX / 2; } // vertical align center
						row_item.calculated.x += deltaX;
					};
				}
			};
		} else { 
			for( var ii=0; ii<node.items.length;ii++){
				var childNode = node.items[ii];
				child_render_pos.y = current_y;
				child_render_pos = childNode.calculateLayout(node, child_render_pos);
				if( childNode.calculated.absolute) { continue; }
				row_width     += childNode.calculated.width;


				
				if( childNode.calculated.lineBreak ||  (row_width > node.innerWidth.pixels && (row_width - node.innerWidth.pixels > 0.5))) {
					if(node.align.is_set && (node.align.s_value == "right" || node.align.s_value  == "center")) {
						// align right
						let lastItem = current_row[current_row.length - 1];
						var deltaX = node.paddingLeft.pixels + node.innerWidth.pixels + 0.5*lastItem.marginLeft.pixels - lastItem.calculated.x - lastItem.calculated.width;
						if(node.align.is_set && (node.align.s_value == "center" )) { deltaX = deltaX / 2; } // align center
						for( var i2=0; i2<current_row.length ; i2++){
							var row_item = current_row[i2];
							row_item.calculated.x += deltaX;}
					}
					if(node.verticalAlign.is_set && (node.verticalAlign.s_value == "bottom" || node.verticalAlign.s_value  == "center" )) {
						if(current_row.length > 0 ) {
							for( var i2=0; i2<current_row.length ; i2++){
								var row_item = current_row[i2];
								var deltaY = line_height - (row_item.calculated.height);
								if(node.verticalAlign.s_value == "center" ) { deltaY = deltaY / 2; } // vertical align center
								row_item.calculated.y += deltaY
							};
						}
					}
					// FIX: height="fill"
					for( var i2=0; i2<current_row.length ; i2++){
						var row_item = current_row[i2];
						if(row_item.height.unit == 5) {
							row_item.calculated.render_height = line_height;
						}
					};					
					child_heights += line_height;
					current_y += line_height;
					line_height   = 0;
					row_width     = 0;
					child_render_pos.x = node.paddingLeft.pixels;
					child_render_pos.y = current_y;
					child_render_pos = childNode.calculateLayout(node,  child_render_pos);
					current_row = []
					current_row.push(childNode);
					line_height = childNode.calculated.height;
					row_width     = childNode.calculated.width;
				} else {
					// FIX: do not add unit type 5
					if(childNode.calculated.height > line_height && (childNode.height.unit != 5)) { line_height = childNode.calculated.height; }
					current_row.push(childNode);

					if(!node.calculated.width_override  || (node.calculated.width_override < row_width)) {
						node.calculated.width_override = row_width +node.paddingLeft.pixels + node.paddingRight.pixels;
					}					
				}
			};
			if(node.align.is_set && (node.align.s_value == "right" || node.align.s_value  == "center")) {
				// align right
				if(current_row.length > 0) {
					let lastItem = current_row[current_row.length - 1];
					var deltaX = node.paddingLeft.pixels + node.innerWidth.pixels + lastItem.marginLeft.pixels - lastItem.calculated.x - lastItem.calculated.width;
					if(node.align.is_set && (node.align.s_value == "center" )) { deltaX = deltaX / 2; } // align center
					for( var i2=0; i2<current_row.length ; i2++){
						var row_item = current_row[i2];
						row_item.calculated.x += deltaX;
					};
				}
			}
			if(node.verticalAlign.is_set && (node.verticalAlign.s_value == "bottom" || node.verticalAlign.s_value == "center" )) {
				if(current_row.length > 0) {
					for( var i2=0; i2<current_row.length ; i2++){
						var row_item = current_row[i2];
						var deltaY = line_height - (row_item.calculated.height);
						if(node.verticalAlign.s_value == "center") { deltaY = deltaY / 2; } // vertical align center
						row_item.calculated.y += deltaY
					};
				}
			}

			// FIX: height="fill"
			for( var i2=0; i2<current_row.length ; i2++){
				var row_item = current_row[i2];
				if(row_item.height.unit == 5) {
					row_item.calculated.render_height = line_height;
				}
			};

			} 
			if(line_height > 0) { child_heights = child_heights + line_height; }
			if(!node.height.is_set) { 
				elem_h += child_heights; 
				if(node.renderer && node.renderer.customSize) {
					var size = node.renderer.customSize( node.innerWidth.pixels )
					if(size) {
						elem_h += size.height;
						// fix : ??? overried width
						node.calculated.width_override = size.width;
					}
				}
			}
			return elem_h;
		} 


})();



var UIStructure = function(strJSON, context) {


		this._context = context;

		this.items = [];
		this.calculated = new UICalculated();
		this.viewInstance = null;

		this.renderer = null
		this.parentView = null

		// fix: event handlers
		this.eventHandlers = {};

		// fix:
		this.tagName = null;
		this.isHidden = false;

		// Event handlers...
		this.tapHandler = null

		// FIX: meta tags, tags that are uknown at parsing time...
		this.metaTags = {}

		// layout parameters
		this.x = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.y = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.left = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.top = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }

		// fix: bottom is set
	    this.bottom = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
	    this.right  = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }

		this.id = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }

		// fix: CNAME = component name
		this.cname = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }

		this.width = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.height = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.inline = { unit : 0, is_set : false, pixels : 0.0, b_value : false, s_value : "" }
		this.direction = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.align = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.verticalAlign = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.innerWidth = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.innerHeight = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.lineBreak = { unit : 0, is_set : false, f_value : 0.0, s_value : "", b_value : false }
		this.overflow = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.fontSize = { unit : 0, is_set : false, pixels : 0.0, f_value : 14.0, s_value : "" }
		this.fontFamily = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.color = {  unit : 0, is_set : false, f_value : 0.0, s_value : "" , color : "#000000" }
		this.backgroundColor = {  unit : 0, is_set : false, f_value : 0.0, s_value : "" , color : "#000000" }
		this.opacity = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.rotate = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.borderWidth = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.borderColor = {  unit : 0, is_set : false, f_value : 0.0, s_value : "" , color : "#000000" }
		this.borderRadius = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		
		// FIX: add scale
		this.scale = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }

		// FIX: add viewport
		this.svgPath = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.viewBox = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }

		this.imageUrl = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.text = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }

		// fix: adding linear gradient parsing...
		// linear-gradient = "rgba(0,)
		this.linearGradient = {
			is_set : false,
			colors : [],
			stops : [],
			s_value : ""
		}

		this.vColorSlide = { unit : 0, is_set : false, f_value : 0.0, s_value : "", b_value : false }
		this.vColorSlideBreak = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.vColorSlideTop = {  unit : 0, is_set : false, f_value : 0.0, s_value : "" , color : "#000000" }
		this.vColorSlideBottom = {  unit : 0, is_set : false, f_value : 0.0, s_value : "" , color : "#000000" }
		this.margin = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.marginLeft = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.marginRight = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.marginBottom = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.marginTop = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.padding = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.paddingLeft = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.paddingRight = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.paddingBottom = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.paddingTop = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.shadowColor = {  unit : 0, is_set : false, f_value : 0.0, s_value : "" , color : "#000000" }
		this.shadowOffsetX = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.shadowOffsetY = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.shadowOpacity = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }
		this.shadowRadius = { unit : 0, is_set : false, pixels : 0.0, f_value : 0.0, s_value : "" }

		this.init(strJSON);
	
}
UIStructure.prototype = UIStructure_prototype;

UIStructure.renderers = {
	'Input' : 		UIInputRenderEngine,
	'input' : 		UIInputRenderEngine,
	
	'Label' : 		UILabelRenderEngine,
	'span' : 		UILabelRenderEngine,

	'View' : 		UIViewRenderEngine,
	'div' : 		UIViewRenderEngine,
	
	'Image' : 		UIImageRenderEngine,
	'img' : 		UIImageRenderEngine,

	'Switch' : 		UISwitchRenderEngine,
	'Slider' : 		UISliderRenderEngine,
	
	'Path' : 		UISvgPathRenderEngine,
	'path' : 		UISvgPathRenderEngine,

	'TextField' : 	UITextFieldRenderEngine,
	'textarea' : 	UITextFieldRenderEngine
}

