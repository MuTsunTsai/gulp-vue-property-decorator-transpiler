# gulp-vue-property-decorator-transpiler

To be used with [vue-property-decorator-transpiler](https://www.npmjs.com/package/vue-property-decorator-transpiler).

It will pack all .vue files in a project with an initial .html file and .js file, and generate only one .html and one .js file.

## License

MIT License

## Install

```bash
npm install gulp-vue-property-decorator-transpiler --save-dev
```

## Usage

```javascript
var gulp = require('gulp');
var gvpd = require('gulp-vue-property-decorator-transpiler');

gulp.src("src/index.htm") // the initial .html file
	.pipe(gvpd({
		script: "src/main.js", // the initial .js file, will be put at the end of the output
		componentsDir: "src/components", // the directory of all .vue files
		outputScript: "dist/assets/main.js", // the output .js file
		outputHTML: "dist/index.htm", // the output .html file
		minifyScript: true // if true, will also minify .js (by terser)
	}))
```
