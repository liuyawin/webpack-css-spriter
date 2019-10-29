
const fs = require('fs');
const css = require('css');
const path = require('path');
const extend = require('extend');
const spritesmith = require('spritesmith');

const util = require('./src/util.js');
const spriterUtil = require('./src/spriter-util.js');
const processOptions = require('./src/processOptions.js');
const getBackgroundImageDeclarations = require('./src/get-background-image-declarations');
const transformFileWithSpriteSheetData = require('./src/transform-file-with-sprite-sheet-data');

const promiseCall = (fn, ...args) => new Promise((resolve, reject) => fn(...args, (err, result) => err ? reject(err) : resolve(result)));
const asyncGeneratorStep = (gen, resolve, reject, _next, _throw, key, arg) => { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
const _asyncToGenerator = (fn) => { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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
        this._hook(compiler, 'after-emit', 'afterEmit', (compilation, cb) => {
            this.compile(() => {
                cb();
            });
        });
    }

    compile(cb) {
        this._compile().then(cb, err => {
            console.log(err);
            cb();
        });
    }

    _compile() {
        const self = this;
        return _asyncToGenerator(function* () {
            const fileList = [];
            const imageMap = {};
            const imagePromiseArray = [];

            const filesPath = util.readFile(self.options.cssPath);

            for (let i = 0; i < filesPath.length; i++) {
                const filePath = filesPath[i];
                if (!/\.css$/.test(filePath)) {
                    continue;
                }
                const file = yield promiseCall(fs.readFile, filePath, 'utf-8');
                //转为AST
                let styles = css.parse(file, {
                    'silent': self.options.silent,
                    'source': filePath
                });
                //筛选出背景图相关的声明
                let chunkBackgroundImageDeclarations = getBackgroundImageDeclarations(styles, self.options.includeMode, self.options.matchReg);
                let newImagesFromChunkMap = {};
                //去除多余的声明
                chunkBackgroundImageDeclarations.forEach((declaration) => {
                    // Match each background image in the declaration (there could be multiple background images per value)
                    spriterUtil.matchBackgroundImages(declaration.value, function (imagePath) {
                        imagePath = path.join(path.dirname(filePath), imagePath);
                        // If not already in the overall list of images collected
                        // Add to the queue/list of images to be verified
                        if (!imageMap[imagePath]) {
                            newImagesFromChunkMap[imagePath] = true;
                        }
                        // Add it to the main overall list to keep track
                        imageMap[imagePath] = true;
                    });
                });
                //检查路径是否存在
                Object.keys(newImagesFromChunkMap).forEach((imagePath) => {
                    let imagePromise;
                    if (self.options.shouldVerifyImagesExist) {
                        imagePromise = promiseCall(fs.stat, imagePath).then(
                            () => {
                                return {
                                    doesExist: true,
                                    path: imagePath
                                };
                            },
                            () => {
                                return {
                                    doesExist: false,
                                    path: imagePath
                                };
                            }
                        );
                    } else {
                        imagePromise = Promise.resolve({
                            doesExist: false,
                            path: imagePath
                        });
                    }

                    imagePromiseArray.push(imagePromise);
                });
                //保持文件的引用
                fileList.push({ content: file, path: filePath });
            }

            const results = yield Promise.all(imagePromiseArray);
            //存放存在且不重复的图片路径
            let imageList = [];
            for (let i = 0; i < results.length; i++) {
                const fileItem = results[i];
                if (fileItem.doesExist === true || fileItem.doesExist === undefined) {
                    imageList.push(fileItem.path);
                }
            }
            const spritesmithOptions = extend({}, self.options.spritesmithOptions, { src: imageList });
            //打包后的雪碧图，包含coordinates、properties和image三个属性，分别表示雪碧图中小图的坐标、雪碧图的宽高、雪碧图图片数据
            const spriteResult = yield promiseCall(spritesmith, spritesmithOptions);

            let count = 0;
            for (let i in spriteResult.coordinates) {
                count++;
            }
            if (self.options.spriteSheet && count > 0) {
                //创建图片
                yield promiseCall(fs.writeFile, self.options.spriteSheet, spriteResult.image, 'binary');
            }
            for (let i = 0; i < fileList.length; i++) {
                let file = fileList[i];//content path
                file = transformFileWithSpriteSheetData(file, spriteResult.coordinates, self.options.pathToSpriteSheetFromCSS, self.options.includeMode, self.options.silent, self.options.outputIndent, self.options.matchReg);
                //写入css
                yield promiseCall(fs.writeFile, file.path, file.content, 'utf-8');
            }
        })();
    }
}