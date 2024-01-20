(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const i of a)if(i.type==="childList")for(const c of i.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&n(c)}).observe(document,{childList:!0,subtree:!0});function t(a){const i={};return a.integrity&&(i.integrity=a.integrity),a.referrerPolicy&&(i.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?i.credentials="include":a.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function n(a){if(a.ep)return;a.ep=!0;const i=t(a);fetch(a.href,i)}})();var R=1e-6,F=typeof Float32Array<"u"?Float32Array:Array;Math.hypot||(Math.hypot=function(){for(var e=0,r=arguments.length;r--;)e+=arguments[r]*arguments[r];return Math.sqrt(e)});function E(){var e=new F(16);return F!=Float32Array&&(e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0),e[0]=1,e[5]=1,e[10]=1,e[15]=1,e}function W(e){return e[0]=1,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=1,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[10]=1,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,e}function L(e,r){var t=r[0],n=r[1],a=r[2],i=r[3],c=r[4],l=r[5],v=r[6],g=r[7],d=r[8],p=r[9],f=r[10],o=r[11],u=r[12],h=r[13],s=r[14],O=r[15],P=t*l-n*c,b=t*v-a*c,m=t*g-i*c,x=n*v-a*l,S=n*g-i*l,I=a*g-i*v,T=d*h-p*u,A=d*s-f*u,B=d*O-o*u,z=p*s-f*h,U=p*O-o*h,G=f*O-o*s,y=P*G-b*U+m*z+x*B-S*A+I*T;return y?(y=1/y,e[0]=(l*G-v*U+g*z)*y,e[1]=(a*U-n*G-i*z)*y,e[2]=(h*I-s*S+O*x)*y,e[3]=(f*S-p*I-o*x)*y,e[4]=(v*B-c*G-g*A)*y,e[5]=(t*G-a*B+i*A)*y,e[6]=(s*m-u*I-O*b)*y,e[7]=(d*I-f*m+o*b)*y,e[8]=(c*U-l*B+g*T)*y,e[9]=(n*B-t*U-i*T)*y,e[10]=(u*S-h*m+O*P)*y,e[11]=(p*m-d*S-o*P)*y,e[12]=(l*A-c*z-v*T)*y,e[13]=(t*z-n*A+a*T)*y,e[14]=(h*b-u*x-s*P)*y,e[15]=(d*x-p*b+f*P)*y,e):null}function _(e,r,t){var n=r[0],a=r[1],i=r[2],c=r[3],l=r[4],v=r[5],g=r[6],d=r[7],p=r[8],f=r[9],o=r[10],u=r[11],h=r[12],s=r[13],O=r[14],P=r[15],b=t[0],m=t[1],x=t[2],S=t[3];return e[0]=b*n+m*l+x*p+S*h,e[1]=b*a+m*v+x*f+S*s,e[2]=b*i+m*g+x*o+S*O,e[3]=b*c+m*d+x*u+S*P,b=t[4],m=t[5],x=t[6],S=t[7],e[4]=b*n+m*l+x*p+S*h,e[5]=b*a+m*v+x*f+S*s,e[6]=b*i+m*g+x*o+S*O,e[7]=b*c+m*d+x*u+S*P,b=t[8],m=t[9],x=t[10],S=t[11],e[8]=b*n+m*l+x*p+S*h,e[9]=b*a+m*v+x*f+S*s,e[10]=b*i+m*g+x*o+S*O,e[11]=b*c+m*d+x*u+S*P,b=t[12],m=t[13],x=t[14],S=t[15],e[12]=b*n+m*l+x*p+S*h,e[13]=b*a+m*v+x*f+S*s,e[14]=b*i+m*g+x*o+S*O,e[15]=b*c+m*d+x*u+S*P,e}function Y(e,r,t){var n=r[0],a=r[1],i=r[2],c=r[3],l=n+n,v=a+a,g=i+i,d=n*l,p=n*v,f=n*g,o=a*v,u=a*g,h=i*g,s=c*l,O=c*v,P=c*g;return e[0]=1-(o+h),e[1]=p+P,e[2]=f-O,e[3]=0,e[4]=p-P,e[5]=1-(d+h),e[6]=u+s,e[7]=0,e[8]=f+O,e[9]=u-s,e[10]=1-(d+o),e[11]=0,e[12]=t[0],e[13]=t[1],e[14]=t[2],e[15]=1,e}function j(e,r){return e[0]=r[12],e[1]=r[13],e[2]=r[14],e}function N(e,r){var t=r[0],n=r[1],a=r[2],i=r[4],c=r[5],l=r[6],v=r[8],g=r[9],d=r[10];return e[0]=Math.hypot(t,n,a),e[1]=Math.hypot(i,c,l),e[2]=Math.hypot(v,g,d),e}function X(e,r){var t=new F(3);N(t,r);var n=1/t[0],a=1/t[1],i=1/t[2],c=r[0]*n,l=r[1]*a,v=r[2]*i,g=r[4]*n,d=r[5]*a,p=r[6]*i,f=r[8]*n,o=r[9]*a,u=r[10]*i,h=c+d+u,s=0;return h>0?(s=Math.sqrt(h+1)*2,e[3]=.25*s,e[0]=(p-o)/s,e[1]=(f-v)/s,e[2]=(l-g)/s):c>d&&c>u?(s=Math.sqrt(1+c-d-u)*2,e[3]=(p-o)/s,e[0]=.25*s,e[1]=(l+g)/s,e[2]=(f+v)/s):d>u?(s=Math.sqrt(1+d-c-u)*2,e[3]=(f-v)/s,e[0]=(l+g)/s,e[1]=.25*s,e[2]=(p+o)/s):(s=Math.sqrt(1+u-c-d)*2,e[3]=(l-g)/s,e[0]=(f+v)/s,e[1]=(p+o)/s,e[2]=.25*s),e}function $(e,r,t,n,a){var i=1/Math.tan(r/2),c;return e[0]=i/t,e[1]=0,e[2]=0,e[3]=0,e[4]=0,e[5]=i,e[6]=0,e[7]=0,e[8]=0,e[9]=0,e[11]=-1,e[12]=0,e[13]=0,e[15]=0,a!=null&&a!==1/0?(c=1/(n-a),e[10]=(a+n)*c,e[14]=2*a*n*c):(e[10]=-1,e[14]=-2*n),e}var q=$;function k(e,r,t,n){var a,i,c,l,v,g,d,p,f,o,u=r[0],h=r[1],s=r[2],O=n[0],P=n[1],b=n[2],m=t[0],x=t[1],S=t[2];return Math.abs(u-m)<R&&Math.abs(h-x)<R&&Math.abs(s-S)<R?W(e):(d=u-m,p=h-x,f=s-S,o=1/Math.hypot(d,p,f),d*=o,p*=o,f*=o,a=P*f-b*p,i=b*d-O*f,c=O*p-P*d,o=Math.hypot(a,i,c),o?(o=1/o,a*=o,i*=o,c*=o):(a=0,i=0,c=0),l=p*c-f*i,v=f*a-d*c,g=d*i-p*a,o=Math.hypot(l,v,g),o?(o=1/o,l*=o,v*=o,g*=o):(l=0,v=0,g=0),e[0]=a,e[1]=l,e[2]=d,e[3]=0,e[4]=i,e[5]=v,e[6]=p,e[7]=0,e[8]=c,e[9]=g,e[10]=f,e[11]=0,e[12]=-(a*u+i*h+c*s),e[13]=-(l*u+v*h+g*s),e[14]=-(d*u+p*h+f*s),e[15]=1,e)}function K(e,r,t,n){var a=r[0],i=r[1],c=r[2],l=n[0],v=n[1],g=n[2],d=a-t[0],p=i-t[1],f=c-t[2],o=d*d+p*p+f*f;o>0&&(o=1/Math.sqrt(o),d*=o,p*=o,f*=o);var u=v*f-g*p,h=g*d-l*f,s=l*p-v*d;return o=u*u+h*h+s*s,o>0&&(o=1/Math.sqrt(o),u*=o,h*=o,s*=o),e[0]=u,e[1]=h,e[2]=s,e[3]=0,e[4]=p*s-f*h,e[5]=f*u-d*s,e[6]=d*h-p*u,e[7]=0,e[8]=d,e[9]=p,e[10]=f,e[11]=0,e[12]=a,e[13]=i,e[14]=c,e[15]=1,e}function D(){var e=new F(3);return F!=Float32Array&&(e[0]=0,e[1]=0,e[2]=0),e}function Q(e,r,t,n){return e[0]=r[0]+t[0]*n,e[1]=r[1]+t[1]*n,e[2]=r[2]+t[2]*n,e}function H(e,r,t){var n=t[0],a=t[1],i=t[2],c=t[3],l=r[0],v=r[1],g=r[2],d=a*g-i*v,p=i*l-n*g,f=n*v-a*l,o=a*f-i*p,u=i*d-n*f,h=n*p-a*d,s=c*2;return d*=s,p*=s,f*=s,o*=2,u*=2,h*=2,e[0]=l+d+o,e[1]=v+p+u,e[2]=g+f+h,e}(function(){var e=D();return function(r,t,n,a,i,c){var l,v;for(t||(t=3),n||(n=0),a?v=Math.min(a*t+n,r.length):v=r.length,l=n;l<v;l+=t)e[0]=r[l],e[1]=r[l+1],e[2]=r[l+2],i(e,e,c),r[l]=e[0],r[l+1]=e[1],r[l+2]=e[2];return r}})();function J(e){return e&&e.__esModule&&Object.prototype.hasOwnProperty.call(e,"default")?e.default:e}var Z=function(r){re(r);var t=ee(r);return r.on=t.on,r.off=t.off,r.fire=t.fire,r};function ee(e){var r=Object.create(null);return{on:function(t,n,a){if(typeof n!="function")throw new Error("callback is expected to be a function");var i=r[t];return i||(i=r[t]=[]),i.push({callback:n,ctx:a}),e},off:function(t,n){var a=typeof t>"u";if(a)return r=Object.create(null),e;if(r[t]){var i=typeof n!="function";if(i)delete r[t];else for(var c=r[t],l=0;l<c.length;++l)c[l].callback===n&&c.splice(l,1)}return e},fire:function(t){var n=r[t];if(!n)return e;var a;arguments.length>1&&(a=Array.prototype.splice.call(arguments,1));for(var i=0;i<n.length;++i){var c=n[i];c.callback.apply(c.ctx,a)}return e}}}function re(e){if(!e)throw new Error("Eventify cannot use falsy object as events subject");for(var r=["on","fire","off"],t=0;t<r.length;++t)if(e.hasOwnProperty(r[t]))throw new Error("Subject cannot be eventified, since it already has property '"+r[t]+"'")}const te=J(Z);class ie{constructor(r){te(this),this.matrix=E(),this.cameraWorld=L(E(),this.matrix),this.position=[0,-2,2],this.orientation=[0,0,0,1],this.center=[0,0,0],this.targetDistance=5,this.projection=E();const t=r.width/r.height;q(this.projection,r.fov,t,.1,1e3),this.inverseProjection=E(),this.modelViewProjection=E(),k(this.matrix,this.position,this.center,[0,1,0]),L(this.cameraWorld,this.matrix),this.deconstructPositionRotation(),this.update()}lookAt(r,t,n){return K(this.cameraWorld,r,t,n),L(this.matrix,this.cameraWorld),this.deconstructPositionRotation(),this}update(){return Y(this.cameraWorld,this.orientation,this.position),L(this.matrix,this.cameraWorld),_(this.modelViewProjection,this.projection,this.matrix),this.updated=!0,this.fire("updated",this),this}updateSize(r,t,n){const a=r/t;q(this.projection,n,a,.1,1e3),this.update()}deconstructPositionRotation(){j(this.position,this.cameraWorld),X(this.orientation,this.cameraWorld)}translateOnAxis(r,t){let n=H(spareVec3,r,this.orientation);return Q(this.position,this.position,n,t),this}translateX(r){return this.translateOnAxis(xAxis,r)}translateY(r){return this.translateOnAxis(yAxis,r)}translateZ(r){return this.translateOnAxis(zAxis,r)}}function ae(e,r,t){const n={width:r,height:r,fov:45},a=new ie(n),{device:i,canvasFormat:c,context:l}=e,v=new Float32Array([r,r]),g=i.createBuffer({label:"Grid Uniforms",size:v.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});i.queue.writeBuffer(g,0,v);const d=a.modelViewProjection,p=i.createBuffer({label:"mvp matrix",size:d.byteLength,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});i.queue.writeBuffer(p,0,a.modelViewProjection);const f=6,o=new Float32Array(r*r*f),u=[i.createBuffer({label:"Particle State A",size:o.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST}),i.createBuffer({label:"Particle State B",size:o.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST})];for(let y=0;y<o.length/f;++y){o[y*f]=0;let w=y%r,M=Math.floor(y/r);o[y*f+1]=w,o[y*f+2]=M}i.queue.writeBuffer(u[0],0,o),i.queue.writeBuffer(u[1],0,o);const h=new Float32Array([-.8,-.8,.8,-.8,.8,.8,-.8,-.8,.8,.8,-.8,.8]),s=i.createBuffer({label:"Cell vertices",size:h.byteLength,usage:GPUBufferUsage.VERTEX|GPUBufferUsage.COPY_DST});i.queue.writeBuffer(s,0,h);const O={arrayStride:8,attributes:[{format:"float32x2",offset:0,shaderLocation:0}]},P=new Float32Array(t.length*6);for(let y=0;y<t.length;y++){const w=t[y],M=y*6;P[M+0]=w.mass,P[M+1]=w.position.x,P[M+2]=w.position.y,P[M+3]=w.color.r,P[M+4]=w.color.g,P[M+5]=w.color.b}const b=i.createBuffer({size:P.byteLength,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST});i.queue.writeBuffer(b,0,P);const m=i.createShaderModule({label:"Particle render shader",code:`
struct VertexInput {
  @location(0) pos: vec2f,
  @builtin(instance_index) instance: u32,
};

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) color: vec4f,
};

struct FragInput {
  @location(0) color: vec4f,
};

@group(0) @binding(0) var<uniform> gridSize: vec2f;
@group(0) @binding(1) var<storage> particleState: array<f32>;
@group(0) @binding(3) var<storage, read> bodies: array<f32>;
@group(0) @binding(4) var<uniform> modelViewProjection: mat4x4<f32>;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  let i = input.instance * ${f};
  var pos = vec2f(f32(input.instance) % gridSize.x, floor(f32(input.instance) / gridSize.x));
  var color = vec4f(0, 1, 0.5, 1.0);
  var output: VertexOutput;
  if (particleState[i] == 0.0) {
    // particle is still moving. Its position is stored in the particleState buffer.
    pos = vec2f(particleState[i + 1], particleState[i + 2]);
  } else {
    var bodyIndex = u32(particleState[i] - 1.0);
    var alpha = max(0.4, 1.0 - particleState[i + 5]/10000);
    color = vec4f(
      bodies[bodyIndex * 6 + 3], bodies[bodyIndex * 6 + 4], bodies[bodyIndex * 6 + 5],
      alpha // fade out the particle
    ) * alpha;
  }
  output.color = color;
  output.pos =  vec4f(pos, 0, 1);

  return output;
  // if (particleState[i] == 0.0) {
  //   // particle is still moving. Its position is stored in the particleState buffer.
  //   let cell = vec2f(particleState[i + 1], particleState[i + 2]);
  //   let cellOffset = cell / gridSize * 2;
  //   let gridPos = (input.pos + 1) / gridSize - 1 + cellOffset;

  //   var output: VertexOutput;
  //   output.pos = vec4f(gridPos, 0, 1);
  //   output.color = vec4f(0, 1, 0.5, 1.0);
  //   return output;
  // } else {
  //   // particle has collided, mark it original position with the collided body color
  //   var output: VertexOutput;
  //   let cell = vec2f(f32(input.instance) % gridSize.x, floor(f32(input.instance) / gridSize.x));
  //   let cellOffset = cell / gridSize * 2;
  //   let gridPos = (input.pos + 1) / gridSize - 1 + cellOffset;
  //   output.pos = vec4f(gridPos, 0, 1);
  //   var bodyIndex = u32(particleState[i] - 1.0);
  //   var alpha = max(0.4, 1.0 - particleState[i + 5]/10000);
  //   output.color = vec4f(
  //     bodies[bodyIndex * 6 + 3], bodies[bodyIndex * 6 + 4], bodies[bodyIndex * 6 + 5],
  //     alpha // fade out the particle
  //   ) * alpha;
  //   return output;
  // }
}

@fragment
fn fragmentMain(input: FragInput) -> @location(0) vec4f {
  return input.color;
}`}),x=i.createBindGroupLayout({label:"Particle Bind Group Layout",entries:[{binding:0,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE|GPUShaderStage.FRAGMENT,buffer:{}},{binding:1,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE|GPUShaderStage.FRAGMENT,buffer:{type:"read-only-storage"}},{binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:"storage"}},{binding:3,visibility:GPUShaderStage.VERTEX|GPUShaderStage.COMPUTE,buffer:{type:"read-only-storage"}},{binding:4,visibility:GPUShaderStage.VERTEX,buffer:{type:"uniform"}}]}),S=i.createPipelineLayout({label:"Particle Pipeline Layout",bindGroupLayouts:[x]}),I=i.createRenderPipeline({label:"Particle pipeline",layout:S,vertex:{module:m,entryPoint:"vertexMain",buffers:[O]},fragment:{module:m,entryPoint:"fragmentMain",targets:[{format:c}]}}),T=[i.createBindGroup({label:"Particle renderer bind group A",layout:x,entries:[{binding:0,resource:{buffer:g}},{binding:1,resource:{buffer:u[0]}},{binding:2,resource:{buffer:u[1]}},{binding:3,resource:{buffer:b}},{binding:4,resource:{buffer:p}}]}),i.createBindGroup({label:"Particle renderer bind group B",layout:x,entries:[{binding:0,resource:{buffer:g}},{binding:1,resource:{buffer:u[1]}},{binding:2,resource:{buffer:u[0]}},{binding:3,resource:{buffer:b}},{binding:4,resource:{buffer:p}}]})],A=8,B=i.createShaderModule({label:"Gravitational basins simulation shader",code:`
    @group(0) @binding(0) var<uniform> grid: vec2f;

    @group(0) @binding(1) var<storage> particleStateIn: array<f32>;
    @group(0) @binding(2) var<storage, read_write> particleStateOut: array<f32>;

    struct Particle {
      bodyTouched: f32,
      position: vec2f,
      velocity: vec2f
    };
    
    struct Body {
      mass: f32,
      position: vec2f,
      color: vec3f
    };
    @group(0) @binding(3) var<storage, read> bodies: array<f32>;
    const PARTICLE_MASS = 1.0;
    const G = 0.01;
    const dT = .2;
    const collisionRadius = 1.0;

    fn cellIndex(cell: vec2u) -> u32 {
      return ((cell.y % u32(grid.y)) * u32(grid.x) +
              (cell.x % u32(grid.x))) * ${f};
    }

    fn calculateGravityForce(body: Body, particle: Particle) -> vec2f {
      let diff = body.position - particle.position;
      let d = length(diff);
      if (d <= collisionRadius) {
        // we consider this a collision. Not very accurate but it is a simulation
        return vec2f(0.0, 0.0);
      }
      // Calculate the force magnitude
      let forceMagnitude = (G * (body.mass * PARTICLE_MASS) / (d* d));
      return diff * forceMagnitude / d;
    }

    @compute @workgroup_size(${A}, ${A})
    fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
      var particleIndex = cellIndex(cell.xy);
      var bodyTouched = particleStateIn[particleIndex];

      var netForce = vec2f(0, 0);
      var particle = Particle(bodyTouched, 
        vec2f(particleStateIn[particleIndex + 1], particleStateIn[particleIndex + 2]),
        vec2f(particleStateIn[particleIndex + 3], particleStateIn[particleIndex + 4])
      );
      if (bodyTouched == 0.0) {
        for (var i = 0u; i < ${t.length}u; i++) {
          let body = Body(
            bodies[i * 6 + 0],
            vec2f(bodies[i * 6 + 1], bodies[i * 6 + 2]),
            vec3f(bodies[i * 6 + 3], bodies[i * 6 + 4], bodies[i * 6 + 5])
          );
          let force = calculateGravityForce(body, particle);
          if (length(force) > 0) {
            netForce += force;
          } else {
            bodyTouched = f32(i + 1);
            break;
          }
        }
      }
      if (bodyTouched == 0.0) {
        // Calculate acceleration (Newton's second law: F = ma)
        let acceleration = netForce/PARTICLE_MASS;
        // Update velocity (v = u + at)
        let velocity = particle.velocity + acceleration * dT; 
        // Update position (s = ut + 0.5at^2)
        let position = particle.position + velocity * dT + 0.5 * acceleration * dT * dT;

        particleStateOut[particleIndex + 0] = bodyTouched;
        particleStateOut[particleIndex + 1] = position.x;
        particleStateOut[particleIndex + 2] = position.y;
        particleStateOut[particleIndex + 3] = velocity.x;
        particleStateOut[particleIndex + 4] = velocity.y;
        particleStateOut[particleIndex + 5] = particleStateIn[particleIndex + 5] + 1.0;
      } else {
        particleStateOut[particleIndex + 0] = bodyTouched;
        particleStateOut[particleIndex + 1] = particleStateIn[particleIndex + 1];
        particleStateOut[particleIndex + 2] = particleStateIn[particleIndex + 2];
        particleStateOut[particleIndex + 3] = particleStateIn[particleIndex + 3];
        particleStateOut[particleIndex + 4] = particleStateIn[particleIndex + 4];
        particleStateOut[particleIndex + 5] = particleStateIn[particleIndex + 5];
      }
    }
  `}),z=i.createComputePipeline({label:"Simulation pipeline",layout:S,compute:{module:B,entryPoint:"computeMain"}});let U=0;function G(){const y=i.createCommandEncoder();for(let M=0;M<100;++M){const C=y.beginComputePass();C.setPipeline(z),C.setBindGroup(0,T[U%2]);const V=Math.ceil(r/A);C.dispatchWorkgroups(V,V),C.end(),U++}const w=y.beginRenderPass({colorAttachments:[{view:l.getCurrentTexture().createView(),loadOp:"clear",clearValue:{r:0,g:0,b:.4,a:1},storeOp:"store"}]});w.setPipeline(I),w.setBindGroup(0,T[U%2]),w.setVertexBuffer(0,s),w.draw(h.length/2,r*r),w.end(),i.queue.submit([y.finish()])}return{update:G}}const ne=128*2,oe=[{mass:10,position:{x:0,y:128},color:{r:1,g:0,b:0}},{mass:10,position:{x:120,y:140},color:{r:0,g:1,b:0}},{mass:10,position:{x:120,y:120},color:{r:1,g:1,b:0}},{mass:10,position:{x:120,y:0},color:{r:0,g:0,b:1}},{mass:40,position:{x:120,y:259},color:{r:0,g:1,b:1}}];ce().then(e=>{let r=ae(e,ne,oe);requestAnimationFrame(function t(){r.update(),requestAnimationFrame(t)})});async function ce(){const e=document.querySelector("canvas");if(!navigator.gpu)throw new Error("WebGPU not supported on this browser.");const r=await navigator.gpu.requestAdapter();if(!r)throw new Error("No appropriate GPUAdapter found.");const t=await r.requestDevice(),n=e.getContext("webgpu"),a=navigator.gpu.getPreferredCanvasFormat();return n.configure({device:t,format:a}),{context:n,device:t,canvasFormat:a}}
