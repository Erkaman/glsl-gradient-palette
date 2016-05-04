/* global requestAnimationFrame */

var mat4 = require('gl-mat4');
var vec3 = require('gl-vec3');
var Geometry = require('gl-geometry');
var glShader = require('gl-shader');
var glslify = require('glslify')
var createOrbitCamera = require('orbit-camera');
var shell = require("gl-now")();
var createGui = require("pnp-gui");
var cameraPosFromViewMatrix = require('gl-camera-pos-from-view-matrix');
var randomArray = require('random-array');
var createSphere = require('primitive-icosphere');
var copyToClipboard = require('copy-to-clipboard');
var createGradientPalette = require('../index.js');

var sphereShader, quadShader, quadGeo, sphereGeo;

var camera = createOrbitCamera([0, -2.0, 0], [0, 0, 0], [0, 1, 0]);

var mouseLeftDownPrev = false;

var bg = [0.6, 0.7, 1.0]; // clear color.

var noiseScale = {val: 2.0};
var seed = 100;

var paletteTexture;
var totalTime = 0;

// arguments are top-left and bottom-right corners
function createQuad(tl, br) {
    var positions = [];
    var uvs = [];

    positions.push( [tl[0], tl[1] ] );
    positions.push( [ br[0],  tl[1] ] );
    positions.push( [ tl[0] ,  br[1] ] );
    positions.push([ br[0], br[1] ] );

    uvs.push( [0,0 ] );// top-left
    uvs.push( [1,0 ] );// bottom-left
    uvs.push( [0,1 ] );// top-right
    uvs.push( [1,1 ] );// bottom-right

    var cells = [];
    cells.push( [2,1,0] );

    cells.push( [1,2,3] );

    return {positions: positions, cells:cells, uvs:uvs};
}

shell.on("gl-init", function () {
    var gl = shell.gl

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK)
    
    gui = new createGui(gl);
    gui.windowSizes = [200, 380];
    gui.windowPosition = [0, 0];

    var sphere = createSphere(1, { subdivisions: 2});
    sphereGeo = Geometry(gl)
        .attr('aPosition', sphere.positions).faces(sphere.cells);

    var quad = createQuad(  [400, 40], [880, 100] );
    quadGeo = Geometry(gl).
    attr('aPosition', quad.positions, {size:2} ).
    attr('aUv', quad.uvs, {size:2} ).faces(quad.cells, {size:3});

    sphereShader = glShader(gl, glslify("./sphere_vert.glsl"), glslify("./sphere_frag.glsl"));
    quadShader = glShader(gl, glslify("./quad_vert.glsl"), glslify("./quad_frag.glsl"));


    // fix intial camera view.
    camera.rotate([0,0], [0,0] );

    var earth =  [
        [0.0, [0,0,1]],
        [0.25, [0,0,0.7]],
        [0.5, [0,0,0.5]],
        [0.6, [0.8,0.7,0.1]],
        [0.62, [0,0.4,0]],
        [0.7, [0,0.45,0]],
        [0.80, [0.1,0.3,0.0]],
        [1.0, [0.1, 0.30, 0.1]],
    ];

    var clouds =  [
        [0.0, [0,0,0.7]],
        [0.2, [0,0,1.0]],
        [0.85, [1.0, 1.0, 1.0]],
        [1.0, [1.0, 1.0, 1.0]],
    ];


    var gas =  [
        [0.0, [1.0,0,0.0]],
        [0.15, [0.5,0,0.1]],
        [0.3, [0.6,0,0.3]],
        [0.6, [0.0,0,0.0]],
        [0.7, [0.25,0.25,0.0]],
        [0.9, [0.75,0.75,0.0]],
        [1.0, [1.0, 1.0, 0.0]],
    ];

    paletteTexture = createGradientPalette(gl,gas
       );
});

function newSeed() {
    seed = randomArray(0.0, 100.0).oned(1)[0];
}

shell.on("gl-render", function (t) {
    var gl = shell.gl
    var canvas = shell.canvas;
    totalTime += t;


    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, canvas.width, canvas.height);

    var projection = mat4.create();
    var scratchMat = mat4.create();
    var view = camera.view(scratchMat);

    mat4.perspective(projection, Math.PI / 2, canvas.width / canvas.height, 0.1, 10000.0);

    /*
    Render Sphere
     */

    sphereShader.bind();

    sphereShader.uniforms.uView = view;
    sphereShader.uniforms.uProjection = projection;
    sphereShader.uniforms.uNoiseScale = noiseScale.val;
    sphereShader.uniforms.uSeed = seed;
    sphereShader.uniforms.uPalette = paletteTexture.bind()
    sphereShader.uniforms.uTime = totalTime;
    console.log("time: ",totalTime);

    sphereGeo.bind(sphereShader);
    sphereGeo.draw();

    /*
    Render Palette.
     */

    quadShader.bind();

    var projection = mat4.create()
    mat4.ortho(projection, 0,  canvas.width, canvas.height, 0, -1.0, 1.0)
    quadGeo.bind(quadShader);
    quadShader.uniforms.uProj = projection;
    quadShader.uniforms.palette = paletteTexture.bind()

    quadGeo.draw();


    /*
    Render GUI.
     */

    var pressed = shell.wasDown("mouse-left");
    var io = {
        mouseLeftDownCur: pressed,
        mouseLeftDownPrev: mouseLeftDownPrev,

        mousePositionCur: shell.mouse,
        mousePositionPrev: shell.prevMouse
    };
    mouseLeftDownPrev = pressed;

    gui.begin(io, "Window");

    gui.textLine("Noise Settings");


    gui.sliderFloat("Scale", noiseScale, 0.1, 10.0);

    if(gui.button("New Seed")) {
        newSeed();
    }

    gui.end(gl, canvas.width, canvas.height);
});

shell.on("tick", function () {

    // if interacting with the GUI, do not let the mouse control the camera.
    if (gui.hasMouseFocus())
        return;

    if (shell.wasDown("mouse-left")) {
        var speed = 1.3;
        camera.rotate([(shell.mouseX / shell.width - 0.5) * speed, (shell.mouseY / shell.height - 0.5) * speed],
            [(shell.prevMouseX / shell.width - 0.5) * speed, (shell.prevMouseY / shell.height - 0.5) * speed])
    }
    if (shell.scroll[1]) {
        camera.zoom(shell.scroll[1] * 0.01);
    }
});