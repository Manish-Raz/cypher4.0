/**
 * LaunchX — Spatial 3D Hero Scene
 * High-performance WebGL scene featuring continuous abstract green/mint 3D shapes,
 * organic circular rotations, floating particles, and interactive pointer parallax.
 */
(function () {
  'use strict';

  const DISC_COUNT = 10;
  const ARC_RADIUS = 3.5;
  const ARC_CENTER_Y = -1.9;
  const ARC_START = -0.55;
  const ARC_END = Math.PI + 0.55;
  const ARC_SPAN = ARC_END - ARC_START;
  const ARC_SPEED = 0.065;

  function smoothEdge(progress) {
    const fade = 0.09;
    if (progress < fade) return progress / fade;
    if (progress > 1 - fade) return (1 - progress) / fade;
    return 1;
  }

  function initHeroScene() {
    const container = document.getElementById('storefyHeroCanvas') || document.getElementById('spatialHeroCanvasContainer');
    if (!container || typeof THREE === 'undefined') return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // User prefers reduced motion: render single static frame and do not loop
      renderStaticHero(container);
      return;
    }

    try {
      bootInteractiveHero(container);
    } catch (err) {
      console.warn('LaunchX 3D Hero initialization skipped:', err);
    }
  }

  function renderStaticHero(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight), 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    renderer.setPixelRatio(1);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dir = new THREE.DirectionalLight(0x7ee8c4, 2.0);
    dir.position.set(4, 5, 5);
    scene.add(dir);

    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#10b981'),
      emissive: new THREE.Color('#033522'),
      metalness: 0.35,
      roughness: 0.15,
      clearcoat: 1
    });

    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.5, 0.38, 96, 24, 2, 3), mat);
    knot.position.set(2.2, 0.2, 0);
    scene.add(knot);

    renderer.render(scene, camera);
  }

  function bootInteractiveHero(container) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 8.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    container.appendChild(renderer.domElement);

    // Dynamic Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));

    const dirLight = new THREE.DirectionalLight(0xd9fff2, 1.8);
    dirLight.position.set(4, 6, 5);
    scene.add(dirLight);

    const emeraldLight = new THREE.PointLight(0x22ff9f, 7.5, 14);
    emeraldLight.position.set(1.5, 1, -1);
    scene.add(emeraldLight);

    const cyanLight = new THREE.PointLight(0x3df0ff, 4.5, 15);
    cyanLight.position.set(-5, 2, 2);
    scene.add(cyanLight);

    const amberLight = new THREE.PointLight(0xffa834, 4.0, 12);
    amberLight.position.set(-3.5, -2.5, 4);
    scene.add(amberLight);

    const violetLight = new THREE.PointLight(0x6366f1, 3.5, 12);
    violetLight.position.set(4, -3, 3);
    scene.add(violetLight);

    // Master Materials
    const mintGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#10b981'),
      emissive: new THREE.Color('#033522'),
      emissiveIntensity: 0.55,
      metalness: 0.38,
      roughness: 0.12,
      iridescence: 1,
      iridescenceIOR: 1.85,
      iridescenceThicknessRange: [100, 1100],
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      envMapIntensity: 2.5,
      transparent: true,
      opacity: 0.68,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const coreTorusMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#0d9488'),
      emissive: new THREE.Color('#042e2b'),
      emissiveIntensity: 0.45,
      metalness: 0.5,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    const haloRingMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#7ee8c4'),
      emissive: new THREE.Color('#10b981'),
      emissiveIntensity: 0.35,
      metalness: 0.2,
      roughness: 0.25,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    // Master 3D Rig positioned nicely on the right side of hero content
    const masterRig = new THREE.Group();
    masterRig.position.set(1.4, 0.15, 0);
    scene.add(masterRig);

    // 1. Central Abstract Floating Torus Knot
    const knotGeom = new THREE.TorusKnotGeometry(1.25, 0.34, 120, 28, 2, 3);
    const centralKnot = new THREE.Mesh(knotGeom, coreTorusMaterial);
    centralKnot.position.set(0, 0, -0.4);
    masterRig.add(centralKnot);

    // 2. Surrounding Glowing Halo Rings
    const haloGeom = new THREE.TorusGeometry(2.35, 0.035, 24, 120);
    const haloRing1 = new THREE.Mesh(haloGeom, haloRingMaterial);
    haloRing1.rotation.x = Math.PI / 3;
    masterRig.add(haloRing1);

    const haloRing2 = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.025, 24, 120), haloRingMaterial);
    haloRing2.rotation.y = Math.PI / 2.5;
    masterRig.add(haloRing2);

    // 3. Circular Sweeping Arc of Rotating Mint Discs
    const discGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.055, 80, 1);
    const discs = [];
    for (let i = 0; i < DISC_COUNT; i++) {
      const group = new THREE.Group();
      const mesh = new THREE.Mesh(discGeom, mintGlassMaterial);
      group.add(mesh);
      masterRig.add(group);
      discs.push({ group, index: i });
    }

    // 4. Floating Glowing Particle Cloud
    const particleCount = 45;
    const particleGeom = new THREE.SphereGeometry(0.04, 12, 12);
    const particleMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#7ee8c4'),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const pMesh = new THREE.Mesh(particleGeom, particleMat);
      const radius = 2.5 + Math.random() * 2.8;
      const angle = Math.random() * Math.PI * 2;
      const yOffset = (Math.random() - 0.5) * 3.5;
      const speed = 0.2 + Math.random() * 0.4;
      pMesh.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius * 0.5);
      masterRig.add(pMesh);
      particles.push({ mesh: pMesh, radius, angle, yOffset, speed, seed: Math.random() * 10 });
    }

    // Pointer Parallax
    const pointer = { x: 0, y: 0 };
    window.addEventListener('pointermove', (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }, { passive: true });

    // Responsive Canvas Resizing
    function resize() {
      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);

      // Adjust master rig position to orbit behind the right-column 3D stage
      if (width < 768) {
        masterRig.position.set(0, 0.4, -1.5);
        masterRig.scale.setScalar(0.68);
      } else if (width < 1100) {
        masterRig.position.set(1.3, 0.1, -0.5);
        masterRig.scale.setScalar(0.85);
      } else {
        masterRig.position.set(2.35, 0.1, 0);
        masterRig.scale.setScalar(1.08);
      }
    }

    window.addEventListener('resize', resize, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(resize).observe(container);
    }
    requestAnimationFrame(resize);

    // Animation Loop
    const clock = new THREE.Clock();
    let rotY = -0.55;
    let rotX = 0.15;

    function tick() {
      const delta = clock.getDelta();
      const elapsed = clock.elapsedTime;

      // Pointer damping with gentle float
      const targetY = -0.55 + pointer.x * 0.15;
      const targetX = 0.15 - pointer.y * 0.1;
      rotY = THREE.MathUtils.damp(rotY, targetY, 2.5, delta);
      rotX = THREE.MathUtils.damp(rotX, targetX, 2.5, delta);
      masterRig.rotation.y = rotY;
      masterRig.rotation.x = rotX;

      // Continuous organic rotation & morphing waves of central knot
      centralKnot.rotation.x = elapsed * 0.22;
      centralKnot.rotation.y = elapsed * 0.31;
      centralKnot.position.y = Math.sin(elapsed * 1.2) * 0.18;

      // Subtle counter rotation of halo rings
      haloRing1.rotation.z = elapsed * 0.15;
      haloRing2.rotation.x = elapsed * 0.12;

      // Circular sweeping arc motion for discs
      discs.forEach(({ group, index }) => {
        const progress = (index / DISC_COUNT + elapsed * ARC_SPEED) % 1;
        const theta = ARC_END - progress * ARC_SPAN;
        group.position.set(
          Math.cos(theta) * ARC_RADIUS,
          ARC_CENTER_Y + Math.sin(theta) * ARC_RADIUS,
          Math.sin(theta * 2.2 + index) * 0.3
        );
        group.rotation.set(
          Math.sin(elapsed * 0.8 + index) * 0.12,
          Math.cos(elapsed * 0.6 + index) * 0.12,
          theta
        );
        const edgeScale = THREE.MathUtils.clamp(smoothEdge(progress), 0, 1);
        group.scale.setScalar(0.42 + edgeScale * 0.58);
      });

      // Floating particles orbital drift
      particles.forEach((p) => {
        const currentAngle = p.angle + elapsed * 0.08 * p.speed;
        p.mesh.position.x = Math.cos(currentAngle) * p.radius;
        p.mesh.position.z = Math.sin(currentAngle) * p.radius * 0.6;
        p.mesh.position.y = p.yOffset + Math.sin(elapsed * 1.5 + p.seed) * 0.25;
      });

      renderer.render(scene, camera);
      requestAnimationFrame(tick);
    }

    tick();
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroScene);
  } else {
    initHeroScene();
  }
})();
