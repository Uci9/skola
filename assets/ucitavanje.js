(function () {
  const zastor = document.getElementById('ucitavanje');
  if (!zastor) return;

  const koren = document.documentElement;
  koren.classList.add('ucitava');

  let sakriven = false;
  let raf = 0;
  let posmatrac = null;

  function sakrij() {
    if (sakriven) return;
    sakriven = true;
    if (raf) cancelAnimationFrame(raf);
    if (posmatrac) posmatrac.disconnect();
    zastor.classList.add('gotovo');
    koren.classList.remove('ucitava');
    setTimeout(() => { zastor.style.display = 'none'; }, 700);
  }

  const smireno = matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (document.readyState === 'complete') setTimeout(sakrij, 500);
  else window.addEventListener('load', () => setTimeout(sakrij, 500));
  setTimeout(sakrij, 8000);

  if (smireno) return;

  const platno = document.getElementById('njutn');
  if (!platno) return;

  const gl = platno.getContext('webgl', {
    antialias: true, alpha: true, premultipliedAlpha: true, depth: true
  });
  if (!gl) return;

  const TAU = Math.PI * 2;
  const DPR_CAP = 2;
  const FOV = (45 * Math.PI) / 180;
  const NEAR = 0.1;
  const FAR = 200;

  const COUNT = 5;
  const BALL_R = 1;
  const BALL_SEG = 32;
  const SPACING = 2;
  const DROP = 4;
  const PIVOT_Y = 3;
  const GROUP_SCALE = 0.55;
  const FREQ = 4;
  const PERIOD = TAU / FREQ;
  const DISTANCE = 8;

  const OSNOVA = [0.09, 0.34, 0.74];
  const ODSJAJ = [0.247, 0.808, 0.706];

  function m4() {
    const o = new Float32Array(16);
    o[0] = o[5] = o[10] = o[15] = 1;
    return o;
  }

  function m4Ident(o) {
    o.fill(0);
    o[0] = o[5] = o[10] = o[15] = 1;
    return o;
  }

  function m4Mul(a, b, out) {
    for (let c = 0; c < 4; c++) {
      const b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
      out[c * 4]     = a[0] * b0 + a[4] * b1 + a[8]  * b2 + a[12] * b3;
      out[c * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9]  * b2 + a[13] * b3;
      out[c * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
      out[c * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
    }
    return out;
  }

  function trans(m, x, y, z) {
    m[12] = m[0] * x + m[4] * y + m[8]  * z + m[12];
    m[13] = m[1] * x + m[5] * y + m[9]  * z + m[13];
    m[14] = m[2] * x + m[6] * y + m[10] * z + m[14];
    m[15] = m[3] * x + m[7] * y + m[11] * z + m[15];
  }

  function scaleU(m, s) {
    for (let i = 0; i < 12; i++) m[i] *= s;
  }

  function persp(out, fovy, aspect, near, far) {
    const f = 1 / Math.tan(fovy / 2);
    out.fill(0);
    out[0] = f / aspect;
    out[5] = f;
    out[10] = (far + near) / (near - far);
    out[11] = -1;
    out[14] = (2 * far * near) / (near - far);
    return out;
  }

  function nm3(m, out) {
    const a = m[0], b = m[1], c = m[2];
    const d = m[4], e = m[5], f = m[6];
    const g = m[8], h = m[9], i = m[10];
    const C11 = e * i - h * f;
    const C12 = -(b * i - h * c);
    const C13 = b * f - e * c;
    const det = a * C11 + d * C12 + g * C13;
    if (!det) {
      out[0] = a; out[1] = b; out[2] = c;
      out[3] = d; out[4] = e; out[5] = f;
      out[6] = g; out[7] = h; out[8] = i;
      return;
    }
    const s = 1 / det;
    out[0] = C11 * s;
    out[1] = -(d * i - g * f) * s;
    out[2] = (d * h - g * e) * s;
    out[3] = C12 * s;
    out[4] = (a * i - g * c) * s;
    out[5] = -(a * h - g * b) * s;
    out[6] = C13 * s;
    out[7] = -(a * f - d * c) * s;
    out[8] = (a * e - d * b) * s;
  }

  function sferaGeo(radius, wSeg, hSeg) {
    const pos = [], nrm = [], idx = [], grid = [];
    let n = 0;
    for (let iy = 0; iy <= hSeg; iy++) {
      const row = [];
      const v = iy / hSeg;
      for (let ix = 0; ix <= wSeg; ix++) {
        const u = ix / wSeg;
        const x = -radius * Math.cos(u * TAU) * Math.sin(v * Math.PI);
        const y = radius * Math.cos(v * Math.PI);
        const z = radius * Math.sin(u * TAU) * Math.sin(v * Math.PI);
        pos.push(x, y, z);
        nrm.push(x / radius, y / radius, z / radius);
        row.push(n++);
      }
      grid.push(row);
    }
    for (let iy = 0; iy < hSeg; iy++) {
      for (let ix = 0; ix < wSeg; ix++) {
        const a = grid[iy][ix + 1], b = grid[iy][ix];
        const c = grid[iy + 1][ix], d = grid[iy + 1][ix + 1];
        if (iy !== 0) idx.push(a, b, d);
        if (iy !== hSeg - 1) idx.push(b, c, d);
      }
    }
    return {
      pos: new Float32Array(pos),
      nrm: new Float32Array(nrm),
      idx: new Uint16Array(idx)
    };
  }

  const VERT = [
    'precision highp float;',
    'attribute vec3 aPos;',
    'attribute vec3 aNrm;',
    'uniform mat4 uMVP;',
    'uniform mat3 uNM;',
    'varying vec3 vN;',
    'void main() {',
    '  vN = uNM * aNrm;',
    '  gl_Position = uMVP * vec4(aPos, 1.0);',
    '}'
  ].join('\n');

  const FRAG = [
    'precision highp float;',
    'varying vec3 vN;',
    'uniform vec3 uBase;',
    'uniform vec3 uAcc;',
    'const vec3 KEY  = vec3(-0.4364, 0.4601, 0.7733);',
    'const vec3 FILL = vec3( 0.7831, 0.1309, 0.6080);',
    'void main() {',
    '  vec3 n = normalize(vN);',
    '  if (!gl_FrontFacing) n = -n;',
    '  float k = max(dot(n, KEY), 0.0);',
    '  float f = max(dot(n, FILL), 0.0);',
    '  float graze = 1.0 - clamp(abs(n.z), 0.0, 1.0);',
    '  vec3 c = uBase * (0.08 + 0.62 * pow(k, 2.0));',
    '  c += uAcc * 0.80 * pow(k, 9.0);',
    '  c += uAcc * 0.35 * pow(f, 6.0);',
    '  c += uAcc * 0.32 * pow(graze, 3.0) * (0.40 + 0.60 * max(n.y, 0.0));',
    '  gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  function prevedi(tip, izvor) {
    const sh = gl.createShader(tip);
    gl.shaderSource(sh, izvor);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  const vs = prevedi(gl.VERTEX_SHADER, VERT);
  const fs = prevedi(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const aPos = gl.getAttribLocation(prog, 'aPos');
  const aNrm = gl.getAttribLocation(prog, 'aNrm');
  gl.enableVertexAttribArray(aPos);
  gl.enableVertexAttribArray(aNrm);

  const uMVP = gl.getUniformLocation(prog, 'uMVP');
  const uNM = gl.getUniformLocation(prog, 'uNM');
  const uBase = gl.getUniformLocation(prog, 'uBase');
  const uAcc = gl.getUniformLocation(prog, 'uAcc');
  if (!uMVP || !uNM || !uBase || !uAcc) return;

  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clearColor(0, 0, 0, 0);

  const g = sferaGeo(BALL_R, BALL_SEG, BALL_SEG);
  const bPos = gl.createBuffer();
  const bNrm = gl.createBuffer();
  const bIdx = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
  gl.bufferData(gl.ARRAY_BUFFER, g.pos, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bNrm);
  gl.bufferData(gl.ARRAY_BUFFER, g.nrm, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.idx, gl.STATIC_DRAW);
  const brojIndeksa = g.idx.length;

  let dpr = 1;
  function razmjeri() {
    dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
    const w = Math.max(1, Math.round((platno.clientWidth || 1) * dpr));
    const h = Math.max(1, Math.round((platno.clientHeight || 1) * dpr));
    if (platno.width !== w || platno.height !== h) {
      platno.width = w;
      platno.height = h;
    }
    gl.viewport(0, 0, w, h);
  }
  razmjeri();
  posmatrac = new ResizeObserver(razmjeri);
  posmatrac.observe(platno);

  const proj = m4(), view = m4(), pv = m4(), model = m4(), mvp = m4();
  const nrmMat = new Float32Array(9);
  let prosli = performance.now();
  let sat = 0;

  function kadar(sada) {
    raf = requestAnimationFrame(kadar);
    const dt = Math.min(0.05, Math.max(0, (sada - prosli) / 1000));
    prosli = sada;

    sat += dt;
    if (sat > PERIOD) sat -= PERIOD;

    const w = platno.width, h = platno.height;
    const aspect = w / h;
    persp(proj, FOV, aspect, NEAR, FAR);
    const daljina = DISTANCE / Math.min(1, aspect);
    m4Ident(view);
    trans(view, 0, 0, -daljina);
    m4Mul(proj, view, pv);

    gl.uniform3fv(uBase, OSNOVA);
    gl.uniform3fv(uAcc, ODSJAJ);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const ang = Math.sin(sat * FREQ);
    const a1 = Math.min(0, ang * 0.5);
    const a5 = Math.max(0, ang * 0.5);
    const uglovi = [a1, (ang + a1) * 0.05, a5 * 0.05, (ang + a5) * 0.05, a5];

    gl.bindBuffer(gl.ARRAY_BUFFER, bPos);
    gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, bNrm);
    gl.vertexAttribPointer(aNrm, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, bIdx);

    for (let i = 0; i < COUNT; i++) {
      const bx = (i - (COUNT - 1) / 2) * SPACING;
      const by = -DROP;
      const c = Math.cos(uglovi[i]), s = Math.sin(uglovi[i]);
      m4Ident(model);
      scaleU(model, GROUP_SCALE);
      trans(model, bx * c - by * s, bx * s + by * c + PIVOT_Y, 0);
      m4Mul(pv, model, mvp);
      nm3(model, nrmMat);
      gl.uniformMatrix4fv(uMVP, false, mvp);
      gl.uniformMatrix3fv(uNM, false, nrmMat);
      gl.drawElements(gl.TRIANGLES, brojIndeksa, gl.UNSIGNED_SHORT, 0);
    }
  }

  raf = requestAnimationFrame(kadar);
})();
