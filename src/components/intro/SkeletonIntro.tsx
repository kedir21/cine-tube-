import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Film, Play, Sparkles, X, FastForward } from 'lucide-react';

interface SkeletonIntroProps {
  onComplete: () => void;
}

export const SkeletonIntro: React.FC<SkeletonIntroProps> = ({ onComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'animating' | 'logo' | 'ending'>('animating');
  const [isSkipped, setIsSkipped] = useState(false);
  const animFrameRef = useRef<number | null>(null);

  const handleSkip = useCallback(() => {
    setIsSkipped(true);
    setPhase('ending');
    try {
      localStorage.setItem('cinetube_intro_viewed', 'true');
    } catch {
      // ignore
    }
    setTimeout(() => {
      onComplete();
    }, 300);
  }, [onComplete]);

  // Reduced motion check
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      handleSkip();
    }
  }, [handleSkip]);

  // Keyboard shortcut: ESC skips intro
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container || isSkipped) return;

    // Detect software WebGL safely
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x09090b, 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 6.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment map via PMREMGenerator
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;
    pmremGenerator.dispose();

    // Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x18181b, 1.2);
    scene.add(ambientLight);

    // Warm Key Light (Crimson/Amber)
    const keyLight = new THREE.DirectionalLight(0xef4444, 4.5);
    keyLight.position.set(3, 4, 4);
    keyLight.castShadow = !isSoftwareGl;
    scene.add(keyLight);

    // Cool Rim Light (Cyan/Steel)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 3.2);
    rimLight.position.set(-3.5, 2.5, -3);
    scene.add(rimLight);

    // Top Crown Light
    const topLight = new THREE.SpotLight(0xffffff, 3.0, 15, Math.PI / 4, 0.4);
    topLight.position.set(0, 6, 2);
    scene.add(topLight);

    // Eye Ember Lights (Volumetric point lights)
    const eyeLightLeft = new THREE.PointLight(0xff2222, 1.5, 2);
    const eyeLightRight = new THREE.PointLight(0xff2222, 1.5, 2);
    eyeLightLeft.position.set(-0.35, 0.85, 0.8);
    eyeLightRight.position.set(0.35, 0.85, 0.8);
    scene.add(eyeLightLeft);
    scene.add(eyeLightRight);

    // Contact shadow beneath skeleton
    const shadowGeo = new THREE.PlaneGeometry(6, 6);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d')!;
    const grad = shadowCtx.createRadialGradient(64, 64, 5, 64, 64, 60);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.5, 'rgba(0,0,0,0.3)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    shadowCtx.fillStyle = grad;
    shadowCtx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.2;
    scene.add(shadowPlane);

    // Materials
    // Bone Material with subtle subsurface feel and sheen
    const boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xe4e4e7, // bone off-white
      roughness: 0.35,
      metalness: 0.1,
      envMapIntensity: 1.2,
    });

    const darkCavityMaterial = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.9,
      metalness: 0.05,
    });

    const goldTrimMaterial = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.2,
      metalness: 0.85,
      envMapIntensity: 2.0,
    });

    // Composite 3D Skeleton Assembly Group
    const skeletonGroup = new THREE.Group();
    scene.add(skeletonGroup);

    // 1. Skull Cranium (Dome & Temples)
    const craniumGroup = new THREE.Group();
    craniumGroup.position.y = 0.9;
    skeletonGroup.add(craniumGroup);

    // Upper brain vault
    const craniumGeo = new THREE.SphereGeometry(0.85, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.7);
    craniumGeo.scale(1, 1.15, 1.1);
    const craniumMesh = new THREE.Mesh(craniumGeo, boneMaterial);
    craniumGroup.add(craniumMesh);

    // Brow Ridge (Supraorbital Torus)
    const browGeo = new THREE.CylinderGeometry(0.72, 0.76, 0.18, 24, 1, false, -Math.PI * 0.45, Math.PI * 0.9);
    browGeo.rotateZ(Math.PI / 2);
    const browMesh = new THREE.Mesh(browGeo, boneMaterial);
    browMesh.position.set(0, -0.05, 0.65);
    craniumGroup.add(browMesh);

    // Eye Orbits (Sockets)
    const eyeOrbitGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.35, 16);
    eyeOrbitGeo.rotateX(Math.PI / 2);

    const leftOrbit = new THREE.Mesh(eyeOrbitGeo, darkCavityMaterial);
    leftOrbit.position.set(-0.35, -0.15, 0.7);
    craniumGroup.add(leftOrbit);

    const rightOrbit = new THREE.Mesh(eyeOrbitGeo, darkCavityMaterial);
    rightOrbit.position.set(0.35, -0.15, 0.7);
    craniumGroup.add(rightOrbit);

    // Glowing Eye Pupil Embers (Cinematic flare)
    const pupilGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.35, -0.15, 0.75);
    craniumGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.35, -0.15, 0.75);
    craniumGroup.add(rightPupil);

    // Nasal Aperture (Piriform Aperture)
    const noseGeo = new THREE.ConeGeometry(0.12, 0.3, 4);
    noseGeo.rotateX(Math.PI);
    const noseMesh = new THREE.Mesh(noseGeo, darkCavityMaterial);
    noseMesh.position.set(0, -0.32, 0.85);
    craniumGroup.add(noseMesh);

    // Zygomatic Arches (Cheekbones)
    const cheekGeo = new THREE.TorusGeometry(0.55, 0.08, 12, 24, Math.PI * 0.5);
    const leftCheek = new THREE.Mesh(cheekGeo, boneMaterial);
    leftCheek.position.set(-0.3, -0.28, 0.45);
    leftCheek.rotation.set(0.2, 0.4, 0.2);
    craniumGroup.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, boneMaterial);
    rightCheek.position.set(0.3, -0.28, 0.45);
    rightCheek.rotation.set(0.2, -0.4, -0.2);
    craniumGroup.add(rightCheek);

    // Upper Jaw (Maxilla & Upper Teeth Arch)
    const maxillaGeo = new THREE.BoxGeometry(0.55, 0.22, 0.35);
    const maxillaMesh = new THREE.Mesh(maxillaGeo, boneMaterial);
    maxillaMesh.position.set(0, -0.52, 0.65);
    craniumGroup.add(maxillaMesh);

    // Upper Teeth (Instanced small cylinders)
    const upperTeethGroup = new THREE.Group();
    for (let i = -3; i <= 3; i++) {
      const toothGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.08, 8);
      const tooth = new THREE.Mesh(toothGeo, boneMaterial);
      const angle = (i / 3) * 0.5;
      tooth.position.set(Math.sin(angle) * 0.22, -0.65, 0.7 + Math.cos(angle) * 0.1);
      upperTeethGroup.add(tooth);
    }
    craniumGroup.add(upperTeethGroup);

    // 2. Articulated Mandible (Lower Jawbone)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, 0.2, 0.45); // Jaw hinge pivot
    skeletonGroup.add(jawGroup);

    const jawBaseGeo = new THREE.TorusGeometry(0.42, 0.09, 12, 24, Math.PI * 0.7);
    jawBaseGeo.rotateX(Math.PI / 2);
    jawBaseGeo.rotateZ(-Math.PI * 0.85);
    const jawBase = new THREE.Mesh(jawBaseGeo, boneMaterial);
    jawBase.position.set(0, -0.15, 0.1);
    jawGroup.add(jawBase);

    // Chin (Mental Protuberance)
    const chinGeo = new THREE.BoxGeometry(0.26, 0.18, 0.2);
    const chinMesh = new THREE.Mesh(chinGeo, boneMaterial);
    chinMesh.position.set(0, -0.15, 0.42);
    jawGroup.add(chinMesh);

    // Lower Teeth
    const lowerTeethGroup = new THREE.Group();
    for (let i = -3; i <= 3; i++) {
      const toothGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.07, 8);
      const tooth = new THREE.Mesh(toothGeo, boneMaterial);
      const angle = (i / 3) * 0.45;
      tooth.position.set(Math.sin(angle) * 0.2, -0.05, 0.35 + Math.cos(angle) * 0.08);
      lowerTeethGroup.add(tooth);
    }
    jawGroup.add(lowerTeethGroup);

    // 3. Cervical Spine & Thoracic Vertebrae Column
    const spineGroup = new THREE.Group();
    spineGroup.position.set(0, 0, 0);
    skeletonGroup.add(spineGroup);

    const vertebraeMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < 9; i++) {
      const vertGeo = new THREE.CylinderGeometry(0.14 - i * 0.005, 0.16 - i * 0.005, 0.14, 16);
      const vertMesh = new THREE.Mesh(vertGeo, boneMaterial);
      vertMesh.position.set(0, 0.1 - i * 0.22, 0.05);

      // Transverse processes (side wings)
      const wingGeo = new THREE.BoxGeometry(0.45, 0.06, 0.1);
      const wingMesh = new THREE.Mesh(wingGeo, boneMaterial);
      wingMesh.position.set(0, 0, -0.05);
      vertMesh.add(wingMesh);

      spineGroup.add(vertMesh);
      vertebraeMeshes.push(vertMesh);
    }

    // 4. Clavicles & Sternum (Collarbone and Breastplate)
    const clavicleGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.4, 12);
    clavicleGeo.rotateZ(Math.PI / 2);
    const clavicle = new THREE.Mesh(clavicleGeo, boneMaterial);
    clavicle.position.set(0, -0.15, 0.45);
    skeletonGroup.add(clavicle);

    // Central Sternum
    const sternumGeo = new THREE.BoxGeometry(0.2, 0.85, 0.08);
    const sternumMesh = new THREE.Mesh(sternumGeo, boneMaterial);
    sternumMesh.position.set(0, -0.65, 0.62);
    skeletonGroup.add(sternumMesh);

    // 5. Rib Cage (6 pairs of bilateral curved ribs)
    const ribsGroup = new THREE.Group();
    skeletonGroup.add(ribsGroup);

    for (let r = 0; r < 6; r++) {
      const ribRadius = 0.65 + r * 0.08;
      const ribThickness = 0.045;
      const ribGeo = new THREE.TorusGeometry(ribRadius, ribThickness, 8, 24, Math.PI * 0.8);
      ribGeo.rotateX(Math.PI / 2.3);

      // Left Rib
      const leftRib = new THREE.Mesh(ribGeo, boneMaterial);
      leftRib.position.set(-0.25, -0.35 - r * 0.18, 0.1);
      leftRib.rotation.set(0.15 + r * 0.04, -0.2, 0.3);
      ribsGroup.add(leftRib);

      // Right Rib
      const rightRib = new THREE.Mesh(ribGeo, boneMaterial);
      rightRib.position.set(0.25, -0.35 - r * 0.18, 0.1);
      rightRib.rotation.set(0.15 + r * 0.04, 0.2, -0.3);
      rightRib.scale.x = -1;
      ribsGroup.add(rightRib);
    }

    // 6. Floating Cinematic Ember / Film Dust Particles
    const particleCount = isSoftwareGl ? 80 : 350;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleVel = new Float32Array(particleCount * 3);

    for (let p = 0; p < particleCount; p++) {
      particlePos[p * 3] = (Math.random() - 0.5) * 8;
      particlePos[p * 3 + 1] = (Math.random() - 0.5) * 6;
      particlePos[p * 3 + 2] = (Math.random() - 0.5) * 6;

      particleVel[p * 3] = (Math.random() - 0.5) * 0.005;
      particleVel[p * 3 + 1] = Math.random() * 0.008 + 0.002; // slow rise
      particleVel[p * 3 + 2] = (Math.random() - 0.5) * 0.005;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    // Particle Canvas Texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 32;
    pCanvas.height = 32;
    const pCtx = pCanvas.getContext('2d')!;
    const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
    pGrad.addColorStop(0, 'rgba(255, 68, 68, 1)');
    pGrad.addColorStop(0.3, 'rgba(239, 68, 68, 0.8)');
    pGrad.addColorStop(0.8, 'rgba(220, 38, 38, 0.2)');
    pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    pCtx.fillStyle = pGrad;
    pCtx.fillRect(0, 0, 32, 32);
    const pTexture = new THREE.CanvasTexture(pCanvas);
    pTexture.colorSpace = THREE.SRGBColorSpace;

    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // Initial Assembly Offsets for Cinematic Entrance
    craniumGroup.position.y = 2.4;
    craniumGroup.rotation.x = -0.4;
    jawGroup.position.y = -0.5;
    jawGroup.rotation.x = 0.5;
    ribsGroup.scale.set(0.2, 0.2, 0.2);
    skeletonGroup.rotation.y = -0.5;

    // Animation Loop with Clock
    const clock = new THREE.Clock();
    let startTime = performance.now();
    let isEndingTriggered = false;

    const render = () => {
      const elapsed = (performance.now() - startTime) / 1000;
      const delta = clock.getDelta();

      // Smooth kinematic assembly (MathUtils.damp)
      if (elapsed < 3.2) {
        // Skull snaps into true position
        craniumGroup.position.y = THREE.MathUtils.damp(craniumGroup.position.y, 0.9, 3.5, delta);
        craniumGroup.rotation.x = THREE.MathUtils.damp(craniumGroup.rotation.x, 0.05, 3.0, delta);

        // Jaw articulates and aligns
        const jawTargetAngle = elapsed > 1.2 && elapsed < 2.4 ? 0.22 : 0.0;
        jawGroup.rotation.x = THREE.MathUtils.damp(jawGroup.rotation.x, jawTargetAngle, 4.0, delta);
        jawGroup.position.y = THREE.MathUtils.damp(jawGroup.position.y, 0.2, 3.5, delta);

        // Ribs expand
        ribsGroup.scale.x = THREE.MathUtils.damp(ribsGroup.scale.x, 1.0, 3.0, delta);
        ribsGroup.scale.y = THREE.MathUtils.damp(ribsGroup.scale.y, 1.0, 3.0, delta);
        ribsGroup.scale.z = THREE.MathUtils.damp(ribsGroup.scale.z, 1.0, 3.0, delta);

        // Subtle slow camera push-in and orbit
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 4.2, 0.8, delta);
        camera.position.x = Math.sin(elapsed * 0.6) * 0.6;
        camera.position.y = 0.6 + Math.cos(elapsed * 0.4) * 0.2;
        camera.lookAt(0, 0.4, 0);

        // Rotating skeleton towards camera
        skeletonGroup.rotation.y = THREE.MathUtils.damp(skeletonGroup.rotation.y, 0.15 * Math.sin(elapsed * 0.8), 2.0, delta);

        // Eye glow pulsation
        const eyePulse = 1.2 + Math.sin(elapsed * 5.0) * 0.6;
        eyeLightLeft.intensity = eyePulse;
        eyeLightRight.intensity = eyePulse;
      } else if (elapsed >= 3.2 && elapsed < 4.2) {
        // Dramatic light sweep & dolly forward into logo phase
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 1.5, 4.0, delta);
        keyLight.intensity = THREE.MathUtils.damp(keyLight.intensity, 8.0, 4.0, delta);

        if (phase === 'animating') {
          setPhase('logo');
        }
      } else if (elapsed >= 4.2 && !isEndingTriggered) {
        isEndingTriggered = true;
        setPhase('ending');
        try {
          localStorage.setItem('cinetube_intro_viewed', 'true');
        } catch {
          // ignore
        }
        setTimeout(() => {
          onComplete();
        }, 800);
      }

      // Particle floating drift
      const positions = particleGeo.attributes.position.array as Float32Array;
      for (let p = 0; p < particleCount; p++) {
        positions[p * 3 + 1] += particleVel[p * 3 + 1];
        positions[p * 3] += particleVel[p * 3];
        if (positions[p * 3 + 1] > 3) {
          positions[p * 3 + 1] = -3;
        }
      }
      particleGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);

      if (!isSkipped) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup upon unmount
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      window.removeEventListener('resize', handleResize);

      // Dispose Three.js objects
      craniumGeo.dispose();
      browGeo.dispose();
      eyeOrbitGeo.dispose();
      pupilGeo.dispose();
      noseGeo.dispose();
      cheekGeo.dispose();
      maxillaGeo.dispose();
      jawBaseGeo.dispose();
      chinGeo.dispose();
      clavicleGeo.dispose();
      sternumGeo.dispose();
      particleGeo.dispose();
      shadowGeo.dispose();

      boneMaterial.dispose();
      darkCavityMaterial.dispose();
      goldTrimMaterial.dispose();
      pupilMat.dispose();
      particleMat.dispose();
      shadowMat.dispose();

      pTexture.dispose();
      shadowTex.dispose();
      envTexture.dispose();

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [handleSkip, isSkipped, onComplete, phase]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#09090b] transition-opacity duration-700 ${
        phase === 'ending' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 h-full w-full pointer-events-none" />

      {/* Top Bar: Skip Intro & Cinematic Indicator */}
      <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-2 text-zinc-400">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-600/20 text-red-500 border border-red-500/30">
            <Film className="h-3.5 w-3.5" />
          </div>
          <span className="text-[11px] font-mono tracking-widest uppercase text-zinc-400">
            CINETUBE 3D INTRO
          </span>
        </div>

        {/* Skip Intro Button */}
        <button
          onClick={handleSkip}
          className="group flex items-center gap-2 rounded-full border border-zinc-700/60 bg-zinc-900/80 hover:bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 hover:text-white backdrop-blur-md transition shadow-lg cursor-pointer pointer-events-auto"
        >
          <span>Skip Intro</span>
          <FastForward className="h-3.5 w-3.5 text-red-500 group-hover:translate-x-0.5 transition-transform" />
          <span className="hidden sm:inline font-mono text-[10px] text-zinc-500 ml-1">ESC</span>
        </button>
      </div>

      {/* Center Cinematic Reveal overlay during Logo Phase */}
      <div
        className={`relative z-20 flex flex-col items-center justify-center text-center transition-all duration-700 ${
          phase === 'logo'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="relative mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white shadow-2xl shadow-red-600/50 border border-red-400/40 animate-pulse">
          <Film className="h-10 w-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-wider text-white">
          CINE<span className="text-red-500">TUBE</span>
        </h1>
        <p className="mt-2 text-sm font-medium tracking-widest uppercase text-zinc-400">
          Cinema Reimagined · Powered by TMDB
        </p>
      </div>

      {/* Bottom Subtitle / Sound aesthetic tag */}
      <div className="absolute bottom-6 z-20 text-center pointer-events-none">
        <p className="text-[10px] uppercase font-mono tracking-widest text-zinc-600">
          Procedural 3D WebGL Studio Engine
        </p>
      </div>
    </div>
  );
};
