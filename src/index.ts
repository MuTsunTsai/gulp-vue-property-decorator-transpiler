import fs = require('fs');
import through = require('through2');
import stream = require('stream');
import File = require('vinyl');
import cheerio = require('cheerio');
import htmlparser2 = require('htmlparser2');
import beautify = require("js-beautify");
import relative = require('relative');
import terser = require('terser');
import transpiler = require('vue-property-decorator-transpiler');

var scripts: string[];
var templates: Cheerio[];
var vpdOption: vpdOptions;

var cheerioOptions: CheerioOptionsInterface = {
	normalizeWhitespace: false,
	xmlMode: false,
	decodeEntities: false,
	recognizeSelfClosing: true
};

function parseVue(filename: string) {
	if(!filename.endsWith(".vue")) return;
	var vueFile = fs.readFileSync(filename);
	var vue = cheerio.load(vueFile.toString(), cheerioOptions);
	var result = transpiler(vue("script").html());
	templates.push(vue("template").attr("id", result.template));
	scripts.push(result.script);
}

function transform(this: stream.Transform, chunk: File, enc: BufferEncoding, callback: through.TransformCallback) {
	scripts = [];
	templates = [];

	if(chunk.isNull()) return callback(null, chunk);
	if(chunk.isStream()) {
		console.log('Cannot use streamed files');
		return callback();
	}

	// Process .vue files
	let filenames = fs.readdirSync(vpdOption.componentsDir);
	filenames.forEach(filename => parseVue(vpdOption.componentsDir + "/" + filename));

	// Decide final script filename
	let scriptName = vpdOption.minifyScript ? vpdOption.outputScript.replace(/\.js$/, ".min.js") : vpdOption.outputScript;

	// Create HTML file
	const dom = htmlparser2.parseDOM(chunk.contents.toString(enc));
	const htmlFile = cheerio.load(dom, cheerioOptions);
	for(let template of templates) {
		htmlFile("html").append(template).append('\n\n');
	}
	htmlFile("html").append(`<script src="${relative(vpdOption.outputHTML, scriptName)}"></script>\n\n`)
	let html = Buffer.from(htmlFile.html(), enc);
	chunk.contents = html;
	fs.writeFileSync(vpdOption.outputHTML, html);

	// Create script file
	var main = fs.readFileSync(vpdOption.script);
	scripts.push(main.toString());
	scripts = scripts.map(s => s.trim());
	var script = beautify.js(scripts.join("\n\n"), { "indent_with_tabs": true });
	fs.writeFileSync(vpdOption.outputScript, script);

	// Minify
	if(vpdOption.minifyScript) {
		let filename = scriptName.substr(scriptName.lastIndexOf("/") + 1);
		let orgName = filename.replace(/\.min.js$/, ".js");
        let result = terser.minify({[orgName]: script}, {
            sourceMap: {
                filename: filename,
                url: filename + ".map"
            }
        });
		fs.writeFileSync(scriptName, result.code);
		fs.writeFileSync(scriptName + ".map", result.map);
	}

	return callback(null, chunk);
}

function gvpd(options: vpdOptions): stream.Transform {
	vpdOption = options;
	vpdOption.componentsDir = vpdOption.componentsDir.replace(/\/$/, "");
	return through.obj(transform);
}

export = gvpd;

interface vpdOptions {
	script: string;
	componentsDir: string;
	outputScript: string;
	outputHTML: string;
	minifyScript: boolean;
}