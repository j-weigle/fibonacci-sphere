require('file-loader?name=[name].[ext]!./index.html');
import * as THREE from 'three';

let camera, scene, canvas, renderer;
let countTotalN; // for showing sequential construction of fibonacci disk
let offset; // for x offset of threejs objects from the origin
const offsetDiv = 150; // amount to divide canvas width by for offset

const windowCenter = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2
};

const documentSections = {
  intro: document.querySelector('#intro'),
  disk: document.querySelector('#disk'),
  golden: document.querySelector('#golden-angle'),
  sunflo: document.querySelector('#sunflower'),
};

const items = [];
items.add = (obj, section) => { items.push({obj, section}); }

const timers = {};

/* Setup */
init();
/* Start Animation */
requestAnimationFrame(animate);

function init () {
  // Config //
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x121212);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 20;
  scene.add(camera);

  canvas = document.querySelector('#canvas');

  renderer = new THREE.WebGLRenderer({canvas});
  const pixelRatio = Math.trunc(window.devicePixelRatio);
  const width = canvas.clientWidth * pixelRatio;
  const height = canvas.clientHeight * pixelRatio;
  renderer.setSize(width, height, false);

  // initialize x offset value
  offset = Math.trunc(canvas.clientWidth / offsetDiv);

  // Objects //
  { /* Fibonacci Sphere */
    const n = 500;
    const vertices = fibonacciSphere(n);
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({color: 0xFFFFFF, size: 0.1});
    const obj = new THREE.Points(geometry, material);
    obj.position.x = offset;
    obj.scale.set(7, 7, 7);
    scene.add(obj);
    items.add(obj, documentSections.intro);
  }

  { /* Fibonacci Disk */
    const n = 250;
    const vertices = fibonacciDisk(n);
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({color: 0xFFFFFF, size: 0.1});
    const obj = new THREE.Points(geometry, material);
    obj.position.x = -offset;
    obj.rotation.y = 0.9;
    obj.scale.set(7, 7, 1);
    scene.add(obj);
    items.add(obj, documentSections.disk);
  }

  { /* Fibonacci Disk for Showing Construction Using Golden Angle */
    countTotalN = 250;
    const vertices = fibonacciDisk(countTotalN);
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({color: 0xFFFFFF, size: 0.1});
    const obj = new THREE.Points(geometry, material);
    obj.position.x = offset;
    obj.scale.set(7, 7, 1);
    scene.add(obj);
    items.add(obj, documentSections.golden);
    obj.geometry.attributes.position.count = 0;
  }
  document.querySelector('#ga-count').innerHTML = countTotalN;

  { /* Sunflower Looking Disk */
    const n = 350;
    const vertices = fibonacciDisk(n);
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const material = new THREE.LineBasicMaterial({color: 0xAFAF40});
    const obj = new THREE.LineLoop(geometry, material);
    obj.position.x = -offset;
    obj.rotation.y = 0.9;
    obj.scale.set(7, 7, 1);
    scene.add(obj);
    items.add(obj, documentSections.sunflo);
  }

  items.forEach(item => alignObjectWithSection(item));

  // Event Vandlers //
  window.onscroll = onScroll;

  // Timers //
  timers['colorCycle'] = setInterval(() => {
    const [sphere, circle, golden, ] = items;
    const time = Date.now() * 0.001;
    const hue = time % 100 / 100;
    sphere.obj.material.color.setHSL(hue, .5, .5);
    circle.obj.material.color.setHSL(hue, .5, .5);
    golden.obj.material.color.setHSL(hue, .5, .5);
  }, 1000/15);

  timers['sequentialDisk'] = setInterval(() => {
    const [, , golden, ] = items;
    const time = Date.now() * 0.01; // every 1/10 of a second
    golden.obj.geometry.attributes.position.count = Math.trunc(time % countTotalN);
  }, 1000/15);
}

/* Animation Loop */
function animate () {
  render();
  requestAnimationFrame(animate);
}

/* Check if canvas has resized, perform movement based updates, and render the scene */
function render () {
  if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
    onWindowResize();
    updateOffsets();
  }

  // * 0.001 gives seconds, 0.0005 gives every 2 seconds .0001 every 10
  const time = Date.now() * 0.0005;
  const [sphere, circle, , sunflo] = items;

  sphere.obj.rotation.set(time, time, 0);
  circle.obj.rotation.z = time; 
  sunflo.obj.rotation.z = time;

  renderer.render(scene, camera);
}

/* sets the camera and renderer size to the resized window size */
function onWindowResize () {
  windowCenter.x = window.innerWidth / 2;
  windowCenter.y = window.innerHeight / 2;

  const pixelRatio = Math.trunc(window.devicePixelRatio);
  const width = canvas.clientWidth * pixelRatio;
  const height = canvas.clientHeight * pixelRatio;

  renderer.setSize(width, height, false);

  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
}

/* updates the x axis offsets from 0 for each item */
function updateOffsets () {
  offset = Math.trunc(canvas.clientWidth / offsetDiv);
  items.forEach(item => {
    item.obj.position.x = item.obj.position.x > 0 ? offset : -offset;
  });
}

/* onScroll threejs object update handler */
function onScroll () {
  items.forEach((item) => alignObjectWithSection(item));
}

/*
 * Takes a threejs object and an html section and aligns
 * the threejs object with the scrolling of the html element
 */
function alignObjectWithSection (item) {
  const {obj, section} = item;

  // get y coordinate of center of the section
  const rect = section.getBoundingClientRect();
  const center = rect.top + rect.height / 2;

  let y;
  // if intro section's center is beneath the center of the page
  if (section === documentSections.intro && center > windowCenter.y) {
    y = 0;
  } else {
    // distance from the center divided by total height gives distance
    // from center as a percentage of the screen
    // 50 should probably not be hard coded, but be relevant to the camera distance from (0,0,0)
    y = -((center - windowCenter.y) / canvas.clientHeight).toFixed(2) * 50;
  }
  obj.position.y = y;
}

/* Generates the x,y,z coords of a Fibonacci Sphere */
function fibonacciSphere (n, scale = 1) {
  const goldenAngle = (3 - Math.sqrt(5)) * Math.PI; // 137.5... degrees | 2.39... radians

  // increment by the golden angle for each point
  const theta = Array.from({length: n}, (_, i) => i * goldenAngle);

  // gives n evenly spaced z coords between -1 and 1
  const z = linspace(-1, 1, n);

  // unit sphere radii (starts at 0, goes to 1, and ends at 0)
  const radii = z.map(v => Math.sqrt(1 - v * v));

  // trigonometry to get points on circle(sphere)
  //    (cos(theta) across, sin(theta) up) * radius
  const x = radii.map((r, i) => r * Math.cos(theta[i]));
  const y = radii.map((r, i) => r * Math.sin(theta[i]));

  let sphere = [];
  for (let i = 0; i < n; i++) {
    sphere.push(x[i] * scale, y[i] * scale, z[i] * scale);
  }

  return sphere;
}

/* Generates n equidistant points between start and stop (inclusive if endpoint = true) */
function linspace (start, stop, n, endpoint = true) {
  const step = (stop - start) / (endpoint ? (n - 1) : n);
  return Array.from({length: n}, (_, i) => start + i * step);
}

/* Generates the x,y,(z=0) coords of a Fibonacci Disk */
function fibonacciDisk (n, scale = 1) {
  const goldenAngle = (3 - Math.sqrt(5)) * Math.PI; // 137.5 degrees | 2.39... radians

  // increment by the golden angle for each point
  const theta = Array.from({length: n}, (_, i) => i * goldenAngle);

  // radius from center for each point
  const radii = Array.from({length: n}, (_, i) => i / n);

  // trigonometry to get points on circle
  //    (cos(theta) across, sin(theta) up) * radius
  const x = radii.map((r, i) => r * Math.cos(theta[i]));
  const y = radii.map((r, i) => r * Math.sin(theta[i]));

  let disk = [];
  for (let i = 0; i < n; i++) {
    disk.push(x[i] * scale, y[i] * scale, 0);
  }

  return disk;
}
