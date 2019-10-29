webpack-css-sprite是一个webpack插件，用于合成雪碧图。基于[gulp-css-spriter-dookay](https://www.npmjs.com/package/gulp-css-spriter-dookay)。   
## 安装
```
npm install webpack-css-sprite --save-dev
```
## 使用
```
let WebpackCssSprite = require('../webpack-css-sprite');

new WebpackCssSprite({
    cssPath: projectInfo.output + '/css/',
    spriteSheet: projectInfo.output + '/images/sprite/icon.png',
    pathToSpriteSheetFromCSS: '../images/sprite/icon.png',
    spritesmithOptions: {
        padding: 10
    },
    matchReg: {
        pattern: '\.\.\/images\/sprite\/'
    }
})
```
## options
* cssPath：string - 待处理css所在文件夹。    
            
其余配置项见[gulp-css-spriter-dookay](https://www.npmjs.com/package/gulp-css-spriter-dookay)。   