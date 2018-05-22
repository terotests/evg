#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../layout/index");
const argv = require('minimist')(process.argv.slice(2));
if (argv._.length < 2) {
    console.log(`
USAGE: evg <infile> <outfile>  
  `);
    process.exit();
}
const create_text = (str) => {
    return str.split(" ").map(_ => `<t text="${_} "/>`).join('');
};
const create_footer_text = (str) => {
    return str.split(" ").map(_ => `<t text="${_} " font-size="9"/>`).join('');
};
// install default fonts
index_1.EVG.installFont('candal', __dirname + '/../../fonts/Candal/Candal.ttf');
index_1.EVG.installFont('sans', __dirname + '/../../fonts/Open_Sans/OpenSans-regular.ttf');
index_1.EVG.installComponent('t', `<Label font-family="sans" background-color="black" />`);
index_1.EVG.installComponent('text', `<Label font-family="sans" background-color="black" />`);
const curr_dir = process.cwd();
const fs = require('fs');
const path = require('path');
const walkSync = function (dir, filelist) {
    const files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function (file) {
        if (fs.statSync(dir + file).isDirectory()) {
            filelist = walkSync(dir + file + '/', filelist);
        }
        else {
            filelist.push(dir + file);
        }
    });
    return filelist;
};
// load components
if (fs.existsSync(curr_dir + '/components/')) {
    const base_dir = curr_dir + '/components/';
    const files = walkSync(base_dir);
    for (let f of files) {
        try {
            const compname = path.basename(f).split('.')[0];
            const compdata = fs.readFileSync(f, 'utf8');
            index_1.EVG.installComponent(compname, compdata);
        }
        catch (e) {
            console.log(e);
        }
    }
}
if (fs.existsSync(curr_dir + '/fonts/')) {
    const base_dir = curr_dir + '/fonts/';
    const files = walkSync(base_dir);
    for (let f of files) {
        try {
            const font_name = path.basename(f).split('.')[0];
            if (font_name != 'OFL') {
                console.log('FONT ', font_name);
                index_1.EVG.installFont(font_name, f);
            }
        }
        catch (e) {
            console.log(e);
        }
    }
}
try {
    const infile = './' + argv._[0];
    const outfile = argv._[1];
    const data = fs.readFileSync(infile, 'utf8');
    const node = new index_1.EVG(data);
    index_1.EVG.renderToFile(outfile, 595.28, 841.89, node);
}
catch (e) {
    console.error(e);
}
//# sourceMappingURL=evg.js.map