import { EVG } from '../layout/';
import PDFDocument from 'pdfkit';
export declare class Renderer {
    width: number;
    height: number;
    doc: PDFDocument;
    opacity_now: number;
    constructor(width: number, height: number);
    hasCustomSize(item: EVG): any;
    render(filename: string, item: EVG, headers?: any[]): Promise<any>;
    setColors(ui: EVG, ctx: any): void;
    renderItem(item: EVG, ctx: any, headers?: any[]): Promise<void>;
}
