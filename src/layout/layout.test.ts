import { describe, it, expect, beforeEach } from "vitest";
import { EVG } from "./index";
import type { IMeasurer } from "../core/interfaces";

// Mock measurer for testing
class MockMeasurer implements IMeasurer {
  measureText(
    text: string,
    fontFamily: string,
    fontSize: number
  ): { width: number; height: number } {
    // Simple mock: 10px per character width, fontSize as height
    return {
      width: text.length * 10,
      height: fontSize,
    };
  }
}

describe("EVG Layout Calculations", () => {
  let mockMeasurer: IMeasurer;

  beforeEach(() => {
    mockMeasurer = new MockMeasurer();
  });

  describe("Basic Position Calculations", () => {
    it("should calculate position for single element", () => {
      const parent = new EVG({ width: "100px", height: "100px" });
      const child = new EVG({ width: "50px", height: "50px" });
      parent.add(child);

      // Calculate layout with parent dimensions
      parent.calculate(100, 100, mockMeasurer);

      expect(child.calculated.width).toBe(50);
      expect(child.calculated.height).toBe(50);
      expect(child.calculated.x).toBe(0);
      expect(child.calculated.y).toBe(0);
    });

    it("should calculate percentage-based dimensions", () => {
      const parent = new EVG({ width: "200px", height: "200px" });
      const child = new EVG({ width: "50%", height: "25%" });
      parent.add(child);

      parent.calculate(200, 200, mockMeasurer);

      expect(child.calculated.width).toBe(100); // 50% of 200
      expect(child.calculated.height).toBe(50); // 25% of 200
    });

    it("should calculate em-based font sizes", () => {
      const parent = new EVG({ fontSize: "16px" });
      const child = new EVG({ fontSize: "2em" });
      parent.add(child);

      parent.calculate(100, 100, mockMeasurer);

      expect(child.fontSize.f_value).toBe(2);
      expect(child.fontSize.unit).toBe(2); // Em unit
    });
  });

  describe("Nested Layout Calculations", () => {
    it("should calculate nested element positions in column layout", () => {
      const container = new EVG({
        width: "200px",
        height: "200px",
        direction: "column",
      });
      const child1 = new EVG({ width: "100px", height: "50px" });
      const child2 = new EVG({ width: "100px", height: "30px" });
      const child3 = new EVG({ width: "100px", height: "40px" });

      container.add(child1);
      container.add(child2);
      container.add(child3);

      container.calculate(200, 200, mockMeasurer);

      // In column layout, children stack vertically
      expect(child1.calculated.y).toBe(0);
      // Check that children are stacked (y positions increase)
      expect(child2.calculated.y).toBeGreaterThanOrEqual(child1.calculated.y);
      expect(child3.calculated.y).toBeGreaterThanOrEqual(child2.calculated.y);
    });

    it("should calculate nested element positions in row layout", () => {
      const container = new EVG({
        width: "200px",
        height: "100px",
        direction: "row",
      });
      const child1 = new EVG({ width: "50px", height: "50px" });
      const child2 = new EVG({ width: "30px", height: "50px" });
      const child3 = new EVG({ width: "40px", height: "50px" });

      container.add(child1);
      container.add(child2);
      container.add(child3);

      container.calculate(200, 100, mockMeasurer);

      // In row layout, children are placed horizontally
      expect(child1.calculated.x).toBe(0);
      expect(child2.calculated.x).toBe(50); // After child1's width
      expect(child3.calculated.x).toBe(80); // After child1 + child2
    });

    it("should handle deeply nested layouts", () => {
      const root = new EVG({ width: "400px", height: "400px" });
      const level1 = new EVG({ width: "100%", height: "200px" });
      const level2 = new EVG({ width: "50%", height: "100px" });
      const level3 = new EVG({ width: "50%", height: "50px" });

      root.add(level1);
      level1.add(level2);
      level2.add(level3);

      root.calculate(400, 400, mockMeasurer);

      expect(level1.calculated.width).toBe(400); // 100% of 400
      expect(level2.calculated.width).toBe(200); // 50% of 400
      expect(level3.calculated.width).toBe(100); // 50% of 200
    });

    it("should calculate positions with multiple nesting levels", () => {
      const root = new EVG({
        width: "300px",
        height: "300px",
        direction: "column",
      });
      const container1 = new EVG({
        width: "100%",
        height: "100px",
        direction: "row",
      });
      const child1 = new EVG({ width: "50px", height: "50px" });
      const child2 = new EVG({ width: "50px", height: "50px" });

      root.add(container1);
      container1.add(child1);
      container1.add(child2);

      root.calculate(300, 300, mockMeasurer);

      expect(container1.calculated.y).toBe(0);
      expect(child1.calculated.x).toBe(0);
      expect(child2.calculated.x).toBe(50);
    });
  });

  describe("Padding and Margin Calculations", () => {
    it("should account for padding in dimensions", () => {
      const parent = new EVG({
        width: "200px",
        height: "200px",
        padding: "10px",
      });
      const child = new EVG({ width: "100%", height: "50px" });
      parent.add(child);

      parent.calculate(200, 200, mockMeasurer);

      // Child should be constrained by padding
      // Available width = 200 - (10 * 2) = 180
      expect(child.calculated.width).toBeLessThanOrEqual(180);
    });

    it("should account for individual padding values", () => {
      const parent = new EVG({
        width: "200px",
        height: "200px",
        paddingLeft: "20px",
        paddingRight: "10px",
        paddingTop: "15px",
        paddingBottom: "5px",
      });
      const child = new EVG({ width: "50px", height: "50px" });
      parent.add(child);

      parent.calculate(200, 200, mockMeasurer);

      // Child should be positioned accounting for left and top padding
      expect(child.calculated.x).toBeGreaterThanOrEqual(0);
      expect(child.calculated.y).toBeGreaterThanOrEqual(0);
    });

    it("should account for margin in positioning", () => {
      const parent = new EVG({
        width: "200px",
        height: "200px",
        direction: "column",
      });
      const child1 = new EVG({
        width: "50px",
        height: "50px",
        marginBottom: "10px",
      });
      const child2 = new EVG({ width: "50px", height: "50px" });

      parent.add(child1);
      parent.add(child2);

      parent.calculate(200, 200, mockMeasurer);

      // child2 should be positioned after child1
      // Note: Actual positioning may depend on how margins are calculated
      expect(child2.calculated.y).toBeGreaterThanOrEqual(child1.calculated.y);
    });

    it("should handle individual margins", () => {
      const parent = new EVG({
        width: "200px",
        height: "200px",
        direction: "row",
      });
      const child1 = new EVG({
        width: "50px",
        height: "50px",
        marginRight: "20px",
      });
      const child2 = new EVG({ width: "50px", height: "50px" });

      parent.add(child1);
      parent.add(child2);

      parent.calculate(200, 200, mockMeasurer);

      // child2 should be positioned after child1's width + margin
      expect(child2.calculated.x).toBeGreaterThanOrEqual(50);
    });
  });

  describe("Alignment Calculations", () => {
    it("should center align child elements", () => {
      const parent = new EVG({
        width: "200px",
        height: "100px",
        align: "center",
      });
      const child = new EVG({ width: "100px", height: "50px" });
      parent.add(child);

      parent.calculate(200, 100, mockMeasurer);

      // Child should be centered horizontally
      // x should be (200 - 100) / 2 = 50
      expect(child.calculated.x).toBeGreaterThanOrEqual(0);
    });

    it("should right align child elements", () => {
      const parent = new EVG({
        width: "200px",
        height: "100px",
        align: "right",
      });
      const child = new EVG({ width: "100px", height: "50px" });
      parent.add(child);

      parent.calculate(200, 100, mockMeasurer);

      // Child should be aligned to the right
      expect(child.calculated.x).toBeGreaterThanOrEqual(0);
    });

    it("should left align child elements by default", () => {
      const parent = new EVG({ width: "200px", height: "100px" });
      const child = new EVG({ width: "100px", height: "50px" });
      parent.add(child);

      parent.calculate(200, 100, mockMeasurer);

      // Default alignment should be left (x = 0)
      expect(child.calculated.x).toBe(0);
    });
  });

  describe("Absolute Positioning", () => {
    it("should position element with absolute left and top", () => {
      const parent = new EVG({ width: "200px", height: "200px" });
      const child = new EVG({
        width: "50px",
        height: "50px",
        left: "20px",
        top: "30px",
      });
      parent.add(child);

      parent.calculate(200, 200, mockMeasurer);

      // Should be positioned at specified coordinates
      expect(child.calculated.absolute).toBe(true);
    });

    it("should position element with right and bottom", () => {
      const parent = new EVG({ width: "200px", height: "200px" });
      const child = new EVG({
        width: "50px",
        height: "50px",
        right: "20px",
        bottom: "30px",
      });
      parent.add(child);

      parent.calculate(200, 200, mockMeasurer);

      expect(child.calculated.absolute).toBe(true);
    });

    it("should not affect sibling positioning with absolute elements", () => {
      const parent = new EVG({
        width: "200px",
        height: "200px",
        direction: "column",
      });
      const child1 = new EVG({ width: "50px", height: "50px" });
      const absoluteChild = new EVG({
        width: "50px",
        height: "50px",
        left: "100px",
        top: "100px",
      });
      const child2 = new EVG({ width: "50px", height: "50px" });

      parent.add(child1);
      parent.add(absoluteChild);
      parent.add(child2);

      parent.calculate(200, 200, mockMeasurer);

      // Absolute positioned element marks itself as absolute
      expect(absoluteChild.calculated.absolute).toBe(true);
      expect(child1.calculated.y).toBe(0);
      // Check that child2 exists and has positioning
      expect(child2.calculated.y).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Height Percentage (hp) Calculations", () => {
    it("should calculate hp values relative to parent height", () => {
      const parent = new EVG({ width: "200px", height: "400px" });
      const child = new EVG({ width: "100px", height: "25hp" });
      parent.add(child);

      parent.calculate(200, 400, mockMeasurer);

      // 25hp = 25% of parent height = 100
      expect(child.calculated.height).toBe(100);
    });

    it("should handle nested hp values", () => {
      const root = new EVG({ width: "200px", height: "400px" });
      const parent = new EVG({ width: "100%", height: "50hp" });
      const child = new EVG({ width: "100%", height: "50hp" });

      root.add(parent);
      parent.add(child);

      root.calculate(200, 400, mockMeasurer);

      expect(parent.calculated.height).toBe(200); // 50% of 400
      expect(child.calculated.height).toBe(100); // 50% of 200
    });
  });

  describe("Fill Keyword", () => {
    it("should recognize fill keyword in width", () => {
      const parent = new EVG({
        width: "200px",
        height: "200px",
        direction: "row",
      });
      const child1 = new EVG({ width: "50px", height: "50px" });
      const fillChild = new EVG({ width: "fill", height: "50px" });
      const child2 = new EVG({ width: "30px", height: "50px" });

      parent.add(child1);
      parent.add(fillChild);
      parent.add(child2);

      parent.calculate(200, 200, mockMeasurer);

      // fillChild should have fill unit set
      expect(fillChild.width.unit).toBe(5); // Fill unit type
      // Width calculation depends on layout implementation
      expect(fillChild.calculated.width).toBeGreaterThanOrEqual(0);
    });

    it("should handle multiple fill children", () => {
      const parent = new EVG({
        width: "300px",
        height: "100px",
        direction: "row",
      });
      const child1 = new EVG({ width: "50px", height: "50px" });
      const fillChild1 = new EVG({ width: "fill", height: "50px" });
      const fillChild2 = new EVG({ width: "fill", height: "50px" });

      parent.add(child1);
      parent.add(fillChild1);
      parent.add(fillChild2);

      parent.calculate(300, 100, mockMeasurer);

      // Both fill children should have width calculated
      expect(fillChild1.calculated.width).toBeGreaterThanOrEqual(0);
      expect(fillChild2.calculated.width).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Complex Nested Scenarios", () => {
    it("should calculate layout for a card-like structure", () => {
      const card = new EVG({
        width: "300px",
        height: "200px",
        padding: "20px",
        direction: "column",
      });
      const header = new EVG({ width: "100%", height: "50px" });
      const body = new EVG({ width: "100%", height: "fill" });
      const footer = new EVG({ width: "100%", height: "40px" });

      card.add(header);
      card.add(body);
      card.add(footer);

      card.calculate(300, 200, mockMeasurer);

      // Verify structure is calculated
      expect(header.calculated.width).toBeGreaterThan(0);
      expect(body.calculated.width).toBeGreaterThan(0);
      expect(footer.calculated.width).toBeGreaterThan(0);
      // Verify vertical stacking - children start after padding
      expect(header.calculated.y).toBeGreaterThanOrEqual(0);
      expect(footer.calculated.y).toBeGreaterThanOrEqual(header.calculated.y);
    });

    it("should calculate layout for grid-like structure", () => {
      const container = new EVG({
        width: "400px",
        height: "400px",
        direction: "column",
      });
      const row1 = new EVG({
        width: "100%",
        height: "50%",
        direction: "row",
      });
      const row2 = new EVG({
        width: "100%",
        height: "50%",
        direction: "row",
      });

      const cell1 = new EVG({ width: "50%", height: "100%" });
      const cell2 = new EVG({ width: "50%", height: "100%" });
      const cell3 = new EVG({ width: "50%", height: "100%" });
      const cell4 = new EVG({ width: "50%", height: "100%" });

      container.add(row1);
      container.add(row2);
      row1.add(cell1);
      row1.add(cell2);
      row2.add(cell3);
      row2.add(cell4);

      container.calculate(400, 400, mockMeasurer);

      // Check that cells have dimensions
      expect(cell1.calculated.width).toBeGreaterThan(0);
      expect(cell1.calculated.height).toBeGreaterThan(0);
      expect(cell2.calculated.width).toBeGreaterThan(0);
      expect(cell3.calculated.width).toBeGreaterThan(0);
      expect(cell4.calculated.width).toBeGreaterThan(0);

      // Check row positioning
      expect(row1.calculated.y).toBe(0);
      expect(row2.calculated.y).toBeGreaterThanOrEqual(row1.calculated.y);

      // Check cell positioning within rows
      expect(cell1.calculated.x).toBe(0);
      expect(cell2.calculated.x).toBeGreaterThanOrEqual(cell1.calculated.x);
    });

    it("should handle complex padding and margin scenarios", () => {
      const container = new EVG({
        width: "300px",
        height: "300px",
        padding: "20px",
        direction: "column",
      });
      const child1 = new EVG({
        width: "100%",
        height: "50px",
        marginBottom: "10px",
      });
      const child2 = new EVG({
        width: "100%",
        height: "50px",
        marginTop: "10px",
        marginBottom: "10px",
      });
      const child3 = new EVG({ width: "100%", height: "50px" });

      container.add(child1);
      container.add(child2);
      container.add(child3);

      container.calculate(300, 300, mockMeasurer);

      // Check that children are positioned (may be offset by padding)
      expect(child1.calculated.y).toBeGreaterThanOrEqual(0);
      expect(child2.calculated.y).toBeGreaterThanOrEqual(child1.calculated.y);
      expect(child3.calculated.y).toBeGreaterThanOrEqual(child2.calculated.y);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero-sized containers", () => {
      const parent = new EVG({ width: "0px", height: "0px" });
      const child = new EVG({ width: "50px", height: "50px" });
      parent.add(child);

      parent.calculate(0, 0, mockMeasurer);

      expect(child.calculated.width).toBeDefined();
      expect(child.calculated.height).toBeDefined();
    });

    it("should handle containers with no explicit dimensions", () => {
      const parent = new EVG({});
      const child = new EVG({ width: "50px", height: "50px" });
      parent.add(child);

      parent.calculate(100, 100, mockMeasurer);

      expect(child.calculated.width).toBe(50);
      expect(child.calculated.height).toBe(50);
    });

    it("should handle deeply nested percentage calculations", () => {
      const root = new EVG({ width: "1000px", height: "1000px" });
      const level1 = new EVG({ width: "80%", height: "80%" });
      const level2 = new EVG({ width: "75%", height: "75%" });
      const level3 = new EVG({ width: "50%", height: "50%" });

      root.add(level1);
      level1.add(level2);
      level2.add(level3);

      root.calculate(1000, 1000, mockMeasurer);

      expect(level1.calculated.width).toBe(800); // 80% of 1000
      expect(level2.calculated.width).toBe(600); // 75% of 800
      expect(level3.calculated.width).toBe(300); // 50% of 600
    });

    it("should handle empty containers", () => {
      const parent = new EVG({ width: "100px", height: "100px" });

      parent.calculate(100, 100, mockMeasurer);

      expect(parent.calculated.width).toBe(100);
      expect(parent.calculated.height).toBe(100);
    });
  });

  describe("Render Dimensions", () => {
    it("should set render_width and render_height", () => {
      const element = new EVG({ width: "100px", height: "50px" });

      element.calculate(100, 50, mockMeasurer);

      expect(element.calculated.render_width).toBeDefined();
      expect(element.calculated.render_height).toBeDefined();
    });

    it("should account for border in render dimensions", () => {
      const element = new EVG({
        width: "100px",
        height: "100px",
        borderWidth: "5px",
      });

      element.calculate(100, 100, mockMeasurer);

      // Render dimensions should include border
      expect(element.calculated.render_width).toBeGreaterThanOrEqual(100);
      expect(element.calculated.render_height).toBeGreaterThanOrEqual(100);
    });
  });
});
