var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/svg/path.ts
var Vec2, PathExecutor, PathScaler, PathSegment, EVGPathParser;
var init_path = __esm({
  "src/svg/path.ts"() {
    Vec2 = class _Vec2 {
      constructor() {
        this.x = 0;
        this.y = 0;
      }
      static CreateNew(i, j) {
        const v = new _Vec2();
        v.x = i;
        v.y = j;
        return v;
      }
    };
    PathExecutor = class {
      constructor() {
      }
      ClosePath() {
      }
      Move(x, y) {
        console.log("Move called with " + x + ", " + y);
      }
      Line(x, y) {
        console.log("Line called with " + x + ", " + y);
      }
      Curve(x0, y0, x1, y1, x2, y2) {
        console.log(
          "Cubic bezier curve called with " + x0 + ", " + y0 + " " + x1 + ", " + y1 + " " + x2 + ", " + y2 + " "
        );
      }
    };
    PathScaler = class extends PathExecutor {
      constructor() {
        super();
        this.pathParts = [];
        this.pathParts = [];
      }
      Move(x, y) {
        this.pathParts.push(["M", x, y]);
      }
      Line(x, y) {
        this.pathParts.push(["L", x, y]);
      }
      Curve(x0, y0, x1, y1, x2, y2) {
        this.pathParts.push(["C", x0, y0, x1, y1, x2, y2]);
      }
      getString(width, height) {
        let minx = 0, miny = 0, maxx = 0, maxy = 0;
        this.pathParts.forEach((segment) => {
          segment.forEach((value, i) => {
            if (typeof value === "number") {
              if (i > 0 && (i & 1) == 1) {
                if (typeof minx === "undefined" || value < minx) minx = value;
                if (typeof maxx === "undefined" || value > maxx) maxx = value;
              }
              if (i > 0 && (i & 1) === 0) {
                if (typeof miny === "undefined" || value < miny) miny = value;
                if (typeof maxy === "undefined" || value > maxy) maxy = value;
              }
            }
          });
        });
        const orig_width = maxx - minx;
        const orig_height = maxy - miny;
        if (orig_width === 0 || orig_height === 0) {
          return "";
        }
        let scale_amount_x = width / orig_width;
        let scale_amount_y = height / orig_height;
        if (width / height < orig_width / orig_height) {
          scale_amount_y = scale_amount_x;
        } else {
          scale_amount_x = scale_amount_y;
        }
        return this.pathParts.map((segment) => {
          return segment.map((value, i) => {
            if (i === 0) return value;
            if (typeof value === "number") {
              if ((i & 1) == 1) {
                return (value - minx) * scale_amount_x;
              }
              return (value - miny) * scale_amount_y;
            }
          });
        }).join(" ");
      }
    };
    PathSegment = class {
      constructor() {
        this.t0 = 0;
        this.t1 = 0;
        this.t2 = 0;
        this.t3 = 0;
        this.t4 = 0;
        this.t5 = 0;
        this.t6 = 0;
      }
    };
    EVGPathParser = class {
      constructor() {
        this.i = 0;
        this.__len = 0;
        this.last_number = 0;
        this.buff = "";
      }
      __sqr(v) {
        return v * v;
      }
      __xformPoint(point, seg) {
        const res = Vec2.CreateNew(
          point.x * seg.t0 + point.y * seg.t2 + seg.t4,
          point.x * seg.t1 + point.y * seg.t3 + seg.t5
        );
        return res;
      }
      __xformVec(point, seg) {
        return Vec2.CreateNew(
          point.x * seg.t0 + point.y * seg.t2,
          point.x * seg.t1 + point.y * seg.t3
        );
      }
      __vmag(point) {
        return Math.sqrt(point.x * point.x + point.y * point.y);
      }
      __vecrat(u, v) {
        return (u.x * v.x + u.y * v.y) / (this.__vmag(u) * this.__vmag(v));
      }
      __vecang(u, v) {
        let r = this.__vecrat(u, v);
        if (r < -1) {
          r = -1;
        }
        if (r > 1) {
          r = 1;
        }
        let res = 1;
        if (u.x * v.y < u.y * v.x) {
          res = -1;
        }
        return res * Math.acos(r);
      }
      scanNumber() {
        const s = this.buff;
        let fc = s.charCodeAt(this.i);
        let c = fc;
        let sp = 0;
        let ep = 0;
        fc = s.charCodeAt(this.i);
        if (fc == 45 && s.charCodeAt(this.i + 1) >= 46 && s.charCodeAt(this.i + 1) <= 57 || fc >= 48 && fc <= 57) {
          sp = this.i;
          this.i = 1 + this.i;
          c = s.charCodeAt(this.i);
          while (this.i < this.__len && (c >= 48 && c <= 57 || c == 46 || this.i == sp && (c == 43 || c == 45))) {
            this.i = 1 + this.i;
            if (this.i >= this.__len) {
              break;
            }
            c = s.charCodeAt(this.i);
          }
          ep = this.i;
          this.last_number = isNaN(parseFloat(s.substring(sp, ep))) ? 0 : parseFloat(s.substring(sp, ep));
          return true;
        }
        return false;
      }
      pathArcTo(callback, cp, args, rel) {
        let rx = 0;
        let ry = 0;
        let rotx = 0;
        let x1 = 0;
        let y1 = 0;
        let x2 = 0;
        let y2 = 0;
        let cx = 0;
        let cy = 0;
        let dx = 0;
        let dy = 0;
        let d = 0;
        let x1p = 0;
        let y1p = 0;
        let cxp = 0;
        let cyp = 0;
        let s = 0;
        let sa = 0;
        let sb = 0;
        let a1 = 0;
        let da = 0;
        let x = 0;
        let y = 0;
        let tanx = 0;
        let tany = 0;
        let a = 0;
        let px = 0;
        let py = 0;
        let ptanx = 0;
        let ptany = 0;
        const t = new PathSegment();
        let sinrx = 0;
        let cosrx = 0;
        let fa = 0;
        let fs3 = 0;
        let i_1 = 0;
        let ndivs = 0;
        let hda = 0;
        let kappa = 0;
        const PI_VALUE = Math.PI;
        const cpx = cp.x;
        const cpy = cp.y;
        rx = Math.abs(args.t0);
        ry = Math.abs(args.t1);
        rotx = args.t2 / 180 * PI_VALUE;
        fa = Math.abs(args.t3) > 1e-5 ? 1 : 0;
        fs3 = Math.abs(args.t4) > 1e-5 ? 1 : 0;
        x1 = cpx;
        y1 = cpy;
        if (rel) {
          x2 = cpx + args.t5;
          y2 = cpy + args.t6;
        } else {
          x2 = args.t5;
          y2 = args.t6;
        }
        dx = x1 - x2;
        dy = y1 - y2;
        d = Math.sqrt(dx * dx + dy * dy);
        if (d < 1e-5 || rx < 1e-5 || ry < 1e-5) {
          callback.Line(x2, y2);
          return Vec2.CreateNew(x2, y2);
        }
        sinrx = Math.sin(rotx);
        cosrx = Math.cos(rotx);
        x1p = cosrx * dx / 2 + sinrx * dy / 2;
        y1p = -1 * sinrx * dx / 2 + cosrx * dy / 2;
        d = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
        if (d > 1) {
          d = Math.sqrt(d);
          rx = rx * d;
          ry = ry * d;
        }
        s = 0;
        sa = rx * rx * (ry * ry) - rx * rx * (y1p * y1p) - ry * ry * (x1p * x1p);
        sb = rx * rx * (y1p * y1p) + ry * ry * (x1p * x1p);
        if (sa < 0) {
          sa = 0;
        }
        if (sb > 0) {
          s = Math.sqrt(sa / sb);
        }
        if (fa == fs3) {
          s = -1 * s;
        }
        cxp = s * rx * y1p / ry;
        cyp = s * (-1 * ry) * x1p / rx;
        cx = (x1 + x2) / 2 + (cosrx * cxp - sinrx * cyp);
        cy = (y1 + y2) / 2 + (sinrx * cxp + cosrx * cyp);
        const u = Vec2.CreateNew((x1p - cxp) / rx, (y1p - cyp) / ry);
        const v = Vec2.CreateNew((-1 * x1p - cxp) / rx, (-1 * y1p - cyp) / ry);
        const unitV = Vec2.CreateNew(1, 0);
        a1 = this.__vecang(unitV, u);
        da = this.__vecang(u, v);
        if (fs3 == 0 && da > 0) {
          da = da - 2 * PI_VALUE;
        } else {
          if (fs3 == 1 && da < 0) {
            da = 2 * PI_VALUE + da;
          }
        }
        t.t0 = cosrx;
        t.t1 = sinrx;
        t.t2 = -1 * sinrx;
        t.t3 = cosrx;
        t.t4 = cx;
        t.t5 = cy;
        ndivs = Math.floor(Math.abs(da) / (PI_VALUE * 0.5) + 1);
        hda = da / ndivs / 2;
        kappa = Math.abs(4 / 3 * (1 - Math.cos(hda)) / Math.sin(hda));
        if (da < 0) {
          kappa = -1 * kappa;
        }
        i_1 = 0;
        while (i_1 <= ndivs) {
          a = a1 + da * i_1 / ndivs;
          dx = Math.cos(a);
          dy = Math.sin(a);
          const trans = this.__xformPoint(Vec2.CreateNew(dx * rx, dy * ry), t);
          x = trans.x;
          y = trans.y;
          const v_trans = this.__xformVec(
            Vec2.CreateNew(-1 * dy * rx * kappa, dx * ry * kappa),
            t
          );
          tanx = v_trans.x;
          tany = v_trans.y;
          if (i_1 > 0) {
            callback.Curve(px + ptanx, py + ptany, x - tanx, y - tany, x, y);
          }
          px = x;
          py = y;
          ptanx = tanx;
          ptany = tany;
          i_1 = i_1 + 1;
        }
        const rv = Vec2.CreateNew(x2, y2);
        return rv;
      }
      parsePath(path3, callback) {
        this.i = 0;
        this.buff = path3;
        const s = this.buff;
        this.__len = s.length;
        let cmd = 76;
        const args = new PathSegment();
        let require_args = 2;
        let arg_cnt = 0;
        const QPx = new PathSegment();
        const QPy = new PathSegment();
        const CPx = new PathSegment();
        const CPy = new PathSegment();
        let cx = 0;
        let cy = 0;
        let cx2 = 0;
        let cy2 = 0;
        let last_i = -1;
        let is_first = true;
        let first_x = 0, first_y = 0;
        while (this.i < this.__len) {
          if (last_i == this.i) {
            this.i = this.i + 1;
          }
          last_i = this.i;
          const c = s.charCodeAt(this.i);
          if (c === 90 || c === 122) {
            callback.Line(first_x, first_y);
            callback.ClosePath();
            arg_cnt = 0;
            cx = first_x;
            cy = first_y;
            cx2 = first_x;
            cy2 = first_y;
            is_first = true;
            continue;
          }
          if (c == 86 || c == 118 || c == 72 || c == 104) {
            cmd = c;
            require_args = 1;
            arg_cnt = 0;
            continue;
          }
          if (c == 109 || c == 77 || c == 76 || c == 108 || c == 116 || c == 84) {
            cmd = c;
            require_args = 2;
            arg_cnt = 0;
            continue;
          }
          if (c == 113 || c == 81 || c == 83 || c == 115) {
            cmd = c;
            require_args = 4;
            arg_cnt = 0;
            continue;
          }
          if (c == 99 || c == 67) {
            cmd = c;
            require_args = 6;
            arg_cnt = 0;
            continue;
          }
          if (c == 97 || c == 65) {
            cmd = c;
            require_args = 7;
            arg_cnt = 0;
            continue;
          }
          if (this.scanNumber()) {
            switch (arg_cnt) {
              case 0:
                args.t0 = this.last_number;
                break;
              case 1:
                args.t1 = this.last_number;
                break;
              case 2:
                args.t2 = this.last_number;
                break;
              case 3:
                args.t3 = this.last_number;
                break;
              case 4:
                args.t4 = this.last_number;
                break;
              case 5:
                args.t5 = this.last_number;
                break;
              case 6:
                args.t6 = this.last_number;
                break;
              default:
                break;
            }
            arg_cnt = arg_cnt + 1;
            if (arg_cnt >= require_args) {
              switch (cmd) {
                // "m"
                case 109:
                  if (is_first) {
                    first_x = cx + args.t0;
                    first_y = cy + args.t1;
                  }
                  callback.Move(cx + args.t0, cy + args.t1);
                  cx = args.t0;
                  cy = args.t1;
                  cmd = 76;
                  require_args = 2;
                  cx2 = cx;
                  cy2 = cy;
                  break;
                // "M"
                case 77:
                  if (is_first) {
                    first_x = args.t0;
                    first_y = args.t1;
                  }
                  callback.Move(args.t0, args.t1);
                  cx = args.t0;
                  cy = args.t1;
                  cmd = 76;
                  require_args = 2;
                  cx2 = cx;
                  cy2 = cy;
                  break;
                // "z"
                case 122:
                  callback.Line(first_x, first_y);
                  callback.ClosePath();
                  arg_cnt = 0;
                  cx = first_x;
                  cy = first_y;
                  cx2 = first_x;
                  cy2 = first_y;
                  break;
                // "Z"
                case 90:
                  console.log("------ path z segment -----");
                  console.log(args);
                  console.log("arg_cnt", arg_cnt);
                  console.log("require_args", require_args);
                  callback.Line(first_x, first_y);
                  callback.ClosePath();
                  arg_cnt = 0;
                  cx = first_x;
                  cy = first_y;
                  cx2 = first_x;
                  cy2 = first_y;
                  break;
                // "l"
                case 108:
                  callback.Line(cx + args.t0, cy + args.t1);
                  cx = cx + args.t0;
                  cy = cy + args.t1;
                  cx2 = cx;
                  cy2 = cy;
                  break;
                case 76:
                  callback.Line(args.t0, args.t1);
                  cx = args.t0;
                  cy = args.t1;
                  cx2 = cx;
                  cy2 = cy;
                  break;
                case 104:
                  callback.Line(cx + args.t0, cy);
                  cx = cx + args.t0;
                  cx2 = cx;
                  break;
                case 72:
                  callback.Line(args.t0, cy);
                  cx = args.t0;
                  cx2 = cx;
                  break;
                case 118:
                  callback.Line(cx, cy + args.t0);
                  cy = cy + args.t0;
                  cy2 = cy;
                  break;
                case 86:
                  callback.Line(cx, args.t0);
                  cy = args.t0;
                  cy2 = cy;
                  break;
                case 99:
                  callback.Curve(
                    cx + args.t0,
                    cy + args.t1,
                    cx + args.t2,
                    cy + args.t3,
                    cx + args.t4,
                    cy + args.t5
                  );
                  cx2 = cx + args.t2;
                  cy2 = cy + args.t3;
                  cx = cx + args.t4;
                  cy = cy + args.t5;
                  break;
                case 67:
                  callback.Curve(
                    args.t0,
                    args.t1,
                    args.t2,
                    args.t3,
                    args.t4,
                    args.t5
                  );
                  cx2 = args.t2;
                  cy2 = args.t3;
                  cx = args.t4;
                  cy = args.t5;
                  break;
                //
                case 115:
                  callback.Curve(
                    cx + cx - cx2,
                    cy + cy - cy2,
                    cx + args.t0,
                    cy + args.t1,
                    cx + args.t2,
                    cy + args.t3
                  );
                  cx2 = cx + args.t0;
                  cy2 = cy + args.t1;
                  cx = cx + args.t2;
                  cy = cy + args.t3;
                  break;
                // "S"
                case 83:
                  callback.Curve(
                    cx + cx - cx2,
                    cy + cy - cy2,
                    args.t0,
                    args.t1,
                    args.t2,
                    args.t3
                  );
                  cx2 = args.t0;
                  cy2 = args.t1;
                  cx = args.t2;
                  cy = args.t3;
                  break;
                // "q"
                case 113:
                  QPx.t0 = cx;
                  QPy.t0 = cy;
                  QPx.t1 = cx + args.t0;
                  QPy.t1 = cy + args.t1;
                  QPx.t2 = cx + args.t2;
                  QPy.t2 = cy + args.t3;
                  CPx.t0 = QPx.t0;
                  CPy.t0 = QPy.t0;
                  CPx.t1 = QPx.t0 + 2 / 3 * (QPx.t1 - QPx.t0);
                  CPy.t1 = QPy.t0 + 2 / 3 * (QPy.t1 - QPy.t0);
                  CPx.t2 = QPx.t2 + 2 / 3 * (QPx.t1 - QPx.t2);
                  CPy.t2 = QPy.t2 + 2 / 3 * (QPy.t1 - QPy.t2);
                  CPx.t3 = QPx.t2;
                  CPy.t3 = QPy.t2;
                  callback.Curve(CPx.t1, CPy.t1, CPx.t2, CPy.t2, CPx.t3, CPy.t3);
                  cx2 = CPx.t2;
                  cy2 = CPy.t2;
                  cx = CPx.t3;
                  cy = CPy.t3;
                  break;
                // "Q"
                case 81:
                  QPx.t0 = cx;
                  QPy.t0 = cy;
                  QPx.t1 = args.t0;
                  QPy.t1 = args.t1;
                  QPx.t2 = args.t2;
                  QPy.t2 = args.t3;
                  CPx.t0 = QPx.t0;
                  CPy.t0 = QPy.t0;
                  CPx.t1 = QPx.t0 + 2 / 3 * (QPx.t1 - QPx.t0);
                  CPy.t1 = QPy.t0 + 2 / 3 * (QPy.t1 - QPy.t0);
                  CPx.t2 = QPx.t2 + 2 / 3 * (QPx.t1 - QPx.t2);
                  CPy.t2 = QPy.t2 + 2 / 3 * (QPy.t1 - QPy.t2);
                  CPx.t3 = QPx.t2;
                  CPy.t3 = QPy.t2;
                  callback.Curve(CPx.t1, CPy.t1, CPx.t2, CPy.t2, CPx.t3, CPy.t3);
                  cx2 = CPx.t1;
                  cy2 = CPy.t1;
                  cx = CPx.t2;
                  cy = CPy.t3;
                  break;
                case 84:
                  QPx.t0 = cx;
                  QPy.t0 = cy;
                  QPx.t1 = 2 * cx - cx2;
                  QPy.t1 = 2 * cy - cy2;
                  QPx.t2 = args.t0;
                  QPy.t2 = args.t1;
                  CPx.t0 = QPx.t0;
                  CPy.t0 = QPy.t0;
                  CPx.t1 = QPx.t0 + 2 / 3 * (QPx.t1 - QPx.t0);
                  CPy.t1 = QPy.t0 + 2 / 3 * (QPy.t1 - QPy.t0);
                  CPx.t2 = QPx.t2;
                  CPy.t2 = QPy.t2;
                  callback.Curve(CPx.t0, CPy.t0, CPx.t1, CPy.t1, CPx.t2, CPy.t2);
                  cx2 = CPx.t1;
                  cy2 = CPy.t1;
                  cx = CPx.t2;
                  cy = CPy.t3;
                  break;
                case 116:
                  QPx.t0 = cx;
                  QPy.t0 = cy;
                  QPx.t1 = 2 * cx - cx2;
                  QPy.t1 = 2 * cy - cy2;
                  QPx.t2 = cx + args.t0;
                  QPy.t2 = cy + args.t1;
                  CPx.t0 = QPx.t0;
                  CPy.t0 = QPy.t0;
                  CPx.t1 = QPx.t0 + 2 / 3 * (QPx.t1 - QPx.t0);
                  CPy.t1 = QPy.t0 + 2 / 3 * (QPy.t1 - QPy.t0);
                  CPx.t2 = QPx.t2;
                  CPy.t2 = QPy.t2;
                  callback.Curve(CPx.t0, CPy.t0, CPx.t1, CPy.t1, CPx.t2, CPy.t2);
                  cx2 = CPx.t1;
                  cy2 = CPy.t1;
                  cx = CPx.t2;
                  cy = CPy.t3;
                  break;
                case 97:
                  const res = this.pathArcTo(
                    callback,
                    Vec2.CreateNew(cx, cy),
                    args,
                    true
                  );
                  cx = res.x;
                  cy = res.y;
                  cx2 = cx;
                  cy2 = cy;
                  break;
                case 65:
                  const res_1 = this.pathArcTo(
                    callback,
                    Vec2.CreateNew(cx, cy),
                    args,
                    false
                  );
                  cx = res_1.x;
                  cy = res_1.y;
                  cx2 = cx;
                  cy2 = cy;
                  break;
                default:
                  if (arg_cnt >= 2) {
                    cx = args.t0;
                    cy = args.t1;
                    cx2 = cx;
                    cy2 = cy;
                  }
                  break;
              }
              arg_cnt = 0;
              is_first = false;
            }
          }
        }
      }
    };
  }
});

// src/renderers/pdfkit.ts
var pdfkit_exports = {};
__export(pdfkit_exports, {
  Renderer: () => Renderer
});
var PDFKit, QRCode, fs, path, fontPaths, default_font, Renderer, Image, QR_Code, View, Label, Path;
var init_pdfkit = __esm({
  "src/renderers/pdfkit.ts"() {
    init_path();
    PDFKit = require("pdfkit");
    QRCode = require("qrcode");
    fs = require("fs");
    path = require("path");
    fontPaths = [
      "fonts/Open_Sans/OpenSans-Regular.ttf",
      // Local development
      path.join(__dirname, "../fonts/Open_Sans/OpenSans-Regular.ttf"),
      // When imported as a dependency
      path.join(process.cwd(), "fonts/Open_Sans/OpenSans-Regular.ttf"),
      // From current working directory
      path.join(
        path.dirname(process.execPath),
        "fonts/Open_Sans/OpenSans-Regular.ttf"
      ),
      // From executable path
      path.join(
        path.dirname(process.execPath),
        "../fonts/Open_Sans/OpenSans-Regular.ttf"
      )
      // One level up from executable
    ];
    if (process.env.APPDATA) {
      fontPaths.push(
        path.join(
          process.env.APPDATA,
          "npm/node_modules/evg/fonts/Open_Sans/OpenSans-Regular.ttf"
        )
      );
    } else if (process.env.HOME) {
      fontPaths.push(
        path.join(
          process.env.HOME,
          ".npm/node_modules/evg/fonts/Open_Sans/OpenSans-Regular.ttf"
        )
      );
    }
    default_font = null;
    for (const fontPath of fontPaths) {
      try {
        if (fs.existsSync(fontPath)) {
          default_font = fontPath;
          break;
        }
      } catch (e) {
      }
    }
    if (!default_font) {
      console.warn("Warning: Could not find OpenSans-Regular.ttf font file");
      default_font = fontPaths[0];
    }
    Renderer = class {
      constructor(width, height) {
        this.opacity_now = 1;
        this.text_color = "black";
        this.font_family = default_font;
        this.static_header = null;
        this.static_footer = null;
        this.doc = new PDFKit({ size: [width, height] });
        this.height = height;
        this.width = width;
      }
      hasCustomSize(item) {
        if (item.tagName == "Label") {
          if (item.fontFamily.is_set) {
            const font_file = item.findFont(item.fontFamily.s_value);
            if (font_file) {
              this.doc.font(font_file);
            } else {
              this.doc.font(default_font);
            }
          } else {
            this.doc.font(default_font);
          }
          if (item.fontSize.is_set) {
            this.doc.fontSize(item.fontSize.pixels);
          } else {
            this.doc.fontSize(12);
          }
          return {
            width: this.doc.widthOfString(item.text.s_value),
            height: item.fontSize.f_value || 12
          };
        }
      }
      async render(filename, item, headers) {
        const fs3 = require("fs");
        const doc = this.doc;
        doc.pipe(fs3.createWriteStream(filename));
        await this.renderItem(item, doc, headers, true);
        doc.save();
        doc.end();
      }
      async renderToStream(inputStream, item, headers) {
        const fs3 = require("fs");
        const doc = this.doc;
        doc.pipe(inputStream);
        await this.renderItem(item, doc, headers, true);
        doc.save();
        doc.end();
      }
      setColors(ui, ctx) {
        if (ui.color.is_set) {
          this.text_color = ui.color.s_value;
        }
        if (ui.backgroundColor.is_set) {
          if (ui.opacity.is_set) {
            ctx.fillColor(ui.backgroundColor.s_value, ui.opacity.f_value);
            this.opacity_now = ui.opacity.f_value;
          } else {
            ctx.fillColor(ui.backgroundColor.s_value, this.opacity_now);
          }
        } else {
          ctx.fillColor("white", 0);
        }
        if (ui.borderWidth.is_set && ui.borderColor.is_set) {
          ctx.lineWidth(ui.borderWidth.pixels);
          if (ui.opacity.is_set) {
            ctx.strokeColor(ui.borderColor.s_value, ui.opacity.f_value);
          } else {
            ctx.strokeColor(ui.borderColor.s_value, this.opacity_now);
          }
        } else {
          ctx.strokeColor("white", 0).stroke();
        }
      }
      async renderItem(item, ctx, headers, is_first) {
        const old_opacity = this.opacity_now;
        const old_font = this.font_family;
        const old_color = this.text_color;
        if (item.opacity.is_set) {
          this.opacity_now = item.opacity.f_value;
        }
        ctx.fillOpacity(this.opacity_now);
        ctx.opacity(this.opacity_now);
        if (item.rotate.is_set) {
          ctx.rotate(item.rotate.f_value);
        }
        if (item.scale.is_set && item.scale.f_value > 0.01) {
          ctx.scale(item.scale.f_value);
        }
        if (item.fontFamily.is_set) {
          const font_file = item.findFont(item.fontFamily.s_value);
          if (font_file) {
            this.font_family = font_file;
          }
        }
        this.setColors(item, ctx);
        switch (item.tagName) {
          case "header":
          case "footer":
          case "div":
          case "View":
            const r = new View(item);
            await r.render(ctx);
            break;
          case "Label":
            const label = new Label(item);
            ctx.save();
            ctx.fillOpacity(this.opacity_now);
            ctx.fillColor(this.text_color);
            await label.render(ctx, this);
            ctx.restore();
            break;
          case "path":
            const path3 = new Path(item);
            await path3.render(ctx);
            break;
          case "img":
            const im = new Image(item);
            await im.render(ctx);
            break;
          case "QRCode":
            const qr = new QR_Code(item);
            await qr.render(ctx);
            break;
        }
        let page_y_pos = item.calculated.y;
        let page_item_cnt = 0;
        let top_margin = 0;
        let bottom_margin = 0;
        let y_adjust = 0;
        if (item.header) this.static_header = item.header;
        if (item.footer) this.static_footer = item.footer;
        const render_headers = async (item2) => {
          if (headers || this.static_header || this.static_footer) {
            const page_header = headers && headers[0] ? headers[0]() : this.static_header;
            const page_footer = headers && headers[1] ? headers[1]() : this.static_footer;
            if (page_header) {
              page_header.calculate(this.width, this.height, this);
              await this.renderItem(page_header, ctx);
              top_margin = page_header.calculated.render_height;
            }
            if (page_footer) {
              page_footer.calculate(this.width, this.height, this);
              ctx.translate(0, this.height - page_footer.calculated.render_height);
              await this.renderItem(page_footer, ctx);
              ctx.translate(
                0,
                -(this.height - page_footer.calculated.render_height)
              );
              bottom_margin = page_footer.calculated.render_height;
            }
            if (page_header) {
              ctx.translate(0, top_margin);
            }
          }
        };
        if (is_first) await render_headers(item[0]);
        const total_margin = bottom_margin + top_margin;
        const vertical_area = this.height - total_margin;
        for (let child of item.items) {
          if (is_first && page_item_cnt > 0 && (child.pageBreak.is_set || !child.left.is_set && !child.top.is_set && child.calculated.y + child.calculated.render_height - y_adjust > vertical_area)) {
            ctx.addPage();
            await render_headers(child);
            page_y_pos += this.height;
            page_item_cnt = 0;
            y_adjust = child.calculated.y;
          }
          const dx = child.calculated.x;
          const dy = child.calculated.y;
          ctx.translate(dx, dy - y_adjust);
          ctx.save();
          await this.renderItem(child, ctx);
          ctx.restore();
          ctx.translate(-dx, -dy + y_adjust);
          page_item_cnt++;
        }
        if (item.scale.is_set && item.scale.f_value > 0.01) {
          ctx.scale(1 / item.scale.f_value);
        }
        if (item.rotate.is_set) {
          ctx.rotate(-item.rotate.f_value);
        }
        this.opacity_now = old_opacity;
        this.font_family = old_font;
        this.text_color = old_color;
      }
    };
    Image = class {
      constructor(ui) {
        this.ui = ui;
      }
      initEngine() {
      }
      remove() {
      }
      render(ctx) {
        const ui = this.ui;
        const box = ui.calculated;
        if (ui.imageUrl.is_set) {
          ctx.fillOpacity(1);
          ctx.opacity(1);
          ctx.image(ui.imageUrl.s_value, 0, 0, {
            width: box.render_width,
            height: box.render_height
          });
        }
      }
    };
    QR_Code = class {
      constructor(ui) {
        this.ui = ui;
      }
      initEngine() {
      }
      remove() {
      }
      async render(ctx) {
        const ui = this.ui;
        const box = ui.calculated;
        if (ui.text.is_set) {
          const url = await QRCode.toDataURL(ui.text.s_value);
          ctx.fillOpacity(1);
          ctx.opacity(1);
          ctx.image(url, 0, 0, {
            width: box.render_width,
            height: box.render_height
          });
        }
      }
    };
    View = class {
      constructor(ui) {
        this.ui = ui;
      }
      initEngine() {
      }
      remove() {
      }
      render(ctx) {
        const ui = this.ui;
        const box = ui.calculated;
        if (ui.borderRadius.is_set) {
          ctx.roundedRect(
            0,
            0,
            box.render_width,
            box.render_height,
            ui.borderRadius.pixels
          );
        } else {
          ctx.rect(0, 0, box.render_width, box.render_height);
        }
        if (ui.overflow.is_set) {
          if (ui.overflow.s_value === "hidden") {
            ctx.clip();
            if (ui.borderRadius.is_set) {
              ctx.roundedRect(
                0,
                0,
                box.render_width,
                box.render_height,
                ui.borderRadius.pixels
              );
            } else {
              ctx.rect(0, 0, box.render_width, box.render_height);
            }
          }
        }
        ctx.fillAndStroke();
      }
    };
    Label = class {
      constructor(ui) {
        this.ui = ui;
      }
      initEngine() {
      }
      remove() {
      }
      render(ctx, r) {
        const ui = this.ui;
        const box = ui.calculated;
        if (ui.fontFamily.is_set) {
          const font_file = ui.findFont(ui.fontFamily.s_value);
          if (font_file) {
            ctx.font(font_file);
          } else {
            ctx.font(r.font_family);
          }
        } else {
          ctx.font(r.font_family);
        }
        if (ui.fontSize.is_set) {
          ctx.fontSize(ui.fontSize.pixels);
        } else {
          ctx.fontSize(12);
        }
        ctx.text(ui.text.s_value, 0, -3, {
          lineGap: 0,
          paragraphGap: 0
        });
      }
    };
    Path = class {
      constructor(ui) {
        this.ui = ui;
      }
      initEngine() {
      }
      remove() {
      }
      render(ctx) {
        const ui = this.ui;
        const parser = new EVGPathParser();
        const coll = new PathScaler();
        parser.parsePath(ui.svgPath.s_value, coll);
        const svgStr = coll.getString(
          ui.calculated.render_width,
          ui.calculated.render_height
        );
        ctx.path(svgStr);
        if (ui.overflow.is_set) {
          if (ui.overflow.s_value === "hidden") {
            ctx.clip();
            ctx.path(svgStr);
          }
        }
        ctx.fill().stroke();
      }
    };
  }
});

// node_modules/@xmldom/xmldom/lib/conventions.js
var require_conventions = __commonJS({
  "node_modules/@xmldom/xmldom/lib/conventions.js"(exports2) {
    "use strict";
    function find(list, predicate, ac) {
      if (ac === void 0) {
        ac = Array.prototype;
      }
      if (list && typeof ac.find === "function") {
        return ac.find.call(list, predicate);
      }
      for (var i = 0; i < list.length; i++) {
        if (hasOwn(list, i)) {
          var item = list[i];
          if (predicate.call(void 0, item, i, list)) {
            return item;
          }
        }
      }
    }
    function freeze(object, oc) {
      if (oc === void 0) {
        oc = Object;
      }
      if (oc && typeof oc.getOwnPropertyDescriptors === "function") {
        object = oc.create(null, oc.getOwnPropertyDescriptors(object));
      }
      return oc && typeof oc.freeze === "function" ? oc.freeze(object) : object;
    }
    function hasOwn(object, key) {
      return Object.prototype.hasOwnProperty.call(object, key);
    }
    function assign(target, source) {
      if (target === null || typeof target !== "object") {
        throw new TypeError("target is not an object");
      }
      for (var key in source) {
        if (hasOwn(source, key)) {
          target[key] = source[key];
        }
      }
      return target;
    }
    var HTML_BOOLEAN_ATTRIBUTES = freeze({
      allowfullscreen: true,
      async: true,
      autofocus: true,
      autoplay: true,
      checked: true,
      controls: true,
      default: true,
      defer: true,
      disabled: true,
      formnovalidate: true,
      hidden: true,
      ismap: true,
      itemscope: true,
      loop: true,
      multiple: true,
      muted: true,
      nomodule: true,
      novalidate: true,
      open: true,
      playsinline: true,
      readonly: true,
      required: true,
      reversed: true,
      selected: true
    });
    function isHTMLBooleanAttribute(name) {
      return hasOwn(HTML_BOOLEAN_ATTRIBUTES, name.toLowerCase());
    }
    var HTML_VOID_ELEMENTS = freeze({
      area: true,
      base: true,
      br: true,
      col: true,
      embed: true,
      hr: true,
      img: true,
      input: true,
      link: true,
      meta: true,
      param: true,
      source: true,
      track: true,
      wbr: true
    });
    function isHTMLVoidElement(tagName) {
      return hasOwn(HTML_VOID_ELEMENTS, tagName.toLowerCase());
    }
    var HTML_RAW_TEXT_ELEMENTS = freeze({
      script: false,
      style: false,
      textarea: true,
      title: true
    });
    function isHTMLRawTextElement(tagName) {
      var key = tagName.toLowerCase();
      return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && !HTML_RAW_TEXT_ELEMENTS[key];
    }
    function isHTMLEscapableRawTextElement(tagName) {
      var key = tagName.toLowerCase();
      return hasOwn(HTML_RAW_TEXT_ELEMENTS, key) && HTML_RAW_TEXT_ELEMENTS[key];
    }
    function isHTMLMimeType(mimeType) {
      return mimeType === MIME_TYPE.HTML;
    }
    function hasDefaultHTMLNamespace(mimeType) {
      return isHTMLMimeType(mimeType) || mimeType === MIME_TYPE.XML_XHTML_APPLICATION;
    }
    var MIME_TYPE = freeze({
      /**
       * `text/html`, the only mime type that triggers treating an XML document as HTML.
       *
       * @see https://www.iana.org/assignments/media-types/text/html IANA MimeType registration
       * @see https://en.wikipedia.org/wiki/HTML Wikipedia
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString MDN
       * @see https://html.spec.whatwg.org/multipage/dynamic-markup-insertion.html#dom-domparser-parsefromstring
       *      WHATWG HTML Spec
       */
      HTML: "text/html",
      /**
       * `application/xml`, the standard mime type for XML documents.
       *
       * @see https://www.iana.org/assignments/media-types/application/xml IANA MimeType
       *      registration
       * @see https://tools.ietf.org/html/rfc7303#section-9.1 RFC 7303
       * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
       */
      XML_APPLICATION: "application/xml",
      /**
       * `text/xml`, an alias for `application/xml`.
       *
       * @see https://tools.ietf.org/html/rfc7303#section-9.2 RFC 7303
       * @see https://www.iana.org/assignments/media-types/text/xml IANA MimeType registration
       * @see https://en.wikipedia.org/wiki/XML_and_MIME Wikipedia
       */
      XML_TEXT: "text/xml",
      /**
       * `application/xhtml+xml`, indicates an XML document that has the default HTML namespace,
       * but is parsed as an XML document.
       *
       * @see https://www.iana.org/assignments/media-types/application/xhtml+xml IANA MimeType
       *      registration
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument WHATWG DOM Spec
       * @see https://en.wikipedia.org/wiki/XHTML Wikipedia
       */
      XML_XHTML_APPLICATION: "application/xhtml+xml",
      /**
       * `image/svg+xml`,
       *
       * @see https://www.iana.org/assignments/media-types/image/svg+xml IANA MimeType registration
       * @see https://www.w3.org/TR/SVG11/ W3C SVG 1.1
       * @see https://en.wikipedia.org/wiki/Scalable_Vector_Graphics Wikipedia
       */
      XML_SVG_IMAGE: "image/svg+xml"
    });
    var _MIME_TYPES = Object.keys(MIME_TYPE).map(function(key) {
      return MIME_TYPE[key];
    });
    function isValidMimeType(mimeType) {
      return _MIME_TYPES.indexOf(mimeType) > -1;
    }
    var NAMESPACE = freeze({
      /**
       * The XHTML namespace.
       *
       * @see http://www.w3.org/1999/xhtml
       */
      HTML: "http://www.w3.org/1999/xhtml",
      /**
       * The SVG namespace.
       *
       * @see http://www.w3.org/2000/svg
       */
      SVG: "http://www.w3.org/2000/svg",
      /**
       * The `xml:` namespace.
       *
       * @see http://www.w3.org/XML/1998/namespace
       */
      XML: "http://www.w3.org/XML/1998/namespace",
      /**
       * The `xmlns:` namespace.
       *
       * @see https://www.w3.org/2000/xmlns/
       */
      XMLNS: "http://www.w3.org/2000/xmlns/"
    });
    exports2.assign = assign;
    exports2.find = find;
    exports2.freeze = freeze;
    exports2.HTML_BOOLEAN_ATTRIBUTES = HTML_BOOLEAN_ATTRIBUTES;
    exports2.HTML_RAW_TEXT_ELEMENTS = HTML_RAW_TEXT_ELEMENTS;
    exports2.HTML_VOID_ELEMENTS = HTML_VOID_ELEMENTS;
    exports2.hasDefaultHTMLNamespace = hasDefaultHTMLNamespace;
    exports2.hasOwn = hasOwn;
    exports2.isHTMLBooleanAttribute = isHTMLBooleanAttribute;
    exports2.isHTMLRawTextElement = isHTMLRawTextElement;
    exports2.isHTMLEscapableRawTextElement = isHTMLEscapableRawTextElement;
    exports2.isHTMLMimeType = isHTMLMimeType;
    exports2.isHTMLVoidElement = isHTMLVoidElement;
    exports2.isValidMimeType = isValidMimeType;
    exports2.MIME_TYPE = MIME_TYPE;
    exports2.NAMESPACE = NAMESPACE;
  }
});

// node_modules/@xmldom/xmldom/lib/errors.js
var require_errors = __commonJS({
  "node_modules/@xmldom/xmldom/lib/errors.js"(exports2) {
    "use strict";
    var conventions = require_conventions();
    function extendError(constructor, writableName) {
      constructor.prototype = Object.create(Error.prototype, {
        constructor: { value: constructor },
        name: { value: constructor.name, enumerable: true, writable: writableName }
      });
    }
    var DOMExceptionName = conventions.freeze({
      /**
       * the default value as defined by the spec
       */
      Error: "Error",
      /**
       * @deprecated
       * Use RangeError instead.
       */
      IndexSizeError: "IndexSizeError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      DomstringSizeError: "DomstringSizeError",
      HierarchyRequestError: "HierarchyRequestError",
      WrongDocumentError: "WrongDocumentError",
      InvalidCharacterError: "InvalidCharacterError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      NoDataAllowedError: "NoDataAllowedError",
      NoModificationAllowedError: "NoModificationAllowedError",
      NotFoundError: "NotFoundError",
      NotSupportedError: "NotSupportedError",
      InUseAttributeError: "InUseAttributeError",
      InvalidStateError: "InvalidStateError",
      SyntaxError: "SyntaxError",
      InvalidModificationError: "InvalidModificationError",
      NamespaceError: "NamespaceError",
      /**
       * @deprecated
       * Use TypeError for invalid arguments,
       * "NotSupportedError" DOMException for unsupported operations,
       * and "NotAllowedError" DOMException for denied requests instead.
       */
      InvalidAccessError: "InvalidAccessError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      ValidationError: "ValidationError",
      /**
       * @deprecated
       * Use TypeError instead.
       */
      TypeMismatchError: "TypeMismatchError",
      SecurityError: "SecurityError",
      NetworkError: "NetworkError",
      AbortError: "AbortError",
      /**
       * @deprecated
       * Just to match the related static code, not part of the spec.
       */
      URLMismatchError: "URLMismatchError",
      QuotaExceededError: "QuotaExceededError",
      TimeoutError: "TimeoutError",
      InvalidNodeTypeError: "InvalidNodeTypeError",
      DataCloneError: "DataCloneError",
      EncodingError: "EncodingError",
      NotReadableError: "NotReadableError",
      UnknownError: "UnknownError",
      ConstraintError: "ConstraintError",
      DataError: "DataError",
      TransactionInactiveError: "TransactionInactiveError",
      ReadOnlyError: "ReadOnlyError",
      VersionError: "VersionError",
      OperationError: "OperationError",
      NotAllowedError: "NotAllowedError",
      OptOutError: "OptOutError"
    });
    var DOMExceptionNames = Object.keys(DOMExceptionName);
    function isValidDomExceptionCode(value) {
      return typeof value === "number" && value >= 1 && value <= 25;
    }
    function endsWithError(value) {
      return typeof value === "string" && value.substring(value.length - DOMExceptionName.Error.length) === DOMExceptionName.Error;
    }
    function DOMException(messageOrCode, nameOrMessage) {
      if (isValidDomExceptionCode(messageOrCode)) {
        this.name = DOMExceptionNames[messageOrCode];
        this.message = nameOrMessage || "";
      } else {
        this.message = messageOrCode;
        this.name = endsWithError(nameOrMessage) ? nameOrMessage : DOMExceptionName.Error;
      }
      if (Error.captureStackTrace) Error.captureStackTrace(this, DOMException);
    }
    extendError(DOMException, true);
    Object.defineProperties(DOMException.prototype, {
      code: {
        enumerable: true,
        get: function() {
          var code = DOMExceptionNames.indexOf(this.name);
          if (isValidDomExceptionCode(code)) return code;
          return 0;
        }
      }
    });
    var ExceptionCode = {
      INDEX_SIZE_ERR: 1,
      DOMSTRING_SIZE_ERR: 2,
      HIERARCHY_REQUEST_ERR: 3,
      WRONG_DOCUMENT_ERR: 4,
      INVALID_CHARACTER_ERR: 5,
      NO_DATA_ALLOWED_ERR: 6,
      NO_MODIFICATION_ALLOWED_ERR: 7,
      NOT_FOUND_ERR: 8,
      NOT_SUPPORTED_ERR: 9,
      INUSE_ATTRIBUTE_ERR: 10,
      INVALID_STATE_ERR: 11,
      SYNTAX_ERR: 12,
      INVALID_MODIFICATION_ERR: 13,
      NAMESPACE_ERR: 14,
      INVALID_ACCESS_ERR: 15,
      VALIDATION_ERR: 16,
      TYPE_MISMATCH_ERR: 17,
      SECURITY_ERR: 18,
      NETWORK_ERR: 19,
      ABORT_ERR: 20,
      URL_MISMATCH_ERR: 21,
      QUOTA_EXCEEDED_ERR: 22,
      TIMEOUT_ERR: 23,
      INVALID_NODE_TYPE_ERR: 24,
      DATA_CLONE_ERR: 25
    };
    var entries = Object.entries(ExceptionCode);
    for (i = 0; i < entries.length; i++) {
      key = entries[i][0];
      DOMException[key] = entries[i][1];
    }
    var key;
    var i;
    function ParseError(message, locator) {
      this.message = message;
      this.locator = locator;
      if (Error.captureStackTrace) Error.captureStackTrace(this, ParseError);
    }
    extendError(ParseError);
    exports2.DOMException = DOMException;
    exports2.DOMExceptionName = DOMExceptionName;
    exports2.ExceptionCode = ExceptionCode;
    exports2.ParseError = ParseError;
  }
});

// node_modules/@xmldom/xmldom/lib/grammar.js
var require_grammar = __commonJS({
  "node_modules/@xmldom/xmldom/lib/grammar.js"(exports2) {
    "use strict";
    function detectUnicodeSupport(RegExpImpl) {
      try {
        if (typeof RegExpImpl !== "function") {
          RegExpImpl = RegExp;
        }
        var match = new RegExpImpl("\u{1D306}", "u").exec("\u{1D306}");
        return !!match && match[0].length === 2;
      } catch (error) {
      }
      return false;
    }
    var UNICODE_SUPPORT = detectUnicodeSupport();
    function chars(regexp) {
      if (regexp.source[0] !== "[") {
        throw new Error(regexp + " can not be used with chars");
      }
      return regexp.source.slice(1, regexp.source.lastIndexOf("]"));
    }
    function chars_without(regexp, search) {
      if (regexp.source[0] !== "[") {
        throw new Error("/" + regexp.source + "/ can not be used with chars_without");
      }
      if (!search || typeof search !== "string") {
        throw new Error(JSON.stringify(search) + " is not a valid search");
      }
      if (regexp.source.indexOf(search) === -1) {
        throw new Error('"' + search + '" is not is /' + regexp.source + "/");
      }
      if (search === "-" && regexp.source.indexOf(search) !== 1) {
        throw new Error('"' + search + '" is not at the first postion of /' + regexp.source + "/");
      }
      return new RegExp(regexp.source.replace(search, ""), UNICODE_SUPPORT ? "u" : "");
    }
    function reg(args) {
      var self = this;
      return new RegExp(
        Array.prototype.slice.call(arguments).map(function(part) {
          var isStr = typeof part === "string";
          if (isStr && self === void 0 && part === "|") {
            throw new Error("use regg instead of reg to wrap expressions with `|`!");
          }
          return isStr ? part : part.source;
        }).join(""),
        UNICODE_SUPPORT ? "mu" : "m"
      );
    }
    function regg(args) {
      if (arguments.length === 0) {
        throw new Error("no parameters provided");
      }
      return reg.apply(regg, ["(?:"].concat(Array.prototype.slice.call(arguments), [")"]));
    }
    var UNICODE_REPLACEMENT_CHARACTER = "\uFFFD";
    var Char = /[-\x09\x0A\x0D\x20-\x2C\x2E-\uD7FF\uE000-\uFFFD]/;
    if (UNICODE_SUPPORT) {
      Char = reg("[", chars(Char), "\\u{10000}-\\u{10FFFF}", "]");
    }
    var _SChar = /[\x20\x09\x0D\x0A]/;
    var SChar_s = chars(_SChar);
    var S = reg(_SChar, "+");
    var S_OPT = reg(_SChar, "*");
    var NameStartChar = /[:_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]/;
    if (UNICODE_SUPPORT) {
      NameStartChar = reg("[", chars(NameStartChar), "\\u{10000}-\\u{10FFFF}", "]");
    }
    var NameStartChar_s = chars(NameStartChar);
    var NameChar = reg("[", NameStartChar_s, chars(/[-.0-9\xB7]/), chars(/[\u0300-\u036F\u203F-\u2040]/), "]");
    var Name = reg(NameStartChar, NameChar, "*");
    var Nmtoken = reg(NameChar, "+");
    var EntityRef = reg("&", Name, ";");
    var CharRef = regg(/&#[0-9]+;|&#x[0-9a-fA-F]+;/);
    var Reference = regg(EntityRef, "|", CharRef);
    var PEReference = reg("%", Name, ";");
    var EntityValue = regg(
      reg('"', regg(/[^%&"]/, "|", PEReference, "|", Reference), "*", '"'),
      "|",
      reg("'", regg(/[^%&']/, "|", PEReference, "|", Reference), "*", "'")
    );
    var AttValue = regg('"', regg(/[^<&"]/, "|", Reference), "*", '"', "|", "'", regg(/[^<&']/, "|", Reference), "*", "'");
    var NCNameStartChar = chars_without(NameStartChar, ":");
    var NCNameChar = chars_without(NameChar, ":");
    var NCName = reg(NCNameStartChar, NCNameChar, "*");
    var QName = reg(NCName, regg(":", NCName), "?");
    var QName_exact = reg("^", QName, "$");
    var QName_group = reg("(", QName, ")");
    var SystemLiteral = regg(/"[^"]*"|'[^']*'/);
    var PI = reg(/^<\?/, "(", Name, ")", regg(S, "(", Char, "*?)"), "?", /\?>/);
    var PubidChar = /[\x20\x0D\x0Aa-zA-Z0-9-'()+,./:=?;!*#@$_%]/;
    var PubidLiteral = regg('"', PubidChar, '*"', "|", "'", chars_without(PubidChar, "'"), "*'");
    var COMMENT_START = "<!--";
    var COMMENT_END = "-->";
    var Comment = reg(COMMENT_START, regg(chars_without(Char, "-"), "|", reg("-", chars_without(Char, "-"))), "*", COMMENT_END);
    var PCDATA = "#PCDATA";
    var Mixed = regg(
      reg(/\(/, S_OPT, PCDATA, regg(S_OPT, /\|/, S_OPT, QName), "*", S_OPT, /\)\*/),
      "|",
      reg(/\(/, S_OPT, PCDATA, S_OPT, /\)/)
    );
    var _children_quantity = /[?*+]?/;
    var children = reg(
      /\([^>]+\)/,
      _children_quantity
      /*regg(choice, '|', seq), _children_quantity*/
    );
    var contentspec = regg("EMPTY", "|", "ANY", "|", Mixed, "|", children);
    var ELEMENTDECL_START = "<!ELEMENT";
    var elementdecl = reg(ELEMENTDECL_START, S, regg(QName, "|", PEReference), S, regg(contentspec, "|", PEReference), S_OPT, ">");
    var NotationType = reg("NOTATION", S, /\(/, S_OPT, Name, regg(S_OPT, /\|/, S_OPT, Name), "*", S_OPT, /\)/);
    var Enumeration = reg(/\(/, S_OPT, Nmtoken, regg(S_OPT, /\|/, S_OPT, Nmtoken), "*", S_OPT, /\)/);
    var EnumeratedType = regg(NotationType, "|", Enumeration);
    var AttType = regg(/CDATA|ID|IDREF|IDREFS|ENTITY|ENTITIES|NMTOKEN|NMTOKENS/, "|", EnumeratedType);
    var DefaultDecl = regg(/#REQUIRED|#IMPLIED/, "|", regg(regg("#FIXED", S), "?", AttValue));
    var AttDef = regg(S, Name, S, AttType, S, DefaultDecl);
    var ATTLIST_DECL_START = "<!ATTLIST";
    var AttlistDecl = reg(ATTLIST_DECL_START, S, Name, AttDef, "*", S_OPT, ">");
    var ABOUT_LEGACY_COMPAT = "about:legacy-compat";
    var ABOUT_LEGACY_COMPAT_SystemLiteral = regg('"' + ABOUT_LEGACY_COMPAT + '"', "|", "'" + ABOUT_LEGACY_COMPAT + "'");
    var SYSTEM = "SYSTEM";
    var PUBLIC = "PUBLIC";
    var ExternalID = regg(regg(SYSTEM, S, SystemLiteral), "|", regg(PUBLIC, S, PubidLiteral, S, SystemLiteral));
    var ExternalID_match = reg(
      "^",
      regg(
        regg(SYSTEM, S, "(?<SystemLiteralOnly>", SystemLiteral, ")"),
        "|",
        regg(PUBLIC, S, "(?<PubidLiteral>", PubidLiteral, ")", S, "(?<SystemLiteral>", SystemLiteral, ")")
      )
    );
    var NDataDecl = regg(S, "NDATA", S, Name);
    var EntityDef = regg(EntityValue, "|", regg(ExternalID, NDataDecl, "?"));
    var ENTITY_DECL_START = "<!ENTITY";
    var GEDecl = reg(ENTITY_DECL_START, S, Name, S, EntityDef, S_OPT, ">");
    var PEDef = regg(EntityValue, "|", ExternalID);
    var PEDecl = reg(ENTITY_DECL_START, S, "%", S, Name, S, PEDef, S_OPT, ">");
    var EntityDecl = regg(GEDecl, "|", PEDecl);
    var PublicID = reg(PUBLIC, S, PubidLiteral);
    var NotationDecl = reg("<!NOTATION", S, Name, S, regg(ExternalID, "|", PublicID), S_OPT, ">");
    var Eq = reg(S_OPT, "=", S_OPT);
    var VersionNum = /1[.]\d+/;
    var VersionInfo = reg(S, "version", Eq, regg("'", VersionNum, "'", "|", '"', VersionNum, '"'));
    var EncName = /[A-Za-z][-A-Za-z0-9._]*/;
    var EncodingDecl = regg(S, "encoding", Eq, regg('"', EncName, '"', "|", "'", EncName, "'"));
    var SDDecl = regg(S, "standalone", Eq, regg("'", regg("yes", "|", "no"), "'", "|", '"', regg("yes", "|", "no"), '"'));
    var XMLDecl = reg(/^<\?xml/, VersionInfo, EncodingDecl, "?", SDDecl, "?", S_OPT, /\?>/);
    var DOCTYPE_DECL_START = "<!DOCTYPE";
    var CDATA_START = "<![CDATA[";
    var CDATA_END = "]]>";
    var CDStart = /<!\[CDATA\[/;
    var CDEnd = /\]\]>/;
    var CData = reg(Char, "*?", CDEnd);
    var CDSect = reg(CDStart, CData);
    exports2.chars = chars;
    exports2.chars_without = chars_without;
    exports2.detectUnicodeSupport = detectUnicodeSupport;
    exports2.reg = reg;
    exports2.regg = regg;
    exports2.ABOUT_LEGACY_COMPAT = ABOUT_LEGACY_COMPAT;
    exports2.ABOUT_LEGACY_COMPAT_SystemLiteral = ABOUT_LEGACY_COMPAT_SystemLiteral;
    exports2.AttlistDecl = AttlistDecl;
    exports2.CDATA_START = CDATA_START;
    exports2.CDATA_END = CDATA_END;
    exports2.CDSect = CDSect;
    exports2.Char = Char;
    exports2.Comment = Comment;
    exports2.COMMENT_START = COMMENT_START;
    exports2.COMMENT_END = COMMENT_END;
    exports2.DOCTYPE_DECL_START = DOCTYPE_DECL_START;
    exports2.elementdecl = elementdecl;
    exports2.EntityDecl = EntityDecl;
    exports2.EntityValue = EntityValue;
    exports2.ExternalID = ExternalID;
    exports2.ExternalID_match = ExternalID_match;
    exports2.Name = Name;
    exports2.NotationDecl = NotationDecl;
    exports2.Reference = Reference;
    exports2.PEReference = PEReference;
    exports2.PI = PI;
    exports2.PUBLIC = PUBLIC;
    exports2.PubidLiteral = PubidLiteral;
    exports2.QName = QName;
    exports2.QName_exact = QName_exact;
    exports2.QName_group = QName_group;
    exports2.S = S;
    exports2.SChar_s = SChar_s;
    exports2.S_OPT = S_OPT;
    exports2.SYSTEM = SYSTEM;
    exports2.SystemLiteral = SystemLiteral;
    exports2.UNICODE_REPLACEMENT_CHARACTER = UNICODE_REPLACEMENT_CHARACTER;
    exports2.UNICODE_SUPPORT = UNICODE_SUPPORT;
    exports2.XMLDecl = XMLDecl;
  }
});

// node_modules/@xmldom/xmldom/lib/dom.js
var require_dom = __commonJS({
  "node_modules/@xmldom/xmldom/lib/dom.js"(exports2) {
    "use strict";
    var conventions = require_conventions();
    var find = conventions.find;
    var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
    var hasOwn = conventions.hasOwn;
    var isHTMLMimeType = conventions.isHTMLMimeType;
    var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
    var isHTMLVoidElement = conventions.isHTMLVoidElement;
    var MIME_TYPE = conventions.MIME_TYPE;
    var NAMESPACE = conventions.NAMESPACE;
    var PDC = Symbol();
    var errors = require_errors();
    var DOMException = errors.DOMException;
    var DOMExceptionName = errors.DOMExceptionName;
    var g = require_grammar();
    function checkSymbol(symbol) {
      if (symbol !== PDC) {
        throw new TypeError("Illegal constructor");
      }
    }
    function notEmptyString(input) {
      return input !== "";
    }
    function splitOnASCIIWhitespace(input) {
      return input ? input.split(/[\t\n\f\r ]+/).filter(notEmptyString) : [];
    }
    function orderedSetReducer(current, element) {
      if (!hasOwn(current, element)) {
        current[element] = true;
      }
      return current;
    }
    function toOrderedSet(input) {
      if (!input) return [];
      var list = splitOnASCIIWhitespace(input);
      return Object.keys(list.reduce(orderedSetReducer, {}));
    }
    function arrayIncludes(list) {
      return function(element) {
        return list && list.indexOf(element) !== -1;
      };
    }
    function validateQualifiedName(qualifiedName) {
      if (!g.QName_exact.test(qualifiedName)) {
        throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'invalid character in qualified name "' + qualifiedName + '"');
      }
    }
    function validateAndExtract(namespace, qualifiedName) {
      validateQualifiedName(qualifiedName);
      namespace = namespace || null;
      var prefix = null;
      var localName = qualifiedName;
      if (qualifiedName.indexOf(":") >= 0) {
        var splitResult = qualifiedName.split(":");
        prefix = splitResult[0];
        localName = splitResult[1];
      }
      if (prefix !== null && namespace === null) {
        throw new DOMException(DOMException.NAMESPACE_ERR, "prefix is non-null and namespace is null");
      }
      if (prefix === "xml" && namespace !== conventions.NAMESPACE.XML) {
        throw new DOMException(DOMException.NAMESPACE_ERR, 'prefix is "xml" and namespace is not the XML namespace');
      }
      if ((prefix === "xmlns" || qualifiedName === "xmlns") && namespace !== conventions.NAMESPACE.XMLNS) {
        throw new DOMException(
          DOMException.NAMESPACE_ERR,
          'either qualifiedName or prefix is "xmlns" and namespace is not the XMLNS namespace'
        );
      }
      if (namespace === conventions.NAMESPACE.XMLNS && prefix !== "xmlns" && qualifiedName !== "xmlns") {
        throw new DOMException(
          DOMException.NAMESPACE_ERR,
          'namespace is the XMLNS namespace and neither qualifiedName nor prefix is "xmlns"'
        );
      }
      return [namespace, prefix, localName];
    }
    function copy(src, dest) {
      for (var p in src) {
        if (hasOwn(src, p)) {
          dest[p] = src[p];
        }
      }
    }
    function _extends(Class, Super) {
      var pt = Class.prototype;
      if (!(pt instanceof Super)) {
        let t = function() {
        };
        t.prototype = Super.prototype;
        t = new t();
        copy(pt, t);
        Class.prototype = pt = t;
      }
      if (pt.constructor != Class) {
        if (typeof Class != "function") {
          console.error("unknown Class:" + Class);
        }
        pt.constructor = Class;
      }
    }
    var NodeType = {};
    var ELEMENT_NODE = NodeType.ELEMENT_NODE = 1;
    var ATTRIBUTE_NODE = NodeType.ATTRIBUTE_NODE = 2;
    var TEXT_NODE = NodeType.TEXT_NODE = 3;
    var CDATA_SECTION_NODE = NodeType.CDATA_SECTION_NODE = 4;
    var ENTITY_REFERENCE_NODE = NodeType.ENTITY_REFERENCE_NODE = 5;
    var ENTITY_NODE = NodeType.ENTITY_NODE = 6;
    var PROCESSING_INSTRUCTION_NODE = NodeType.PROCESSING_INSTRUCTION_NODE = 7;
    var COMMENT_NODE = NodeType.COMMENT_NODE = 8;
    var DOCUMENT_NODE = NodeType.DOCUMENT_NODE = 9;
    var DOCUMENT_TYPE_NODE = NodeType.DOCUMENT_TYPE_NODE = 10;
    var DOCUMENT_FRAGMENT_NODE = NodeType.DOCUMENT_FRAGMENT_NODE = 11;
    var NOTATION_NODE = NodeType.NOTATION_NODE = 12;
    var DocumentPosition = conventions.freeze({
      DOCUMENT_POSITION_DISCONNECTED: 1,
      DOCUMENT_POSITION_PRECEDING: 2,
      DOCUMENT_POSITION_FOLLOWING: 4,
      DOCUMENT_POSITION_CONTAINS: 8,
      DOCUMENT_POSITION_CONTAINED_BY: 16,
      DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC: 32
    });
    function commonAncestor(a, b) {
      if (b.length < a.length) return commonAncestor(b, a);
      var c = null;
      for (var n in a) {
        if (a[n] !== b[n]) return c;
        c = a[n];
      }
      return c;
    }
    function docGUID(doc) {
      if (!doc.guid) doc.guid = Math.random();
      return doc.guid;
    }
    function NodeList() {
    }
    NodeList.prototype = {
      /**
       * The number of nodes in the list. The range of valid child node indices is 0 to length-1
       * inclusive.
       *
       * @type {number}
       */
      length: 0,
      /**
       * Returns the item at `index`. If index is greater than or equal to the number of nodes in
       * the list, this returns null.
       *
       * @param index
       * Unsigned long Index into the collection.
       * @returns {Node | null}
       * The node at position `index` in the NodeList,
       * or null if that is not a valid index.
       */
      item: function(index) {
        return index >= 0 && index < this.length ? this[index] : null;
      },
      /**
       * Returns a string representation of the NodeList.
       *
       * @param {unknown} nodeFilter
       * __A filter function? Not implemented according to the spec?__.
       * @returns {string}
       * A string representation of the NodeList.
       */
      toString: function(nodeFilter) {
        for (var buf = [], i = 0; i < this.length; i++) {
          serializeToString(this[i], buf, nodeFilter);
        }
        return buf.join("");
      },
      /**
       * Filters the NodeList based on a predicate.
       *
       * @param {function(Node): boolean} predicate
       * - A predicate function to filter the NodeList.
       * @returns {Node[]}
       * An array of nodes that satisfy the predicate.
       * @private
       */
      filter: function(predicate) {
        return Array.prototype.filter.call(this, predicate);
      },
      /**
       * Returns the first index at which a given node can be found in the NodeList, or -1 if it is
       * not present.
       *
       * @param {Node} item
       * - The Node item to locate in the NodeList.
       * @returns {number}
       * The first index of the node in the NodeList; -1 if not found.
       * @private
       */
      indexOf: function(item) {
        return Array.prototype.indexOf.call(this, item);
      }
    };
    NodeList.prototype[Symbol.iterator] = function() {
      var me = this;
      var index = 0;
      return {
        next: function() {
          if (index < me.length) {
            return {
              value: me[index++],
              done: false
            };
          } else {
            return {
              done: true
            };
          }
        },
        return: function() {
          return {
            done: true
          };
        }
      };
    };
    function LiveNodeList(node, refresh) {
      this._node = node;
      this._refresh = refresh;
      _updateLiveList(this);
    }
    function _updateLiveList(list) {
      var inc = list._node._inc || list._node.ownerDocument._inc;
      if (list._inc !== inc) {
        var ls = list._refresh(list._node);
        __set__(list, "length", ls.length);
        if (!list.$$length || ls.length < list.$$length) {
          for (var i = ls.length; i in list; i++) {
            if (hasOwn(list, i)) {
              delete list[i];
            }
          }
        }
        copy(ls, list);
        list._inc = inc;
      }
    }
    LiveNodeList.prototype.item = function(i) {
      _updateLiveList(this);
      return this[i] || null;
    };
    _extends(LiveNodeList, NodeList);
    function NamedNodeMap() {
    }
    function _findNodeIndex(list, node) {
      var i = 0;
      while (i < list.length) {
        if (list[i] === node) {
          return i;
        }
        i++;
      }
    }
    function _addNamedNode(el, list, newAttr, oldAttr) {
      if (oldAttr) {
        list[_findNodeIndex(list, oldAttr)] = newAttr;
      } else {
        list[list.length] = newAttr;
        list.length++;
      }
      if (el) {
        newAttr.ownerElement = el;
        var doc = el.ownerDocument;
        if (doc) {
          oldAttr && _onRemoveAttribute(doc, el, oldAttr);
          _onAddAttribute(doc, el, newAttr);
        }
      }
    }
    function _removeNamedNode(el, list, attr) {
      var i = _findNodeIndex(list, attr);
      if (i >= 0) {
        var lastIndex = list.length - 1;
        while (i <= lastIndex) {
          list[i] = list[++i];
        }
        list.length = lastIndex;
        if (el) {
          var doc = el.ownerDocument;
          if (doc) {
            _onRemoveAttribute(doc, el, attr);
          }
          attr.ownerElement = null;
        }
      }
    }
    NamedNodeMap.prototype = {
      length: 0,
      item: NodeList.prototype.item,
      /**
       * Get an attribute by name. Note: Name is in lower case in case of HTML namespace and
       * document.
       *
       * @param {string} localName
       * The local name of the attribute.
       * @returns {Attr | null}
       * The attribute with the given local name, or null if no such attribute exists.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-get-by-name
       */
      getNamedItem: function(localName) {
        if (this._ownerElement && this._ownerElement._isInHTMLDocumentAndNamespace()) {
          localName = localName.toLowerCase();
        }
        var i = 0;
        while (i < this.length) {
          var attr = this[i];
          if (attr.nodeName === localName) {
            return attr;
          }
          i++;
        }
        return null;
      },
      /**
       * Set an attribute.
       *
       * @param {Attr} attr
       * The attribute to set.
       * @returns {Attr | null}
       * The old attribute with the same local name and namespace URI as the new one, or null if no
       * such attribute exists.
       * @throws {DOMException}
       * With code:
       * - {@link INUSE_ATTRIBUTE_ERR} - If the attribute is already an attribute of another
       * element.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-set
       */
      setNamedItem: function(attr) {
        var el = attr.ownerElement;
        if (el && el !== this._ownerElement) {
          throw new DOMException(DOMException.INUSE_ATTRIBUTE_ERR);
        }
        var oldAttr = this.getNamedItemNS(attr.namespaceURI, attr.localName);
        if (oldAttr === attr) {
          return attr;
        }
        _addNamedNode(this._ownerElement, this, attr, oldAttr);
        return oldAttr;
      },
      /**
       * Set an attribute, replacing an existing attribute with the same local name and namespace
       * URI if one exists.
       *
       * @param {Attr} attr
       * The attribute to set.
       * @returns {Attr | null}
       * The old attribute with the same local name and namespace URI as the new one, or null if no
       * such attribute exists.
       * @throws {DOMException}
       * Throws a DOMException with the name "InUseAttributeError" if the attribute is already an
       * attribute of another element.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-set
       */
      setNamedItemNS: function(attr) {
        return this.setNamedItem(attr);
      },
      /**
       * Removes an attribute specified by the local name.
       *
       * @param {string} localName
       * The local name of the attribute to be removed.
       * @returns {Attr}
       * The attribute node that was removed.
       * @throws {DOMException}
       * With code:
       * - {@link DOMException.NOT_FOUND_ERR} if no attribute with the given name is found.
       * @see https://dom.spec.whatwg.org/#dom-namednodemap-removenameditem
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-remove-by-name
       */
      removeNamedItem: function(localName) {
        var attr = this.getNamedItem(localName);
        if (!attr) {
          throw new DOMException(DOMException.NOT_FOUND_ERR, localName);
        }
        _removeNamedNode(this._ownerElement, this, attr);
        return attr;
      },
      /**
       * Removes an attribute specified by the namespace and local name.
       *
       * @param {string | null} namespaceURI
       * The namespace URI of the attribute to be removed.
       * @param {string} localName
       * The local name of the attribute to be removed.
       * @returns {Attr}
       * The attribute node that was removed.
       * @throws {DOMException}
       * With code:
       * - {@link DOMException.NOT_FOUND_ERR} if no attribute with the given namespace URI and local
       * name is found.
       * @see https://dom.spec.whatwg.org/#dom-namednodemap-removenameditemns
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-remove-by-namespace
       */
      removeNamedItemNS: function(namespaceURI, localName) {
        var attr = this.getNamedItemNS(namespaceURI, localName);
        if (!attr) {
          throw new DOMException(DOMException.NOT_FOUND_ERR, namespaceURI ? namespaceURI + " : " + localName : localName);
        }
        _removeNamedNode(this._ownerElement, this, attr);
        return attr;
      },
      /**
       * Get an attribute by namespace and local name.
       *
       * @param {string | null} namespaceURI
       * The namespace URI of the attribute.
       * @param {string} localName
       * The local name of the attribute.
       * @returns {Attr | null}
       * The attribute with the given namespace URI and local name, or null if no such attribute
       * exists.
       * @see https://dom.spec.whatwg.org/#concept-element-attributes-get-by-namespace
       */
      getNamedItemNS: function(namespaceURI, localName) {
        if (!namespaceURI) {
          namespaceURI = null;
        }
        var i = 0;
        while (i < this.length) {
          var node = this[i];
          if (node.localName === localName && node.namespaceURI === namespaceURI) {
            return node;
          }
          i++;
        }
        return null;
      }
    };
    NamedNodeMap.prototype[Symbol.iterator] = function() {
      var me = this;
      var index = 0;
      return {
        next: function() {
          if (index < me.length) {
            return {
              value: me[index++],
              done: false
            };
          } else {
            return {
              done: true
            };
          }
        },
        return: function() {
          return {
            done: true
          };
        }
      };
    };
    function DOMImplementation() {
    }
    DOMImplementation.prototype = {
      /**
       * Test if the DOM implementation implements a specific feature and version, as specified in
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/core.html#DOMFeatures DOM Features}.
       *
       * The DOMImplementation.hasFeature() method returns a Boolean flag indicating if a given
       * feature is supported. The different implementations fairly diverged in what kind of
       * features were reported. The latest version of the spec settled to force this method to
       * always return true, where the functionality was accurate and in use.
       *
       * @deprecated
       * It is deprecated and modern browsers return true in all cases.
       * @function DOMImplementation#hasFeature
       * @param {string} feature
       * The name of the feature to test.
       * @param {string} [version]
       * This is the version number of the feature to test.
       * @returns {boolean}
       * Always returns true.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/hasFeature MDN
       * @see https://www.w3.org/TR/REC-DOM-Level-1/level-one-core.html#ID-5CED94D7 DOM Level 1 Core
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-hasfeature DOM Living Standard
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-5CED94D7 DOM Level 3 Core
       */
      hasFeature: function(feature, version) {
        return true;
      },
      /**
       * Creates a DOM Document object of the specified type with its document element. Note that
       * based on the {@link DocumentType}
       * given to create the document, the implementation may instantiate specialized
       * {@link Document} objects that support additional features than the "Core", such as "HTML"
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#DOM2HTML DOM Level 2 HTML}.
       * On the other hand, setting the {@link DocumentType} after the document was created makes
       * this very unlikely to happen. Alternatively, specialized {@link Document} creation methods,
       * such as createHTMLDocument
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#DOM2HTML DOM Level 2 HTML},
       * can be used to obtain specific types of {@link Document} objects.
       *
       * __It behaves slightly different from the description in the living standard__:
       * - There is no interface/class `XMLDocument`, it returns a `Document`
       * instance (with it's `type` set to `'xml'`).
       * - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
       *
       * @function DOMImplementation.createDocument
       * @param {string | null} namespaceURI
       * The
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-namespaceURI namespace URI}
       * of the document element to create or null.
       * @param {string | null} qualifiedName
       * The
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-qualifiedname qualified name}
       * of the document element to be created or null.
       * @param {DocumentType | null} [doctype=null]
       * The type of document to be created or null. When doctype is not null, its
       * {@link Node#ownerDocument} attribute is set to the document being created. Default is
       * `null`
       * @returns {Document}
       * A new {@link Document} object with its document element. If the NamespaceURI,
       * qualifiedName, and doctype are null, the returned {@link Document} is empty with no
       * document element.
       * @throws {DOMException}
       * With code:
       *
       * - `INVALID_CHARACTER_ERR`: Raised if the specified qualified name is not an XML name
       * according to {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#XML XML 1.0}.
       * - `NAMESPACE_ERR`: Raised if the qualifiedName is malformed, if the qualifiedName has a
       * prefix and the namespaceURI is null, or if the qualifiedName is null and the namespaceURI
       * is different from null, or if the qualifiedName has a prefix that is "xml" and the
       * namespaceURI is different from "{@link http://www.w3.org/XML/1998/namespace}"
       * {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#Namespaces XML Namespaces},
       * or if the DOM implementation does not support the "XML" feature but a non-null namespace
       * URI was provided, since namespaces were defined by XML.
       * - `WRONG_DOCUMENT_ERR`: Raised if doctype has already been used with a different document
       * or was created from a different implementation.
       * - `NOT_SUPPORTED_ERR`: May be raised if the implementation does not support the feature
       * "XML" and the language exposed through the Document does not support XML Namespaces (such
       * as {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#HTML40 HTML 4.01}).
       * @since DOM Level 2.
       * @see {@link #createHTMLDocument}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocument MDN
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocument DOM Living Standard
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Level-2-Core-DOM-createDocument DOM
       *      Level 3 Core
       * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocument DOM
       *      Level 2 Core (initial)
       */
      createDocument: function(namespaceURI, qualifiedName, doctype) {
        var contentType = MIME_TYPE.XML_APPLICATION;
        if (namespaceURI === NAMESPACE.HTML) {
          contentType = MIME_TYPE.XML_XHTML_APPLICATION;
        } else if (namespaceURI === NAMESPACE.SVG) {
          contentType = MIME_TYPE.XML_SVG_IMAGE;
        }
        var doc = new Document(PDC, { contentType });
        doc.implementation = this;
        doc.childNodes = new NodeList();
        doc.doctype = doctype || null;
        if (doctype) {
          doc.appendChild(doctype);
        }
        if (qualifiedName) {
          var root = doc.createElementNS(namespaceURI, qualifiedName);
          doc.appendChild(root);
        }
        return doc;
      },
      /**
       * Creates an empty DocumentType node. Entity declarations and notations are not made
       * available. Entity reference expansions and default attribute additions do not occur.
       *
       * **This behavior is slightly different from the one in the specs**:
       * - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
       * - `publicId` and `systemId` contain the raw data including any possible quotes,
       *   so they can always be serialized back to the original value
       * - `internalSubset` contains the raw string between `[` and `]` if present,
       *   but is not parsed or validated in any form.
       *
       * @function DOMImplementation#createDocumentType
       * @param {string} qualifiedName
       * The {@link https://www.w3.org/TR/DOM-Level-3-Core/glossary.html#dt-qualifiedname qualified
       * name} of the document type to be created.
       * @param {string} [publicId]
       * The external subset public identifier.
       * @param {string} [systemId]
       * The external subset system identifier.
       * @param {string} [internalSubset]
       * the internal subset or an empty string if it is not present
       * @returns {DocumentType}
       * A new {@link DocumentType} node with {@link Node#ownerDocument} set to null.
       * @throws {DOMException}
       * With code:
       *
       * - `INVALID_CHARACTER_ERR`: Raised if the specified qualified name is not an XML name
       * according to {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#XML XML 1.0}.
       * - `NAMESPACE_ERR`: Raised if the qualifiedName is malformed.
       * - `NOT_SUPPORTED_ERR`: May be raised if the implementation does not support the feature
       * "XML" and the language exposed through the Document does not support XML Namespaces (such
       * as {@link https://www.w3.org/TR/DOM-Level-3-Core/references.html#HTML40 HTML 4.01}).
       * @since DOM Level 2.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMImplementation/createDocumentType
       *      MDN
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createdocumenttype DOM Living
       *      Standard
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Level-3-Core-DOM-createDocType DOM
       *      Level 3 Core
       * @see https://www.w3.org/TR/DOM-Level-2-Core/core.html#Level-2-Core-DOM-createDocType DOM
       *      Level 2 Core
       * @see https://github.com/xmldom/xmldom/blob/master/CHANGELOG.md#050
       * @see https://www.w3.org/TR/DOM-Level-2-Core/#core-ID-Core-DocType-internalSubset
       * @prettierignore
       */
      createDocumentType: function(qualifiedName, publicId, systemId, internalSubset) {
        validateQualifiedName(qualifiedName);
        var node = new DocumentType(PDC);
        node.name = qualifiedName;
        node.nodeName = qualifiedName;
        node.publicId = publicId || "";
        node.systemId = systemId || "";
        node.internalSubset = internalSubset || "";
        node.childNodes = new NodeList();
        return node;
      },
      /**
       * Returns an HTML document, that might already have a basic DOM structure.
       *
       * __It behaves slightly different from the description in the living standard__:
       * - If the first argument is `false` no initial nodes are added (steps 3-7 in the specs are
       * omitted)
       * - `encoding`, `mode`, `origin`, `url` fields are currently not declared.
       *
       * @param {string | false} [title]
       * A string containing the title to give the new HTML document.
       * @returns {Document}
       * The HTML document.
       * @since WHATWG Living Standard.
       * @see {@link #createDocument}
       * @see https://dom.spec.whatwg.org/#dom-domimplementation-createhtmldocument
       * @see https://dom.spec.whatwg.org/#html-document
       */
      createHTMLDocument: function(title) {
        var doc = new Document(PDC, { contentType: MIME_TYPE.HTML });
        doc.implementation = this;
        doc.childNodes = new NodeList();
        if (title !== false) {
          doc.doctype = this.createDocumentType("html");
          doc.doctype.ownerDocument = doc;
          doc.appendChild(doc.doctype);
          var htmlNode = doc.createElement("html");
          doc.appendChild(htmlNode);
          var headNode = doc.createElement("head");
          htmlNode.appendChild(headNode);
          if (typeof title === "string") {
            var titleNode = doc.createElement("title");
            titleNode.appendChild(doc.createTextNode(title));
            headNode.appendChild(titleNode);
          }
          htmlNode.appendChild(doc.createElement("body"));
        }
        return doc;
      }
    };
    function Node(symbol) {
      checkSymbol(symbol);
    }
    Node.prototype = {
      /**
       * The first child of this node.
       *
       * @type {Node | null}
       */
      firstChild: null,
      /**
       * The last child of this node.
       *
       * @type {Node | null}
       */
      lastChild: null,
      /**
       * The previous sibling of this node.
       *
       * @type {Node | null}
       */
      previousSibling: null,
      /**
       * The next sibling of this node.
       *
       * @type {Node | null}
       */
      nextSibling: null,
      /**
       * The parent node of this node.
       *
       * @type {Node | null}
       */
      parentNode: null,
      /**
       * The parent element of this node.
       *
       * @type {Element | null}
       */
      get parentElement() {
        return this.parentNode && this.parentNode.nodeType === this.ELEMENT_NODE ? this.parentNode : null;
      },
      /**
       * The child nodes of this node.
       *
       * @type {NodeList}
       */
      childNodes: null,
      /**
       * The document object associated with this node.
       *
       * @type {Document | null}
       */
      ownerDocument: null,
      /**
       * The value of this node.
       *
       * @type {string | null}
       */
      nodeValue: null,
      /**
       * The namespace URI of this node.
       *
       * @type {string | null}
       */
      namespaceURI: null,
      /**
       * The prefix of the namespace for this node.
       *
       * @type {string | null}
       */
      prefix: null,
      /**
       * The local part of the qualified name of this node.
       *
       * @type {string | null}
       */
      localName: null,
      /**
       * The baseURI is currently always `about:blank`,
       * since that's what happens when you create a document from scratch.
       *
       * @type {'about:blank'}
       */
      baseURI: "about:blank",
      /**
       * Is true if this node is part of a document.
       *
       * @type {boolean}
       */
      get isConnected() {
        var rootNode = this.getRootNode();
        return rootNode && rootNode.nodeType === rootNode.DOCUMENT_NODE;
      },
      /**
       * Checks whether `other` is an inclusive descendant of this node.
       *
       * @param {Node | null | undefined} other
       * The node to check.
       * @returns {boolean}
       * True if `other` is an inclusive descendant of this node; false otherwise.
       * @see https://dom.spec.whatwg.org/#dom-node-contains
       */
      contains: function(other) {
        if (!other) return false;
        var parent = other;
        do {
          if (this === parent) return true;
          parent = other.parentNode;
        } while (parent);
        return false;
      },
      /**
       * @typedef GetRootNodeOptions
       * @property {boolean} [composed=false]
       */
      /**
       * Searches for the root node of this node.
       *
       * **This behavior is slightly different from the in the specs**:
       * - ignores `options.composed`, since `ShadowRoot`s are unsupported, always returns root.
       *
       * @param {GetRootNodeOptions} [options]
       * @returns {Node}
       * Root node.
       * @see https://dom.spec.whatwg.org/#dom-node-getrootnode
       * @see https://dom.spec.whatwg.org/#concept-shadow-including-root
       */
      getRootNode: function(options) {
        var parent = this;
        do {
          if (!parent.parentNode) {
            return parent;
          }
          parent = parent.parentNode;
        } while (parent);
      },
      /**
       * Checks whether the given node is equal to this node.
       *
       * @param {Node} [otherNode]
       * @see https://dom.spec.whatwg.org/#concept-node-equals
       */
      isEqualNode: function(otherNode) {
        if (!otherNode) return false;
        if (this.nodeType !== otherNode.nodeType) return false;
        switch (this.nodeType) {
          case this.DOCUMENT_TYPE_NODE:
            if (this.name !== otherNode.name) return false;
            if (this.publicId !== otherNode.publicId) return false;
            if (this.systemId !== otherNode.systemId) return false;
            break;
          case this.ELEMENT_NODE:
            if (this.namespaceURI !== otherNode.namespaceURI) return false;
            if (this.prefix !== otherNode.prefix) return false;
            if (this.localName !== otherNode.localName) return false;
            if (this.attributes.length !== otherNode.attributes.length) return false;
            for (var i = 0; i < this.attributes.length; i++) {
              var attr = this.attributes.item(i);
              if (!attr.isEqualNode(otherNode.getAttributeNodeNS(attr.namespaceURI, attr.localName))) {
                return false;
              }
            }
            break;
          case this.ATTRIBUTE_NODE:
            if (this.namespaceURI !== otherNode.namespaceURI) return false;
            if (this.localName !== otherNode.localName) return false;
            if (this.value !== otherNode.value) return false;
            break;
          case this.PROCESSING_INSTRUCTION_NODE:
            if (this.target !== otherNode.target || this.data !== otherNode.data) {
              return false;
            }
            break;
          case this.TEXT_NODE:
          case this.COMMENT_NODE:
            if (this.data !== otherNode.data) return false;
            break;
        }
        if (this.childNodes.length !== otherNode.childNodes.length) {
          return false;
        }
        for (var i = 0; i < this.childNodes.length; i++) {
          if (!this.childNodes[i].isEqualNode(otherNode.childNodes[i])) {
            return false;
          }
        }
        return true;
      },
      /**
       * Checks whether or not the given node is this node.
       *
       * @param {Node} [otherNode]
       */
      isSameNode: function(otherNode) {
        return this === otherNode;
      },
      /**
       * Inserts a node before a reference node as a child of this node.
       *
       * @param {Node} newChild
       * The new child node to be inserted.
       * @param {Node | null} refChild
       * The reference node before which newChild will be inserted.
       * @returns {Node}
       * The new child node successfully inserted.
       * @throws {DOMException}
       * Throws a DOMException if inserting the node would result in a DOM tree that is not
       * well-formed, or if `child` is provided but is not a child of `parent`.
       * See {@link _insertBefore} for more details.
       * @since Modified in DOM L2
       */
      insertBefore: function(newChild, refChild) {
        return _insertBefore(this, newChild, refChild);
      },
      /**
       * Replaces an old child node with a new child node within this node.
       *
       * @param {Node} newChild
       * The new node that is to replace the old node.
       * If it already exists in the DOM, it is removed from its original position.
       * @param {Node} oldChild
       * The existing child node to be replaced.
       * @returns {Node}
       * Returns the replaced child node.
       * @throws {DOMException}
       * Throws a DOMException if replacing the node would result in a DOM tree that is not
       * well-formed, or if `oldChild` is not a child of `this`.
       * This can also occur if the pre-replacement validity assertion fails.
       * See {@link _insertBefore}, {@link Node.removeChild}, and
       * {@link assertPreReplacementValidityInDocument} for more details.
       * @see https://dom.spec.whatwg.org/#concept-node-replace
       */
      replaceChild: function(newChild, oldChild) {
        _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
        if (oldChild) {
          this.removeChild(oldChild);
        }
      },
      /**
       * Removes an existing child node from this node.
       *
       * @param {Node} oldChild
       * The child node to be removed.
       * @returns {Node}
       * Returns the removed child node.
       * @throws {DOMException}
       * Throws a DOMException if `oldChild` is not a child of `this`.
       * See {@link _removeChild} for more details.
       */
      removeChild: function(oldChild) {
        return _removeChild(this, oldChild);
      },
      /**
       * Appends a child node to this node.
       *
       * @param {Node} newChild
       * The child node to be appended to this node.
       * If it already exists in the DOM, it is removed from its original position.
       * @returns {Node}
       * Returns the appended child node.
       * @throws {DOMException}
       * Throws a DOMException if appending the node would result in a DOM tree that is not
       * well-formed, or if `newChild` is not a valid Node.
       * See {@link insertBefore} for more details.
       */
      appendChild: function(newChild) {
        return this.insertBefore(newChild, null);
      },
      /**
       * Determines whether this node has any child nodes.
       *
       * @returns {boolean}
       * Returns true if this node has any child nodes, and false otherwise.
       */
      hasChildNodes: function() {
        return this.firstChild != null;
      },
      /**
       * Creates a copy of the calling node.
       *
       * @param {boolean} deep
       * If true, the contents of the node are recursively copied.
       * If false, only the node itself (and its attributes, if it is an element) are copied.
       * @returns {Node}
       * Returns the newly created copy of the node.
       * @throws {DOMException}
       * May throw a DOMException if operations within {@link Element#setAttributeNode} or
       * {@link Node#appendChild} (which are potentially invoked in this method) do not meet their
       * specific constraints.
       * @see {@link cloneNode}
       */
      cloneNode: function(deep) {
        return cloneNode(this.ownerDocument || this, this, deep);
      },
      /**
       * Puts the specified node and all of its subtree into a "normalized" form. In a normalized
       * subtree, no text nodes in the subtree are empty and there are no adjacent text nodes.
       *
       * Specifically, this method merges any adjacent text nodes (i.e., nodes for which `nodeType`
       * is `TEXT_NODE`) into a single node with the combined data. It also removes any empty text
       * nodes.
       *
       * This method operates recursively, so it also normalizes any and all descendent nodes within
       * the subtree.
       *
       * @throws {DOMException}
       * May throw a DOMException if operations within removeChild or appendData (which are
       * potentially invoked in this method) do not meet their specific constraints.
       * @since Modified in DOM Level 2
       * @see {@link Node.removeChild}
       * @see {@link CharacterData.appendData}
       */
      normalize: function() {
        var child = this.firstChild;
        while (child) {
          var next = child.nextSibling;
          if (next && next.nodeType == TEXT_NODE && child.nodeType == TEXT_NODE) {
            this.removeChild(next);
            child.appendData(next.data);
          } else {
            child.normalize();
            child = next;
          }
        }
      },
      /**
       * Checks whether the DOM implementation implements a specific feature and its version.
       *
       * @deprecated
       * Since `DOMImplementation.hasFeature` is deprecated and always returns true.
       * @param {string} feature
       * The package name of the feature to test. This is the same name that can be passed to the
       * method `hasFeature` on `DOMImplementation`.
       * @param {string} version
       * This is the version number of the package name to test.
       * @returns {boolean}
       * Returns true in all cases in the current implementation.
       * @since Introduced in DOM Level 2
       * @see {@link DOMImplementation.hasFeature}
       */
      isSupported: function(feature, version) {
        return this.ownerDocument.implementation.hasFeature(feature, version);
      },
      /**
       * Look up the prefix associated to the given namespace URI, starting from this node.
       * **The default namespace declarations are ignored by this method.**
       * See Namespace Prefix Lookup for details on the algorithm used by this method.
       *
       * **This behavior is different from the in the specs**:
       * - no node type specific handling
       * - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
       *
       * @param {string | null} namespaceURI
       * The namespace URI for which to find the associated prefix.
       * @returns {string | null}
       * The associated prefix, if found; otherwise, null.
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespacePrefix
       * @see https://www.w3.org/TR/DOM-Level-3-Core/namespaces-algorithms.html#lookupNamespacePrefixAlgo
       * @see https://dom.spec.whatwg.org/#dom-node-lookupprefix
       * @see https://github.com/xmldom/xmldom/issues/322
       * @prettierignore
       */
      lookupPrefix: function(namespaceURI) {
        var el = this;
        while (el) {
          var map = el._nsMap;
          if (map) {
            for (var n in map) {
              if (hasOwn(map, n) && map[n] === namespaceURI) {
                return n;
              }
            }
          }
          el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
        }
        return null;
      },
      /**
       * This function is used to look up the namespace URI associated with the given prefix,
       * starting from this node.
       *
       * **This behavior is different from the in the specs**:
       * - no node type specific handling
       * - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
       *
       * @param {string | null} prefix
       * The prefix for which to find the associated namespace URI.
       * @returns {string | null}
       * The associated namespace URI, if found; otherwise, null.
       * @since DOM Level 3
       * @see https://dom.spec.whatwg.org/#dom-node-lookupnamespaceuri
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-lookupNamespaceURI
       * @prettierignore
       */
      lookupNamespaceURI: function(prefix) {
        var el = this;
        while (el) {
          var map = el._nsMap;
          if (map) {
            if (hasOwn(map, prefix)) {
              return map[prefix];
            }
          }
          el = el.nodeType == ATTRIBUTE_NODE ? el.ownerDocument : el.parentNode;
        }
        return null;
      },
      /**
       * Determines whether the given namespace URI is the default namespace.
       *
       * The function works by looking up the prefix associated with the given namespace URI. If no
       * prefix is found (i.e., the namespace URI is not registered in the namespace map of this
       * node or any of its ancestors), it returns `true`, implying the namespace URI is considered
       * the default.
       *
       * **This behavior is different from the in the specs**:
       * - no node type specific handling
       * - uses the internal attribute _nsMap for resolving namespaces that is updated when changing attributes
       *
       * @param {string | null} namespaceURI
       * The namespace URI to be checked.
       * @returns {boolean}
       * Returns true if the given namespace URI is the default namespace, false otherwise.
       * @since DOM Level 3
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#Node3-isDefaultNamespace
       * @see https://dom.spec.whatwg.org/#dom-node-isdefaultnamespace
       * @prettierignore
       */
      isDefaultNamespace: function(namespaceURI) {
        var prefix = this.lookupPrefix(namespaceURI);
        return prefix == null;
      },
      /**
       * Compares the reference node with a node with regard to their position in the document and
       * according to the document order.
       *
       * @param {Node} other
       * The node to compare the reference node to.
       * @returns {number}
       * Returns how the node is positioned relatively to the reference node according to the
       * bitmask. 0 if reference node and given node are the same.
       * @since DOM Level 3
       * @see https://www.w3.org/TR/2004/REC-DOM-Level-3-Core-20040407/core.html#Node3-compare
       * @see https://dom.spec.whatwg.org/#dom-node-comparedocumentposition
       */
      compareDocumentPosition: function(other) {
        if (this === other) return 0;
        var node1 = other;
        var node2 = this;
        var attr1 = null;
        var attr2 = null;
        if (node1 instanceof Attr) {
          attr1 = node1;
          node1 = attr1.ownerElement;
        }
        if (node2 instanceof Attr) {
          attr2 = node2;
          node2 = attr2.ownerElement;
          if (attr1 && node1 && node2 === node1) {
            for (var i = 0, attr; attr = node2.attributes[i]; i++) {
              if (attr === attr1)
                return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
              if (attr === attr2)
                return DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
            }
          }
        }
        if (!node1 || !node2 || node2.ownerDocument !== node1.ownerDocument) {
          return DocumentPosition.DOCUMENT_POSITION_DISCONNECTED + DocumentPosition.DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC + (docGUID(node2.ownerDocument) > docGUID(node1.ownerDocument) ? DocumentPosition.DOCUMENT_POSITION_FOLLOWING : DocumentPosition.DOCUMENT_POSITION_PRECEDING);
        }
        if (attr2 && node1 === node2) {
          return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
        }
        if (attr1 && node1 === node2) {
          return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
        }
        var chain1 = [];
        var ancestor1 = node1.parentNode;
        while (ancestor1) {
          if (!attr2 && ancestor1 === node2) {
            return DocumentPosition.DOCUMENT_POSITION_CONTAINED_BY + DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
          }
          chain1.push(ancestor1);
          ancestor1 = ancestor1.parentNode;
        }
        chain1.reverse();
        var chain2 = [];
        var ancestor2 = node2.parentNode;
        while (ancestor2) {
          if (!attr1 && ancestor2 === node1) {
            return DocumentPosition.DOCUMENT_POSITION_CONTAINS + DocumentPosition.DOCUMENT_POSITION_PRECEDING;
          }
          chain2.push(ancestor2);
          ancestor2 = ancestor2.parentNode;
        }
        chain2.reverse();
        var ca = commonAncestor(chain1, chain2);
        for (var n in ca.childNodes) {
          var child = ca.childNodes[n];
          if (child === node2) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
          if (child === node1) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
          if (chain2.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_FOLLOWING;
          if (chain1.indexOf(child) >= 0) return DocumentPosition.DOCUMENT_POSITION_PRECEDING;
        }
        return 0;
      }
    };
    function _xmlEncoder(c) {
      return c == "<" && "&lt;" || c == ">" && "&gt;" || c == "&" && "&amp;" || c == '"' && "&quot;" || "&#" + c.charCodeAt() + ";";
    }
    copy(NodeType, Node);
    copy(NodeType, Node.prototype);
    copy(DocumentPosition, Node);
    copy(DocumentPosition, Node.prototype);
    function _visitNode(node, callback) {
      if (callback(node)) {
        return true;
      }
      if (node = node.firstChild) {
        do {
          if (_visitNode(node, callback)) {
            return true;
          }
        } while (node = node.nextSibling);
      }
    }
    function Document(symbol, options) {
      checkSymbol(symbol);
      var opt = options || {};
      this.ownerDocument = this;
      this.contentType = opt.contentType || MIME_TYPE.XML_APPLICATION;
      this.type = isHTMLMimeType(this.contentType) ? "html" : "xml";
    }
    function _onAddAttribute(doc, el, newAttr) {
      doc && doc._inc++;
      var ns = newAttr.namespaceURI;
      if (ns === NAMESPACE.XMLNS) {
        el._nsMap[newAttr.prefix ? newAttr.localName : ""] = newAttr.value;
      }
    }
    function _onRemoveAttribute(doc, el, newAttr, remove) {
      doc && doc._inc++;
      var ns = newAttr.namespaceURI;
      if (ns === NAMESPACE.XMLNS) {
        delete el._nsMap[newAttr.prefix ? newAttr.localName : ""];
      }
    }
    function _onUpdateChild(doc, parent, newChild) {
      if (doc && doc._inc) {
        doc._inc++;
        var childNodes = parent.childNodes;
        if (newChild && !newChild.nextSibling) {
          childNodes[childNodes.length++] = newChild;
        } else {
          var child = parent.firstChild;
          var i = 0;
          while (child) {
            childNodes[i++] = child;
            child = child.nextSibling;
          }
          childNodes.length = i;
          delete childNodes[childNodes.length];
        }
      }
    }
    function _removeChild(parentNode, child) {
      if (parentNode !== child.parentNode) {
        throw new DOMException(DOMException.NOT_FOUND_ERR, "child's parent is not parent");
      }
      var oldPreviousSibling = child.previousSibling;
      var oldNextSibling = child.nextSibling;
      if (oldPreviousSibling) {
        oldPreviousSibling.nextSibling = oldNextSibling;
      } else {
        parentNode.firstChild = oldNextSibling;
      }
      if (oldNextSibling) {
        oldNextSibling.previousSibling = oldPreviousSibling;
      } else {
        parentNode.lastChild = oldPreviousSibling;
      }
      _onUpdateChild(parentNode.ownerDocument, parentNode);
      child.parentNode = null;
      child.previousSibling = null;
      child.nextSibling = null;
      return child;
    }
    function hasValidParentNodeType(node) {
      return node && (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.ELEMENT_NODE);
    }
    function hasInsertableNodeType(node) {
      return node && (node.nodeType === Node.CDATA_SECTION_NODE || node.nodeType === Node.COMMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE || node.nodeType === Node.DOCUMENT_TYPE_NODE || node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.PROCESSING_INSTRUCTION_NODE || node.nodeType === Node.TEXT_NODE);
    }
    function isDocTypeNode(node) {
      return node && node.nodeType === Node.DOCUMENT_TYPE_NODE;
    }
    function isElementNode(node) {
      return node && node.nodeType === Node.ELEMENT_NODE;
    }
    function isTextNode(node) {
      return node && node.nodeType === Node.TEXT_NODE;
    }
    function isElementInsertionPossible(doc, child) {
      var parentChildNodes = doc.childNodes || [];
      if (find(parentChildNodes, isElementNode) || isDocTypeNode(child)) {
        return false;
      }
      var docTypeNode = find(parentChildNodes, isDocTypeNode);
      return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
    }
    function isElementReplacementPossible(doc, child) {
      var parentChildNodes = doc.childNodes || [];
      function hasElementChildThatIsNotChild(node) {
        return isElementNode(node) && node !== child;
      }
      if (find(parentChildNodes, hasElementChildThatIsNotChild)) {
        return false;
      }
      var docTypeNode = find(parentChildNodes, isDocTypeNode);
      return !(child && docTypeNode && parentChildNodes.indexOf(docTypeNode) > parentChildNodes.indexOf(child));
    }
    function assertPreInsertionValidity1to5(parent, node, child) {
      if (!hasValidParentNodeType(parent)) {
        throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Unexpected parent node type " + parent.nodeType);
      }
      if (child && child.parentNode !== parent) {
        throw new DOMException(DOMException.NOT_FOUND_ERR, "child not in parent");
      }
      if (
        // 4. If `node` is not a DocumentFragment, DocumentType, Element, or CharacterData node, then throw a "HierarchyRequestError" DOMException.
        !hasInsertableNodeType(node) || // 5. If either `node` is a Text node and `parent` is a document,
        // the sax parser currently adds top level text nodes, this will be fixed in 0.9.0
        // || (node.nodeType === Node.TEXT_NODE && parent.nodeType === Node.DOCUMENT_NODE)
        // or `node` is a doctype and `parent` is not a document, then throw a "HierarchyRequestError" DOMException.
        isDocTypeNode(node) && parent.nodeType !== Node.DOCUMENT_NODE
      ) {
        throw new DOMException(
          DOMException.HIERARCHY_REQUEST_ERR,
          "Unexpected node type " + node.nodeType + " for parent node type " + parent.nodeType
        );
      }
    }
    function assertPreInsertionValidityInDocument(parent, node, child) {
      var parentChildNodes = parent.childNodes || [];
      var nodeChildNodes = node.childNodes || [];
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        var nodeChildElements = nodeChildNodes.filter(isElementNode);
        if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
        }
        if (nodeChildElements.length === 1 && !isElementInsertionPossible(parent, child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
        }
      }
      if (isElementNode(node)) {
        if (!isElementInsertionPossible(parent, child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
        }
      }
      if (isDocTypeNode(node)) {
        if (find(parentChildNodes, isDocTypeNode)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
        }
        var parentElementChild = find(parentChildNodes, isElementNode);
        if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
        }
        if (!child && parentElementChild) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can not be appended since element is present");
        }
      }
    }
    function assertPreReplacementValidityInDocument(parent, node, child) {
      var parentChildNodes = parent.childNodes || [];
      var nodeChildNodes = node.childNodes || [];
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        var nodeChildElements = nodeChildNodes.filter(isElementNode);
        if (nodeChildElements.length > 1 || find(nodeChildNodes, isTextNode)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "More than one element or text in fragment");
        }
        if (nodeChildElements.length === 1 && !isElementReplacementPossible(parent, child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Element in fragment can not be inserted before doctype");
        }
      }
      if (isElementNode(node)) {
        if (!isElementReplacementPossible(parent, child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one element can be added and only after doctype");
        }
      }
      if (isDocTypeNode(node)) {
        let hasDoctypeChildThatIsNotChild = function(node2) {
          return isDocTypeNode(node2) && node2 !== child;
        };
        if (find(parentChildNodes, hasDoctypeChildThatIsNotChild)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Only one doctype is allowed");
        }
        var parentElementChild = find(parentChildNodes, isElementNode);
        if (child && parentChildNodes.indexOf(parentElementChild) < parentChildNodes.indexOf(child)) {
          throw new DOMException(DOMException.HIERARCHY_REQUEST_ERR, "Doctype can only be inserted before an element");
        }
      }
    }
    function _insertBefore(parent, node, child, _inDocumentAssertion) {
      assertPreInsertionValidity1to5(parent, node, child);
      if (parent.nodeType === Node.DOCUMENT_NODE) {
        (_inDocumentAssertion || assertPreInsertionValidityInDocument)(parent, node, child);
      }
      var cp = node.parentNode;
      if (cp) {
        cp.removeChild(node);
      }
      if (node.nodeType === DOCUMENT_FRAGMENT_NODE) {
        var newFirst = node.firstChild;
        if (newFirst == null) {
          return node;
        }
        var newLast = node.lastChild;
      } else {
        newFirst = newLast = node;
      }
      var pre = child ? child.previousSibling : parent.lastChild;
      newFirst.previousSibling = pre;
      newLast.nextSibling = child;
      if (pre) {
        pre.nextSibling = newFirst;
      } else {
        parent.firstChild = newFirst;
      }
      if (child == null) {
        parent.lastChild = newLast;
      } else {
        child.previousSibling = newLast;
      }
      do {
        newFirst.parentNode = parent;
      } while (newFirst !== newLast && (newFirst = newFirst.nextSibling));
      _onUpdateChild(parent.ownerDocument || parent, parent, node);
      if (node.nodeType == DOCUMENT_FRAGMENT_NODE) {
        node.firstChild = node.lastChild = null;
      }
      return node;
    }
    Document.prototype = {
      /**
       * The implementation that created this document.
       *
       * @type DOMImplementation
       * @readonly
       */
      implementation: null,
      nodeName: "#document",
      nodeType: DOCUMENT_NODE,
      /**
       * The DocumentType node of the document.
       *
       * @type DocumentType
       * @readonly
       */
      doctype: null,
      documentElement: null,
      _inc: 1,
      insertBefore: function(newChild, refChild) {
        if (newChild.nodeType === DOCUMENT_FRAGMENT_NODE) {
          var child = newChild.firstChild;
          while (child) {
            var next = child.nextSibling;
            this.insertBefore(child, refChild);
            child = next;
          }
          return newChild;
        }
        _insertBefore(this, newChild, refChild);
        newChild.ownerDocument = this;
        if (this.documentElement === null && newChild.nodeType === ELEMENT_NODE) {
          this.documentElement = newChild;
        }
        return newChild;
      },
      removeChild: function(oldChild) {
        var removed = _removeChild(this, oldChild);
        if (removed === this.documentElement) {
          this.documentElement = null;
        }
        return removed;
      },
      replaceChild: function(newChild, oldChild) {
        _insertBefore(this, newChild, oldChild, assertPreReplacementValidityInDocument);
        newChild.ownerDocument = this;
        if (oldChild) {
          this.removeChild(oldChild);
        }
        if (isElementNode(newChild)) {
          this.documentElement = newChild;
        }
      },
      // Introduced in DOM Level 2:
      importNode: function(importedNode, deep) {
        return importNode(this, importedNode, deep);
      },
      // Introduced in DOM Level 2:
      getElementById: function(id) {
        var rtv = null;
        _visitNode(this.documentElement, function(node) {
          if (node.nodeType == ELEMENT_NODE) {
            if (node.getAttribute("id") == id) {
              rtv = node;
              return true;
            }
          }
        });
        return rtv;
      },
      /**
       * Creates a new `Element` that is owned by this `Document`.
       * In HTML Documents `localName` is the lower cased `tagName`,
       * otherwise no transformation is being applied.
       * When `contentType` implies the HTML namespace, it will be set as `namespaceURI`.
       *
       * __This implementation differs from the specification:__ - The provided name is not checked
       * against the `Name` production,
       * so no related error will be thrown.
       * - There is no interface `HTMLElement`, it is always an `Element`.
       * - There is no support for a second argument to indicate using custom elements.
       *
       * @param {string} tagName
       * @returns {Element}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
       * @see https://dom.spec.whatwg.org/#dom-document-createelement
       * @see https://dom.spec.whatwg.org/#concept-create-element
       */
      createElement: function(tagName) {
        var node = new Element(PDC);
        node.ownerDocument = this;
        if (this.type === "html") {
          tagName = tagName.toLowerCase();
        }
        if (hasDefaultHTMLNamespace(this.contentType)) {
          node.namespaceURI = NAMESPACE.HTML;
        }
        node.nodeName = tagName;
        node.tagName = tagName;
        node.localName = tagName;
        node.childNodes = new NodeList();
        var attrs = node.attributes = new NamedNodeMap();
        attrs._ownerElement = node;
        return node;
      },
      /**
       * @returns {DocumentFragment}
       */
      createDocumentFragment: function() {
        var node = new DocumentFragment(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        return node;
      },
      /**
       * @param {string} data
       * @returns {Text}
       */
      createTextNode: function(data) {
        var node = new Text(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.appendData(data);
        return node;
      },
      /**
       * @param {string} data
       * @returns {Comment}
       */
      createComment: function(data) {
        var node = new Comment(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.appendData(data);
        return node;
      },
      /**
       * @param {string} data
       * @returns {CDATASection}
       */
      createCDATASection: function(data) {
        var node = new CDATASection(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.appendData(data);
        return node;
      },
      /**
       * @param {string} target
       * @param {string} data
       * @returns {ProcessingInstruction}
       */
      createProcessingInstruction: function(target, data) {
        var node = new ProcessingInstruction(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.nodeName = node.target = target;
        node.nodeValue = node.data = data;
        return node;
      },
      /**
       * Creates an `Attr` node that is owned by this document.
       * In HTML Documents `localName` is the lower cased `name`,
       * otherwise no transformation is being applied.
       *
       * __This implementation differs from the specification:__ - The provided name is not checked
       * against the `Name` production,
       * so no related error will be thrown.
       *
       * @param {string} name
       * @returns {Attr}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/createAttribute
       * @see https://dom.spec.whatwg.org/#dom-document-createattribute
       */
      createAttribute: function(name) {
        if (!g.QName_exact.test(name)) {
          throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'invalid character in name "' + name + '"');
        }
        if (this.type === "html") {
          name = name.toLowerCase();
        }
        return this._createAttribute(name);
      },
      _createAttribute: function(name) {
        var node = new Attr(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.name = name;
        node.nodeName = name;
        node.localName = name;
        node.specified = true;
        return node;
      },
      /**
       * Creates an EntityReference object.
       * The current implementation does not fill the `childNodes` with those of the corresponding
       * `Entity`
       *
       * @deprecated
       * In DOM Level 4.
       * @param {string} name
       * The name of the entity to reference. No namespace well-formedness checks are performed.
       * @returns {EntityReference}
       * @throws {DOMException}
       * With code `INVALID_CHARACTER_ERR` when `name` is not valid.
       * @throws {DOMException}
       * with code `NOT_SUPPORTED_ERR` when the document is of type `html`
       * @see https://www.w3.org/TR/DOM-Level-3-Core/core.html#ID-392B75AE
       */
      createEntityReference: function(name) {
        if (!g.Name.test(name)) {
          throw new DOMException(DOMException.INVALID_CHARACTER_ERR, 'not a valid xml name "' + name + '"');
        }
        if (this.type === "html") {
          throw new DOMException("document is an html document", DOMExceptionName.NotSupportedError);
        }
        var node = new EntityReference(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.nodeName = name;
        return node;
      },
      // Introduced in DOM Level 2:
      /**
       * @param {string} namespaceURI
       * @param {string} qualifiedName
       * @returns {Element}
       */
      createElementNS: function(namespaceURI, qualifiedName) {
        var validated = validateAndExtract(namespaceURI, qualifiedName);
        var node = new Element(PDC);
        var attrs = node.attributes = new NamedNodeMap();
        node.childNodes = new NodeList();
        node.ownerDocument = this;
        node.nodeName = qualifiedName;
        node.tagName = qualifiedName;
        node.namespaceURI = validated[0];
        node.prefix = validated[1];
        node.localName = validated[2];
        attrs._ownerElement = node;
        return node;
      },
      // Introduced in DOM Level 2:
      /**
       * @param {string} namespaceURI
       * @param {string} qualifiedName
       * @returns {Attr}
       */
      createAttributeNS: function(namespaceURI, qualifiedName) {
        var validated = validateAndExtract(namespaceURI, qualifiedName);
        var node = new Attr(PDC);
        node.ownerDocument = this;
        node.childNodes = new NodeList();
        node.nodeName = qualifiedName;
        node.name = qualifiedName;
        node.specified = true;
        node.namespaceURI = validated[0];
        node.prefix = validated[1];
        node.localName = validated[2];
        return node;
      }
    };
    _extends(Document, Node);
    function Element(symbol) {
      checkSymbol(symbol);
      this._nsMap = /* @__PURE__ */ Object.create(null);
    }
    Element.prototype = {
      nodeType: ELEMENT_NODE,
      /**
       * The attributes of this element.
       *
       * @type {NamedNodeMap | null}
       */
      attributes: null,
      getQualifiedName: function() {
        return this.prefix ? this.prefix + ":" + this.localName : this.localName;
      },
      _isInHTMLDocumentAndNamespace: function() {
        return this.ownerDocument.type === "html" && this.namespaceURI === NAMESPACE.HTML;
      },
      /**
       * Implementaton of Level2 Core function hasAttributes.
       *
       * @returns {boolean}
       * True if attribute list is not empty.
       * @see https://www.w3.org/TR/DOM-Level-2-Core/#core-ID-NodeHasAttrs
       */
      hasAttributes: function() {
        return !!(this.attributes && this.attributes.length);
      },
      hasAttribute: function(name) {
        return !!this.getAttributeNode(name);
      },
      /**
       * Returns element’s first attribute whose qualified name is `name`, and `null`
       * if there is no such attribute.
       *
       * @param {string} name
       * @returns {string | null}
       */
      getAttribute: function(name) {
        var attr = this.getAttributeNode(name);
        return attr ? attr.value : null;
      },
      getAttributeNode: function(name) {
        if (this._isInHTMLDocumentAndNamespace()) {
          name = name.toLowerCase();
        }
        return this.attributes.getNamedItem(name);
      },
      /**
       * Sets the value of element’s first attribute whose qualified name is qualifiedName to value.
       *
       * @param {string} name
       * @param {string} value
       */
      setAttribute: function(name, value) {
        if (this._isInHTMLDocumentAndNamespace()) {
          name = name.toLowerCase();
        }
        var attr = this.getAttributeNode(name);
        if (attr) {
          attr.value = attr.nodeValue = "" + value;
        } else {
          attr = this.ownerDocument._createAttribute(name);
          attr.value = attr.nodeValue = "" + value;
          this.setAttributeNode(attr);
        }
      },
      removeAttribute: function(name) {
        var attr = this.getAttributeNode(name);
        attr && this.removeAttributeNode(attr);
      },
      setAttributeNode: function(newAttr) {
        return this.attributes.setNamedItem(newAttr);
      },
      setAttributeNodeNS: function(newAttr) {
        return this.attributes.setNamedItemNS(newAttr);
      },
      removeAttributeNode: function(oldAttr) {
        return this.attributes.removeNamedItem(oldAttr.nodeName);
      },
      //get real attribute name,and remove it by removeAttributeNode
      removeAttributeNS: function(namespaceURI, localName) {
        var old = this.getAttributeNodeNS(namespaceURI, localName);
        old && this.removeAttributeNode(old);
      },
      hasAttributeNS: function(namespaceURI, localName) {
        return this.getAttributeNodeNS(namespaceURI, localName) != null;
      },
      /**
       * Returns element’s attribute whose namespace is `namespaceURI` and local name is
       * `localName`,
       * or `null` if there is no such attribute.
       *
       * @param {string} namespaceURI
       * @param {string} localName
       * @returns {string | null}
       */
      getAttributeNS: function(namespaceURI, localName) {
        var attr = this.getAttributeNodeNS(namespaceURI, localName);
        return attr ? attr.value : null;
      },
      /**
       * Sets the value of element’s attribute whose namespace is `namespaceURI` and local name is
       * `localName` to value.
       *
       * @param {string} namespaceURI
       * @param {string} qualifiedName
       * @param {string} value
       * @see https://dom.spec.whatwg.org/#dom-element-setattributens
       */
      setAttributeNS: function(namespaceURI, qualifiedName, value) {
        var validated = validateAndExtract(namespaceURI, qualifiedName);
        var localName = validated[2];
        var attr = this.getAttributeNodeNS(namespaceURI, localName);
        if (attr) {
          attr.value = attr.nodeValue = "" + value;
        } else {
          attr = this.ownerDocument.createAttributeNS(namespaceURI, qualifiedName);
          attr.value = attr.nodeValue = "" + value;
          this.setAttributeNode(attr);
        }
      },
      getAttributeNodeNS: function(namespaceURI, localName) {
        return this.attributes.getNamedItemNS(namespaceURI, localName);
      },
      /**
       * Returns a LiveNodeList of all child elements which have **all** of the given class name(s).
       *
       * Returns an empty list if `classNames` is an empty string or only contains HTML white space
       * characters.
       *
       * Warning: This returns a live LiveNodeList.
       * Changes in the DOM will reflect in the array as the changes occur.
       * If an element selected by this array no longer qualifies for the selector,
       * it will automatically be removed. Be aware of this for iteration purposes.
       *
       * @param {string} classNames
       * Is a string representing the class name(s) to match; multiple class names are separated by
       * (ASCII-)whitespace.
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByClassName
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementsByClassName
       * @see https://dom.spec.whatwg.org/#concept-getelementsbyclassname
       */
      getElementsByClassName: function(classNames) {
        var classNamesSet = toOrderedSet(classNames);
        return new LiveNodeList(this, function(base) {
          var ls = [];
          if (classNamesSet.length > 0) {
            _visitNode(base, function(node) {
              if (node !== base && node.nodeType === ELEMENT_NODE) {
                var nodeClassNames = node.getAttribute("class");
                if (nodeClassNames) {
                  var matches = classNames === nodeClassNames;
                  if (!matches) {
                    var nodeClassNamesSet = toOrderedSet(nodeClassNames);
                    matches = classNamesSet.every(arrayIncludes(nodeClassNamesSet));
                  }
                  if (matches) {
                    ls.push(node);
                  }
                }
              }
            });
          }
          return ls;
        });
      },
      /**
       * Returns a LiveNodeList of elements with the given qualifiedName.
       * Searching for all descendants can be done by passing `*` as `qualifiedName`.
       *
       * All descendants of the specified element are searched, but not the element itself.
       * The returned list is live, which means it updates itself with the DOM tree automatically.
       * Therefore, there is no need to call `Element.getElementsByTagName()`
       * with the same element and arguments repeatedly if the DOM changes in between calls.
       *
       * When called on an HTML element in an HTML document,
       * `getElementsByTagName` lower-cases the argument before searching for it.
       * This is undesirable when trying to match camel-cased SVG elements (such as
       * `<linearGradient>`) in an HTML document.
       * Instead, use `Element.getElementsByTagNameNS()`,
       * which preserves the capitalization of the tag name.
       *
       * `Element.getElementsByTagName` is similar to `Document.getElementsByTagName()`,
       * except that it only searches for elements that are descendants of the specified element.
       *
       * @param {string} qualifiedName
       * @returns {LiveNodeList}
       * @see https://developer.mozilla.org/en-US/docs/Web/API/Element/getElementsByTagName
       * @see https://dom.spec.whatwg.org/#concept-getelementsbytagname
       */
      getElementsByTagName: function(qualifiedName) {
        var isHTMLDocument = (this.nodeType === DOCUMENT_NODE ? this : this.ownerDocument).type === "html";
        var lowerQualifiedName = qualifiedName.toLowerCase();
        return new LiveNodeList(this, function(base) {
          var ls = [];
          _visitNode(base, function(node) {
            if (node === base || node.nodeType !== ELEMENT_NODE) {
              return;
            }
            if (qualifiedName === "*") {
              ls.push(node);
            } else {
              var nodeQualifiedName = node.getQualifiedName();
              var matchingQName = isHTMLDocument && node.namespaceURI === NAMESPACE.HTML ? lowerQualifiedName : qualifiedName;
              if (nodeQualifiedName === matchingQName) {
                ls.push(node);
              }
            }
          });
          return ls;
        });
      },
      getElementsByTagNameNS: function(namespaceURI, localName) {
        return new LiveNodeList(this, function(base) {
          var ls = [];
          _visitNode(base, function(node) {
            if (node !== base && node.nodeType === ELEMENT_NODE && (namespaceURI === "*" || node.namespaceURI === namespaceURI) && (localName === "*" || node.localName == localName)) {
              ls.push(node);
            }
          });
          return ls;
        });
      }
    };
    Document.prototype.getElementsByClassName = Element.prototype.getElementsByClassName;
    Document.prototype.getElementsByTagName = Element.prototype.getElementsByTagName;
    Document.prototype.getElementsByTagNameNS = Element.prototype.getElementsByTagNameNS;
    _extends(Element, Node);
    function Attr(symbol) {
      checkSymbol(symbol);
      this.namespaceURI = null;
      this.prefix = null;
      this.ownerElement = null;
    }
    Attr.prototype.nodeType = ATTRIBUTE_NODE;
    _extends(Attr, Node);
    function CharacterData(symbol) {
      checkSymbol(symbol);
    }
    CharacterData.prototype = {
      data: "",
      substringData: function(offset, count) {
        return this.data.substring(offset, offset + count);
      },
      appendData: function(text) {
        text = this.data + text;
        this.nodeValue = this.data = text;
        this.length = text.length;
      },
      insertData: function(offset, text) {
        this.replaceData(offset, 0, text);
      },
      deleteData: function(offset, count) {
        this.replaceData(offset, count, "");
      },
      replaceData: function(offset, count, text) {
        var start = this.data.substring(0, offset);
        var end = this.data.substring(offset + count);
        text = start + text + end;
        this.nodeValue = this.data = text;
        this.length = text.length;
      }
    };
    _extends(CharacterData, Node);
    function Text(symbol) {
      checkSymbol(symbol);
    }
    Text.prototype = {
      nodeName: "#text",
      nodeType: TEXT_NODE,
      splitText: function(offset) {
        var text = this.data;
        var newText = text.substring(offset);
        text = text.substring(0, offset);
        this.data = this.nodeValue = text;
        this.length = text.length;
        var newNode = this.ownerDocument.createTextNode(newText);
        if (this.parentNode) {
          this.parentNode.insertBefore(newNode, this.nextSibling);
        }
        return newNode;
      }
    };
    _extends(Text, CharacterData);
    function Comment(symbol) {
      checkSymbol(symbol);
    }
    Comment.prototype = {
      nodeName: "#comment",
      nodeType: COMMENT_NODE
    };
    _extends(Comment, CharacterData);
    function CDATASection(symbol) {
      checkSymbol(symbol);
    }
    CDATASection.prototype = {
      nodeName: "#cdata-section",
      nodeType: CDATA_SECTION_NODE
    };
    _extends(CDATASection, Text);
    function DocumentType(symbol) {
      checkSymbol(symbol);
    }
    DocumentType.prototype.nodeType = DOCUMENT_TYPE_NODE;
    _extends(DocumentType, Node);
    function Notation(symbol) {
      checkSymbol(symbol);
    }
    Notation.prototype.nodeType = NOTATION_NODE;
    _extends(Notation, Node);
    function Entity(symbol) {
      checkSymbol(symbol);
    }
    Entity.prototype.nodeType = ENTITY_NODE;
    _extends(Entity, Node);
    function EntityReference(symbol) {
      checkSymbol(symbol);
    }
    EntityReference.prototype.nodeType = ENTITY_REFERENCE_NODE;
    _extends(EntityReference, Node);
    function DocumentFragment(symbol) {
      checkSymbol(symbol);
    }
    DocumentFragment.prototype.nodeName = "#document-fragment";
    DocumentFragment.prototype.nodeType = DOCUMENT_FRAGMENT_NODE;
    _extends(DocumentFragment, Node);
    function ProcessingInstruction(symbol) {
      checkSymbol(symbol);
    }
    ProcessingInstruction.prototype.nodeType = PROCESSING_INSTRUCTION_NODE;
    _extends(ProcessingInstruction, CharacterData);
    function XMLSerializer2() {
    }
    XMLSerializer2.prototype.serializeToString = function(node, nodeFilter) {
      return nodeSerializeToString.call(node, nodeFilter);
    };
    Node.prototype.toString = nodeSerializeToString;
    function nodeSerializeToString(nodeFilter) {
      var buf = [];
      var refNode = this.nodeType === DOCUMENT_NODE && this.documentElement || this;
      var prefix = refNode.prefix;
      var uri = refNode.namespaceURI;
      if (uri && prefix == null) {
        var prefix = refNode.lookupPrefix(uri);
        if (prefix == null) {
          var visibleNamespaces = [
            { namespace: uri, prefix: null }
            //{namespace:uri,prefix:''}
          ];
        }
      }
      serializeToString(this, buf, nodeFilter, visibleNamespaces);
      return buf.join("");
    }
    function needNamespaceDefine(node, isHTML, visibleNamespaces) {
      var prefix = node.prefix || "";
      var uri = node.namespaceURI;
      if (!uri) {
        return false;
      }
      if (prefix === "xml" && uri === NAMESPACE.XML || uri === NAMESPACE.XMLNS) {
        return false;
      }
      var i = visibleNamespaces.length;
      while (i--) {
        var ns = visibleNamespaces[i];
        if (ns.prefix === prefix) {
          return ns.namespace !== uri;
        }
      }
      return true;
    }
    function addSerializedAttribute(buf, qualifiedName, value) {
      buf.push(" ", qualifiedName, '="', value.replace(/[<>&"\t\n\r]/g, _xmlEncoder), '"');
    }
    function serializeToString(node, buf, nodeFilter, visibleNamespaces) {
      if (!visibleNamespaces) {
        visibleNamespaces = [];
      }
      var doc = node.nodeType === DOCUMENT_NODE ? node : node.ownerDocument;
      var isHTML = doc.type === "html";
      if (nodeFilter) {
        node = nodeFilter(node);
        if (node) {
          if (typeof node == "string") {
            buf.push(node);
            return;
          }
        } else {
          return;
        }
      }
      switch (node.nodeType) {
        case ELEMENT_NODE:
          var attrs = node.attributes;
          var len = attrs.length;
          var child = node.firstChild;
          var nodeName = node.tagName;
          var prefixedNodeName = nodeName;
          if (!isHTML && !node.prefix && node.namespaceURI) {
            var defaultNS;
            for (var ai = 0; ai < attrs.length; ai++) {
              if (attrs.item(ai).name === "xmlns") {
                defaultNS = attrs.item(ai).value;
                break;
              }
            }
            if (!defaultNS) {
              for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
                var namespace = visibleNamespaces[nsi];
                if (namespace.prefix === "" && namespace.namespace === node.namespaceURI) {
                  defaultNS = namespace.namespace;
                  break;
                }
              }
            }
            if (defaultNS !== node.namespaceURI) {
              for (var nsi = visibleNamespaces.length - 1; nsi >= 0; nsi--) {
                var namespace = visibleNamespaces[nsi];
                if (namespace.namespace === node.namespaceURI) {
                  if (namespace.prefix) {
                    prefixedNodeName = namespace.prefix + ":" + nodeName;
                  }
                  break;
                }
              }
            }
          }
          buf.push("<", prefixedNodeName);
          for (var i = 0; i < len; i++) {
            var attr = attrs.item(i);
            if (attr.prefix == "xmlns") {
              visibleNamespaces.push({
                prefix: attr.localName,
                namespace: attr.value
              });
            } else if (attr.nodeName == "xmlns") {
              visibleNamespaces.push({ prefix: "", namespace: attr.value });
            }
          }
          for (var i = 0; i < len; i++) {
            var attr = attrs.item(i);
            if (needNamespaceDefine(attr, isHTML, visibleNamespaces)) {
              var prefix = attr.prefix || "";
              var uri = attr.namespaceURI;
              addSerializedAttribute(buf, prefix ? "xmlns:" + prefix : "xmlns", uri);
              visibleNamespaces.push({ prefix, namespace: uri });
            }
            serializeToString(attr, buf, nodeFilter, visibleNamespaces);
          }
          if (nodeName === prefixedNodeName && needNamespaceDefine(node, isHTML, visibleNamespaces)) {
            var prefix = node.prefix || "";
            var uri = node.namespaceURI;
            addSerializedAttribute(buf, prefix ? "xmlns:" + prefix : "xmlns", uri);
            visibleNamespaces.push({ prefix, namespace: uri });
          }
          var canCloseTag = !child;
          if (canCloseTag && (isHTML || node.namespaceURI === NAMESPACE.HTML)) {
            canCloseTag = isHTMLVoidElement(nodeName);
          }
          if (canCloseTag) {
            buf.push("/>");
          } else {
            buf.push(">");
            if (isHTML && isHTMLRawTextElement(nodeName)) {
              while (child) {
                if (child.data) {
                  buf.push(child.data);
                } else {
                  serializeToString(child, buf, nodeFilter, visibleNamespaces.slice());
                }
                child = child.nextSibling;
              }
            } else {
              while (child) {
                serializeToString(child, buf, nodeFilter, visibleNamespaces.slice());
                child = child.nextSibling;
              }
            }
            buf.push("</", prefixedNodeName, ">");
          }
          return;
        case DOCUMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE:
          var child = node.firstChild;
          while (child) {
            serializeToString(child, buf, nodeFilter, visibleNamespaces.slice());
            child = child.nextSibling;
          }
          return;
        case ATTRIBUTE_NODE:
          return addSerializedAttribute(buf, node.name, node.value);
        case TEXT_NODE:
          return buf.push(node.data.replace(/[<&>]/g, _xmlEncoder));
        case CDATA_SECTION_NODE:
          return buf.push(g.CDATA_START, node.data, g.CDATA_END);
        case COMMENT_NODE:
          return buf.push(g.COMMENT_START, node.data, g.COMMENT_END);
        case DOCUMENT_TYPE_NODE:
          var pubid = node.publicId;
          var sysid = node.systemId;
          buf.push(g.DOCTYPE_DECL_START, " ", node.name);
          if (pubid) {
            buf.push(" ", g.PUBLIC, " ", pubid);
            if (sysid && sysid !== ".") {
              buf.push(" ", sysid);
            }
          } else if (sysid && sysid !== ".") {
            buf.push(" ", g.SYSTEM, " ", sysid);
          }
          if (node.internalSubset) {
            buf.push(" [", node.internalSubset, "]");
          }
          buf.push(">");
          return;
        case PROCESSING_INSTRUCTION_NODE:
          return buf.push("<?", node.target, " ", node.data, "?>");
        case ENTITY_REFERENCE_NODE:
          return buf.push("&", node.nodeName, ";");
        //case ENTITY_NODE:
        //case NOTATION_NODE:
        default:
          buf.push("??", node.nodeName);
      }
    }
    function importNode(doc, node, deep) {
      var node2;
      switch (node.nodeType) {
        case ELEMENT_NODE:
          node2 = node.cloneNode(false);
          node2.ownerDocument = doc;
        //var attrs = node2.attributes;
        //var len = attrs.length;
        //for(var i=0;i<len;i++){
        //node2.setAttributeNodeNS(importNode(doc,attrs.item(i),deep));
        //}
        case DOCUMENT_FRAGMENT_NODE:
          break;
        case ATTRIBUTE_NODE:
          deep = true;
          break;
      }
      if (!node2) {
        node2 = node.cloneNode(false);
      }
      node2.ownerDocument = doc;
      node2.parentNode = null;
      if (deep) {
        var child = node.firstChild;
        while (child) {
          node2.appendChild(importNode(doc, child, deep));
          child = child.nextSibling;
        }
      }
      return node2;
    }
    function cloneNode(doc, node, deep) {
      var node2 = new node.constructor(PDC);
      for (var n in node) {
        if (hasOwn(node, n)) {
          var v = node[n];
          if (typeof v != "object") {
            if (v != node2[n]) {
              node2[n] = v;
            }
          }
        }
      }
      if (node.childNodes) {
        node2.childNodes = new NodeList();
      }
      node2.ownerDocument = doc;
      switch (node2.nodeType) {
        case ELEMENT_NODE:
          var attrs = node.attributes;
          var attrs2 = node2.attributes = new NamedNodeMap();
          var len = attrs.length;
          attrs2._ownerElement = node2;
          for (var i = 0; i < len; i++) {
            node2.setAttributeNode(cloneNode(doc, attrs.item(i), true));
          }
          break;
        case ATTRIBUTE_NODE:
          deep = true;
      }
      if (deep) {
        var child = node.firstChild;
        while (child) {
          node2.appendChild(cloneNode(doc, child, deep));
          child = child.nextSibling;
        }
      }
      return node2;
    }
    function __set__(object, key, value) {
      object[key] = value;
    }
    try {
      if (Object.defineProperty) {
        let getTextContent = function(node) {
          switch (node.nodeType) {
            case ELEMENT_NODE:
            case DOCUMENT_FRAGMENT_NODE:
              var buf = [];
              node = node.firstChild;
              while (node) {
                if (node.nodeType !== 7 && node.nodeType !== 8) {
                  buf.push(getTextContent(node));
                }
                node = node.nextSibling;
              }
              return buf.join("");
            default:
              return node.nodeValue;
          }
        };
        Object.defineProperty(LiveNodeList.prototype, "length", {
          get: function() {
            _updateLiveList(this);
            return this.$$length;
          }
        });
        Object.defineProperty(Node.prototype, "textContent", {
          get: function() {
            return getTextContent(this);
          },
          set: function(data) {
            switch (this.nodeType) {
              case ELEMENT_NODE:
              case DOCUMENT_FRAGMENT_NODE:
                while (this.firstChild) {
                  this.removeChild(this.firstChild);
                }
                if (data || String(data)) {
                  this.appendChild(this.ownerDocument.createTextNode(data));
                }
                break;
              default:
                this.data = data;
                this.value = data;
                this.nodeValue = data;
            }
          }
        });
        __set__ = function(object, key, value) {
          object["$$" + key] = value;
        };
      }
    } catch (e) {
    }
    exports2._updateLiveList = _updateLiveList;
    exports2.Attr = Attr;
    exports2.CDATASection = CDATASection;
    exports2.CharacterData = CharacterData;
    exports2.Comment = Comment;
    exports2.Document = Document;
    exports2.DocumentFragment = DocumentFragment;
    exports2.DocumentType = DocumentType;
    exports2.DOMImplementation = DOMImplementation;
    exports2.Element = Element;
    exports2.Entity = Entity;
    exports2.EntityReference = EntityReference;
    exports2.LiveNodeList = LiveNodeList;
    exports2.NamedNodeMap = NamedNodeMap;
    exports2.Node = Node;
    exports2.NodeList = NodeList;
    exports2.Notation = Notation;
    exports2.Text = Text;
    exports2.ProcessingInstruction = ProcessingInstruction;
    exports2.XMLSerializer = XMLSerializer2;
  }
});

// node_modules/@xmldom/xmldom/lib/entities.js
var require_entities = __commonJS({
  "node_modules/@xmldom/xmldom/lib/entities.js"(exports2) {
    "use strict";
    var freeze = require_conventions().freeze;
    exports2.XML_ENTITIES = freeze({
      amp: "&",
      apos: "'",
      gt: ">",
      lt: "<",
      quot: '"'
    });
    exports2.HTML_ENTITIES = freeze({
      Aacute: "\xC1",
      aacute: "\xE1",
      Abreve: "\u0102",
      abreve: "\u0103",
      ac: "\u223E",
      acd: "\u223F",
      acE: "\u223E\u0333",
      Acirc: "\xC2",
      acirc: "\xE2",
      acute: "\xB4",
      Acy: "\u0410",
      acy: "\u0430",
      AElig: "\xC6",
      aelig: "\xE6",
      af: "\u2061",
      Afr: "\u{1D504}",
      afr: "\u{1D51E}",
      Agrave: "\xC0",
      agrave: "\xE0",
      alefsym: "\u2135",
      aleph: "\u2135",
      Alpha: "\u0391",
      alpha: "\u03B1",
      Amacr: "\u0100",
      amacr: "\u0101",
      amalg: "\u2A3F",
      AMP: "&",
      amp: "&",
      And: "\u2A53",
      and: "\u2227",
      andand: "\u2A55",
      andd: "\u2A5C",
      andslope: "\u2A58",
      andv: "\u2A5A",
      ang: "\u2220",
      ange: "\u29A4",
      angle: "\u2220",
      angmsd: "\u2221",
      angmsdaa: "\u29A8",
      angmsdab: "\u29A9",
      angmsdac: "\u29AA",
      angmsdad: "\u29AB",
      angmsdae: "\u29AC",
      angmsdaf: "\u29AD",
      angmsdag: "\u29AE",
      angmsdah: "\u29AF",
      angrt: "\u221F",
      angrtvb: "\u22BE",
      angrtvbd: "\u299D",
      angsph: "\u2222",
      angst: "\xC5",
      angzarr: "\u237C",
      Aogon: "\u0104",
      aogon: "\u0105",
      Aopf: "\u{1D538}",
      aopf: "\u{1D552}",
      ap: "\u2248",
      apacir: "\u2A6F",
      apE: "\u2A70",
      ape: "\u224A",
      apid: "\u224B",
      apos: "'",
      ApplyFunction: "\u2061",
      approx: "\u2248",
      approxeq: "\u224A",
      Aring: "\xC5",
      aring: "\xE5",
      Ascr: "\u{1D49C}",
      ascr: "\u{1D4B6}",
      Assign: "\u2254",
      ast: "*",
      asymp: "\u2248",
      asympeq: "\u224D",
      Atilde: "\xC3",
      atilde: "\xE3",
      Auml: "\xC4",
      auml: "\xE4",
      awconint: "\u2233",
      awint: "\u2A11",
      backcong: "\u224C",
      backepsilon: "\u03F6",
      backprime: "\u2035",
      backsim: "\u223D",
      backsimeq: "\u22CD",
      Backslash: "\u2216",
      Barv: "\u2AE7",
      barvee: "\u22BD",
      Barwed: "\u2306",
      barwed: "\u2305",
      barwedge: "\u2305",
      bbrk: "\u23B5",
      bbrktbrk: "\u23B6",
      bcong: "\u224C",
      Bcy: "\u0411",
      bcy: "\u0431",
      bdquo: "\u201E",
      becaus: "\u2235",
      Because: "\u2235",
      because: "\u2235",
      bemptyv: "\u29B0",
      bepsi: "\u03F6",
      bernou: "\u212C",
      Bernoullis: "\u212C",
      Beta: "\u0392",
      beta: "\u03B2",
      beth: "\u2136",
      between: "\u226C",
      Bfr: "\u{1D505}",
      bfr: "\u{1D51F}",
      bigcap: "\u22C2",
      bigcirc: "\u25EF",
      bigcup: "\u22C3",
      bigodot: "\u2A00",
      bigoplus: "\u2A01",
      bigotimes: "\u2A02",
      bigsqcup: "\u2A06",
      bigstar: "\u2605",
      bigtriangledown: "\u25BD",
      bigtriangleup: "\u25B3",
      biguplus: "\u2A04",
      bigvee: "\u22C1",
      bigwedge: "\u22C0",
      bkarow: "\u290D",
      blacklozenge: "\u29EB",
      blacksquare: "\u25AA",
      blacktriangle: "\u25B4",
      blacktriangledown: "\u25BE",
      blacktriangleleft: "\u25C2",
      blacktriangleright: "\u25B8",
      blank: "\u2423",
      blk12: "\u2592",
      blk14: "\u2591",
      blk34: "\u2593",
      block: "\u2588",
      bne: "=\u20E5",
      bnequiv: "\u2261\u20E5",
      bNot: "\u2AED",
      bnot: "\u2310",
      Bopf: "\u{1D539}",
      bopf: "\u{1D553}",
      bot: "\u22A5",
      bottom: "\u22A5",
      bowtie: "\u22C8",
      boxbox: "\u29C9",
      boxDL: "\u2557",
      boxDl: "\u2556",
      boxdL: "\u2555",
      boxdl: "\u2510",
      boxDR: "\u2554",
      boxDr: "\u2553",
      boxdR: "\u2552",
      boxdr: "\u250C",
      boxH: "\u2550",
      boxh: "\u2500",
      boxHD: "\u2566",
      boxHd: "\u2564",
      boxhD: "\u2565",
      boxhd: "\u252C",
      boxHU: "\u2569",
      boxHu: "\u2567",
      boxhU: "\u2568",
      boxhu: "\u2534",
      boxminus: "\u229F",
      boxplus: "\u229E",
      boxtimes: "\u22A0",
      boxUL: "\u255D",
      boxUl: "\u255C",
      boxuL: "\u255B",
      boxul: "\u2518",
      boxUR: "\u255A",
      boxUr: "\u2559",
      boxuR: "\u2558",
      boxur: "\u2514",
      boxV: "\u2551",
      boxv: "\u2502",
      boxVH: "\u256C",
      boxVh: "\u256B",
      boxvH: "\u256A",
      boxvh: "\u253C",
      boxVL: "\u2563",
      boxVl: "\u2562",
      boxvL: "\u2561",
      boxvl: "\u2524",
      boxVR: "\u2560",
      boxVr: "\u255F",
      boxvR: "\u255E",
      boxvr: "\u251C",
      bprime: "\u2035",
      Breve: "\u02D8",
      breve: "\u02D8",
      brvbar: "\xA6",
      Bscr: "\u212C",
      bscr: "\u{1D4B7}",
      bsemi: "\u204F",
      bsim: "\u223D",
      bsime: "\u22CD",
      bsol: "\\",
      bsolb: "\u29C5",
      bsolhsub: "\u27C8",
      bull: "\u2022",
      bullet: "\u2022",
      bump: "\u224E",
      bumpE: "\u2AAE",
      bumpe: "\u224F",
      Bumpeq: "\u224E",
      bumpeq: "\u224F",
      Cacute: "\u0106",
      cacute: "\u0107",
      Cap: "\u22D2",
      cap: "\u2229",
      capand: "\u2A44",
      capbrcup: "\u2A49",
      capcap: "\u2A4B",
      capcup: "\u2A47",
      capdot: "\u2A40",
      CapitalDifferentialD: "\u2145",
      caps: "\u2229\uFE00",
      caret: "\u2041",
      caron: "\u02C7",
      Cayleys: "\u212D",
      ccaps: "\u2A4D",
      Ccaron: "\u010C",
      ccaron: "\u010D",
      Ccedil: "\xC7",
      ccedil: "\xE7",
      Ccirc: "\u0108",
      ccirc: "\u0109",
      Cconint: "\u2230",
      ccups: "\u2A4C",
      ccupssm: "\u2A50",
      Cdot: "\u010A",
      cdot: "\u010B",
      cedil: "\xB8",
      Cedilla: "\xB8",
      cemptyv: "\u29B2",
      cent: "\xA2",
      CenterDot: "\xB7",
      centerdot: "\xB7",
      Cfr: "\u212D",
      cfr: "\u{1D520}",
      CHcy: "\u0427",
      chcy: "\u0447",
      check: "\u2713",
      checkmark: "\u2713",
      Chi: "\u03A7",
      chi: "\u03C7",
      cir: "\u25CB",
      circ: "\u02C6",
      circeq: "\u2257",
      circlearrowleft: "\u21BA",
      circlearrowright: "\u21BB",
      circledast: "\u229B",
      circledcirc: "\u229A",
      circleddash: "\u229D",
      CircleDot: "\u2299",
      circledR: "\xAE",
      circledS: "\u24C8",
      CircleMinus: "\u2296",
      CirclePlus: "\u2295",
      CircleTimes: "\u2297",
      cirE: "\u29C3",
      cire: "\u2257",
      cirfnint: "\u2A10",
      cirmid: "\u2AEF",
      cirscir: "\u29C2",
      ClockwiseContourIntegral: "\u2232",
      CloseCurlyDoubleQuote: "\u201D",
      CloseCurlyQuote: "\u2019",
      clubs: "\u2663",
      clubsuit: "\u2663",
      Colon: "\u2237",
      colon: ":",
      Colone: "\u2A74",
      colone: "\u2254",
      coloneq: "\u2254",
      comma: ",",
      commat: "@",
      comp: "\u2201",
      compfn: "\u2218",
      complement: "\u2201",
      complexes: "\u2102",
      cong: "\u2245",
      congdot: "\u2A6D",
      Congruent: "\u2261",
      Conint: "\u222F",
      conint: "\u222E",
      ContourIntegral: "\u222E",
      Copf: "\u2102",
      copf: "\u{1D554}",
      coprod: "\u2210",
      Coproduct: "\u2210",
      COPY: "\xA9",
      copy: "\xA9",
      copysr: "\u2117",
      CounterClockwiseContourIntegral: "\u2233",
      crarr: "\u21B5",
      Cross: "\u2A2F",
      cross: "\u2717",
      Cscr: "\u{1D49E}",
      cscr: "\u{1D4B8}",
      csub: "\u2ACF",
      csube: "\u2AD1",
      csup: "\u2AD0",
      csupe: "\u2AD2",
      ctdot: "\u22EF",
      cudarrl: "\u2938",
      cudarrr: "\u2935",
      cuepr: "\u22DE",
      cuesc: "\u22DF",
      cularr: "\u21B6",
      cularrp: "\u293D",
      Cup: "\u22D3",
      cup: "\u222A",
      cupbrcap: "\u2A48",
      CupCap: "\u224D",
      cupcap: "\u2A46",
      cupcup: "\u2A4A",
      cupdot: "\u228D",
      cupor: "\u2A45",
      cups: "\u222A\uFE00",
      curarr: "\u21B7",
      curarrm: "\u293C",
      curlyeqprec: "\u22DE",
      curlyeqsucc: "\u22DF",
      curlyvee: "\u22CE",
      curlywedge: "\u22CF",
      curren: "\xA4",
      curvearrowleft: "\u21B6",
      curvearrowright: "\u21B7",
      cuvee: "\u22CE",
      cuwed: "\u22CF",
      cwconint: "\u2232",
      cwint: "\u2231",
      cylcty: "\u232D",
      Dagger: "\u2021",
      dagger: "\u2020",
      daleth: "\u2138",
      Darr: "\u21A1",
      dArr: "\u21D3",
      darr: "\u2193",
      dash: "\u2010",
      Dashv: "\u2AE4",
      dashv: "\u22A3",
      dbkarow: "\u290F",
      dblac: "\u02DD",
      Dcaron: "\u010E",
      dcaron: "\u010F",
      Dcy: "\u0414",
      dcy: "\u0434",
      DD: "\u2145",
      dd: "\u2146",
      ddagger: "\u2021",
      ddarr: "\u21CA",
      DDotrahd: "\u2911",
      ddotseq: "\u2A77",
      deg: "\xB0",
      Del: "\u2207",
      Delta: "\u0394",
      delta: "\u03B4",
      demptyv: "\u29B1",
      dfisht: "\u297F",
      Dfr: "\u{1D507}",
      dfr: "\u{1D521}",
      dHar: "\u2965",
      dharl: "\u21C3",
      dharr: "\u21C2",
      DiacriticalAcute: "\xB4",
      DiacriticalDot: "\u02D9",
      DiacriticalDoubleAcute: "\u02DD",
      DiacriticalGrave: "`",
      DiacriticalTilde: "\u02DC",
      diam: "\u22C4",
      Diamond: "\u22C4",
      diamond: "\u22C4",
      diamondsuit: "\u2666",
      diams: "\u2666",
      die: "\xA8",
      DifferentialD: "\u2146",
      digamma: "\u03DD",
      disin: "\u22F2",
      div: "\xF7",
      divide: "\xF7",
      divideontimes: "\u22C7",
      divonx: "\u22C7",
      DJcy: "\u0402",
      djcy: "\u0452",
      dlcorn: "\u231E",
      dlcrop: "\u230D",
      dollar: "$",
      Dopf: "\u{1D53B}",
      dopf: "\u{1D555}",
      Dot: "\xA8",
      dot: "\u02D9",
      DotDot: "\u20DC",
      doteq: "\u2250",
      doteqdot: "\u2251",
      DotEqual: "\u2250",
      dotminus: "\u2238",
      dotplus: "\u2214",
      dotsquare: "\u22A1",
      doublebarwedge: "\u2306",
      DoubleContourIntegral: "\u222F",
      DoubleDot: "\xA8",
      DoubleDownArrow: "\u21D3",
      DoubleLeftArrow: "\u21D0",
      DoubleLeftRightArrow: "\u21D4",
      DoubleLeftTee: "\u2AE4",
      DoubleLongLeftArrow: "\u27F8",
      DoubleLongLeftRightArrow: "\u27FA",
      DoubleLongRightArrow: "\u27F9",
      DoubleRightArrow: "\u21D2",
      DoubleRightTee: "\u22A8",
      DoubleUpArrow: "\u21D1",
      DoubleUpDownArrow: "\u21D5",
      DoubleVerticalBar: "\u2225",
      DownArrow: "\u2193",
      Downarrow: "\u21D3",
      downarrow: "\u2193",
      DownArrowBar: "\u2913",
      DownArrowUpArrow: "\u21F5",
      DownBreve: "\u0311",
      downdownarrows: "\u21CA",
      downharpoonleft: "\u21C3",
      downharpoonright: "\u21C2",
      DownLeftRightVector: "\u2950",
      DownLeftTeeVector: "\u295E",
      DownLeftVector: "\u21BD",
      DownLeftVectorBar: "\u2956",
      DownRightTeeVector: "\u295F",
      DownRightVector: "\u21C1",
      DownRightVectorBar: "\u2957",
      DownTee: "\u22A4",
      DownTeeArrow: "\u21A7",
      drbkarow: "\u2910",
      drcorn: "\u231F",
      drcrop: "\u230C",
      Dscr: "\u{1D49F}",
      dscr: "\u{1D4B9}",
      DScy: "\u0405",
      dscy: "\u0455",
      dsol: "\u29F6",
      Dstrok: "\u0110",
      dstrok: "\u0111",
      dtdot: "\u22F1",
      dtri: "\u25BF",
      dtrif: "\u25BE",
      duarr: "\u21F5",
      duhar: "\u296F",
      dwangle: "\u29A6",
      DZcy: "\u040F",
      dzcy: "\u045F",
      dzigrarr: "\u27FF",
      Eacute: "\xC9",
      eacute: "\xE9",
      easter: "\u2A6E",
      Ecaron: "\u011A",
      ecaron: "\u011B",
      ecir: "\u2256",
      Ecirc: "\xCA",
      ecirc: "\xEA",
      ecolon: "\u2255",
      Ecy: "\u042D",
      ecy: "\u044D",
      eDDot: "\u2A77",
      Edot: "\u0116",
      eDot: "\u2251",
      edot: "\u0117",
      ee: "\u2147",
      efDot: "\u2252",
      Efr: "\u{1D508}",
      efr: "\u{1D522}",
      eg: "\u2A9A",
      Egrave: "\xC8",
      egrave: "\xE8",
      egs: "\u2A96",
      egsdot: "\u2A98",
      el: "\u2A99",
      Element: "\u2208",
      elinters: "\u23E7",
      ell: "\u2113",
      els: "\u2A95",
      elsdot: "\u2A97",
      Emacr: "\u0112",
      emacr: "\u0113",
      empty: "\u2205",
      emptyset: "\u2205",
      EmptySmallSquare: "\u25FB",
      emptyv: "\u2205",
      EmptyVerySmallSquare: "\u25AB",
      emsp: "\u2003",
      emsp13: "\u2004",
      emsp14: "\u2005",
      ENG: "\u014A",
      eng: "\u014B",
      ensp: "\u2002",
      Eogon: "\u0118",
      eogon: "\u0119",
      Eopf: "\u{1D53C}",
      eopf: "\u{1D556}",
      epar: "\u22D5",
      eparsl: "\u29E3",
      eplus: "\u2A71",
      epsi: "\u03B5",
      Epsilon: "\u0395",
      epsilon: "\u03B5",
      epsiv: "\u03F5",
      eqcirc: "\u2256",
      eqcolon: "\u2255",
      eqsim: "\u2242",
      eqslantgtr: "\u2A96",
      eqslantless: "\u2A95",
      Equal: "\u2A75",
      equals: "=",
      EqualTilde: "\u2242",
      equest: "\u225F",
      Equilibrium: "\u21CC",
      equiv: "\u2261",
      equivDD: "\u2A78",
      eqvparsl: "\u29E5",
      erarr: "\u2971",
      erDot: "\u2253",
      Escr: "\u2130",
      escr: "\u212F",
      esdot: "\u2250",
      Esim: "\u2A73",
      esim: "\u2242",
      Eta: "\u0397",
      eta: "\u03B7",
      ETH: "\xD0",
      eth: "\xF0",
      Euml: "\xCB",
      euml: "\xEB",
      euro: "\u20AC",
      excl: "!",
      exist: "\u2203",
      Exists: "\u2203",
      expectation: "\u2130",
      ExponentialE: "\u2147",
      exponentiale: "\u2147",
      fallingdotseq: "\u2252",
      Fcy: "\u0424",
      fcy: "\u0444",
      female: "\u2640",
      ffilig: "\uFB03",
      fflig: "\uFB00",
      ffllig: "\uFB04",
      Ffr: "\u{1D509}",
      ffr: "\u{1D523}",
      filig: "\uFB01",
      FilledSmallSquare: "\u25FC",
      FilledVerySmallSquare: "\u25AA",
      fjlig: "fj",
      flat: "\u266D",
      fllig: "\uFB02",
      fltns: "\u25B1",
      fnof: "\u0192",
      Fopf: "\u{1D53D}",
      fopf: "\u{1D557}",
      ForAll: "\u2200",
      forall: "\u2200",
      fork: "\u22D4",
      forkv: "\u2AD9",
      Fouriertrf: "\u2131",
      fpartint: "\u2A0D",
      frac12: "\xBD",
      frac13: "\u2153",
      frac14: "\xBC",
      frac15: "\u2155",
      frac16: "\u2159",
      frac18: "\u215B",
      frac23: "\u2154",
      frac25: "\u2156",
      frac34: "\xBE",
      frac35: "\u2157",
      frac38: "\u215C",
      frac45: "\u2158",
      frac56: "\u215A",
      frac58: "\u215D",
      frac78: "\u215E",
      frasl: "\u2044",
      frown: "\u2322",
      Fscr: "\u2131",
      fscr: "\u{1D4BB}",
      gacute: "\u01F5",
      Gamma: "\u0393",
      gamma: "\u03B3",
      Gammad: "\u03DC",
      gammad: "\u03DD",
      gap: "\u2A86",
      Gbreve: "\u011E",
      gbreve: "\u011F",
      Gcedil: "\u0122",
      Gcirc: "\u011C",
      gcirc: "\u011D",
      Gcy: "\u0413",
      gcy: "\u0433",
      Gdot: "\u0120",
      gdot: "\u0121",
      gE: "\u2267",
      ge: "\u2265",
      gEl: "\u2A8C",
      gel: "\u22DB",
      geq: "\u2265",
      geqq: "\u2267",
      geqslant: "\u2A7E",
      ges: "\u2A7E",
      gescc: "\u2AA9",
      gesdot: "\u2A80",
      gesdoto: "\u2A82",
      gesdotol: "\u2A84",
      gesl: "\u22DB\uFE00",
      gesles: "\u2A94",
      Gfr: "\u{1D50A}",
      gfr: "\u{1D524}",
      Gg: "\u22D9",
      gg: "\u226B",
      ggg: "\u22D9",
      gimel: "\u2137",
      GJcy: "\u0403",
      gjcy: "\u0453",
      gl: "\u2277",
      gla: "\u2AA5",
      glE: "\u2A92",
      glj: "\u2AA4",
      gnap: "\u2A8A",
      gnapprox: "\u2A8A",
      gnE: "\u2269",
      gne: "\u2A88",
      gneq: "\u2A88",
      gneqq: "\u2269",
      gnsim: "\u22E7",
      Gopf: "\u{1D53E}",
      gopf: "\u{1D558}",
      grave: "`",
      GreaterEqual: "\u2265",
      GreaterEqualLess: "\u22DB",
      GreaterFullEqual: "\u2267",
      GreaterGreater: "\u2AA2",
      GreaterLess: "\u2277",
      GreaterSlantEqual: "\u2A7E",
      GreaterTilde: "\u2273",
      Gscr: "\u{1D4A2}",
      gscr: "\u210A",
      gsim: "\u2273",
      gsime: "\u2A8E",
      gsiml: "\u2A90",
      Gt: "\u226B",
      GT: ">",
      gt: ">",
      gtcc: "\u2AA7",
      gtcir: "\u2A7A",
      gtdot: "\u22D7",
      gtlPar: "\u2995",
      gtquest: "\u2A7C",
      gtrapprox: "\u2A86",
      gtrarr: "\u2978",
      gtrdot: "\u22D7",
      gtreqless: "\u22DB",
      gtreqqless: "\u2A8C",
      gtrless: "\u2277",
      gtrsim: "\u2273",
      gvertneqq: "\u2269\uFE00",
      gvnE: "\u2269\uFE00",
      Hacek: "\u02C7",
      hairsp: "\u200A",
      half: "\xBD",
      hamilt: "\u210B",
      HARDcy: "\u042A",
      hardcy: "\u044A",
      hArr: "\u21D4",
      harr: "\u2194",
      harrcir: "\u2948",
      harrw: "\u21AD",
      Hat: "^",
      hbar: "\u210F",
      Hcirc: "\u0124",
      hcirc: "\u0125",
      hearts: "\u2665",
      heartsuit: "\u2665",
      hellip: "\u2026",
      hercon: "\u22B9",
      Hfr: "\u210C",
      hfr: "\u{1D525}",
      HilbertSpace: "\u210B",
      hksearow: "\u2925",
      hkswarow: "\u2926",
      hoarr: "\u21FF",
      homtht: "\u223B",
      hookleftarrow: "\u21A9",
      hookrightarrow: "\u21AA",
      Hopf: "\u210D",
      hopf: "\u{1D559}",
      horbar: "\u2015",
      HorizontalLine: "\u2500",
      Hscr: "\u210B",
      hscr: "\u{1D4BD}",
      hslash: "\u210F",
      Hstrok: "\u0126",
      hstrok: "\u0127",
      HumpDownHump: "\u224E",
      HumpEqual: "\u224F",
      hybull: "\u2043",
      hyphen: "\u2010",
      Iacute: "\xCD",
      iacute: "\xED",
      ic: "\u2063",
      Icirc: "\xCE",
      icirc: "\xEE",
      Icy: "\u0418",
      icy: "\u0438",
      Idot: "\u0130",
      IEcy: "\u0415",
      iecy: "\u0435",
      iexcl: "\xA1",
      iff: "\u21D4",
      Ifr: "\u2111",
      ifr: "\u{1D526}",
      Igrave: "\xCC",
      igrave: "\xEC",
      ii: "\u2148",
      iiiint: "\u2A0C",
      iiint: "\u222D",
      iinfin: "\u29DC",
      iiota: "\u2129",
      IJlig: "\u0132",
      ijlig: "\u0133",
      Im: "\u2111",
      Imacr: "\u012A",
      imacr: "\u012B",
      image: "\u2111",
      ImaginaryI: "\u2148",
      imagline: "\u2110",
      imagpart: "\u2111",
      imath: "\u0131",
      imof: "\u22B7",
      imped: "\u01B5",
      Implies: "\u21D2",
      in: "\u2208",
      incare: "\u2105",
      infin: "\u221E",
      infintie: "\u29DD",
      inodot: "\u0131",
      Int: "\u222C",
      int: "\u222B",
      intcal: "\u22BA",
      integers: "\u2124",
      Integral: "\u222B",
      intercal: "\u22BA",
      Intersection: "\u22C2",
      intlarhk: "\u2A17",
      intprod: "\u2A3C",
      InvisibleComma: "\u2063",
      InvisibleTimes: "\u2062",
      IOcy: "\u0401",
      iocy: "\u0451",
      Iogon: "\u012E",
      iogon: "\u012F",
      Iopf: "\u{1D540}",
      iopf: "\u{1D55A}",
      Iota: "\u0399",
      iota: "\u03B9",
      iprod: "\u2A3C",
      iquest: "\xBF",
      Iscr: "\u2110",
      iscr: "\u{1D4BE}",
      isin: "\u2208",
      isindot: "\u22F5",
      isinE: "\u22F9",
      isins: "\u22F4",
      isinsv: "\u22F3",
      isinv: "\u2208",
      it: "\u2062",
      Itilde: "\u0128",
      itilde: "\u0129",
      Iukcy: "\u0406",
      iukcy: "\u0456",
      Iuml: "\xCF",
      iuml: "\xEF",
      Jcirc: "\u0134",
      jcirc: "\u0135",
      Jcy: "\u0419",
      jcy: "\u0439",
      Jfr: "\u{1D50D}",
      jfr: "\u{1D527}",
      jmath: "\u0237",
      Jopf: "\u{1D541}",
      jopf: "\u{1D55B}",
      Jscr: "\u{1D4A5}",
      jscr: "\u{1D4BF}",
      Jsercy: "\u0408",
      jsercy: "\u0458",
      Jukcy: "\u0404",
      jukcy: "\u0454",
      Kappa: "\u039A",
      kappa: "\u03BA",
      kappav: "\u03F0",
      Kcedil: "\u0136",
      kcedil: "\u0137",
      Kcy: "\u041A",
      kcy: "\u043A",
      Kfr: "\u{1D50E}",
      kfr: "\u{1D528}",
      kgreen: "\u0138",
      KHcy: "\u0425",
      khcy: "\u0445",
      KJcy: "\u040C",
      kjcy: "\u045C",
      Kopf: "\u{1D542}",
      kopf: "\u{1D55C}",
      Kscr: "\u{1D4A6}",
      kscr: "\u{1D4C0}",
      lAarr: "\u21DA",
      Lacute: "\u0139",
      lacute: "\u013A",
      laemptyv: "\u29B4",
      lagran: "\u2112",
      Lambda: "\u039B",
      lambda: "\u03BB",
      Lang: "\u27EA",
      lang: "\u27E8",
      langd: "\u2991",
      langle: "\u27E8",
      lap: "\u2A85",
      Laplacetrf: "\u2112",
      laquo: "\xAB",
      Larr: "\u219E",
      lArr: "\u21D0",
      larr: "\u2190",
      larrb: "\u21E4",
      larrbfs: "\u291F",
      larrfs: "\u291D",
      larrhk: "\u21A9",
      larrlp: "\u21AB",
      larrpl: "\u2939",
      larrsim: "\u2973",
      larrtl: "\u21A2",
      lat: "\u2AAB",
      lAtail: "\u291B",
      latail: "\u2919",
      late: "\u2AAD",
      lates: "\u2AAD\uFE00",
      lBarr: "\u290E",
      lbarr: "\u290C",
      lbbrk: "\u2772",
      lbrace: "{",
      lbrack: "[",
      lbrke: "\u298B",
      lbrksld: "\u298F",
      lbrkslu: "\u298D",
      Lcaron: "\u013D",
      lcaron: "\u013E",
      Lcedil: "\u013B",
      lcedil: "\u013C",
      lceil: "\u2308",
      lcub: "{",
      Lcy: "\u041B",
      lcy: "\u043B",
      ldca: "\u2936",
      ldquo: "\u201C",
      ldquor: "\u201E",
      ldrdhar: "\u2967",
      ldrushar: "\u294B",
      ldsh: "\u21B2",
      lE: "\u2266",
      le: "\u2264",
      LeftAngleBracket: "\u27E8",
      LeftArrow: "\u2190",
      Leftarrow: "\u21D0",
      leftarrow: "\u2190",
      LeftArrowBar: "\u21E4",
      LeftArrowRightArrow: "\u21C6",
      leftarrowtail: "\u21A2",
      LeftCeiling: "\u2308",
      LeftDoubleBracket: "\u27E6",
      LeftDownTeeVector: "\u2961",
      LeftDownVector: "\u21C3",
      LeftDownVectorBar: "\u2959",
      LeftFloor: "\u230A",
      leftharpoondown: "\u21BD",
      leftharpoonup: "\u21BC",
      leftleftarrows: "\u21C7",
      LeftRightArrow: "\u2194",
      Leftrightarrow: "\u21D4",
      leftrightarrow: "\u2194",
      leftrightarrows: "\u21C6",
      leftrightharpoons: "\u21CB",
      leftrightsquigarrow: "\u21AD",
      LeftRightVector: "\u294E",
      LeftTee: "\u22A3",
      LeftTeeArrow: "\u21A4",
      LeftTeeVector: "\u295A",
      leftthreetimes: "\u22CB",
      LeftTriangle: "\u22B2",
      LeftTriangleBar: "\u29CF",
      LeftTriangleEqual: "\u22B4",
      LeftUpDownVector: "\u2951",
      LeftUpTeeVector: "\u2960",
      LeftUpVector: "\u21BF",
      LeftUpVectorBar: "\u2958",
      LeftVector: "\u21BC",
      LeftVectorBar: "\u2952",
      lEg: "\u2A8B",
      leg: "\u22DA",
      leq: "\u2264",
      leqq: "\u2266",
      leqslant: "\u2A7D",
      les: "\u2A7D",
      lescc: "\u2AA8",
      lesdot: "\u2A7F",
      lesdoto: "\u2A81",
      lesdotor: "\u2A83",
      lesg: "\u22DA\uFE00",
      lesges: "\u2A93",
      lessapprox: "\u2A85",
      lessdot: "\u22D6",
      lesseqgtr: "\u22DA",
      lesseqqgtr: "\u2A8B",
      LessEqualGreater: "\u22DA",
      LessFullEqual: "\u2266",
      LessGreater: "\u2276",
      lessgtr: "\u2276",
      LessLess: "\u2AA1",
      lesssim: "\u2272",
      LessSlantEqual: "\u2A7D",
      LessTilde: "\u2272",
      lfisht: "\u297C",
      lfloor: "\u230A",
      Lfr: "\u{1D50F}",
      lfr: "\u{1D529}",
      lg: "\u2276",
      lgE: "\u2A91",
      lHar: "\u2962",
      lhard: "\u21BD",
      lharu: "\u21BC",
      lharul: "\u296A",
      lhblk: "\u2584",
      LJcy: "\u0409",
      ljcy: "\u0459",
      Ll: "\u22D8",
      ll: "\u226A",
      llarr: "\u21C7",
      llcorner: "\u231E",
      Lleftarrow: "\u21DA",
      llhard: "\u296B",
      lltri: "\u25FA",
      Lmidot: "\u013F",
      lmidot: "\u0140",
      lmoust: "\u23B0",
      lmoustache: "\u23B0",
      lnap: "\u2A89",
      lnapprox: "\u2A89",
      lnE: "\u2268",
      lne: "\u2A87",
      lneq: "\u2A87",
      lneqq: "\u2268",
      lnsim: "\u22E6",
      loang: "\u27EC",
      loarr: "\u21FD",
      lobrk: "\u27E6",
      LongLeftArrow: "\u27F5",
      Longleftarrow: "\u27F8",
      longleftarrow: "\u27F5",
      LongLeftRightArrow: "\u27F7",
      Longleftrightarrow: "\u27FA",
      longleftrightarrow: "\u27F7",
      longmapsto: "\u27FC",
      LongRightArrow: "\u27F6",
      Longrightarrow: "\u27F9",
      longrightarrow: "\u27F6",
      looparrowleft: "\u21AB",
      looparrowright: "\u21AC",
      lopar: "\u2985",
      Lopf: "\u{1D543}",
      lopf: "\u{1D55D}",
      loplus: "\u2A2D",
      lotimes: "\u2A34",
      lowast: "\u2217",
      lowbar: "_",
      LowerLeftArrow: "\u2199",
      LowerRightArrow: "\u2198",
      loz: "\u25CA",
      lozenge: "\u25CA",
      lozf: "\u29EB",
      lpar: "(",
      lparlt: "\u2993",
      lrarr: "\u21C6",
      lrcorner: "\u231F",
      lrhar: "\u21CB",
      lrhard: "\u296D",
      lrm: "\u200E",
      lrtri: "\u22BF",
      lsaquo: "\u2039",
      Lscr: "\u2112",
      lscr: "\u{1D4C1}",
      Lsh: "\u21B0",
      lsh: "\u21B0",
      lsim: "\u2272",
      lsime: "\u2A8D",
      lsimg: "\u2A8F",
      lsqb: "[",
      lsquo: "\u2018",
      lsquor: "\u201A",
      Lstrok: "\u0141",
      lstrok: "\u0142",
      Lt: "\u226A",
      LT: "<",
      lt: "<",
      ltcc: "\u2AA6",
      ltcir: "\u2A79",
      ltdot: "\u22D6",
      lthree: "\u22CB",
      ltimes: "\u22C9",
      ltlarr: "\u2976",
      ltquest: "\u2A7B",
      ltri: "\u25C3",
      ltrie: "\u22B4",
      ltrif: "\u25C2",
      ltrPar: "\u2996",
      lurdshar: "\u294A",
      luruhar: "\u2966",
      lvertneqq: "\u2268\uFE00",
      lvnE: "\u2268\uFE00",
      macr: "\xAF",
      male: "\u2642",
      malt: "\u2720",
      maltese: "\u2720",
      Map: "\u2905",
      map: "\u21A6",
      mapsto: "\u21A6",
      mapstodown: "\u21A7",
      mapstoleft: "\u21A4",
      mapstoup: "\u21A5",
      marker: "\u25AE",
      mcomma: "\u2A29",
      Mcy: "\u041C",
      mcy: "\u043C",
      mdash: "\u2014",
      mDDot: "\u223A",
      measuredangle: "\u2221",
      MediumSpace: "\u205F",
      Mellintrf: "\u2133",
      Mfr: "\u{1D510}",
      mfr: "\u{1D52A}",
      mho: "\u2127",
      micro: "\xB5",
      mid: "\u2223",
      midast: "*",
      midcir: "\u2AF0",
      middot: "\xB7",
      minus: "\u2212",
      minusb: "\u229F",
      minusd: "\u2238",
      minusdu: "\u2A2A",
      MinusPlus: "\u2213",
      mlcp: "\u2ADB",
      mldr: "\u2026",
      mnplus: "\u2213",
      models: "\u22A7",
      Mopf: "\u{1D544}",
      mopf: "\u{1D55E}",
      mp: "\u2213",
      Mscr: "\u2133",
      mscr: "\u{1D4C2}",
      mstpos: "\u223E",
      Mu: "\u039C",
      mu: "\u03BC",
      multimap: "\u22B8",
      mumap: "\u22B8",
      nabla: "\u2207",
      Nacute: "\u0143",
      nacute: "\u0144",
      nang: "\u2220\u20D2",
      nap: "\u2249",
      napE: "\u2A70\u0338",
      napid: "\u224B\u0338",
      napos: "\u0149",
      napprox: "\u2249",
      natur: "\u266E",
      natural: "\u266E",
      naturals: "\u2115",
      nbsp: "\xA0",
      nbump: "\u224E\u0338",
      nbumpe: "\u224F\u0338",
      ncap: "\u2A43",
      Ncaron: "\u0147",
      ncaron: "\u0148",
      Ncedil: "\u0145",
      ncedil: "\u0146",
      ncong: "\u2247",
      ncongdot: "\u2A6D\u0338",
      ncup: "\u2A42",
      Ncy: "\u041D",
      ncy: "\u043D",
      ndash: "\u2013",
      ne: "\u2260",
      nearhk: "\u2924",
      neArr: "\u21D7",
      nearr: "\u2197",
      nearrow: "\u2197",
      nedot: "\u2250\u0338",
      NegativeMediumSpace: "\u200B",
      NegativeThickSpace: "\u200B",
      NegativeThinSpace: "\u200B",
      NegativeVeryThinSpace: "\u200B",
      nequiv: "\u2262",
      nesear: "\u2928",
      nesim: "\u2242\u0338",
      NestedGreaterGreater: "\u226B",
      NestedLessLess: "\u226A",
      NewLine: "\n",
      nexist: "\u2204",
      nexists: "\u2204",
      Nfr: "\u{1D511}",
      nfr: "\u{1D52B}",
      ngE: "\u2267\u0338",
      nge: "\u2271",
      ngeq: "\u2271",
      ngeqq: "\u2267\u0338",
      ngeqslant: "\u2A7E\u0338",
      nges: "\u2A7E\u0338",
      nGg: "\u22D9\u0338",
      ngsim: "\u2275",
      nGt: "\u226B\u20D2",
      ngt: "\u226F",
      ngtr: "\u226F",
      nGtv: "\u226B\u0338",
      nhArr: "\u21CE",
      nharr: "\u21AE",
      nhpar: "\u2AF2",
      ni: "\u220B",
      nis: "\u22FC",
      nisd: "\u22FA",
      niv: "\u220B",
      NJcy: "\u040A",
      njcy: "\u045A",
      nlArr: "\u21CD",
      nlarr: "\u219A",
      nldr: "\u2025",
      nlE: "\u2266\u0338",
      nle: "\u2270",
      nLeftarrow: "\u21CD",
      nleftarrow: "\u219A",
      nLeftrightarrow: "\u21CE",
      nleftrightarrow: "\u21AE",
      nleq: "\u2270",
      nleqq: "\u2266\u0338",
      nleqslant: "\u2A7D\u0338",
      nles: "\u2A7D\u0338",
      nless: "\u226E",
      nLl: "\u22D8\u0338",
      nlsim: "\u2274",
      nLt: "\u226A\u20D2",
      nlt: "\u226E",
      nltri: "\u22EA",
      nltrie: "\u22EC",
      nLtv: "\u226A\u0338",
      nmid: "\u2224",
      NoBreak: "\u2060",
      NonBreakingSpace: "\xA0",
      Nopf: "\u2115",
      nopf: "\u{1D55F}",
      Not: "\u2AEC",
      not: "\xAC",
      NotCongruent: "\u2262",
      NotCupCap: "\u226D",
      NotDoubleVerticalBar: "\u2226",
      NotElement: "\u2209",
      NotEqual: "\u2260",
      NotEqualTilde: "\u2242\u0338",
      NotExists: "\u2204",
      NotGreater: "\u226F",
      NotGreaterEqual: "\u2271",
      NotGreaterFullEqual: "\u2267\u0338",
      NotGreaterGreater: "\u226B\u0338",
      NotGreaterLess: "\u2279",
      NotGreaterSlantEqual: "\u2A7E\u0338",
      NotGreaterTilde: "\u2275",
      NotHumpDownHump: "\u224E\u0338",
      NotHumpEqual: "\u224F\u0338",
      notin: "\u2209",
      notindot: "\u22F5\u0338",
      notinE: "\u22F9\u0338",
      notinva: "\u2209",
      notinvb: "\u22F7",
      notinvc: "\u22F6",
      NotLeftTriangle: "\u22EA",
      NotLeftTriangleBar: "\u29CF\u0338",
      NotLeftTriangleEqual: "\u22EC",
      NotLess: "\u226E",
      NotLessEqual: "\u2270",
      NotLessGreater: "\u2278",
      NotLessLess: "\u226A\u0338",
      NotLessSlantEqual: "\u2A7D\u0338",
      NotLessTilde: "\u2274",
      NotNestedGreaterGreater: "\u2AA2\u0338",
      NotNestedLessLess: "\u2AA1\u0338",
      notni: "\u220C",
      notniva: "\u220C",
      notnivb: "\u22FE",
      notnivc: "\u22FD",
      NotPrecedes: "\u2280",
      NotPrecedesEqual: "\u2AAF\u0338",
      NotPrecedesSlantEqual: "\u22E0",
      NotReverseElement: "\u220C",
      NotRightTriangle: "\u22EB",
      NotRightTriangleBar: "\u29D0\u0338",
      NotRightTriangleEqual: "\u22ED",
      NotSquareSubset: "\u228F\u0338",
      NotSquareSubsetEqual: "\u22E2",
      NotSquareSuperset: "\u2290\u0338",
      NotSquareSupersetEqual: "\u22E3",
      NotSubset: "\u2282\u20D2",
      NotSubsetEqual: "\u2288",
      NotSucceeds: "\u2281",
      NotSucceedsEqual: "\u2AB0\u0338",
      NotSucceedsSlantEqual: "\u22E1",
      NotSucceedsTilde: "\u227F\u0338",
      NotSuperset: "\u2283\u20D2",
      NotSupersetEqual: "\u2289",
      NotTilde: "\u2241",
      NotTildeEqual: "\u2244",
      NotTildeFullEqual: "\u2247",
      NotTildeTilde: "\u2249",
      NotVerticalBar: "\u2224",
      npar: "\u2226",
      nparallel: "\u2226",
      nparsl: "\u2AFD\u20E5",
      npart: "\u2202\u0338",
      npolint: "\u2A14",
      npr: "\u2280",
      nprcue: "\u22E0",
      npre: "\u2AAF\u0338",
      nprec: "\u2280",
      npreceq: "\u2AAF\u0338",
      nrArr: "\u21CF",
      nrarr: "\u219B",
      nrarrc: "\u2933\u0338",
      nrarrw: "\u219D\u0338",
      nRightarrow: "\u21CF",
      nrightarrow: "\u219B",
      nrtri: "\u22EB",
      nrtrie: "\u22ED",
      nsc: "\u2281",
      nsccue: "\u22E1",
      nsce: "\u2AB0\u0338",
      Nscr: "\u{1D4A9}",
      nscr: "\u{1D4C3}",
      nshortmid: "\u2224",
      nshortparallel: "\u2226",
      nsim: "\u2241",
      nsime: "\u2244",
      nsimeq: "\u2244",
      nsmid: "\u2224",
      nspar: "\u2226",
      nsqsube: "\u22E2",
      nsqsupe: "\u22E3",
      nsub: "\u2284",
      nsubE: "\u2AC5\u0338",
      nsube: "\u2288",
      nsubset: "\u2282\u20D2",
      nsubseteq: "\u2288",
      nsubseteqq: "\u2AC5\u0338",
      nsucc: "\u2281",
      nsucceq: "\u2AB0\u0338",
      nsup: "\u2285",
      nsupE: "\u2AC6\u0338",
      nsupe: "\u2289",
      nsupset: "\u2283\u20D2",
      nsupseteq: "\u2289",
      nsupseteqq: "\u2AC6\u0338",
      ntgl: "\u2279",
      Ntilde: "\xD1",
      ntilde: "\xF1",
      ntlg: "\u2278",
      ntriangleleft: "\u22EA",
      ntrianglelefteq: "\u22EC",
      ntriangleright: "\u22EB",
      ntrianglerighteq: "\u22ED",
      Nu: "\u039D",
      nu: "\u03BD",
      num: "#",
      numero: "\u2116",
      numsp: "\u2007",
      nvap: "\u224D\u20D2",
      nVDash: "\u22AF",
      nVdash: "\u22AE",
      nvDash: "\u22AD",
      nvdash: "\u22AC",
      nvge: "\u2265\u20D2",
      nvgt: ">\u20D2",
      nvHarr: "\u2904",
      nvinfin: "\u29DE",
      nvlArr: "\u2902",
      nvle: "\u2264\u20D2",
      nvlt: "<\u20D2",
      nvltrie: "\u22B4\u20D2",
      nvrArr: "\u2903",
      nvrtrie: "\u22B5\u20D2",
      nvsim: "\u223C\u20D2",
      nwarhk: "\u2923",
      nwArr: "\u21D6",
      nwarr: "\u2196",
      nwarrow: "\u2196",
      nwnear: "\u2927",
      Oacute: "\xD3",
      oacute: "\xF3",
      oast: "\u229B",
      ocir: "\u229A",
      Ocirc: "\xD4",
      ocirc: "\xF4",
      Ocy: "\u041E",
      ocy: "\u043E",
      odash: "\u229D",
      Odblac: "\u0150",
      odblac: "\u0151",
      odiv: "\u2A38",
      odot: "\u2299",
      odsold: "\u29BC",
      OElig: "\u0152",
      oelig: "\u0153",
      ofcir: "\u29BF",
      Ofr: "\u{1D512}",
      ofr: "\u{1D52C}",
      ogon: "\u02DB",
      Ograve: "\xD2",
      ograve: "\xF2",
      ogt: "\u29C1",
      ohbar: "\u29B5",
      ohm: "\u03A9",
      oint: "\u222E",
      olarr: "\u21BA",
      olcir: "\u29BE",
      olcross: "\u29BB",
      oline: "\u203E",
      olt: "\u29C0",
      Omacr: "\u014C",
      omacr: "\u014D",
      Omega: "\u03A9",
      omega: "\u03C9",
      Omicron: "\u039F",
      omicron: "\u03BF",
      omid: "\u29B6",
      ominus: "\u2296",
      Oopf: "\u{1D546}",
      oopf: "\u{1D560}",
      opar: "\u29B7",
      OpenCurlyDoubleQuote: "\u201C",
      OpenCurlyQuote: "\u2018",
      operp: "\u29B9",
      oplus: "\u2295",
      Or: "\u2A54",
      or: "\u2228",
      orarr: "\u21BB",
      ord: "\u2A5D",
      order: "\u2134",
      orderof: "\u2134",
      ordf: "\xAA",
      ordm: "\xBA",
      origof: "\u22B6",
      oror: "\u2A56",
      orslope: "\u2A57",
      orv: "\u2A5B",
      oS: "\u24C8",
      Oscr: "\u{1D4AA}",
      oscr: "\u2134",
      Oslash: "\xD8",
      oslash: "\xF8",
      osol: "\u2298",
      Otilde: "\xD5",
      otilde: "\xF5",
      Otimes: "\u2A37",
      otimes: "\u2297",
      otimesas: "\u2A36",
      Ouml: "\xD6",
      ouml: "\xF6",
      ovbar: "\u233D",
      OverBar: "\u203E",
      OverBrace: "\u23DE",
      OverBracket: "\u23B4",
      OverParenthesis: "\u23DC",
      par: "\u2225",
      para: "\xB6",
      parallel: "\u2225",
      parsim: "\u2AF3",
      parsl: "\u2AFD",
      part: "\u2202",
      PartialD: "\u2202",
      Pcy: "\u041F",
      pcy: "\u043F",
      percnt: "%",
      period: ".",
      permil: "\u2030",
      perp: "\u22A5",
      pertenk: "\u2031",
      Pfr: "\u{1D513}",
      pfr: "\u{1D52D}",
      Phi: "\u03A6",
      phi: "\u03C6",
      phiv: "\u03D5",
      phmmat: "\u2133",
      phone: "\u260E",
      Pi: "\u03A0",
      pi: "\u03C0",
      pitchfork: "\u22D4",
      piv: "\u03D6",
      planck: "\u210F",
      planckh: "\u210E",
      plankv: "\u210F",
      plus: "+",
      plusacir: "\u2A23",
      plusb: "\u229E",
      pluscir: "\u2A22",
      plusdo: "\u2214",
      plusdu: "\u2A25",
      pluse: "\u2A72",
      PlusMinus: "\xB1",
      plusmn: "\xB1",
      plussim: "\u2A26",
      plustwo: "\u2A27",
      pm: "\xB1",
      Poincareplane: "\u210C",
      pointint: "\u2A15",
      Popf: "\u2119",
      popf: "\u{1D561}",
      pound: "\xA3",
      Pr: "\u2ABB",
      pr: "\u227A",
      prap: "\u2AB7",
      prcue: "\u227C",
      prE: "\u2AB3",
      pre: "\u2AAF",
      prec: "\u227A",
      precapprox: "\u2AB7",
      preccurlyeq: "\u227C",
      Precedes: "\u227A",
      PrecedesEqual: "\u2AAF",
      PrecedesSlantEqual: "\u227C",
      PrecedesTilde: "\u227E",
      preceq: "\u2AAF",
      precnapprox: "\u2AB9",
      precneqq: "\u2AB5",
      precnsim: "\u22E8",
      precsim: "\u227E",
      Prime: "\u2033",
      prime: "\u2032",
      primes: "\u2119",
      prnap: "\u2AB9",
      prnE: "\u2AB5",
      prnsim: "\u22E8",
      prod: "\u220F",
      Product: "\u220F",
      profalar: "\u232E",
      profline: "\u2312",
      profsurf: "\u2313",
      prop: "\u221D",
      Proportion: "\u2237",
      Proportional: "\u221D",
      propto: "\u221D",
      prsim: "\u227E",
      prurel: "\u22B0",
      Pscr: "\u{1D4AB}",
      pscr: "\u{1D4C5}",
      Psi: "\u03A8",
      psi: "\u03C8",
      puncsp: "\u2008",
      Qfr: "\u{1D514}",
      qfr: "\u{1D52E}",
      qint: "\u2A0C",
      Qopf: "\u211A",
      qopf: "\u{1D562}",
      qprime: "\u2057",
      Qscr: "\u{1D4AC}",
      qscr: "\u{1D4C6}",
      quaternions: "\u210D",
      quatint: "\u2A16",
      quest: "?",
      questeq: "\u225F",
      QUOT: '"',
      quot: '"',
      rAarr: "\u21DB",
      race: "\u223D\u0331",
      Racute: "\u0154",
      racute: "\u0155",
      radic: "\u221A",
      raemptyv: "\u29B3",
      Rang: "\u27EB",
      rang: "\u27E9",
      rangd: "\u2992",
      range: "\u29A5",
      rangle: "\u27E9",
      raquo: "\xBB",
      Rarr: "\u21A0",
      rArr: "\u21D2",
      rarr: "\u2192",
      rarrap: "\u2975",
      rarrb: "\u21E5",
      rarrbfs: "\u2920",
      rarrc: "\u2933",
      rarrfs: "\u291E",
      rarrhk: "\u21AA",
      rarrlp: "\u21AC",
      rarrpl: "\u2945",
      rarrsim: "\u2974",
      Rarrtl: "\u2916",
      rarrtl: "\u21A3",
      rarrw: "\u219D",
      rAtail: "\u291C",
      ratail: "\u291A",
      ratio: "\u2236",
      rationals: "\u211A",
      RBarr: "\u2910",
      rBarr: "\u290F",
      rbarr: "\u290D",
      rbbrk: "\u2773",
      rbrace: "}",
      rbrack: "]",
      rbrke: "\u298C",
      rbrksld: "\u298E",
      rbrkslu: "\u2990",
      Rcaron: "\u0158",
      rcaron: "\u0159",
      Rcedil: "\u0156",
      rcedil: "\u0157",
      rceil: "\u2309",
      rcub: "}",
      Rcy: "\u0420",
      rcy: "\u0440",
      rdca: "\u2937",
      rdldhar: "\u2969",
      rdquo: "\u201D",
      rdquor: "\u201D",
      rdsh: "\u21B3",
      Re: "\u211C",
      real: "\u211C",
      realine: "\u211B",
      realpart: "\u211C",
      reals: "\u211D",
      rect: "\u25AD",
      REG: "\xAE",
      reg: "\xAE",
      ReverseElement: "\u220B",
      ReverseEquilibrium: "\u21CB",
      ReverseUpEquilibrium: "\u296F",
      rfisht: "\u297D",
      rfloor: "\u230B",
      Rfr: "\u211C",
      rfr: "\u{1D52F}",
      rHar: "\u2964",
      rhard: "\u21C1",
      rharu: "\u21C0",
      rharul: "\u296C",
      Rho: "\u03A1",
      rho: "\u03C1",
      rhov: "\u03F1",
      RightAngleBracket: "\u27E9",
      RightArrow: "\u2192",
      Rightarrow: "\u21D2",
      rightarrow: "\u2192",
      RightArrowBar: "\u21E5",
      RightArrowLeftArrow: "\u21C4",
      rightarrowtail: "\u21A3",
      RightCeiling: "\u2309",
      RightDoubleBracket: "\u27E7",
      RightDownTeeVector: "\u295D",
      RightDownVector: "\u21C2",
      RightDownVectorBar: "\u2955",
      RightFloor: "\u230B",
      rightharpoondown: "\u21C1",
      rightharpoonup: "\u21C0",
      rightleftarrows: "\u21C4",
      rightleftharpoons: "\u21CC",
      rightrightarrows: "\u21C9",
      rightsquigarrow: "\u219D",
      RightTee: "\u22A2",
      RightTeeArrow: "\u21A6",
      RightTeeVector: "\u295B",
      rightthreetimes: "\u22CC",
      RightTriangle: "\u22B3",
      RightTriangleBar: "\u29D0",
      RightTriangleEqual: "\u22B5",
      RightUpDownVector: "\u294F",
      RightUpTeeVector: "\u295C",
      RightUpVector: "\u21BE",
      RightUpVectorBar: "\u2954",
      RightVector: "\u21C0",
      RightVectorBar: "\u2953",
      ring: "\u02DA",
      risingdotseq: "\u2253",
      rlarr: "\u21C4",
      rlhar: "\u21CC",
      rlm: "\u200F",
      rmoust: "\u23B1",
      rmoustache: "\u23B1",
      rnmid: "\u2AEE",
      roang: "\u27ED",
      roarr: "\u21FE",
      robrk: "\u27E7",
      ropar: "\u2986",
      Ropf: "\u211D",
      ropf: "\u{1D563}",
      roplus: "\u2A2E",
      rotimes: "\u2A35",
      RoundImplies: "\u2970",
      rpar: ")",
      rpargt: "\u2994",
      rppolint: "\u2A12",
      rrarr: "\u21C9",
      Rrightarrow: "\u21DB",
      rsaquo: "\u203A",
      Rscr: "\u211B",
      rscr: "\u{1D4C7}",
      Rsh: "\u21B1",
      rsh: "\u21B1",
      rsqb: "]",
      rsquo: "\u2019",
      rsquor: "\u2019",
      rthree: "\u22CC",
      rtimes: "\u22CA",
      rtri: "\u25B9",
      rtrie: "\u22B5",
      rtrif: "\u25B8",
      rtriltri: "\u29CE",
      RuleDelayed: "\u29F4",
      ruluhar: "\u2968",
      rx: "\u211E",
      Sacute: "\u015A",
      sacute: "\u015B",
      sbquo: "\u201A",
      Sc: "\u2ABC",
      sc: "\u227B",
      scap: "\u2AB8",
      Scaron: "\u0160",
      scaron: "\u0161",
      sccue: "\u227D",
      scE: "\u2AB4",
      sce: "\u2AB0",
      Scedil: "\u015E",
      scedil: "\u015F",
      Scirc: "\u015C",
      scirc: "\u015D",
      scnap: "\u2ABA",
      scnE: "\u2AB6",
      scnsim: "\u22E9",
      scpolint: "\u2A13",
      scsim: "\u227F",
      Scy: "\u0421",
      scy: "\u0441",
      sdot: "\u22C5",
      sdotb: "\u22A1",
      sdote: "\u2A66",
      searhk: "\u2925",
      seArr: "\u21D8",
      searr: "\u2198",
      searrow: "\u2198",
      sect: "\xA7",
      semi: ";",
      seswar: "\u2929",
      setminus: "\u2216",
      setmn: "\u2216",
      sext: "\u2736",
      Sfr: "\u{1D516}",
      sfr: "\u{1D530}",
      sfrown: "\u2322",
      sharp: "\u266F",
      SHCHcy: "\u0429",
      shchcy: "\u0449",
      SHcy: "\u0428",
      shcy: "\u0448",
      ShortDownArrow: "\u2193",
      ShortLeftArrow: "\u2190",
      shortmid: "\u2223",
      shortparallel: "\u2225",
      ShortRightArrow: "\u2192",
      ShortUpArrow: "\u2191",
      shy: "\xAD",
      Sigma: "\u03A3",
      sigma: "\u03C3",
      sigmaf: "\u03C2",
      sigmav: "\u03C2",
      sim: "\u223C",
      simdot: "\u2A6A",
      sime: "\u2243",
      simeq: "\u2243",
      simg: "\u2A9E",
      simgE: "\u2AA0",
      siml: "\u2A9D",
      simlE: "\u2A9F",
      simne: "\u2246",
      simplus: "\u2A24",
      simrarr: "\u2972",
      slarr: "\u2190",
      SmallCircle: "\u2218",
      smallsetminus: "\u2216",
      smashp: "\u2A33",
      smeparsl: "\u29E4",
      smid: "\u2223",
      smile: "\u2323",
      smt: "\u2AAA",
      smte: "\u2AAC",
      smtes: "\u2AAC\uFE00",
      SOFTcy: "\u042C",
      softcy: "\u044C",
      sol: "/",
      solb: "\u29C4",
      solbar: "\u233F",
      Sopf: "\u{1D54A}",
      sopf: "\u{1D564}",
      spades: "\u2660",
      spadesuit: "\u2660",
      spar: "\u2225",
      sqcap: "\u2293",
      sqcaps: "\u2293\uFE00",
      sqcup: "\u2294",
      sqcups: "\u2294\uFE00",
      Sqrt: "\u221A",
      sqsub: "\u228F",
      sqsube: "\u2291",
      sqsubset: "\u228F",
      sqsubseteq: "\u2291",
      sqsup: "\u2290",
      sqsupe: "\u2292",
      sqsupset: "\u2290",
      sqsupseteq: "\u2292",
      squ: "\u25A1",
      Square: "\u25A1",
      square: "\u25A1",
      SquareIntersection: "\u2293",
      SquareSubset: "\u228F",
      SquareSubsetEqual: "\u2291",
      SquareSuperset: "\u2290",
      SquareSupersetEqual: "\u2292",
      SquareUnion: "\u2294",
      squarf: "\u25AA",
      squf: "\u25AA",
      srarr: "\u2192",
      Sscr: "\u{1D4AE}",
      sscr: "\u{1D4C8}",
      ssetmn: "\u2216",
      ssmile: "\u2323",
      sstarf: "\u22C6",
      Star: "\u22C6",
      star: "\u2606",
      starf: "\u2605",
      straightepsilon: "\u03F5",
      straightphi: "\u03D5",
      strns: "\xAF",
      Sub: "\u22D0",
      sub: "\u2282",
      subdot: "\u2ABD",
      subE: "\u2AC5",
      sube: "\u2286",
      subedot: "\u2AC3",
      submult: "\u2AC1",
      subnE: "\u2ACB",
      subne: "\u228A",
      subplus: "\u2ABF",
      subrarr: "\u2979",
      Subset: "\u22D0",
      subset: "\u2282",
      subseteq: "\u2286",
      subseteqq: "\u2AC5",
      SubsetEqual: "\u2286",
      subsetneq: "\u228A",
      subsetneqq: "\u2ACB",
      subsim: "\u2AC7",
      subsub: "\u2AD5",
      subsup: "\u2AD3",
      succ: "\u227B",
      succapprox: "\u2AB8",
      succcurlyeq: "\u227D",
      Succeeds: "\u227B",
      SucceedsEqual: "\u2AB0",
      SucceedsSlantEqual: "\u227D",
      SucceedsTilde: "\u227F",
      succeq: "\u2AB0",
      succnapprox: "\u2ABA",
      succneqq: "\u2AB6",
      succnsim: "\u22E9",
      succsim: "\u227F",
      SuchThat: "\u220B",
      Sum: "\u2211",
      sum: "\u2211",
      sung: "\u266A",
      Sup: "\u22D1",
      sup: "\u2283",
      sup1: "\xB9",
      sup2: "\xB2",
      sup3: "\xB3",
      supdot: "\u2ABE",
      supdsub: "\u2AD8",
      supE: "\u2AC6",
      supe: "\u2287",
      supedot: "\u2AC4",
      Superset: "\u2283",
      SupersetEqual: "\u2287",
      suphsol: "\u27C9",
      suphsub: "\u2AD7",
      suplarr: "\u297B",
      supmult: "\u2AC2",
      supnE: "\u2ACC",
      supne: "\u228B",
      supplus: "\u2AC0",
      Supset: "\u22D1",
      supset: "\u2283",
      supseteq: "\u2287",
      supseteqq: "\u2AC6",
      supsetneq: "\u228B",
      supsetneqq: "\u2ACC",
      supsim: "\u2AC8",
      supsub: "\u2AD4",
      supsup: "\u2AD6",
      swarhk: "\u2926",
      swArr: "\u21D9",
      swarr: "\u2199",
      swarrow: "\u2199",
      swnwar: "\u292A",
      szlig: "\xDF",
      Tab: "	",
      target: "\u2316",
      Tau: "\u03A4",
      tau: "\u03C4",
      tbrk: "\u23B4",
      Tcaron: "\u0164",
      tcaron: "\u0165",
      Tcedil: "\u0162",
      tcedil: "\u0163",
      Tcy: "\u0422",
      tcy: "\u0442",
      tdot: "\u20DB",
      telrec: "\u2315",
      Tfr: "\u{1D517}",
      tfr: "\u{1D531}",
      there4: "\u2234",
      Therefore: "\u2234",
      therefore: "\u2234",
      Theta: "\u0398",
      theta: "\u03B8",
      thetasym: "\u03D1",
      thetav: "\u03D1",
      thickapprox: "\u2248",
      thicksim: "\u223C",
      ThickSpace: "\u205F\u200A",
      thinsp: "\u2009",
      ThinSpace: "\u2009",
      thkap: "\u2248",
      thksim: "\u223C",
      THORN: "\xDE",
      thorn: "\xFE",
      Tilde: "\u223C",
      tilde: "\u02DC",
      TildeEqual: "\u2243",
      TildeFullEqual: "\u2245",
      TildeTilde: "\u2248",
      times: "\xD7",
      timesb: "\u22A0",
      timesbar: "\u2A31",
      timesd: "\u2A30",
      tint: "\u222D",
      toea: "\u2928",
      top: "\u22A4",
      topbot: "\u2336",
      topcir: "\u2AF1",
      Topf: "\u{1D54B}",
      topf: "\u{1D565}",
      topfork: "\u2ADA",
      tosa: "\u2929",
      tprime: "\u2034",
      TRADE: "\u2122",
      trade: "\u2122",
      triangle: "\u25B5",
      triangledown: "\u25BF",
      triangleleft: "\u25C3",
      trianglelefteq: "\u22B4",
      triangleq: "\u225C",
      triangleright: "\u25B9",
      trianglerighteq: "\u22B5",
      tridot: "\u25EC",
      trie: "\u225C",
      triminus: "\u2A3A",
      TripleDot: "\u20DB",
      triplus: "\u2A39",
      trisb: "\u29CD",
      tritime: "\u2A3B",
      trpezium: "\u23E2",
      Tscr: "\u{1D4AF}",
      tscr: "\u{1D4C9}",
      TScy: "\u0426",
      tscy: "\u0446",
      TSHcy: "\u040B",
      tshcy: "\u045B",
      Tstrok: "\u0166",
      tstrok: "\u0167",
      twixt: "\u226C",
      twoheadleftarrow: "\u219E",
      twoheadrightarrow: "\u21A0",
      Uacute: "\xDA",
      uacute: "\xFA",
      Uarr: "\u219F",
      uArr: "\u21D1",
      uarr: "\u2191",
      Uarrocir: "\u2949",
      Ubrcy: "\u040E",
      ubrcy: "\u045E",
      Ubreve: "\u016C",
      ubreve: "\u016D",
      Ucirc: "\xDB",
      ucirc: "\xFB",
      Ucy: "\u0423",
      ucy: "\u0443",
      udarr: "\u21C5",
      Udblac: "\u0170",
      udblac: "\u0171",
      udhar: "\u296E",
      ufisht: "\u297E",
      Ufr: "\u{1D518}",
      ufr: "\u{1D532}",
      Ugrave: "\xD9",
      ugrave: "\xF9",
      uHar: "\u2963",
      uharl: "\u21BF",
      uharr: "\u21BE",
      uhblk: "\u2580",
      ulcorn: "\u231C",
      ulcorner: "\u231C",
      ulcrop: "\u230F",
      ultri: "\u25F8",
      Umacr: "\u016A",
      umacr: "\u016B",
      uml: "\xA8",
      UnderBar: "_",
      UnderBrace: "\u23DF",
      UnderBracket: "\u23B5",
      UnderParenthesis: "\u23DD",
      Union: "\u22C3",
      UnionPlus: "\u228E",
      Uogon: "\u0172",
      uogon: "\u0173",
      Uopf: "\u{1D54C}",
      uopf: "\u{1D566}",
      UpArrow: "\u2191",
      Uparrow: "\u21D1",
      uparrow: "\u2191",
      UpArrowBar: "\u2912",
      UpArrowDownArrow: "\u21C5",
      UpDownArrow: "\u2195",
      Updownarrow: "\u21D5",
      updownarrow: "\u2195",
      UpEquilibrium: "\u296E",
      upharpoonleft: "\u21BF",
      upharpoonright: "\u21BE",
      uplus: "\u228E",
      UpperLeftArrow: "\u2196",
      UpperRightArrow: "\u2197",
      Upsi: "\u03D2",
      upsi: "\u03C5",
      upsih: "\u03D2",
      Upsilon: "\u03A5",
      upsilon: "\u03C5",
      UpTee: "\u22A5",
      UpTeeArrow: "\u21A5",
      upuparrows: "\u21C8",
      urcorn: "\u231D",
      urcorner: "\u231D",
      urcrop: "\u230E",
      Uring: "\u016E",
      uring: "\u016F",
      urtri: "\u25F9",
      Uscr: "\u{1D4B0}",
      uscr: "\u{1D4CA}",
      utdot: "\u22F0",
      Utilde: "\u0168",
      utilde: "\u0169",
      utri: "\u25B5",
      utrif: "\u25B4",
      uuarr: "\u21C8",
      Uuml: "\xDC",
      uuml: "\xFC",
      uwangle: "\u29A7",
      vangrt: "\u299C",
      varepsilon: "\u03F5",
      varkappa: "\u03F0",
      varnothing: "\u2205",
      varphi: "\u03D5",
      varpi: "\u03D6",
      varpropto: "\u221D",
      vArr: "\u21D5",
      varr: "\u2195",
      varrho: "\u03F1",
      varsigma: "\u03C2",
      varsubsetneq: "\u228A\uFE00",
      varsubsetneqq: "\u2ACB\uFE00",
      varsupsetneq: "\u228B\uFE00",
      varsupsetneqq: "\u2ACC\uFE00",
      vartheta: "\u03D1",
      vartriangleleft: "\u22B2",
      vartriangleright: "\u22B3",
      Vbar: "\u2AEB",
      vBar: "\u2AE8",
      vBarv: "\u2AE9",
      Vcy: "\u0412",
      vcy: "\u0432",
      VDash: "\u22AB",
      Vdash: "\u22A9",
      vDash: "\u22A8",
      vdash: "\u22A2",
      Vdashl: "\u2AE6",
      Vee: "\u22C1",
      vee: "\u2228",
      veebar: "\u22BB",
      veeeq: "\u225A",
      vellip: "\u22EE",
      Verbar: "\u2016",
      verbar: "|",
      Vert: "\u2016",
      vert: "|",
      VerticalBar: "\u2223",
      VerticalLine: "|",
      VerticalSeparator: "\u2758",
      VerticalTilde: "\u2240",
      VeryThinSpace: "\u200A",
      Vfr: "\u{1D519}",
      vfr: "\u{1D533}",
      vltri: "\u22B2",
      vnsub: "\u2282\u20D2",
      vnsup: "\u2283\u20D2",
      Vopf: "\u{1D54D}",
      vopf: "\u{1D567}",
      vprop: "\u221D",
      vrtri: "\u22B3",
      Vscr: "\u{1D4B1}",
      vscr: "\u{1D4CB}",
      vsubnE: "\u2ACB\uFE00",
      vsubne: "\u228A\uFE00",
      vsupnE: "\u2ACC\uFE00",
      vsupne: "\u228B\uFE00",
      Vvdash: "\u22AA",
      vzigzag: "\u299A",
      Wcirc: "\u0174",
      wcirc: "\u0175",
      wedbar: "\u2A5F",
      Wedge: "\u22C0",
      wedge: "\u2227",
      wedgeq: "\u2259",
      weierp: "\u2118",
      Wfr: "\u{1D51A}",
      wfr: "\u{1D534}",
      Wopf: "\u{1D54E}",
      wopf: "\u{1D568}",
      wp: "\u2118",
      wr: "\u2240",
      wreath: "\u2240",
      Wscr: "\u{1D4B2}",
      wscr: "\u{1D4CC}",
      xcap: "\u22C2",
      xcirc: "\u25EF",
      xcup: "\u22C3",
      xdtri: "\u25BD",
      Xfr: "\u{1D51B}",
      xfr: "\u{1D535}",
      xhArr: "\u27FA",
      xharr: "\u27F7",
      Xi: "\u039E",
      xi: "\u03BE",
      xlArr: "\u27F8",
      xlarr: "\u27F5",
      xmap: "\u27FC",
      xnis: "\u22FB",
      xodot: "\u2A00",
      Xopf: "\u{1D54F}",
      xopf: "\u{1D569}",
      xoplus: "\u2A01",
      xotime: "\u2A02",
      xrArr: "\u27F9",
      xrarr: "\u27F6",
      Xscr: "\u{1D4B3}",
      xscr: "\u{1D4CD}",
      xsqcup: "\u2A06",
      xuplus: "\u2A04",
      xutri: "\u25B3",
      xvee: "\u22C1",
      xwedge: "\u22C0",
      Yacute: "\xDD",
      yacute: "\xFD",
      YAcy: "\u042F",
      yacy: "\u044F",
      Ycirc: "\u0176",
      ycirc: "\u0177",
      Ycy: "\u042B",
      ycy: "\u044B",
      yen: "\xA5",
      Yfr: "\u{1D51C}",
      yfr: "\u{1D536}",
      YIcy: "\u0407",
      yicy: "\u0457",
      Yopf: "\u{1D550}",
      yopf: "\u{1D56A}",
      Yscr: "\u{1D4B4}",
      yscr: "\u{1D4CE}",
      YUcy: "\u042E",
      yucy: "\u044E",
      Yuml: "\u0178",
      yuml: "\xFF",
      Zacute: "\u0179",
      zacute: "\u017A",
      Zcaron: "\u017D",
      zcaron: "\u017E",
      Zcy: "\u0417",
      zcy: "\u0437",
      Zdot: "\u017B",
      zdot: "\u017C",
      zeetrf: "\u2128",
      ZeroWidthSpace: "\u200B",
      Zeta: "\u0396",
      zeta: "\u03B6",
      Zfr: "\u2128",
      zfr: "\u{1D537}",
      ZHcy: "\u0416",
      zhcy: "\u0436",
      zigrarr: "\u21DD",
      Zopf: "\u2124",
      zopf: "\u{1D56B}",
      Zscr: "\u{1D4B5}",
      zscr: "\u{1D4CF}",
      zwj: "\u200D",
      zwnj: "\u200C"
    });
    exports2.entityMap = exports2.HTML_ENTITIES;
  }
});

// node_modules/@xmldom/xmldom/lib/sax.js
var require_sax = __commonJS({
  "node_modules/@xmldom/xmldom/lib/sax.js"(exports2) {
    "use strict";
    var conventions = require_conventions();
    var g = require_grammar();
    var errors = require_errors();
    var isHTMLEscapableRawTextElement = conventions.isHTMLEscapableRawTextElement;
    var isHTMLMimeType = conventions.isHTMLMimeType;
    var isHTMLRawTextElement = conventions.isHTMLRawTextElement;
    var hasOwn = conventions.hasOwn;
    var NAMESPACE = conventions.NAMESPACE;
    var ParseError = errors.ParseError;
    var DOMException = errors.DOMException;
    var S_TAG = 0;
    var S_ATTR = 1;
    var S_ATTR_SPACE = 2;
    var S_EQ = 3;
    var S_ATTR_NOQUOT_VALUE = 4;
    var S_ATTR_END = 5;
    var S_TAG_SPACE = 6;
    var S_TAG_CLOSE = 7;
    function XMLReader() {
    }
    XMLReader.prototype = {
      parse: function(source, defaultNSMap, entityMap) {
        var domBuilder = this.domBuilder;
        domBuilder.startDocument();
        _copy(defaultNSMap, defaultNSMap = /* @__PURE__ */ Object.create(null));
        parse(source, defaultNSMap, entityMap, domBuilder, this.errorHandler);
        domBuilder.endDocument();
      }
    };
    var ENTITY_REG = /&#?\w+;?/g;
    function parse(source, defaultNSMapCopy, entityMap, domBuilder, errorHandler) {
      var isHTML = isHTMLMimeType(domBuilder.mimeType);
      if (source.indexOf(g.UNICODE_REPLACEMENT_CHARACTER) >= 0) {
        errorHandler.warning("Unicode replacement character detected, source encoding issues?");
      }
      function fixedFromCharCode(code) {
        if (code > 65535) {
          code -= 65536;
          var surrogate1 = 55296 + (code >> 10), surrogate2 = 56320 + (code & 1023);
          return String.fromCharCode(surrogate1, surrogate2);
        } else {
          return String.fromCharCode(code);
        }
      }
      function entityReplacer(a2) {
        var complete = a2[a2.length - 1] === ";" ? a2 : a2 + ";";
        if (!isHTML && complete !== a2) {
          errorHandler.error("EntityRef: expecting ;");
          return a2;
        }
        var match = g.Reference.exec(complete);
        if (!match || match[0].length !== complete.length) {
          errorHandler.error("entity not matching Reference production: " + a2);
          return a2;
        }
        var k = complete.slice(1, -1);
        if (hasOwn(entityMap, k)) {
          return entityMap[k];
        } else if (k.charAt(0) === "#") {
          return fixedFromCharCode(parseInt(k.substring(1).replace("x", "0x")));
        } else {
          errorHandler.error("entity not found:" + a2);
          return a2;
        }
      }
      function appendText(end2) {
        if (end2 > start) {
          var xt = source.substring(start, end2).replace(ENTITY_REG, entityReplacer);
          locator && position(start);
          domBuilder.characters(xt, 0, end2 - start);
          start = end2;
        }
      }
      var lineStart = 0;
      var lineEnd = 0;
      var linePattern = /\r\n?|\n|$/g;
      var locator = domBuilder.locator;
      function position(p, m) {
        while (p >= lineEnd && (m = linePattern.exec(source))) {
          lineStart = lineEnd;
          lineEnd = m.index + m[0].length;
          locator.lineNumber++;
        }
        locator.columnNumber = p - lineStart + 1;
      }
      var parseStack = [{ currentNSMap: defaultNSMapCopy }];
      var unclosedTags = [];
      var start = 0;
      while (true) {
        try {
          var tagStart = source.indexOf("<", start);
          if (tagStart < 0) {
            if (!isHTML && unclosedTags.length > 0) {
              return errorHandler.fatalError("unclosed xml tag(s): " + unclosedTags.join(", "));
            }
            if (!source.substring(start).match(/^\s*$/)) {
              var doc = domBuilder.doc;
              var text = doc.createTextNode(source.substring(start));
              if (doc.documentElement) {
                return errorHandler.error("Extra content at the end of the document");
              }
              doc.appendChild(text);
              domBuilder.currentElement = text;
            }
            return;
          }
          if (tagStart > start) {
            var fromSource = source.substring(start, tagStart);
            if (!isHTML && unclosedTags.length === 0) {
              fromSource = fromSource.replace(new RegExp(g.S_OPT.source, "g"), "");
              fromSource && errorHandler.error("Unexpected content outside root element: '" + fromSource + "'");
            }
            appendText(tagStart);
          }
          switch (source.charAt(tagStart + 1)) {
            case "/":
              var end = source.indexOf(">", tagStart + 2);
              var tagNameRaw = source.substring(tagStart + 2, end > 0 ? end : void 0);
              if (!tagNameRaw) {
                return errorHandler.fatalError("end tag name missing");
              }
              var tagNameMatch = end > 0 && g.reg("^", g.QName_group, g.S_OPT, "$").exec(tagNameRaw);
              if (!tagNameMatch) {
                return errorHandler.fatalError('end tag name contains invalid characters: "' + tagNameRaw + '"');
              }
              if (!domBuilder.currentElement && !domBuilder.doc.documentElement) {
                return;
              }
              var currentTagName = unclosedTags[unclosedTags.length - 1] || domBuilder.currentElement.tagName || domBuilder.doc.documentElement.tagName || "";
              if (currentTagName !== tagNameMatch[1]) {
                var tagNameLower = tagNameMatch[1].toLowerCase();
                if (!isHTML || currentTagName.toLowerCase() !== tagNameLower) {
                  return errorHandler.fatalError('Opening and ending tag mismatch: "' + currentTagName + '" != "' + tagNameRaw + '"');
                }
              }
              var config = parseStack.pop();
              unclosedTags.pop();
              var localNSMap = config.localNSMap;
              domBuilder.endElement(config.uri, config.localName, currentTagName);
              if (localNSMap) {
                for (var prefix in localNSMap) {
                  if (hasOwn(localNSMap, prefix)) {
                    domBuilder.endPrefixMapping(prefix);
                  }
                }
              }
              end++;
              break;
            // end element
            case "?":
              locator && position(tagStart);
              end = parseProcessingInstruction(source, tagStart, domBuilder, errorHandler);
              break;
            case "!":
              locator && position(tagStart);
              end = parseDoctypeCommentOrCData(source, tagStart, domBuilder, errorHandler, isHTML);
              break;
            default:
              locator && position(tagStart);
              var el = new ElementAttributes();
              var currentNSMap = parseStack[parseStack.length - 1].currentNSMap;
              var end = parseElementStartPart(source, tagStart, el, currentNSMap, entityReplacer, errorHandler, isHTML);
              var len = el.length;
              if (!el.closed) {
                if (isHTML && conventions.isHTMLVoidElement(el.tagName)) {
                  el.closed = true;
                } else {
                  unclosedTags.push(el.tagName);
                }
              }
              if (locator && len) {
                var locator2 = copyLocator(locator, {});
                for (var i = 0; i < len; i++) {
                  var a = el[i];
                  position(a.offset);
                  a.locator = copyLocator(locator, {});
                }
                domBuilder.locator = locator2;
                if (appendElement(el, domBuilder, currentNSMap)) {
                  parseStack.push(el);
                }
                domBuilder.locator = locator;
              } else {
                if (appendElement(el, domBuilder, currentNSMap)) {
                  parseStack.push(el);
                }
              }
              if (isHTML && !el.closed) {
                end = parseHtmlSpecialContent(source, end, el.tagName, entityReplacer, domBuilder);
              } else {
                end++;
              }
          }
        } catch (e) {
          if (e instanceof ParseError) {
            throw e;
          } else if (e instanceof DOMException) {
            throw new ParseError(e.name + ": " + e.message, domBuilder.locator, e);
          }
          errorHandler.error("element parse error: " + e);
          end = -1;
        }
        if (end > start) {
          start = end;
        } else {
          appendText(Math.max(tagStart, start) + 1);
        }
      }
    }
    function copyLocator(f, t) {
      t.lineNumber = f.lineNumber;
      t.columnNumber = f.columnNumber;
      return t;
    }
    function parseElementStartPart(source, start, el, currentNSMap, entityReplacer, errorHandler, isHTML) {
      function addAttribute(qname, value2, startIndex) {
        if (hasOwn(el.attributeNames, qname)) {
          return errorHandler.fatalError("Attribute " + qname + " redefined");
        }
        if (!isHTML && value2.indexOf("<") >= 0) {
          return errorHandler.fatalError("Unescaped '<' not allowed in attributes values");
        }
        el.addValue(
          qname,
          // @see https://www.w3.org/TR/xml/#AVNormalize
          // since the xmldom sax parser does not "interpret" DTD the following is not implemented:
          // - recursive replacement of (DTD) entity references
          // - trimming and collapsing multiple spaces into a single one for attributes that are not of type CDATA
          value2.replace(/[\t\n\r]/g, " ").replace(ENTITY_REG, entityReplacer),
          startIndex
        );
      }
      var attrName;
      var value;
      var p = ++start;
      var s = S_TAG;
      while (true) {
        var c = source.charAt(p);
        switch (c) {
          case "=":
            if (s === S_ATTR) {
              attrName = source.slice(start, p);
              s = S_EQ;
            } else if (s === S_ATTR_SPACE) {
              s = S_EQ;
            } else {
              throw new Error("attribute equal must after attrName");
            }
            break;
          case "'":
          case '"':
            if (s === S_EQ || s === S_ATTR) {
              if (s === S_ATTR) {
                errorHandler.warning('attribute value must after "="');
                attrName = source.slice(start, p);
              }
              start = p + 1;
              p = source.indexOf(c, start);
              if (p > 0) {
                value = source.slice(start, p);
                addAttribute(attrName, value, start - 1);
                s = S_ATTR_END;
              } else {
                throw new Error("attribute value no end '" + c + "' match");
              }
            } else if (s == S_ATTR_NOQUOT_VALUE) {
              value = source.slice(start, p);
              addAttribute(attrName, value, start);
              errorHandler.warning('attribute "' + attrName + '" missed start quot(' + c + ")!!");
              start = p + 1;
              s = S_ATTR_END;
            } else {
              throw new Error('attribute value must after "="');
            }
            break;
          case "/":
            switch (s) {
              case S_TAG:
                el.setTagName(source.slice(start, p));
              case S_ATTR_END:
              case S_TAG_SPACE:
              case S_TAG_CLOSE:
                s = S_TAG_CLOSE;
                el.closed = true;
              case S_ATTR_NOQUOT_VALUE:
              case S_ATTR:
                break;
              case S_ATTR_SPACE:
                el.closed = true;
                break;
              //case S_EQ:
              default:
                throw new Error("attribute invalid close char('/')");
            }
            break;
          case "":
            errorHandler.error("unexpected end of input");
            if (s == S_TAG) {
              el.setTagName(source.slice(start, p));
            }
            return p;
          case ">":
            switch (s) {
              case S_TAG:
                el.setTagName(source.slice(start, p));
              case S_ATTR_END:
              case S_TAG_SPACE:
              case S_TAG_CLOSE:
                break;
              //normal
              case S_ATTR_NOQUOT_VALUE:
              //Compatible state
              case S_ATTR:
                value = source.slice(start, p);
                if (value.slice(-1) === "/") {
                  el.closed = true;
                  value = value.slice(0, -1);
                }
              case S_ATTR_SPACE:
                if (s === S_ATTR_SPACE) {
                  value = attrName;
                }
                if (s == S_ATTR_NOQUOT_VALUE) {
                  errorHandler.warning('attribute "' + value + '" missed quot(")!');
                  addAttribute(attrName, value, start);
                } else {
                  if (!isHTML) {
                    errorHandler.warning('attribute "' + value + '" missed value!! "' + value + '" instead!!');
                  }
                  addAttribute(value, value, start);
                }
                break;
              case S_EQ:
                if (!isHTML) {
                  return errorHandler.fatalError(`AttValue: ' or " expected`);
                }
            }
            return p;
          /*xml space '\x20' | #x9 | #xD | #xA; */
          case "\x80":
            c = " ";
          default:
            if (c <= " ") {
              switch (s) {
                case S_TAG:
                  el.setTagName(source.slice(start, p));
                  s = S_TAG_SPACE;
                  break;
                case S_ATTR:
                  attrName = source.slice(start, p);
                  s = S_ATTR_SPACE;
                  break;
                case S_ATTR_NOQUOT_VALUE:
                  var value = source.slice(start, p);
                  errorHandler.warning('attribute "' + value + '" missed quot(")!!');
                  addAttribute(attrName, value, start);
                case S_ATTR_END:
                  s = S_TAG_SPACE;
                  break;
              }
            } else {
              switch (s) {
                //case S_TAG:void();break;
                //case S_ATTR:void();break;
                //case S_ATTR_NOQUOT_VALUE:void();break;
                case S_ATTR_SPACE:
                  if (!isHTML) {
                    errorHandler.warning('attribute "' + attrName + '" missed value!! "' + attrName + '" instead2!!');
                  }
                  addAttribute(attrName, attrName, start);
                  start = p;
                  s = S_ATTR;
                  break;
                case S_ATTR_END:
                  errorHandler.warning('attribute space is required"' + attrName + '"!!');
                case S_TAG_SPACE:
                  s = S_ATTR;
                  start = p;
                  break;
                case S_EQ:
                  s = S_ATTR_NOQUOT_VALUE;
                  start = p;
                  break;
                case S_TAG_CLOSE:
                  throw new Error("elements closed character '/' and '>' must be connected to");
              }
            }
        }
        p++;
      }
    }
    function appendElement(el, domBuilder, currentNSMap) {
      var tagName = el.tagName;
      var localNSMap = null;
      var i = el.length;
      while (i--) {
        var a = el[i];
        var qName = a.qName;
        var value = a.value;
        var nsp = qName.indexOf(":");
        if (nsp > 0) {
          var prefix = a.prefix = qName.slice(0, nsp);
          var localName = qName.slice(nsp + 1);
          var nsPrefix = prefix === "xmlns" && localName;
        } else {
          localName = qName;
          prefix = null;
          nsPrefix = qName === "xmlns" && "";
        }
        a.localName = localName;
        if (nsPrefix !== false) {
          if (localNSMap == null) {
            localNSMap = /* @__PURE__ */ Object.create(null);
            _copy(currentNSMap, currentNSMap = /* @__PURE__ */ Object.create(null));
          }
          currentNSMap[nsPrefix] = localNSMap[nsPrefix] = value;
          a.uri = NAMESPACE.XMLNS;
          domBuilder.startPrefixMapping(nsPrefix, value);
        }
      }
      var i = el.length;
      while (i--) {
        a = el[i];
        if (a.prefix) {
          if (a.prefix === "xml") {
            a.uri = NAMESPACE.XML;
          }
          if (a.prefix !== "xmlns") {
            a.uri = currentNSMap[a.prefix];
          }
        }
      }
      var nsp = tagName.indexOf(":");
      if (nsp > 0) {
        prefix = el.prefix = tagName.slice(0, nsp);
        localName = el.localName = tagName.slice(nsp + 1);
      } else {
        prefix = null;
        localName = el.localName = tagName;
      }
      var ns = el.uri = currentNSMap[prefix || ""];
      domBuilder.startElement(ns, localName, tagName, el);
      if (el.closed) {
        domBuilder.endElement(ns, localName, tagName);
        if (localNSMap) {
          for (prefix in localNSMap) {
            if (hasOwn(localNSMap, prefix)) {
              domBuilder.endPrefixMapping(prefix);
            }
          }
        }
      } else {
        el.currentNSMap = currentNSMap;
        el.localNSMap = localNSMap;
        return true;
      }
    }
    function parseHtmlSpecialContent(source, elStartEnd, tagName, entityReplacer, domBuilder) {
      var isEscapableRaw = isHTMLEscapableRawTextElement(tagName);
      if (isEscapableRaw || isHTMLRawTextElement(tagName)) {
        var elEndStart = source.indexOf("</" + tagName + ">", elStartEnd);
        var text = source.substring(elStartEnd + 1, elEndStart);
        if (isEscapableRaw) {
          text = text.replace(ENTITY_REG, entityReplacer);
        }
        domBuilder.characters(text, 0, text.length);
        return elEndStart;
      }
      return elStartEnd + 1;
    }
    function _copy(source, target) {
      for (var n in source) {
        if (hasOwn(source, n)) {
          target[n] = source[n];
        }
      }
    }
    function parseUtils(source, start) {
      var index = start;
      function char(n) {
        n = n || 0;
        return source.charAt(index + n);
      }
      function skip(n) {
        n = n || 1;
        index += n;
      }
      function skipBlanks() {
        var blanks = 0;
        while (index < source.length) {
          var c = char();
          if (c !== " " && c !== "\n" && c !== "	" && c !== "\r") {
            return blanks;
          }
          blanks++;
          skip();
        }
        return -1;
      }
      function substringFromIndex() {
        return source.substring(index);
      }
      function substringStartsWith(text) {
        return source.substring(index, index + text.length) === text;
      }
      function substringStartsWithCaseInsensitive(text) {
        return source.substring(index, index + text.length).toUpperCase() === text.toUpperCase();
      }
      function getMatch(args) {
        var expr = g.reg("^", args);
        var match = expr.exec(substringFromIndex());
        if (match) {
          skip(match[0].length);
          return match[0];
        }
        return null;
      }
      return {
        char,
        getIndex: function() {
          return index;
        },
        getMatch,
        getSource: function() {
          return source;
        },
        skip,
        skipBlanks,
        substringFromIndex,
        substringStartsWith,
        substringStartsWithCaseInsensitive
      };
    }
    function parseDoctypeInternalSubset(p, errorHandler) {
      function parsePI(p2, errorHandler2) {
        var match = g.PI.exec(p2.substringFromIndex());
        if (!match) {
          return errorHandler2.fatalError("processing instruction is not well-formed at position " + p2.getIndex());
        }
        if (match[1].toLowerCase() === "xml") {
          return errorHandler2.fatalError(
            "xml declaration is only allowed at the start of the document, but found at position " + p2.getIndex()
          );
        }
        p2.skip(match[0].length);
        return match[0];
      }
      var source = p.getSource();
      if (p.char() === "[") {
        p.skip(1);
        var intSubsetStart = p.getIndex();
        while (p.getIndex() < source.length) {
          p.skipBlanks();
          if (p.char() === "]") {
            var internalSubset = source.substring(intSubsetStart, p.getIndex());
            p.skip(1);
            return internalSubset;
          }
          var current = null;
          if (p.char() === "<" && p.char(1) === "!") {
            switch (p.char(2)) {
              case "E":
                if (p.char(3) === "L") {
                  current = p.getMatch(g.elementdecl);
                } else if (p.char(3) === "N") {
                  current = p.getMatch(g.EntityDecl);
                }
                break;
              case "A":
                current = p.getMatch(g.AttlistDecl);
                break;
              case "N":
                current = p.getMatch(g.NotationDecl);
                break;
              case "-":
                current = p.getMatch(g.Comment);
                break;
            }
          } else if (p.char() === "<" && p.char(1) === "?") {
            current = parsePI(p, errorHandler);
          } else if (p.char() === "%") {
            current = p.getMatch(g.PEReference);
          } else {
            return errorHandler.fatalError("Error detected in Markup declaration");
          }
          if (!current) {
            return errorHandler.fatalError("Error in internal subset at position " + p.getIndex());
          }
        }
        return errorHandler.fatalError("doctype internal subset is not well-formed, missing ]");
      }
    }
    function parseDoctypeCommentOrCData(source, start, domBuilder, errorHandler, isHTML) {
      var p = parseUtils(source, start);
      switch (isHTML ? p.char(2).toUpperCase() : p.char(2)) {
        case "-":
          var comment = p.getMatch(g.Comment);
          if (comment) {
            domBuilder.comment(comment, g.COMMENT_START.length, comment.length - g.COMMENT_START.length - g.COMMENT_END.length);
            return p.getIndex();
          } else {
            return errorHandler.fatalError("comment is not well-formed at position " + p.getIndex());
          }
        case "[":
          var cdata = p.getMatch(g.CDSect);
          if (cdata) {
            if (!isHTML && !domBuilder.currentElement) {
              return errorHandler.fatalError("CDATA outside of element");
            }
            domBuilder.startCDATA();
            domBuilder.characters(cdata, g.CDATA_START.length, cdata.length - g.CDATA_START.length - g.CDATA_END.length);
            domBuilder.endCDATA();
            return p.getIndex();
          } else {
            return errorHandler.fatalError("Invalid CDATA starting at position " + start);
          }
        case "D": {
          if (domBuilder.doc && domBuilder.doc.documentElement) {
            return errorHandler.fatalError("Doctype not allowed inside or after documentElement at position " + p.getIndex());
          }
          if (isHTML ? !p.substringStartsWithCaseInsensitive(g.DOCTYPE_DECL_START) : !p.substringStartsWith(g.DOCTYPE_DECL_START)) {
            return errorHandler.fatalError("Expected " + g.DOCTYPE_DECL_START + " at position " + p.getIndex());
          }
          p.skip(g.DOCTYPE_DECL_START.length);
          if (p.skipBlanks() < 1) {
            return errorHandler.fatalError("Expected whitespace after " + g.DOCTYPE_DECL_START + " at position " + p.getIndex());
          }
          var doctype = {
            name: void 0,
            publicId: void 0,
            systemId: void 0,
            internalSubset: void 0
          };
          doctype.name = p.getMatch(g.Name);
          if (!doctype.name)
            return errorHandler.fatalError("doctype name missing or contains unexpected characters at position " + p.getIndex());
          if (isHTML && doctype.name.toLowerCase() !== "html") {
            errorHandler.warning("Unexpected DOCTYPE in HTML document at position " + p.getIndex());
          }
          p.skipBlanks();
          if (p.substringStartsWith(g.PUBLIC) || p.substringStartsWith(g.SYSTEM)) {
            var match = g.ExternalID_match.exec(p.substringFromIndex());
            if (!match) {
              return errorHandler.fatalError("doctype external id is not well-formed at position " + p.getIndex());
            }
            if (match.groups.SystemLiteralOnly !== void 0) {
              doctype.systemId = match.groups.SystemLiteralOnly;
            } else {
              doctype.systemId = match.groups.SystemLiteral;
              doctype.publicId = match.groups.PubidLiteral;
            }
            p.skip(match[0].length);
          } else if (isHTML && p.substringStartsWithCaseInsensitive(g.SYSTEM)) {
            p.skip(g.SYSTEM.length);
            if (p.skipBlanks() < 1) {
              return errorHandler.fatalError("Expected whitespace after " + g.SYSTEM + " at position " + p.getIndex());
            }
            doctype.systemId = p.getMatch(g.ABOUT_LEGACY_COMPAT_SystemLiteral);
            if (!doctype.systemId) {
              return errorHandler.fatalError(
                "Expected " + g.ABOUT_LEGACY_COMPAT + " in single or double quotes after " + g.SYSTEM + " at position " + p.getIndex()
              );
            }
          }
          if (isHTML && doctype.systemId && !g.ABOUT_LEGACY_COMPAT_SystemLiteral.test(doctype.systemId)) {
            errorHandler.warning("Unexpected doctype.systemId in HTML document at position " + p.getIndex());
          }
          if (!isHTML) {
            p.skipBlanks();
            doctype.internalSubset = parseDoctypeInternalSubset(p, errorHandler);
          }
          p.skipBlanks();
          if (p.char() !== ">") {
            return errorHandler.fatalError("doctype not terminated with > at position " + p.getIndex());
          }
          p.skip(1);
          domBuilder.startDTD(doctype.name, doctype.publicId, doctype.systemId, doctype.internalSubset);
          domBuilder.endDTD();
          return p.getIndex();
        }
        default:
          return errorHandler.fatalError('Not well-formed XML starting with "<!" at position ' + start);
      }
    }
    function parseProcessingInstruction(source, start, domBuilder, errorHandler) {
      var match = source.substring(start).match(g.PI);
      if (!match) {
        return errorHandler.fatalError("Invalid processing instruction starting at position " + start);
      }
      if (match[1].toLowerCase() === "xml") {
        if (start > 0) {
          return errorHandler.fatalError(
            "processing instruction at position " + start + " is an xml declaration which is only at the start of the document"
          );
        }
        if (!g.XMLDecl.test(source.substring(start))) {
          return errorHandler.fatalError("xml declaration is not well-formed");
        }
      }
      domBuilder.processingInstruction(match[1], match[2]);
      return start + match[0].length;
    }
    function ElementAttributes() {
      this.attributeNames = /* @__PURE__ */ Object.create(null);
    }
    ElementAttributes.prototype = {
      setTagName: function(tagName) {
        if (!g.QName_exact.test(tagName)) {
          throw new Error("invalid tagName:" + tagName);
        }
        this.tagName = tagName;
      },
      addValue: function(qName, value, offset) {
        if (!g.QName_exact.test(qName)) {
          throw new Error("invalid attribute:" + qName);
        }
        this.attributeNames[qName] = this.length;
        this[this.length++] = { qName, value, offset };
      },
      length: 0,
      getLocalName: function(i) {
        return this[i].localName;
      },
      getLocator: function(i) {
        return this[i].locator;
      },
      getQName: function(i) {
        return this[i].qName;
      },
      getURI: function(i) {
        return this[i].uri;
      },
      getValue: function(i) {
        return this[i].value;
      }
      //	,getIndex:function(uri, localName)){
      //		if(localName){
      //
      //		}else{
      //			var qName = uri
      //		}
      //	},
      //	getValue:function(){return this.getValue(this.getIndex.apply(this,arguments))},
      //	getType:function(uri,localName){}
      //	getType:function(i){},
    };
    exports2.XMLReader = XMLReader;
    exports2.parseUtils = parseUtils;
    exports2.parseDoctypeCommentOrCData = parseDoctypeCommentOrCData;
  }
});

// node_modules/@xmldom/xmldom/lib/dom-parser.js
var require_dom_parser = __commonJS({
  "node_modules/@xmldom/xmldom/lib/dom-parser.js"(exports2) {
    "use strict";
    var conventions = require_conventions();
    var dom = require_dom();
    var errors = require_errors();
    var entities = require_entities();
    var sax = require_sax();
    var DOMImplementation = dom.DOMImplementation;
    var hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
    var isHTMLMimeType = conventions.isHTMLMimeType;
    var isValidMimeType = conventions.isValidMimeType;
    var MIME_TYPE = conventions.MIME_TYPE;
    var NAMESPACE = conventions.NAMESPACE;
    var ParseError = errors.ParseError;
    var XMLReader = sax.XMLReader;
    function normalizeLineEndings(input) {
      return input.replace(/\r[\n\u0085]/g, "\n").replace(/[\r\u0085\u2028\u2029]/g, "\n");
    }
    function DOMParser2(options) {
      options = options || {};
      if (options.locator === void 0) {
        options.locator = true;
      }
      this.assign = options.assign || conventions.assign;
      this.domHandler = options.domHandler || DOMHandler;
      this.onError = options.onError || options.errorHandler;
      if (options.errorHandler && typeof options.errorHandler !== "function") {
        throw new TypeError("errorHandler object is no longer supported, switch to onError!");
      } else if (options.errorHandler) {
        options.errorHandler("warning", "The `errorHandler` option has been deprecated, use `onError` instead!", this);
      }
      this.normalizeLineEndings = options.normalizeLineEndings || normalizeLineEndings;
      this.locator = !!options.locator;
      this.xmlns = this.assign(/* @__PURE__ */ Object.create(null), options.xmlns);
    }
    DOMParser2.prototype.parseFromString = function(source, mimeType) {
      if (!isValidMimeType(mimeType)) {
        throw new TypeError('DOMParser.parseFromString: the provided mimeType "' + mimeType + '" is not valid.');
      }
      var defaultNSMap = this.assign(/* @__PURE__ */ Object.create(null), this.xmlns);
      var entityMap = entities.XML_ENTITIES;
      var defaultNamespace = defaultNSMap[""] || null;
      if (hasDefaultHTMLNamespace(mimeType)) {
        entityMap = entities.HTML_ENTITIES;
        defaultNamespace = NAMESPACE.HTML;
      } else if (mimeType === MIME_TYPE.XML_SVG_IMAGE) {
        defaultNamespace = NAMESPACE.SVG;
      }
      defaultNSMap[""] = defaultNamespace;
      defaultNSMap.xml = defaultNSMap.xml || NAMESPACE.XML;
      var domBuilder = new this.domHandler({
        mimeType,
        defaultNamespace,
        onError: this.onError
      });
      var locator = this.locator ? {} : void 0;
      if (this.locator) {
        domBuilder.setDocumentLocator(locator);
      }
      var sax2 = new XMLReader();
      sax2.errorHandler = domBuilder;
      sax2.domBuilder = domBuilder;
      var isXml = !conventions.isHTMLMimeType(mimeType);
      if (isXml && typeof source !== "string") {
        sax2.errorHandler.fatalError("source is not a string");
      }
      sax2.parse(this.normalizeLineEndings(String(source)), defaultNSMap, entityMap);
      if (!domBuilder.doc.documentElement) {
        sax2.errorHandler.fatalError("missing root element");
      }
      return domBuilder.doc;
    };
    function DOMHandler(options) {
      var opt = options || {};
      this.mimeType = opt.mimeType || MIME_TYPE.XML_APPLICATION;
      this.defaultNamespace = opt.defaultNamespace || null;
      this.cdata = false;
      this.currentElement = void 0;
      this.doc = void 0;
      this.locator = void 0;
      this.onError = opt.onError;
    }
    function position(locator, node) {
      node.lineNumber = locator.lineNumber;
      node.columnNumber = locator.columnNumber;
    }
    DOMHandler.prototype = {
      /**
       * Either creates an XML or an HTML document and stores it under `this.doc`.
       * If it is an XML document, `this.defaultNamespace` is used to create it,
       * and it will not contain any `childNodes`.
       * If it is an HTML document, it will be created without any `childNodes`.
       *
       * @see http://www.saxproject.org/apidoc/org/xml/sax/ContentHandler.html
       */
      startDocument: function() {
        var impl = new DOMImplementation();
        this.doc = isHTMLMimeType(this.mimeType) ? impl.createHTMLDocument(false) : impl.createDocument(this.defaultNamespace, "");
      },
      startElement: function(namespaceURI, localName, qName, attrs) {
        var doc = this.doc;
        var el = doc.createElementNS(namespaceURI, qName || localName);
        var len = attrs.length;
        appendElement(this, el);
        this.currentElement = el;
        this.locator && position(this.locator, el);
        for (var i = 0; i < len; i++) {
          var namespaceURI = attrs.getURI(i);
          var value = attrs.getValue(i);
          var qName = attrs.getQName(i);
          var attr = doc.createAttributeNS(namespaceURI, qName);
          this.locator && position(attrs.getLocator(i), attr);
          attr.value = attr.nodeValue = value;
          el.setAttributeNode(attr);
        }
      },
      endElement: function(namespaceURI, localName, qName) {
        this.currentElement = this.currentElement.parentNode;
      },
      startPrefixMapping: function(prefix, uri) {
      },
      endPrefixMapping: function(prefix) {
      },
      processingInstruction: function(target, data) {
        var ins = this.doc.createProcessingInstruction(target, data);
        this.locator && position(this.locator, ins);
        appendElement(this, ins);
      },
      ignorableWhitespace: function(ch, start, length) {
      },
      characters: function(chars, start, length) {
        chars = _toString.apply(this, arguments);
        if (chars) {
          if (this.cdata) {
            var charNode = this.doc.createCDATASection(chars);
          } else {
            var charNode = this.doc.createTextNode(chars);
          }
          if (this.currentElement) {
            this.currentElement.appendChild(charNode);
          } else if (/^\s*$/.test(chars)) {
            this.doc.appendChild(charNode);
          }
          this.locator && position(this.locator, charNode);
        }
      },
      skippedEntity: function(name) {
      },
      endDocument: function() {
        this.doc.normalize();
      },
      /**
       * Stores the locator to be able to set the `columnNumber` and `lineNumber`
       * on the created DOM nodes.
       *
       * @param {Locator} locator
       */
      setDocumentLocator: function(locator) {
        if (locator) {
          locator.lineNumber = 0;
        }
        this.locator = locator;
      },
      //LexicalHandler
      comment: function(chars, start, length) {
        chars = _toString.apply(this, arguments);
        var comm = this.doc.createComment(chars);
        this.locator && position(this.locator, comm);
        appendElement(this, comm);
      },
      startCDATA: function() {
        this.cdata = true;
      },
      endCDATA: function() {
        this.cdata = false;
      },
      startDTD: function(name, publicId, systemId, internalSubset) {
        var impl = this.doc.implementation;
        if (impl && impl.createDocumentType) {
          var dt = impl.createDocumentType(name, publicId, systemId, internalSubset);
          this.locator && position(this.locator, dt);
          appendElement(this, dt);
          this.doc.doctype = dt;
        }
      },
      reportError: function(level, message) {
        if (typeof this.onError === "function") {
          try {
            this.onError(level, message, this);
          } catch (e) {
            throw new ParseError("Reporting " + level + ' "' + message + '" caused ' + e, this.locator);
          }
        } else {
          console.error("[xmldom " + level + "]	" + message, _locator(this.locator));
        }
      },
      /**
       * @see http://www.saxproject.org/apidoc/org/xml/sax/ErrorHandler.html
       */
      warning: function(message) {
        this.reportError("warning", message);
      },
      error: function(message) {
        this.reportError("error", message);
      },
      /**
       * This function reports a fatal error and throws a ParseError.
       *
       * @param {string} message
       * - The message to be used for reporting and throwing the error.
       * @returns {never}
       * This function always throws an error and never returns a value.
       * @throws {ParseError}
       * Always throws a ParseError with the provided message.
       */
      fatalError: function(message) {
        this.reportError("fatalError", message);
        throw new ParseError(message, this.locator);
      }
    };
    function _locator(l) {
      if (l) {
        return "\n@#[line:" + l.lineNumber + ",col:" + l.columnNumber + "]";
      }
    }
    function _toString(chars, start, length) {
      if (typeof chars == "string") {
        return chars.substr(start, length);
      } else {
        if (chars.length >= start + length || start) {
          return new java.lang.String(chars, start, length) + "";
        }
        return chars;
      }
    }
    "endDTD,startEntity,endEntity,attributeDecl,elementDecl,externalEntityDecl,internalEntityDecl,resolveEntity,getExternalSubset,notationDecl,unparsedEntityDecl".replace(
      /\w+/g,
      function(key) {
        DOMHandler.prototype[key] = function() {
          return null;
        };
      }
    );
    function appendElement(handler, node) {
      if (!handler.currentElement) {
        handler.doc.appendChild(node);
      } else {
        handler.currentElement.appendChild(node);
      }
    }
    function onErrorStopParsing(level) {
      if (level === "error") throw "onErrorStopParsing";
    }
    function onWarningStopParsing() {
      throw "onWarningStopParsing";
    }
    exports2.__DOMHandler = DOMHandler;
    exports2.DOMParser = DOMParser2;
    exports2.normalizeLineEndings = normalizeLineEndings;
    exports2.onErrorStopParsing = onErrorStopParsing;
    exports2.onWarningStopParsing = onWarningStopParsing;
  }
});

// node_modules/@xmldom/xmldom/lib/index.js
var require_lib = __commonJS({
  "node_modules/@xmldom/xmldom/lib/index.js"(exports2) {
    "use strict";
    var conventions = require_conventions();
    exports2.assign = conventions.assign;
    exports2.hasDefaultHTMLNamespace = conventions.hasDefaultHTMLNamespace;
    exports2.isHTMLMimeType = conventions.isHTMLMimeType;
    exports2.isValidMimeType = conventions.isValidMimeType;
    exports2.MIME_TYPE = conventions.MIME_TYPE;
    exports2.NAMESPACE = conventions.NAMESPACE;
    var errors = require_errors();
    exports2.DOMException = errors.DOMException;
    exports2.DOMExceptionName = errors.DOMExceptionName;
    exports2.ExceptionCode = errors.ExceptionCode;
    exports2.ParseError = errors.ParseError;
    var dom = require_dom();
    exports2.Attr = dom.Attr;
    exports2.CDATASection = dom.CDATASection;
    exports2.CharacterData = dom.CharacterData;
    exports2.Comment = dom.Comment;
    exports2.Document = dom.Document;
    exports2.DocumentFragment = dom.DocumentFragment;
    exports2.DocumentType = dom.DocumentType;
    exports2.DOMImplementation = dom.DOMImplementation;
    exports2.Element = dom.Element;
    exports2.Entity = dom.Entity;
    exports2.EntityReference = dom.EntityReference;
    exports2.LiveNodeList = dom.LiveNodeList;
    exports2.NamedNodeMap = dom.NamedNodeMap;
    exports2.Node = dom.Node;
    exports2.NodeList = dom.NodeList;
    exports2.Notation = dom.Notation;
    exports2.ProcessingInstruction = dom.ProcessingInstruction;
    exports2.Text = dom.Text;
    exports2.XMLSerializer = dom.XMLSerializer;
    var domParser = require_dom_parser();
    exports2.DOMParser = domParser.DOMParser;
    exports2.normalizeLineEndings = domParser.normalizeLineEndings;
    exports2.onErrorStopParsing = domParser.onErrorStopParsing;
    exports2.onWarningStopParsing = domParser.onWarningStopParsing;
  }
});

// src/layout/index.ts
var index_exports = {};
__export(index_exports, {
  EVG: () => EVG,
  UICalculated: () => UICalculated,
  UIRenderPosition: () => UIRenderPosition,
  getComponentRegistry: () => getComponentRegistry,
  getFontProvider: () => getFontProvider,
  register_component: () => register_component,
  register_font: () => register_font,
  register_renderer: () => register_renderer,
  setComponentRegistry: () => setComponentRegistry,
  setFontProvider: () => setFontProvider,
  setSerializer: () => setSerializer
});
module.exports = __toCommonJS(index_exports);
var Renderer2 = null;
var path2 = null;
var fs2 = null;
var DOMParser = null;
var XMLSerializer = null;
var _legacyModulesLoaded = false;
function loadLegacyModules() {
  if (_legacyModulesLoaded) return true;
  try {
    Renderer2 = (init_pdfkit(), __toCommonJS(pdfkit_exports)).Renderer;
    path2 = require("path");
    fs2 = require("fs");
    DOMParser = require_lib().DOMParser;
    XMLSerializer = require_lib().XMLSerializer;
    _legacyModulesLoaded = true;
    return true;
  } catch (e) {
    return false;
  }
}
var UIRenderPosition = class {
  constructor(x, y, renderer) {
    this.x = 0;
    this.y = 0;
    this.x = x;
    this.y = y;
    this.renderer = renderer;
  }
};
var UICalculated = class {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;
    this.render_width = 0;
    this.render_height = 0;
    this.width_override = 0;
    this.lineBreak = false;
    this.absolute = false;
  }
};
var UICompRegistry = {};
var UIRenderers = {};
var UIFonts = {};
var _fontProvider = null;
var _componentRegistry = null;
var _serializer = null;
function setFontProvider(provider) {
  _fontProvider = provider;
}
function setComponentRegistry(registry) {
  _componentRegistry = registry;
}
function setSerializer(serializer) {
  _serializer = serializer;
}
function getFontProvider() {
  return _fontProvider;
}
function getComponentRegistry() {
  return _componentRegistry;
}
var register_font = (name, fontFile) => {
  if (_fontProvider) {
    _fontProvider.registerFont(name, fontFile);
  } else {
    UIFonts[name] = fontFile;
  }
};
var register_component = (name, component) => {
  if (_componentRegistry) {
    _componentRegistry.register(name, component);
  } else {
    UICompRegistry[name] = component;
  }
};
var register_renderer = (name, component) => {
  UIRenderers[name] = component;
};
var EVG = class _EVG {
  constructor(strJSON, context) {
    this.items = [];
    this.calculated = new UICalculated();
    this.viewInstance = null;
    this.renderer = null;
    this.parentView = null;
    // fix: event handlers
    this.eventHandlers = {};
    // fix:
    this.tagName = null;
    this.isHidden = false;
    // Event handlers...
    this.tapHandler = null;
    // FIX: meta tags, tags that are uknown at parsing time...
    this.metaTags = {};
    // layout parameters
    this.x = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.y = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.left = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.top = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    // fix: bottom is set
    this.bottom = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.right = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.id = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    // fix: CNAME = component name
    this.cname = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.width = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.height = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.inline = { unit: 0, is_set: false, pixels: 0, b_value: false, s_value: "" };
    this.direction = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.align = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.verticalAlign = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.innerWidth = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.innerHeight = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.lineBreak = {
      unit: 0,
      is_set: false,
      f_value: 0,
      s_value: "",
      b_value: false
    };
    this.pageBreak = {
      unit: 0,
      is_set: false,
      f_value: 0,
      s_value: "",
      b_value: false
    };
    this.overflow = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.fontSize = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 14,
      s_value: ""
    };
    this.fontFamily = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.color = {
      unit: 0,
      is_set: false,
      f_value: 0,
      s_value: "",
      color: "#000000"
    };
    this.backgroundColor = {
      unit: 0,
      is_set: false,
      f_value: 0,
      s_value: "",
      color: "#000000"
    };
    this.opacity = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.rotate = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.borderWidth = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.borderColor = {
      unit: 0,
      is_set: false,
      f_value: 0,
      s_value: "",
      color: "#000000"
    };
    this.borderRadius = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    // FIX: add scale
    this.scale = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    // FIX: add viewport
    this.svgPath = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.viewBox = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.imageUrl = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.text = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    // fix: adding linear gradient parsing...
    // linear-gradient = "rgba(0,)
    this.linearGradient = {
      is_set: false,
      colors: [],
      stops: [],
      s_value: ""
    };
    this.vColorSlide = {
      unit: 0,
      is_set: false,
      f_value: 0,
      s_value: "",
      b_value: false
    };
    this.vColorSlideBreak = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.vColorSlideTop = {
      unit: 0,
      is_set: false,
      f_value: 0,
      s_value: "",
      color: "#000000"
    };
    this.vColorSlideBottom = {
      unit: 0,
      is_set: false,
      f_value: 0,
      s_value: "",
      color: "#000000"
    };
    this.margin = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.marginLeft = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.marginRight = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.marginBottom = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.marginTop = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.padding = { unit: 0, is_set: false, pixels: 0, f_value: 0, s_value: "" };
    this.paddingLeft = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.paddingRight = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.paddingBottom = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.paddingTop = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.shadowColor = {
      unit: 0,
      is_set: false,
      f_value: 0,
      s_value: "",
      color: "#000000"
    };
    this.shadowOffsetX = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.shadowOffsetY = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.shadowOpacity = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.shadowRadius = {
      unit: 0,
      is_set: false,
      pixels: 0,
      f_value: 0,
      s_value: ""
    };
    this.convertStrToValue = function(str) {
      var b_had = false;
      var type = 0;
      var value = 0;
      if (str.endsWith("%")) {
        let fs3 = str.substr(0, str.length - 1);
        value = parseFloat(fs3);
        type = 1;
        b_had = true;
      }
      if (str.endsWith("em")) {
        let fs3 = str.substr(0, str.length - 2);
        value = parseFloat(fs3);
        type = 2;
        b_had = true;
      }
      if (str.endsWith("px")) {
        let fs3 = str.substr(0, str.length - 2);
        value = parseFloat(fs3);
        type = 3;
        b_had = true;
      }
      if (str.endsWith("hp")) {
        let fs3 = str.substr(0, str.length - 2);
        value = parseFloat(fs3);
        type = 4;
        b_had = true;
      }
      if (str == "fill") {
        value = 100;
        type = 5;
        b_had = true;
      }
      if (!b_had) {
        value = parseFloat(str);
        type = 3;
        b_had = true;
      }
      return { value, type };
    };
    this._context = context;
    if (!strJSON) return;
    if (typeof strJSON == "object") {
      this.readParams(strJSON);
      return;
    }
    try {
      if (typeof strJSON == "string") {
        const s = strJSON.trim();
        if (s[0] == "<") {
          this.parseXML(s);
          return;
        }
        var jsonDict = JSON.parse(s);
        this.readParams(jsonDict);
      }
    } catch (e) {
      console.log(e);
    }
  }
  static installShippedFonts() {
    if (!loadLegacyModules()) {
      console.warn(
        "EVG.installShippedFonts() requires Node.js environment. Use IFontProvider in browser."
      );
      return;
    }
    const rootPath = path2.resolve(__dirname, "../../fonts");
    fs2.readdir(rootPath, (err, files) => {
      if (err || !files) return;
      files.forEach((pathName) => {
        const fontPath = rootPath + "/" + pathName;
        if (fs2.lstatSync(fontPath).isDirectory()) {
          fs2.readdir(fontPath, (err2, files2) => {
            if (err2 || !files2) return;
            files2.filter((f) => f.indexOf(".ttf") > 0).forEach((font) => {
              _EVG.installFont(
                path2.parse(font).name.toLocaleLowerCase(),
                fontPath + "/" + font
              );
            });
          });
        }
      });
    });
  }
  static installFont(name, fileName) {
    register_font(name, fileName);
  }
  static installComponent(name, componentData) {
    register_component(name, componentData);
  }
  static async renderToStream(inputStream, width, height, item, header, footer) {
    if (!loadLegacyModules()) {
      throw new Error(
        "EVG.renderToStream() requires Node.js environment. Use IRenderer in browser."
      );
    }
    const renderer = new Renderer2(width, height);
    item.calculate(width, height, renderer);
    renderer.renderToStream(inputStream, item, [header, footer]);
  }
  static async renderToFile(fileName, width, height, item, header, footer) {
    if (!loadLegacyModules()) {
      throw new Error(
        "EVG.renderToFile() requires Node.js environment. Use IRenderer in browser."
      );
    }
    const renderer = new Renderer2(width, height);
    item.calculate(width, height, renderer);
    renderer.render(fileName, item, [header, footer]);
  }
  findComponent(name) {
    if (_componentRegistry) {
      return _componentRegistry.get(name);
    }
    return UICompRegistry[name];
  }
  findFont(name) {
    if (_fontProvider) {
      return _fontProvider.getFont(name);
    }
    return UIFonts[name] || null;
  }
  findContent(listParam) {
    const list = listParam || [];
    if (this.id.is_set && this.id.s_value == "content") {
      list.push(this);
      return;
    }
    if (this.tagName == "content") {
      list.push(this);
      return;
    }
    for (var i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      item.findContent(list);
      if (list.length) return list[0];
    }
    return list[0];
  }
  add(childView) {
    if (!childView) return;
    if (childView.forEach) {
      childView.forEach((item) => {
        this.add(item);
      });
      return;
    }
    childView.parentView = this;
    this.items.push(childView);
    return this;
  }
  readParams(jsonDict) {
    try {
      if (jsonDict["x"]) {
        var value_x = jsonDict["x"];
        var x = this.convertStrToValue(value_x);
        this.x.f_value = x.value;
        this.x.unit = x.type;
        if (this.x.unit == 3) {
          this.x.pixels = x.value;
        }
        this.x.is_set = true;
      }
      if (jsonDict["y"]) {
        var value_y = jsonDict["y"];
        var y = this.convertStrToValue(value_y);
        this.y.f_value = y.value;
        this.y.unit = y.type;
        if (this.y.unit == 3) {
          this.y.pixels = y.value;
        }
        this.y.is_set = true;
      }
      if (jsonDict["left"]) {
        var value_left = jsonDict["left"];
        var left = this.convertStrToValue(value_left);
        this.left.f_value = left.value;
        this.left.unit = left.type;
        if (this.left.unit == 3) {
          this.left.pixels = left.value;
        }
        this.left.is_set = true;
      }
      if (jsonDict["top"]) {
        var value_top = jsonDict["top"];
        var top = this.convertStrToValue(value_top);
        this.top.f_value = top.value;
        this.top.unit = top.type;
        if (this.top.unit == 3) {
          this.top.pixels = top.value;
        }
        this.top.is_set = true;
      }
      if (jsonDict["bottom"]) {
        var value_bottom = jsonDict["bottom"];
        var bottom = this.convertStrToValue(value_bottom);
        this.bottom.f_value = bottom.value;
        this.bottom.unit = bottom.type;
        if (this.top.unit == 3) {
          this.bottom.pixels = bottom.value;
        }
        this.bottom.is_set = true;
      }
      if (jsonDict["right"]) {
        var value_right = jsonDict["right"];
        var right = this.convertStrToValue(value_right);
        this.right.f_value = right.value;
        this.right.unit = right.type;
        if (this.top.unit == 3) {
          this.right.pixels = right.value;
        }
        this.right.is_set = true;
      }
      if (jsonDict["id"]) {
        var value_id = jsonDict["id"];
        this.id.s_value = value_id;
        this.id.is_set = true;
      }
      if (jsonDict["cname"]) {
        var value_id = jsonDict["cname"];
        this.cname.s_value = value_id;
        this.cname.is_set = true;
      }
      if (jsonDict["width"]) {
        var value_width = jsonDict["width"];
        var width = this.convertStrToValue(value_width);
        this.width.f_value = width.value;
        this.width.unit = width.type;
        if (this.width.unit == 3) {
          this.width.pixels = width.value;
        }
        this.width.is_set = true;
      }
      if (jsonDict["height"]) {
        var value_height = jsonDict["height"];
        var height = this.convertStrToValue(value_height);
        this.height.f_value = height.value;
        this.height.unit = height.type;
        if (this.height.unit == 3) {
          this.height.pixels = height.value;
        }
        this.height.is_set = true;
      }
      if (jsonDict["inline"]) {
        var value_inline = jsonDict["inline"];
        var lineBreak = value_inline;
        if (lineBreak == "true" || lineBreak == "1") {
          this.inline.b_value = true;
        } else {
          this.inline.b_value = false;
        }
        this.inline.is_set = true;
      }
      if (jsonDict["direction"]) {
        var value_direction = jsonDict["direction"];
        this.direction.s_value = value_direction;
        this.direction.is_set = true;
      }
      if (jsonDict["align"]) {
        var value_align = jsonDict["align"];
        this.align.s_value = value_align;
        this.align.is_set = true;
      }
      if (jsonDict["verticalAlign"] || jsonDict["vertical-align"]) {
        var value_verticalAlign = jsonDict["verticalAlign"] || jsonDict["vertical-align"];
        this.verticalAlign.s_value = value_verticalAlign;
        this.verticalAlign.is_set = true;
      }
      if (jsonDict["innerWidth"]) {
        var value_innerWidth = jsonDict["innerWidth"];
        var innerWidth = this.convertStrToValue(value_innerWidth);
        this.innerWidth.f_value = innerWidth.value;
        this.innerWidth.unit = innerWidth.type;
        if (this.innerWidth.unit == 3) {
          this.innerWidth.pixels = innerWidth.value;
        }
        this.innerWidth.is_set = true;
      }
      if (jsonDict["innerHeight"]) {
        var value_innerHeight = jsonDict["innerHeight"];
        var innerHeight = this.convertStrToValue(value_innerHeight);
        this.innerHeight.f_value = innerHeight.value;
        this.innerHeight.unit = innerHeight.type;
        if (this.innerHeight.unit == 3) {
          this.innerHeight.pixels = innerHeight.value;
        }
        this.innerHeight.is_set = true;
      }
      if (jsonDict["pageBreak"] || jsonDict["page-break"]) {
        var value_pageBreak = jsonDict["pageBreak"] || jsonDict["page-break"];
        var pageBreak = value_pageBreak;
        if (pageBreak == "true" || pageBreak == "1") {
          this.pageBreak.b_value = true;
        } else {
          this.pageBreak.b_value = false;
        }
        this.pageBreak.is_set = true;
      }
      if (jsonDict["lineBreak"] || jsonDict["line-break"]) {
        var value_lineBreak = jsonDict["lineBreak"] || jsonDict["line-break"];
        var lineBreak = value_lineBreak;
        if (lineBreak == "true" || lineBreak == "1") {
          this.lineBreak.b_value = true;
        } else {
          this.lineBreak.b_value = false;
        }
        this.lineBreak.is_set = true;
      }
      if (jsonDict["overflow"]) {
        var value_overflow = jsonDict["overflow"];
        this.overflow.s_value = value_overflow;
        this.overflow.is_set = true;
      }
      if (jsonDict["fontSize"] || jsonDict["font-size"]) {
        var value_fontSize = jsonDict["fontSize"] || jsonDict["font-size"];
        var fontSize = this.convertStrToValue(value_fontSize);
        this.fontSize.f_value = fontSize.value;
        this.fontSize.unit = fontSize.type;
        if (this.fontSize.unit == 3) {
          this.fontSize.pixels = fontSize.value;
        }
        this.fontSize.is_set = true;
      }
      if (jsonDict["fontFamily"] || jsonDict["font-family"]) {
        var value_fontFamily = jsonDict["fontFamily"] || jsonDict["font-family"];
        this.fontFamily.s_value = value_fontFamily;
        this.fontFamily.is_set = true;
      }
      if (jsonDict["color"]) {
        var value_color = jsonDict["color"];
        this.color.s_value = value_color;
        this.color.is_set = true;
      }
      if (jsonDict["backgroundColor"] || jsonDict["background-color"]) {
        var value_backgroundColor = jsonDict["backgroundColor"] || jsonDict["background-color"];
        this.backgroundColor.s_value = value_backgroundColor;
        this.backgroundColor.is_set = true;
      }
      if (jsonDict["linear-gradient"] || jsonDict["linearGradient"]) {
        var value_linearGradient = jsonDict["linearGradient"] || jsonDict["linear-gradient"];
        this.linearGradient.s_value = value_linearGradient;
        this.linearGradient.is_set = true;
      }
      if (jsonDict["opacity"]) {
        var value_opacity = jsonDict["opacity"];
        var opacity = this.convertStrToValue(value_opacity);
        this.opacity.f_value = opacity.value;
        this.opacity.unit = opacity.type;
        if (this.opacity.unit == 3) {
          this.opacity.pixels = opacity.value;
        }
        this.opacity.is_set = true;
      }
      if (jsonDict["rotate"]) {
        var value_rotate = jsonDict["rotate"];
        var rotate = parseInt(value_rotate);
        this.rotate.f_value = rotate;
        this.rotate.is_set = true;
      }
      if (jsonDict["scale"]) {
        var value_scale = parseFloat(jsonDict["scale"]);
        this.scale.f_value = value_scale;
        this.scale.is_set = true;
      }
      if (jsonDict["borderWidth"] || jsonDict["border-width"]) {
        var value_borderWidth = jsonDict["borderWidth"] || jsonDict["border-width"];
        var borderWidth = this.convertStrToValue(value_borderWidth);
        this.borderWidth.f_value = borderWidth.value;
        this.borderWidth.unit = borderWidth.type;
        if (this.borderWidth.unit == 3) {
          this.borderWidth.pixels = borderWidth.value;
        }
        this.borderWidth.is_set = true;
      }
      if (jsonDict["borderColor"] || jsonDict["border-color"]) {
        var value_borderColor = jsonDict["borderColor"] || jsonDict["border-color"];
        this.borderColor.s_value = value_borderColor;
        this.borderColor.is_set = true;
      }
      if (jsonDict["borderRadius"] || jsonDict["border-radius"]) {
        var value_borderRadius = jsonDict["borderRadius"] || jsonDict["border-radius"];
        var borderRadius = this.convertStrToValue(value_borderRadius);
        this.borderRadius.f_value = borderRadius.value;
        this.borderRadius.unit = borderRadius.type;
        if (this.borderRadius.unit == 3) {
          this.borderRadius.pixels = borderRadius.value;
        }
        this.borderRadius.is_set = true;
      }
      if (jsonDict["viewBox"]) {
        var value_viewBox = jsonDict["viewBox"];
        this.viewBox.s_value = value_viewBox;
        this.viewBox.is_set = true;
      }
      if (jsonDict["svgPath"] || jsonDict["path"] || jsonDict["d"]) {
        var value_svgPath = jsonDict["svgPath"] || jsonDict["path"] || jsonDict["d"];
        this.svgPath.s_value = value_svgPath;
        this.svgPath.is_set = true;
      }
      if (jsonDict["imageUrl"] || jsonDict["src"]) {
        var value_imageUrl = jsonDict["imageUrl"] || jsonDict["src"];
        this.imageUrl.s_value = value_imageUrl;
        this.imageUrl.is_set = true;
      }
      if (jsonDict["text"]) {
        var value_text = jsonDict["text"];
        this.text.s_value = value_text;
        this.text.is_set = true;
      }
      if (jsonDict["vColorSlide"]) {
        var value_vColorSlide = jsonDict["vColorSlide"];
        var vColorSlide = value_vColorSlide;
        if (vColorSlide == "true" || vColorSlide == "1") {
          this.vColorSlide.b_value = true;
        } else {
          this.vColorSlide.b_value = false;
        }
        this.vColorSlide.is_set = true;
      }
      if (jsonDict["vColorSlideBreak"]) {
        var value_vColorSlideBreak = jsonDict["vColorSlideBreak"];
        var vColorSlideBreak = this.convertStrToValue(value_vColorSlideBreak);
        this.vColorSlideBreak.f_value = vColorSlideBreak.value;
        this.vColorSlideBreak.unit = vColorSlideBreak.type;
        if (this.vColorSlideBreak.unit == 3) {
          this.vColorSlideBreak.pixels = vColorSlideBreak.value;
        }
        this.vColorSlideBreak.is_set = true;
      }
      if (jsonDict["vColorSlideTop"]) {
        var value_vColorSlideTop = jsonDict["vColorSlideTop"];
        this.vColorSlideTop.s_value = value_vColorSlideTop;
        this.vColorSlideTop.is_set = true;
      }
      if (jsonDict["vColorSlideBottom"]) {
        var value_vColorSlideBottom = jsonDict["vColorSlideBottom"];
        this.vColorSlideBottom.s_value = value_vColorSlideBottom;
        this.vColorSlideBottom.is_set = true;
      }
      if (jsonDict["margin"]) {
        var value_margin = jsonDict["margin"];
        var margin = this.convertStrToValue(value_margin);
        this.margin.f_value = margin.value;
        this.margin.unit = margin.type;
        if (this.margin.unit == 3) {
          this.margin.pixels = margin.value;
        }
        this.margin.is_set = true;
      }
      if (jsonDict["marginLeft"] || jsonDict["margin-left"]) {
        var value_marginLeft = jsonDict["marginLeft"] || jsonDict["margin-left"];
        var marginLeft = this.convertStrToValue(value_marginLeft);
        this.marginLeft.f_value = marginLeft.value;
        this.marginLeft.unit = marginLeft.type;
        if (this.marginLeft.unit == 3) {
          this.marginLeft.pixels = marginLeft.value;
        }
        this.marginLeft.is_set = true;
      }
      if (jsonDict["marginRight"] || jsonDict["margin-right"]) {
        var value_marginRight = jsonDict["marginRight"] || jsonDict["margin-right"];
        var marginRight = this.convertStrToValue(value_marginRight);
        this.marginRight.f_value = marginRight.value;
        this.marginRight.unit = marginRight.type;
        if (this.marginRight.unit == 3) {
          this.marginRight.pixels = marginRight.value;
        }
        this.marginRight.is_set = true;
      }
      if (jsonDict["marginBottom"] || jsonDict["margin-bottom"]) {
        var value_marginBottom = jsonDict["marginBottom"] || jsonDict["margin-bottom"];
        var marginBottom = this.convertStrToValue(value_marginBottom);
        this.marginBottom.f_value = marginBottom.value;
        this.marginBottom.unit = marginBottom.type;
        if (this.marginBottom.unit == 3) {
          this.marginBottom.pixels = marginBottom.value;
        }
        this.marginBottom.is_set = true;
      }
      if (jsonDict["marginTop"] || jsonDict["margin-top"]) {
        var value_marginTop = jsonDict["marginTop"] || jsonDict["margin-top"];
        var marginTop = this.convertStrToValue(value_marginTop);
        this.marginTop.f_value = marginTop.value;
        this.marginTop.unit = marginTop.type;
        if (this.marginTop.unit == 3) {
          this.marginTop.pixels = marginTop.value;
        }
        this.marginTop.is_set = true;
      }
      if (jsonDict["padding"]) {
        var value_padding = jsonDict["padding"];
        var padding = this.convertStrToValue(value_padding);
        this.padding.f_value = padding.value;
        this.padding.unit = padding.type;
        if (this.padding.unit == 3) {
          this.padding.pixels = padding.value;
        }
        this.padding.is_set = true;
      }
      if (jsonDict["paddingLeft"] || jsonDict["padding-left"]) {
        var value_paddingLeft = jsonDict["paddingLeft"] || jsonDict["padding-left"];
        var paddingLeft = this.convertStrToValue(value_paddingLeft);
        this.paddingLeft.f_value = paddingLeft.value;
        this.paddingLeft.unit = paddingLeft.type;
        if (this.paddingLeft.unit == 3) {
          this.paddingLeft.pixels = paddingLeft.value;
        }
        this.paddingLeft.is_set = true;
      }
      if (jsonDict["paddingRight"] || jsonDict["padding-right"]) {
        var value_paddingRight = jsonDict["paddingRight"] || jsonDict["padding-right"];
        var paddingRight = this.convertStrToValue(value_paddingRight);
        this.paddingRight.f_value = paddingRight.value;
        this.paddingRight.unit = paddingRight.type;
        if (this.paddingRight.unit == 3) {
          this.paddingRight.pixels = paddingRight.value;
        }
        this.paddingRight.is_set = true;
      }
      if (jsonDict["paddingBottom"] || jsonDict["padding-bottom"]) {
        var value_paddingBottom = jsonDict["paddingBottom"] || jsonDict["padding-bottom"];
        var paddingBottom = this.convertStrToValue(value_paddingBottom);
        this.paddingBottom.f_value = paddingBottom.value;
        this.paddingBottom.unit = paddingBottom.type;
        if (this.paddingBottom.unit == 3) {
          this.paddingBottom.pixels = paddingBottom.value;
        }
        this.paddingBottom.is_set = true;
      }
      if (jsonDict["paddingTop"] || jsonDict["padding-top"]) {
        var value_paddingTop = jsonDict["paddingTop"] || jsonDict["padding-top"];
        var paddingTop = this.convertStrToValue(value_paddingTop);
        this.paddingTop.f_value = paddingTop.value;
        this.paddingTop.unit = paddingTop.type;
        if (this.paddingTop.unit == 3) {
          this.paddingTop.pixels = paddingTop.value;
        }
        this.paddingTop.is_set = true;
      }
      if (jsonDict["shadowColor"] || jsonDict["shadow-color"]) {
        var value_shadowColor = jsonDict["shadowColor"] || jsonDict["shadow-color"];
        this.shadowColor.s_value = value_shadowColor;
        this.shadowColor.is_set = true;
      }
      if (jsonDict["shadowOffsetX"] || jsonDict["shadow-offset-x"]) {
        var value_shadowOffsetX = jsonDict["shadowOffsetX"] || jsonDict["shadow-offset-x"];
        var shadowOffsetX = this.convertStrToValue(value_shadowOffsetX);
        this.shadowOffsetX.f_value = shadowOffsetX.value;
        this.shadowOffsetX.unit = shadowOffsetX.type;
        if (this.shadowOffsetX.unit == 3) {
          this.shadowOffsetX.pixels = shadowOffsetX.value;
        }
        this.shadowOffsetX.is_set = true;
      }
      if (jsonDict["shadowOffsetY"] || jsonDict["shadow-offset-y"]) {
        var value_shadowOffsetY = jsonDict["shadowOffsetY"] || jsonDict["shadow-offset-y"];
        var shadowOffsetY = this.convertStrToValue(value_shadowOffsetY);
        this.shadowOffsetY.f_value = shadowOffsetY.value;
        this.shadowOffsetY.unit = shadowOffsetY.type;
        if (this.shadowOffsetY.unit == 3) {
          this.shadowOffsetY.pixels = shadowOffsetY.value;
        }
        this.shadowOffsetY.is_set = true;
      }
      if (jsonDict["shadowOpacity"] || jsonDict["shadow-opacity"]) {
        var value_shadowOpacity = jsonDict["shadowOpacity"] || jsonDict["shadow-opacity"];
        var shadowOpacity = this.convertStrToValue(value_shadowOpacity);
        this.shadowOpacity.f_value = shadowOpacity.value;
        this.shadowOpacity.unit = shadowOpacity.type;
        if (this.shadowOpacity.unit == 3) {
          this.shadowOpacity.pixels = shadowOpacity.value;
        }
        this.shadowOpacity.is_set = true;
      }
      if (jsonDict["shadowRadius"] || jsonDict["shadow-radius"]) {
        var value_shadowRadius = jsonDict["shadowRadius"] || jsonDict["shadow-radius"];
        var shadowRadius = this.convertStrToValue(value_shadowRadius);
        this.shadowRadius.f_value = shadowRadius.value;
        this.shadowRadius.unit = shadowRadius.type;
        if (this.shadowRadius.unit == 3) {
          this.shadowRadius.pixels = shadowRadius.value;
        }
        this.shadowRadius.is_set = true;
      }
    } catch (e) {
    }
  }
  inherit(chNode, parentNode) {
    if (!parentNode) return;
    if (!chNode.fontFamily.is_set && parentNode.fontFamily.is_set) {
      chNode.fontFamily = parentNode.fontFamily;
    }
    if (!chNode.fontSize.is_set && parentNode.fontSize.is_set) {
      chNode.fontSize = parentNode.fontSize;
    }
    if (!chNode.color.is_set && parentNode.color.is_set) {
      chNode.color = parentNode.color;
    }
    if (!chNode.align.is_set && parentNode.align.is_set) {
      chNode.align = parentNode.align;
    }
  }
  readXMLDoc(node, parentNode) {
    var uiObj;
    if (node.nodeType === 1) {
      var name = node.nodeName;
      var attrObj = {};
      var id_value;
      for (var a = 0; a < node.attributes.length; a++) {
        var attr = node.attributes[a];
        if (attr.nodeName == "style") {
          var s = attr.nodeValue;
          var parts = s.split(";");
          for (var ii = 0; ii < parts.length; ii++) {
            var p = parts[ii];
            var p2 = p.split(":");
            if (p2[0] && p2[1]) {
              attrObj[p2[0]] = p2[1];
            }
          }
        }
        attrObj[attr.nodeName] = attr.nodeValue;
        if (attr.nodeName == "id") {
          id_value = attr.nodeValue;
        }
      }
      var compData = this.findComponent(name);
      var content;
      let b_component = false;
      if (compData) {
        uiObj = new _EVG(compData);
        content = uiObj.findContent() || uiObj;
        uiObj.readParams(attrObj);
        b_component = true;
      } else {
        uiObj = parentNode ? new _EVG(attrObj) : this;
        if (uiObj == this) this.readParams(attrObj);
        content = uiObj;
      }
      if (uiObj && id_value) {
        if (this._context) this._context.set_object(id_value, uiObj);
      }
      if (b_component) {
      } else {
        uiObj.tagName = name;
      }
      var r = UIRenderers[name];
      if (r) {
        uiObj.renderer = new r(uiObj);
      }
      if (name == "Hover") {
        parentNode.metaTags[name] = uiObj;
      }
      this.inherit(content, parentNode);
      for (var i = 0; i < node.childNodes.length; i++) {
        var childNode = node.childNodes[i];
        var childUI = this.readXMLDoc(childNode, uiObj);
        if (Array.isArray(childUI)) {
          for (let ch of childUI) {
            this.inherit(ch, content);
            content.add(ch);
          }
        } else {
          if (childUI && childUI.tagName == "component") {
            let serializer;
            if (typeof window !== "undefined" && typeof window.XMLSerializer !== "undefined") {
              serializer = new window.XMLSerializer();
            } else if (loadLegacyModules() && XMLSerializer) {
              serializer = new XMLSerializer();
            } else {
              console.warn(
                "No XML serializer available for component registration"
              );
              continue;
            }
            let compDef;
            for (let ii2 = 0; ii2 < childNode.childNodes.length; ii2++) {
              if (childNode.childNodes[ii2].nodeType == 1) {
                compDef = childNode.childNodes[ii2];
                break;
              }
            }
            if (compDef) {
              register_component(
                childUI.id.s_value,
                serializer.serializeToString(compDef)
              );
            }
            continue;
          }
          if (childUI && childUI.tagName == "header") {
            uiObj.header = childUI;
            continue;
          }
          if (childUI && childUI.tagName == "footer") {
            uiObj.footer = childUI;
            continue;
          }
          if (childUI) content.add(childUI);
        }
      }
      return uiObj;
    }
    if (node.nodeType === 3 || node.nodeType === 4) {
      const str = node.nodeValue.trim();
      const lines = str.split(" ").filter((_) => _.trim().length).map((_, i2, arr) => {
        const n = new _EVG("");
        n.tagName = "Label";
        n.text.is_set = true;
        n.text.s_value = _ + (i2 < arr.length - 1 ? " " : "");
        return n;
      });
      return lines;
    }
  }
  parseXML(xmlStr) {
    let parser;
    if (typeof window !== "undefined" && typeof window.DOMParser !== "undefined") {
      parser = new window.DOMParser();
    } else if (loadLegacyModules() && DOMParser) {
      parser = new DOMParser();
    } else {
      throw new Error(
        "No XML parser available. In Node.js, install xmldom. In browser, DOMParser should be available."
      );
    }
    var xmlDoc = parser.parseFromString(xmlStr, "text/xml");
    return this.readXMLDoc(xmlDoc.childNodes[0], null);
  }
  adjustLayoutParams(node, renderer) {
    var _a;
    const special = renderer.measureElement ? renderer.measureElement(this) : (_a = renderer.hasCustomSize) == null ? void 0 : _a.call(renderer, this);
    if (typeof special !== "undefined") {
      this.width.pixels = special.width;
      this.height.pixels = special.height;
    } else {
      if (this.width.is_set) {
        switch (this.width.unit) {
          case 1:
            this.width.pixels = node.innerWidth.pixels * this.width.f_value / 100;
            break;
          case 2:
            this.width.pixels = node.fontSize.pixels * this.width.f_value;
            break;
          case 3:
            this.width.pixels = this.width.f_value;
            break;
          case 4:
            this.width.pixels = node.innerHeight.pixels * this.width.f_value / 100;
            break;
          // fix: for width fill
          case 5:
            this.width.pixels = 0;
            break;
          default:
            break;
        }
      } else {
        this.width.pixels = node.innerWidth.pixels;
      }
      if (this.height.is_set) {
        switch (this.height.unit) {
          case 1:
            this.height.pixels = node.innerWidth.pixels * this.height.f_value / 100;
            break;
          case 2:
            this.height.pixels = node.fontSize.pixels * this.height.f_value;
            break;
          case 3:
            this.height.pixels = this.height.f_value;
            break;
          case 4:
            this.height.pixels = node.innerHeight.pixels * this.height.f_value / 100;
            break;
          // fix: for height fill
          case 5:
            this.height.pixels = node.innerHeight.pixels * this.width.f_value / 100;
            break;
          default:
            break;
        }
      } else {
        this.height.pixels = node.innerHeight.pixels;
      }
    }
    if (this.left.is_set) {
      switch (this.left.unit) {
        case 1:
          this.left.pixels = node.innerWidth.pixels * this.left.f_value / 100;
          break;
        case 2:
          this.left.pixels = node.fontSize.pixels * this.left.f_value;
          break;
        case 3:
          this.left.pixels = this.left.f_value;
          break;
        case 4:
          this.left.pixels = node.innerHeight.pixels * this.left.f_value / 100;
          break;
        default:
          break;
      }
    }
    if (this.right.is_set) {
      switch (this.right.unit) {
        case 1:
          this.right.pixels = node.innerWidth.pixels * this.right.f_value / 100;
          break;
        case 2:
          this.right.pixels = node.fontSize.pixels * this.right.f_value;
          break;
        case 3:
          this.right.pixels = this.right.f_value;
          break;
        case 4:
          this.right.pixels = node.innerHeight.pixels * this.right.f_value / 100;
          break;
        default:
          break;
      }
    }
    if (this.top.is_set) {
      switch (this.top.unit) {
        case 1:
          this.top.pixels = node.innerWidth.pixels * this.top.f_value / 100;
          break;
        case 2:
          this.top.pixels = node.fontSize.pixels * this.top.f_value;
          break;
        case 3:
          this.top.pixels = this.top.f_value;
          break;
        case 4:
          this.top.pixels = node.innerHeight.pixels * this.top.f_value / 100;
          break;
        default:
          break;
      }
    }
    if (this.bottom.is_set) {
      switch (this.bottom.unit) {
        case 1:
          this.bottom.pixels = node.innerWidth.pixels * this.bottom.f_value / 100;
          break;
        case 2:
          this.bottom.pixels = node.fontSize.pixels * this.bottom.f_value;
          break;
        case 3:
          this.bottom.pixels = this.bottom.f_value;
          break;
        case 4:
          this.bottom.pixels = node.innerHeight.pixels * this.bottom.f_value / 100;
          break;
        default:
          break;
      }
    }
    if (this.borderWidth.is_set) {
      switch (this.borderWidth.unit) {
        case 1:
          this.borderWidth.pixels = node.innerWidth.pixels * this.borderWidth.f_value / 100;
          break;
        case 2:
          this.borderWidth.pixels = node.fontSize.pixels * this.borderWidth.f_value;
          break;
        case 3:
          this.borderWidth.pixels = this.borderWidth.f_value;
          break;
        case 4:
          this.borderWidth.pixels = node.innerHeight.pixels * this.borderWidth.f_value / 100;
          break;
        default:
          break;
      }
    }
    if (this.margin.is_set) {
      switch (this.margin.unit) {
        case 1:
          this.margin.pixels = node.innerWidth.pixels * this.margin.f_value / 100;
          break;
        case 2:
          this.margin.pixels = node.fontSize.pixels * this.margin.f_value;
          break;
        case 3:
          this.margin.pixels = this.margin.f_value;
          break;
        case 4:
          this.margin.pixels = node.innerHeight.pixels * this.margin.f_value / 100;
          break;
        default:
          break;
      }
      if (!this.marginLeft.is_set) {
        this.marginLeft.pixels = this.margin.pixels;
      } else {
        switch (this.marginLeft.unit) {
          case 1:
            this.marginLeft.pixels = node.innerWidth.pixels * this.marginLeft.f_value / 100;
            break;
          case 2:
            this.marginLeft.pixels = node.fontSize.pixels * this.marginLeft.f_value;
            break;
          case 3:
            this.marginLeft.pixels = this.marginLeft.f_value;
            break;
          case 4:
            this.marginLeft.pixels = node.innerHeight.pixels * this.marginLeft.f_value / 100;
            break;
          default:
            break;
        }
      }
      if (!this.marginRight.is_set) {
        this.marginRight.pixels = this.margin.pixels;
      } else {
        switch (this.marginRight.unit) {
          case 1:
            this.marginRight.pixels = node.innerWidth.pixels * this.marginRight.f_value / 100;
            break;
          case 2:
            this.marginRight.pixels = node.fontSize.pixels * this.marginRight.f_value;
            break;
          case 3:
            this.marginRight.pixels = this.marginRight.f_value;
            break;
          case 4:
            this.marginRight.pixels = node.innerHeight.pixels * this.marginRight.f_value / 100;
            break;
          default:
            break;
        }
      }
      if (!this.marginTop.is_set) {
        this.marginTop.pixels = this.margin.pixels;
      } else {
        switch (this.marginTop.unit) {
          case 1:
            this.marginTop.pixels = node.innerWidth.pixels * this.marginTop.f_value / 100;
            break;
          case 2:
            this.marginTop.pixels = node.fontSize.pixels * this.marginTop.f_value;
            break;
          case 3:
            this.marginTop.pixels = this.marginTop.f_value;
            break;
          case 4:
            this.marginTop.pixels = node.innerHeight.pixels * this.marginTop.f_value / 100;
            break;
          default:
            break;
        }
      }
      if (!this.marginBottom.is_set) {
        this.marginBottom.pixels = this.margin.pixels;
      } else {
        switch (this.marginBottom.unit) {
          case 1:
            this.marginBottom.pixels = node.innerWidth.pixels * this.marginBottom.f_value / 100;
            break;
          case 2:
            this.marginBottom.pixels = node.fontSize.pixels * this.marginBottom.f_value;
            break;
          case 3:
            this.marginBottom.pixels = this.marginBottom.f_value;
            break;
          case 4:
            this.marginBottom.pixels = node.innerHeight.pixels * this.marginBottom.f_value / 100;
            break;
          default:
            break;
        }
      }
    }
    if (this.padding.is_set) {
      switch (this.padding.unit) {
        case 1:
          this.padding.pixels = node.innerWidth.pixels * this.padding.f_value / 100;
          break;
        case 2:
          this.padding.pixels = node.fontSize.pixels * this.padding.f_value;
          break;
        case 3:
          this.padding.pixels = this.padding.f_value;
          break;
        case 4:
          this.padding.pixels = node.innerHeight.pixels * this.padding.f_value / 100;
          break;
        default:
          break;
      }
      if (!this.paddingLeft.is_set) {
        this.paddingLeft.pixels = this.padding.pixels;
      } else {
        switch (this.paddingLeft.unit) {
          case 1:
            this.paddingLeft.pixels = node.innerWidth.pixels * this.paddingLeft.f_value / 100;
            break;
          case 2:
            this.paddingLeft.pixels = node.fontSize.pixels * this.paddingLeft.f_value;
            break;
          case 3:
            this.paddingLeft.pixels = this.paddingLeft.f_value;
            break;
          case 4:
            this.paddingLeft.pixels = node.innerHeight.pixels * this.paddingLeft.f_value / 100;
            break;
          default:
            break;
        }
      }
      if (!this.paddingRight.is_set) {
        this.paddingRight.pixels = this.padding.pixels;
      } else {
        switch (this.paddingRight.unit) {
          case 1:
            this.paddingRight.pixels = node.innerWidth.pixels * this.paddingRight.f_value / 100;
            break;
          case 2:
            this.paddingRight.pixels = node.fontSize.pixels * this.paddingRight.f_value;
            break;
          case 3:
            this.paddingRight.pixels = this.paddingRight.f_value;
            break;
          case 4:
            this.paddingRight.pixels = node.innerHeight.pixels * this.paddingRight.f_value / 100;
            break;
          default:
            break;
        }
      }
      if (!this.paddingTop.is_set) {
        this.paddingTop.pixels = this.padding.pixels;
      } else {
        switch (this.paddingTop.unit) {
          case 1:
            this.paddingTop.pixels = node.innerWidth.pixels * this.paddingTop.f_value / 100;
            break;
          case 2:
            this.paddingTop.pixels = node.fontSize.pixels * this.paddingTop.f_value;
            break;
          case 3:
            this.paddingTop.pixels = this.paddingTop.f_value;
            break;
          case 4:
            this.paddingTop.pixels = node.innerHeight.pixels * this.paddingTop.f_value / 100;
            break;
          default:
            break;
        }
      }
      if (!this.paddingBottom.is_set) {
        this.paddingBottom.pixels = this.padding.pixels;
      } else {
        switch (this.paddingBottom.unit) {
          case 1:
            this.paddingBottom.pixels = node.innerWidth.pixels * this.paddingBottom.f_value / 100;
            break;
          case 2:
            this.paddingBottom.pixels = node.fontSize.pixels * this.paddingBottom.f_value;
            break;
          case 3:
            this.paddingBottom.pixels = this.paddingBottom.f_value;
            break;
          case 4:
            this.paddingBottom.pixels = node.innerHeight.pixels * this.paddingBottom.f_value / 100;
            break;
          default:
            break;
        }
      }
    }
    this.width.pixels = this.width.pixels - (this.marginLeft.pixels + this.marginRight.pixels);
    this.height.pixels = this.height.pixels - (this.marginTop.pixels + this.marginBottom.pixels);
    this.innerWidth.pixels = this.width.pixels - (this.paddingRight.pixels + this.paddingLeft.pixels + this.borderWidth.pixels * 2);
    this.innerHeight.pixels = this.height.pixels - (this.paddingTop.pixels + this.paddingBottom.pixels + this.borderWidth.pixels * 2);
    if (this.fontSize.is_set) {
      switch (this.fontSize.unit) {
        case 1:
          this.fontSize.pixels = this.width.pixels * this.fontSize.f_value / 100;
          break;
        case 2:
          this.fontSize.pixels = this.fontSize.f_value;
          break;
        case 3:
          this.fontSize.pixels = this.fontSize.f_value;
          break;
        case 4:
          this.fontSize.pixels = this.height.pixels * this.fontSize.f_value / 100;
          break;
        default:
          break;
      }
    }
    if (this.borderRadius.is_set) {
      switch (this.borderRadius.unit) {
        case 1:
          this.borderRadius.pixels = this.width.pixels * this.borderRadius.f_value / 100;
          break;
        case 2:
          this.borderRadius.pixels = this.fontSize.pixels * this.borderRadius.f_value;
          break;
        case 3:
          this.borderRadius.pixels = this.borderRadius.f_value;
          break;
        case 4:
          this.borderRadius.pixels = this.height.pixels * this.borderRadius.f_value / 100;
          break;
        default:
          break;
      }
    }
  }
  calculate(width, height, renderer) {
    const container = new _EVG({});
    container.innerWidth.pixels = width;
    container.innerHeight.pixels = height;
    this.calculateLayout(container, new UIRenderPosition(0, 0, renderer));
  }
  calculateLayout(parentNode, render_pos) {
    var newPOS = new UIRenderPosition(
      render_pos.x,
      render_pos.y,
      render_pos.renderer
    );
    var render_start_y = render_pos.y;
    var render_start_x = render_pos.x;
    var node = this;
    this.adjustLayoutParams(parentNode, render_pos.renderer);
    var elem_h = this.default_layout(node, render_pos);
    node.calculated.render_height = elem_h;
    node.calculated.render_width = node.inline.is_set && node.inline.b_value && node.calculated.width_override ? node.calculated.width_override + node.borderWidth.pixels : (
      //node.paddingLeft.pixels +
      //node.paddingRight.pixels
      node.width.pixels
    );
    node.calculated.height = elem_h + node.marginTop.pixels + node.marginBottom.pixels;
    node.calculated.width = node.calculated.render_width + node.marginLeft.pixels + node.marginRight.pixels;
    if (node.left.is_set) {
      node.calculated.x = node.marginLeft.pixels + node.left.pixels;
      node.calculated.absolute = true;
    } else {
      node.calculated.x = render_pos.x + node.marginLeft.pixels;
    }
    if (node.top.is_set) {
      node.calculated.y = node.marginTop.pixels + node.top.pixels;
      node.calculated.absolute = true;
    } else {
      if (node.bottom.is_set) {
        node.calculated.y = node.marginTop.pixels + (parentNode.innerHeight.pixels - node.bottom.pixels - node.calculated.height);
        node.calculated.absolute = true;
      } else {
        node.calculated.y = render_pos.y + node.marginTop.pixels;
      }
    }
    if (!node.left.is_set && !node.top.is_set) {
      newPOS.x += node.calculated.width;
      newPOS.y = render_start_y + elem_h + node.marginTop.pixels + node.marginBottom.pixels;
    }
    return newPOS;
  }
  default_layout(node, render_pos) {
    var _a, _b;
    if (node.lineBreak.b_value) {
      node.calculated.lineBreak = true;
    }
    var elem_h = node.paddingTop.pixels + node.paddingBottom.pixels;
    if (node.height.is_set) {
      elem_h += node.innerHeight.pixels + node.borderWidth.pixels * 2;
    }
    var child_render_pos = new UIRenderPosition(
      node.paddingLeft.pixels,
      node.paddingTop.pixels,
      render_pos.renderer
    );
    var child_heights = 0;
    var line_height = 0;
    var row_width = 0;
    var col_height = 0;
    var current_y = child_render_pos.y;
    var current_x = child_render_pos.x;
    var current_row = [];
    if (node.direction.is_set && node.direction.s_value == "bottom-to-top") {
      for (var ii = 0; ii < node.items.length; ii++) {
        var childNode = node.items[ii];
        child_render_pos.y = current_y;
        child_render_pos.x = current_x;
        child_render_pos = childNode.calculateLayout(node, child_render_pos);
        if (childNode.calculated.absolute) {
          continue;
        }
        childNode.calculated.y = current_y + (node.innerHeight.pixels - col_height - childNode.calculated.height);
        col_height += childNode.calculated.height;
        if (childNode.calculated.lineBreak || col_height > node.innerHeight.pixels && col_height - node.innerHeight.pixels > 0.5) {
          child_heights += line_height;
          current_x += row_width;
          line_height = 0;
          col_height = 0;
          row_width = 0;
          child_render_pos.x = current_x;
          child_render_pos.y = node.paddingTop.pixels;
          child_render_pos = childNode.calculateLayout(node, child_render_pos);
          childNode.calculated.y = current_y + (node.innerHeight.pixels - col_height - childNode.calculated.height);
          current_row = [];
          current_row.push(childNode);
          line_height = childNode.calculated.height;
          row_width = childNode.calculated.width;
        } else {
          if (childNode.calculated.width > row_width) {
            row_width = childNode.calculated.width;
          }
          current_row.push(childNode);
        }
      }
      if (node.align.is_set && node.align.s_value == "right" || node.align.s_value == "center") {
        if (current_row.length > 0) {
          for (var i2 = 0; i2 < current_row.length; i2++) {
            var row_item = current_row[i2];
            var deltaX = row_width - row_item.calculated.width;
            if (node.align.s_value == "center") {
              deltaX = deltaX / 2;
            }
            row_item.calculated.x += deltaX;
          }
        }
      }
    } else {
      for (var ii = 0; ii < node.items.length; ii++) {
        var childNode = node.items[ii];
        child_render_pos.y = current_y;
        child_render_pos = childNode.calculateLayout(node, child_render_pos);
        if (childNode.calculated.absolute) {
          continue;
        }
        row_width += childNode.calculated.width;
        if (childNode.calculated.lineBreak || row_width > node.innerWidth.pixels && row_width - node.innerWidth.pixels > 0.5) {
          if (node.align.is_set && node.align.s_value == "fill") {
            let lastItem = current_row[current_row.length - 1];
            var deltaX = node.paddingLeft.pixels + node.innerWidth.pixels + 0.5 * lastItem.marginLeft.pixels - lastItem.calculated.x - lastItem.calculated.width;
            for (var i2 = 0; i2 < current_row.length; i2++) {
              var row_item = current_row[i2];
              const divider = current_row.length > 1 ? current_row.length - 1 : 1;
              row_item.calculated.x += deltaX * (i2 / divider);
            }
          }
          if (node.align.is_set && (node.align.s_value == "right" || node.align.s_value == "center")) {
            let lastItem = current_row[current_row.length - 1];
            var deltaX = node.paddingLeft.pixels + node.innerWidth.pixels + 0.5 * lastItem.marginLeft.pixels - lastItem.calculated.x - lastItem.calculated.width;
            if (node.align.is_set && node.align.s_value == "center") {
              deltaX = deltaX / 2;
            }
            for (var i2 = 0; i2 < current_row.length; i2++) {
              var row_item = current_row[i2];
              row_item.calculated.x += deltaX;
            }
          }
          if (node.align.is_set && (node.align.s_value == "right" || node.align.s_value == "center")) {
            let lastItem = current_row[current_row.length - 1];
            var deltaX = node.paddingLeft.pixels + node.innerWidth.pixels + 0.5 * lastItem.marginLeft.pixels - lastItem.calculated.x - lastItem.calculated.width;
            if (node.align.is_set && node.align.s_value == "center") {
              deltaX = deltaX / 2;
            }
            for (var i2 = 0; i2 < current_row.length; i2++) {
              var row_item = current_row[i2];
              row_item.calculated.x += deltaX;
            }
          }
          if (node.verticalAlign.is_set && (node.verticalAlign.s_value == "bottom" || node.verticalAlign.s_value == "center")) {
            if (current_row.length > 0) {
              for (var i2 = 0; i2 < current_row.length; i2++) {
                var row_item = current_row[i2];
                var deltaY = line_height - row_item.calculated.height;
                if (node.verticalAlign.s_value == "center") {
                  deltaY = deltaY / 2;
                }
                row_item.calculated.y += deltaY;
              }
            }
          }
          for (var i2 = 0; i2 < current_row.length; i2++) {
            var row_item = current_row[i2];
            if (row_item.height.unit == 5) {
              row_item.calculated.render_height = line_height;
            }
          }
          child_heights += line_height;
          current_y += line_height;
          line_height = 0;
          row_width = 0;
          child_render_pos.x = node.paddingLeft.pixels;
          child_render_pos.y = current_y;
          child_render_pos = childNode.calculateLayout(node, child_render_pos);
          current_row = [];
          current_row.push(childNode);
          line_height = childNode.calculated.height;
          row_width = childNode.calculated.width;
        } else {
          if (childNode.calculated.height > line_height && childNode.height.unit != 5) {
            line_height = childNode.calculated.height;
          }
          current_row.push(childNode);
          if (!node.calculated.width_override || node.calculated.width_override < row_width) {
            node.calculated.width_override = row_width + node.paddingLeft.pixels + node.paddingRight.pixels;
          }
        }
      }
      if (node.align.is_set && (node.align.s_value == "right" || node.align.s_value == "center")) {
        if (current_row.length > 0) {
          let lastItem = current_row[current_row.length - 1];
          var deltaX = node.paddingLeft.pixels + node.innerWidth.pixels + lastItem.marginLeft.pixels - lastItem.calculated.x - lastItem.calculated.width;
          if (node.align.is_set && node.align.s_value == "center") {
            deltaX = deltaX / 2;
          }
          for (var i2 = 0; i2 < current_row.length; i2++) {
            var row_item = current_row[i2];
            row_item.calculated.x += deltaX;
          }
        }
      }
      if (node.verticalAlign.is_set && (node.verticalAlign.s_value == "bottom" || node.verticalAlign.s_value == "center")) {
        if (current_row.length > 0) {
          for (var i2 = 0; i2 < current_row.length; i2++) {
            var row_item = current_row[i2];
            var deltaY = line_height - row_item.calculated.height;
            if (node.verticalAlign.s_value == "center") {
              deltaY = deltaY / 2;
            }
            row_item.calculated.y += deltaY;
          }
        }
      }
      for (var i2 = 0; i2 < current_row.length; i2++) {
        var row_item = current_row[i2];
        if (row_item.height.unit == 5) {
          row_item.calculated.render_height = line_height;
        }
      }
    }
    if (line_height > 0) {
      child_heights = child_heights + line_height;
    }
    if (!node.height.is_set) {
      elem_h += child_heights;
      const special = render_pos.renderer.measureElement ? render_pos.renderer.measureElement(node) : (_b = (_a = render_pos.renderer).hasCustomSize) == null ? void 0 : _b.call(_a, node);
      if (typeof special !== "undefined") {
        elem_h += special.height;
        node.calculated.width_override = special.width;
        node.calculated.width = special.width;
        node.calculated.render_width = special.width;
        node.calculated.render_height = special.height;
        node.width.pixels = special.width;
      }
    }
    return elem_h;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EVG,
  UICalculated,
  UIRenderPosition,
  getComponentRegistry,
  getFontProvider,
  register_component,
  register_font,
  register_renderer,
  setComponentRegistry,
  setFontProvider,
  setSerializer
});
//# sourceMappingURL=index.js.map
