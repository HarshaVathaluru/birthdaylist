/**
 * Zenitude Workspace — Realistic, Simple & Clean 3D Visual Engine
 * Photorealistic Frosted Glass & Satin Metallic Celebration Spheres with Ambient Bokeh Depth
 */

(function () {
  'use strict';

  if (typeof THREE === 'undefined') {
    console.warn('[Zenitude 3D] Three.js not loaded.');
    return;
  }

  // ==========================================================================
  // 1. PAGE-SPECIFIC 3D HERO BACKGROUND ENGINE
  // ==========================================================================
  function initHero3D() {
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    // Create canvas container
    const canvasContainer = document.createElement('div');
    canvasContainer.id = 'hero-3d-wrapper';
    canvasContainer.style.position = 'absolute';
    canvasContainer.style.inset = '0';
    canvasContainer.style.pointerEvents = 'none';
    canvasContainer.style.zIndex = '0';
    canvasContainer.style.overflow = 'hidden';
    heroSection.insertBefore(canvasContainer, heroSection.firstChild);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, heroSection.clientWidth / heroSection.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(heroSection.clientWidth, heroSection.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    canvasContainer.appendChild(renderer.domElement);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 1.4 : 1.8);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(15, 18, 15);
    scene.add(keyLight);

    const path = window.location.pathname.toLowerCase();

    // DYNAMIC PAGE DISPATCHER: BUILD UNIQUE 3D SCENES FOR EACH PAGE
    let pageUpdater = null;

    if (path.includes('intent')) {
      // 🕊️ OUR INTENT: ZENITUDE TRANQUIL LOTUS PRISMS & SERENE FLUID CRYSTALS
      pageUpdater = setupIntent3DScene(scene, isDark);
    } else if (path.includes('founder') || path.includes('motive')) {
      // 👤 FOUNDER: QUANTUM INTELLIGENCE PERSPECTIVE & DATA STREAM RINGS
      pageUpdater = setupFounder3DScene(scene, isDark);
    } else if (path.includes('chat')) {
      // 💬 CIRCLE CHAT: CELEBRATION WISH LANTERNS & FLOATING RIBBONS
      pageUpdater = setupChat3DScene(scene, isDark);
    } else if (path.includes('memories')) {
      // 📸 MEMORIES: GOLDEN TIME-CAPSULE DUST & MEMORY CRYSTAL PRISMS
      pageUpdater = setupMemories3DScene(scene, isDark);
    } else {
      // 🏠 HOME: CELEBRATION PEARLS, METALLIC ORBITS & SUNBEAM BOKEH
      pageUpdater = setupHome3DScene(scene, isDark);
    }

    // Cursor Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetCamX = 0;
    let targetCamY = 0;

    window.addEventListener('mousemove', (e) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      mouseX = (e.clientX - halfW) * 0.0018;
      mouseY = (e.clientY - halfH) * 0.0018;
    });

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      targetCamX += (mouseX - targetCamX) * 0.05;
      targetCamY += (-mouseY - targetCamY) * 0.05;
      camera.position.x = targetCamX * 4;
      camera.position.y = targetCamY * 3;
      camera.lookAt(0, 0, 0);

      if (pageUpdater) {
        pageUpdater(elapsed);
      }

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      if (!heroSection) return;
      camera.aspect = heroSection.clientWidth / heroSection.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(heroSection.clientWidth, heroSection.clientHeight);
    });
  }

  // ==========================================================================
  // SCENE A: HOME (Celebration Pearls, Metallic Gyro Orbits & Sunbeam Dust)
  // ==========================================================================
  function setupHome3DScene(scene, isDark) {
    const sphereGroup = new THREE.Group();
    scene.add(sphereGroup);

    const sphereSpecs = [
      { x: -14, y: 4, z: -2, size: 2.4, color: 0xFF6B6B, roughness: 0.18, metalness: 0.4 },
      { x: -18, y: -2, z: 2, size: 1.4, color: 0xFFD93D, roughness: 0.12, metalness: 0.85 },
      { x: -11, y: -5, z: 0, size: 1.1, color: 0x4ECDC4, roughness: 0.25, metalness: 0.3 },
      { x: 15, y: 3.5, z: -1, size: 2.2, color: 0xFF8E53, roughness: 0.15, metalness: 0.6 },
      { x: 18, y: -3.5, z: 1, size: 1.6, color: 0xA78BFA, roughness: 0.2, metalness: 0.5 },
      { x: 12, y: -6, z: -2, size: 1.0, color: 0xFFD93D, roughness: 0.1, metalness: 0.9 },
      { x: -6, y: 7, z: -6, size: 1.2, color: 0xFFFFFF, roughness: 0.3, metalness: 0.2 },
      { x: 7, y: 8, z: -5, size: 1.3, color: 0xFF6B6B, roughness: 0.2, metalness: 0.4 }
    ];

    const spheres = sphereSpecs.map(spec => {
      const geo = new THREE.SphereGeometry(spec.size, 40, 40);
      const mat = new THREE.MeshStandardMaterial({
        color: isDark ? (spec.color === 0xFF6B6B ? 0xF472B6 : spec.color) : spec.color,
        roughness: spec.roughness,
        metalness: spec.metalness,
        transparent: true,
        opacity: isDark ? 0.92 : 0.88
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(spec.x, spec.y, spec.z);
      mesh.userData = {
        initY: spec.y,
        initX: spec.x,
        speed: 0.8 + Math.random() * 0.8,
        amp: 0.5 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2
      };
      sphereGroup.add(mesh);
      return mesh;
    });

    const ringMat = new THREE.MeshStandardMaterial({ color: 0xFBBF24, roughness: 0.15, metalness: 0.9, transparent: true, opacity: 0.75 });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(3.6, 0.08, 16, 64), ringMat);
    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.07, 16, 64), ringMat);
    scene.add(ring1, ring2);

    const bokehCount = 70;
    const bokehPos = new Float32Array(bokehCount * 3);
    for (let i = 0; i < bokehCount * 3; i += 3) {
      bokehPos[i] = (Math.random() - 0.5) * 44;
      bokehPos[i + 1] = (Math.random() - 0.5) * 26;
      bokehPos[i + 2] = (Math.random() - 0.5) * 20;
    }
    const bokehGeo = new THREE.BufferGeometry();
    bokehGeo.setAttribute('position', new THREE.BufferAttribute(bokehPos, 3));
    const bokehMat = new THREE.PointsMaterial({ color: isDark ? 0xFFFFFF : 0xFF8E53, size: 0.35, transparent: true, opacity: 0.6 });
    const bokeh = new THREE.Points(bokehGeo, bokehMat);
    scene.add(bokeh);

    return (elapsed) => {
      spheres.forEach(s => {
        s.position.y = s.userData.initY + Math.sin(elapsed * s.userData.speed + s.userData.offset) * s.userData.amp;
        s.rotation.y += 0.005;
      });
      ring1.position.set(spheres[0].position.x, spheres[0].position.y, spheres[0].position.z);
      ring1.rotation.z = elapsed * 0.25;
      ring2.position.set(spheres[3].position.x, spheres[3].position.y, spheres[3].position.z);
      ring2.rotation.z = -elapsed * 0.28;
      bokeh.rotation.y = elapsed * 0.02;
    };
  }

  // ==========================================================================
  // SCENE B: OUR INTENT (Serene Fluid Geometry & Floating Lotus Crystals)
  // ==========================================================================
  function setupIntent3DScene(scene, isDark) {
    const group = new THREE.Group();
    scene.add(group);

    // Iridescent Frosted Glass Polyhedrons (Peace of mind & meditation)
    const crystalSpecs = [
      { x: -15, y: 3, z: -1, size: 2.2, color: 0x4ECDC4, type: 'octa' },
      { x: -18, y: -4, z: 2, size: 1.5, color: 0xA78BFA, type: 'tetra' },
      { x: 14, y: 4, z: -2, size: 2.0, color: 0xF472B6, type: 'icosa' },
      { x: 17, y: -3, z: 1, size: 1.6, color: 0x38BDF8, type: 'octa' },
      { x: 0, y: 7, z: -5, size: 1.3, color: 0xFFD93D, type: 'tetra' }
    ];

    const crystals = crystalSpecs.map(spec => {
      let geo;
      if (spec.type === 'octa') geo = new THREE.OctahedronGeometry(spec.size, 0);
      else if (spec.type === 'tetra') geo = new THREE.TetrahedronGeometry(spec.size, 0);
      else geo = new THREE.IcosahedronGeometry(spec.size, 0);

      const mat = new THREE.MeshStandardMaterial({
        color: spec.color,
        roughness: 0.1,
        metalness: 0.2,
        transparent: true,
        opacity: 0.75,
        wireframe: false
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(spec.x, spec.y, spec.z);
      mesh.userData = { initY: spec.y, rotSpeed: 0.008 + Math.random() * 0.008 };
      group.add(mesh);
      return mesh;
    });

    // Calming Ethereal Ripple Rings (Concentric Zen Pond Ripples)
    const rippleCount = 3;
    const ripples = [];
    for (let r = 0; r < rippleCount; r++) {
      const rippleGeo = new THREE.TorusGeometry(5 + r * 2.2, 0.04, 16, 80);
      const rippleMat = new THREE.MeshBasicMaterial({ color: isDark ? 0x38BDF8 : 0x4ECDC4, transparent: true, opacity: 0.25 - r * 0.05 });
      const rippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
      rippleMesh.rotation.x = Math.PI / 2.3;
      group.add(rippleMesh);
      ripples.push(rippleMesh);
    }

    return (elapsed) => {
      crystals.forEach((c, i) => {
        c.position.y = c.userData.initY + Math.sin(elapsed * 0.7 + i) * 0.4;
        c.rotation.x = elapsed * c.userData.rotSpeed;
        c.rotation.y = elapsed * (c.userData.rotSpeed * 1.5);
      });
      ripples.forEach((rip, idx) => {
        rip.scale.setScalar(1 + Math.sin(elapsed * 0.8 + idx * 0.6) * 0.06);
        rip.rotation.z = elapsed * 0.05 * (idx % 2 === 0 ? 1 : -1);
      });
    };
  }

  // ==========================================================================
  // SCENE C: FOUNDER (Quantum Mathematical Lattice & Golden Synapse Grid)
  // ==========================================================================
  function setupFounder3DScene(scene, isDark) {
    const group = new THREE.Group();
    scene.add(group);

    // Floating Golden Intelligence Nodes
    const nodeCount = 50;
    const nodePos = new Float32Array(nodeCount * 3);
    for (let i = 0; i < nodeCount * 3; i += 3) {
      nodePos[i] = (Math.random() - 0.5) * 40;
      nodePos[i + 1] = (Math.random() - 0.5) * 24;
      nodePos[i + 2] = (Math.random() - 0.5) * 18;
    }
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
    const nodeMat = new THREE.PointsMaterial({
      color: 0xEA580C,
      size: 0.4,
      transparent: true,
      opacity: 0.85
    });
    const nodes = new THREE.Points(nodeGeo, nodeMat);
    group.add(nodes);

    // Precision Orbital Gyro Armatures (Engineering Rigor)
    const arm1 = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.06, 16, 80), new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.7 }));
    arm1.position.set(-14, 2, -2);
    arm1.rotation.x = Math.PI / 2.6;

    const arm2 = new THREE.Mesh(new THREE.TorusGeometry(5.8, 0.06, 16, 80), new THREE.MeshStandardMaterial({ color: 0xEA580C, metalness: 0.8, roughness: 0.15, transparent: true, opacity: 0.6 }));
    arm2.position.set(15, -2, -1);
    arm2.rotation.y = Math.PI / 3;

    group.add(arm1, arm2);

    return (elapsed) => {
      nodes.rotation.y = elapsed * 0.04;
      nodes.rotation.x = Math.sin(elapsed * 0.03) * 0.03;
      arm1.rotation.z = elapsed * 0.3;
      arm1.rotation.y = elapsed * 0.15;
      arm2.rotation.z = -elapsed * 0.25;
      arm2.rotation.x = elapsed * 0.12;
    };
  }

  // ==========================================================================
  // SCENE D: CIRCLE CHAT (Celebration Wish Lanterns & Glowing Message Orbs)
  // ==========================================================================
  function setupChat3DScene(scene, isDark) {
    const group = new THREE.Group();
    scene.add(group);

    // Rising Warm Wish Lantern Spheres
    const lanternCount = 12;
    const lanterns = [];
    for (let i = 0; i < lanternCount; i++) {
      const size = 0.8 + Math.random() * 1.2;
      const geo = new THREE.SphereGeometry(size, 24, 24);
      const isWarm = Math.random() > 0.4;
      const mat = new THREE.MeshStandardMaterial({
        color: isWarm ? 0xFF8E53 : 0xF472B6,
        emissive: isWarm ? 0xEA580C : 0xDB2777,
        emissiveIntensity: 0.4,
        roughness: 0.2,
        metalness: 0.5,
        transparent: true,
        opacity: 0.8
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set((Math.random() - 0.5) * 36, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 12);
      mesh.userData = {
        speedY: 0.2 + Math.random() * 0.3,
        wobble: Math.random() * Math.PI * 2
      };
      group.add(mesh);
      lanterns.push(mesh);
    }

    // Swirling Celebration Streamer Ribbon
    const ribbonGeo = new THREE.TorusGeometry(8, 0.06, 16, 100);
    const ribbonMat = new THREE.MeshBasicMaterial({ color: 0xFFD93D, transparent: true, opacity: 0.4 });
    const ribbon = new THREE.Mesh(ribbonGeo, ribbonMat);
    ribbon.rotation.x = Math.PI / 2.2;
    group.add(ribbon);

    return (elapsed) => {
      lanterns.forEach(l => {
        l.position.y += l.userData.speedY * 0.05;
        l.position.x += Math.sin(elapsed * 0.8 + l.userData.wobble) * 0.02;
        if (l.position.y > 14) {
          l.position.y = -14;
        }
      });
      ribbon.rotation.z = elapsed * 0.15;
      ribbon.rotation.y = elapsed * 0.08;
    };
  }

  // ==========================================================================
  // SCENE E: MEMORIES (Nostalgic Polaroid Crystals & Golden Memory Stardust)
  // ==========================================================================
  function setupMemories3DScene(scene, isDark) {
    const group = new THREE.Group();
    scene.add(group);

    // Floating Polaroid Photo Glass Rectangles / Flat Crystals
    const frameSpecs = [
      { x: -14, y: 3, z: -2, w: 2.2, h: 2.8, color: 0xFFD93D },
      { x: -17, y: -4, z: 1, w: 1.8, h: 2.4, color: 0xFF6B6B },
      { x: 14, y: 4, z: -1, w: 2.0, h: 2.6, color: 0x4ECDC4 },
      { x: 16, y: -3, z: 2, w: 1.9, h: 2.5, color: 0xA78BFA }
    ];

    const frames = frameSpecs.map(spec => {
      const geo = new THREE.BoxGeometry(spec.w, spec.h, 0.12);
      const mat = new THREE.MeshStandardMaterial({
        color: spec.color,
        metalness: 0.3,
        roughness: 0.15,
        transparent: true,
        opacity: 0.7
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(spec.x, spec.y, spec.z);
      mesh.userData = { initY: spec.y, rotSpeed: 0.01 + Math.random() * 0.008 };
      group.add(mesh);
      return mesh;
    });

    // Golden Nostalgic Stardust
    const stardustCount = 80;
    const stardustPos = new Float32Array(stardustCount * 3);
    for (let i = 0; i < stardustCount * 3; i += 3) {
      stardustPos[i] = (Math.random() - 0.5) * 42;
      stardustPos[i + 1] = (Math.random() - 0.5) * 24;
      stardustPos[i + 2] = (Math.random() - 0.5) * 16;
    }
    const stardustGeo = new THREE.BufferGeometry();
    stardustGeo.setAttribute('position', new THREE.BufferAttribute(stardustPos, 3));
    const stardustMat = new THREE.PointsMaterial({ color: 0xFBBF24, size: 0.38, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending });
    const stardust = new THREE.Points(stardustGeo, stardustMat);
    group.add(stardust);

    return (elapsed) => {
      frames.forEach((f, i) => {
        f.position.y = f.userData.initY + Math.sin(elapsed * 0.6 + i) * 0.35;
        f.rotation.y = Math.sin(elapsed * f.userData.rotSpeed * 20) * 0.25;
        f.rotation.z = Math.cos(elapsed * f.userData.rotSpeed * 15) * 0.15;
      });
      stardust.rotation.y = elapsed * 0.025;
    };
  }

  // ==========================================================================
  // 2. 3D HOLOGRAPHIC MILESTONE RADAR PRISM (Live Status Showcase)
  // ==========================================================================
  function initRadar3DPrism() {
    const radarContainer = document.getElementById('radar-3d-canvas-container');
    if (!radarContainer) return;

    const width = radarContainer.clientWidth || radarContainer.parentElement?.clientWidth || 700;
    const height = radarContainer.clientHeight || 230;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 13);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    radarContainer.appendChild(renderer.domElement);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Studio Lighting
    const amb = new THREE.AmbientLight(0xffffff, 1.8);
    scene.add(amb);

    const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.5);
    keyLight.position.set(8, 12, 10);
    scene.add(keyLight);

    const greenSignalLight = new THREE.PointLight(0x10B981, 4.0, 30);
    greenSignalLight.position.set(0, 0, 4);
    scene.add(greenSignalLight);

    const coralFillLight = new THREE.PointLight(isDark ? 0xF472B6 : 0xFF6B6B, 3.0, 30);
    coralFillLight.position.set(-8, -6, 4);
    scene.add(coralFillLight);

    // Group for the Holographic Prism
    const prismGroup = new THREE.Group();
    scene.add(prismGroup);

    // Outer Frosted Glass Octahedron (Milestone Core Prism)
    const prismGeo = new THREE.OctahedronGeometry(3.0, 0);
    const prismMat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x38BDF8 : 0x4ECDC4,
      roughness: 0.1,
      metalness: 0.4,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });
    const prismMesh = new THREE.Mesh(prismGeo, prismMat);
    prismGroup.add(prismMesh);

    // Inner Glowing Emerald Heart (Live Engine Beacon)
    const beaconGeo = new THREE.IcosahedronGeometry(1.5, 1);
    const beaconMat = new THREE.MeshStandardMaterial({
      color: 0x10B981,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x10B981,
      emissiveIntensity: 0.8
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    prismGroup.add(beaconMesh);

    // Gold Precision Gyro Ring
    const gyroGeo = new THREE.TorusGeometry(4.2, 0.1, 16, 64);
    const gyroMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      roughness: 0.15,
      metalness: 0.9
    });
    const gyroRing = new THREE.Mesh(gyroGeo, gyroMat);
    gyroRing.rotation.x = Math.PI / 2.5;
    prismGroup.add(gyroRing);

    // Coral Accent Ring
    const accentRingGeo = new THREE.TorusGeometry(4.8, 0.08, 16, 64);
    const accentRingMat = new THREE.MeshBasicMaterial({
      color: 0xFF6B6B,
      transparent: true,
      opacity: 0.7
    });
    const accentRing = new THREE.Mesh(accentRingGeo, accentRingMat);
    accentRing.rotation.y = Math.PI / 3;
    prismGroup.add(accentRing);

    // Radar Particles
    const radarParticlesCount = 35;
    const radarPartGeo = new THREE.BufferGeometry();
    const radarPartPos = new Float32Array(radarParticlesCount * 3);

    for (let i = 0; i < radarParticlesCount * 3; i += 3) {
      const radius = 3.2 + Math.random() * 2.8;
      const theta = Math.random() * Math.PI * 2;
      radarPartPos[i] = Math.cos(theta) * radius;
      radarPartPos[i + 1] = (Math.random() - 0.5) * 4;
      radarPartPos[i + 2] = Math.sin(theta) * radius;
    }

    radarPartGeo.setAttribute('position', new THREE.BufferAttribute(radarPartPos, 3));
    const radarPartMat = new THREE.PointsMaterial({
      color: 0x10B981,
      size: 0.35,
      transparent: true,
      opacity: 0.9
    });
    const radarPoints = new THREE.Points(radarPartGeo, radarPartMat);
    prismGroup.add(radarPoints);

    // Animation Loop
    const clock = new THREE.Clock();

    function animateRadar() {
      requestAnimationFrame(animateRadar);
      const elapsed = clock.getElapsedTime();

      prismMesh.rotation.y = elapsed * 0.6;
      prismMesh.rotation.x = Math.sin(elapsed * 0.4) * 0.2;

      beaconMesh.rotation.y = -elapsed * 0.9;
      beaconMesh.scale.setScalar(1 + Math.sin(elapsed * 3) * 0.12); // Heartbeat pulse

      gyroRing.rotation.z = elapsed * 0.4;
      gyroRing.rotation.y = elapsed * 0.2;

      accentRing.rotation.x = -elapsed * 0.3;

      radarPoints.rotation.y = elapsed * 0.5;

      greenSignalLight.intensity = 2.5 + Math.sin(elapsed * 3) * 1.5;

      renderer.render(scene, camera);
    }

    // Launch animation!
    animateRadar();

    // Resize
    window.addEventListener('resize', () => {
      if (!radarContainer) return;
      const w = radarContainer.clientWidth || radarContainer.parentElement?.clientWidth || 700;
      const h = radarContainer.clientHeight || 230;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  // ==========================================================================
  // 3. 3D CARD TILT & SPECULAR GLOSS EFFECT
  // ==========================================================================
  function init3DCardTilt() {
    const cards = document.querySelectorAll('.birthday-card-featured, .today-card, .value-card, .chat-form-card, .settings-card, .stat-card, .memory-card, .hero-stat-pill');

    cards.forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.style.transition = 'transform 0.15s ease-out, box-shadow 0.2s ease-out';

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  // ==========================================================================
  // 4. MEMORIES GALLERY FILTER INTERACTION
  // ==========================================================================
  function initMemoriesFilter() {
    const filterBtns = document.querySelectorAll('.memory-filter-btn');
    const memoryCards = document.querySelectorAll('.memory-card');

    if (!filterBtns.length || !memoryCards.length) return;

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const cat = btn.getAttribute('data-filter');

        memoryCards.forEach(card => {
          const cardCat = card.getAttribute('data-category');
          if (cat === 'all' || cardCat === cat) {
            card.style.display = 'flex';
            setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'scale(1)'; }, 20);
          } else {
            card.style.opacity = '0';
            card.style.transform = 'scale(0.96)';
            setTimeout(() => { card.style.display = 'none'; }, 200);
          }
        });
      });
    });
  }

  // ==========================================================================
  // 5. INTENT PAGE: 3D PRECISION ENGINEERING GYROSCOPE SCULPTURE
  // ==========================================================================
  function initIntent3DSculpture() {
    const container = document.getElementById('intent-3d-canvas-container');
    if (!container) return;

    const width = container.clientWidth || 450;
    const height = 440;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Studio Lights
    const amb = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(amb);

    const dirLight1 = new THREE.DirectionalLight(0xFFFFFF, 2.5);
    dirLight1.position.set(12, 16, 14);
    scene.add(dirLight1);

    const orangeRimLight = new THREE.PointLight(0xEA580C, 3.5, 35);
    orangeRimLight.position.set(-10, -8, 8);
    scene.add(orangeRimLight);

    const goldLight = new THREE.PointLight(0xF59E0B, 2.8, 35);
    goldLight.position.set(10, 8, -6);
    scene.add(goldLight);

    const sculptureGroup = new THREE.Group();
    scene.add(sculptureGroup);

    // Central Precision Core Sphere (Industrial Copper & Gold)
    const coreGeo = new THREE.IcosahedronGeometry(2.4, 2);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xEA580C,
      roughness: 0.15,
      metalness: 0.75,
      emissive: 0xC2410C,
      emissiveIntensity: 0.25
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    sculptureGroup.add(coreMesh);

    // Inner Faceted Diamond (Engineering Rigor)
    const innerGeo = new THREE.OctahedronGeometry(1.5, 0);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      wireframe: true,
      metalness: 0.9,
      roughness: 0.1
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    sculptureGroup.add(innerMesh);

    // Gimbal Ring 1 (Gold)
    const ring1Geo = new THREE.TorusGeometry(4.2, 0.12, 20, 80);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      roughness: 0.15,
      metalness: 0.9
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    sculptureGroup.add(ring1);

    // Gimbal Ring 2 (Dark Titanium / Silver)
    const ring2Geo = new THREE.TorusGeometry(5.4, 0.1, 20, 80);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: isDark ? 0x94A3B8 : 0x334155,
      roughness: 0.2,
      metalness: 0.8
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 2.8;
    sculptureGroup.add(ring2);

    // Gimbal Ring 3 (Outer Precision Ring)
    const ring3Geo = new THREE.TorusGeometry(6.6, 0.08, 20, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({
      color: 0xEA580C,
      roughness: 0.15,
      metalness: 0.85,
      transparent: true,
      opacity: 0.8
    });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 3;
    sculptureGroup.add(ring3);

    // Floating Engineering Sparks / Dust
    const sparkCount = 40;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount * 3; i += 3) {
      sparkPos[i] = (Math.random() - 0.5) * 16;
      sparkPos[i + 1] = (Math.random() - 0.5) * 16;
      sparkPos[i + 2] = (Math.random() - 0.5) * 12;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xEA580C,
      size: 0.35,
      transparent: true,
      opacity: 0.85
    });
    const sparks = new THREE.Points(sparkGeo, sparkMat);
    sculptureGroup.add(sparks);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    window.addEventListener('mousemove', (e) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      mouseX = (e.clientX - halfW) * 0.0015;
      mouseY = (e.clientY - halfH) * 0.0015;
    });

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      targetX += (mouseX - targetX) * 0.05;
      targetY += (-mouseY - targetY) * 0.05;

      sculptureGroup.rotation.y = elapsed * 0.35 + targetX * 2;
      sculptureGroup.rotation.x = Math.sin(elapsed * 0.25) * 0.15 + targetY * 2;

      innerMesh.rotation.y = -elapsed * 0.8;
      innerMesh.rotation.z = elapsed * 0.4;

      ring1.rotation.x = elapsed * 0.5;
      ring1.rotation.y = elapsed * 0.3;

      ring2.rotation.y = -elapsed * 0.4;
      ring2.rotation.z = elapsed * 0.25;

      ring3.rotation.z = elapsed * 0.2;

      sparks.rotation.y = elapsed * 0.1;

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      if (!container) return;
      const w = container.clientWidth || 450;
      const h = container.clientHeight || 440;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  // ==========================================================================
  // 6. FOUNDER PAGE: 3D NEURAL SYNAPSE MILESTONE MATRIX (Ambition Card Background)
  // ==========================================================================
  function initFounderNeuralMatrix() {
    const container = document.getElementById('founder-3d-matrix-canvas');
    if (!container) return;

    const width = container.clientWidth || container.parentElement?.clientWidth || 800;
    const height = container.clientHeight || 260;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(0, 0, 20);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const particleCount = 45;
    const particlesData = [];
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * 28;
      const y = (Math.random() - 0.5) * 16;
      const z = (Math.random() - 0.5) * 14;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Gold & Amber & Coral Colors
      const isGold = Math.random() > 0.4;
      colors[i * 3] = isGold ? 0.96 : 0.92;     // R
      colors[i * 3 + 1] = isGold ? 0.62 : 0.35; // G
      colors[i * 3 + 2] = isGold ? 0.05 : 0.05; // B

      particlesData.push({
        velocity: new THREE.Vector3((Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.03, (Math.random() - 0.5) * 0.02),
        numConnections: 0
      });
    }

    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const pMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.55,
      transparent: true,
      opacity: 0.85
    });

    const pointCloud = new THREE.Points(pGeo, pMat);
    particleGroup.add(pointCloud);

    // Dynamic Connecting Synapse Lines
    const lineGeo = new THREE.BufferGeometry();
    const linePositions = new Float32Array(particleCount * particleCount * 6);
    const lineColors = new Float32Array(particleCount * particleCount * 6);

    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending
    }));
    particleGroup.add(lineMat);

    const clock = new THREE.Clock();

    function animateMatrix() {
      requestAnimationFrame(animateMatrix);
      const elapsed = clock.getElapsedTime();

      let vertexpos = 0;
      let colorpos = 0;
      let numConnected = 0;

      const posArray = pointCloud.geometry.attributes.position.array;

      for (let i = 0; i < particleCount; i++) {
        // Move particles
        posArray[i * 3] += particlesData[i].velocity.x;
        posArray[i * 3 + 1] += particlesData[i].velocity.y;
        posArray[i * 3 + 2] += particlesData[i].velocity.z;

        // Bounce within bounds
        if (Math.abs(posArray[i * 3]) > 14) particlesData[i].velocity.x *= -1;
        if (Math.abs(posArray[i * 3 + 1]) > 8) particlesData[i].velocity.y *= -1;
        if (Math.abs(posArray[i * 3 + 2]) > 7) particlesData[i].velocity.z *= -1;

        // Connect nearby nodes
        for (let j = i + 1; j < particleCount; j++) {
          const dx = posArray[i * 3] - posArray[j * 3];
          const dy = posArray[i * 3 + 1] - posArray[j * 3 + 1];
          const dz = posArray[i * 3 + 2] - posArray[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < 6.5) {
            const alpha = 1.0 - dist / 6.5;

            linePositions[vertexpos++] = posArray[i * 3];
            linePositions[vertexpos++] = posArray[i * 3 + 1];
            linePositions[vertexpos++] = posArray[i * 3 + 2];

            linePositions[vertexpos++] = posArray[j * 3];
            linePositions[vertexpos++] = posArray[j * 3 + 1];
            linePositions[vertexpos++] = posArray[j * 3 + 2];

            lineColors[colorpos++] = 0.96 * alpha;
            lineColors[colorpos++] = 0.62 * alpha;
            lineColors[colorpos++] = 0.05 * alpha;

            lineColors[colorpos++] = 0.92 * alpha;
            lineColors[colorpos++] = 0.35 * alpha;
            lineColors[colorpos++] = 0.05 * alpha;

            numConnected++;
          }
        }
      }

      pointCloud.geometry.attributes.position.needsUpdate = true;
      lineMat.geometry.attributes.position.needsUpdate = true;
      lineMat.geometry.attributes.color.needsUpdate = true;
      lineMat.geometry.setDrawRange(0, numConnected * 2);

      particleGroup.rotation.y = elapsed * 0.08;
      particleGroup.rotation.x = Math.sin(elapsed * 0.05) * 0.05;

      renderer.render(scene, camera);
    }

    animateMatrix();

    window.addEventListener('resize', () => {
      if (!container) return;
      const w = container.clientWidth || container.parentElement?.clientWidth || 800;
      const h = container.clientHeight || 260;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  // ==========================================================================
  // 7. FOUNDER PAGE: INTERACTIVE 3D AUTONOMOUS QUANTUM CORE
  // ==========================================================================
  function initFounderQuantumCore() {
    const container = document.getElementById('founder-quantum-3d-canvas');
    if (!container) return;

    const width = container.clientWidth || container.parentElement?.clientWidth || 700;
    const height = container.clientHeight || 380;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 22);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    // Studio Lights
    const amb = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(amb);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(12, 18, 15);
    scene.add(dirLight);

    const orangePoint = new THREE.PointLight(0xEA580C, 4, 30);
    orangePoint.position.set(-8, -6, 8);
    scene.add(orangePoint);

    const goldPoint = new THREE.PointLight(0xF59E0B, 3.5, 30);
    goldPoint.position.set(8, 8, -6);
    scene.add(goldPoint);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Quantum Core (Ruby/Amber Geometric Polyhedron)
    const coreGeo = new THREE.IcosahedronGeometry(2.6, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xEA580C,
      roughness: 0.12,
      metalness: 0.85,
      emissive: 0x9A3412,
      emissiveIntensity: 0.35,
      wireframe: false
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(core);

    // 2. Inner Golden Geometric Lattice
    const innerGeo = new THREE.OctahedronGeometry(1.6, 0);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0xF59E0B,
      metalness: 0.95,
      roughness: 0.08,
      wireframe: true
    });
    const innerLattice = new THREE.Mesh(innerGeo, innerMat);
    mainGroup.add(innerLattice);

    // 3. Triple Orbital Gimbal Rings (Autonomous Automation Orbits)
    const ring1Geo = new THREE.TorusGeometry(4.8, 0.12, 20, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.9, roughness: 0.15 });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    mainGroup.add(ring1);

    const ring2Geo = new THREE.TorusGeometry(6.2, 0.1, 20, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({ color: 0xEA580C, metalness: 0.85, roughness: 0.2 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    mainGroup.add(ring2);

    const ring3Geo = new THREE.TorusGeometry(7.6, 0.08, 20, 100);
    const ring3Mat = new THREE.MeshStandardMaterial({ color: isDark ? 0x38BDF8 : 0x0D9488, metalness: 0.8, roughness: 0.2, transparent: true, opacity: 0.75 });
    const ring3 = new THREE.Mesh(ring3Geo, ring3Mat);
    ring3.rotation.y = Math.PI / 2.5;
    mainGroup.add(ring3);

    // 4. Orbital Intelligence Satellites (Tiny Glowing Orbs)
    const satCount = 6;
    const satellites = [];
    for (let s = 0; s < satCount; s++) {
      const satGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const satMat = new THREE.MeshStandardMaterial({
        color: s % 2 === 0 ? 0xF59E0B : 0x10B981,
        emissive: s % 2 === 0 ? 0xD97706 : 0x059669,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        metalness: 0.8
      });
      const sat = new THREE.Mesh(satGeo, satMat);
      sat.userData = {
        radius: 4.8 + (s % 3) * 1.4,
        speed: 0.8 + s * 0.2,
        phase: (s / satCount) * Math.PI * 2
      };
      mainGroup.add(sat);
      satellites.push(sat);
    }

    // 5. Ambient Quantum Particles / Stardust
    const partCount = 50;
    const partGeo = new THREE.BufferGeometry();
    const partPos = new Float32Array(partCount * 3);
    for (let p = 0; p < partCount * 3; p += 3) {
      partPos[p] = (Math.random() - 0.5) * 22;
      partPos[p + 1] = (Math.random() - 0.5) * 18;
      partPos[p + 2] = (Math.random() - 0.5) * 16;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(partPos, 3));
    const partMat = new THREE.PointsMaterial({
      color: 0xEA580C,
      size: 0.4,
      transparent: true,
      opacity: 0.8
    });
    const stardust = new THREE.Points(partGeo, partMat);
    mainGroup.add(stardust);

    // Mouse Drag & Hover Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    container.addEventListener('mousemove', (e) => {
      const rect = container.getBoundingClientRect();
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      mouseX = cx * 0.003;
      mouseY = cy * 0.003;
    });

    container.addEventListener('mouseleave', () => {
      mouseX = 0;
      mouseY = 0;
    });

    const clock = new THREE.Clock();

    function animate() {
      requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      targetX += (mouseX - targetX) * 0.06;
      targetY += (mouseY - targetY) * 0.06;

      mainGroup.rotation.y = elapsed * 0.3 + targetX * 3;
      mainGroup.rotation.x = Math.sin(elapsed * 0.2) * 0.15 + targetY * 3;

      core.rotation.y = -elapsed * 0.5;
      core.rotation.z = elapsed * 0.25;

      innerLattice.rotation.y = elapsed * 0.8;
      innerLattice.rotation.x = -elapsed * 0.6;

      ring1.rotation.x = elapsed * 0.45;
      ring1.rotation.y = elapsed * 0.25;

      ring2.rotation.y = -elapsed * 0.35;
      ring2.rotation.z = elapsed * 0.3;

      ring3.rotation.z = elapsed * 0.2;
      ring3.rotation.x = -elapsed * 0.15;

      // Move satellites along orbits
      satellites.forEach(sat => {
        const theta = elapsed * sat.userData.speed + sat.userData.phase;
        sat.position.x = Math.cos(theta) * sat.userData.radius;
        sat.position.y = Math.sin(theta * 1.3) * (sat.userData.radius * 0.4);
        sat.position.z = Math.sin(theta) * sat.userData.radius;
      });

      stardust.rotation.y = elapsed * 0.08;

      renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
      if (!container) return;
      const w = container.clientWidth || 700;
      const h = container.clientHeight || 380;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
  }

  // ==========================================================================
  // 8. UNIVERSAL MOBILE NAVIGATION TOGGLE
  // ==========================================================================
  function initMobileNavigation() {
    const toggleBtn = document.getElementById('mobile-nav-toggle');
    const navLinks = document.getElementById('nav-links');

    if (!toggleBtn || !navLinks) return;

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = navLinks.classList.toggle('mobile-open');
      toggleBtn.classList.toggle('open', isOpen);
    });

    // Close when clicking any nav link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-open');
        toggleBtn.classList.remove('open');
      });
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!toggleBtn.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('mobile-open');
        toggleBtn.classList.remove('open');
      }
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initHero3D();
    initRadar3DPrism();
    initIntent3DSculpture();
    initFounderNeuralMatrix();
    initFounderQuantumCore();
    init3DCardTilt();
    initMobileNavigation();
  });

  // Universal 3D Animated Centered Celebration Toast / Modal Engine
  window.showZenitudeNotification = function (options = {}) {
    const title = options.title || 'Success!';
    const message = options.message || '';
    const icon = options.icon || '✨';
    const type = options.type || 'success';
    const duration = options.duration !== undefined ? options.duration : 3500;

    let existing = document.getElementById('zen-centered-3d-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'zen-centered-3d-toast';
    toast.className = 'zen-3d-toast-overlay';
    toast.innerHTML = `
      <div class="zen-3d-toast-card">
        <div class="zen-3d-toast-icon-wrapper">
          <div class="zen-3d-toast-pulse-ring"></div>
          <div class="zen-3d-toast-icon">${icon}</div>
        </div>
        <h3 class="zen-3d-toast-title">${title}</h3>
        <p class="zen-3d-toast-message">${message}</p>
        <button type="button" class="zen-3d-toast-btn">
          <span>✨ Continue</span>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    if (type === 'success' || type === 'celebrate') {
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 45,
          spread: 70,
          origin: { y: 0.5 }
        });
      }
    }

    requestAnimationFrame(() => {
      toast.classList.add('active');
    });

    const closeToast = () => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 350);
    };

    toast.querySelector('.zen-3d-toast-btn').addEventListener('click', closeToast);
    toast.addEventListener('click', (e) => {
      if (e.target === toast) closeToast();
    });

    if (duration > 0) {
      setTimeout(closeToast, duration);
    }
  };

  // Universal 3D Animated Centered Confirmation Dialog Engine
  window.showZenitudeConfirm = function (options = {}) {
    const title = options.title || 'Confirm Action';
    const message = options.message || 'Are you sure you want to proceed?';
    const icon = options.icon || '⚠️';
    const confirmText = options.confirmText || 'Yes, Proceed';
    const cancelText = options.cancelText || 'Cancel';
    const confirmBg = options.confirmColor || 'linear-gradient(135deg, #EF4444, #DC2626)';
    const onConfirm = options.onConfirm || (() => {});

    let existing = document.getElementById('zen-centered-3d-confirm');
    if (existing) existing.remove();

    const dialog = document.createElement('div');
    dialog.id = 'zen-centered-3d-confirm';
    dialog.className = 'zen-3d-toast-overlay';
    dialog.innerHTML = `
      <div class="zen-3d-toast-card">
        <div class="zen-3d-toast-icon-wrapper">
          <div class="zen-3d-toast-pulse-ring"></div>
          <div class="zen-3d-toast-icon">${icon}</div>
        </div>
        <h3 class="zen-3d-toast-title">${title}</h3>
        <p class="zen-3d-toast-message">${message}</p>
        <div style="display: flex; justify-content: center; gap: 12px; margin-top: 14px;">
          <button type="button" class="zen-3d-cancel-btn">
            <span>${cancelText}</span>
          </button>
          <button type="button" class="zen-3d-confirm-btn" style="background: ${confirmBg} !important;">
            <span>${confirmText}</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    requestAnimationFrame(() => {
      dialog.classList.add('active');
    });

    const closeDialog = () => {
      dialog.classList.remove('active');
      setTimeout(() => dialog.remove(), 350);
    };

    dialog.querySelector('.zen-3d-cancel-btn').addEventListener('click', closeDialog);
    dialog.querySelector('.zen-3d-confirm-btn').addEventListener('click', () => {
      closeDialog();
      onConfirm();
    });

    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) closeDialog();
    });
  };

})();
