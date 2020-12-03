"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const layout_1 = require("../src/layout/");
const pdfkit_1 = require("../src/renderers/pdfkit");
const expect = require("chai").expect;
describe("render testting", function () {
    layout_1.EVG.installFont("candal", "fonts/Candal/Candal.ttf");
    layout_1.EVG.installFont("cinzel", "fonts/Cinzel/Cinzel-Regular.ttf");
    layout_1.EVG.installFont("monoton", "fonts/Monoton/Monoton-Regular.ttf");
    const phone = `
  <View width="395"  background-color="#222222" padding="10" border-radius="20px"
      >        
      <View width="100%" align="center" padding="6px">
          <View
          background-color="#ffffff" width="50px" height="10px"
          border-radius="15px"
          />
      </View>
      <View width="375" height="667" overflow="hidden" id="screen" background-color="#ffffff">
          <View id="content" >
          </View>
      </View>
      
      <View width="100%" align="center" padding="6px">
          <View
          background-color="#ffffff" width="50px" height="50px"
          border-radius="50%"
          />
      </View>
  </View>  
  `;
    layout_1.EVG.installComponent("iphone", phone);
    layout_1.EVG.installComponent("text", `<Label background-color="blue" />`);
    layout_1.EVG.installComponent("t", `<Label background-color="#222222" />`);
    layout_1.EVG.installComponent("note", `
  <path background-color="black" width="30" height="20"
  d="M16.899,3.05c-0.085-0.068-0.192-0.095-0.299-0.074L7.947,4.779c-0.17,0.034-0.291,0.182-0.291,0.353v7.364c-0.494-0.536-1.199-0.873-1.983-0.873c-1.491,0-2.704,1.213-2.704,2.704s1.213,2.704,2.704,2.704c1.491,0,2.705-1.213,2.705-2.704V7.952l7.933-1.659v4.399c-0.494-0.535-1.199-0.873-1.983-0.873c-1.491,0-2.704,1.213-2.704,2.704c0,1.492,1.213,2.705,2.704,2.705c1.49,0,2.704-1.213,2.704-2.705V3.33C17.031,3.221,16.982,3.119,16.899,3.05 M5.673,16.311c-1.094,0-1.983-0.889-1.983-1.983s0.889-1.983,1.983-1.983c1.095,0,1.983,0.889,1.983,1.983S6.768,16.311,5.673,16.311 M14.327,14.508c-1.095,0-1.983-0.889-1.983-1.984c0-1.094,0.889-1.982,1.983-1.982c1.094,0,1.983,0.889,1.983,1.982C16.311,13.619,15.421,14.508,14.327,14.508 M16.311,5.558L8.377,7.217V5.428l7.933-1.659V5.558z"
></path>     
  `);
    it("Running image border test", () => {
        console.log("PATH : ", process.cwd());
        const evg = new layout_1.EVG(`
<View>

  <div page-break="true">
    <div width="100%" height="100%" left="0" top="0" background-color="#3ac6d8">

    </div>

    <div padding="20" margin="20" >      
      <div width="100" height="100" left="0" top="0"  overflow="hidden" border-radius="50%"
        >
        <img src="images/wiki.jpeg" width="100" height="100"/>
      </div>      
      <div width="100" height="100" left="0" top="0"  border-radius="50"
        border-width="3" border-color="white"
        >
      </div>   

      <div width="100" height="100" left="150" top="20"  
        color="white"
        font-size="30"
        >
        Ensimmäinen kirjani
        <div font-size="10" margin-top="10">
          Kirjan koostivat isä ja äiti
        </div>
      </div>     

      <div width="100" height="100" left="0" top="120"  
        border-width="13" border-color="white"
        >
      </div>        

      <div width="100" height="100" left="120" top="120"  
        border-width="1" border-color="white"
        >
      </div>         
      
    </div> 
    
  </div>  
</View>
    `);
        // 600 x 800
        const renderer = new pdfkit_1.Renderer(400, 280);
        evg.calculate(400, 100, renderer);
        renderer.render("./out/test_border.pdf", evg);
    });
});
//# sourceMappingURL=test_border.js.map