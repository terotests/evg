
// Type definitions for EVG module
import { Renderer } from "./bin/evg";

export class UIRenderPosition {
    x: number;
    y: number;
    renderer: any;
    constructor(x: number, y: number, renderer: any);
}

export class UICalculated {
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

export function register_font(name: string, fontFile: string): void;
export function register_component(name: string, component: string): void;
export function register_renderer(name: string, component: any): void;

export class EVG {
    static installShippedFonts(): void;
    static installFont(name: string, fileName: string): void;
    static installComponent(name: string, componentData: string): void;
    static async renderToStream(inputStream: any, width: number, height: number, item: EVG, header?: (item: EVG) => EVG, footer?: (item: EVG) => EVG): Promise<void>;
    static async renderToFile(fileName: string, width: number, height: number, item: EVG, header?: (item: EVG) => EVG, footer?: (item: EVG) => EVG): Promise<void>;
    findComponent(name: string): string;
    findFont(name: string): string;
    add(childView: any): EVG | undefined;
    calculate(width: number, height: number, renderer?: any): EVG;
    static fromXML(xmlData: string): EVG;
    // ... other methods and properties
}
