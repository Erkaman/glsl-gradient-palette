/**
 * Created by eric on 04/05/16.
 */


var createTexture = require('gl-texture2d')

function _lerpColors(c1, c2, t) {
    return [
        c1[0] * (1.0-t) + c2[0] * (t),
        c1[1] * (1.0-t) + c2[1] * (t),
        c1[2] * (1.0-t) + c2[2] * (t)

    ];
}

function createGradientPalette(gl, gradientList) {


    // sanity checking.
    if(gradientList.length < 2)
        throw new Error("gradientList must have at least two elements!");
    if(gradientList[0][0] != 0.0 )
        throw new Error("First gradient color must begin at 0.0");
    if(gradientList[gradientList.length-1][0] != 1.0 )
        throw new Error("Last gradient color must begin at 1.0");

    for(var i = 0; i < gradientList.length-1; ++i) {
        if(gradientList[i+0][0] > gradientList[i+1][0]) {
            throw new Error("Gradients must be specified in order, yet gradient " + (i+1) + " starts before gradient " + (i+0) );
        }
    }

    var paletteLength = 1024;
    var paletteHeight = 1;

    var paletteData = [];

    var iColor = 0;

    for(var i = 0; i < paletteLength; ++i) {
        var t = i / paletteLength;

        if(gradientList[iColor+1][0] < t) {
            ++iColor; // next color.
        }

        var c1 = gradientList[iColor+0];
        var c2 = gradientList[iColor+1];

        var l = _lerpColors( c1[1], c2[1] , (t - c1[0])/(c2[0]-c1[0]) );


        paletteData.push(l[0]);
        paletteData.push(l[1]);
        paletteData.push(l[2]);
    }

    var temp = new Float32Array(paletteLength * paletteHeight * 3)
    temp.set(paletteData)


    var paletteTexture = createTexture(gl, [paletteLength, paletteHeight], gl.RGB, gl.FLOAT);
    paletteTexture.bind();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, paletteLength, paletteHeight, 0, gl.RGB, gl.FLOAT, temp);

    return paletteTexture;

}

module.exports=createGradientPalette;