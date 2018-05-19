

import 'mocha';
import {EVG, UIRenderPosition} from '../src/layout/'
import {Renderer} from '../src/renderers/pdfkit'

const expect    = require("chai").expect;

describe("Color Code Converter", function() {
  it('does something', () => {
    // your test
    expect(3).to.equal(3)
    const evg = new EVG(`
<View>
  <View>
      <View width="30%" height="100" backgroundColor="#ff7733" margin="20" border-radius="20"></View>
      <View backgroundColor="blue" width="40%"  height="200" margin="20">></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
      <View width="10%" height="10%" backgroundColor="#23f" margin="20" border-radius="50%"></View>
  </View>  
  <View align="right">
      <View width="30%" height="100" backgroundColor="#ff7733" margin="20" border-radius="20"></View>
      <View backgroundColor="blue" width="40%"  height="200" margin="20">></View>
  </View>   
</View>
    `)
    /*
    expect(evg.items.length).to.equal(2)
    expect(evg.items[0].tagName).to.equal('View')
    expect(evg.items[1].tagName).to.equal('View')
    expect(evg.items[1].backgroundColor.s_value).to.equal('blue')
    */
    evg.calculate(600,800)
/*
    console.log(evg.calculated)
    console.log(evg.items[0].calculated)
    console.log(evg.items[1].calculated)
*/
    const renderer = new Renderer()
    renderer.render('./out/test1.pdf', evg, 600, 800)

  });  
});
