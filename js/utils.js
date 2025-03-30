/* ------------------ HASH FUNCTIONS ------------------ */
// Seeded random for consistent glitch effects
Math.seedrandom = function (seed) {
    let mSeed = seed || Math.floor(Math.random() * 233280);
    const oldRandom = Math.random;
  
    Math.random = function () {
      const a = 16807, m = 2147483647;
      mSeed = (a * mSeed) % m;
      return mSeed / m;
    };
  
    Math.seedrandom.reset = function () {
      Math.random = oldRandom;
    };
  };
  
  const UTILS = {
    /* ------------------ TOAST NOTIFICATIONS ------------------ */
    showToast: function(message, isError = false) {
      const existingToast = document.getElementById('gameToast');
      if (existingToast) document.body.removeChild(existingToast);
  
      const toast = document.createElement('div');
      toast.id = 'gameToast';
      toast.style.position = 'fixed';
      toast.style.bottom = '20px';
      toast.style.left = '50%';
      toast.style.transform = 'translateX(-50%)';
      toast.style.backgroundColor = isError ? '#ff0066' : '#00ffff';
      toast.style.color = '#000';
      toast.style.padding = '10px 20px';
      toast.style.borderRadius = '4px';
      toast.style.zIndex = '10000';
      toast.style.fontFamily = 'Courier New, monospace';
      toast.style.boxShadow = '0 0 10px rgba(0, 255, 255, 0.5)';
      toast.textContent = message;
  
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) document.body.removeChild(toast);
      }, 3000);
    },
  
    /* ------------------ CLIPBOARD FUNCTIONS ------------------ */
    copyTextToClipboard: function(text) {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text)
          .then(() => {
            UTILS.showToast('Copied to clipboard!');
            return true;
          })
          .catch(() => {
            const success = UTILS.copyTextFallback(text);
            if (success) {
              UTILS.showToast('Copied to clipboard!');
              return true;
            } else {
              UTILS.showManualCopyUI(text);
              return false;
            }
          });
      } else {
        const success = UTILS.copyTextFallback(text);
        if (success) {
          UTILS.showToast('Copied to clipboard!');
          return Promise.resolve(true);
        } else {
          UTILS.showManualCopyUI(text);
          return Promise.resolve(false);
        }
      }
    },
  
    copyTextFallback: function(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '0';
      textarea.style.top = '0';
      textarea.style.width = '100%';
      textarea.style.height = '100px';
      textarea.style.padding = '10px';
      textarea.style.zIndex = '9999';
      textarea.style.background = '#000';
      textarea.style.color = '#0ff';
      textarea.style.border = '1px solid #0ff';
  
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
  
      let success;
      try {
        success = document.execCommand('copy');
      } catch (err) {
        success = false;
      }
  
      document.body.removeChild(textarea);
      return success;
    },
  
    showManualCopyUI: function(text) {
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.9)';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.zIndex = '10000';
      modal.style.padding = '20px';
  
      modal.innerHTML = `
        <div style="background:#000; border:1px solid #0ff; padding:20px; max-width:500px; width:100%">
          <h3 style="color:#0ff; margin-bottom:10px">Copy this hash manually:</h3>
          <textarea id="manualCopyText" style="width:100%; height:80px; background:#111; color:#0ff; border:1px solid #0ff; padding:5px; margin-bottom:10px">${text}</textarea>
          <div style="display:flex; justify-content:space-between">
            <button id="modalTryAgain" style="background:transparent; color:#0ff; border:1px solid #0ff; padding:10px 15px">Try Copy Again</button>
            <button id="modalClose" style="background:transparent; color:#0ff; border:1px solid #0ff; padding:10px 15px">Close</button>
          </div>
        </div>
      `;
  
      document.body.appendChild(modal);
  
      const textarea = document.getElementById('manualCopyText');
      textarea.focus();
      textarea.select();
  
      document.getElementById('modalTryAgain').addEventListener('click', () => {
        textarea.select();
        const success = document.execCommand('copy');
        if (success) {
          document.body.removeChild(modal);
          UTILS.showToast('Hash copied!');
        }
      });
  
      document.getElementById('modalClose').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
    },
  
    /* ------------------ HASH ENCODING/DECODING ------------------ */
    encodeConfigToHash: function(config) {
      let result = '';
  
      // First 4 characters: master, bloom, pixel, glitch (1 char each)
      result += Math.min(35, Math.round(config.master * 9)).toString(36);
      result += Math.min(35, Math.round(config.bloom * 9)).toString(36);
      result += Math.min(35, config.pixel).toString(36);
      result += Math.min(35, Math.round(config.glitch * 9)).toString(36);
  
      // Next 2 characters: glitchSeed (0-1295)
      result += Math.min(1295, config.glitchSeed).toString(36).padStart(2, '0');
  
      // Next 3 characters: scanline, speed, wildGlitch
      result += Math.min(35, Math.round(config.scanline * 9)).toString(36);
      result += Math.min(35, Math.round(config.speed * 9)).toString(36);
      result += config.wildGlitch ? '1' : '0';
  
      // Next 2 characters: hueShift (0-360 mapped to 0-1295)
      const hueVal = Math.round(config.hueShift * 1295 / 360);
      result += Math.min(1295, hueVal).toString(36).padStart(2, '0');
  
      // Next 2 characters: saturation, colorPulse
      result += Math.min(35, Math.round(config.saturation * 9)).toString(36);
      result += Math.min(35, Math.round(config.colorPulse * 9)).toString(36);
  
      // Last 7 characters: player color (3 chars), grid color (4 chars)
      function encodeColor(color) {
        if (color.length === 7) {
          const r = Math.round(parseInt(color.substring(1, 3), 16) / 17).toString(16);
          const g = Math.round(parseInt(color.substring(3, 5), 16) / 17).toString(16);
          const b = Math.round(parseInt(color.substring(5, 7), 16) / 17).toString(16);
          return r + g + b;
        }
        return color.substring(1);
      }
  
      result += encodeColor(config.playerColor);
      const gridColorEncoded = encodeColor(config.gridColor);
      result += gridColorEncoded.padEnd(4, '0');
  
      return result.substring(0, 20);
    },
  
    decodeHashToConfig: function(hash) {
      if (hash.length !== 20) {
        throw new Error('Invalid hash format: must be exactly 20 characters');
      }
  
      const config = {};
  
      config.master = parseInt(hash[0], 36) / 9;
      config.bloom = parseInt(hash[1], 36) / 9;
      config.pixel = parseInt(hash[2], 36);
      config.glitch = parseInt(hash[3], 36) / 9;
      config.glitchSeed = parseInt(hash.substring(4, 6), 36);
      config.scanline = parseInt(hash[6], 36) / 9;
      config.speed = parseInt(hash[7], 36) / 9;
      config.wildGlitch = hash[8] === '1';
      const hueVal = parseInt(hash.substring(9, 11), 36);
      config.hueShift = Math.round(hueVal * 360 / 1295);
      config.saturation = parseInt(hash[11], 36) / 9;
      config.colorPulse = parseInt(hash[12], 36) / 9;
  
      function decodeColor(shortColor) {
        const r = parseInt(shortColor[0], 16) * 17;
        const g = parseInt(shortColor[1], 16) * 17;
        const b = parseInt(shortColor[2], 16) * 17;
        return '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');
      }
  
      config.playerColor = decodeColor(hash.substring(13, 16));
      config.gridColor = decodeColor(hash.substring(16, 19));
  
      return config;
    },
  
    formatDate: function(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    },
  
    /* ------------------ MATH UTILITIES ------------------ */
    smoothstep: function(x) {
      return x * x * (3 - 2 * x);
    }
  };