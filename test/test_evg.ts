

import 'mocha';
import {EVG, UIRenderPosition,register_component} from '../src/layout/'
import {Renderer} from '../src/renderers/pdfkit'

const expect    = require("chai").expect;

describe("render testting", function() {


  it('baseline', () => {

    const evg = new EVG(`
<View>

  <View width="100%" height="40" background-color="yellow">
    <View width="20" height="20" background-color="blue"/>
    <View width="20" height="20" background-color="red"/>
    <View width="20" height="20" background-color="green"/>  
  </View>

  <View width="100%" height="40" background-color="#223344">
    <View width="20" height="20" background-color="blue" border-radius="50%"/>
    <View width="20" height="20" background-color="red" border-radius="50%"/>
    <View width="20" height="20" background-color="green" border-radius="50%"/>  
  </View>
  <img src="images/w.jpg" width="200" height="200"/>
  
</View>
    `)
    const renderer = new Renderer(600,800)
    evg.calculate(600,800,renderer)    
    renderer.render('./out/baseline.pdf', evg)

  });  

  it('iphone test', () => {
    // your test
    expect(3).to.equal(3)

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
    `    
    
    register_component('iphone', phone)
    register_component('text', `<Label background-color="blue" />`)
    register_component('t', `<Label background-color="#222222" />`)
    register_component('note',`
    <path background-color="black" width="30" height="20"
    d="M16.899,3.05c-0.085-0.068-0.192-0.095-0.299-0.074L7.947,4.779c-0.17,0.034-0.291,0.182-0.291,0.353v7.364c-0.494-0.536-1.199-0.873-1.983-0.873c-1.491,0-2.704,1.213-2.704,2.704s1.213,2.704,2.704,2.704c1.491,0,2.705-1.213,2.705-2.704V7.952l7.933-1.659v4.399c-0.494-0.535-1.199-0.873-1.983-0.873c-1.491,0-2.704,1.213-2.704,2.704c0,1.492,1.213,2.705,2.704,2.705c1.49,0,2.704-1.213,2.704-2.705V3.33C17.031,3.221,16.982,3.119,16.899,3.05 M5.673,16.311c-1.094,0-1.983-0.889-1.983-1.983s0.889-1.983,1.983-1.983c1.095,0,1.983,0.889,1.983,1.983S6.768,16.311,5.673,16.311 M14.327,14.508c-1.095,0-1.983-0.889-1.983-1.984c0-1.094,0.889-1.982,1.983-1.982c1.094,0,1.983,0.889,1.983,1.982C16.311,13.619,15.421,14.508,14.327,14.508 M16.311,5.558L8.377,7.217V5.428l7.933-1.659V5.558z"
 ></path>     
    `)

    const evg = new EVG(`
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
    `)
    const renderer = new Renderer(600,800)
    evg.calculate(600,800,renderer)
    renderer.render('./out/test1.pdf', evg)
  });  

  it('absolute position test', () => {
    const evg = new EVG(`
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
    `)
    const renderer = new Renderer(600,800)
    evg.calculate(600,800,renderer)
    renderer.render('./out/test2.pdf', evg)

  });  
});

