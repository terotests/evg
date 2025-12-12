var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
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
    DOMParser = require("xmldom").DOMParser;
    XMLSerializer = require("xmldom").XMLSerializer;
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
              console.warn("No XML serializer available for component registration");
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
