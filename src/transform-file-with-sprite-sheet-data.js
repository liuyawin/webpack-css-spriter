var path = require('path');
var extend = require('extend');

var css = require('css');

var spriterUtil = require('./spriter-util');
var mapOverStylesAndTransformBackgroundImageDeclarations = require('./map-over-styles-and-transform-background-image-declarations');

var backgroundURLMatchAllRegex = new RegExp(spriterUtil.backgroundURLRegex.source, "gi");

// Replace all the paths that need replacing
function transformFileWithSpriteSheetData(spritePath, file, coordinateMap, pathToSpriteSheetFromCSS,  /*optional*/includeMode, /*optional*/isSilent, /*optional*/outputIndent,/*optional*/matchReg) {
    includeMode = includeMode ? includeMode : 'implicit';
    isSilent = (isSilent !== undefined) ? isSilent : false;
    outputIndent = outputIndent ? outputIndent : '\t';

    if (file.content) {
        let styles = css.parse(String(file.content), {
            'silent': isSilent,
            'source': file.path
        });

        styles = mapOverStylesAndTransformBackgroundImageDeclarations(styles, includeMode, matchReg, function (declaration) {
            let coordList = [];
            declaration.value = spriterUtil.matchBackgroundImages(declaration.value, function (imagePath) {
                let fullImagePath;
                if (spritePath) {
                    fullImagePath = path.join(spritePath, imagePath.split(path.resolve('/')).pop());
                } else {
                    fullImagePath = path.join(path.dirname(filePath), imagePath);
                }
                let coords = coordinateMap[fullImagePath];

                // Make sure there are coords for this image in the sprite sheet, otherwise we won't include it
                if (coords) {
                    coordList.push("-" + coords.x + "px -" + coords.y + "px");

                    // If there are coords in the spritemap for this image, lets use the spritemap
                    return pathToSpriteSheetFromCSS;
                }

                return imagePath;
            });

            return {
                'value': declaration,
                /* */
                // Add the appropriate background position according to the spritemap
                'insertElements': (function () {
                    if (coordList.length > 0) {
                        return {
                            type: 'declaration',
                            property: 'background-position',
                            value: coordList.join(', ')
                        };
                    }
                })()
                /* */
            };
        });

        //console.log(styles.stylesheet.rules[0].declarations);

        // Put it back into string form
        file.content = css.stringify(styles, {
            indent: outputIndent
        });
    }

    return file;
}

module.exports = transformFileWithSpriteSheetData;