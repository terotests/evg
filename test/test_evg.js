"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const _1 = require("../src/layout/");
const pdfkit_1 = require("../src/renderers/pdfkit");
const expect = require("chai").expect;
describe("Color Code Converter", function () {
    it('does something', () => {
        // your test
        expect(3).to.equal(3);
        const evg = new _1.EVG(`
<View>
  <View width="50%">
      <View width="30%" height="100" backgroundColor="#ff7733" margin="20" border-radius="20"></View>
      <View backgroundColor="blue" width="40%"  height="200" margin="20">></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <Label text="OK"></Label> 
  </View>  

  <View width="50%">
    <View width="30%" height="100" backgroundColor="#ff7733" margin="20" border-radius="20"></View>
    <View backgroundColor="blue" width="40%"  height="200" margin="20">></View>
    <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
    <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
    <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
    <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
    <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
    <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
    <Label text="OK"></Label> 
  </View> 

  <View align="right">
      <View width="30%" height="100" backgroundColor="#ff7733" margin="20" border-radius="20"></View>
      <View backgroundColor="blue" width="40%"  height="200" margin="20">></View>
  </View>   

  <View width="200" margin="10">
    <Label text="Hello World "></Label>
    <Label text="This is a test"></Label>  
    <Label text="one "></Label>  
    <Label text="word "></Label> 
    <Label text="at "></Label> 
    <Label text="time "></Label>  
  </View>

  <View width="200" backgroundColor="#ff7733">
    <Label text="Hello World "></Label>
    <Label text="This is a test "></Label>  
    <Label text="one "></Label>  
    <Label text="word "></Label> 
    <Label text="at "></Label> 
    <Label text="time "></Label>  
  </View>  

  <View width="100%" backgroundColor="#ffeeee" padding="20">
    <Label text="Hello World " font-size="30"></Label>
    <Label text="This is a test "></Label>  
    <Label text="one "></Label>  
    <Label text="word "></Label> 
    <Label text="at "></Label> 
    <Label text="time "></Label>  
  </View>   
</View>
    `);
        /*
        expect(evg.items.length).to.equal(2)
        expect(evg.items[0].tagName).to.equal('View')
        expect(evg.items[1].tagName).to.equal('View')
        expect(evg.items[1].backgroundColor.s_value).to.equal('blue')
        */
        const renderer = new pdfkit_1.Renderer(600, 800);
        evg.calculate(600, 800, renderer);
        /*
            console.log(evg.calculated)
            console.log(evg.items[0].calculated)
            console.log(evg.items[1].calculated)
        */
        renderer.render('./out/test1.pdf', evg);
    });
});
//# sourceMappingURL=test_evg.js.map