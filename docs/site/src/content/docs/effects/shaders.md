---
title: Shaders and surface effects
description: GPU surface effects declared in CSS, the built-in plugins, their parameters, and how to register a GLSL plugin.
---

A surface effect belongs to an **element**, not to the page. The layout already knows the border box, so the effect moves, wraps and reflows with that box.

Painters that have no GPU target drop these properties. PDF and PNG do not run shaders.

## CSS

Three properties, and a box the layout already knew:

```css
.hero-sky {
  evg-surface-effect: starfield;   /* WHAT runs — a name */
  evg-effect-on: always;           /* WHAT starts it */
  evg-fx-density: 1.6;             /* PARAMETERS the engine never reads */
  evg-fx-hue: 228;
}

.pool {
  evg-surface-effect: ripple;
  evg-effect-on: press drag;
  evg-ripple-speed: 240;
}
```

| Property | Meaning |
| --- | --- |
| `evg-surface-effect` | Plugin name |
| `evg-effect-on` | Space-separated triggers: `press`, `drag`, `hover`, `always` |
| `evg-fx-<name>` | A number passed to the plugin. Unknown names reach the shader and are ignored |
| `evg-ripple-*` | Long form still accepted for `ripple` |

`evg-fx-<name>: <number>` is the only parameter form. A name left out takes the plugin default. Values are clamped where a shader needs them: `sweep-duty: 1.1` behaves as `1`.

An element with no `evg-effect-on` is not adopted by the pointer driver. The application can still drive it, which is the original whole-surface effect.

## Layers

A plugin declares which it is. The layer decides when it is drawn:

| Layer | Drawn | Reads | Examples |
| --- | --- | --- | --- |
| `source` | In paint order, at the element's own background | Nothing | `starfield`, `plasma-wave`, `ambient-light`, `smoke` |
| `backdrop` | In paint order, at the same point | The surface so far | `liquid-glass`, `raindrop` |
| `filter` | After the frame, over the box's region | The finished surface | `ripple` |

A source is **under** the element's content. A filter can distort text, charts and images it knows nothing about. A backdrop is `backdrop-filter: blur()`'s neighbour: it reads what is *behind* the element and leaves the element's own label sharp.

`backdrop-filter: blur(9px)` is ordinary CSS. It composes with a shader:

```css
.glass {
  backdrop-filter: blur(9px);
  background-color: rgba(255, 255, 255, 0.07);
  border-radius: 30px;
  evg-surface-effect: liquid-glass;
  evg-fx-strength: 40;
}
```

The bend follows the element's own rounded box (`fxBoxDistance`). Nothing in the plugin knows the shape in advance.

## Built-in plugins

Seven plugins ship with `storm/gl/evg-webgl.js`.

### `ripple` (filter)

Rings from a press or a drag.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `speed` | 220 | How fast a ring travels, px/s |
| `width` | 28 | Ring thickness, px |
| `strength` | 7 | How far the surface is displaced |
| `decay` | 1.8 | How quickly a drop dies |
| `highlight` | 0.08 | Brightening along the crest |
| `rings` | 3 | Rings per drop |
| `stagger` | 0.09 | Delay between rings |
| `falloff` | 0.62 | How much dimmer each following ring is |
| `shine` / `gloss` / `bump` | 0.45 / 120 / 70 | Specular lift |
| `lightX` / `lightY` / `lightZ` | -0.45 / -0.65 / 0.62 | Light direction |

### `starfield` (source)

Stars and dust on the element's background.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `density` | 1 | Stars per cell |
| `speed` | 6 | Drift, px/s |
| `angle` | 200 | Drift direction, degrees |
| `twinkle` | 1 | How much a star's brightness wanders |
| `glow` | 1 | Halo |
| `nebula` | 0.6 | How much dust there is |
| `hue` / `hue2` | 225 / 300 | Two ends of the cloud's colour |
| `seed` | 1 | A different sky at the same settings |

### `liquid-glass` (backdrop)

Refraction at the rim, and a light that can cross the pane.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `thickness` | 24 | How far in from the edge the pane is curved, px |
| `strength` | 32 | How far the bend drags what is behind it |
| `power` | 2.2 | How sharply that falls off toward the middle |
| `disperse` | 0.07 | Colour-channel split |
| `shine` | 0.6 | Specular arc inset from the edge |
| `angle` | -60 | Where its light comes from, degrees |
| `tint` | 0.05 | Flat lift over the pane |
| `sweep` | 0 | Bar brightness. `0` is no sweep |
| `sweep-angle` | -62 | Direction the bar crosses, degrees |
| `sweep-width` | 0.06 | Bar width, as a fraction of the pane |
| `sweep-speed` | 0 | Passes per second. `0` parks it at `sweep-at` |
| `sweep-at` | 0.5 | Parked position, 0…1 |
| `sweep-edge` | 2.2 | Extra brightness at the bevel |
| `sweep-rim` | 0.55 | How much it keeps to the bevel. `1` leaves the flat middle alone |
| `sweep-duty` | 0.35 | Fraction of each cycle the pass takes |

### `plasma-wave` (source)

Ribbons of light.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `ribbons` | 5 | How many, 1…8 |
| `speed` | 0.35 | How fast they travel |
| `amp` | 0.22 | Swing, as a fraction of the height |
| `freq` | 1.7 | Waves across the box |
| `width` | 2.2 | Bright core, px |
| `glow` | 26 | Halo, px |
| `sheet` | 0.16 | Wide colour behind them. `0` is ribbons on black |
| `hue` / `hue2` | 225 / 285 | Colour ends |
| `grain` | 0.35 | Motes in the sheet |
| `seed` | 1 | A different set of paths |

### `raindrop` (backdrop)

Drops on the pane. Each drop is a small lens.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `density` | 1 | How close the drops are |
| `size` | 0.5 | How big a drop is within its cell |
| `refract` | 14 | How far it bends what is behind it, px |
| `shine` | 0.85 | Transmitted crescent and specular dot |
| `angle` | -55 | Light direction, degrees |
| `rim` | 0.55 | How dark the drop's edge is |
| `speed` | 0 | Drift down. `0` is still |
| `seed` | 1 | A different scatter |

### `smoke` (source)

A bank of smoke, or a cloud that fills the box.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `density` | 1.2 | How much of the field shows as smoke |
| `rise` | 0.05 | How fast it climbs |
| `wind` | 0 | Sideways drift |
| `swirl` | 2.6 | Warp. `0` is clouds of plain noise |
| `scale` | 190 | Size of a billow, px |
| `detail` | 5 | Octaves, 1…6 |
| `height` | 0.9 | How far up the box it reaches. `3` or more fills it |
| `softness` | 0.55 | How gradually an edge gives out |
| `shade` | 0.6 | How much the light sculpts it |
| `angle` | -60 | Light direction, degrees |
| `hue` | 205 | Colour it is lit by |
| `tint` | 0.1 | How much of that colour it takes |
| `seed` | 1 | A different roll |

### `ambient-light` (source)

A slow wash with soft orbs.

| Parameter | Default | Meaning |
| --- | --- | --- |
| `hue` / `hue2` | 190 / 268 | Two ends of the wash |
| `sat` | 0.5 | How far from grey those are |
| `tilt` | 25 | Direction the wash runs, degrees |
| `depth` | 0.5 | How bright it is overall |
| `orbs` | 7 | Bokeh discs, 0…10 |
| `size` | 0.55 | Size against the shorter side |
| `softness` | 1.6 | Edge blur |
| `speed` | 0.06 | Drift |
| `glow` | 0.45 | How bright the orbs are |
| `seed` | 1 | A different arrangement |

Presets live in [`storm/gl/effect-presets.css`](https://github.com/terotests/evg/blob/master/storm/gl/effect-presets.css). Paste a block into a stylesheet.

## GLSL plugin shape

Every plugin writes one function. The shared `main` applies the rounded-box mask, so a plugin **cannot** paint outside its element.

```glsl
vec4 fxColor(vec2 p, vec2 local)   // p in page pixels, y down
```

Uniforms the preamble always provides:

| Name | Meaning |
| --- | --- |
| `uBox` | Element border box |
| `uRadius` | Corner radii |
| `uRes` | Surface resolution |
| `uTime` | Clock |
| `uEvents[]` / `uEventCount` | Pointer events the driver stamped |
| `uSrc` | Source texture (filters and backdrops) |
| `fxBoxDistance(p)` | Signed distance to the rounded box |

Parameters from CSS become `p_<name>`: `evg-fx-period: 4` is `p_period` in the shader.

## Register a plugin

No engine change. No display-list change.

```js
import { registerSurfaceEffect } from "./evg-webgl.js";

registerSurfaceEffect({
  name: "scanlines",
  layer: "filter",
  params: { period: 4, depth: 0.15 },
  frag: `vec4 fxColor(vec2 p, vec2 local) {
    float k = 1.0 - p_depth * step(0.5, fract(p.y / p_period));
    return vec4(texture(uSrc, vUV).rgb * k, 1.0);
  }`,
});
```

Then in any stylesheet:

```css
.crt { evg-surface-effect: scanlines; evg-fx-period: 3; evg-effect-on: always; }
```

## Driver

`storm/gl/evg-fx.js` turns a pointer into events:

```js
const fx = createEffectDriver();
attachEffectPointer(canvas, fx, schedule);
// per frame:
fx.tick(dtMs, doc.list);
frame.draw();
```

It hit-tests the boxes the display list carries, topmost first, and gives the event to the instance whose trigger list mentions what happened.

`fx.busy()` is false when nothing is in flight and no effect says `always`. A page can stop drawing when the water stills.

`inst.off = true` skips the pass without rebuilding the frame.

## Backdrop trap

A backdrop copies the surface mid-frame. A WebGL2 context with `antialias: true` (the default) has a multisampled framebuffer. Copying out of one is `INVALID_OPERATION`. A frame with a live backdrop is therefore rendered into an offscreen target and presented at the end.

The design document is [`storm/PLAN_EFFECTS.md`](https://github.com/terotests/evg/blob/master/storm/PLAN_EFFECTS.md). The painter shaders for rounded boxes themselves (`sdRoundedBox`) are in [`storm/gl/README.md`](https://github.com/terotests/evg/blob/master/storm/gl/README.md).
