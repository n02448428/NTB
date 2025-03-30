# Neon Trailblazer Dependencies

This document lists all third-party libraries and dependencies used in the Neon Trailblazer game, including their versions and purposes.

## Core Dependencies

| Dependency | Version | Purpose | Import Source | License |
|------------|---------|---------|--------------|---------|
| Three.js | 0.134.0 | 3D rendering engine | CDN: cdn.skypack.dev | MIT |

## Three.js Extensions

All Three.js extensions are included from the same CDN and version as the core library.

| Extension | Purpose |
|-----------|---------|
| EffectComposer | Manages post-processing effects pipeline |
| RenderPass | Basic scene rendering pass |
| UnrealBloomPass | Creates bloom/glow effects |
| ShaderPass | Applies custom shader effects |
| GlitchPass | Creates glitch visual effects |

## Import Map

The game uses an import map in `index.html` to manage module imports:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.skypack.dev/three@0.134.0",
    "three/examples/jsm/postprocessing/EffectComposer.js": "https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/EffectComposer.js",
    "three/examples/jsm/postprocessing/RenderPass.js": "https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/RenderPass.js",
    "three/examples/jsm/postprocessing/UnrealBloomPass.js": "https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/UnrealBloomPass.js",
    "three/examples/jsm/postprocessing/ShaderPass.js": "https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/ShaderPass.js",
    "three/examples/jsm/postprocessing/GlitchPass.js": "https://cdn.skypack.dev/three@0.134.0/examples/jsm/postprocessing/GlitchPass.js"
  }
}
</script>
```

## Browser APIs

| API | Purpose |
|-----|---------|
| Web Audio API | Music and sound effects |
| Local Storage API | Saving game settings and leaderboard |
| Canvas API | Dynamic texture generation |
| Fetch API | Online leaderboard integration |

## Future Dependencies (Not Currently Used)

If you plan to extend the game with these features, you might need:

| Dependency | Purpose | Recommendation |
|------------|---------|---------------|
| Howler.js | Advanced audio management | If adding complex audio features |
| Cannon.js | Physics engine | If adding realistic physics interactions |
| Tween.js | Animation library | If adding complex animations beyond Three.js capabilities |
| Stats.js | Performance monitoring | For development/debugging |

## Adding New Dependencies

When adding new dependencies:

1. **Versioning**: Always specify a fixed version to ensure consistency
2. **CDN vs Local**: Prefer CDN for common libraries (Three.js), local import for specialized tools
3. **Size**: Consider bundle size impact
4. **Browser Compatibility**: Ensure compatibility with target browsers
5. **Update the Import Map**: Add new entries to the import map in index.html

Example of adding a new dependency:

```html
<!-- In index.html -->
<script type="importmap">
{
  "imports": {
    // Existing imports
    "howler": "https://cdn.skypack.dev/howler@2.2.3"
  }
}
</script>
```

```javascript
// In your module
import { Howl } from 'howler';

const sound = new Howl({
  src: ['assets/audio/effect.mp3']
});
```

## Dependency Update Procedure

When updating dependencies:

1. Check the Three.js changelog for breaking changes
2. Update the version number in the import map
3. Test all visual effects for compatibility
4. Test on multiple browsers and devices
5. Update this documentation with the new version number

## Browser Compatibility

The current dependencies are compatible with:

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 89+ |
| Firefox | 87+ |
| Safari | 14+ |
| Edge | 89+ |
| iOS Safari | 14+ |
| Android Chrome | 89+ |

These requirements are primarily driven by:
- Import map support
- WebGL capabilities
- Module script support

## Performance Impact

| Dependency | Approximate Size | Load Time Impact |
|------------|------------------|-----------------|
| Three.js Core | ~580KB | Moderate |
| Effect Composer + Passes | ~120KB | Low |
| Custom Shaders | ~10KB | Negligible |
| Total | ~710KB | Moderate |

For slower connections, consider adding a loading screen while dependencies are being fetched.

## License Information

| Dependency | License | Requirements |
|------------|---------|--------------|
| Three.js | MIT | Include copyright notice |

The MIT License is permissive and generally only requires that the license and copyright notice are included in your distributed code.