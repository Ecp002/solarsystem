import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import { PlanetData, PLANETS_DATA, MoonObjectData } from '../data/planets';
import { SunShaderMaterial } from '../shaders/SunShader';
import { AudioEngine } from '../utils/AudioEngine';

interface SpaceCanvasProps {
  started: boolean;
  selectedPlanet: PlanetData | null;
  onSelectPlanet: (planet: PlanetData | null) => void;
  setHoveredPlanet: (name: string | null) => void;
}

// Helper: Generates a procedural planet texture using HTML5 Canvas
// 2D Value Noise generator for procedural planet surface rendering
const createNoiseGenerator = () => {
  const size = 256;
  const grid = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    grid[i] = Math.random();
  }

  const getNoise = (x: number, y: number) => {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const x0 = xi;
    const x1 = (xi + 1) & 255;
    const y0 = yi;
    const y1 = (yi + 1) & 255;

    const u = xf * xf * (3.0 - 2.0 * xf);
    const v = yf * yf * (3.0 - 2.0 * yf);

    const r00 = grid[y0 * size + x0];
    const r10 = grid[y0 * size + x1];
    const r01 = grid[y1 * size + x0];
    const r11 = grid[y1 * size + x1];

    const mixX0 = r00 + u * (r10 - r00);
    const mixX1 = r01 + u * (r11 - r01);

    return mixX0 + v * (mixX1 - mixX0);
  };

  const fbm = (x: number, y: number, octaves = 4) => {
    let value = 0;
    let amplitude = 0.5;
    let freq = 1.0;
    for (let i = 0; i < octaves; i++) {
      value += amplitude * getNoise(x * freq, y * freq);
      amplitude *= 0.5;
      freq *= 2.0;
    }
    return value;
  };

  return fbm;
};

const fbm = createNoiseGenerator();

const generateProceduralTexture = (name: string, color: string): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(512, 256);
  const pixelData = imgData.data;

  for (let y = 0; y < 256; y++) {
    for (let x = 0; x < 512; x++) {
      const idx = (y * 512 + x) * 4;
      let r = 0, g = 0, b = 0;

      if (name === 'Mercury') {
        const n = fbm(x * 0.05, y * 0.05, 4);
        const val = 75 + n * 90;
        r = val;
        g = val * 0.96;
        b = val * 1.05;
      } else if (name === 'Venus') {
        const swirl = fbm(x * 0.03, y * 0.03, 3) * 6.0;
        const n = fbm(x * 0.05 + swirl, y * 0.05, 4);
        r = 185 + n * 70;
        g = 120 + n * 80;
        b = 50 + n * 40;
      } else if (name === 'Earth') {
        const n = fbm(x * 0.02, y * 0.04, 5);
        if (n > 0.47) { // Land
          const landNoise = fbm(x * 0.08, y * 0.16, 3);
          r = 45 + landNoise * 55;
          g = 110 + landNoise * 35;
          b = 45 + landNoise * 15;
          if (n > 0.57) { // Mountain Peaks
            r = 180 + landNoise * 30;
            g = 175 + landNoise * 20;
            b = 155 + landNoise * 15;
          }
        } else { // Ocean
          const depth = n / 0.47;
          r = 10;
          g = 40 + depth * 50;
          b = 130 + depth * 125;
        }
      } else if (name === 'Mars') {
        const n = fbm(x * 0.04, y * 0.08, 4);
        r = 160 + n * 70;
        g = 65 + n * 45;
        b = 30 + n * 20;

        // Dark volcanic highlands
        const highlands = fbm(x * 0.08, y * 0.16, 2);
        if (highlands > 0.62) {
          r *= 0.6;
          g *= 0.65;
          b *= 0.7;
        }

        // Polar Ice Caps
        if (y < 22) {
          const edge = (y / 22);
          r = r * edge + 255 * (1 - edge);
          g = g * edge + 255 * (1 - edge);
          b = b * edge + 255 * (1 - edge);
        } else if (y > 234) {
          const edge = ((255 - y) / 21);
          r = r * edge + 255 * (1 - edge);
          g = g * edge + 255 * (1 - edge);
          b = b * edge + 255 * (1 - edge);
        }
      } else if (name === 'Jupiter') {
        const swirl = fbm(x * 0.025, y * 0.04, 3) * 12.0;
        const n = fbm(x * 0.05, (y + swirl) * 0.08, 4);
        const band = Math.sin((y * 1.5 + swirl * 0.6) * 0.08) * 0.5 + 0.5;
        const mixF = band * 0.65 + n * 0.35;

        if (mixF < 0.38) {
          r = 230 + n * 25;
          g = 210 + n * 20;
          b = 185 + n * 15;
        } else if (mixF < 0.62) {
          r = 180 + n * 35;
          g = 125 + n * 25;
          b = 80 + n * 15;
        } else {
          r = 100 + n * 20;
          g = 55 + n * 10;
          b = 30 + n * 10;
        }
      } else if (name === 'Saturn') {
        const band = Math.sin(y * 0.1) * 0.5 + 0.5;
        const n = fbm(x * 0.02, y * 0.08, 3);
        r = 195 + band * 30 + n * 20;
        g = 180 + band * 25 + n * 15;
        b = 145 + band * 20 + n * 10;
      } else if (name === 'Uranus') {
        const n = fbm(x * 0.02, y * 0.05, 3);
        r = 165 + n * 15;
        g = 225 + n * 15;
        b = 225 + n * 15;
      } else if (name === 'Neptune') {
        const swirl = fbm(x * 0.03, y * 0.03, 3) * 4.0;
        const n = fbm(x * 0.04, (y + swirl) * 0.08, 4);
        const band = Math.sin(y * 0.06) * 0.5 + 0.5;
        r = 25 + band * 15 + n * 20;
        g = 55 + band * 25 + n * 30;
        b = 180 + band * 40 + n * 45;
        
        // Methane cloud wisps
        if (n > 0.68) {
          r = Math.min(255, r + 55);
          g = Math.min(255, g + 60);
          b = Math.min(255, b + 75);
        }
      }

      pixelData[idx] = Math.min(255, Math.max(0, r));
      pixelData[idx+1] = Math.min(255, Math.max(0, g));
      pixelData[idx+2] = Math.min(255, Math.max(0, b));
      pixelData[idx+3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // Post-draw custom features (like Jupiter's red spot, Mercury's crater rims)
  if (name === 'Mercury') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    const seedCraters = [
      {cx: 120, cy: 80, r: 4},
      {cx: 340, cy: 190, r: 6},
      {cx: 410, cy: 60, r: 3},
      {cx: 210, cy: 120, r: 5},
      {cx: 80, cy: 220, r: 7}
    ];
    seedCraters.forEach(({cx, cy, r}) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      
      for (let j = 0; j < 8; j++) {
        const theta = (j / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(theta) * 35, cy + Math.sin(theta) * 35);
        ctx.stroke();
      }
    });
  } else if (name === 'Jupiter') {
    ctx.fillStyle = '#b52f14';
    ctx.beginPath();
    ctx.ellipse(320, 160, 24, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(240, 220, 210, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(320, 160, 32, 19, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (name === 'Neptune') {
    ctx.fillStyle = '#0f173d';
    ctx.beginPath();
    ctx.ellipse(280, 120, 20, 11, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
};

// Helper: Generates a soft circular alpha texture for shiny points
const createCircleTexture = (): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, 32, 32);
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.25)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

// Procedural Ring Texture Generator for gas giants
const generateRingTexture = (type: 'saturn' | 'uranus' | 'neptune' | 'jupiter'): THREE.Texture => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const cx = 256;
  const cy = 256;

  // Clear to transparent
  ctx.clearRect(0, 0, 512, 512);

  if (type === 'saturn') {
    // Saturn rings: rich golden/beige bands with Cassini division
    // Draw concentric circles from radius 140 to 256
    for (let r = 140; r <= 256; r++) {
      const pct = (r - 140) / (256 - 140);
      let color = '';
      let alpha = 0;

      // Cassini Division around pct = 0.5 to 0.55
      if (pct > 0.48 && pct < 0.54) {
        alpha = 0.03;
        color = `rgba(30, 25, 20, ${alpha})`;
      } else {
        // Multi-band pattern using sine/cosine noise
        const bandNoise = Math.sin(r * 0.45) * 0.15 + Math.cos(r * 0.15) * 0.1 + 0.75;
        let baseR = 215, baseG = 195, baseB = 165;

        if (pct < 0.25) {
          // Inner C ring (dimmer, grayer)
          baseR = 150; baseG = 140; baseB = 130;
          alpha = pct * 4.0 * 0.5;
        } else if (pct < 0.48) {
          // B Ring (brightest, golden-cream)
          baseR = 240; baseG = 220; baseB = 190;
          alpha = 0.95;
        } else {
          // A Ring (medium bright)
          baseR = 205; baseG = 190; baseB = 165;
          alpha = 0.8;
        }

        alpha *= bandNoise;

        // Fade out at outer edge
        if (pct > 0.92) {
          alpha *= (1 - pct) / 0.08;
        }

        color = `rgba(${baseR}, ${baseG}, ${baseB}, ${alpha})`;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (type === 'jupiter') {
    // Jupiter rings: very faint, warm reddish-orange dust bands
    for (let r = 160; r <= 256; r++) {
      const pct = (r - 160) / (256 - 160);
      const bandNoise = Math.sin(r * 0.8) * 0.35 + 0.65;
      let alpha = 0.35 * bandNoise;

      // Outer edge fade
      if (pct > 0.85) {
        alpha *= (1 - pct) / 0.15;
      }
      // Inner edge fade
      if (pct < 0.1) {
        alpha *= (pct / 0.1);
      }

      const color = `rgba(200, 130, 90, ${alpha})`;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (type === 'uranus') {
    // Uranus rings: multiple sharp, narrow, pale cyan ice ringlets
    const ringletRadii = [150, 165, 178, 192, 205, 218, 230, 242, 250];
    ringletRadii.forEach((r, idx) => {
      const alpha = 0.65 + (idx % 3) * 0.1;
      const color = `rgba(185, 248, 248, ${alpha})`;
      ctx.strokeStyle = color;
      ctx.lineWidth = idx % 2 === 0 ? 3.0 : 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });
  } else if (type === 'neptune') {
    // Neptune rings: faint, deep blue-white ice bands with some gaps
    const bands = [
      { start: 155, end: 168, alpha: 0.45 },
      { start: 180, end: 188, alpha: 0.35 },
      { start: 205, end: 228, alpha: 0.55 },
      { start: 240, end: 250, alpha: 0.45 }
    ];
    bands.forEach(({ start, end, alpha }) => {
      for (let r = start; r <= end; r++) {
        const pct = (r - start) / (end - start);
        const edgeFade = Math.sin(pct * Math.PI); // Peak in center, fade at edges
        const color = `rgba(150, 195, 255, ${alpha * edgeFade})`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

// 1. Orbit Ring Visuals
const OrbitRing: React.FC<{ radius: number }> = ({ radius }) => {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const lineObj = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: '#ffffff',
      opacity: 0.06,
      transparent: true,
      depthWrite: false
    });
    return new THREE.Line(geom, mat);
  }, [points]);

  return <primitive object={lineObj} />;
};

// Note: Custom Shader Sun logic is now merged directly into PlanetMesh

// 3. Moon component
const Moon: React.FC<{ moon: MoonObjectData }> = ({ moon }) => {
  const moonRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (moonRef.current) {
      moonRef.current.rotation.y += moon.orbitSpeed * delta * 1.5;
    }
  });

  return (
    <group ref={moonRef}>
      {/* Moon orbit ring path (clearer opacity for visual feedback) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[moon.orbitRadius - 0.02, moon.orbitRadius + 0.02, 32]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Moon body mesh with emissive glow so it stands out on the night/shadow side */}
      <mesh position={[moon.orbitRadius, 0, 0]}>
        <sphereGeometry args={[moon.size, 16, 16]} />
        <meshStandardMaterial
          color={moon.color}
          emissive={moon.color}
          emissiveIntensity={0.35}
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>
    </group>
  );
};

// 4. Asteroid Belt Instanced Mesh
const AsteroidBelt: React.FC = () => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 1200;
  const tempObject = useMemo(() => new THREE.Object3D(), []);

  const asteroids = useMemo(() => {
    const data = [];
    for (let i = 0; i < count; i++) {
      const r = 19.5 + Math.random() * 3.0; // Between Mars (17.5) and Jupiter (24)
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 0.35; // Slight height spread
      const speed = 0.04 + Math.random() * 0.07;

      const rotX = Math.random() * 0.02;
      const rotY = Math.random() * 0.02;
      const rotZ = Math.random() * 0.02;

      const scale = 0.025 + Math.random() * 0.05;

      data.push({ r, theta, y, speed, rotX, rotY, rotZ, scale });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const ast = asteroids[i];
      const currentTheta = ast.theta + ast.speed * time * 0.2;
      const x = Math.cos(currentTheta) * ast.r;
      const z = Math.sin(currentTheta) * ast.r;

      tempObject.position.set(x, ast.y, z);
      tempObject.rotation.set(
        time * ast.rotX,
        time * ast.rotY,
        time * ast.rotZ
      );
      tempObject.scale.set(ast.scale, ast.scale, ast.scale);
      tempObject.updateMatrix();

      meshRef.current.setMatrixAt(i, tempObject.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#6e6255" roughness={0.95} metalness={0.05} />
    </instancedMesh>
  );
};

// 5. Deep Space Spiral Galaxy
const SpiralGalaxy: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 3000;

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    // Warm, glowing golden-bronze palette matching the cinematic "gold" theme
    const colorCore = new THREE.Color('#fffae6');  // Bright yellow-white gold core
    const colorArm = new THREE.Color('#ffd700');   // Rich metallic gold
    const colorOuter = new THREE.Color('#b38600'); // Deep amber/gold outskirts

    for (let i = 0; i < count; i++) {
      const arm = i % 2;
      const angleOffset = arm * Math.PI;

      const t = Math.random();
      const r = 60 + t * 100;

      const theta = r * 0.07 + angleOffset + (Math.random() - 0.5) * 0.25;
      const ySpread = 10 * (1 - t * 0.7);
      const y = (Math.random() - 0.5) * ySpread;

      const x = Math.cos(theta) * r;
      const z = Math.sin(theta) * r;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      const tempColor = new THREE.Color();
      if (t < 0.25) {
        tempColor.lerpColors(colorCore, colorArm, t / 0.25);
      } else {
        tempColor.lerpColors(colorArm, colorOuter, (t - 0.25) / 0.75);
      }

      cols[i * 3] = tempColor.r;
      cols[i * 3 + 1] = tempColor.g;
      cols[i * 3 + 2] = tempColor.b;
    }

    return [pos, cols];
  }, []);

  const circleTexture = useMemo(() => createCircleTexture(), []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.015 * delta;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.7} // Slightly increased size for enhanced shimmer effect
        map={circleTexture} // Map soft circular texture to avoid square points
        vertexColors
        transparent
        opacity={0.85} // Increased opacity for richer, shinier presence
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// 5.2. Distant Static Starfield (High performance backdrop for outer zoom levels)
const DistantStars: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 12000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Distributed in a wide outer sphere shell (450 to 3500) to cover deep zoom levels
      const u = Math.random();
      const r = 450 + u * 3050;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }

    return pos;
  }, []);

  const circleTexture = useMemo(() => createCircleTexture(), []);

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.003 * delta; // extremely slow celestial rotation
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.28} // Small, delicate point size for deep space dust feel
        map={circleTexture} // Soft round circular texture
        color="#ffffff"
        transparent
        opacity={0.8} // Gentle brightness
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// 5.5. Interactive Starfield with cursor Particle Glow visual effect (no movement)
const InteractiveStars: React.FC<{ started: boolean }> = ({ started }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const count = 3000;

  // Initialize and memorize original position and vertex color buffers
  const [originalPositions, colors] = useMemo(() => {
    const orig = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const r = 25 + u * 425;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      orig[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      orig[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      orig[i * 3 + 2] = r * Math.cos(phi);

      // Base color: white
      cols[i * 3] = 1.0;
      cols[i * 3 + 1] = 1.0;
      cols[i * 3 + 2] = 1.0;
    }

    return [orig, cols];
  }, []);

  const circleTexture = useMemo(() => createCircleTexture(), []);
  
  // Reusable Vector3 instances to avoid garbage collection overhead in frame loop
  const tempV = useMemo(() => new THREE.Vector3(), []);
  const camDir = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    if (!geomRef.current) return;

    // 1. Rotate the background stars around Y axis to maintain slow cosmic drift in-place
    const rotSpeed = 0.003 * delta;
    const cosA = Math.cos(rotSpeed);
    const sinA = Math.sin(rotSpeed);
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = originalPositions[idx];
      const z = originalPositions[idx + 2];
      originalPositions[idx] = x * cosA - z * sinA;
      originalPositions[idx + 2] = x * sinA + z * cosA;
    }

    // 2. Get camera direction to check front/back facing stars
    const camera = state.camera;
    camera.getWorldDirection(camDir);
    
    // Normalized 2D screen space interaction radius (approx 12% of screen width)
    const influenceRadius2D = 0.12; 
    const aspect = state.size.width / state.size.height;
    let activeGlowCount = 0;

    // 3. Modulate colors of nearby stars using 2D screen-space projected distance
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const ox = originalPositions[idx];
      const oy = originalPositions[idx + 1];
      const oz = originalPositions[idx + 2];

      // Distance from camera to star
      const camToStarX = ox - camera.position.x;
      const camToStarY = oy - camera.position.y;
      const camToStarZ = oz - camera.position.z;
      const isFacingCamera = (camToStarX * camDir.x + camToStarY * camDir.y + camToStarZ * camDir.z) > 0;

      let smoothFactor = 0.0;

      if (started && isFacingCamera) {
        // Project 3D star position to 2D NDC space [-1, 1]
        tempV.set(ox, oy, oz);
        tempV.project(camera);

        // Distance in 2D screen space (adjusted for screen aspect ratio to maintain circular hover radius)
        const dx = tempV.x - state.pointer.x;
        const dy = tempV.y - state.pointer.y;
        const dist2D = Math.sqrt((dx * aspect) * (dx * aspect) + dy * dy);

        if (dist2D < influenceRadius2D) {
          const factor = 1.0 - (dist2D / influenceRadius2D);
          smoothFactor = factor * factor * (3.0 - 2.0 * factor); // smoothstep
          if (smoothFactor > 0.08) {
            activeGlowCount++;
          }
        }
      }

      // Target colors (R, G, B). Trigger HDR bloom for close values by scaling beyond 1.0
      const targetR = 1.0 + smoothFactor * 3.0;
      const targetG = 1.0 + smoothFactor * 3.0;
      const targetB = 1.0 + smoothFactor * 4.0; // slight blue-white neon tint for sci-fi feel

      // Smooth color transition using lerp to prevent sudden brightness pops
      colors[idx] += (targetR - colors[idx]) * 0.12;
      colors[idx + 1] += (targetG - colors[idx + 1]) * 0.12;
      colors[idx + 2] += (targetB - colors[idx + 2]) * 0.12;
    }

    geomRef.current.attributes.position.needsUpdate = true;
    geomRef.current.attributes.color.needsUpdate = true;
    
    // Notify AudioEngine to update chime volume based on number of active glowing stars
    AudioEngine.updateCursorGravity(activeGlowCount);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute attach="attributes-position" args={[originalPositions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.35} // Star sizing
        map={circleTexture} // Soft circular texture
        vertexColors={true} // Enable vertex colors for individual HDR brightness control
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// 6. Planet Mesh wrapper
interface PlanetMeshProps {
  data: PlanetData;
  onSelect: (planet: PlanetData) => void;
  setHoveredPlanet: (name: string | null) => void;
  isFocused: boolean;
  angleRef: React.MutableRefObject<number>;
}

const PlanetMesh: React.FC<PlanetMeshProps> = ({
  data,
  onSelect,
  setHoveredPlanet,
  isFocused,
  angleRef
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const cloudRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);

  // Custom shader material for the Sun if this mesh is the Sun
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const sunMat = useMemo(() => {
    if (data.name !== 'Sun') return null;
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(SunShaderMaterial.uniforms),
      vertexShader: SunShaderMaterial.vertexShader,
      fragmentShader: SunShaderMaterial.fragmentShader
    });
  }, [data.name]);

  // Generate procedural texture once for planets
  const texture = useMemo(() => {
    if (data.name === 'Sun') return null;
    return generateProceduralTexture(data.name, data.color);
  }, [data]);

  // Generate Earth cloud texture if needed
  const earthCloudTexture = useMemo(() => {
    if (data.name === 'Earth') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      const imgData = ctx.createImageData(512, 256);
      const pixelData = imgData.data;

      for (let y = 0; y < 256; y++) {
        for (let x = 0; x < 512; x++) {
          const idx = (y * 512 + x) * 4;
          const swirl = fbm(x * 0.03, y * 0.05, 3) * 6.0;
          const n = fbm((x + swirl) * 0.04, y * 0.04, 4);
          
          const val = n > 0.47 ? (n - 0.47) * 3.5 * 255 : 0;
          pixelData[idx] = 255;
          pixelData[idx+1] = 255;
          pixelData[idx+2] = 255;
          pixelData[idx+3] = Math.min(230, Math.max(0, val));
        }
      }
      ctx.putImageData(imgData, 0, 0);
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      return tex;
    }
    return null;
  }, [data.name]);

  // Generate rings if needed
  const ringTexture = useMemo(() => {
    if (data.hasRings && data.ringType) return generateRingTexture(data.ringType);
    return null;
  }, [data.hasRings, data.ringType]);

  useFrame((state, delta) => {
    // Animate Sun shader
    if (sunMat) {
      sunMat.uniforms.uTime.value = state.clock.getElapsedTime();
    }

    // Update orbit angle (Only when not focused on this specific planet AND not hovered)
    if (!isFocused && !hovered) {
      angleRef.current += data.orbitSpeed * delta * 15.0; // scale orbit speed for animation fluidity
    }
    const x = Math.cos(angleRef.current) * data.orbitRadius;
    const z = Math.sin(angleRef.current) * data.orbitRadius;

    // Position the entire local planetary coordinate group
    if (groupRef.current) {
      groupRef.current.position.set(x, 0, z);
    }

    // Local self-rotations around axes
    if (meshRef.current) {
      meshRef.current.rotation.y += data.rotationSpeed * delta * 5.0;
    }

    if (cloudRef.current) {
      cloudRef.current.rotation.y += (data.rotationSpeed + 0.01) * delta * 5.0;
    }
  });

  // Scale up slightly on hover to look high-end
  const scale = hovered ? data.size * 1.12 : data.size;

  // Custom ring dimensions per planet to keep proportions accurate
  const ringDimensions = useMemo(() => {
    if (!data.hasRings) return null;
    switch (data.name) {
      case 'Saturn':
        return { inner: scale * 1.4, outer: scale * 2.5 };
      case 'Jupiter':
        return { inner: scale * 1.3, outer: scale * 1.7 };
      case 'Uranus':
        return { inner: scale * 1.4, outer: scale * 2.1 };
      case 'Neptune':
        return { inner: scale * 1.3, outer: scale * 1.9 };
      default:
        return { inner: scale * 1.4, outer: scale * 2.3 };
    }
  }, [data.hasRings, data.name, scale]);

  return (
    <group ref={groupRef}>
      {/* Cloud layer overlay specifically for Earth */}
      {data.name === 'Earth' && earthCloudTexture && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[scale * 1.015, 32, 32]} />
          <meshStandardMaterial map={earthCloudTexture} transparent depthWrite={false} />
        </mesh>
      )}

      {/* Main Planet/Sun Sphere */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(data);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
          setHoveredPlanet(data.name);
          AudioEngine.playPlanetHover();
        }}
        onPointerOut={() => {
          setHover(false);
          setHoveredPlanet(null);
        }}
      >
        <sphereGeometry args={[scale, 32, 32]} />
        {data.name === 'Sun' && sunMat ? (
          <primitive object={sunMat} attach="material" ref={materialRef} />
        ) : (
          <meshStandardMaterial
            map={texture || undefined}
            roughness={data.name === 'Earth' ? 0.4 : 0.8}
            metalness={0.15}
          />
        )}
      </mesh>

      {/* Glow halo when hovered or focused (Rendered as sibling to body, scaled dynamically) */}
      {(hovered || isFocused) && (
        <mesh>
          <sphereGeometry args={[scale * 1.08, 32, 32]} />
          <meshBasicMaterial
            color={data.atmosphereColor || '#00f0ff'}
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Planet Rings (Rendered as sibling to body, scaled dynamically) */}
      {data.hasRings && ringTexture && ringDimensions && (
        <mesh
          rotation={
            data.name === 'Uranus'
              ? [Math.PI / 2.0, Math.PI / 8.0, 0]
              : [Math.PI / 2.2, 0, 0]
          }
        >
          <ringGeometry args={[ringDimensions.inner, ringDimensions.outer, 64]} />
          <meshBasicMaterial
            map={ringTexture}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.NormalBlending}
          />
        </mesh>
      )}

      {/* Planet Moons */}
      {data.moonObjects && data.moonObjects.map((moon) => (
        <Moon key={moon.name} moon={moon} />
      ))}
    </group>
  );
};

// 4. Camera Controller for GSAP flights & tracking
interface CameraControllerProps {
  selectedPlanet: PlanetData | null;
  planetAngles: React.MutableRefObject<{ [key: string]: React.MutableRefObject<number> }>;
  controlsRef: React.RefObject<any>;
}

const CameraController: React.FC<CameraControllerProps> = ({
  selectedPlanet,
  planetAngles,
  controlsRef
}) => {
  const { camera } = useThree();
  const transitionT = useRef({ value: 0 });
  const lastTarget = useRef(new THREE.Vector3(0, 0, 0));
  const isTracking = useRef(false);

  // Transition animation on planet selection
  useEffect(() => {
    isTracking.current = false;
    AudioEngine.playTravelWhoosh();

    // Reset controls if planet closed
    if (!selectedPlanet) {
      gsap.to(camera.position, {
        x: 0,
        y: 22,
        z: 42,
        duration: 2.0,
        ease: 'power2.inOut'
      });
      gsap.to(lastTarget.current, {
        x: 0,
        y: 0,
        z: 0,
        duration: 2.0,
        ease: 'power2.inOut',
        onUpdate: () => {
          if (controlsRef.current) {
            controlsRef.current.target.copy(lastTarget.current);
          }
        },
        onComplete: () => {
          isTracking.current = false;
        }
      });
      return;
    }

    // Determine current absolute position of planet
    const planetAngle = planetAngles.current[selectedPlanet.name].current;
    const px = Math.cos(planetAngle) * selectedPlanet.orbitRadius;
    const pz = Math.sin(planetAngle) * selectedPlanet.orbitRadius;

    // Trigger Fly-To Timeline
    const tl = gsap.timeline({
      onComplete: () => {
        isTracking.current = true;
        AudioEngine.playArrivalChime();
      }
    });

    // Animate target focus
    tl.to(lastTarget.current, {
      x: px,
      y: 0,
      z: pz,
      duration: 1.8,
      ease: 'power3.inOut',
      onUpdate: () => {
        if (controlsRef.current) {
          controlsRef.current.target.copy(lastTarget.current);
        }
      }
    }, 0);

    // Animate Camera Position close to target
    const targetCamX = px + selectedPlanet.size * 2.5;
    const targetCamY = selectedPlanet.size * 1.5;
    const targetCamZ = pz + selectedPlanet.size * 3.5;

    tl.to(camera.position, {
      x: targetCamX,
      y: targetCamY,
      z: targetCamZ,
      duration: 1.8,
      ease: 'power3.inOut'
    }, 0);

  }, [selectedPlanet, camera, controlsRef]);

  // Frame lock to track moving planet
  useFrame(() => {
    if (isTracking.current && selectedPlanet && controlsRef.current) {
      const angle = planetAngles.current[selectedPlanet.name].current;
      const px = Math.cos(angle) * selectedPlanet.orbitRadius;
      const pz = Math.sin(angle) * selectedPlanet.orbitRadius;

      // Track offset delta relative to planet movement
      const deltaX = px - lastTarget.current.x;
      const deltaZ = pz - lastTarget.current.z;

      // Shift camera and target simultaneously
      camera.position.x += deltaX;
      camera.position.z += deltaZ;
      lastTarget.current.set(px, 0, pz);
      controlsRef.current.target.copy(lastTarget.current);
    }
  });

  return null;
};

// Main Canvas orchestrator
const SpaceCanvas: React.FC<SpaceCanvasProps> = ({
  started,
  selectedPlanet,
  onSelectPlanet,
  setHoveredPlanet
}) => {
  const controlsRef = useRef<any>(null);

  // Allocate mutable references for planet orbit angles to read instantly in frame loop
  const planetAngles = useRef<{ [key: string]: { current: number } }>({});
  
  if (Object.keys(planetAngles.current).length === 0) {
    PLANETS_DATA.forEach((p) => {
      planetAngles.current[p.name] = { current: Math.random() * Math.PI * 2 };
    });
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'absolute', top: 0, left: 0 }}>
      <Canvas gl={{ antialias: true }} camera={{ position: [0, 22, 42], fov: 45, near: 0.1, far: 5000 }}>
        <color attach="background" args={['#000000']} />
        
        {/* Local Starfield */}
        <InteractiveStars started={started} />

        {/* Distant Static Starfield */}
        <DistantStars />

        {/* Deep Space Spiral Galaxy Backdrop */}
        <SpiralGalaxy />

        {/* Ambient fill */}
        <ambientLight intensity={0.06} />

        {/* Core lighting (The Sun light source) */}
        <pointLight position={[0, 0, 0]} intensity={started ? 5.5 : 0.05} distance={150} decay={1.0} color="#ffebcc" />

        {/* Camera flight tracking */}
        <CameraController 
          selectedPlanet={selectedPlanet} 
          planetAngles={planetAngles} 
          controlsRef={controlsRef} 
        />

        {/* The Solar System bodies */}
        <group>
          {/* Instanced Asteroid Belt */}
          <AsteroidBelt />

          {/* Planet meshes and orbits (with orbital inclination support) */}
          {PLANETS_DATA.map((p) => {
            const hasInclination = p.name === 'Pluto';
            const rotationTilt: [number, number, number] = hasInclination 
              ? [0.05, 0, 0.28] 
              : [0, 0, 0];

            return (
              <group key={p.name} rotation={rotationTilt}>
                {p.orbitRadius > 0 && <OrbitRing radius={p.orbitRadius} />}
                <PlanetMesh
                  data={p}
                  onSelect={onSelectPlanet}
                  setHoveredPlanet={setHoveredPlanet}
                  isFocused={selectedPlanet?.name === p.name}
                  angleRef={planetAngles.current[p.name]}
                />
              </group>
            );
          })}
        </group>

        {/* Post processing bloom for emissive Sun and outline glows */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.25} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        </EffectComposer>

        {/* Dynamic controls */}
        <OrbitControls
          ref={controlsRef}
          enablePan={!selectedPlanet} // Pan disabled when focusing on a planet
          minDistance={3}
          maxDistance={2500}
        />
      </Canvas>
    </div>
  );
};

export default SpaceCanvas;
