#!/usr/bin/env node

import { EVG } from "../layout/index";

const argv = require("minimist")(process.argv.slice(2));
if (argv._.length < 1) {
  console.log(`
USAGE: evg <infile> <outfile>  
  `);
  process.exit();
}

const create_text = (str: string) => {
  return str
    .split(" ")
    .map((_) => `<t text="${_} "/>`)
    .join("");
};
const create_footer_text = (str: string) => {
  return str
    .split(" ")
    .map((_) => `<t text="${_} " font-size="9"/>`)
    .join("");
};

// install default fonts
const path = require("path");
const fs = require("fs");

// Try multiple possible font paths to handle different installation scenarios
function findFontPath(relativePath) {
  const possiblePaths = [
    path.join(__dirname, "../fonts/", relativePath), // From source
    path.join(__dirname, "/../../../fonts/", relativePath), // From dist
    path.join(process.cwd(), "/fonts/", relativePath), // Current directory
    path.join(path.dirname(process.execPath), "/../fonts/", relativePath), // Global install path
  ];

  // Add specific global NPM install paths
  if (process.env.APPDATA) {
    // Windows
    possiblePaths.push(
      path.join(
        process.env.APPDATA,
        "npm/node_modules/evg/fonts/",
        relativePath
      )
    );
  } else if (process.env.HOME) {
    // Linux/Mac
    possiblePaths.push(
      path.join(process.env.HOME, ".npm/node_modules/evg/fonts/", relativePath)
    );
  }

  // Return the first path that exists
  for (const fontPath of possiblePaths) {
    try {
      if (fs.existsSync(fontPath)) {
        return fontPath;
      }
    } catch (e) {
      // Continue trying other paths
    }
  }

  console.warn(`Warning: Could not find font file ${relativePath}`);
  return possiblePaths[0]; // Return the first path as fallback
}

EVG.installFont("candal", findFontPath("Candal/Candal.ttf"));
EVG.installFont("sans", findFontPath("Open_Sans/OpenSans-Regular.ttf"));

EVG.installComponent(
  "t",
  `<Label font-family="sans" background-color="black" />`
);
EVG.installComponent(
  "text",
  `<Label font-family="sans" background-color="black" />`
);

const curr_dir = process.cwd();

const walkSync = function (dir: string, fList?: string[]) {
  const files = fs.readdirSync(dir);
  let filelist = fList || [];
  files.forEach(function (file: string) {
    if (fs.statSync(dir + file).isDirectory()) {
      filelist = walkSync(dir + file + "/", filelist);
    } else {
      filelist.push(dir + file);
    }
  });
  return filelist;
};

// load components
if (fs.existsSync(curr_dir + "/components/")) {
  const base_dir = curr_dir + "/components/";
  const files = walkSync(base_dir);
  for (let f of files) {
    try {
      const compname = path.basename(f).split(".")[0];
      const compdata = fs.readFileSync(f, "utf8");

      EVG.installComponent(compname, compdata);
    } catch (e) {
      console.log(e);
    }
  }
}
if (fs.existsSync(curr_dir + "/fonts/")) {
  const base_dir = curr_dir + "/fonts/";
  const files = walkSync(base_dir);
  for (let f of files) {
    try {
      const font_name = path.basename(f).split(".")[0];
      if (font_name != "OFL") {
        EVG.installFont(font_name, f);
      }
    } catch (e) {
      console.log(e);
    }
  }
}

try {
  const infile = "./" + argv._[0];
  const outfile =
    argv._[1] || "./" + path.basename(infile).split(".")[0] + ".pdf";
  const data = fs.readFileSync(infile, "utf8");
  const node = new EVG(data);
  EVG.renderToFile(outfile, 595.28, 841.89, node);
} catch (e) {
  console.error(e);
}
