// rollup.config.js
// commonjs
var serve = require('rollup-plugin-serve');

module.exports = {
    input: './temp/temp.js',
    output: {
        file: 'temp/dist/temp.js',
        format: 'cjs',
    },
    plugins: [
        serve({
            contentBase: './',
            serveIndex: true
        })
    ]
};
