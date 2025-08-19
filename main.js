// DOM Elements
const viewer = document.getElementById('viewer');
const popup = document.getElementById('popup');
const popupTitle = document.getElementById('popup-title');
const popupImg = document.getElementById('popup-img');
const popupDesc = document.getElementById('popup-desc');
const closePopup = document.getElementById('close-popup');
const avatar = document.getElementById('avatar');

// -------- Scene Setup ----------
const scene = new THREE.Scene();
let camera, renderer, controls, deviceControls;
let isMobile = /iPhone|iPad|Android|mobile/i.test(navigator.userAgent);

// 360° demo panorama (replace with your own!)
// Download a sample freely-licensed panorama and put it in assets/
const panoUrl = 'assets/pano-360-product.jpg';

const AVATAR_LOCATIONS = [
  { theta: 0, phi: Math.PI/2, name: "Center", footstep: "Step to Center" },
  { theta: Math.PI/4, phi: Math.PI/2, name: "Front-Right", footstep:"Hop Front-Right" },
  { theta: Math.PI/2, phi: Math.PI/2, name: "Right", footstep:"Move to Right" },
  { theta: 3*Math.PI/4, phi: Math.PI/2, name: "Back-Right", footstep:"Step Back-Right" },
  { theta: Math.PI, phi: Math.PI/2, name: "Back", footstep:"Go Back" },
  { theta: -Math.PI/2, phi: Math.PI/2, name: "Left", footstep:"Step to Left" },
];
let avatarPlace = 0;

// Renderer
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x191b22, 1);
viewer.appendChild(renderer.domElement);

// Camera
camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.10,
  1000
);
camera.position.set(0, 0, 0.15);

// Controls
if (isMobile && window.DeviceOrientationEvent) {
  deviceControls = new THREE.DeviceOrientationControls(camera);
} else {
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.85;
}
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Sphere geometry for 360 pano
const geometry = new THREE.SphereBufferGeometry(500, 60, 40);
geometry.scale(-1, 1, 1);
const textureLoader = new THREE.TextureLoader();
textureLoader.load(panoUrl, (texture) => {
  const material = new THREE.MeshBasicMaterial({ map: texture });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  render();
});

// -------- Hotspots --------
const hotspots = [
  {
    position: { theta: Math.PI/6, phi: Math.PI/2, radius: 499 },
    title: "Product Camera",
    desc: "Zoom-in on the main camera setup.\nHigh-definition, dual lens, 24MP.",
    img: "assets/hotspot1.jpg"
  },
  {
    position: { theta: -Math.PI/3, phi: Math.PI/2, radius: 499 },
    title: "Speaker and Ports",
    desc: "Speaker system with surround sound effect.\nUniversal charging port.",
    img: "assets/hotspot2.jpg"
  },
  {
    position: { theta: Math.PI/2, phi: Math.PI/4, radius: 499 },
    title: "Premium Finish",
    desc: "Glass back with antimicrobial coating for style and hygiene.",
    img: "assets/hotspot3.jpg"
  }
];

function createHotspot(hs) {
  const dotGeo = new THREE.SphereGeometry(5, 32, 32);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x19ffc5 });
  const point = new THREE.Vector3(
    hs.position.radius * Math.sin(hs.position.phi) * Math.sin(hs.position.theta),
    hs.position.radius * Math.cos(hs.position.phi),
    hs.position.radius * Math.sin(hs.position.phi) * Math.cos(hs.position.theta)
  );
  const mesh = new THREE.Mesh(dotGeo, dotMat);
  mesh.position.copy(point);
  mesh.userData = hs;
  mesh.cursor = "pointer";
  mesh.onClick = hotspotOnClick;
  scene.add(mesh);
  dots.push(mesh);
  return mesh;
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let dots = [];

hotspots.forEach(hs => createHotspot(hs));

function hotspotOnClick(hsData) {
  popupTitle.textContent = hsData.title;
  popupImg.src = hsData.img;
  popupDesc.textContent = hsData.desc;
  popup.classList.remove('hidden');
  // Animate camera to focus on the hotspot
  const pt = hsData.position;
  const target = new THREE.Vector3(
    pt.radius * Math.sin(pt.phi) * Math.sin(pt.theta),
    pt.radius * Math.cos(pt.phi),
    pt.radius * Math.sin(pt.phi) * Math.cos(pt.theta)
  );
  animateCameraLook(target, 1000);
}

function animateCameraLook(targetVec, duration=800) {
  const start = { rot: camera.rotation.y };
  const tgt = { rot: Math.atan2(targetVec.x, targetVec.z) };
  const dist = Math.abs(start.rot - tgt.rot);
  let t = 0, lastT = performance.now();
  function loop(now) {
    const delta = now - lastT; lastT = now; t += delta;
    camera.rotation.y = start.rot + (t/duration)*(tgt.rot-start.rot);
    if (t<duration) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

renderer.domElement.addEventListener('click', event => {
  event.preventDefault();
  mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
  mouse.y = -(event.clientY / renderer.domElement.clientHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(dots);
  if(intersects.length>0) {
    hotspotOnClick(intersects[0].object.userData);
  }
});

closePopup.addEventListener('click', () => popup.classList.add('hidden'));

// -------- Avatar Navigation --------
function moveAvatar(direction) {
  avatarPlace = (avatarPlace + direction + AVATAR_LOCATIONS.length) % AVATAR_LOCATIONS.length;
  const pt = AVATAR_LOCATIONS[avatarPlace];
  camera.rotation.y = pt.theta;
  camera.rotation.x = pt.phi - Math.PI / 2;
  avatar.classList.add('animate-move');
  setTimeout(() => avatar.classList.remove('animate-move'), 300);
  // Play optional footstep sound here if desired
}

document.getElementById('nav-left').onclick = () => moveAvatar(-1);
document.getElementById('nav-right').onclick = () => moveAvatar(1);
document.getElementById('nav-forward').onclick = () => moveAvatar(-2);
document.getElementById('nav-backward').onclick = () => moveAvatar(2);

// -------- Render Loop --------
function render() {
  requestAnimationFrame(render);
  if(deviceControls) deviceControls.update();
  if(controls) controls.update();
  renderer.render(scene, camera);
}
