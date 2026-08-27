/**
 * ==============================================================================
 * PORTFOLIO BACKGROUND SCENE  (scene3d.js — ES module)
 * ==============================================================================
 * A decorative full-screen WebGL background: a drifting particle field + a few
 * slow low-poly wireframe shapes in depth fog. The camera advances as you
 * scroll (sharing PortfolioMotion's ticker), and the whole palette re-tints
 * when the site's light/dark theme toggle flips `<html data-theme>`.
 *
 * This canvas is purely ambient — all real content lives in the editable HTML.
 * The scene disables itself for prefers-reduced-motion and when WebGL is
 * unavailable (the CSS ambient glows remain as the fallback), and runs a lean
 * "lite" profile on small screens. rAF pauses when the tab is hidden.
 * ==============================================================================
 */
import * as THREE from 'three';

(function () {
  'use strict';

  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return; // leave the CSS ambient glows as the static fallback

  const lite = window.matchMedia('(max-width: 760px)').matches ||
    (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

  // ---- Renderer (guarded) ----------------------------------------------------
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !lite, powerPreference: 'low-power' });
  } catch (e) {
    console.warn('[scene3d] WebGL unavailable — using CSS fallback.', e);
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lite ? 1.5 : 2));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.setClearColor(0x000000, 0); // transparent → page background shows through

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c1510, 0.02);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 7);

  const world = new THREE.Group();
  scene.add(world);

  // ---- Particle field (one draw call) ---------------------------------------
  const COUNT = lite ? 420 : 1300;
  const SPREAD = 34;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * SPREAD;
    positions[i * 3 + 1] = (Math.random() - 0.5) * SPREAD;
    positions[i * 3 + 2] = (Math.random() - 0.5) * SPREAD;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({
    size: lite ? 0.14 : 0.11,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    sizeAttenuation: true
  });
  const points = new THREE.Points(pGeo, pMat);
  world.add(points);

  // ---- A few slow low-poly wireframe shapes ----------------------------------
  const shapeMat = new THREE.MeshBasicMaterial({ wireframe: true, transparent: true, opacity: 0.28 });
  const shapes = [];
  const shapeDefs = lite
    ? [[new THREE.IcosahedronGeometry(1.5, 0), -6, 2, -6]]
    : [
        [new THREE.IcosahedronGeometry(1.6, 0), -7, 2.5, -6],
        [new THREE.TorusGeometry(1.3, 0.42, 8, 16), 6.5, -2.5, -8],
        [new THREE.OctahedronGeometry(1.4, 0), 4, 3.5, -10]
      ];
  shapeDefs.forEach(([geo, x, y, z]) => {
    const m = new THREE.Mesh(geo, shapeMat);
    m.position.set(x, y, z);
    m.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    world.add(m);
    shapes.push(m);
  });

  // ---- Theme-aware palette ---------------------------------------------------
  function applyTheme(theme) {
    const dark = theme === 'dark';
    if (dark) {
      pMat.color.setHex(0x8fe3ab);
      pMat.opacity = 0.85;
      pMat.blending = THREE.AdditiveBlending;
      shapeMat.color.setHex(0x4f9d6e);
      shapeMat.opacity = 0.3;
      scene.fog.color.setHex(0x0c1510);
      scene.fog.density = 0.019;
    } else {
      // On a light page, additive blending washes out — use normal blending
      // with a deeper sage so particles read as soft depth, not glare.
      pMat.color.setHex(0x6f8f6a);
      pMat.opacity = 0.5;
      pMat.blending = THREE.NormalBlending;
      shapeMat.color.setHex(0x9db79a);
      shapeMat.opacity = 0.22;
      scene.fog.color.setHex(0xdfe9db);
      scene.fog.density = 0.025;
    }
    pMat.needsUpdate = true;
    shapeMat.needsUpdate = true;
  }
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');

  const themeObserver = new MutationObserver(() => {
    applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ---- Scroll & pointer parallax ---------------------------------------------
  let scrollProgress = 0;
  if (window.PortfolioMotion && typeof window.PortfolioMotion.onScroll === 'function') {
    window.PortfolioMotion.onScroll((progress) => { scrollProgress = progress; });
  } else {
    const onScroll = () => {
      const docH = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      scrollProgress = Math.min(1, Math.max(0, (window.scrollY || 0) / docH));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  let pointerX = 0, pointerY = 0;
  if (!lite) {
    window.addEventListener('pointermove', (e) => {
      pointerX = (e.clientX / window.innerWidth) - 0.5;
      pointerY = (e.clientY / window.innerHeight) - 0.5;
    }, { passive: true });
  }

  // ---- Animation loop --------------------------------------------------------
  let camZ = 7, camX = 0, camY = 0;
  let running = true;
  let t = 0;

  function tick() {
    if (!running) return;
    requestAnimationFrame(tick);
    t += 0.004;

    // Fly the camera forward through the field as the page scrolls.
    const targetZ = 7 - scrollProgress * 11;      // 7 → -4
    const targetX = pointerX * 1.6;
    const targetY = -pointerY * 1.2 + scrollProgress * 1.5;
    camZ += (targetZ - camZ) * 0.05;
    camX += (targetX - camX) * 0.05;
    camY += (targetY - camY) * 0.05;
    camera.position.set(camX, camY, camZ);
    camera.lookAt(0, 0, camZ - 6);

    world.rotation.y = t * 0.35;
    points.rotation.z = t * 0.06;
    for (let i = 0; i < shapes.length; i++) {
      shapes[i].rotation.x += 0.0016 + i * 0.0004;
      shapes[i].rotation.y += 0.0022 + i * 0.0003;
    }

    renderer.render(scene, camera);
  }
  tick();

  // ---- Lifecycle -------------------------------------------------------------
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      tick();
    }
  });

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight, false);
    }, 150);
  }, { passive: true });
})();
