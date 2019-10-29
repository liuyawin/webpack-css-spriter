
const processOptions = require('./src/processOptions.js');

module.exports = class WebpackCssSprite {
    constructor(options) {
        this.options = processOptions(options);
    }

    _hook(compiler, v3Name, v4Name, cb) {
        if (compiler.hooks && compiler.hooks[v4Name]) {
            compiler.hooks[v4Name].tapAsync('webpack-css-sprite', cb);
        } else {
            compiler.plugin(v3Name, cb);
        }
    }

    apply(compiler) {
        this._hook(compiler, 'after-emit', 'afterEmit', (compilation) => {
            console.log(compilation);
        });
    }
}