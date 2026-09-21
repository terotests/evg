
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
}

export const EVG_STORM_VERSION: "3.0.0";
export const EVG_EDITION: "Storm";

export interface StormNode {
    tag: string;
    id?: string;
    key?: string;
    text?: string;
    role?: string;
    label?: string;
    hidden?: boolean;
    checked?: number;
    props?: Record<string, string>;
    children?: StormNode[];
}

export interface StormDocument {
    evg: 1;
    css?: string;
    root: StormNode;
}

export function isStormDocument(value: unknown): value is StormDocument;
export function parseStorm(input: string, css?: string): StormDocument;
export function stormToXml(doc: StormDocument): string;
export function parseStormJson(input: string | StormDocument): StormDocument;
export function stormToJson(doc: StormDocument, pretty?: boolean): string;
export function fromLegacyEVG(node: EVG, css?: string): StormDocument;
export function toLegacyEVG(doc: StormDocument): EVG;

export const Storm: {
    parse(input: string, css?: string): StormDocument;
    parseJson(input: string | StormDocument): StormDocument;
    toJson(doc: StormDocument, pretty?: boolean): string;
    toXml(doc: StormDocument): string;
    fromLegacyEVG(node: EVG, css?: string): StormDocument;
    toLegacyEVG(doc: StormDocument): EVG;
    renderToFile(fileName: string, width: number, height: number, doc: StormDocument | string): Promise<void>;
};
