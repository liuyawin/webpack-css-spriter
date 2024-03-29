var extend = require('extend');

var spriterUtil = require('./spriter-util');
var getMetaInfoForDeclaration = require('./get-meta-info-for-declaration');
var transformMap = require('./transform-map');



function mapOverStylesAndTransformBackgroundImageDeclarations(styles, includeMode,matchReg, cb) {
	return mapOverStylesAndTransformAllBackgroundImageDeclarations(styles,matchReg, function(declaration) {
		// Then filter down to only the proper ones (according to their meta data)
		if(shouldIncludeFactoringInMetaData(declaration.meta, includeMode)) {
			return cb.apply(null, arguments);
		}
	});
}

// Boolean function to determine if the meta data permits using this declaration
function shouldIncludeFactoringInMetaData(meta, includeMode) {
	var metaIncludeValue = (meta && meta.spritesheet && meta.spritesheet.include);
	var shouldIncludeBecauseImplicit = includeMode === 'implicit' && (metaIncludeValue === undefined || metaIncludeValue);
	var shouldIncludeBecauseExplicit = includeMode === 'explicit' && metaIncludeValue;
	var shouldInclude = shouldIncludeBecauseImplicit || shouldIncludeBecauseExplicit;

	// Only return declartions that shouldn't be skipped
	return shouldInclude;
}



// Pass in a styles object from `css.parse`
// Loop over all of the styles and transform/modify the background image declarations
// Returns a new styles object that has the transformed declarations
function mapOverStylesAndTransformAllBackgroundImageDeclarations(styles,matchReg, cb) {

	function transformDeclaration(declaration, declarationIndex, declarations) {
		// Clone the declartion to keep it immutable
		var transformedDeclaration = extend(true, {}, declaration);
		transformedDeclaration = attachInfoToDeclaration(declarations, declarationIndex);

		// background-image always has a url
		//if(transformedDeclaration.property === 'background-image') {
		if(transformedDeclaration.property === 'background-image' && (!matchReg || (matchReg && matchReg.test(transformedDeclaration.value)))) {
			//console.log(styles.matchReg && styles.matchReg.test(transformedDeclaration.value));
      return cb(transformedDeclaration, declarationIndex, declarations);
		}
		// Background is a shorthand property so make sure `url()` is in there
		//else if(transformedDeclaration.property === 'background' ) {
		else if(transformedDeclaration.property === 'background' && (!matchReg || (matchReg && matchReg.test(transformedDeclaration.value)))) {
			var hasImageValue = spriterUtil.backgroundURLRegex.test(transformedDeclaration.value);

			if(hasImageValue) {
        return cb(transformedDeclaration, declarationIndex, declarations);
			}
		}

		// Wrap in an object so that the declaration doesn't get interpreted
		return {
			'value': transformedDeclaration
		};
	}

	// Clone the declartion to keep it immutable
	var transformedStyles = extend(true, {}, styles);

	// Go over each background `url()` declarations
	transformedStyles.stylesheet.rules.map(function(rule, ruleIndex) {
		if(rule.type === 'rule') {
			rule.declarations = transformMap(rule.declarations, transformDeclaration);
		}

		if(rule.type === 'keyframes') {
			// Get keyframe from keyframes
			rule.keyframes = transformMap(rule.keyframes, function(keyframe, keyframeIndex, keyframes) {
				// Get declarations from keyframe
				keyframe.declarations = transformMap(keyframe.declarations, transformDeclaration);
			});
		}

		return rule;
	});

	return transformedStyles;
}

// We do NOT directly modify the declaration in the rule
// We pass the whole rule and current index so we can properly look at the metaData around each declaration
// and add it to the declaration
function attachInfoToDeclaration(declarations, declarationIndex)
{
	if(declarations.length > declarationIndex) {
		// Clone the declartion to keep it immutable
		var declaration = extend(true, {}, declarations[declarationIndex]);

		var declarationMetaInfo = getMetaInfoForDeclaration(declarations, declarationIndex);

		// Add the meta into to the declaration
		declaration.meta = extend(true, {}, declaration.meta, declarationMetaInfo);

		return declaration;
	}

	return null;
}



module.exports = mapOverStylesAndTransformBackgroundImageDeclarations;
