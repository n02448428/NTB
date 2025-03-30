/* ------------------ CUSTOM SHADERS ------------------ */

// Pixelation shader
const PixelShader = {
    uniforms: {
      tDiffuse: { value: null },
      pixelSize: { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float pixelSize;
      varying vec2 vUv;
      
      void main() {
        if (pixelSize <= 1.0) {
          gl_FragColor = texture2D(tDiffuse, vUv);
          return;
        }
        vec2 dimensions = vec2(1024.0, 768.0);
        vec2 pixelatedUV = floor(vUv * dimensions / pixelSize) * pixelSize / dimensions;
        gl_FragColor = texture2D(tDiffuse, pixelatedUV);
      }
    `
  };
  
  // Color processing shader
  const ColorShader = {
    uniforms: {
      tDiffuse: { value: null },
      time: { value: 0.0 },
      hueShift: { value: 0.0 },
      saturation: { value: 1.0 },
      colorPulse: { value: 0.0 },
      speed: { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float time;
      uniform float hueShift;
      uniform float saturation;
      uniform float colorPulse;
      uniform float speed;
      varying vec2 vUv;
  
      vec3 rgb2hsl(vec3 color) {
        float maxColor = max(max(color.r, color.g), color.b);
        float minColor = min(min(color.r, color.g), color.b);
        float delta = maxColor - minColor;
        
        float h = 0.0, s = 0.0, l = (maxColor + minColor) / 2.0;
        
        if (delta > 0.0) {
          s = l < 0.5 ? delta / (maxColor + minColor) : delta / (2.0 - maxColor - minColor);
          
          if (maxColor == color.r) {
            h = (color.g - color.b) / delta + (color.g < color.b ? 6.0 : 0.0);
          } else if (maxColor == color.g) {
            h = (color.b - color.r) / delta + 2.0;
          } else {
            h = (color.r - color.g) / delta + 4.0;
          }
          h /= 6.0;
        }
        return vec3(h, s, l);
      }
      
      float hue2rgb(float p, float q, float t) {
        if (t < 0.0) t += 1.0;
        if (t > 1.0) t -= 1.0;
        if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
        if (t < 1.0/2.0) return q;
        if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
        return p;
      }
      
      vec3 hsl2rgb(vec3 hsl) {
        float h = hsl.x, s = hsl.y, l = hsl.z;
        vec3 rgb;
        
        if (s == 0.0) {
          rgb = vec3(l);
        } else {
          float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
          float p = 2.0 * l - q;
          rgb.r = hue2rgb(p, q, h + 1.0/3.0);
          rgb.g = hue2rgb(p, q, h);
          rgb.b = hue2rgb(p, q, h - 1.0/3.0);
        }
        return rgb;
      }
  
      void main() {
        vec4 texel = texture2D(tDiffuse, vUv);
        vec3 hsl = rgb2hsl(texel.rgb);
        
        float hueOffset = hueShift / 360.0;
        
        if (colorPulse > 0.0) {
          float pulse = sin(time * speed) * 0.05 * colorPulse;
          hsl.x = mod(hsl.x + hueOffset + pulse, 1.0);
        } else {
          hsl.x = mod(hsl.x + hueOffset, 1.0);
        }
        
        hsl.y *= saturation;
        vec3 rgb = hsl2rgb(hsl);
        gl_FragColor = vec4(rgb, texel.a);
      }
    `
  };
  
  // Scanline shader
  const ScanlineShader = {
    uniforms: {
      tDiffuse: { value: null },
      time: { value: 0.0 },
      intensity: { value: 0.0 },
      speed: { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float time;
      uniform float intensity;
      uniform float speed;
      varying vec2 vUv;
      
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        
        if (intensity <= 0.0) {
          gl_FragColor = color;
          return;
        }
        
        float scanlineSize = max(1.0, 15.0 - intensity * 1.2);
        float scanlineIntensity = min(0.3, intensity * 0.03);
        
        float scanline = sin(vUv.y * 720.0 / scanlineSize) * 0.5 + 0.5;
        scanline = pow(scanline, 1.0) * scanlineIntensity;
        
        color.rgb *= (1.0 - scanline);
        
        if (intensity > 5.0) {
          float jitter = sin(time * speed * 2.0) * 0.001 * (intensity - 5.0);
          float jitterLine = mod(gl_FragCoord.y, 2.0);
          vec2 jitteredUV = vec2(vUv.x + jitter * jitterLine, vUv.y);
          vec4 jitterColor = texture2D(tDiffuse, jitteredUV);
          color = mix(color, jitterColor, 0.05);
        }
        
        gl_FragColor = color;
      }
    `
  };