const extend = require('extend')

module.exports = options => {
    let defaults = {
        // ('implicit'|'explicit')
        'includeMode': 'implicit',
        // The path and file name of where we will save the sprite sheet
        'spriteSheet': 'spritesheet.png',
        // Because we don't know where you will end up saving the CSS file at this point in the pipe,
        // we need a litle help identifying where it will be.
        'pathToSpriteSheetFromCSS': 'spritesheet.png',

        // 按照指定正则规则进行匹配，pattern为空表示匹配所有
        "matchReg": {
            pattern: null,
            attributes: "i"
        },
        // Same as the spritesmith callback `function(err, result)`
        // result.image: Binary string representation of image
        // result.coordinates: Object mapping filename to {x, y, width, height} of image
        // result.properties: Object with metadata about spritesheet {width, height}
        'spriteSheetBuildCallback': null,
        // If true, we ignore any images that are not found on disk
        // Note: this plugin will still emit an error if you do not verify that the images exist
        'silent': true,
        // Check to make sure each image declared in the CSS exists before passing it to the spriter.
        // Although silenced by default(`options.silent`), if an image is not found, an error is thrown.
        'shouldVerifyImagesExist': true,
        // Any option you pass in here, will be passed through to spritesmith
        // https://www.npmjs.com/package/spritesmith#-spritesmith-params-callback-
        'spritesmithOptions': {},
        // Used to format output CSS
        // You should be using a separate beautifier plugin
        'outputIndent': '\t'
    };

    let settings = extend({}, defaults, options);
    settings.matchReg = (settings.matchReg.pattern ? new RegExp(settings.matchReg.pattern, settings.matchReg.attributes) : null);

    return settings;
}