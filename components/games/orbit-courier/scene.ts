import * as THREE from "three";
import type { Run } from "./simulation";

const radii = [2.16, 2.83, 3.5];
const palette = { night: 0x151515, white: 0xf4f4f4, gray: 0x8c8c8c, line: 0x444444, accent: 0xa9c6ef };

export function createOrbitScene(host: HTMLDivElement) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65));
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(palette.night);
  const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 100);
  camera.position.set(0, 7.7, 8.9);
  camera.lookAt(0, 0, 0);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  function geometry<T extends THREE.BufferGeometry>(value: T): T { geometries.add(value); return value; }
  function material<T extends THREE.Material>(value: T): T { materials.add(value); return value; }
  function mesh(shape: THREE.BufferGeometry, surface: THREE.Material) { return new THREE.Mesh(shape, surface); }

  const orbitLine = material(new THREE.LineBasicMaterial({ color: palette.line }));
  const guideLine = material(new THREE.LineBasicMaterial({ color: 0x2a2a2a }));
  const gateLine = material(new THREE.LineBasicMaterial({ color: 0xb7b7b7 }));
  const tickSurface = material(new THREE.MeshBasicMaterial({ color: 0x929292 }));
  const shipSurface = material(new THREE.MeshBasicMaterial({ color: palette.white }));
  const accentSurface = material(new THREE.MeshBasicMaterial({ color: palette.accent }));
  const hullSurface = material(new THREE.MeshStandardMaterial({ color: palette.gray, flatShading: true, roughness: 1 }));
  const planetSurface = material(new THREE.MeshStandardMaterial({ color: 0x474747, flatShading: true, roughness: 1 }));
  const starSurface = material(new THREE.PointsMaterial({ color: 0x616161, size: 1.35, sizeAttenuation: false }));

  function ring(radius: number, surface: THREE.LineBasicMaterial) {
    const points = Array.from({ length: 128 }, (_, i) => {
      const a = i * Math.PI * 2 / 128;
      return new THREE.Vector3(Math.sin(a) * radius, 0, Math.cos(a) * radius);
    });
    scene.add(new THREE.LineLoop(geometry(new THREE.BufferGeometry().setFromPoints(points)), surface));
  }
  for (const radius of radii) ring(radius, orbitLine);
  for (const radius of [1.62, 3.86, 4.11]) ring(radius, guideLine);

  const guideSegments: THREE.Vector3[] = [];
  for (let i = 0; i < 24; i++) {
    const angle = i / 24 * Math.PI * 2;
    guideSegments.push(
      new THREE.Vector3(Math.sin(angle) * 3.87, 0, Math.cos(angle) * 3.87),
      new THREE.Vector3(Math.sin(angle) * 3.97, 0, Math.cos(angle) * 3.97),
    );
  }
  scene.add(new THREE.LineSegments(geometry(new THREE.BufferGeometry().setFromPoints(guideSegments)), guideLine));
  scene.add(new THREE.Line(geometry(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(0, 0.04, 1.88), new THREE.Vector3(0, 0.04, 3.81),
  ])), gateLine));
  const tick = geometry(new THREE.CircleGeometry(0.065, 16));
  for (const radius of radii) {
    const marker = mesh(tick, tickSurface);
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(0, 0.055, radius);
    scene.add(marker);
  }

  const globe = mesh(geometry(new THREE.IcosahedronGeometry(1.17, 1)), planetSurface);
  globe.position.y = 0.37;
  globe.rotation.set(0.32, 0, 0.24);
  scene.add(globe, new THREE.HemisphereLight(0xc0c0c0, 0x434343, 1.75));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-4.5, 5, -1);
  scene.add(sun);

  const stars = Array.from({ length: 108 }, (_, i) => {
    const fraction = (n: number) => n - Math.floor(n);
    const angle = fraction(i * 0.61803399) * Math.PI * 2;
    const radius = 1.7 + Math.pow(fraction(i * 0.254643), 0.45) * 9.6;
    return new THREE.Vector3(Math.cos(angle) * radius, -0.62, Math.sin(angle) * radius);
  });
  scene.add(new THREE.Points(geometry(new THREE.BufferGeometry().setFromPoints(stars)), starSurface));

  const ship = new THREE.Group();
  const nose = mesh(geometry(new THREE.ConeGeometry(0.16, 0.48, 4)), shipSurface);
  nose.rotation.z = -Math.PI / 2;
  nose.rotation.x = Math.PI / 4;
  const keel = mesh(geometry(new THREE.OctahedronGeometry(0.18)), shipSurface);
  keel.position.x = -0.12;
  keel.scale.set(1.02, 0.62, 1.27);
  const drive = mesh(geometry(new THREE.BoxGeometry(0.065, 0.085, 0.11)), accentSurface);
  drive.position.x = -0.23;
  ship.add(nose, keel, drive);
  ship.position.set(0, 0.2, radii[1]);
  scene.add(ship);

  const cargoGeometry = geometry(new THREE.OctahedronGeometry(0.22));
  const debrisGeometry = geometry(new THREE.DodecahedronGeometry(0.24, 0));
  const cargoOutline = geometry(new THREE.EdgesGeometry(cargoGeometry));
  const halo = material(new THREE.LineBasicMaterial({ color: palette.accent, transparent: true, opacity: 0.38 }));
  const objects = new Map<string, THREE.Group>();

  function entity(kind: "cargo" | "debris") {
    const group = new THREE.Group();
    if (kind === "cargo") {
      group.add(mesh(cargoGeometry, accentSurface));
      const frame = new THREE.LineSegments(cargoOutline, halo);
      frame.scale.setScalar(1.55);
      group.add(frame);
    } else {
      group.add(mesh(debrisGeometry, hullSurface));
    }
    return group;
  }

  function draw() { renderer.render(scene, camera); }
  function resize() {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    const aspect = width / height;
    const halfHeight = Math.max(3.25, 4.2 / aspect);
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  return {
    render(run: Run, time = 0, reducedMotion = false) {
      ship.position.z = radii[run.lane];
      ship.rotation.x = reducedMotion ? 0 : Math.sin(time * 2.1) * 0.12;
      globe.rotation.y = reducedMotion ? 0.2 : time * 0.18 + 0.2;
      const active = new Set<string>();
      for (const { id, angle, cells } of run.formations) {
        cells.forEach((kind, lane) => {
          if (kind === "clear") return;
          const key = `${id}-${lane}`;
          active.add(key);
          let model = objects.get(key);
          if (!model) {
            model = entity(kind);
            objects.set(key, model);
            scene.add(model);
          }
          const radius = radii[lane];
          model.position.set(Math.sin(angle) * radius, 0.22, Math.cos(angle) * radius);
          model.rotation.set(0.4 + id % 5, reducedMotion ? 0 : -time * 1.15, lane * 0.5);
        });
      }
      for (const [key, model] of objects) {
        if (!active.has(key)) { scene.remove(model); objects.delete(key); }
      }
      draw();
    },
    reset() {
      for (const model of objects.values()) scene.remove(model);
      objects.clear();
    },
    dispose() {
      observer.disconnect();
      for (const value of geometries) value.dispose();
      for (const value of materials) value.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

function createFlatScene(host: HTMLDivElement) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable");
  canvas.setAttribute("aria-hidden", "true");
  host.replaceChildren(canvas);
  let lastRun: Run | undefined;
  function render(run: Run) {
    if (!context) return;
    lastRun = run;
    const { width, height } = canvas;
    const zoom = Math.min(width / 8.65, height / 5.6);
    const x = width / 2;
    const y = height / 2;
    const flatten = 0.62;
    const position = (angle: number, lane: number) => [
      x + Math.sin(angle) * radii[lane] * zoom,
      y + Math.cos(angle) * radii[lane] * zoom * flatten,
    ] as const;
    context.fillStyle = "#151515";
    context.fillRect(0, 0, width, height);
    for (const radius of [1.62, ...radii, 3.88, 4.1]) {
      context.strokeStyle = radii.includes(radius) ? "#494949" : "#2b2b2b";
      context.beginPath();
      context.ellipse(x, y, radius * zoom, radius * zoom * flatten, 0, 0, Math.PI * 2);
      context.stroke();
    }
    context.fillStyle = "#343434";
    context.beginPath();
    context.arc(x, y - zoom * 0.17, zoom * 1.1, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#b7b7b7";
    context.beginPath();
    context.moveTo(x, y + 1.88 * zoom * flatten);
    context.lineTo(x, y + 3.81 * zoom * flatten);
    context.stroke();
    for (const { angle, cells } of run.formations) {
      cells.forEach((cell, lane) => {
        if (cell === "clear") return;
        const [px, py] = position(angle, lane);
        context.fillStyle = cell === "cargo" ? "#a9c6ef" : "#a6a6a6";
        const size = (cell === "cargo" ? 0.18 : 0.2) * zoom;
        const sides = cell === "cargo" ? 4 : 6;
        context.beginPath();
        for (let i = 0; i < sides; i++) {
          const theta = Math.PI * 2 * i / sides;
          context.lineTo(px + Math.cos(theta) * size, py + Math.sin(theta) * size);
        }
        context.fill();
      });
    }
    const [px, py] = position(0, run.lane);
    const size = zoom * 0.23;
    context.fillStyle = "#f4f4f4";
    context.beginPath();
    context.moveTo(px + size, py);
    context.lineTo(px - size, py - size * 0.65);
    context.lineTo(px - size * 0.62, py);
    context.lineTo(px - size, py + size * 0.65);
    context.fill();
  }
  function resize() {
    const ratio = Math.min(window.devicePixelRatio, 1.65);
    canvas.width = Math.max(1, host.clientWidth * ratio);
    canvas.height = Math.max(1, host.clientHeight * ratio);
    if (lastRun) render(lastRun);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  return { render, reset() {}, dispose() { observer.disconnect(); canvas.remove(); } };
}

export function createScene(host: HTMLDivElement) {
  try {
    return { ...createOrbitScene(host), display: "3D" } as const;
  } catch {
    return { ...createFlatScene(host), display: "2D" } as const;
  }
}
