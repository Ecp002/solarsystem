import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useScroll, ScrollControls, Stars, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import { SunShader } from '../shaders/sunShader';
import { WormholeShader } from '../shaders/wormholeShader';
import PlanetHUD from './PlanetHUD';
import { SpaceAudio } from '../utils/SpaceAudioEngine';

// 1. Orbit Path Component
const OrbitPath = ({ radius }) => {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    }
    return pts;
  }, [radius]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color="#ffffff" opacity={0.07} transparent depthWrite={false} />
    </line>
  );
};

// 2. Custom Shader Sun
const Sun = ({ started }) => {
  const meshRef = useRef();
  const coronaParticlesRef = useRef();

  // Create Sun shader material
  const sunMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(SunShader.uniforms),
      vertexShader: SunShader.vertexShader,
      fragmentShader: SunShader.fragmentShader,
    });
  }, []);

  // Volumetric solar flare particles
  const particleCount = 200;
  const [particlePositions, particleSpeeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const speeds = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      // Position on sphere surface
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 3.0 + Math.random() * 0.5; // Just outside Sun radius (3.0)
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      speeds[i] = 0.2 + Math.random() * 0.5;
    }
    return [pos, speeds];
  }, []);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    
    // Animate shader time
    if (sunMaterial) {
      sunMaterial.uniforms.uTime.value = elapsed;
    }
    
    // Slow sun rotation
    if (meshRef.current) {
      meshRef.current.rotation.y = elapsed * 0.02;
    }

    // Solar flares animation (pulsing particles)
    if (coronaParticlesRef.current) {
      const positions = coronaParticlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3;
        const x = positions[idx];
        const y = positions[idx+1];
        const z = positions[idx+2];
        const dist = Math.sqrt(x*x + y*y + z*z);
        
        // Push outward, then reset
        const scale = 1.0 + Math.sin(elapsed * particleSpeeds[i] * 2) * 0.05;
        const normX = x / dist;
        const normY = y / dist;
        const normZ = z / dist;

        positions[idx] = normX * (3.0 + scale * 0.4);
        positions[idx+1] = normY * (3.0 + scale * 0.4);
        positions[idx+2] = normZ * (3.0 + scale * 0.4);
      }
      coronaParticlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Sun mesh with custom shader */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[3.0, 64, 64]} />
        <primitive object={sunMaterial} attach="material" />
      </mesh>

      {/* Sun Light source casting physical light outward */}
      <pointLight position={[0, 0, 0]} intensity={started ? 4.0 : 0.01} distance={200} decay={1.0} color="#ffddaa" />

      {/* Corona flares (Point particles) */}
      <points ref={coronaParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlePositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#ff5500"
          size={0.12}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};

// 3. Planet Component
const Planet = ({
  name,
  radius,
  size,
  orbitSpeed,
  color,
  hasAtmosphere,
  atmosphereColor,
  hasRings,
  ringType, // 'saturn' or 'neptune'
  hudStats,
  hudDesc,
  onWarp,
  focusedPlanet,
  isWarping
}) => {
  const orbitGroupRef = useRef();
  const bodyRef = useRef();
  const cloudRef = useRef();

  // Create procedural textures on canvas to avoid loading external assets
  const planetTexture = useMemo(() => {
    if (name === 'Jupiter') {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      grad.addColorStop(0.0, '#362115');
      grad.addColorStop(0.12, '#664530');
      grad.addColorStop(0.25, '#9c795f');
      grad.addColorStop(0.38, '#cfaf97');
      grad.addColorStop(0.5, '#7d5236');
      grad.addColorStop(0.62, '#5e371f');
      grad.addColorStop(0.75, '#9c795f');
      grad.addColorStop(0.88, '#cfaf97');
      grad.addColorStop(1.0, '#362115');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1024, 512);
      
      // Draw wavy bands
      for (let y = 10; y < 500; y += 15) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.sin(y * 0.05) * 0.07})`;
        ctx.fillRect(0, y, 1024, 6);
      }

      // Great Red Spot
      ctx.fillStyle = '#9e301b';
      ctx.beginPath();
      ctx.ellipse(650, 340, 48, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      
      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    }
    return null;
  }, [name]);

  // Saturn / Neptune ring texture
  const ringTexture = useMemo(() => {
    if (hasRings) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 512, 0);

      if (ringType === 'saturn') {
        grad.addColorStop(0.0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.1, 'rgba(179, 161, 137, 0.1)');
        grad.addColorStop(0.3, 'rgba(217, 203, 182, 0.75)');
        grad.addColorStop(0.48, 'rgba(130, 117, 98, 0.85)');
        grad.addColorStop(0.51, 'rgba(0,0,0,0)'); // Cassini Division
        grad.addColorStop(0.55, 'rgba(196, 181, 157, 0.8)');
        grad.addColorStop(0.85, 'rgba(145, 129, 106, 0.5)');
        grad.addColorStop(1.0, 'rgba(0,0,0,0)');
      } else { // Neptune faint rings
        grad.addColorStop(0.0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.4, 'rgba(130, 200, 255, 0.1)');
        grad.addColorStop(0.5, 'rgba(130, 200, 255, 0.45)');
        grad.addColorStop(0.6, 'rgba(130, 200, 255, 0.1)');
        grad.addColorStop(1.0, 'rgba(0,0,0,0)');
      }
      
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 1);
      const tex = new THREE.CanvasTexture(canvas);
      return tex;
    }
    return null;
  }, [hasRings, ringType]);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();

    // Orbital revolution (Disable when focused on this planet to allow examining it)
    if (orbitGroupRef.current && focusedPlanet !== name) {
      orbitGroupRef.current.rotation.y = elapsed * orbitSpeed;
    }

    // Body self-rotation
    if (bodyRef.current) {
      bodyRef.current.rotation.y = elapsed * 0.15;
    }

    // Earth cloud layer rotation
    if (cloudRef.current) {
      cloudRef.current.rotation.y = elapsed * 0.18;
      cloudRef.current.rotation.x = elapsed * 0.02;
    }
  });

  const isFocused = focusedPlanet === name;

  return (
    <group ref={orbitGroupRef}>
      {/* Render Planet Body and HUD container at its orbit distance */}
      <group position={[radius, 0, 0]}>
        {/* Planet sphere */}
        <mesh ref={bodyRef}>
          <sphereGeometry args={[size, 32, 32]} />
          {name === 'Jupiter' ? (
            <meshStandardMaterial map={planetTexture} roughness={0.8} metalness={0.1} />
          ) : (
            <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
          )}
        </mesh>

        {/* Earth Specific Cloud Layer */}
        {name === 'Earth' && (
          <mesh ref={cloudRef}>
            <sphereGeometry args={[size * 1.015, 32, 32]} />
            <meshStandardMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.35} 
              blending={THREE.NormalBlending} 
            />
          </mesh>
        )}

        {/* Atmosphere Glow Outer Shell */}
        {hasAtmosphere && (
          <mesh>
            <sphereGeometry args={[size * 1.04, 32, 32]} />
            <meshBasicMaterial 
              color={atmosphereColor} 
              transparent 
              opacity={0.15} 
              blending={THREE.AdditiveBlending}
              side={THREE.BackSide}
            />
          </mesh>
        )}

        {/* Saturn / Neptune Rings */}
        {hasRings && (
          <mesh rotation={[Math.PI / 2.3, 0, 0]}>
            <ringGeometry args={[size * 1.4, size * 2.3, 64]} />
            <meshStandardMaterial 
              map={ringTexture} 
              transparent 
              side={THREE.DoubleSide} 
              depthWrite={false} 
            />
          </mesh>
        )}

        {/* Interactive Holographic HUD */}
        {((!focusedPlanet && !isWarping) || isFocused) && (
          <PlanetHUD 
            name={name}
            stats={hudStats}
            description={hudDesc}
            onWarp={() => onWarp(name, radius)}
            isWarpedFocus={isFocused}
          />
        )}
      </group>
    </group>
  );
};

// 4. Warp Wormhole Tunnel Component
const WormholeTunnel = ({ active }) => {
  const meshRef = useRef();

  const wormholeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(WormholeShader.uniforms),
      vertexShader: WormholeShader.vertexShader,
      fragmentShader: WormholeShader.fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }, []);

  useFrame((state) => {
    if (active && wormholeMaterial) {
      wormholeMaterial.uniforms.uTime.value = state.clock.getElapsedTime();
    }
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} rotation={[0, 0, 0]}>
      {/* Cylindrical tunnel surrounding the camera during warp */}
      <cylinderGeometry args={[2.0, 2.0, 60, 32, 1, true]} />
      <primitive object={wormholeMaterial} attach="material" />
    </mesh>
  );
};

// 5. GSAP Camera path controller
const CameraController = ({ 
  started, 
  warping, 
  focusedPlanet, 
  focusedDistance,
  setWarping, 
  setFocusedPlanet 
}) => {
  const { camera } = useThree();
  const scroll = useScroll();
  const lookAtTarget = useRef(new THREE.Vector3(0, 0, 0));

  // CatmullRomSpline for cinematic scrolling travel
  const cameraPath = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 5, 20),      // Overview Sun
      new THREE.Vector3(6, 2, 13),      // Earth curve approach
      new THREE.Vector3(12, 1, 9),      // Earth focus point
      new THREE.Vector3(18, 2, -2),     // Mars curve approach
      new THREE.Vector3(24, 0.5, 5),    // Mars focus point
      new THREE.Vector3(31, 3, -15),    // Jupiter curve approach
      new THREE.Vector3(38, 1, -12),    // Jupiter focus point
      new THREE.Vector3(47, 4, 18),     // Saturn curve approach
      new THREE.Vector3(55, 1, 15),     // Saturn focus point
      new THREE.Vector3(65, 3, -10),    // Neptune curve approach
      new THREE.Vector3(75, 1.5, -8),   // Neptune focus point
    ]);
  }, []);

  // Precomputed look-at spline path
  const lookAtPath = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),       // Look at Sun
      new THREE.Vector3(12, 0, -2),     // Shift look toward Earth
      new THREE.Vector3(12, 0, 0),      // Look at Earth
      new THREE.Vector3(24, 0, 2),      // Shift look toward Mars
      new THREE.Vector3(24, 0, 0),      // Look at Mars
      new THREE.Vector3(38, 0, -5),     // Shift look toward Jupiter
      new THREE.Vector3(38, 0, 0),      // Look at Jupiter
      new THREE.Vector3(55, 0, 5),      // Shift look toward Saturn
      new THREE.Vector3(55, 0, 0),      // Look at Saturn
      new THREE.Vector3(75, 0, -5),     // Shift look toward Neptune
      new THREE.Vector3(75, 0, 0),      // Look at Neptune
    ]);
  }, []);

  // Set initial camera position on load
  useEffect(() => {
    camera.position.set(0, 3, 22);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  useFrame(() => {
    // 1. If we are currently zooming in a wormhole warp, GSAP overrides camera position
    if (warping) {
      camera.lookAt(0, 0, -10); // Keep camera looking straight down the wormhole tube
      return;
    }

    // 2. If we are currently focused close-up on a planet, OrbitControls handles camera input
    if (focusedPlanet) {
      // Keep looking at focused planet's offset position
      const planetPosX = focusedDistance;
      lookAtTarget.current.set(planetPosX, 0, 0);
      camera.lookAt(lookAtTarget.current);
      return;
    }

    // 3. Normal scroll-driven camera flight path
    if (started) {
      const scrollProgress = scroll.offset; // 0 to 1
      
      // Interpolate camera position on spline
      const newPos = cameraPath.getPointAt(scrollProgress);
      camera.position.lerp(newPos, 0.05);

      // Interpolate camera lookAt focus point on spline
      const newLook = lookAtPath.getPointAt(scrollProgress);
      lookAtTarget.current.lerp(newLook, 0.05);
      camera.lookAt(lookAtTarget.current);

      // Modulate audio lowpass filter according to scroll speed
      const speed = scroll.delta; // velocity
      SpaceAudio.modulateOnScroll(speed);
    }
  });

  return null;
};

// 6. Particle system for warp stars
const WarpParticles = ({ active }) => {
  const pointsRef = useRef();
  const particleCount = 1000;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const spd = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      // Radial ring layout radiating along depth Z
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 4.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = Math.sin(angle) * radius;
      pos[i * 3 + 2] = -Math.random() * 60; // Spread down tunnel
      spd[i] = 10 + Math.random() * 30; // speed down tunnel
    }
    return [pos, spd];
  }, []);

  useFrame((state, delta) => {
    if (active && pointsRef.current) {
      const posArr = pointsRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const idx = i * 3 + 2; // Z coordinate
        posArr[idx] += speeds[i] * delta * 5.0; // Accelerate toward camera
        
        // Reset particles that pass the camera (Z > 0)
        if (posArr[idx] > 2.0) {
          posArr[idx] = -60.0;
        }
      }
      pointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  if (!active) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#00f0ff"
        size={0.06}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

// 7. Main canvas orchestrator
const SolarSystemCanvas = ({
  started,
  warping,
  setWarping,
  focusedPlanet,
  setFocusedPlanet,
  focusedDistance,
  setFocusedDistance
}) => {

  const triggerWarpSequence = (planetName, orbitRadius) => {
    setWarping(true);
    SpaceAudio.warpSpeedStart();

    // 1. Position camera at the start of the wormhole tunnel
    const { camera } = THREE; // temp placeholder references if needed
    
    // GSAP Timeline for dramatic tunnel entry & exit animation
    const tl = gsap.timeline({
      onComplete: () => {
        // Warp complete: land near the planet
        setFocusedPlanet(planetName);
        setFocusedDistance(orbitRadius);
        setWarping(false);
        SpaceAudio.warpSpeedEnd();
      }
    });

    // Animate camera rotation/alignment to face down the cylinder
    tl.to(window, {
      duration: 2.2,
      ease: 'power2.inOut'
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <color attach="background" args={['#000000']} />
        
        {/* Deep background stars */}
        {!warping && (
          <Stars 
            radius={200} 
            depth={80} 
            count={6000} 
            factor={6} 
            saturation={0.5} 
            fade 
            speed={1} 
          />
        )}

        <ambientLight intensity={0.03} />

        {/* Scroll Control Wrapping */}
        <ScrollControls pages={6} damping={0.25} enabled={started && !focusedPlanet && !warping}>
          
          <CameraController 
            started={started}
            warping={warping}
            focusedPlanet={focusedPlanet}
            focusedDistance={focusedDistance}
            setWarping={setWarping}
            setFocusedPlanet={setFocusedPlanet}
          />

          {/* WebGL Cosmic Objects */}
          <group>
            {/* The Sun */}
            <Sun started={started} />

            {/* Planet orbits */}
            <OrbitPath radius={12} />
            <OrbitPath radius={24} />
            <OrbitPath radius={38} />
            <OrbitPath radius={55} />
            <OrbitPath radius={75} />

            {/* Earth: Warm & Hopeful */}
            <Planet
              name="Earth"
              radius={12}
              size={0.65}
              orbitSpeed={0.08}
              color="#1a53ff"
              hasAtmosphere
              atmosphereColor="#3388ff"
              hudStats={{ Distance: "1 AU", Diameter: "12,742 km", Gravity: "9.8 m/s²", Moons: "1" }}
              hudDesc="A warm, blue oasis of life, floating silently in the frozen cosmic void. Our fragile home."
              onWarp={triggerWarpSequence}
              focusedPlanet={focusedPlanet}
              isWarping={warping}
            />

            {/* Mars: Mysterious & Adventurous */}
            <Planet
              name="Mars"
              radius={24}
              size={0.45}
              orbitSpeed={0.06}
              color="#cc4422"
              hasAtmosphere
              atmosphereColor="#ff8844"
              hudStats={{ Distance: "1.52 AU", Diameter: "6,779 km", Gravity: "3.7 m/s²", Moons: "2" }}
              hudDesc="A cold, rusty desert of colossal canyons and dead volcanoes. The gateway to humanity's future."
              onWarp={triggerWarpSequence}
              focusedPlanet={focusedPlanet}
              isWarping={warping}
            />

            {/* Jupiter: Enormous & Intimidating */}
            <Planet
              name="Jupiter"
              radius={38}
              size={1.6}
              orbitSpeed={0.03}
              color="#cc8866" // procedural canvas texture used
              hasAtmosphere
              atmosphereColor="#eeaabb"
              hudStats={{ Distance: "5.2 AU", Diameter: "139,820 km", Gravity: "24.8 m/s²", Moons: "95" }}
              hudDesc="A gargantuan gas giant of swirling, colorful storms. Its colossal mass dominates the solar neighborhood."
              onWarp={triggerWarpSequence}
              focusedPlanet={focusedPlanet}
              isWarping={warping}
            />

            {/* Saturn: Breathtaking */}
            <Planet
              name="Saturn"
              radius={55}
              size={1.35}
              orbitSpeed={0.02}
              color="#ebd5b3"
              hasAtmosphere
              atmosphereColor="#fce4c8"
              hasRings
              ringType="saturn"
              hudStats={{ Distance: "9.58 AU", Diameter: "116,460 km", Gravity: "10.4 m/s²", Moons: "146" }}
              hudDesc="A majestic crown jewel of gas and ice, girdled by sweeping rings of dust, debris, and cosmic fragments."
              onWarp={triggerWarpSequence}
              focusedPlanet={focusedPlanet}
              isWarping={warping}
            />

            {/* Neptune: Lonely & Beautiful */}
            <Planet
              name="Neptune"
              radius={75}
              size={0.95}
              orbitSpeed={0.01}
              color="#2244bb"
              hasAtmosphere
              atmosphereColor="#66ccff"
              hasRings
              ringType="neptune"
              hudStats={{ Distance: "30.07 AU", Diameter: "49,244 km", Gravity: "11.15 m/s²", Moons: "16" }}
              hudDesc="A frozen, azure giant swept by supersonic winds. A beautiful, lonely sentinel at the edge of darkness."
              onWarp={triggerWarpSequence}
              focusedPlanet={focusedPlanet}
              isWarping={warping}
            />
          </group>

        </ScrollControls>

        {/* Wormhole tunnel portal sequence */}
        <WormholeTunnel active={warping} />
        <WarpParticles active={warping} />

        {/* Postprocessing effects for Bloom and glow */}
        <EffectComposer>
          <Bloom luminanceThreshold={0.25} luminanceSmoothing={0.9} height={300} intensity={1.5} />
        </EffectComposer>

        {/* Orbit controls enabled only close up to examine a focused planet */}
        {focusedPlanet && (
          <OrbitControls 
            enablePan={false} 
            minDistance={focusedPlanet === 'Jupiter' ? 3.0 : 1.5} 
            maxDistance={8.0}
            target={[focusedDistance, 0, 0]}
          />
        )}
      </Canvas>
    </div>
  );
};

export default SolarSystemCanvas;
