import * as THREE from 'three';

export interface CarSceneOptions {
  bodyColor?: string;
  accentColor?: string;
  envIntensity?: number;
}


export function createProceduralCar(options: CarSceneOptions = {}): THREE.Group {
  const {
    bodyColor = '#12121a',
    accentColor = '#d4af37',
    envIntensity = 1.2,
  } = options;

  const car = new THREE.Group();
  car.name = 'procedural-car';

  const bodyMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(bodyColor),
    metalness: 0.92,
    roughness: 0.12,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: envIntensity,
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(accentColor),
    metalness: 0.95,
    roughness: 0.15,
    emissive: new THREE.Color(accentColor),
    emissiveIntensity: 0.08,
    envMapIntensity: envIntensity,
  });

  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0a0a12,
    metalness: 0,
    roughness: 0,
    transmission: 0.95,
    transparent: true,
    opacity: 0.85,
    thickness: 0.5,
  });

  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x080808,
    metalness: 0.6,
    roughness: 0.4,
  });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.45, 1.85), bodyMat);
  chassis.position.y = 0.48;
  chassis.name = 'body';
  car.add(chassis);

  const sideSkirtL = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.08, 0.06), accentMat);
  sideSkirtL.position.set(0, 0.28, 0.95);
  sideSkirtL.name = 'accent';
  car.add(sideSkirtL);
  const sideSkirtR = sideSkirtL.clone();
  sideSkirtR.position.z = -0.95;
  car.add(sideSkirtR);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.65, 1.52), bodyMat);
  cabin.position.set(-0.2, 0.98, 0);
  cabin.name = 'cabin';
  car.add(cabin);

  const hood = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.28, 1.72), bodyMat);
  hood.position.set(1.55, 0.72, 0);
  hood.rotation.z = -0.06;
  car.add(hood);

  const hoodLine = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 1.74), accentMat);
  hoodLine.position.set(1.5, 0.78, 0);
  hoodLine.name = 'accent';
  car.add(hoodLine);

  const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.55, 1.48), glassMat);
  windshield.position.set(0.3, 1.12, 0);
  windshield.rotation.z = -0.38;
  car.add(windshield);

  const rearWindow = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 1.42), glassMat);
  rearWindow.position.set(-1.2, 1.02, 0);
  rearWindow.rotation.z = 0.32;
  car.add(rearWindow);

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 1.92), accentMat);
  spoiler.position.set(-2.05, 0.82, 0);
  spoiler.name = 'accent';
  car.add(spoiler);

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 1.6), darkMat);
  diffuser.position.set(-2.1, 0.3, 0);
  car.add(diffuser);

  const frontBumper = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 1.92), darkMat);
  frontBumper.position.set(2.25, 0.34, 0);
  car.add(frontBumper);

  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.18, 1.0), darkMat);
  grille.position.set(2.28, 0.42, 0);
  car.add(grille);

  [-0.55, 0.55].forEach((z) => {
    const headlight = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, 0.35),
      accentMat,
    );
    headlight.position.set(2.2, 0.54, z);
    headlight.name = 'accent';
    car.add(headlight);

    const taillight = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.12, 0.42),
      accentMat,
    );
    taillight.position.set(-2.12, 0.58, z * 1.15);
    taillight.name = 'accent';
    car.add(taillight);
  });

  const wheelGeo = new THREE.TorusGeometry(0.42, 0.14, 12, 24);
  const wheelMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    metalness: 0.85,
    roughness: 0.35,
  });
  const rimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentColor),
    metalness: 0.98,
    roughness: 0.1,
  });

  const wheelPositions: [number, number, number][] = [
    [1.35, 0.42, 1.02],
    [1.35, 0.42, -1.02],
    [-1.35, 0.42, 1.02],
    [-1.35, 0.42, -1.02],
  ];

  wheelPositions.forEach(([x, y, z], i) => {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);
    wheelGroup.rotation.y = Math.PI / 2;
    wheelGroup.name = `wheel-${i}`;

    const tire = new THREE.Mesh(wheelGeo, wheelMat);
    wheelGroup.add(tire);

    const rim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.26, 0.32, 20),
      rimMat,
    );
    rim.rotation.x = Math.PI / 2;
    wheelGroup.add(rim);

    for (let s = 0; s < 5; s++) {
      const spoke = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.22, 0.06),
        rimMat,
      );
      spoke.rotation.z = (s / 5) * Math.PI * 2;
      wheelGroup.add(spoke);
    }

    car.add(wheelGroup);
  });

  [-0.45, 0.45].forEach((z) => {
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.07, 0.28, 10),
      accentMat,
    );
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(-2.18, 0.34, z);
    exhaust.name = 'accent';
    car.add(exhaust);
  });

  const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.18), bodyMat);
  mirrorL.position.set(0.5, 1.05, 0.88);
  car.add(mirrorL);
  const mirrorR = mirrorL.clone();
  mirrorR.position.z = -0.88;
  car.add(mirrorR);

  car.userData.materials = { bodyMat, accentMat };
  return car;
}

export function updateCarColors(
  car: THREE.Group,
  bodyColor: string,
  accentColor: string,
): void {
  car.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mat = child.material as THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
    if (child.name === 'accent' || child.name.startsWith('wheel')) {
      if ('color' in mat) mat.color.set(accentColor);
      if ('emissive' in mat && mat.emissive) {
        mat.emissive.set(accentColor);
      }
    } else if (child.name === 'body' || child.name === 'cabin') {
      if ('color' in mat) mat.color.set(bodyColor);
    }
  });

  const mats = car.userData.materials as {
    bodyMat: THREE.MeshPhysicalMaterial;
    accentMat: THREE.MeshPhysicalMaterial;
  };
  if (mats?.bodyMat) mats.bodyMat.color.set(bodyColor);
  if (mats?.accentMat) {
    mats.accentMat.color.set(accentColor);
    mats.accentMat.emissive.set(accentColor);
  }
}

export function createShowroomScene(
  container: HTMLElement,
  options: CarSceneOptions = {},
): {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  car: THREE.Group;
  cleanup: () => void;
  resize: () => void;
  setMouse: (x: number, y: number) => void;
  setRotation: (angle: number) => void;
  updateColors: (body: string, accent: string) => void;
} {
  const width = container.clientWidth;
  const height = container.clientHeight;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x030303, 0.028);
  scene.background = new THREE.Color(0x030303);

  const camera = new THREE.PerspectiveCamera(32, width / height, 0.1, 100);
  camera.position.set(5.5, 2.2, 5.5);
  camera.lookAt(0, 0.45, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const envTex = pmrem.fromScene(envScene).texture;
  scene.environment = envTex;
  pmrem.dispose();

  const car = createProceduralCar(options);
  scene.add(car);

  const floorMat = new THREE.MeshPhysicalMaterial({
    color: 0x060606,
    metalness: 0.95,
    roughness: 0.15,
    envMapIntensity: 2,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const gridHelper = new THREE.GridHelper(24, 48, 0x1a1a1a, 0x0a0a0a);
  gridHelper.position.y = 0.005;
  scene.add(gridHelper);

  const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(6, 10, 6);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x3d5a80, 0.6);
  fillLight.position.set(-6, 4, -4);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xd4af37, 1.4);
  rimLight.position.set(0, 3, -10);
  scene.add(rimLight);

  const underLight = new THREE.PointLight(0xd4af37, 0.8, 12);
  underLight.position.set(0, 0.2, 0);
  scene.add(underLight);

  scene.add(new THREE.AmbientLight(0x0a0a14, 0.35));

  const spotLight = new THREE.SpotLight(0xffffff, 4, 24, Math.PI / 5, 0.4, 1);
  spotLight.position.set(2, 12, 4);
  spotLight.target = car;
  scene.add(spotLight);

  const particlesGeo = new THREE.BufferGeometry();
  const particleCount = 120;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = Math.random() * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 24;
  }
  particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    particlesGeo,
    new THREE.PointsMaterial({
      color: 0xd4af37,
      size: 0.025,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    }),
  );
  scene.add(particles);

  let mouseX = 0;
  let mouseY = 0;
  let targetRotY = 0;
  let manualRotation = 0;
  let animId = 0;
  const clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    targetRotY = mouseX * 0.25 + manualRotation;
    car.rotation.y += (targetRotY - car.rotation.y) * 0.04;
    car.position.y = Math.sin(elapsed * 0.4) * 0.015;

    camera.position.x = 5.5 + mouseX * 0.6;
    camera.position.y = 2.2 + mouseY * 0.25;
    camera.lookAt(0, 0.45, 0);

    particles.rotation.y = elapsed * 0.015;
    underLight.intensity = 0.6 + Math.sin(elapsed * 0.8) * 0.2;

    renderer.render(scene, camera);
  }
  animate();

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function cleanup() {
    cancelAnimationFrame(animId);
    renderer.dispose();
    if (container.contains(renderer.domElement)) {
      container.removeChild(renderer.domElement);
    }
  }

  return {
    scene,
    camera,
    renderer,
    car,
    cleanup,
    resize,
    setMouse: (x: number, y: number) => {
      mouseX = x;
      mouseY = y;
    },
    setRotation: (angle: number) => {
      manualRotation = angle;
    },
    updateColors: (body: string, accent: string) => {
      updateCarColors(car, body, accent);
    },
  };
}
