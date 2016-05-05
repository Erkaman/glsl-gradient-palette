precision mediump float;

varying vec2 vUv;

uniform sampler2D palette;

void main() {
  gl_FragColor = vec4( texture2D(palette, vec2(vUv.x, 0.0) ).xyz , 1.0 );
}