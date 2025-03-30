/* ------------------ VISUAL EFFECTS SYSTEM ------------------ */

function setupEffectsPanel() {
  const panel = document.getElementById('effectsPanel');
  
  // Create sliders HTML
  const slidersHTML = `
    <div class="effect-control">
      <label>Master Intensity:</label>
      <input type="range" id="masterIntensity" min="0" max="10" step="0.1" value="1">
      <input type="number" id="masterNumber" min="0" max="10" step="0.1" value="1">
    </div>

    <div class="effect-control">
      <label>Bloom:</label>
      <input type="range" id="bloomIntensity" min="0" max="10" step="0.1" value="1">
      <input type="number" id="bloomNumber" min="0" max="10" step="0.1" value="1">
    </div>

    <div class="effect-control">
      <label>Pixelation:</label>
      <input type="range" id="pixelIntensity" min="1" max="20" step="1" value="1">
      <input type="number" id="pixelNumber" min="1" max="20" step="1" value="1">
    </div>

    <div class="effect-control">
      <label>Glitch Amount:</label>
      <input type="range" id="glitchIntensity" min="0" max="10" step="0.1" value="0">
      <input type="number" id="glitchNumber" min="0" max="10" step="0.1" value="0">
    </div>

    <div class="effect-control">
      <label>Glitch Seed:</label>
      <input type="range" id="glitchSeed" min="1" max="1000" step="1" value="1">
      <input type="number" id="glitchSeedNumber" min="1" max="1000" step="1" value="1">
    </div>

    <div class="effect-control">
      <label>Scanlines:</label>
      <input type="range" id="scanlineIntensity" min="0" max="10" step="0.1" value="0">
      <input type="number" id="scanlineNumber" min="0" max="10" step="0.1" value="0">
    </div>

    <div class="effect-control">
      <label>Effect Speed:</label>
      <input type="range" id="effectSpeed" min="0.1" max="5" step="0.1" value="1">
      <input type="number" id="effectSpeedNumber" min="0.1" max="5" step="0.1" value="1">
    </div>

    <div class="effect-control">
      <input type="checkbox" id="wildGlitch">
      <label for="wildGlitch">Wild Glitch Mode</label>
    </div>

    <div class="color-control">
      <h4>Color Adjustments</h4>
      <div class="effect-control">
        <label>Hue Shift:</label>
        <input type="range" id="hueShift" min="0" max="360" step="1" value="0">
        <input type="number" id="hueShiftNumber" min="0" max="360" step="1" value="0">
      </div>

      <div class="effect-control">
        <label>Saturation:</label>
        <input type="range" id="saturation" min="0" max="2" step="0.05" value="1">
        <input type="number" id="saturationNumber" min="0" max="2" step="0.05" value="1">
      </div>

      <div class="effect-control">
        <label>Color Pulse:</label>
        <input type="range" id="colorPulse" min="0" max="10" step="0.1" value="1">
        <input type="number" id="colorPulseNumber" min="0" max="10" step="0.1" value="1">
      </div>

      <div class="effect-control">
        <label>Player Color:</label>
        <input type="text" id="playerColor" class="color-input" value="#ff00ff">
        <span class="color-preview" id="playerColorPreview" style="background-color:#ff00ff;"></span>
      </div>

      <div class="effect-control">
        <label>Grid Color:</label>
        <input type="text" id="gridColor" class="color-input" value="#0088ff">
        <span class="color-preview" id="gridColorPreview" style="background-color:#0088ff;"></span>
      </div>
    </div>

    <div class="options-row">
      <select id="presetDropdown">
        <option value="">-- Presets --</option>
        <option value="default">Default</option>
        <option value="retro">Retro</option>
        <option value="cyberpunk">Cyberpunk</option>
        <option value="lofi">Lo-Fi</option>
        <option value="vaporwave">Vaporwave</option>
        <option value="glitchy">Glitchy</option>
        <option value="minimal">Minimal</option>
      </select>
      <button id="loadPreset">Load</button>
      <input type="text" id="presetName" placeholder="Preset name">
      <button id="savePreset">Save</button>
      <button id="randomizeButton">Randomize</button>
    </div>

    <textarea id="configHash" readonly placeholder="Settings hash will appear here"></textarea>
    <div class="options-row">
      <button id="copyHash">Copy Hash</button>
      <input type="text" id="hashInput" placeholder="Paste hash here">
      <button id="applyHash">Apply</button>
    </div>
  `;
  
  panel.innerHTML = `<h3>VISUAL EFFECTS CONTROL</h3>${slidersHTML}`;
  
  // Setup controls
  setupUIControls();
  
  // Toggle effects panel button
  document.getElementById('toggleEffectsButton').addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    
    // FIXED: Only mark as opened when explicitly clicked by user
    if (panel.style.display === 'block') {
      // Save that the effects panel notification has been seen
      localStorage.setItem('neonTrailblazerEffectsOpened', 'true');
      // Hide the notification dot
      document.documentElement.style.setProperty('--effect-badge-display', 'none');
      document.getElementById('toggleEffectsButton').classList.add('notification-hidden');
    }
  });
  
  // Init presets
  initPresets();
}

function setupUIControls() {
  setupControl('masterIntensity', 'masterNumber', 'master');
  setupControl('bloomIntensity', 'bloomNumber', 'bloom');
  setupControl('pixelIntensity', 'pixelNumber', 'pixel');
  setupControl('glitchIntensity', 'glitchNumber', 'glitch');
  setupControl('glitchSeed', 'glitchSeedNumber', 'glitchSeed');
  setupControl('scanlineIntensity', 'scanlineNumber', 'scanline');
  setupControl('effectSpeed', 'effectSpeedNumber', 'speed');
  setupControl('hueShift', 'hueShiftNumber', 'hueShift');
  setupControl('saturation', 'saturationNumber', 'saturation');
  setupControl('colorPulse', 'colorPulseNumber', 'colorPulse');

  setupColorPicker('playerColor', 'playerColorPreview');
  setupColorPicker('gridColor', 'gridColorPreview');

  document.getElementById('wildGlitch').addEventListener('change', (e) => {
    RENDERER.effectsConfig.wildGlitch = e.target.checked;
    RENDERER.updateEffects();
    updateConfigHash();
  });

  document.getElementById('loadPreset').addEventListener('click', () => {
    const presetName = document.getElementById('presetDropdown').value;
    if (presetName) loadPreset(presetName);
  });

  document.getElementById('savePreset').addEventListener('click', () => {
    const name = document.getElementById('presetName').value || 'custom';
    const presets = JSON.parse(localStorage.getItem('tronEffectsPresets') || '{}');
    presets[name] = { ...RENDERER.effectsConfig };
    localStorage.setItem('tronEffectsPresets', JSON.stringify(presets));

    const dropdown = document.getElementById('presetDropdown');
    let exists = false;
    for (let i = 0; i < dropdown.options.length; i++) {
      if (dropdown.options[i].value === name) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      const option = document.createElement('option');
      option.value = name;
      option.text = name;
      dropdown.add(option);
    }

    UTILS.showToast(`Preset "${name}" saved!`);
  });

  document.getElementById('randomizeButton').addEventListener('click', randomizeEffects);

  document.getElementById('copyHash').addEventListener('click', () => {
    const hashElement = document.getElementById('configHash');
    const hashText = hashElement.value;
    UTILS.copyTextToClipboard(hashText);
  });

  document.getElementById('applyHash').addEventListener('click', () => {
    const hash = document.getElementById('hashInput').value;
    try {
      applyConfigFromHash(hash);
      UTILS.showToast('Settings applied!');
    } catch (e) {
      UTILS.showToast('Invalid hash format!', true);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'e' || e.key === 'E') {
      const panel = document.getElementById('effectsPanel');
      const isNowVisible = panel.style.display === 'none';
      panel.style.display = isNowVisible ? 'block' : 'none';
      
      // FIXED: Mark as opened only if explicitly triggered by key
      if (isNowVisible) {
        // Save that the effects panel has been seen
        localStorage.setItem('neonTrailblazerEffectsOpened', 'true');
        // Hide the notification dot
        document.documentElement.style.setProperty('--effect-badge-display', 'none');
        document.getElementById('toggleEffectsButton').classList.add('notification-hidden');
      }
    }
  });

  updateConfigHash();
}

function setupControl(sliderId, numberId, configKey) {
  const slider = document.getElementById(sliderId);
  const numberInput = document.getElementById(numberId);

  slider.value = RENDERER.effectsConfig[configKey];
  numberInput.value = RENDERER.effectsConfig[configKey];

  slider.addEventListener('input', () => {
    if (CONFIG.STATE.updatingUI) return;
    const value = parseFloat(slider.value);
    RENDERER.effectsConfig[configKey] = value;
    numberInput.value = value;
    RENDERER.updateEffects();
    updateConfigHash();
  });

  numberInput.addEventListener('change', () => {
    if (CONFIG.STATE.updatingUI) return;
    let value = parseFloat(numberInput.value);
    const min = parseFloat(numberInput.min);
    const max = parseFloat(numberInput.max);
    value = Math.min(Math.max(value, min), max);

    RENDERER.effectsConfig[configKey] = value;
    slider.value = value;
    numberInput.value = value;
    RENDERER.updateEffects();
    updateConfigHash();
  });
}

function setupColorPicker(colorId, previewId) {
  const colorInput = document.getElementById(colorId);
  const preview = document.getElementById(previewId);

  colorInput.value = RENDERER.effectsConfig[colorId];
  preview.style.backgroundColor = RENDERER.effectsConfig[colorId];

  colorInput.addEventListener('change', () => {
    if (CONFIG.STATE.updatingUI) return;
    const newColor = colorInput.value;
    RENDERER.effectsConfig[colorId] = newColor;
    preview.style.backgroundColor = newColor;
    RENDERER.updateMaterialColors();
    updateConfigHash();
  });
}

function updateSliders() {
  CONFIG.STATE.updatingUI = true;

  document.getElementById('masterIntensity').value = RENDERER.effectsConfig.master;
  document.getElementById('masterNumber').value = RENDERER.effectsConfig.master;
  document.getElementById('bloomIntensity').value = RENDERER.effectsConfig.bloom;
  document.getElementById('bloomNumber').value = RENDERER.effectsConfig.bloom;
  document.getElementById('pixelIntensity').value = RENDERER.effectsConfig.pixel;
  document.getElementById('pixelNumber').value = RENDERER.effectsConfig.pixel;
  document.getElementById('glitchIntensity').value = RENDERER.effectsConfig.glitch;
  document.getElementById('glitchNumber').value = RENDERER.effectsConfig.glitch;
  document.getElementById('glitchSeed').value = RENDERER.effectsConfig.glitchSeed;
  document.getElementById('glitchSeedNumber').value = RENDERER.effectsConfig.glitchSeed;
  document.getElementById('scanlineIntensity').value = RENDERER.effectsConfig.scanline;
  document.getElementById('scanlineNumber').value = RENDERER.effectsConfig.scanline;
  document.getElementById('effectSpeed').value = RENDERER.effectsConfig.speed;
  document.getElementById('effectSpeedNumber').value = RENDERER.effectsConfig.speed;
  document.getElementById('hueShift').value = RENDERER.effectsConfig.hueShift;
  document.getElementById('hueShiftNumber').value = RENDERER.effectsConfig.hueShift;
  document.getElementById('saturation').value = RENDERER.effectsConfig.saturation;
  document.getElementById('saturationNumber').value = RENDERER.effectsConfig.saturation;
  document.getElementById('colorPulse').value = RENDERER.effectsConfig.colorPulse;
  document.getElementById('colorPulseNumber').value = RENDERER.effectsConfig.colorPulse;

  document.getElementById('playerColor').value = RENDERER.effectsConfig.playerColor;
  document.getElementById('playerColorPreview').style.backgroundColor = RENDERER.effectsConfig.playerColor;
  document.getElementById('gridColor').value = RENDERER.effectsConfig.gridColor;
  document.getElementById('gridColorPreview').style.backgroundColor = RENDERER.effectsConfig.gridColor;

  document.getElementById('wildGlitch').checked = RENDERER.effectsConfig.wildGlitch;

  CONFIG.STATE.updatingUI = false;
}

function updateConfigHash() {
  document.getElementById('configHash').value = UTILS.encodeConfigToHash(RENDERER.effectsConfig);
}

function applyConfigFromHash(hash) {
  try {
    const config = UTILS.decodeHashToConfig(hash);
    Object.assign(RENDERER.effectsConfig, config);
    updateSliders();
    RENDERER.updateEffects();
    RENDERER.updateMaterialColors();
    updateConfigHash();
  } catch (e) {
    console.error("Error applying config from hash:", e);
    throw e;
  }
}

function randomizeEffects() {
  RENDERER.effectsConfig.master = Math.random() * 2 + 0.5;
  RENDERER.effectsConfig.bloom = Math.random() * 3 + 0.5;
  RENDERER.effectsConfig.pixel = Math.floor(Math.random() * 10) + 1;
  RENDERER.effectsConfig.glitch = Math.random() * 3;
  RENDERER.effectsConfig.glitchSeed = Math.floor(Math.random() * 1000) + 1;
  RENDERER.effectsConfig.scanline = Math.random() * 5;
  RENDERER.effectsConfig.speed = 0.5 + Math.random() * 1.5;
  RENDERER.effectsConfig.wildGlitch = Math.random() > 0.8;
  RENDERER.effectsConfig.hueShift = Math.floor(Math.random() * 360);
  RENDERER.effectsConfig.saturation = 0.7 + Math.random() * 0.6;
  RENDERER.effectsConfig.colorPulse = Math.random() * 3;

  const randomNeonColor = () => {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 100%, 50%)`;
  };

  RENDERER.effectsConfig.playerColor = randomNeonColor();
  RENDERER.effectsConfig.gridColor = randomNeonColor();

  updateSliders();
  RENDERER.updateEffects();
  RENDERER.updateMaterialColors();
  updateConfigHash();
}

function initPresets() {
  // Built-in presets
  const builtInPresets = CONFIG.VISUAL_PRESETS;

  // Save built-in presets to localStorage if they don't exist
  const savedPresets = localStorage.getItem('tronEffectsPresets');
  if (!savedPresets) {
    localStorage.setItem('tronEffectsPresets', JSON.stringify(builtInPresets));
  } else {
    // Add any missing built-in presets
    const presets = JSON.parse(savedPresets);
    let updated = false;
    for (const key in builtInPresets) {
      if (!presets[key]) {
        presets[key] = builtInPresets[key];
        updated = true;
      }
    }
    if (updated) {
      localStorage.setItem('tronEffectsPresets', JSON.stringify(presets));
    }
  }

  // Add stored presets to dropdown
  const dropdown = document.getElementById('presetDropdown');
  const presets = JSON.parse(localStorage.getItem('tronEffectsPresets') || '{}');

  for (const key in presets) {
    if (key !== 'default' && key !== 'retro' && key !== 'cyberpunk' &&
      key !== 'lofi' && key !== 'vaporwave' && key !== 'glitchy' && key !== 'minimal') {
      const option = document.createElement('option');
      option.value = key;
      option.text = key;
      dropdown.add(option);
    }
  }
}

function loadPreset(presetName) {
  const presets = JSON.parse(localStorage.getItem('tronEffectsPresets') || '{}');
  if (presets[presetName]) {
    Object.assign(RENDERER.effectsConfig, presets[presetName]);
    updateSliders();
    RENDERER.updateEffects();
    RENDERER.updateMaterialColors();
    updateConfigHash();
  } else {
    UTILS.showToast(`Preset "${presetName}" not found!`, true);
  }
}

// FIXED: This function has been completely rewritten to properly handle the notification badge
document.addEventListener('DOMContentLoaded', function() {
// Function to update the badge visibility - only checks localStorage
function updateBadgeVisibility() {
  // Get the saved preference - ONLY hide if explicitly set to true
  const hasExplicitlyClicked = localStorage.getItem('neonTrailblazerEffectsOpened') === 'true';
  
  // Only hide notification if user has explicitly clicked the button before
  if (hasExplicitlyClicked) {
    document.documentElement.style.setProperty('--effect-badge-display', 'none');
    
    const toggleButton = document.getElementById('toggleEffectsButton');
    if (toggleButton) {
      toggleButton.classList.add('notification-hidden');
    }
  } else {
    // Otherwise show the notification
    document.documentElement.style.setProperty('--effect-badge-display', 'block');
    
    const toggleButton = document.getElementById('toggleEffectsButton');
    if (toggleButton) {
      toggleButton.classList.remove('notification-hidden');
    }
  }
}

// Run initially
updateBadgeVisibility();

// Get the toggle button
const toggleButton = document.getElementById('toggleEffectsButton');
if (!toggleButton) return;

// FIXED: Get the effects panel element
const effectsPanel = document.getElementById('effectsPanel');
if (!effectsPanel) return;

// FIXED: Add direct click handler to the button that marks as clicked
// and hides the notification badge
toggleButton.addEventListener('click', function() {
  // Set display state of the panel
  effectsPanel.style.display = effectsPanel.style.display === 'block' ? 'none' : 'block';
  
  // If we're showing the panel, mark as opened and hide notification
  if (effectsPanel.style.display === 'block') {
    localStorage.setItem('neonTrailblazerEffectsOpened', 'true');
    document.documentElement.style.setProperty('--effect-badge-display', 'none');
    toggleButton.classList.add('notification-hidden');
  }
});

// FIXED: REMOVED the MutationObserver that was automatically hiding
// the notification badge whenever the panel was shown
});