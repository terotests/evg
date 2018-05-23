# EVG

Layout engine to create vector graphics (like PDF) using JavaScript and XML based declarative markup.

```s
npm i -g evg
```

Example of markup:
```html
<div>
  <div padding="20">
    <QRCode text="https://github.com/terotests/evg" width="20%" height="20%"/>
    <div width="80%" padding="20">
    Here is your personal QR code
    </div>
  </div>
</div>
```

See `hello.xml` and `hello.pdf` to get started quickly.
 
The engine supports following commands (and more):

- `div`, `img` and `path` for common layout elements
- `color`, `background-color`, `border-color`, `opacity`
- `border-width`, `border-radius`
- basic `padding`, `margin`, `margin-top` etc. supported
- units `px`, `%` (%of available width) or `hp` (% of height)
- width, height as `50%` or `50` or `50px`, `
- text can be added like `<div>Hello World</div>`
- `font-size`, `font-family` can be used to specify TTF fonts used (or `fonts/` dir for CLI)
- horizontal align `align=center`, `align=left`, `align=right`
- absolute positioning `top` and `left`, `bottom`, `right`

Extra features include:

- support for QR codes using `<QRCode text="foobar"/>`
- `page-break` to change pages
- `footer` and `header` to specify page header and footer
- `<component id=""></component>` to declare re-usable components
- `id="content"` to hold component contents
- `<path d=""/>` elements which can contain SVG path are scaled automatically to fit viewport

## Command line

Running from command line
```
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

## Creating own components using inline XML

You can define own components, which receive the child elements under a certain tag.

To define your own custom `<h1>Hello</h1>` component as inline XML like this

```html
<component id="h1">
  <div margin-top="10" margin-bottom="20" margin-left="20">
    <div font-size="28" color="#666" id="content"/>
  </div>
</component> 
```
The `id="content"` marks the spot where component children are to be inserted.

## License

MIT