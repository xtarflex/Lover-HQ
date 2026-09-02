/* eslint-disable react/no-unknown-property */
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { parseColorToThree, deriveSectorPalette } from '../../lib/audioUtils';
import { useAudioProcessor } from '../../hooks/useAudioProcessor';

/**
 * @file src/features/music/components/visualizers/FluidVisualizer.jsx
 * @description GPU-accelerated liquid fluid surface visualizer built with React Three Fiber
 * and custom WebGL shaders (Siri / Gemini Live aesthetic). Features multi-origin raindrop ripples,
 * 2D fluid surface plane mesh, normal-based diffuse lighting, dynamic HSL hue-shifted color sector mapping,
 * post-processing bloom glow, and centralized Audio Processing. Optimized for battery and performance.
 */

/**
 * R3F Fluid Surface Plane Shader Mesh component with multi-origin ripples & normal lighting.
 *
 * @param {Object} props
 * @param {React.RefObject} props.audioRef - Ref to doctored audio values.
 * @param {THREE.Color} props.primaryColor - Primary theme accent color.
 * @param {boolean} props.isMobile - Whether running on a mobile / touch device.
 * @param {boolean} props.isIntersecting - Whether the visualizer container is visible in the viewport.
 * @returns {React.ReactElement} The Three.js mesh element.
 */
function FluidShaderMesh({
  audioRef,
  timeDomainDataRef,
  primaryColor,
  isMobile,
  isIntersecting,
  isFlipped,
  updateAudio,
}) {
  const meshRef = useRef(null);
  const frameAccumulatorRef = useRef(0);
  const elapsedTimeRef = useRef(0);
  const rippleCooldownRef = useRef(0);

  const palette = useMemo(() => deriveSectorPalette(primaryColor), [primaryColor]);
  const geometrySegments = useMemo(() => (isMobile ? [32, 32] : [64, 64]), [isMobile]);

  // Memoize DataTexture for Time Domain (created once, updated in useFrame)
  const timeDomainTexture = useMemo(() => {
    // Pass a 128-byte array to initialize the texture
    const emptyArray = new Uint8Array(128);
    const tex = new THREE.DataTexture(emptyArray, 128, 1, THREE.RedFormat, THREE.UnsignedByteType);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const initialUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uBass: { value: 0.1 },
      uMid: { value: 0.1 },
      uTreble: { value: 0.1 },
      uOverall: { value: 0.1 },
      uPrimaryColor: { value: palette.primary },
      uCenterPurple: { value: palette.centerPurple },
      uBottomRed: { value: palette.bottomRed },
      uCornerAmber: { value: palette.cornerAmber },
      uRiverOffset: { value: new THREE.Vector2(0, 0) },
      uRipples: {
        value: Array.from({ length: 8 }, () => new THREE.Vector4(0, 0, 0, 0)),
      },
      uTimeDomain: { value: timeDomainTexture },
    }),
    [palette, timeDomainTexture]
  );

  useEffect(() => {
    if (!meshRef.current || !meshRef.current.material) return;
    const uniforms = meshRef.current.material.uniforms;
    uniforms.uPrimaryColor.value.copy(palette.primary);
    uniforms.uCenterPurple.value.copy(palette.centerPurple);
    uniforms.uBottomRed.value.copy(palette.bottomRed);
    uniforms.uCornerAmber.value.copy(palette.cornerAmber);
  }, [palette]);

  useFrame((state, delta) => {
    if (!meshRef.current || !meshRef.current.material) return;
    if (document.hidden || !isIntersecting || isFlipped) return;

    // Target FPS: 30 FPS on mobile, 60 FPS on desktop to preserve battery
    const targetFPS = isMobile ? 30 : 60;
    const frameInterval = 1 / targetFPS;

    frameAccumulatorRef.current += delta;
    if (frameAccumulatorRef.current < frameInterval) {
      return;
    }
    frameAccumulatorRef.current %= frameInterval;

    // Sync audio math and scaling exactly with GPU render tick
    if (updateAudio) {
      updateAudio(delta);
    }

    // Accumulate elapsed time manually to prevent THREE.Clock deprecation warnings
    elapsedTimeRef.current += delta;
    const t = elapsedTimeRef.current;

    const uniforms = meshRef.current.material.uniforms;
    const audio = audioRef.current;

    // ── Update Time Domain Texture ────────────────────────────────────────
    if (uniforms.uTimeDomain && uniforms.uTimeDomain.value && timeDomainDataRef?.current) {
      // Copy the latest waveform data into the texture's image data
      uniforms.uTimeDomain.value.image.data.set(timeDomainDataRef.current);
      uniforms.uTimeDomain.value.needsUpdate = true;
    }

    // ── Multi-Origin Raindrop Ripple Dispatcher ───────────────────────────
    if (rippleCooldownRef.current > 0) {
      rippleCooldownRef.current -= 1;
    }

    let spawnTrigger = false;
    if (audio.flux > audio.fluxThreshold * 1.5 && rippleCooldownRef.current === 0) {
      spawnTrigger = true;
      rippleCooldownRef.current = 5; // 5-frame cooldown
    }

    const rippleVectors = uniforms.uRipples.value;

    for (let i = 0; i < 8; i++) {
      const vec = rippleVectors[i];
      if (vec.w > 0.0) {
        vec.z += 0.016; // Age expands ripple
        vec.w -= 0.007; // Intensity fades out
      } else if (spawnTrigger) {
        // Spawn new drop at random surface point (x, y)
        vec.set(
          0.15 + Math.random() * 0.7,
          0.15 + Math.random() * 0.7,
          0.0,
          Math.min(1.0, audio.treble * 1.5)
        );
        spawnTrigger = false;
      }
    }

    // ── Reaction 2: Bass River Tide Sloshing (Horizontal Vector Shift) ───────
    const riverX = audio.bass * 0.35 * Math.sin(t * 1.8);
    const riverY = Math.sin(t * 2.2) * 0.08 * audio.bass;
    uniforms.uRiverOffset.value.set(riverX, riverY);

    // ── Reaction 3: Mid Cross-Current Collisions (Diagonal Vector Pinching) ──
    const midPinch = Math.sin(t * 3.5) * audio.mid * 0.25;

    // Update GPU Uniforms
    uniforms.uTime.value = t;
    uniforms.uBass.value = audio.bass;
    uniforms.uMid.value = audio.mid + midPinch;
    uniforms.uTreble.value = audio.treble;
    uniforms.uOverall.value = audio.overall;
  });

  const vertexShader = `
    varying vec2 vUv;
    varying vec3 vNormal;
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    uniform float uTreble;
    uniform vec2 uRiverOffset;

    // Layered simplex noise approximation
    float snoise(vec2 p) {
      return sin(p.x * 2.5 + uTime * 1.2) * cos(p.y * 2.5 + uTime * 0.9) * 0.5 +
             sin(p.x * 4.2 - uTime * 0.8) * cos(p.y * 4.2 + uTime * 1.4) * 0.3 +
             sin(p.x * 7.1 + uTime * 1.8) * 0.2;
    }

    void main() {
      vUv = uv + uRiverOffset;
      vec3 pos = position;
      float noise = snoise(vUv * 1.8);
      
      // Z-displacement height map for fluid surface waves
      float displacement = noise * (uBass * 0.38 + uMid * 0.28 + uTreble * 0.18);
      pos.z += displacement;

      // Time Domain Hybridization: Acoustic Micro-Vibration (Dormant)
      // float rawWaveform = texture2D(uTimeDomain, vec2(uv.x, 0.5)).r;
      // float pressure = (rawWaveform - 0.5) * 2.0; // Normalize 0..1 to -1..1
      // pos.z += pressure * 0.05 * uBass; // Sharp tactile buzz on bass kicks


      // Approximate perturbed surface normal for liquid diffuse lighting
      vec3 n = normal;
      n.x -= (snoise(vUv * 1.8 + vec2(0.01, 0.0)) - noise) * 14.0;
      n.y -= (snoise(vUv * 1.8 + vec2(0.0, 0.01)) - noise) * 14.0;
      vNormal = normalize(n);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float uTime;
    uniform float uBass;
    uniform float uMid;
    uniform float uTreble;
    uniform float uOverall;
    uniform vec3 uPrimaryColor;
    uniform vec3 uCenterPurple;
    uniform vec3 uBottomRed;
    uniform vec3 uCornerAmber;
    uniform vec4 uRipples[8]; // Array of vec4(x, y, age, intensity)
    varying vec2 vUv;
    varying vec3 vNormal;

    void main() {
      vec2 uv = vUv;

      // We will accumulate normal displacement for raindrops
      vec2 rippleDisplacement = vec2(0.0);

      // ── MULTI-ORIGIN RIPPLE LOOP (Overlapping Raindrops on Moving Water) ──
      for (int i = 0; i < 8; i++) {
        vec4 r = uRipples[i];
        if (r.w > 0.0) { // If intensity > 0
          float dist = distance(uv, vec2(r.x, r.y));
          // Derivative of the wave function to find the slope for normal displacement
          // derivative of sin(dist * 36.0 - age * 16.0) is cos(...) * 36.0
          float waveCos = cos(dist * 36.0 - r.z * 16.0);
          float falloff = smoothstep(0.45, 0.0, dist) * r.w;

          // Calculate directional vector from center of ripple
          vec2 dir = normalize(uv - vec2(r.x, r.y));

          // Add to normal displacement
          rippleDisplacement += dir * waveCos * falloff * 0.3;
        }
      }

      // Factor ripple displacement into the surface normal
      vec3 displacedNormal = normalize(vNormal + vec3(rippleDisplacement, 0.0));

      // ── Chromatic Dispersion (RGB Channel Separation on Wave Slopes) ───────
      vec2 waveDistort = displacedNormal.xy * 0.08;

      // Sample red shifted forward, blue shifted backward
      float redChannel   = smoothstep(0.2, 0.55, (uv + waveDistort).y);
      float blueChannel  = smoothstep(0.2, 0.55, (uv - waveDistort).y);
      float greenChannel = smoothstep(0.2, 0.55, uv.y);

      // 1. Interpolate from Bottom Red -> Center Belt -> Top Primary, split by channels
      vec3 colColumn = vec3(
        mix(uBottomRed.r, uCenterPurple.r, redChannel),
        mix(uBottomRed.g, uCenterPurple.g, greenChannel),
        mix(uBottomRed.b, uCenterPurple.b, blueChannel)
      );

      // Top Primary interpolation (using the green channel's vertical position for simplicity)
      colColumn = mix(colColumn, uPrimaryColor, smoothstep(0.5, 0.82, uv.y));

      // 2. Inject Bottom-Right Corner Glow Sector
      float cornerGlow = smoothstep(0.55, 0.0, distance(uv, vec2(1.0, 0.0)));
      vec3 finalColor = mix(colColumn, uCornerAmber, cornerGlow * 0.75);

      // ── Diffuse Normal Lighting (Highlights & Shadows for 3D Depth) ──────
      vec3 lightDir = normalize(vec3(0.3, 0.5, 1.0));
      // Use displacedNormal instead of vNormal for lighting
      float diff = max(dot(displacedNormal, lightDir), 0.0);

      // Specular Caustic Edge Rings: Crisp specular caustic crest (top of the wave)
      float causticHighlight = pow(diff, 16.0) * (0.4 + uBass * 0.6);

      // Add specular highlights instead of wide diffuse shading
      finalColor += vec3(1.0, 1.0, 1.0) * causticHighlight;

      // Specular center core glow
      float centerDist = distance(uv, vec2(0.5));
      float coreGlow = smoothstep(0.45, 0.0, centerDist) * (0.35 + uOverall * 0.5);
      finalColor += vec3(0.92, 0.96, 1.0) * coreGlow * 0.45;

      gl_FragColor = vec4(finalColor, 0.95);
    }
  `;

  return (
    <mesh ref={meshRef} scale={[3.2, 3.2, 1]}>
      <planeGeometry args={[1, 1, geometrySegments[0], geometrySegments[1]]} />
      <shaderMaterial
        uniforms={initialUniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/**
 * FluidVisualizer component.
 * Renders a GPU-accelerated liquid fluid surface visualizer inside a CSS-masked squircle container.
 *
 * @param {Object} props
 * @param {AnalyserNode|null} props.analyserNode - Web Audio API analyser node.
 * @param {boolean} props.isPlaying - Whether audio is currently playing.
 * @param {'html5'|'youtube'|'none'} props.activePlayer - Which player is active.
 * @param {string|null} [props.accentColor] - Dominant accent color extracted from album art.
 * @returns {React.ReactElement} The FluidVisualizer component.
 */
export default function FluidVisualizer({
  analyserNode,
  isPlaying,
  activePlayer,
  accentColor,
  isFlipped,
}) {
  const containerRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(true);

  const isMobile = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
  }, []);

  // Viewport IntersectionObserver to pause rendering when scrolled out of view
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Centralized Audio Spectrum Processing & Container Pulse Hook
  const {
    audioDataRef,
    timeDomainDataRef,
    update: updateAudio,
  } = useAudioProcessor({
    analyserNode,
    isPlaying,
    activePlayer,
    containerRef,
  });

  const primaryColor = useMemo(() => parseColorToThree(accentColor), [accentColor]);

  return (
    <div
      ref={containerRef}
      className="liquid-blob-container"
      style={{ willChange: 'transform' }}
      aria-hidden="true"
      role="presentation"
    >
      <Canvas
        className="liquid-blob-canvas"
        camera={{ position: [0, 0, 2.5], fov: 45 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{ antialias: !isMobile, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.8} />
        <directionalLight position={[2, 4, 3]} intensity={1.2} />
        <FluidShaderMesh
          audioRef={audioDataRef}
          timeDomainDataRef={timeDomainDataRef}
          primaryColor={primaryColor}
          isMobile={isMobile}
          isIntersecting={isIntersecting}
          isFlipped={isFlipped}
          updateAudio={updateAudio}
        />
        <EffectComposer>
          <Bloom intensity={0.35} luminanceThreshold={0.85} mipmapBlur />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
