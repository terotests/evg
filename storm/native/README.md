# `storm/native` — the EVG display list, painted with OpenGL

**License: MIT** (as the rest of `storm/`; `third_party/stb_truetype.h` is MIT
or public domain).

The native sibling of [`gl/evg-webgl.js`](../gl/evg-webgl.js): an
`EVGDisplayList` — the JSON `toJson` writes — drawn with OpenGL 3.3 core. A
Ranger app compiled to C++ hands its `displayListJson()` to this painter and
gets the same picture it gets in a browser, surface effects included. It was
written for [EVG Player](https://github.com/terotests/EVGMusicPlayer), a
skinned music player whose window is the shape of its skin, and moved here
once it was clear nothing in it was about music.

```
   app.displayListJson()                (Ranger, compiled to C++)
          │  evg::json::Parser
   evg::gl::Painter::draw(list, frame)  what each command MEANS
          │
          ├── shapes      rects, gradients, shadows, borders     EvgGlPainter.cpp
          ├── paths       stencil-then-cover fills, strokes       EvgGlPainter.cpp
          ├── Text        faces the host registers, glyph atlas  EvgGlText.cpp
          ├── Effects     the surface-effect plugin registry     EvgGlEffects.cpp
          └── Target      MSAA target, surface copies, readback  EvgGlTarget.cpp
```

| File | What it is |
| --- | --- |
| `evg_json.h` | Enough JSON for a display list |
| `gl/evg_gl.h`, `gl/EvgGlProgram.cpp` | GL headers per platform; compile/link; the shared page-space vertex stage |
| `gl/EvgGlPainter.*` | The walk: commands in, GL calls out |
| `gl/EvgGlText.*` | Font faces (registered by the host), glyph atlas, CSS half-leading |
| `gl/EvgGlEffects.*` | Effect definitions and manifests, lazy programs, the uniform ABI |
| `gl/EvgGlTarget.*` | Offscreen target (multisampled), copy of the surface so far, `readPixels` |
| `tools/evg-gl-render.cpp` | A list in, a PAM image out: the check tool |
| `tests/check.mjs` | Pixel checks of every command kind and every effect layer |

## Using it

```cpp
#include "gl/EvgGlPainter.h"           // from the evg package: <evg>/native/gl/

evg::gl::Painter painter;
painter.text().addFaceFile("Noto Sans", false, false, "NotoSans-Regular.ttf");
painter.text().addFaceFile("Noto Sans", true,  false, "NotoSans-Bold.ttf");
painter.effects().add(evg::gl::EffectDef{"glow"}.param("level", 0));   // + .glsl
std::string err;
painter.init(err);                      // a GL 3.3 core context is current

evg::gl::Target target;                 // optional: MSAA that does not depend
target.ensure(drawW, drawH, 4);         // on the window's visual
target.bind();
evg::json::Value list;
evg::json::Parser(app->displayListJson()).parse(list);
painter.draw(list, {pageW, pageH, drawW, drawH, seconds,
  [&](const std::string& id, const std::string& kind, evg::gl::EffectInputs& in) {
    if (kind == "glow") in.params["level"] = bass;   // per frame, no relayout
  }});
target.resolve(0);                      // onto the window
```

Compile `gl/*.cpp` with the app (C++17) and link OpenGL; on Windows include a
loader first and define `EVG_GL_HAVE_LOADER`. The painter clears to
transparent and leaves premultiplied colour, so on a transparent window
(macOS non-opaque `NSWindow`, an ARGB visual) what the list does not paint is
not there.

Text needs the faces the layout was measured with: the painter has no font of
its own. The list names a family and weight (`"Noto Sans-Bold"`); the closest
registered face draws it.

## Effects: one GLSL body, two painters

A surface effect is a **manifest** and a **GLSL body**:

```json
{ "name": "spectrum", "layer": "source",
  "params": { "level": 0, "mode": 0, "hue": 205 },
  "arrays": { "b": 32 },
  "file": "spectrum.glsl" }
```

```glsl
vec4 fxColor(vec2 p, vec2 local) {       // p: page px, y down; local: 0..1 in the box
  return vec4(vec3(p_level), 1.0);
}
```

The body sees what [`PLAN_EFFECTS.md`](../PLAN_EFFECTS.md) lists for the web —
`uBox`, `uRadius`, `uRes`, `uTime`, `uEvents[8]`/`uEventCount`,
`fxBoxDistance`, `fxBoxCoverage`, one `p_<name>` per parameter, and for
`backdrop` / `filter` layers `uSrc` at `vUV` — with the same names, so the
same text compiles in both:

- **web** — `registerEffectManifest(manifest, glsl, common)` in
  [`gl/evg-fx-def.js`](../gl/evg-fx-def.js) registers it with `evg-webgl.js`;
- **native** — `EffectDef::fromManifest(manifest, glsl, def)` and
  `painter.effects().add(def)`.

| layer | drawn | reads |
| --- | --- | --- |
| `source` | at the element's background, in paint order | nothing |
| `backdrop` | at the same point | the surface so far (`uSrc`) |
| `filter` | after the frame, over its box | the finished surface (`uSrc`) |

The stylesheet puts an effect on an element (`evg-surface-effect: spectrum;
evg-fx-hue: 205`), the list carries the instance, and what changes every
frame comes from the host through the hook — in.params and in.events — so a
running effect never causes a layout. That split is what made the music
visualiser cheap, and it is the one to keep.

## Where it goes next

The pieces are separate so each can grow without the others:

1. **The built-in effects as files.** `ripple`, `starfield`, `liquid-glass` and
   the presets are strings inside `evg-webgl.js`. Moved to
   `storm/effects/<name>.json` + `.glsl` they load in both painters through
   the two functions above, and a native host gets all of them for free.
2. **An effect driver.** `gl/evg-fx.js` turns presses into `uEvents` on the
   web; a C++ twin (events in, aged, handed to the hook) makes `ripple` and
   `raindrop` work natively.
3. **Images (k2)** through a texture cache keyed by `src`, decoded by the host
   or by `lib/image`.
4. **The binary list** (`evg-binary.js`) as a second reader beside
   `evg_json.h`: same commands, no parse.
5. **Other shader languages.** A manifest says nothing about GLSL; a Metal or
   WGSL painter reads the same manifest with a body in its own language
   (`"file": { "glsl": …, "msl": … }`).
6. **Shaped windows.** EVG Player's SDL host (shape from the painted alpha,
   transparent `NSWindow` on macOS, the outline as the drag handle) is the
   next thing worth lifting into a reusable host.

## Checking it

```
bash storm/native/tools/build.sh        # SDL2 + OpenGL: brew install sdl2 / apt-get install libsdl2-dev libgl-dev
node storm/native/tests/check.mjs       # under xvfb-run when there is no display
```
