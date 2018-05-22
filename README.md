# EVG

```s
npm i evg
```

## Command line

Running from command line
```s
evg hello.xml hello.pdf
```

Subdirectories:
- `fonts/` can include TTF files
- `components/` can include XML components which are used in the file. 

Components can use `id="content"` to indicate place for child nodes.

The .git reposity has example directory `testfiles/` where is example XML file.

## Using as library 

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