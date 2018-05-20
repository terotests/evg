"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const _1 = require("../src/layout/");
const pdfkit_1 = require("../src/renderers/pdfkit");
const expect = require("chai").expect;
describe("render testting", function () {
    _1.register_font('candal', 'fonts/Candal/Candal.ttf');
    _1.register_font('cinzel', 'fonts/Cinzel/Cinzel-Regular.ttf');
    _1.register_font('monoton', 'fonts/Monoton/Monoton-Regular.ttf');
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
    _1.register_component('iphone', phone);
    _1.register_component('text', `<Label background-color="blue" />`);
    _1.register_component('t', `<Label background-color="#222222" />`);
    _1.register_component('note', `
  <path background-color="black" width="30" height="20"
  d="M16.899,3.05c-0.085-0.068-0.192-0.095-0.299-0.074L7.947,4.779c-0.17,0.034-0.291,0.182-0.291,0.353v7.364c-0.494-0.536-1.199-0.873-1.983-0.873c-1.491,0-2.704,1.213-2.704,2.704s1.213,2.704,2.704,2.704c1.491,0,2.705-1.213,2.705-2.704V7.952l7.933-1.659v4.399c-0.494-0.535-1.199-0.873-1.983-0.873c-1.491,0-2.704,1.213-2.704,2.704c0,1.492,1.213,2.705,2.704,2.705c1.49,0,2.704-1.213,2.704-2.705V3.33C17.031,3.221,16.982,3.119,16.899,3.05 M5.673,16.311c-1.094,0-1.983-0.889-1.983-1.983s0.889-1.983,1.983-1.983c1.095,0,1.983,0.889,1.983,1.983S6.768,16.311,5.673,16.311 M14.327,14.508c-1.095,0-1.983-0.889-1.983-1.984c0-1.094,0.889-1.982,1.983-1.982c1.094,0,1.983,0.889,1.983,1.982C16.311,13.619,15.421,14.508,14.327,14.508 M16.311,5.558L8.377,7.217V5.428l7.933-1.659V5.558z"
></path>     
  `);
    it('baseline', () => {
        let page_cnt = 1;
        const header = () => new _1.EVG(`
  <View width="100%" background-color="white" padding-bottom="10">
    <View padding-left="15" padding="10">
      <img src="images/wiki.jpeg" width="30" height="30"/>
      <View width="20"/>
      <t text="Page ${page_cnt++}, printed ${(new Date()).toLocaleString()}" font-size="9"/>
    </View>
    <View width="100%" background-color="#888888" height="1"/>
  </View>    
    `);
        const footer = () => new _1.EVG(`
  <View width="100%" background-color="white" padding="10">
    <View width="100%" background-color="#888888" height="1" padding-bottom="5"/>
    <View align="center">
      <t text="(c) Copyright all rights reserved " font-size="9" background-color="gray"/>
      <t text="ACME" font-size="9" background-color="red"/>
      <t text=" Corporation" font-size="9" background-color="gray"/>
    </View>
    <View align="center"><t text="May the force be with you" font-size="7" background-color="gray"/></View>
  </View>  
    `);
        const create_text = (str) => {
            // return str.split(" ").map( _ => `<View width="${_.length*10}" height="10" background-color="blue" margin="0"/>`).join('')
            return str.split(" ").map(_ => `<t text="${_} "/>`).join('');
        };
        const smallnote = `<note width="10" height="10"/><View width="10"/>`;
        const create_para = () => `
    <View align="center">${smallnote}${smallnote}${smallnote}</View>
    <View width="100%" margin="20">${create_text(`At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat      
    `)}</View>    
    `;
        const evg = new _1.EVG(`
<View>
  <View padding="10">
    <div rotate="-2"><t font-family="candal" text="Hello World!" font-size="40"/></div>
    <div><t font-family="cintzen" text="Hello World!" font-size="30"/></div>
    <div rotate="2"><t font-family="monoton" text="Hello World!" font-size="20"/></div>
  </View>
  <View>
    <View width="20%">
      <img src="images/w.jpg" width="100%" height="100%"/>
      <QRCode text="https://koodiklinikka.fi/" width="100" height="100" />
    </View>
    <View width="80%" margin="20">
      ${create_text(`
      At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus. Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis 
      `)}
    </View>
  </View>
  <div padding="10" align="center">
    <t font-family="monoton" text="lets move forward..." font-size="20"/>
  </div>

  ${create_para()}
  ${create_para()}
  ${create_para()}
  ${create_para()}  
  ${create_para()}
  ${create_para()}
  ${create_para()}
  ${create_para()}
</View>
    `);
        const renderer = new pdfkit_1.Renderer(600, 800);
        evg.calculate(600, 800, renderer);
        renderer.render('./out/baseline.pdf', evg, [header, footer]);
    });
    it('iphone test', () => {
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

  <View width="100%">
     <note width="30" height="30"/> 
     <note width="40" height="40"/>
     <note width="45" height="45"/>
     <note width="50" height="50"/>
     <note width="55" height="55"/>
  </View>

  <View width="200" margin="10">
    <text text="Hello World "></text>
    <text text="This is a test "></text>  
    <text text="one "></text>  
    <text text="word "></text> 
    <text text="at "></text> 
    <text text="time "></text>  
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
    <t text="Hello World " font-size="30"></t>
    <t text="This is a test "></t>  
    <t text="one "></t>  
    <t text="word "></t> 
    <t text="at "></t> 
    <t text="time "></t>  
  </View>   

  <iphone >
    <View>
      <text text="Component test..."/>
    </View>
    <View padding="20" width="30%">
      <iphone scale="0.2" ><Label text="Component test..."/></iphone>
    </View>

    <View padding="20" width="30%">
      <iphone scale="0.2" ><t text="Component test..."/>
          
      </iphone>
    </View>
  </iphone>


  <View left="150" top="50" scale="0.3" rotate="-10">
    <iphone>
      <View width="100%" padding="20">
          <t text="Nuotti"/>
          <note width="30" height="30"/> 
          <t text="Nuotti"/>
          <note width="40" height="40"/>
          <note width="45" height="45" rotate="-20"/>
          <note width="50" height="50"/>
          <note width="55" height="55"/>
      </View>   
    </iphone> 
  </View>  

  <View left="150" top="50" scale="0.3" rotate="10" opacity="0.5">
    <iphone>
      <View width="100%" padding="20">
          <t text="Nuotti"/>
          <note width="30" height="30"/> 
          <t text="Nuotti"/>
          <note width="40" height="40"/>
          <note width="45" height="45" rotate="-20"/>
          <note width="50" height="50"/>
          <note width="55" height="55"/>
      </View>   
    </iphone> 
  </View> 

  <View left="300" top="100" scale="0.5" rotate="-2">
    <iphone>
    <View width="100%" padding="20">
        <note width="30" height="30"/> 
        <note width="40" height="40"/>
        <note width="45" height="45"/>
        <note width="50" height="50"/>
        <note width="55" height="55"/>
    </View>   
    <View>
      <img src="images/wiki.jpeg" width="200" height="200"/>
      <img src="images/redom.jpg" width="100%" height="200"/>
    </View>
  </iphone> 
  </View>

</View>
    `);
        const renderer = new pdfkit_1.Renderer(600, 800);
        evg.calculate(600, 800, renderer);
        renderer.render('./out/test1.pdf', evg);
    });
    it('absolute position test', () => {
        const evg = new _1.EVG(`
<View>

  <View width="100%" height="40" background-color="yellow">
    <View width="20" height="20" left="0" top="10" background-color="blue"/>
    <View width="20" height="20" left="40" top="10" background-color="blue"/>
    <View width="20" height="20" left="80" top="10" background-color="blue"/>  
  </View>

  <View width="100%" height="40" background-color="#ffdd33">
    <View width="20" height="20" left="0" top="10" background-color="blue"/>
    <View width="20" height="20" left="40" top="10" background-color="blue"/>
    <View width="20" height="20" left="80" top="30" background-color="red" border-radius="50%"/>  
  </View>

  <View width="100%" height="40" background-color="#ffdd33">
    <View width="20" height="20" left="0" top="10" background-color="blue"/>
    <View width="20" height="20" left="40" top="10" background-color="blue"/>
    <View width="20" height="20" left="80" top="30" background-color="green" border-radius="50%"/>  
  </View>

  <View left="200" top="200" background-color="blue" width="200" height="200">
    <View width="100%" height="40" background-color="#112233">
      <View width="11" height="11" left="0" top="10" background-color="red"/>
      <View width="22" height="22" left="40" top="10" background-color="yellow"/>
      <View width="33" height="33" left="80" top="30" background-color="brown" border-radius="50%"/>  
    </View>  
  </View>
  
</View>
    `);
        const renderer = new pdfkit_1.Renderer(600, 800);
        evg.calculate(600, 800, renderer);
        renderer.render('./out/test2.pdf', evg);
    });
});
//# sourceMappingURL=test_evg.js.map