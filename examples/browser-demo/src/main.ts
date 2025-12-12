/**
 * EVG Browser Demo - Main Entry Point
 *
 * Demonstrates EVG rendering in the browser using Canvas.
 */

import { EVG } from "evg/layout";
import { CanvasRenderer } from "evg/renderers/CanvasRenderer";

// Example EVG XML documents
const EXAMPLES: Record<string, string> = {
  basic: `<View width="400" height="300" background-color="#f0f4f8" padding="20">
  <View width="100%" height="60" background-color="#3b82f6" border-radius="8">
    <Label text="Hello EVG!" color="white" font-size="24" />
  </View>
  <View width="100%" height="80" margin-top="20" background-color="#10b981" border-radius="8">
    <Label text="Canvas Rendering" color="white" font-size="18" />
  </View>
  <View width="100%" height="60" margin-top="20" background-color="#f59e0b" border-radius="8">
    <Label text="In the Browser!" color="white" font-size="16" />
  </View>
</View>`,

  nested: `<View width="400" height="350" background-color="#1e293b" padding="20">
  <View width="100%" height="100" background-color="#334155" border-radius="12" padding="15">
    <View width="60" height="60" background-color="#3b82f6" border-radius="30" />
    <View width="200" height="60" margin-left="15">
      <Label text="John Doe" color="white" font-size="18" />
      <Label text="Software Engineer" color="#94a3b8" font-size="14" />
    </View>
  </View>
  <View width="100%" height="80" margin-top="15" direction="row">
    <View width="48%" height="100%" background-color="#ef4444" border-radius="8" />
    <View width="48%" height="100%" margin-left="4%" background-color="#22c55e" border-radius="8" />
  </View>
  <View width="100%" height="80" margin-top="15" background-color="#8b5cf6" border-radius="8" />
</View>`,

  text: `<View width="400" height="300" background-color="white" padding="30">
  <Label text="Large Title" font-size="32" color="#1e293b" />
  <Label text="Medium Heading" font-size="24" color="#334155" margin-top="15" />
  <Label text="Regular paragraph text that demonstrates how text is rendered in EVG using the Canvas API." font-size="14" color="#64748b" margin-top="15" />
  <View width="100%" height="2" background-color="#e2e8f0" margin-top="20" />
  <Label text="Small caption text" font-size="12" color="#94a3b8" margin-top="15" />
  <View width="200" height="40" margin-top="20" background-color="#3b82f6" border-radius="6">
    <Label text="Click Me" color="white" font-size="14" />
  </View>
</View>`,

  colors: `<View width="400" height="350" background-color="#0f172a" padding="20">
  <View width="100%" height="50" background-color="#ef4444" border-radius="8" margin-bottom="10">
    <Label text="Red" color="white" font-size="16" />
  </View>
  <View width="100%" height="50" background-color="#f97316" border-radius="8" margin-bottom="10">
    <Label text="Orange" color="white" font-size="16" />
  </View>
  <View width="100%" height="50" background-color="#eab308" border-radius="8" margin-bottom="10">
    <Label text="Yellow" color="#1e293b" font-size="16" />
  </View>
  <View width="100%" height="50" background-color="#22c55e" border-radius="8" margin-bottom="10">
    <Label text="Green" color="white" font-size="16" />
  </View>
  <View width="100%" height="50" background-color="#3b82f6" border-radius="8" margin-bottom="10">
    <Label text="Blue" color="white" font-size="16" />
  </View>
  <View width="100%" height="50" background-color="#8b5cf6" border-radius="8">
    <Label text="Purple" color="white" font-size="16" />
  </View>
</View>`,

  complex: `<View width="450" height="400" background-color="#f8fafc" padding="0">
  <View width="100%" height="60" background-color="#1e293b" padding="15">
    <Label text="Dashboard" color="white" font-size="20" />
  </View>
  <View width="100%" padding="20">
    <View width="100%" height="100" direction="row">
      <View width="30%" height="100%" background-color="#dbeafe" border-radius="12" padding="15">
        <Label text="Users" color="#1e40af" font-size="12" />
        <Label text="1,234" color="#1e293b" font-size="28" margin-top="10" />
      </View>
      <View width="30%" height="100%" margin-left="5%" background-color="#dcfce7" border-radius="12" padding="15">
        <Label text="Revenue" color="#166534" font-size="12" />
        <Label text="$45K" color="#1e293b" font-size="28" margin-top="10" />
      </View>
      <View width="30%" height="100%" margin-left="5%" background-color="#fef3c7" border-radius="12" padding="15">
        <Label text="Orders" color="#92400e" font-size="12" />
        <Label text="892" color="#1e293b" font-size="28" margin-top="10" />
      </View>
    </View>
    <View width="100%" height="180" margin-top="20" background-color="white" border-radius="12" border-width="1" border-color="#e2e8f0" padding="15">
      <Label text="Recent Activity" color="#1e293b" font-size="16" />
      <View width="100%" height="1" background-color="#e2e8f0" margin-top="10" margin-bottom="10" />
      <Label text="• New user signed up" color="#64748b" font-size="13" />
      <Label text="• Order #1234 completed" color="#64748b" font-size="13" margin-top="8" />
      <Label text="• Payment received $299" color="#64748b" font-size="13" margin-top="8" />
      <Label text="• New comment on post" color="#64748b" font-size="13" margin-top="8" />
    </View>
  </View>
</View>`,

  tablet: `<View width="808" height="1200" background-color="#f0f0f0" padding="0">
    <View width="808" 
          inline="true"
          background-color="#333333" padding="20" border-radius="20"
        >
        <View width="100%" align="center" padding="0">
            <View 
                background-color="#ffffff" width="50" height="30"
                border-radius="5"
                margin-bottom="20"
            />
        </View> 
        <View width="768" height="1024" id="screen" background-color="#ffffff">
            <View id="scroll" left="0" top="0">
                <View padding="20">
                    <div>
                       <Label text="Tablet Screen" font-size="32" color="#333" />
                    </div>
                    <Label text="This is a tablet mockup rendered with EVG" font-size="16" color="#666" margin-top="10" />
                    <View width="100%" height="200" margin-top="20" background-color="#e0e0e0" border-radius="8" padding="15">
                        <Label text="Content Area" font-size="14" color="#888" />
                    </View>
                </View>
            </View>            
        </View>      
        
        <View width="100%" align="center" padding="16">
            <View 
                background-color="#ffffff" width="50" height="50"
                border-radius="25"
            />
        </View>        
    </View>
</View>`,
};

// DOM Elements
const xmlEditor = document.getElementById("xml-editor") as HTMLTextAreaElement;
const previewCanvas = document.getElementById(
  "preview-canvas"
) as HTMLCanvasElement;
const examplesSelect = document.getElementById("examples") as HTMLSelectElement;
const btnRender = document.getElementById("btn-render") as HTMLButtonElement;
const btnDownload = document.getElementById(
  "btn-download"
) as HTMLButtonElement;
const errorMessage = document.getElementById("error-message") as HTMLDivElement;
const infoSize = document.getElementById("info-size") as HTMLSpanElement;
const infoTime = document.getElementById("info-time") as HTMLSpanElement;
const infoElements = document.getElementById(
  "info-elements"
) as HTMLSpanElement;

// Create renderer
let renderer: CanvasRenderer;

/**
 * Initialize the demo
 */
function init() {
  renderer = new CanvasRenderer(previewCanvas);

  // Load initial example
  loadExample("basic");

  // Set up event listeners
  examplesSelect.addEventListener("change", () => {
    loadExample(examplesSelect.value);
  });

  btnRender.addEventListener("click", () => {
    render();
  });

  btnDownload.addEventListener("click", () => {
    downloadPNG();
  });

  // Auto-render on input (debounced)
  let renderTimeout: number;
  xmlEditor.addEventListener("input", () => {
    clearTimeout(renderTimeout);
    renderTimeout = window.setTimeout(() => {
      render();
    }, 500);
  });

  // Initial render
  render();
}

/**
 * Load an example EVG document
 */
function loadExample(name: string) {
  const xml = EXAMPLES[name];
  if (xml) {
    xmlEditor.value = xml;
    render();
  }
}

/**
 * Count elements in EVG tree
 */
function countElements(evg: EVG): number {
  let count = 1;
  if (evg.items) {
    for (const item of evg.items) {
      count += countElements(item);
    }
  }
  return count;
}

/**
 * Render EVG tree to canvas
 */
function renderEVGItem(
  evg: EVG,
  renderer: CanvasRenderer,
  parentX: number = 0,
  parentY: number = 0
) {
  const calc = evg.calculated;

  // The calculated x/y are relative positions, we need to add parent offset
  const x = parentX + calc.x;
  const y = parentY + calc.y;
  const width = calc.render_width || evg.width.pixels;
  const height = calc.render_height || evg.height.pixels;

  // Draw background
  if (evg.backgroundColor?.is_set) {
    const options = {
      fillColor: evg.backgroundColor.s_value,
      opacity: evg.opacity?.is_set ? evg.opacity.f_value : 1,
    };

    if (evg.borderRadius?.is_set && evg.borderRadius.pixels > 0) {
      renderer.drawRoundedRect(
        x,
        y,
        width,
        height,
        evg.borderRadius.pixels,
        options
      );
    } else {
      renderer.drawRect(x, y, width, height, options);
    }
  }

  // Draw border
  if (
    evg.borderWidth?.is_set &&
    evg.borderWidth.pixels > 0 &&
    evg.borderColor?.is_set
  ) {
    const borderOptions = {
      strokeColor: evg.borderColor.s_value,
      strokeWidth: evg.borderWidth.pixels,
    };

    if (evg.borderRadius?.is_set && evg.borderRadius.pixels > 0) {
      renderer.drawRoundedRect(
        x,
        y,
        width,
        height,
        evg.borderRadius.pixels,
        borderOptions
      );
    } else {
      renderer.drawRect(x, y, width, height, borderOptions);
    }
  }

  // Draw text for Label elements
  if (evg.tagName === "Label" && evg.text?.is_set) {
    const textOptions = {
      fontSize: evg.fontSize?.is_set ? evg.fontSize.f_value : 14,
      fontFamily: evg.fontFamily?.is_set
        ? evg.fontFamily.s_value
        : "sans-serif",
      color: evg.color?.is_set ? evg.color.s_value : "#000000",
      opacity: evg.opacity?.is_set ? evg.opacity.f_value : 1,
    };
    renderer.drawText(evg.text.s_value, x, y, textOptions);
  }

  // Render children
  if (evg.items) {
    for (const child of evg.items) {
      renderEVGItem(child, renderer, x, y);
    }
  }
}

/**
 * Render the current XML to canvas
 */
function render() {
  const xml = xmlEditor.value.trim();
  if (!xml) {
    showError("Please enter some EVG XML");
    return;
  }

  hideError();

  try {
    const startTime = performance.now();

    // Parse XML
    const evg = new EVG(xml);

    // Extract dimensions from root element
    const width = evg.width.pixels || 400;
    const height = evg.height.pixels || 300;

    // Begin document
    renderer.beginDocument(width, height);

    // Calculate layout
    evg.calculate(width, height, renderer);

    // Clear and render
    renderer.clear();

    // Draw white background
    renderer.drawRect(0, 0, width, height, { fillColor: "#ffffff" });

    // Render EVG tree
    renderEVGItem(evg, renderer);

    const endTime = performance.now();

    // Update info
    infoSize.textContent = `${width} × ${height}`;
    infoTime.textContent = `${(endTime - startTime).toFixed(2)}ms`;
    infoElements.textContent = String(countElements(evg));
  } catch (err) {
    console.error("Render error:", err);
    showError(
      `Render error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Download canvas as PNG
 */
function downloadPNG() {
  const dataUrl = renderer.toDataURL("image/png");
  const link = document.createElement("a");
  link.download = "evg-render.png";
  link.href = dataUrl;
  link.click();
}

/**
 * Show error message
 */
function showError(message: string) {
  errorMessage.textContent = message;
  errorMessage.classList.add("show");
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.classList.remove("show");
}

// Start the demo
init();
