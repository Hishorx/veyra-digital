/*
 * Veyra Digital — liquid-metal V sculpture
 * A single raymarched fragment shader (no libraries). Two chrome blades form
 * the split-V symbol; a "liquid" amount melts them together and back apart.
 *
 *   const s = createSculpture(canvas, { mode: 'hero' | 'resolve' })
 *   s.setPointer(x, y)   // -1..1
 *   s.setProgress(p)     // 0..1 (resolve mode: 0 = molten, 1 = crisp symbol)
 *   s.start() / s.stop() / s.destroy()
 *
 * Returns null when WebGL is unavailable so callers can keep the fallback.
 */
(function () {
  'use strict';

  var VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uPtr;uniform float uLiquid;',
    'uniform float uEmerge;uniform vec2 uShift;uniform float uScale;uniform float uSpin;uniform float uCalm;',
    'const vec3 BLUE=vec3(0.16,0.45,1.0);',
    'mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}',
    'float sdBox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}',
    'float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}',
    // A blade: box aligned to an axis in the xy plane, bottom end cut at an angle.
    'float blade(vec3 p,vec2 c,vec2 ax,float hl,float ht,float hd){',
    '  vec2 d=p.xy-c;vec2 pe=vec2(ax.y,-ax.x);',
    '  vec3 q=vec3(dot(d,pe),dot(d,ax),p.z);',
    '  float b=sdBox(q,vec3(ht,hl,hd),.035);',
    '  float cut=dot(q.xy-vec2(0.,-hl+ht*.9),normalize(vec2(.55,-1.)));',
    '  return max(b,cut);}',
    'float map(vec3 p){',
    '  float t=uTime;float L=uLiquid;',
    // gentle twist + breathing that grows when liquid
    '  p.xz*=rot(p.y*(.10*(1.-uCalm)+.28*L)*sin(t*.23));',
    '  vec3 w=p;',
    '  w+= (.035*(1.-uCalm)+.11*L)*vec3(sin(p.y*3.1+t*.7),sin(p.z*2.7+t*.53),sin(p.x*2.9-t*.61));',
    '  float a=blade(w,vec2(-.53,.10),normalize(vec2(-19.,46.)),1.245,.31,.17);',
    '  float b=blade(w,vec2(.72,.075),normalize(vec2(18.8,45.)),1.22,.15,.12);',
    '  float d=smin(a,b,.02+.55*L);',
    // liquid swell: ripples run along the surface
    '  d-=L*.05*sin(length(p.xy)*7.-t*1.3)*smoothstep(1.8,.2,length(p));',
    '  d+= (1.-uEmerge)*1.15;',
    '  return d;}',
    'vec3 nrm(vec3 p){vec2 e=vec2(.0015,-.0015);',
    '  return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}',
    // Procedural studio: softboxes, a cool floor bounce and an electric-blue key from behind.
    'vec3 env(vec3 r){',
    '  float y=r.y;float az=atan(r.x,-r.z);',
    '  vec3 c=vec3(.008,.009,.012)+vec3(.035,.038,.045)*smoothstep(-.1,.7,y);',
    '  c+=vec3(1.7)*smoothstep(.5,.6,y)*smoothstep(1.,.8,y)*smoothstep(1.2,.5,abs(az-2.9));',
    '  c+=vec3(1.5)*exp(-pow((az-2.55)*9.,2.))*smoothstep(-.35,.1,y)*smoothstep(.85,.35,y);',
    '  c+=vec3(.55)*exp(-pow((az+2.35)*3.5,2.))*smoothstep(-.2,.4,y);',
    '  c+=vec3(.9)*exp(-pow((az+2.95)*14.,2.))*smoothstep(.05,.6,y);',
    '  c+=vec3(.45)*exp(-pow(y*22.,2.));',
    '  c+=vec3(.045,.047,.05)*smoothstep(0.,-.5,y);',
    '  c+=BLUE*2.4*pow(max(dot(r,normalize(vec3(.55,.3,-1.))),0.),5.);',
    '  c+=BLUE*1.2*pow(max(dot(r,normalize(vec3(-.9,-.2,-.5))),0.),8.);',
    '  return c;}',
    'vec3 aces(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.,1.);}',
    'void main(){',
    '  vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    '  uv=(uv-uShift)/uScale;',
    '  vec3 ro=vec3(0.,0.,6.6);vec3 rd=normalize(vec3(uv,-1.75));',
    '  float yaw=uPtr.x*.38+uSpin+sin(uTime*.17)*.22*(1.-uCalm);float pit=-uPtr.y*.22+sin(uTime*.13)*.06*(1.-uCalm);',
    '  mat2 ry=rot(yaw),rx=rot(pit);',
    '  ro.xz*=ry;rd.xz*=ry;ro.yz*=rx;rd.yz*=rx;',
    // bounding sphere — skip pixels that cannot hit
    '  float bb=dot(ro,rd);float cc=dot(ro,ro)-2.6*2.6;float h=bb*bb-cc;',
    '  vec3 col=vec3(0.);float alpha=0.;float glow=0.;',
    '  if(h>0.){',
    '    float t=max(-bb-sqrt(h),0.);float tEnd=-bb+sqrt(h);float md=1e3;bool hit=false;',
    '    for(int i=0;i<84;i++){vec3 p=ro+rd*t;float d=map(p);md=min(md,d);',
    '      if(d<.0012){hit=true;break;}t+=d*.82;if(t>tEnd)break;}',
    '    glow=exp(-md*11.)*.5*smoothstep(0.,2.5,h);',
    '    if(hit){vec3 p=ro+rd*t;vec3 n=nrm(p);vec3 r=reflect(rd,n);',
    '      float fr=pow(1.-max(dot(-rd,n),0.),4.);',
    '      vec3 base=vec3(.82,.85,.9);',
    '      col=env(r)*mix(base,vec3(1.),fr);',
    '      float rim=pow(1.-max(dot(-rd,n),0.),2.5);',
    '      col+=BLUE*rim*(.25+1.1*pow(max(dot(n,normalize(vec3(.6,.3,-.8))),0.),2.));',
    '      col*=.75+.25*smoothstep(-1.6,1.2,p.y);',
    '      alpha=1.;}',
    '  }',
    '  col=aces(col*1.05);',
    '  vec3 g=BLUE*glow*.22*uEmerge;',
    '  col=col*alpha+g*(1.-alpha);',
    '  alpha=max(alpha,dot(g,vec3(.3,.5,.2)));',
    '  col=pow(col,vec3(1./2.2));',
    '  gl_FragColor=vec4(col,alpha);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      var log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error('Shader compile failed: ' + log);
    }
    return s;
  }

  function createSculpture(canvas, opts) {
    opts = opts || {};
    var gl;
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' });
    } catch (e) { gl = null; }
    if (!gl) return null;

    var prog;
    try {
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    } catch (err) {
      if (window.console) console.warn('[Veyra] WebGL sculpture disabled:', err.message);
      return null;
    }

    gl.useProgram(prog);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uRes', 'uTime', 'uPtr', 'uLiquid', 'uEmerge', 'uShift', 'uScale', 'uSpin', 'uCalm'].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });

    var mode = opts.mode || 'hero';
    var state = {
      running: false, raf: 0, t0: performance.now(), last: 0,
      ptr: [0, 0], ptrS: [0, 0], progress: 0, progS: 0,
      emerge: opts.emerge === false ? 1 : 0,
      quality: Math.min(window.devicePixelRatio || 1, opts.maxDpr || 1.25),
      frameAvg: 16, frames: 0, lost: false
    };
    var shift = opts.shift || function () { return [0, 0]; };
    var scale = opts.scale || function () { return 1; };

    function resize() {
      var w = canvas.clientWidth, h = canvas.clientHeight;
      var q = state.quality;
      var W = Math.max(1, Math.round(w * q)), H = Math.max(1, Math.round(h * q));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      gl.viewport(0, 0, W, H);
    }

    function frame(now) {
      if (!state.running) return;
      state.raf = requestAnimationFrame(frame);
      var dt = Math.min(64, now - (state.last || now));
      state.last = now;

      // Adaptive resolution: step down when frames get slow.
      state.frameAvg = state.frameAvg * 0.92 + dt * 0.08;
      if (++state.frames > 45) {
        if (state.frameAvg > 24 && state.quality > 0.55) { state.quality = Math.max(0.55, state.quality * 0.82); state.frames = 0; }
        else if (state.frameAvg < 15 && state.quality < (opts.maxDpr || 1.25)) { state.quality = Math.min(opts.maxDpr || 1.25, state.quality * 1.06); state.frames = 0; }
      }
      resize();

      var k = 1 - Math.pow(0.001, dt / 1000 * 1.6);
      state.ptrS[0] += (state.ptr[0] - state.ptrS[0]) * k;
      state.ptrS[1] += (state.ptr[1] - state.ptrS[1]) * k;
      state.progS += (state.progress - state.progS) * Math.min(1, k * 1.6);
      if (state.emerge < 1) { if (!state.eStart) state.eStart = now; state.emerge = Math.min(1, (now - state.eStart) / 2000); }

      var t = (now - state.t0) / 1000;
      var e = 1 - Math.pow(1 - state.emerge, 3);
      var liquid, spin;
      if (mode === 'resolve') {
        liquid = 1 - smooth(state.progS);
        spin = (1 - smooth(state.progS)) * 1.6;
      } else {
        liquid = 0.16 + 0.22 * (0.5 + 0.5 * Math.sin(t * 0.21)) + (1 - e) * 0.8;
        spin = (1 - e) * -1.4;
      }
      var sh = shift();
      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, t);
      gl.uniform2f(U.uPtr, state.ptrS[0], state.ptrS[1]);
      gl.uniform1f(U.uLiquid, liquid);
      gl.uniform1f(U.uEmerge, mode === 'resolve' ? 1 : e);
      gl.uniform2f(U.uShift, sh[0], sh[1]);
      gl.uniform1f(U.uScale, scale());
      gl.uniform1f(U.uSpin, spin);
      gl.uniform1f(U.uCalm, mode === 'resolve' ? smooth(state.progS) : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }

    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault(); state.lost = true; api.stop();
      if (opts.onLost) opts.onLost();
    });

    var api = {
      start: function () {
        if (state.running || state.lost) return;
        state.running = true; state.last = 0;
        state.raf = requestAnimationFrame(frame);
      },
      stop: function () { state.running = false; cancelAnimationFrame(state.raf); },
      setPointer: function (x, y) { state.ptr[0] = x; state.ptr[1] = y; },
      setProgress: function (p) { state.progress = p; },
      renderOnce: function (t) { state.emerge = 1; state.running = true; frame(performance.now()); state.running = false; cancelAnimationFrame(state.raf); },
      destroy: function () { api.stop(); var ext = gl.getExtension('WEBGL_lose_context'); if (ext) ext.loseContext(); }
    };
    return api;
  }

  window.VeyraSculpture = { create: createSculpture };
})();
