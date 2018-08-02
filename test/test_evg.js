"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("mocha");
const _1 = require("../src/layout/");
const pdfkit_1 = require("../src/renderers/pdfkit");
const expect = require("chai").expect;
describe("render testting", function () {
    _1.EVG.installFont('candal', 'fonts/Candal/Candal.ttf');
    _1.EVG.installFont('cinzel', 'fonts/Cinzel/Cinzel-Regular.ttf');
    _1.EVG.installFont('monoton', 'fonts/Monoton/Monoton-Regular.ttf');
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
    _1.EVG.installComponent('iphone', phone);
    _1.EVG.installComponent('text', `<Label background-color="blue" />`);
    _1.EVG.installComponent('t', `<Label background-color="#222222" />`);
    _1.EVG.installComponent('note', `
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
  
    <div top="-450" left="250" font-family="monoton" font-size="70" width="1000" rotate="45" opacity="0.1">DRAFT</div>  
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
        _1.EVG.renderToFile('./out/baseline2.pdf', 600, 800, evg, header, footer);
        _1.EVG.renderToFile('./out/baseline3.pdf', 600, 800, evg);
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

  <View left="150" top="330" scale="0.5">  
    <iphone >
      <View left="1" top="1">
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
      </View>
    </iphone>
  </View>


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



  <View left="200" top="200" background-color="blue" width="200" height="200">
    <View width="100%" height="40" background-color="#112233">
      <View width="11" height="11" left="0" top="10" background-color="red"/>
      <View width="22" height="22" left="40" top="10" background-color="yellow"/>
      <View width="33" height="33" left="80" top="30" background-color="brown" border-radius="50%"/>  
    </View>  
  </View>

  <View width="100%" height="40" background-color="#ffdd33">
    <View width="20" height="20" left="0" top="10" background-color="blue"/>
    <View width="20" height="20" left="40" top="10" background-color="blue"/>
    <View width="20" height="20" left="80" top="30" background-color="green" border-radius="50%"/>  
  </View>  

  <View width="100" height="100" background-color="#22ffee">
    <View width="70" height="70" background-color="#ff3333"></View>
  </View>

  <View width="100" height="100" background-color="#ffeeee" border-radius="20" overflow="hidden">
    <View width="70" height="70" background-color="#ff3333"></View>
  </View>  

  <path width="100" height="100"  overflow="hidden"
  background-color="black"
  d="M10,6.536c-2.263,0-4.099,1.836-4.099,4.098S7.737,14.732,10,14.732s4.099-1.836,4.099-4.098S12.263,6.536,10,6.536M10,13.871c-1.784,0-3.235-1.453-3.235-3.237S8.216,7.399,10,7.399c1.784,0,3.235,1.452,3.235,3.235S11.784,13.871,10,13.871M17.118,5.672l-3.237,0.014L12.52,3.697c-0.082-0.105-0.209-0.168-0.343-0.168H7.824c-0.134,0-0.261,0.062-0.343,0.168L6.12,5.686H2.882c-0.951,0-1.726,0.748-1.726,1.699v7.362c0,0.951,0.774,1.725,1.726,1.725h14.236c0.951,0,1.726-0.773,1.726-1.725V7.195C18.844,6.244,18.069,5.672,17.118,5.672 M17.98,14.746c0,0.477-0.386,0.861-0.862,0.861H2.882c-0.477,0-0.863-0.385-0.863-0.861V7.384c0-0.477,0.386-0.85,0.863-0.85l3.451,0.014c0.134,0,0.261-0.062,0.343-0.168l1.361-1.989h3.926l1.361,1.989c0.082,0.105,0.209,0.168,0.343,0.168l3.451-0.014c0.477,0,0.862,0.184,0.862,0.661V14.746z" 
  ><View width="70" height="70" background-color="#ff3333"></View>
  </path>  

  <View width="100%" height="140" background-color="#ffeeee">
    <t text="This should be layout in stacked fashion and not affected by left,top"/>
    <View left="200" top="200" background-color="red" width="40" height="40">
    </View>
  </View>  
  <View width="100%" height="140" background-color="#ffeeee">
    <t text="This should be layout in stacked fashion and not affected by left,top"/>
    <View left="200" top="200" background-color="red" width="40" height="40">
    </View>
  </View>    
  <View width="100%" height="140" background-color="#ffeeee">
    <t text="This should be layout in stacked fashion and not affected by left,top"/>
    <View left="200" top="200" background-color="red" width="40" height="40">
    </View>
  </View>    
  <View width="100%" height="140" background-color="#ffeeee">
    <t text="This should be layout in stacked fashion and not affected by left,top"/>
    <View left="200" top="100" background-color="red" width="40" height="140">
    </View>
  </View>    
  <View width="100%" height="140" background-color="#ffeeee">
    <t text="This should be layout in stacked fashion and not affected by left,top"/>
    <View left="200" top="100" background-color="red" width="40" height="240">
    </View>
  </View>    
  <View width="100%" height="140" background-color="#ffeeee">
    <t text="This should be layout in stacked fashion and not affected by left,top"/>
    <View left="200" top="100" background-color="red" width="40" height="240">
    </View>
  </View>   

  <div page-break="true">
    <div inline="true" padding="10" background-color="cyan" id="outer">
      <div inline="true" overflow="hidden" border-width="20" border-color="blue"
        id="inner div"
        background-color="white" padding="10">
      aaaaaaaaaa bbb ccc
      </div>
    </div>  
    <div inline="true" padding="1" background-color="cyan" id="outer">
      <div inline="true" overflow="hidden" border-width="1" border-color="blue"
        id="inner div"
        background-color="white" padding="1">
      aaaaaaaaaa bbb ccc
      </div>
    </div>  

    <div inline="true" padding="5" background-color="cyan" id="outer">
      <div inline="true" overflow="hidden" border-width="1" border-color="blue"
        id="inner div"
        background-color="white" padding="10">
      aaaaaaaaaa bbb ccc
      </div>
    </div>     
    
    <div inline="true" padding="5" background-color="cyan" id="outer">
      <div inline="true" overflow="hidden" border-width="1" border-color="blue"
        id="inner div"
        background-color="white" padding="10">
        <div width="20" height="20" background-color="red"/>
        <div width="20" height="20" background-color="blue"/>
        <div width="20" height="20" background-color="red"/>
      </div>
    </div>    
    
    <div width="200" padding="5" background-color="#ffeeaa" id="individual">
      asdf asfdj ölasjdf ölajs döajs följasd ölajsd ajsdölajsd ökladjs ölkjad lökajsf lökajsf asf
    </div>   
    
    <div width="200" padding="0" background-color="#aaeeff" id="individual2">
      asdf asfdj ölasjdf ölajs döajs följasd ölajsd ajsdölajsd ökladjs ölkjad lökajsf lökajsf asf
    </div>  
    
    <div>
      <div width="200" padding="5" background-color="#aaffee" id="individual" >
        <div width="20" height="20" background-color="red"/>
        <div width="20" height="20" background-color="blue"/>
        <div width="20" height="20" background-color="red"/>
      </div>       
    </div>
    
    <div>TODO: Distribute text evenly</div>

    <div width="200" padding="0" background-color="#ffffee" id="individual5" align="fill">
      Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </div>      

    <div width="200" padding="0" background-color="#ffffee" id="individual5" align="fill" font-size="8">
    Lorem ipsum dolor sit amet, consectetur adipisci elit, sed eiusmod tempor incidunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquid ex ea commodi consequat. Quis aute iure reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint obcaecat cupiditat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
    </div>      

    <div  width="100" height="100" >
      <div width="100" height="100"  overflow="hidden"
      border-radius="10"
        >
        <img src="images/child.jpg" width="130" height="130"/>
      </div>       
    </div>


    <path width="100" height="100"  overflow="hidden"
    background-color="black"
    d="M10,6.536c-2.263,0-4.099,1.836-4.099,4.098S7.737,14.732,10,14.732s4.099-1.836,4.099-4.098S12.263,6.536,10,6.536M10,13.871c-1.784,0-3.235-1.453-3.235-3.237S8.216,7.399,10,7.399c1.784,0,3.235,1.452,3.235,3.235S11.784,13.871,10,13.871M17.118,5.672l-3.237,0.014L12.52,3.697c-0.082-0.105-0.209-0.168-0.343-0.168H7.824c-0.134,0-0.261,0.062-0.343,0.168L6.12,5.686H2.882c-0.951,0-1.726,0.748-1.726,1.699v7.362c0,0.951,0.774,1.725,1.726,1.725h14.236c0.951,0,1.726-0.773,1.726-1.725V7.195C18.844,6.244,18.069,5.672,17.118,5.672 M17.98,14.746c0,0.477-0.386,0.861-0.862,0.861H2.882c-0.477,0-0.863-0.385-0.863-0.861V7.384c0-0.477,0.386-0.85,0.863-0.85l3.451,0.014c0.134,0,0.261-0.062,0.343-0.168l1.361-1.989h3.926l1.361,1.989c0.082,0.105,0.209,0.168,0.343,0.168l3.451-0.014c0.477,0,0.862,0.184,0.862,0.661V14.746z" 
    ><View width="70" height="70" background-color="#ff3333"></View>
    </path>     

    <path background-color="black" 
       width="200" heigth="200"      
        d="M 0 200 v -200 h 200 a 100 100 90 0 1 0 200 a 100 100 90 0 1 -200 0 Z"
      />   


  </div>

  <div page-break="true">
    <div width="100%" height="100%" left="0" top="0" background-color="#3ac6d8">

    </div>
    <div height="100" padding="20" >
      <path width="20%" height="100"  overflow="hidden"
      background-color="red"
        d="M 60 0 L 120 0 L 180 60 L 180 120 L 120 180 L 60 180 L 0 120 L 0 60"
        >
        <img src="images/child.jpg" width="100%" height="100%"/>
      </path>       

      <div width="80%" padding="20">
        HEllo there!!!! Tässä on kuvateksti lapselle :)
      </div
    </div> 

    <div height="100" padding="20" >      
      <div width="20%" height="20%"  overflow="hidden" border-radius="50">
        <img src="images/child.jpg" width="100%" height="100%"/>
      </div>       

      <div width="80%" padding="20">
        HEllo there!!!! Tässä on kuvateksti lapselle :)
      </div>
    </div> 

  </div>

  <div page-break="true">
    <div width="100%" height="100%" left="0" top="0" background-color="#3ac6d8">

    </div>

    <div padding="20" margin="20" >      
      <div width="100" height="100" left="0" top="0"  overflow="hidden" border-radius="50%"
        >
        <img src="images/child.jpg" width="100" height="100"/>
      </div>      
      <div width="100" height="100" left="0" top="0"  border-radius="50"
        border-width="3" border-color="white"
        >
      </div>       
      
    </div> 
    
  </div>  
</View>
    `);
        // 600 x 800
        const renderer = new pdfkit_1.Renderer(400, 280);
        evg.calculate(400, 100, renderer);
        renderer.render('./out/test2.pdf', evg);
    });
});
//# sourceMappingURL=test_evg.js.map