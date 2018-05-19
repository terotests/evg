"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const _1 = require("../src/layout/");
const expect = require("chai").expect;
describe("Color Code Converter", function () {
    it('does something', () => {
        // your test
        expect(3).to.equal(3);
        const evg = new _1.EVG(`<View>
    <View width="30%" height="100"></View>
    <View background-color="blue" width="40%"  height="200"></View>
</View>    
    `);
        expect(evg.items.length).to.equal(2);
        expect(evg.items[0].tagName).to.equal('View');
        expect(evg.items[1].tagName).to.equal('View');
        expect(evg.items[1].backgroundColor.s_value).to.equal('blue');
        const container = new _1.EVG('<View width="800px" height="600px"></View>');
        container.innerWidth.pixels = 800;
        container.innerHeight.pixels = 600;
        evg.calculateLayout(container, new _1.UIRenderPosition(0, 0));
        console.log(evg.calculated);
        console.log(evg.items[0].calculated);
        console.log(evg.items[1].calculated);
    });
});
//# sourceMappingURL=test_evg.js.map