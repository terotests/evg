/**
 * EVG Renderers Module
 *
 * Exports all available renderers
 */

// Export the new IRenderer-compliant PDF renderer
export { PDFRenderer } from "./PDFRenderer";

// Export the legacy renderer for backward compatibility
export { Renderer as LegacyPDFRenderer } from "./pdfkit";
