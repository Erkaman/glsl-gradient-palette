/* global requestAnimationFrame */

var mat4 = require('gl-mat4');
var vec3 = require('gl-vec3');
var Geometry = require('gl-geometry');
var glShader = require('gl-shader');
var glslify = require('glslify');
var createOrbitCamera = require('orbit-camera');
var shell = require("gl-now")();
var createGui = require("pnp-gui");
var cameraPosFromViewMatrix = require('gl-camera-pos-from-view-matrix');
var randomArray = require('random-array');
var createSphere = require('primitive-icosphere');
var copyToClipboard = require('copy-to-clipboard');
var createGradientPalette = require('../index.js').createGradientPalette;
var PaletteDrawer = require('../index.js').PaletteDrawer;

var sphereShader, sphereGeo, paletteDrawer;

var camera = createOrbitCamera([0, -2.0, 0], [0, 0, 0], [0, 1, 0]);

var mouseLeftDownPrev = false;

var bg = [0.6, 0.7, 1.0]; // clear color.

var noiseScale = {val: 4.0};
var noiseAnimateSpeed = {val: 0.3};
var paletteType = {val: 4};

var noiseAnimate = {val: true};

var paletteTexture;
var totalTime = 0;

var earthPaletteTexture;
var cloudPaletteTexture;
var redPaletteTexture;
var somethingPaletteTexture;
var fireballPaletteTexture;
var rockPaletteTexture;

shell.on("gl-init", function () {
    var gl = shell.gl

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK)
    
    gui = new createGui(gl);
    gui.windowSizes = [280, 380];

   paletteDrawer = new PaletteDrawer(gl, [400, 40], [880, 100] );

    var sphere = createSphere(1, { subdivisions: 2});
    sphereGeo = Geometry(gl)
        .attr('aPosition', sphere.positions).faces(sphere.cells);

    sphereShader = glShader(gl, glslify("./sphere_vert.glsl"), glslify("./sphere_frag.glsl"));


    // fix intial camera view.
    camera.rotate([0,0], [0,0] );

    /*
    Initialize all the palettes.
     */

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

    var cloud =  [
        [0.0, [0,0,0.7]],
        [0.2, [0,0,1.0]],
        [0.85, [1.0, 1.0, 1.0]],
        [1.0, [1.0, 1.0, 1.0]],
    ];


    
    var red =  [
        [0.0, [1.0,0,0.0]],
        [0.15, [0.5,0,0.1]],
        [0.3, [0.6,0,0.3]],
        [0.6, [0.0,0,0.0]],
        [0.7, [0.25,0.25,0.0]],
        [0.9, [0.75,0.75,0.0]],
        [1.0, [1.0, 1.0, 0.0]],
    ];


    var something =  [
        [0.0, [0.0,0.3,0.3]],
        [0.1, [1.0,0.0,1.0]],
        [0.2, [0.0,0.0,0.4]],
        [0.3, [0.3,0.6,0.2]],
        [0.4, [0.4,0.4,0.0]],
        [0.5, [0.9,0.7,0.7]],
        [0.6, [0.5,0.0,0.0]],
        [0.7, [0.8,0.3,0.5]],
        [0.8, [0.8,0.8,0.8]],
        [0.9, [0.0,1.0,0.0]],
        [1.0, [0.0, 0.0, 0.0]],
    ];

    var fireball =  [
        [0.0, [0.4,0.4,0.4]],
        [0.55, [0.0,0.0,0.0]],
        [0.60, [1.0,0.0, 0.0]],
        [0.70, [1.0,1.0, 0.0]],
        [1.0, [0.4,0.4, 0.0]]
    ];

    var rock =  [
        [0.0, [0.2,0.1,0.0]],
        [0.05, [0.1,0.0,0.0]],
        [0.45, [0.25,0.15,0.05]],
        [0.5, [0.30,0.20,0.05]],
        [0.60, [0.45,0.35,0.20]],
        [0.75, [0.40,0.30,0.20]],
        [1.0, [0.5,0.4,0.3]] ];


    var simple =  [
        [0.0, [1.0,0.0,0.0]],
        [0.5, [0.0,0.0,0.0]],

        [1.0, [0.0,0.0,1.0]],
    ];

    var opts =  {size:1024};

    earthPaletteTexture = createGradientPalette(gl,earth, opts);
    cloudPaletteTexture = createGradientPalette(gl,cloud, opts);
    redPaletteTexture = createGradientPalette(gl,red, opts);
    somethingPaletteTexture = createGradientPalette(gl,something, opts);
    fireballPaletteTexture = createGradientPalette(gl,fireball, opts);
    rockPaletteTexture = createGradientPalette(gl,rock, opts);
    simplePaletteTexture = createGradientPalette(gl,simple, opts);

});


shell.on("gl-render", function (t) {
    var gl = shell.gl
    var canvas = shell.canvas;

    if(noiseAnimate.val)
        totalTime += noiseAnimateSpeed.val;

    if(paletteType.val == 0) {
        paletteTexture =  earthPaletteTexture;
    } else if(paletteType.val == 1) {
        paletteTexture =  cloudPaletteTexture;
    } else if(paletteType.val == 2) {
        paletteTexture =  redPaletteTexture;
    } else if(paletteType.val == 3) {
        paletteTexture =  somethingPaletteTexture;
    }else if(paletteType.val == 4) {
        paletteTexture =  fireballPaletteTexture;
    }else if(paletteType.val == 5) {
        paletteTexture =  rockPaletteTexture;
    }else if(paletteType.val == 6) {
        paletteTexture =  simplePaletteTexture;
    }

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
    sphereShader.uniforms.uPalette = paletteTexture.bind()
    sphereShader.uniforms.uTime = totalTime;


    sphereGeo.bind(sphereShader);
    sphereGeo.draw();

    /*
    Render Palette.
     */

    paletteDrawer.draw(paletteTexture, canvas.width, canvas.height);

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

    gui.begin(io, "Settings");

    gui.textLine("Palette");

    gui.radioButton("Earth", paletteType, 0);
    gui.radioButton("Cloud", paletteType, 1);
    gui.radioButton("Red", paletteType, 2);
    gui.radioButton("Something", paletteType, 3);
    gui.radioButton("Fireball", paletteType, 4);
    gui.radioButton("Rock", paletteType, 5);
    gui.radioButton("Simple", paletteType, 6);

    gui.separator();



    gui.textLine("Noise Settings");

    gui.checkbox("Animate", noiseAnimate );

    //gui.sliderFloat("Scale", noiseScale, 0.1, 10.0);
    if(noiseAnimate.val)
        gui.sliderFloat("Animation Speed", noiseAnimateSpeed, 0.0, 5.0);

    gui.sliderFloat("Noise Scale", noiseScale, 0.0, 10.0);

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
