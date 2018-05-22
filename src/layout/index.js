"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: generic renderer
const pdfkit_1 = require("../renderers/pdfkit");
var DOMParser = require('xmldom').DOMParser;
class UIRenderPosition {
    constructor(x, y, renderer) {
        this.x = 0;
        this.y = 0;
        this.x = x;
        this.y = y;
        this.renderer = renderer;
    }
}
exports.UIRenderPosition = UIRenderPosition;
class UICalculated {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.render_width = 0;
        this.render_height = 0;
        this.lineBreak = false;
        this.absolute = false;
    }
}
exports.UICalculated = UICalculated;
const UICompRegistry = {};
const UIRenderers = {};
const UIFonts = {};
exports.register_font = (name, fontFile) => {
    UIFonts[name] = fontFile;
};
exports.register_component = (name, component) => {
    UICompRegistry[name] = component;
};
exports.register_renderer = (name, component) => {
    UIRenderers[name] = component;
};
class EVG {
    constructor(strJSON, context) {
        this.items = [];
        this.calculated = new UICalculated();
        this.viewInstance = null;
        this.renderer = null;
        this.parentView = null;
        // fix: event handlers
        this.eventHandlers = {};
        // fix:
        this.tagName = null;
        this.isHidden = false;
        // Event handlers...
        this.tapHandler = null;
        // FIX: meta tags, tags that are uknown at parsing time...
        this.metaTags = {};
        // layout parameters
        this.x = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.y = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.left = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.top = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        // fix: bottom is set
        this.bottom = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.right = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.id = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        // fix: CNAME = component name
        this.cname = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.width = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.height = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.inline = { unit: 0, is_set: false, pixels: 0.0, b_value: false, s_value: "" };
        this.direction = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.align = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.verticalAlign = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.innerWidth = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.innerHeight = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.lineBreak = { unit: 0, is_set: false, f_value: 0.0, s_value: "", b_value: false };
        this.overflow = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.fontSize = { unit: 0, is_set: false, pixels: 0.0, f_value: 14.0, s_value: "" };
        this.fontFamily = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.color = { unit: 0, is_set: false, f_value: 0.0, s_value: "", color: "#000000" };
        this.backgroundColor = { unit: 0, is_set: false, f_value: 0.0, s_value: "", color: "#000000" };
        this.opacity = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.rotate = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.borderWidth = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.borderColor = { unit: 0, is_set: false, f_value: 0.0, s_value: "", color: "#000000" };
        this.borderRadius = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        // FIX: add scale
        this.scale = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        // FIX: add viewport
        this.svgPath = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.viewBox = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.imageUrl = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.text = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        // fix: adding linear gradient parsing...
        // linear-gradient = "rgba(0,)
        this.linearGradient = {
            is_set: false,
            colors: [],
            stops: [],
            s_value: ""
        };
        this.vColorSlide = { unit: 0, is_set: false, f_value: 0.0, s_value: "", b_value: false };
        this.vColorSlideBreak = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.vColorSlideTop = { unit: 0, is_set: false, f_value: 0.0, s_value: "", color: "#000000" };
        this.vColorSlideBottom = { unit: 0, is_set: false, f_value: 0.0, s_value: "", color: "#000000" };
        this.margin = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.marginLeft = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.marginRight = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.marginBottom = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.marginTop = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.padding = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.paddingLeft = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.paddingRight = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.paddingBottom = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.paddingTop = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.shadowColor = { unit: 0, is_set: false, f_value: 0.0, s_value: "", color: "#000000" };
        this.shadowOffsetX = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.shadowOffsetY = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.shadowOpacity = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.shadowRadius = { unit: 0, is_set: false, pixels: 0.0, f_value: 0.0, s_value: "" };
        this.convertStrToValue = function (str) {
            var b_had = false;
            var type = 0;
            var value = 0.0;
            if (str.endsWith("%")) {
                let fs = str.substr(0, str.length - 1);
                value = parseFloat(fs);
                type = 1;
                b_had = true;
            }
            if (str.endsWith("em")) {
                let fs = str.substr(0, str.length - 2);
                value = parseFloat(fs);
                type = 2;
                b_had = true;
            }
            if (str.endsWith("px")) {
                let fs = str.substr(0, str.length - 2);
                value = parseFloat(fs);
                type = 3;
                b_had = true;
            }
            if (str.endsWith("hp")) {
                let fs = str.substr(0, str.length - 2);
                value = parseFloat(fs);
                type = 4;
                b_had = true;
            }
            if (str == "fill") {
                value = 100;
                type = 5;
                b_had = true;
            }
            if (!b_had) {
                value = parseFloat(str);
                type = 3;
                b_had = true;
            }
            return { value: value, type: type };
        };
        this._context = context;
        if (!strJSON)
            return;
        if (typeof (strJSON) == 'object') {
            this.readParams(strJSON);
            return;
        }
        try {
            if (typeof (strJSON) == 'string') {
                const s = strJSON.trim();
                if (s[0] == "<") {
                    this.parseXML(s);
                    return;
                }
                var jsonDict = JSON.parse(s);
                this.readParams(jsonDict);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
    static installFont(name, fileName) {
        exports.register_font(name, fileName);
    }
    static installComponent(name, componentData) {
        exports.register_component(name, componentData);
    }
    static renderToFile(fileName, width, height, item, header, footer) {
        return __awaiter(this, void 0, void 0, function* () {
            const renderer = new pdfkit_1.Renderer(width, height);
            item.calculate(width, height, renderer);
            renderer.render(fileName, item, [header, footer]);
        });
    }
    findComponent(name) {
        return UICompRegistry[name];
    }
    findFont(name) {
        return UIFonts[name];
    }
    findContent(list) {
        var list = list || [];
        if (this.id.is_set && this.id.s_value == "content") {
            list.push(this);
            return;
        }
        if (this.tagName == "content") {
            list.push(this);
            return;
        }
        for (var i = 0; i < this.items.length; i++) {
            var item = this.items[i];
            item.findContent(list);
            if (list.length)
                return list[0];
        }
        return list[0];
    }
    add(childView) {
        if (!childView)
            return;
        if (childView.forEach) {
            childView.forEach((item) => { this.add(item); });
            return;
        }
        childView.parentView = this;
        this.items.push(childView);
        return this;
    }
    readParams(jsonDict) {
        try {
            // Event handlers are disabled for now...
            /*
            if(jsonDict["onClick"]) {
              console.log("hasClickHandler...", jsonDict["onClick"]);
              this.eventOnClick = jsonDict["onClick"]
              // How to add into the renderer???
            }
            */
            if (jsonDict["x"]) {
                var value_x = jsonDict["x"];
                var x = this.convertStrToValue(value_x);
                this.x.f_value = x.value;
                this.x.unit = x.type;
                if (this.x.unit == 3) {
                    this.x.pixels = x.value;
                }
                this.x.is_set = true;
            }
            if (jsonDict["y"]) {
                var value_y = jsonDict["y"];
                var y = this.convertStrToValue(value_y);
                this.y.f_value = y.value;
                this.y.unit = y.type;
                if (this.y.unit == 3) {
                    this.y.pixels = y.value;
                }
                this.y.is_set = true;
            }
            if (jsonDict["left"]) {
                var value_left = jsonDict["left"];
                var left = this.convertStrToValue(value_left);
                this.left.f_value = left.value;
                this.left.unit = left.type;
                if (this.left.unit == 3) {
                    this.left.pixels = left.value;
                }
                this.left.is_set = true;
            }
            if (jsonDict["top"]) {
                var value_top = jsonDict["top"];
                var top = this.convertStrToValue(value_top);
                this.top.f_value = top.value;
                this.top.unit = top.type;
                if (this.top.unit == 3) {
                    this.top.pixels = top.value;
                }
                this.top.is_set = true;
            }
            // fix: bottom
            if (jsonDict["bottom"]) {
                var value_bottom = jsonDict["bottom"];
                var bottom = this.convertStrToValue(value_bottom);
                this.bottom.f_value = bottom.value;
                this.bottom.unit = bottom.type;
                if (this.top.unit == 3) {
                    this.bottom.pixels = bottom.value;
                }
                this.bottom.is_set = true;
            }
            // fix: right
            if (jsonDict["right"]) {
                var value_right = jsonDict["right"];
                var right = this.convertStrToValue(value_right);
                this.right.f_value = right.value;
                this.right.unit = right.type;
                if (this.top.unit == 3) {
                    this.right.pixels = right.value;
                }
                this.right.is_set = true;
            }
            if (jsonDict["id"]) {
                var value_id = jsonDict["id"];
                this.id.s_value = value_id;
                this.id.is_set = true;
            }
            // component name...
            if (jsonDict["cname"]) {
                var value_id = jsonDict["cname"];
                this.cname.s_value = value_id;
                this.cname.is_set = true;
            }
            if (jsonDict["width"]) {
                var value_width = jsonDict["width"];
                var width = this.convertStrToValue(value_width);
                this.width.f_value = width.value;
                this.width.unit = width.type;
                if (this.width.unit == 3) {
                    this.width.pixels = width.value;
                }
                this.width.is_set = true;
            }
            if (jsonDict["height"]) {
                var value_height = jsonDict["height"];
                var height = this.convertStrToValue(value_height);
                this.height.f_value = height.value;
                this.height.unit = height.type;
                if (this.height.unit == 3) {
                    this.height.pixels = height.value;
                }
                this.height.is_set = true;
            }
            if (jsonDict["inline"]) {
                var value_inline = jsonDict["inline"];
                var lineBreak = value_inline;
                if (lineBreak == "true" || lineBreak == "1") {
                    this.inline.b_value = true;
                }
                else {
                    this.inline.b_value = false;
                }
                this.inline.is_set = true;
            }
            if (jsonDict["direction"]) {
                var value_direction = jsonDict["direction"];
                this.direction.s_value = value_direction;
                this.direction.is_set = true;
            }
            if (jsonDict["align"]) {
                var value_align = jsonDict["align"];
                this.align.s_value = value_align;
                this.align.is_set = true;
            }
            if (jsonDict["verticalAlign"] || jsonDict["vertical-align"]) {
                var value_verticalAlign = jsonDict["verticalAlign"] || jsonDict["vertical-align"];
                this.verticalAlign.s_value = value_verticalAlign;
                this.verticalAlign.is_set = true;
            }
            if (jsonDict["innerWidth"]) {
                var value_innerWidth = jsonDict["innerWidth"];
                var innerWidth = this.convertStrToValue(value_innerWidth);
                this.innerWidth.f_value = innerWidth.value;
                this.innerWidth.unit = innerWidth.type;
                if (this.innerWidth.unit == 3) {
                    this.innerWidth.pixels = innerWidth.value;
                }
                this.innerWidth.is_set = true;
            }
            if (jsonDict["innerHeight"]) {
                var value_innerHeight = jsonDict["innerHeight"];
                var innerHeight = this.convertStrToValue(value_innerHeight);
                this.innerHeight.f_value = innerHeight.value;
                this.innerHeight.unit = innerHeight.type;
                if (this.innerHeight.unit == 3) {
                    this.innerHeight.pixels = innerHeight.value;
                }
                this.innerHeight.is_set = true;
            }
            if (jsonDict["lineBreak"] || jsonDict["line-break"]) {
                var value_lineBreak = jsonDict["lineBreak"] || jsonDict["line-break"];
                var lineBreak = value_lineBreak;
                if (lineBreak == "true" || lineBreak == "1") {
                    this.lineBreak.b_value = true;
                }
                else {
                    this.lineBreak.b_value = false;
                }
                this.lineBreak.is_set = true;
            }
            if (jsonDict["overflow"]) {
                var value_overflow = jsonDict["overflow"];
                this.overflow.s_value = value_overflow;
                this.overflow.is_set = true;
            }
            if (jsonDict["fontSize"] || jsonDict["font-size"]) {
                var value_fontSize = jsonDict["fontSize"] || jsonDict["font-size"];
                var fontSize = this.convertStrToValue(value_fontSize);
                this.fontSize.f_value = fontSize.value;
                this.fontSize.unit = fontSize.type;
                if (this.fontSize.unit == 3) {
                    this.fontSize.pixels = fontSize.value;
                }
                this.fontSize.is_set = true;
            }
            if (jsonDict["fontFamily"] || jsonDict["font-family"]) {
                var value_fontFamily = jsonDict["fontFamily"] || jsonDict["font-family"];
                this.fontFamily.s_value = value_fontFamily;
                this.fontFamily.is_set = true;
            }
            if (jsonDict["color"]) {
                var value_color = jsonDict["color"];
                this.color.s_value = value_color;
                this.color.is_set = true;
            }
            if (jsonDict["backgroundColor"] || jsonDict["background-color"]) {
                var value_backgroundColor = jsonDict["backgroundColor"] || jsonDict["background-color"];
                this.backgroundColor.s_value = value_backgroundColor;
                this.backgroundColor.is_set = true;
            }
            // fix: parse linear-gradient values
            if (jsonDict["linear-gradient"] || jsonDict["linearGradient"]) {
                var value_linearGradient = jsonDict["linearGradient"] || jsonDict["linear-gradient"];
                this.linearGradient.s_value = value_linearGradient;
                this.linearGradient.is_set = true;
            }
            if (jsonDict["opacity"]) {
                var value_opacity = jsonDict["opacity"];
                var opacity = this.convertStrToValue(value_opacity);
                this.opacity.f_value = opacity.value;
                this.opacity.unit = opacity.type;
                if (this.opacity.unit == 3) {
                    this.opacity.pixels = opacity.value;
                }
                this.opacity.is_set = true;
            }
            if (jsonDict["rotate"]) {
                var value_rotate = jsonDict["rotate"];
                var rotate = parseInt(value_rotate);
                this.rotate.f_value = rotate;
                this.rotate.is_set = true;
            }
            // fix add scale
            if (jsonDict["scale"]) {
                var value_scale = parseFloat(jsonDict["scale"]);
                this.scale.f_value = value_scale;
                this.scale.is_set = true;
            }
            if (jsonDict["borderWidth"] || jsonDict["border-width"]) {
                var value_borderWidth = jsonDict["borderWidth"] || jsonDict["border-width"];
                var borderWidth = this.convertStrToValue(value_borderWidth);
                this.borderWidth.f_value = borderWidth.value;
                this.borderWidth.unit = borderWidth.type;
                if (this.borderWidth.unit == 3) {
                    this.borderWidth.pixels = borderWidth.value;
                }
                this.borderWidth.is_set = true;
            }
            if (jsonDict["borderColor"] || jsonDict["border-color"]) {
                var value_borderColor = jsonDict["borderColor"] || jsonDict["border-color"];
                this.borderColor.s_value = value_borderColor;
                this.borderColor.is_set = true;
            }
            if (jsonDict["borderRadius"] || jsonDict["border-radius"]) {
                var value_borderRadius = jsonDict["borderRadius"] || jsonDict["border-radius"];
                var borderRadius = this.convertStrToValue(value_borderRadius);
                this.borderRadius.f_value = borderRadius.value;
                this.borderRadius.unit = borderRadius.type;
                if (this.borderRadius.unit == 3) {
                    this.borderRadius.pixels = borderRadius.value;
                }
                this.borderRadius.is_set = true;
            }
            // fix: add viewBox
            if (jsonDict["viewBox"]) {
                var value_viewBox = jsonDict["viewBox"];
                this.viewBox.s_value = value_viewBox;
                this.viewBox.is_set = true;
            }
            if (jsonDict["svgPath"] || jsonDict["path"] || jsonDict["d"]) {
                var value_svgPath = jsonDict["svgPath"] || jsonDict["path"] || jsonDict["d"];
                this.svgPath.s_value = value_svgPath;
                this.svgPath.is_set = true;
            }
            if (jsonDict["imageUrl"] || jsonDict["src"]) {
                var value_imageUrl = jsonDict["imageUrl"] || jsonDict["src"];
                this.imageUrl.s_value = value_imageUrl;
                this.imageUrl.is_set = true;
            }
            if (jsonDict["text"]) {
                var value_text = jsonDict["text"];
                this.text.s_value = value_text;
                this.text.is_set = true;
            }
            if (jsonDict["vColorSlide"]) {
                var value_vColorSlide = jsonDict["vColorSlide"];
                var vColorSlide = value_vColorSlide;
                if (vColorSlide == "true" || vColorSlide == "1") {
                    this.vColorSlide.b_value = true;
                }
                else {
                    this.vColorSlide.b_value = false;
                }
                this.vColorSlide.is_set = true;
            }
            if (jsonDict["vColorSlideBreak"]) {
                var value_vColorSlideBreak = jsonDict["vColorSlideBreak"];
                var vColorSlideBreak = this.convertStrToValue(value_vColorSlideBreak);
                this.vColorSlideBreak.f_value = vColorSlideBreak.value;
                this.vColorSlideBreak.unit = vColorSlideBreak.type;
                if (this.vColorSlideBreak.unit == 3) {
                    this.vColorSlideBreak.pixels = vColorSlideBreak.value;
                }
                this.vColorSlideBreak.is_set = true;
            }
            if (jsonDict["vColorSlideTop"]) {
                var value_vColorSlideTop = jsonDict["vColorSlideTop"];
                this.vColorSlideTop.s_value = value_vColorSlideTop;
                this.vColorSlideTop.is_set = true;
            }
            if (jsonDict["vColorSlideBottom"]) {
                var value_vColorSlideBottom = jsonDict["vColorSlideBottom"];
                this.vColorSlideBottom.s_value = value_vColorSlideBottom;
                this.vColorSlideBottom.is_set = true;
            }
            if (jsonDict["margin"]) {
                var value_margin = jsonDict["margin"];
                var margin = this.convertStrToValue(value_margin);
                this.margin.f_value = margin.value;
                this.margin.unit = margin.type;
                if (this.margin.unit == 3) {
                    this.margin.pixels = margin.value;
                }
                this.margin.is_set = true;
            }
            if (jsonDict["marginLeft"] || jsonDict["margin-left"]) {
                var value_marginLeft = jsonDict["marginLeft"] || jsonDict["margin-left"];
                var marginLeft = this.convertStrToValue(value_marginLeft);
                this.marginLeft.f_value = marginLeft.value;
                this.marginLeft.unit = marginLeft.type;
                if (this.marginLeft.unit == 3) {
                    this.marginLeft.pixels = marginLeft.value;
                }
                this.marginLeft.is_set = true;
            }
            if (jsonDict["marginRight"] || jsonDict["margin-right"]) {
                var value_marginRight = jsonDict["marginRight"] || jsonDict["margin-right"];
                var marginRight = this.convertStrToValue(value_marginRight);
                this.marginRight.f_value = marginRight.value;
                this.marginRight.unit = marginRight.type;
                if (this.marginRight.unit == 3) {
                    this.marginRight.pixels = marginRight.value;
                }
                this.marginRight.is_set = true;
            }
            if (jsonDict["marginBottom"] || jsonDict["margin-bottom"]) {
                var value_marginBottom = jsonDict["marginBottom"] || jsonDict["margin-bottom"];
                var marginBottom = this.convertStrToValue(value_marginBottom);
                this.marginBottom.f_value = marginBottom.value;
                this.marginBottom.unit = marginBottom.type;
                if (this.marginBottom.unit == 3) {
                    this.marginBottom.pixels = marginBottom.value;
                }
                this.marginBottom.is_set = true;
            }
            if (jsonDict["marginTop"] || jsonDict["margin-top"]) {
                var value_marginTop = jsonDict["marginTop"] || jsonDict["margin-top"];
                var marginTop = this.convertStrToValue(value_marginTop);
                this.marginTop.f_value = marginTop.value;
                this.marginTop.unit = marginTop.type;
                if (this.marginTop.unit == 3) {
                    this.marginTop.pixels = marginTop.value;
                }
                this.marginTop.is_set = true;
            }
            if (jsonDict["padding"]) {
                var value_padding = jsonDict["padding"];
                var padding = this.convertStrToValue(value_padding);
                this.padding.f_value = padding.value;
                this.padding.unit = padding.type;
                if (this.padding.unit == 3) {
                    this.padding.pixels = padding.value;
                }
                this.padding.is_set = true;
            }
            if (jsonDict["paddingLeft"] || jsonDict["padding-left"]) {
                var value_paddingLeft = jsonDict["paddingLeft"] || jsonDict["padding-left"];
                var paddingLeft = this.convertStrToValue(value_paddingLeft);
                this.paddingLeft.f_value = paddingLeft.value;
                this.paddingLeft.unit = paddingLeft.type;
                if (this.paddingLeft.unit == 3) {
                    this.paddingLeft.pixels = paddingLeft.value;
                }
                this.paddingLeft.is_set = true;
            }
            if (jsonDict["paddingRight"] || jsonDict["padding-right"]) {
                var value_paddingRight = jsonDict["paddingRight"] || jsonDict["padding-right"];
                var paddingRight = this.convertStrToValue(value_paddingRight);
                this.paddingRight.f_value = paddingRight.value;
                this.paddingRight.unit = paddingRight.type;
                if (this.paddingRight.unit == 3) {
                    this.paddingRight.pixels = paddingRight.value;
                }
                this.paddingRight.is_set = true;
            }
            if (jsonDict["paddingBottom"] || jsonDict["padding-bottom"]) {
                var value_paddingBottom = jsonDict["paddingBottom"] || jsonDict["padding-bottom"];
                var paddingBottom = this.convertStrToValue(value_paddingBottom);
                this.paddingBottom.f_value = paddingBottom.value;
                this.paddingBottom.unit = paddingBottom.type;
                if (this.paddingBottom.unit == 3) {
                    this.paddingBottom.pixels = paddingBottom.value;
                }
                this.paddingBottom.is_set = true;
            }
            if (jsonDict["paddingTop"] || jsonDict["padding-top"]) {
                var value_paddingTop = jsonDict["paddingTop"] || jsonDict["padding-top"];
                var paddingTop = this.convertStrToValue(value_paddingTop);
                this.paddingTop.f_value = paddingTop.value;
                this.paddingTop.unit = paddingTop.type;
                if (this.paddingTop.unit == 3) {
                    this.paddingTop.pixels = paddingTop.value;
                }
                this.paddingTop.is_set = true;
            }
            if (jsonDict["shadowColor"] || jsonDict["shadow-color"]) {
                var value_shadowColor = jsonDict["shadowColor"] || jsonDict["shadow-color"];
                this.shadowColor.s_value = value_shadowColor;
                this.shadowColor.is_set = true;
            }
            if (jsonDict["shadowOffsetX"] || jsonDict["shadow-offset-x"]) {
                var value_shadowOffsetX = jsonDict["shadowOffsetX"] || jsonDict["shadow-offset-x"];
                var shadowOffsetX = this.convertStrToValue(value_shadowOffsetX);
                this.shadowOffsetX.f_value = shadowOffsetX.value;
                this.shadowOffsetX.unit = shadowOffsetX.type;
                if (this.shadowOffsetX.unit == 3) {
                    this.shadowOffsetX.pixels = shadowOffsetX.value;
                }
                this.shadowOffsetX.is_set = true;
            }
            if (jsonDict["shadowOffsetY"] || jsonDict["shadow-offset-y"]) {
                var value_shadowOffsetY = jsonDict["shadowOffsetY"] || jsonDict["shadow-offset-y"];
                var shadowOffsetY = this.convertStrToValue(value_shadowOffsetY);
                this.shadowOffsetY.f_value = shadowOffsetY.value;
                this.shadowOffsetY.unit = shadowOffsetY.type;
                if (this.shadowOffsetY.unit == 3) {
                    this.shadowOffsetY.pixels = shadowOffsetY.value;
                }
                this.shadowOffsetY.is_set = true;
            }
            if (jsonDict["shadowOpacity"] || jsonDict["shadow-opacity"]) {
                var value_shadowOpacity = jsonDict["shadowOpacity"] || jsonDict["shadow-opacity"];
                var shadowOpacity = this.convertStrToValue(value_shadowOpacity);
                this.shadowOpacity.f_value = shadowOpacity.value;
                this.shadowOpacity.unit = shadowOpacity.type;
                if (this.shadowOpacity.unit == 3) {
                    this.shadowOpacity.pixels = shadowOpacity.value;
                }
                this.shadowOpacity.is_set = true;
            }
            if (jsonDict["shadowRadius"] || jsonDict["shadow-radius"]) {
                var value_shadowRadius = jsonDict["shadowRadius"] || jsonDict["shadow-radius"];
                var shadowRadius = this.convertStrToValue(value_shadowRadius);
                this.shadowRadius.f_value = shadowRadius.value;
                this.shadowRadius.unit = shadowRadius.type;
                if (this.shadowRadius.unit == 3) {
                    this.shadowRadius.pixels = shadowRadius.value;
                }
                this.shadowRadius.is_set = true;
            }
        }
        catch (e) { }
    }
    inherit(chNode, parentNode) {
        if (!parentNode)
            return;
        if (!chNode.fontFamily.is_set && parentNode.fontFamily.is_set) {
            chNode.fontFamily = parentNode.fontFamily;
        }
        if (!chNode.fontSize.is_set && parentNode.fontSize.is_set) {
            chNode.fontSize = parentNode.fontSize;
        }
        if (!chNode.color.is_set && parentNode.color.is_set) {
            chNode.color = parentNode.color;
        }
        if (!chNode.align.is_set && parentNode.align.is_set) {
            chNode.align = parentNode.align;
        }
    }
    readXMLDoc(node, parentNode) {
        var uiObj;
        if (node.nodeType === 1) {
            var name = node.nodeName;
            // TODO: implement object references later
            /*
            if(name=="o") {
              var attr = node.attributes[0];
              if(attr) {
                var idx = parseInt(attr.nodeValue);
                return objectList[idx];
              }
            }
            */
            var attrObj = {};
            var id_value;
            for (var a = 0; a < node.attributes.length; a++) {
                var attr = node.attributes[a];
                if (attr.nodeName == "style") {
                    var s = attr.nodeValue;
                    var parts = s.split(";");
                    for (var ii = 0; ii < parts.length; ii++) {
                        var p = parts[ii];
                        var p2 = p.split(":");
                        if (p2[0] && p2[1]) {
                            attrObj[p2[0]] = p2[1];
                        }
                    }
                }
                attrObj[attr.nodeName] = attr.nodeValue;
                if (attr.nodeName == "id") {
                    id_value = attr.nodeValue;
                }
            }
            var compData = this.findComponent(name);
            var content;
            let b_component = false;
            if (compData) {
                uiObj = new EVG(compData);
                content = uiObj.findContent() || uiObj;
                uiObj.readParams(attrObj);
                b_component = true;
            }
            else {
                uiObj = parentNode ? new EVG(attrObj) : this;
                if (uiObj == this)
                    this.readParams(attrObj);
                content = uiObj;
            }
            if (uiObj && id_value) {
                if (this._context)
                    this._context.set_object(id_value, uiObj);
            }
            // TODO: tag handlers
            // "<object id=\""+this._instanceId+"\"/>";
            /*
            if(this.tagHandlers && this.tagHandlers[name]) {
                
            }
            */
            if (b_component) {
            }
            else {
                uiObj.tagName = name;
            }
            // Aliases...
            var r = UIRenderers[name];
            if (r) {
                uiObj.renderer = new r(uiObj);
            }
            if (name == "Hover") {
                parentNode.metaTags[name] = uiObj; // <-- can be accessed by the renderers
            }
            this.inherit(content, parentNode);
            for (var i = 0; i < node.childNodes.length; i++) {
                var childNode = node.childNodes[i];
                var childUI = this.readXMLDoc(childNode, uiObj);
                if (Array.isArray(childUI)) {
                    for (let ch of childUI) {
                        this.inherit(ch, content);
                        content.add(ch);
                    }
                }
                else {
                    if (childUI)
                        content.add(childUI);
                }
            }
            return uiObj;
        }
        // --- adding the text nodes
        /*
        const create_text = (str) => {
          // return str.split(" ").map( _ => `<View width="${_.length*10}" height="10" background-color="blue" margin="0"/>`).join('')
          return str.split(" ").map( _ => `<t text="${_} "/>`).join('')
        }
        */
        if (node.nodeType === 3 || node.nodeType === 4) {
            const str = node.nodeValue;
            const lines = str.split(' ').filter(_ => _.trim().length).map(_ => {
                const n = new EVG('');
                n.tagName = 'Label';
                n.text.is_set = true;
                n.text.s_value = _ + ' ';
                return n;
            });
            return lines;
            /*
            var str = node.nodeValue;
            console.log('text',str)
            if(str && str.trim() && parentNode) parentNode.readParams({'text': str});
            */
        }
    }
    parseXML(xmlStr) {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(xmlStr, "text/xml");
        return this.readXMLDoc(xmlDoc.childNodes[0], null);
    }
    adjustLayoutParams(node, renderer) {
        const special = renderer.hasCustomSize(node);
        if (typeof (special) !== 'undefined') {
            this.width.pixels = special.width;
            this.height.pixels = special.height;
        }
        else {
            if (this.width.is_set) {
                switch (this.width.unit) {
                    case 1:
                        this.width.pixels = node.innerWidth.pixels * this.width.f_value / 100;
                        break;
                    case 2:
                        this.width.pixels = node.fontSize.pixels * this.width.f_value;
                        break;
                    case 3:
                        this.width.pixels = this.width.f_value;
                        break;
                    case 4:
                        this.width.pixels = node.innerHeight.pixels * this.width.f_value / 100;
                        break;
                    // fix: for width fill
                    case 5:
                        this.width.pixels = 0;
                        break;
                    default: break;
                }
            }
            else {
                this.width.pixels = node.innerWidth.pixels;
            }
            if (this.height.is_set) {
                switch (this.height.unit) {
                    case 1:
                        this.height.pixels = node.innerWidth.pixels * this.height.f_value / 100;
                        break;
                    case 2:
                        this.height.pixels = node.fontSize.pixels * this.height.f_value;
                        break;
                    case 3:
                        this.height.pixels = this.height.f_value;
                        break;
                    case 4:
                        this.height.pixels = node.innerHeight.pixels * this.height.f_value / 100;
                        break;
                    // fix: for height fill
                    case 5:
                        this.height.pixels = node.innerHeight.pixels * this.width.f_value / 100;
                        break;
                    default: break;
                }
            }
            else {
                this.height.pixels = node.innerHeight.pixels;
            }
        }
        if (this.left.is_set) {
            switch (this.left.unit) {
                case 1:
                    this.left.pixels = node.innerWidth.pixels * this.left.f_value / 100;
                    break;
                case 2:
                    this.left.pixels = node.fontSize.pixels * this.left.f_value;
                    break;
                case 3:
                    this.left.pixels = this.left.f_value;
                    break;
                case 4:
                    this.left.pixels = node.innerHeight.pixels * this.left.f_value / 100;
                    break;
                default: break;
            }
        }
        // fix: right
        if (this.right.is_set) {
            switch (this.right.unit) {
                case 1:
                    this.right.pixels = node.innerWidth.pixels * this.right.f_value / 100;
                    break;
                case 2:
                    this.right.pixels = node.fontSize.pixels * this.right.f_value;
                    break;
                case 3:
                    this.right.pixels = this.right.f_value;
                    break;
                case 4:
                    this.right.pixels = node.innerHeight.pixels * this.right.f_value / 100;
                    break;
                default: break;
            }
        }
        if (this.top.is_set) {
            switch (this.top.unit) {
                case 1:
                    this.top.pixels = node.innerWidth.pixels * this.top.f_value / 100;
                    break;
                case 2:
                    this.top.pixels = node.fontSize.pixels * this.top.f_value;
                    break;
                case 3:
                    this.top.pixels = this.top.f_value;
                    break;
                case 4:
                    this.top.pixels = node.innerHeight.pixels * this.top.f_value / 100;
                    break;
                default: break;
            }
        }
        // fix bottom...
        if (this.bottom.is_set) {
            switch (this.bottom.unit) {
                case 1:
                    this.bottom.pixels = node.innerWidth.pixels * this.bottom.f_value / 100;
                    break;
                case 2:
                    this.bottom.pixels = node.fontSize.pixels * this.bottom.f_value;
                    break;
                case 3:
                    this.bottom.pixels = this.bottom.f_value;
                    break;
                case 4:
                    this.bottom.pixels = node.innerHeight.pixels * this.bottom.f_value / 100;
                    break;
                default: break;
            }
        }
        if (this.borderWidth.is_set) {
            switch (this.borderWidth.unit) {
                case 1:
                    this.borderWidth.pixels = node.innerWidth.pixels * this.borderWidth.f_value / 100;
                    break;
                case 2:
                    this.borderWidth.pixels = node.fontSize.pixels * this.borderWidth.f_value;
                    break;
                case 3:
                    this.borderWidth.pixels = this.borderWidth.f_value;
                    break;
                case 4:
                    this.borderWidth.pixels = node.innerHeight.pixels * this.borderWidth.f_value / 100;
                    break;
                default: break;
            }
        }
        if (this.margin.is_set) {
            switch (this.margin.unit) {
                case 1:
                    this.margin.pixels = node.innerWidth.pixels * this.margin.f_value / 100;
                    break;
                case 2:
                    this.margin.pixels = node.fontSize.pixels * this.margin.f_value;
                    break;
                case 3:
                    this.margin.pixels = this.margin.f_value;
                    break;
                case 4:
                    this.margin.pixels = node.innerHeight.pixels * this.margin.f_value / 100;
                    break;
                default: break;
            }
            if (!this.marginLeft.is_set) {
                this.marginLeft.pixels = this.margin.pixels;
            }
            else {
                switch (this.marginLeft.unit) {
                    case 1:
                        this.marginLeft.pixels = node.innerWidth.pixels * this.marginLeft.f_value / 100;
                        break;
                    case 2:
                        this.marginLeft.pixels = node.fontSize.pixels * this.marginLeft.f_value;
                        break;
                    case 3:
                        this.marginLeft.pixels = this.marginLeft.f_value;
                        break;
                    case 4:
                        this.marginLeft.pixels = node.innerHeight.pixels * this.marginLeft.f_value / 100;
                        break;
                    default: break;
                }
            }
            if (!this.marginRight.is_set) {
                this.marginRight.pixels = this.margin.pixels;
            }
            else {
                switch (this.marginRight.unit) {
                    case 1:
                        this.marginRight.pixels = node.innerWidth.pixels * this.marginRight.f_value / 100;
                        break;
                    case 2:
                        this.marginRight.pixels = node.fontSize.pixels * this.marginRight.f_value;
                        break;
                    case 3:
                        this.marginRight.pixels = this.marginRight.f_value;
                        break;
                    case 4:
                        this.marginRight.pixels = node.innerHeight.pixels * this.marginRight.f_value / 100;
                        break;
                    default: break;
                }
            }
            if (!this.marginTop.is_set) {
                this.marginTop.pixels = this.margin.pixels;
            }
            else {
                switch (this.marginTop.unit) {
                    case 1:
                        this.marginTop.pixels = node.innerWidth.pixels * this.marginTop.f_value / 100;
                        break;
                    case 2:
                        this.marginTop.pixels = node.fontSize.pixels * this.marginTop.f_value;
                        break;
                    case 3:
                        this.marginTop.pixels = this.marginTop.f_value;
                        break;
                    case 4:
                        this.marginTop.pixels = node.innerHeight.pixels * this.marginTop.f_value / 100;
                        break;
                    default: break;
                }
            }
            if (!this.marginBottom.is_set) {
                this.marginBottom.pixels = this.margin.pixels;
            }
            else {
                switch (this.marginBottom.unit) {
                    case 1:
                        this.marginBottom.pixels = node.innerWidth.pixels * this.marginBottom.f_value / 100;
                        break;
                    case 2:
                        this.marginBottom.pixels = node.fontSize.pixels * this.marginBottom.f_value;
                        break;
                    case 3:
                        this.marginBottom.pixels = this.marginBottom.f_value;
                        break;
                    case 4:
                        this.marginBottom.pixels = node.innerHeight.pixels * this.marginBottom.f_value / 100;
                        break;
                    default: break;
                }
            }
        }
        if (this.padding.is_set) {
            switch (this.padding.unit) {
                case 1:
                    this.padding.pixels = node.innerWidth.pixels * this.padding.f_value / 100;
                    break;
                case 2:
                    this.padding.pixels = node.fontSize.pixels * this.padding.f_value;
                    break;
                case 3:
                    this.padding.pixels = this.padding.f_value;
                    break;
                case 4:
                    this.padding.pixels = node.innerHeight.pixels * this.padding.f_value / 100;
                    break;
                default: break;
            }
            if (!this.paddingLeft.is_set) {
                this.paddingLeft.pixels = this.padding.pixels;
            }
            else {
                switch (this.paddingLeft.unit) {
                    case 1:
                        this.paddingLeft.pixels = node.innerWidth.pixels * this.paddingLeft.f_value / 100;
                        break;
                    case 2:
                        this.paddingLeft.pixels = node.fontSize.pixels * this.paddingLeft.f_value;
                        break;
                    case 3:
                        this.paddingLeft.pixels = this.paddingLeft.f_value;
                        break;
                    case 4:
                        this.paddingLeft.pixels = node.innerHeight.pixels * this.paddingLeft.f_value / 100;
                        break;
                    default: break;
                }
            }
            if (!this.paddingRight.is_set) {
                this.paddingRight.pixels = this.padding.pixels;
            }
            else {
                switch (this.paddingRight.unit) {
                    case 1:
                        this.paddingRight.pixels = node.innerWidth.pixels * this.paddingRight.f_value / 100;
                        break;
                    case 2:
                        this.paddingRight.pixels = node.fontSize.pixels * this.paddingRight.f_value;
                        break;
                    case 3:
                        this.paddingRight.pixels = this.paddingRight.f_value;
                        break;
                    case 4:
                        this.paddingRight.pixels = node.innerHeight.pixels * this.paddingRight.f_value / 100;
                        break;
                    default: break;
                }
            }
            if (!this.paddingTop.is_set) {
                this.paddingTop.pixels = this.padding.pixels;
            }
            else {
                switch (this.paddingTop.unit) {
                    case 1:
                        this.paddingTop.pixels = node.innerWidth.pixels * this.paddingTop.f_value / 100;
                        break;
                    case 2:
                        this.paddingTop.pixels = node.fontSize.pixels * this.paddingTop.f_value;
                        break;
                    case 3:
                        this.paddingTop.pixels = this.paddingTop.f_value;
                        break;
                    case 4:
                        this.paddingTop.pixels = node.innerHeight.pixels * this.paddingTop.f_value / 100;
                        break;
                    default: break;
                }
            }
            if (!this.paddingBottom.is_set) {
                this.paddingBottom.pixels = this.padding.pixels;
            }
            else {
                switch (this.paddingBottom.unit) {
                    case 1:
                        this.paddingBottom.pixels = node.innerWidth.pixels * this.paddingBottom.f_value / 100;
                        break;
                    case 2:
                        this.paddingBottom.pixels = node.fontSize.pixels * this.paddingBottom.f_value;
                        break;
                    case 3:
                        this.paddingBottom.pixels = this.paddingBottom.f_value;
                        break;
                    case 4:
                        this.paddingBottom.pixels = node.innerHeight.pixels * this.paddingBottom.f_value / 100;
                        break;
                    default: break;
                }
            }
        }
        this.width.pixels = this.width.pixels - (this.marginLeft.pixels + this.marginRight.pixels);
        this.height.pixels = this.height.pixels - (this.marginTop.pixels + this.marginBottom.pixels);
        this.innerWidth.pixels = this.width.pixels - (this.paddingRight.pixels + this.paddingLeft.pixels + this.borderWidth.pixels * 2);
        this.innerHeight.pixels = this.height.pixels - (this.paddingTop.pixels + this.paddingBottom.pixels + this.borderWidth.pixels * 2);
        //    this.width.pixels = this.width.pixels - (this.marginLeft.pixels + this.marginRight.pixels);
        //     this.height.pixels = this.height.pixels - (this.marginTop.pixels + this.marginBottom.pixels);
        // fix: fontsize
        if (this.fontSize.is_set) {
            switch (this.fontSize.unit) {
                case 1:
                    this.fontSize.pixels = this.width.pixels * this.fontSize.f_value / 100;
                    break;
                case 2:
                    this.fontSize.pixels = this.fontSize.f_value;
                    break;
                case 3:
                    this.fontSize.pixels = this.fontSize.f_value;
                    break;
                case 4:
                    this.fontSize.pixels = this.height.pixels * this.fontSize.f_value / 100;
                    break;
                default: break;
            }
        }
        if (this.borderRadius.is_set) {
            switch (this.borderRadius.unit) {
                case 1:
                    this.borderRadius.pixels = this.width.pixels * this.borderRadius.f_value / 100;
                    break;
                case 2:
                    this.borderRadius.pixels = this.fontSize.pixels * this.borderRadius.f_value;
                    break;
                case 3:
                    this.borderRadius.pixels = this.borderRadius.f_value;
                    break;
                case 4:
                    this.borderRadius.pixels = this.height.pixels * this.borderRadius.f_value / 100;
                    break;
                default: break;
            }
        }
    }
    calculate(width, height, renderer) {
        const container = new EVG({});
        container.innerWidth.pixels = width;
        container.innerHeight.pixels = height;
        this.calculateLayout(container, new UIRenderPosition(0, 0, renderer));
    }
    calculateLayout(parentNode, render_pos) {
        var newPOS = new UIRenderPosition(render_pos.x, render_pos.y, render_pos.renderer);
        var render_start_y = render_pos.y;
        var render_start_x = render_pos.x;
        var node = this;
        this.adjustLayoutParams(parentNode, render_pos.renderer);
        var elem_h = this.default_layout(node, render_pos);
        node.calculated.render_height = elem_h;
        node.calculated.render_width = node.inline.is_set && node.inline.b_value && node.calculated.width_override ? node.calculated.width_override : node.width.pixels;
        node.calculated.height = elem_h + node.marginTop.pixels + node.marginBottom.pixels;
        node.calculated.width = node.calculated.render_width + node.marginLeft.pixels + node.marginRight.pixels;
        // not using absoute coords for now...
        if (node.left.is_set) {
            node.calculated.x = node.marginLeft.pixels + node.left.pixels;
            node.calculated.absolute = true;
        }
        else {
            node.calculated.x = render_pos.x + node.marginLeft.pixels;
        }
        if (node.top.is_set) {
            node.calculated.y = node.marginTop.pixels + node.top.pixels;
            node.calculated.absolute = true;
        }
        else {
            // FIX: bottom...
            if (node.bottom.is_set) {
                node.calculated.y = node.marginTop.pixels + (parentNode.innerHeight.pixels - node.bottom.pixels - node.calculated.height);
                node.calculated.absolute = true;
            }
            else {
                node.calculated.y = render_pos.y + node.marginTop.pixels;
            }
        }
        if (!node.left.is_set && !node.top.is_set) {
            newPOS.x += node.calculated.width;
            newPOS.y = render_start_y + elem_h + node.marginTop.pixels + node.marginBottom.pixels;
        }
        return newPOS;
    }
    default_layout(node, render_pos) {
        if (node.lineBreak.b_value) {
            node.calculated.lineBreak = true;
        }
        var elem_h = node.paddingTop.pixels + node.paddingBottom.pixels;
        if (node.height.is_set) {
            elem_h += node.innerHeight.pixels;
        }
        var child_render_pos = new UIRenderPosition(node.paddingLeft.pixels, node.paddingTop.pixels, render_pos.renderer);
        var child_heights = 0.0;
        var line_height = 0.0;
        var row_width = 0.0;
        var col_height = 0.0;
        var current_y = child_render_pos.y;
        var current_x = child_render_pos.x;
        var current_row = [];
        if (node.direction.is_set && (node.direction.s_value == "bottom-to-top")) {
            for (var ii = 0; ii < node.items.length; ii++) {
                var childNode = node.items[ii];
                child_render_pos.y = current_y;
                child_render_pos.x = current_x;
                child_render_pos = childNode.calculateLayout(node, child_render_pos);
                if (childNode.calculated.absolute) {
                    continue;
                }
                ;
                childNode.calculated.y = current_y + (node.innerHeight.pixels - col_height - childNode.calculated.height);
                col_height += childNode.calculated.height;
                if (childNode.calculated.lineBreak || (col_height > node.innerHeight.pixels && (col_height - node.innerHeight.pixels > 0.5))) {
                    child_heights += line_height;
                    current_x += row_width;
                    line_height = 0;
                    col_height = 0;
                    row_width = 0;
                    child_render_pos.x = current_x;
                    child_render_pos.y = node.paddingTop.pixels;
                    child_render_pos = childNode.calculateLayout(node, child_render_pos);
                    childNode.calculated.y = current_y + (node.innerHeight.pixels - col_height - childNode.calculated.height);
                    current_row = [];
                    current_row.push(childNode);
                    line_height = childNode.calculated.height;
                    row_width = childNode.calculated.width;
                }
                else {
                    if (childNode.calculated.width > row_width) {
                        row_width = childNode.calculated.width;
                    }
                    current_row.push(childNode);
                }
            }
            ;
            if (node.align.is_set && node.align.s_value == "right" || node.align.s_value == "center") {
                if (current_row.length > 0) {
                    for (var i2 = 0; i2 < current_row.length; i2++) {
                        var row_item = current_row[i2];
                        var deltaX = row_width - (row_item.calculated.width);
                        if (node.align.s_value == "center") {
                            deltaX = deltaX / 2;
                        } // vertical align center
                        row_item.calculated.x += deltaX;
                    }
                    ;
                }
            }
            ;
        }
        else {
            for (var ii = 0; ii < node.items.length; ii++) {
                var childNode = node.items[ii];
                child_render_pos.y = current_y;
                child_render_pos = childNode.calculateLayout(node, child_render_pos);
                if (childNode.calculated.absolute) {
                    continue;
                }
                row_width += childNode.calculated.width;
                if (childNode.calculated.lineBreak || (row_width > node.innerWidth.pixels && (row_width - node.innerWidth.pixels > 0.5))) {
                    if (node.align.is_set && (node.align.s_value == "right" || node.align.s_value == "center")) {
                        // align right
                        let lastItem = current_row[current_row.length - 1];
                        var deltaX = node.paddingLeft.pixels + node.innerWidth.pixels + 0.5 * lastItem.marginLeft.pixels - lastItem.calculated.x - lastItem.calculated.width;
                        if (node.align.is_set && (node.align.s_value == "center")) {
                            deltaX = deltaX / 2;
                        } // align center
                        for (var i2 = 0; i2 < current_row.length; i2++) {
                            var row_item = current_row[i2];
                            row_item.calculated.x += deltaX;
                        }
                    }
                    if (node.verticalAlign.is_set && (node.verticalAlign.s_value == "bottom" || node.verticalAlign.s_value == "center")) {
                        if (current_row.length > 0) {
                            for (var i2 = 0; i2 < current_row.length; i2++) {
                                var row_item = current_row[i2];
                                var deltaY = line_height - (row_item.calculated.height);
                                if (node.verticalAlign.s_value == "center") {
                                    deltaY = deltaY / 2;
                                } // vertical align center
                                row_item.calculated.y += deltaY;
                            }
                            ;
                        }
                    }
                    // FIX: height="fill"
                    for (var i2 = 0; i2 < current_row.length; i2++) {
                        var row_item = current_row[i2];
                        if (row_item.height.unit == 5) {
                            row_item.calculated.render_height = line_height;
                        }
                    }
                    ;
                    child_heights += line_height;
                    current_y += line_height;
                    line_height = 0;
                    row_width = 0;
                    child_render_pos.x = node.paddingLeft.pixels;
                    child_render_pos.y = current_y;
                    child_render_pos = childNode.calculateLayout(node, child_render_pos);
                    current_row = [];
                    current_row.push(childNode);
                    line_height = childNode.calculated.height;
                    row_width = childNode.calculated.width;
                }
                else {
                    // FIX: do not add unit type 5
                    if (childNode.calculated.height > line_height && (childNode.height.unit != 5)) {
                        line_height = childNode.calculated.height;
                    }
                    current_row.push(childNode);
                    if (!node.calculated.width_override || (node.calculated.width_override < row_width)) {
                        node.calculated.width_override = row_width + node.paddingLeft.pixels + node.paddingRight.pixels;
                    }
                }
            }
            ;
            if (node.align.is_set && (node.align.s_value == "right" || node.align.s_value == "center")) {
                // align right
                if (current_row.length > 0) {
                    let lastItem = current_row[current_row.length - 1];
                    var deltaX = node.paddingLeft.pixels + node.innerWidth.pixels + lastItem.marginLeft.pixels - lastItem.calculated.x - lastItem.calculated.width;
                    if (node.align.is_set && (node.align.s_value == "center")) {
                        deltaX = deltaX / 2;
                    } // align center
                    for (var i2 = 0; i2 < current_row.length; i2++) {
                        var row_item = current_row[i2];
                        row_item.calculated.x += deltaX;
                    }
                    ;
                }
            }
            if (node.verticalAlign.is_set && (node.verticalAlign.s_value == "bottom" || node.verticalAlign.s_value == "center")) {
                if (current_row.length > 0) {
                    for (var i2 = 0; i2 < current_row.length; i2++) {
                        var row_item = current_row[i2];
                        var deltaY = line_height - (row_item.calculated.height);
                        if (node.verticalAlign.s_value == "center") {
                            deltaY = deltaY / 2;
                        } // vertical align center
                        row_item.calculated.y += deltaY;
                    }
                    ;
                }
            }
            // FIX: height="fill"
            for (var i2 = 0; i2 < current_row.length; i2++) {
                var row_item = current_row[i2];
                if (row_item.height.unit == 5) {
                    row_item.calculated.render_height = line_height;
                }
            }
            ;
        }
        if (line_height > 0) {
            child_heights = child_heights + line_height;
        }
        if (!node.height.is_set) {
            elem_h += child_heights;
            const special = render_pos.renderer.hasCustomSize(node);
            if (typeof (special) !== 'undefined') {
                elem_h += special.height;
                node.calculated.width_override = special.width;
                node.calculated.width = special.width;
                node.calculated.render_width = special.width;
                node.calculated.render_height = special.height;
                node.width.pixels = special.width;
            }
            /*
            if(node.renderer && node.renderer.customSize) {
              var size = node.renderer.customSize( node.innerWidth.pixels )
              if(size) {
                elem_h += size.height;
                // fix : ??? overried width
                node.calculated.width_override = size.width;
              }
            }
            */
        }
        return elem_h;
    }
}
exports.EVG = EVG;
//# sourceMappingURL=index.js.map