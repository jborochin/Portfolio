import { useEffect, useRef } from "react";

// ── WebGL helpers ──────────────────────────────────────────────

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    throw new Error(gl.getShaderInfoLog(shader)!);
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog)!);
  return prog;
}

function getUniforms(gl: WebGL2RenderingContext, prog: WebGLProgram) {
  const uniforms: Record<string, WebGLUniformLocation> = {};
  const count = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(prog, i)!;
    uniforms[info.name] = gl.getUniformLocation(prog, info.name)!;
  }
  return uniforms;
}

interface FBO {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  attach(id: number): number;
}

interface DoubleFBO {
  width: number;
  height: number;
  read: FBO;
  write: FBO;
  swap(): void;
}

function createFBO(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number
): FBO {
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  return {
    texture,
    fbo,
    width: w,
    height: h,
    attach(id: number) {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    },
  };
}

function createDoubleFBO(
  gl: WebGL2RenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  filter: number
): DoubleFBO {
  let fbo1 = createFBO(gl, w, h, internalFormat, format, type, filter);
  let fbo2 = createFBO(gl, w, h, internalFormat, format, type, filter);
  return {
    width: w,
    height: h,
    get read() {
      return fbo1;
    },
    get write() {
      return fbo2;
    },
    swap() {
      const tmp = fbo1;
      fbo1 = fbo2;
      fbo2 = tmp;
    },
  };
}

// ── Color generation (toukoum.fr style) ────────────────────────

function HSVtoRGB(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    case 5: return [v, p, q];
    default: return [v, t, p];
  }
}

function generateColor(): [number, number, number] {
  const c = HSVtoRGB(Math.random(), 1.0, 1.0);
  return [c[0] * 0.3, c[1] * 0.3, c[2] * 0.3];
}

// ── Shaders ────────────────────────────────────────────────────

const baseVS = `#version 300 es
precision highp float;
in vec2 aPosition;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 texelSize;
void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const splatFS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
out vec4 fragColor;
void main () {
    vec2 p = vUv - point;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture(uTarget, vUv).xyz;
    fragColor = vec4(base + splat, 1.0);
}`;

const advectionFS = `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 texelSize;
uniform float dt;
uniform float dissipation;
out vec4 fragColor;
void main () {
    vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
    vec4 result = texture(uSource, coord);
    fragColor = vec4(result.rgb / (1.0 + dissipation * dt), 1.0);
}`;

const curlFS = `#version 300 es
precision mediump float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main () {
    float L = texture(uVelocity, vL).y;
    float R = texture(uVelocity, vR).y;
    float T = texture(uVelocity, vT).x;
    float B = texture(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    fragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
}`;

const vorticityFS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform float curl;
uniform float dt;
out vec4 fragColor;
void main () {
    float L = texture(uCurl, vL).x;
    float R = texture(uCurl, vR).x;
    float T = texture(uCurl, vT).x;
    float B = texture(uCurl, vB).x;
    float C = texture(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;
    vec2 vel = texture(uVelocity, vUv).xy;
    vel += force * dt;
    vel = min(max(vel, -1000.0), 1000.0);
    fragColor = vec4(vel, 0.0, 1.0);
}`;

const divergenceFS = `#version 300 es
precision mediump float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main () {
    float L = texture(uVelocity, vL).x;
    float R = texture(uVelocity, vR).x;
    float T = texture(uVelocity, vT).y;
    float B = texture(uVelocity, vB).y;
    vec2 C = texture(uVelocity, vUv).xy;
    if (vL.x < 0.0) L = -C.x;
    if (vR.x > 1.0) R = -C.x;
    if (vT.y > 1.0) T = -C.y;
    if (vB.y < 0.0) B = -C.y;
    float div = 0.5 * (R - L + T - B);
    fragColor = vec4(div, 0.0, 0.0, 1.0);
}`;

const pressureFS = `#version 300 es
precision mediump float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
out vec4 fragColor;
void main () {
    float L = texture(uPressure, vL).x;
    float R = texture(uPressure, vR).x;
    float T = texture(uPressure, vT).x;
    float B = texture(uPressure, vB).x;
    float div = texture(uDivergence, vUv).x;
    float pressure = (L + R + B + T - div) * 0.25;
    fragColor = vec4(pressure, 0.0, 0.0, 1.0);
}`;

const gradientSubFS = `#version 300 es
precision mediump float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
out vec4 fragColor;
void main () {
    float L = texture(uPressure, vL).x;
    float R = texture(uPressure, vR).x;
    float T = texture(uPressure, vT).x;
    float B = texture(uPressure, vB).x;
    vec2 vel = texture(uVelocity, vUv).xy;
    vel.xy -= vec2(R - L, T - B);
    fragColor = vec4(vel, 0.0, 1.0);
}`;

const displayFS = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
uniform sampler2D uTexture;
out vec4 fragColor;
void main () {
    vec3 c = texture(uTexture, vUv).rgb;
    vec3 lc = texture(uTexture, vL).rgb;
    vec3 rc = texture(uTexture, vR).rgb;
    vec3 tc = texture(uTexture, vT).rgb;
    vec3 bc = texture(uTexture, vB).rgb;

    float dx = length(rc) - length(lc);
    float dy = length(tc) - length(bc);

    vec3 n = normalize(vec3(dx, dy, length(vT - vB)));
    vec3 l = vec3(0.0, 0.0, 1.0);
    float diffuse = clamp(dot(n, l) + 0.7, 0.7, 1.0);
    c *= diffuse;

    float a = max(c.r, max(c.g, c.b));
    fragColor = vec4(c, a);
}`;

const clearFS = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uTexture;
uniform float value;
out vec4 fragColor;
void main () {
    fragColor = value * texture(uTexture, vUv);
}`;

// ── Config ─────────────────────────────────────────────────────

const SIM_RES = 128;
const DYE_RES = 1440;
const PRESSURE_ITERATIONS = 20;
const VELOCITY_DISSIPATION = 3;
const DENSITY_DISSIPATION = 0.5;
const PRESSURE = 0.1;
const CURL = 3;
const SPLAT_RADIUS = 0.2;
const SPLAT_FORCE = 6000;

// ── Component ──────────────────────────────────────────────────

export default function FluidCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false });
    if (!gl) return;

    gl.getExtension("EXT_color_buffer_float");
    gl.clearColor(0, 0, 0, 1);

    // Fullscreen quad
    const quadVerts = new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]);
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    // Programs
    const mkProg = (fs: string) => {
      const p = createProgram(gl, baseVS, fs);
      return { program: p, uniforms: getUniforms(gl, p) };
    };

    const splatProg = mkProg(splatFS);
    const advectionProg = mkProg(advectionFS);
    const curlProg = mkProg(curlFS);
    const vorticityProg = mkProg(vorticityFS);
    const divergenceProg = mkProg(divergenceFS);
    const pressureProg = mkProg(pressureFS);
    const gradSubProg = mkProg(gradientSubFS);
    const displayProg = mkProg(displayFS);
    const clearProg = mkProg(clearFS);

    // Bind attribute once
    const bindQuad = (prog: WebGLProgram) => {
      const loc = gl.getAttribLocation(prog, "aPosition");
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    };

    // Blit helper
    const blit = (target: FBO | null) => {
      if (target) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        gl.viewport(0, 0, target.width, target.height);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      }
      gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    };

    // Resize canvas
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
    };
    resize();

    // Create FBOs
    const simW = SIM_RES;
    const simH = Math.round(SIM_RES * (canvas.height / canvas.width));
    const dyeW = DYE_RES;
    const dyeH = Math.round(DYE_RES * (canvas.height / canvas.width));

    const halfFloat = gl.HALF_FLOAT;
    const rg = gl.RG16F;
    const rgba = gl.RGBA16F;
    const rgFmt = gl.RG;
    const rgbaFmt = gl.RGBA;
    const linear = gl.LINEAR;

    const velocity = createDoubleFBO(gl, simW, simH, rg, rgFmt, halfFloat, linear);
    const dye = createDoubleFBO(gl, dyeW, dyeH, rgba, rgbaFmt, halfFloat, linear);
    const divergenceFBO = createFBO(gl, simW, simH, gl.R16F, gl.RED, halfFloat, gl.NEAREST);
    const curlFBO = createFBO(gl, simW, simH, gl.R16F, gl.RED, halfFloat, gl.NEAREST);
    const pressure = createDoubleFBO(gl, simW, simH, gl.R16F, gl.RED, halfFloat, gl.NEAREST);

    // Pointer state
    const pointer = { x: 0, y: 0, dx: 0, dy: 0, moved: false };
    let lastTime = performance.now();

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pointer.dx = (x - pointer.x) * 10;
      pointer.dy = (y - pointer.y) * 10;
      pointer.x = x;
      pointer.y = y;
      pointer.moved = true;
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      pointer.dx = (x - pointer.x) * 10;
      pointer.dy = (y - pointer.y) * 10;
      pointer.x = x;
      pointer.y = y;
      pointer.moved = true;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });

    const resizeObs = new ResizeObserver(resize);
    resizeObs.observe(canvas);

    // ── Render loop ──────────────────────────────────────────

    let animId = 0;

    const step = () => {
      animId = requestAnimationFrame(step);

      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.016666);
      lastTime = now;

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // ── Splat ──
      if (pointer.moved) {
        pointer.moved = false;

        const px = pointer.x / w;
        const py = 1.0 - pointer.y / h;

        // Velocity splat
        gl.useProgram(splatProg.program);
        bindQuad(splatProg.program);
        gl.uniform1i(splatProg.uniforms.uTarget, velocity.read.attach(0));
        gl.uniform1f(splatProg.uniforms.aspectRatio, w / h);
        gl.uniform2f(splatProg.uniforms.point, px, py);
        gl.uniform3f(splatProg.uniforms.color, pointer.dx * SPLAT_FORCE, -pointer.dy * SPLAT_FORCE, 0);
        gl.uniform1f(splatProg.uniforms.radius, SPLAT_RADIUS / 100);
        blit(velocity.write);
        velocity.swap();

        // Dye splat
        const c = generateColor();
        gl.uniform1i(splatProg.uniforms.uTarget, dye.read.attach(0));
        gl.uniform3f(splatProg.uniforms.color, c[0], c[1], c[2]);
        blit(dye.write);
        dye.swap();
      }

      // ── Curl ──
      gl.useProgram(curlProg.program);
      bindQuad(curlProg.program);
      gl.uniform2f(curlProg.uniforms.texelSize, 1 / simW, 1 / simH);
      gl.uniform1i(curlProg.uniforms.uVelocity, velocity.read.attach(0));
      blit(curlFBO);

      // ── Vorticity confinement ──
      gl.useProgram(vorticityProg.program);
      bindQuad(vorticityProg.program);
      gl.uniform2f(vorticityProg.uniforms.texelSize, 1 / simW, 1 / simH);
      gl.uniform1i(vorticityProg.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(vorticityProg.uniforms.uCurl, curlFBO.attach(1));
      gl.uniform1f(vorticityProg.uniforms.curl, CURL);
      gl.uniform1f(vorticityProg.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      // ── Divergence ──
      gl.useProgram(divergenceProg.program);
      bindQuad(divergenceProg.program);
      gl.uniform2f(divergenceProg.uniforms.texelSize, 1 / simW, 1 / simH);
      gl.uniform1i(divergenceProg.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergenceFBO);

      // ── Clear pressure ──
      gl.useProgram(clearProg.program);
      bindQuad(clearProg.program);
      gl.uniform1i(clearProg.uniforms.uTexture, pressure.read.attach(0));
      gl.uniform1f(clearProg.uniforms.value, PRESSURE);
      blit(pressure.write);
      pressure.swap();

      // ── Pressure solve ──
      gl.useProgram(pressureProg.program);
      bindQuad(pressureProg.program);
      gl.uniform2f(pressureProg.uniforms.texelSize, 1 / simW, 1 / simH);
      gl.uniform1i(pressureProg.uniforms.uDivergence, divergenceFBO.attach(0));
      for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
        gl.uniform1i(pressureProg.uniforms.uPressure, pressure.read.attach(1));
        blit(pressure.write);
        pressure.swap();
      }

      // ── Gradient subtract ──
      gl.useProgram(gradSubProg.program);
      bindQuad(gradSubProg.program);
      gl.uniform2f(gradSubProg.uniforms.texelSize, 1 / simW, 1 / simH);
      gl.uniform1i(gradSubProg.uniforms.uPressure, pressure.read.attach(0));
      gl.uniform1i(gradSubProg.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      // ── Advect velocity ──
      gl.useProgram(advectionProg.program);
      bindQuad(advectionProg.program);
      gl.uniform2f(advectionProg.uniforms.texelSize, 1 / simW, 1 / simH);
      gl.uniform1f(advectionProg.uniforms.dt, dt);
      gl.uniform1i(advectionProg.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProg.uniforms.uSource, velocity.read.attach(0));
      gl.uniform1f(advectionProg.uniforms.dissipation, VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      // ── Advect dye ──
      gl.uniform2f(advectionProg.uniforms.texelSize, 1 / dyeW, 1 / dyeH);
      gl.uniform1i(advectionProg.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProg.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(advectionProg.uniforms.dissipation, DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();

      // ── Display ──
      gl.useProgram(displayProg.program);
      bindQuad(displayProg.program);
      gl.uniform2f(displayProg.uniforms.texelSize, 1 / dyeW, 1 / dyeH);
      gl.uniform1i(displayProg.uniforms.uTexture, dye.read.attach(0));
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      blit(null);
      gl.disable(gl.BLEND);
    };

    animId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      resizeObs.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="fluid"
      className="pointer-events-none fixed inset-0 z-[1] h-screen w-screen"
    />
  );
}
