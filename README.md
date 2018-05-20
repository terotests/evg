# EVG

Elastic View Graphics

```javascript
import {EVG} from 'evg'

// you have to install some fonts...
EVG.installFont('candal', '../evg/fonts/Candal/Candal.ttf')

// create a text element component....
EVG.installComponent('t', `<Label font-family="candal" background-color="blue" />`)

// create node and render it to PDF
const node = new EVG(`<View>
  <t text="Hello World!"/>
</View>
`)
EVG.renderToFile('./out.pdf', 600,800, node)
```