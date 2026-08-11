#version 300 es

in vec4 iColor;
in vec2 pos;
out vec4 vColor;

void main() {
    gl_Position = vec4(pos, 0.0, 1.0);
    vColor = iColor;
}