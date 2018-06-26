import { Renderer } from '../renderers/pdfkit';
export declare class UIRenderPosition {
    x: number;
    y: number;
    renderer: Renderer;
    constructor(x: number, y: number, renderer: Renderer);
}
export declare class UICalculated {
    x: number;
    y: number;
    width: number;
    height: number;
    render_width: number;
    render_height: number;
    width_override: number;
    lineBreak: boolean;
    absolute: boolean;
}
export declare const register_font: (name: string, fontFile: string) => void;
export declare const register_component: (name: string, component: string) => void;
export declare const register_renderer: (name: string, component: any) => void;
export declare class EVG {
    _context?: any;
    items: EVG[];
    calculated: UICalculated;
    viewInstance: any;
    renderer: any;
    parentView: any;
    eventHandlers: {};
    tagName: any;
    isHidden: boolean;
    tapHandler: any;
    metaTags: {};
    header: EVG;
    footer: EVG;
    x: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    y: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    left: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    top: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    bottom: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    right: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    id: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    cname: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    width: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    height: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    inline: {
        unit: number;
        is_set: boolean;
        pixels: number;
        b_value: boolean;
        s_value: string;
    };
    direction: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    align: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    verticalAlign: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    innerWidth: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    innerHeight: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    lineBreak: {
        unit: number;
        is_set: boolean;
        f_value: number;
        s_value: string;
        b_value: boolean;
    };
    pageBreak: {
        unit: number;
        is_set: boolean;
        f_value: number;
        s_value: string;
        b_value: boolean;
    };
    overflow: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    fontSize: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    fontFamily: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    color: {
        unit: number;
        is_set: boolean;
        f_value: number;
        s_value: string;
        color: string;
    };
    backgroundColor: {
        unit: number;
        is_set: boolean;
        f_value: number;
        s_value: string;
        color: string;
    };
    opacity: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    rotate: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    borderWidth: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    borderColor: {
        unit: number;
        is_set: boolean;
        f_value: number;
        s_value: string;
        color: string;
    };
    borderRadius: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    scale: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    svgPath: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    viewBox: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    imageUrl: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    text: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    linearGradient: {
        is_set: boolean;
        colors: any[];
        stops: any[];
        s_value: string;
    };
    vColorSlide: {
        unit: number;
        is_set: boolean;
        f_value: number;
        s_value: string;
        b_value: boolean;
    };
    vColorSlideBreak: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    vColorSlideTop: {
        unit: number;
        is_set: boolean;
        f_value: number;
        s_value: string;
        color: string;
    };
    vColorSlideBottom: {
        unit: number;
        is_set: boolean;
        f_value: number;
        s_value: string;
        color: string;
    };
    margin: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    marginLeft: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    marginRight: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    marginBottom: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    marginTop: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    padding: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    paddingLeft: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    paddingRight: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    paddingBottom: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    paddingTop: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    shadowColor: {
        unit: number;
        is_set: boolean;
        f_value: number;
        s_value: string;
        color: string;
    };
    shadowOffsetX: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    shadowOffsetY: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    shadowOpacity: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    shadowRadius: {
        unit: number;
        is_set: boolean;
        pixels: number;
        f_value: number;
        s_value: string;
    };
    static installFont(name: string, fileName: string): void;
    static installComponent(name: string, componentData: string): void;
    static renderToStream(inputStream: any, width: number, height: number, item: EVG, header?: (item: EVG) => EVG, footer?: (item: EVG) => EVG): Promise<void>;
    static renderToFile(fileName: string, width: number, height: number, item: EVG, header?: (item: EVG) => EVG, footer?: (item: EVG) => EVG): Promise<void>;
    findComponent(name: any): any;
    findFont(name: any): any;
    findContent(list: any): any;
    add(childView: any): this;
    convertStrToValue: (str: any) => {
        value: number;
        type: number;
    };
    readParams(jsonDict: any): void;
    inherit(chNode: EVG, parentNode?: EVG): void;
    readXMLDoc(node: any, parentNode: any): any;
    parseXML(xmlStr: any): any;
    constructor(strJSON: string | any, context?: any);
    adjustLayoutParams(node: EVG, renderer: Renderer): void;
    calculate(width: number, height: number, renderer: Renderer): void;
    calculateLayout(parentNode: EVG, render_pos: UIRenderPosition): UIRenderPosition;
    default_layout(node: EVG, render_pos: UIRenderPosition): number;
}
