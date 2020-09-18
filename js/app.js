"use strict";

import {
  DragControls
} from 'https://cdn.jsdelivr.net/npm/three@0.120.1/examples/jsm/controls/DragControls.js';


let camera, controls, scene, renderer;

let collidableMeshList = [];

let listener, sound1, sound2, sound3, sound4, oscillator, oscillator2, oscillator3, oscillator4;

const oscillators = [];

let startColor;
let time = 0;
let mouse = new THREE.Vector2();
let enableSelection = false;
let geometry, geometries, cubeGeometry;
let mesh, mesh2, mesh3, mesh4, box;

const raycaster = new THREE.Raycaster();

const meshes = [];

const fragmentShader =
  `
  #include <common>

  precision highp float;

  uniform vec3 iResolution;
  uniform float iTime;

  varying vec2 vUv;

  void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;

    // Time varying pixel color
    vec3 col = 0.5 + 0.5*cos(iTime+uv.xyx+vec3(0,2,4));

    // Output to screen
    fragColor = vec4(col,1.0);
  }

  void main() {
    mainImage(gl_FragColor, vUv * iResolution.xy);
  }
`;

const vertexShader =
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
  }
`;

const uniforms = {
  iTime: {
    value: 0
  },
  iResolution: {
    value: new THREE.Vector3(1, 1, 1)
  },
};

const state = {
  shadow: {
    blur: 3.5,
    darkness: 1,
    opacity: 1,
  },
  plane: {
    color: '#ffffff',
    opacity: 1,
  },
  showWireframe: false,
};

const startButton = document.getElementById('startButton');
startButton.addEventListener('click', init);

function init() {

  // Overlay
  var overlay = document.getElementById('overlay');
  overlay.remove();

  // Camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
  camera.position.set(-4, 1.5, -10);
  camera.lookAt(new THREE.Vector3(0, -3, 0));

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  listener = new THREE.AudioListener();

  // Lights
  Lights();

  // Geometry
  Geo();

  // Sounds
  Sound1();
  Sound2();
  Sound3();
  Sound4();

  /*
  var helper = new THREE.GridHelper(1000, 10, 0x444444, 0x444444);
  helper.position.y = 0.1;
  scene.add(helper);
  */

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  controls = new DragControls(meshes, camera, renderer.domElement);
  controls.addEventListener('dragstart', dragStartCallback);
  controls.addEventListener('dragend', dragEndCallback);

  /*
    orbControls = new OrbitControls(camera, renderer.domElement);
    orbControls.target.set(0, 0.1, 0);
    orbControls.update();
    orbControls.minDistance = 0.5;
    orbControls.maxDistance = 10;
    orbControls.maxPolarAngle = 0.5 * Math.PI;
    */

  window.addEventListener('resize', onWindowResize, false);

  document.addEventListener('click', onClick, false);
  window.addEventListener('keydown', onKeyDown, false);
  window.addEventListener('keyup', onKeyUp, false);
  window.addEventListener('resize', onWindowResize);

  animate();
}

function Geo() {
  geometries = new THREE.BoxBufferGeometry(0.4, 0.4, 0.4);
  cubeGeometry = new THREE.CubeGeometry(1, 1, 1);

  const angle = Math.PI * 2;

  const solarSystem = new THREE.Object3D();
  scene.add(solarSystem);
  meshes.push(solarSystem);

  const material5 = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
  });

  box = new THREE.Mesh(cubeGeometry, material5);
  box.position.y = 0;
  box.position.x = 0;
  box.position.z = 0;
  solarSystem.add(box);


  const material = new THREE.MeshLambertMaterial({
    color: 'red',
    emissive: 'blue',
  });

  geometry = geometries;
  mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = -3;
  mesh.position.z = -2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  meshes.push(mesh);
  solarSystem.add(mesh);
  collidableMeshList.push(mesh);

  const material2 = new THREE.MeshLambertMaterial({
    color: 'orange',
    emissive: 'green',
  });

  mesh2 = new THREE.Mesh(geometry, material2);
  mesh2.position.y = -3;
  mesh2.position.x = -2;
  mesh2.castShadow = true;
  mesh2.receiveShadow = true;
  scene.add(mesh2);
  meshes.push(mesh2);
  solarSystem.add(mesh2);
  collidableMeshList.push(mesh2);

  const material3 = new THREE.MeshLambertMaterial({
    color: 'yellow',
    emissive: 'blue',
  });

  mesh3 = new THREE.Mesh(geometry, material3);
  mesh3.position.y = -3;
  mesh3.position.x = +2;

  mesh3.castShadow = true;
  mesh3.receiveShadow = true;
  scene.add(mesh3);
  meshes.push(mesh3);
  solarSystem.add(mesh3);
  collidableMeshList.push(mesh3);

  const material4 = new THREE.MeshLambertMaterial({
    color: 'white',
    emissive: 'black',
  });

  mesh4 = new THREE.Mesh(geometry, material4);
  mesh4.position.y = -2.9;

  mesh4.position.z = +2;
  mesh4.castShadow = true;
  mesh4.receiveShadow = true;
  scene.add(mesh4);
  meshes.push(mesh4);
  solarSystem.add(mesh4);
  collidableMeshList.push(mesh4);
}

function Lights() {
  var spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(-2, 5, 0);
  spotLight.target.position.set(0, -5, 0);

  spotLight.castShadow = true;

  spotLight.shadow.mapSize.width = 1024;
  spotLight.shadow.mapSize.height = 1024;

  spotLight.shadow.camera.near = 500;
  spotLight.shadow.camera.far = 4000;
  spotLight.shadow.camera.fov = 30;

  scene.add(spotLight);

  /*
  const hLight = new THREE.HemisphereLight(0x222222);
  hLight.castShadow = true;
  scene.add(hLight);
  */
}

/*
function Sound1() {
  // Listener
  mesh.add(listener);

  sound1 = new THREE.Audio(listener);

  // create Oscillator and gain node
  oscillator = listener.context.createOscillator();

  oscillator.type = 'sine';

  document.addEventListener("mousemove", function (e) {
    oscillator.frequency.value = mesh.position.y / window.innerHeight * 100000 + 300;
  });

  // set options for the oscillator
  oscillator.detune.value = 100; // value in cents

  oscillator.start(0);

  sound1.setNodeSource(oscillator);
  sound1.setVolume(0.5);

  mesh.add(sound1);
  oscillators.push(sound1);
}
*/
function Sound1() {
  // Listener
  mesh.add(listener);

  sound1 = new THREE.Audio(listener);

  // load a sound and set it as the Audio object's buffer
  var audioLoader = new THREE.AudioLoader();
  audioLoader.load('../resources/drone3.mp3', function (buffer) {
    sound1.setBuffer(buffer);
    sound1.setLoop(true);
    sound1.hasPlaybackControl === true;

    document.addEventListener("mousemove", function (e) {
      sound1.setPlaybackRate(mesh.position.y / window.innerHeight * 100000 + 300);
    });


    sound1.setVolume(0.5);
    sound1.play();


  });

  mesh.add(sound1);
  oscillators.push(sound1);


}

function Sound2() {
  // Listener
  mesh2.add(listener);

  sound2 = new THREE.Audio(listener);

  // load a sound and set it as the Audio object's buffer
  var audioLoader = new THREE.AudioLoader();
  audioLoader.load('../resources/50.mp3', function (buffer) {
    sound2.setBuffer(buffer);
    sound2.setLoop(true);
    sound2.hasPlaybackControl === true;
    document.addEventListener("mousemove", function (e) {
      sound2.setPlaybackRate(mesh2.position.y / window.innerHeight * 100000 + 300);
    });


    sound2.setVolume(0.5);
    sound2.play();


  });

  mesh2.add(sound2);
  oscillators.push(sound2);
}

function Sound3() {
  // Listener
  mesh3.add(listener);

  sound3 = new THREE.Audio(listener);

  // load a sound and set it as the Audio object's buffer
  var audioLoader = new THREE.AudioLoader();
  audioLoader.load('../resources/drone1.mp3', function (buffer) {
    sound3.setBuffer(buffer);
    sound3.setLoop(true);
    sound3.hasPlaybackControl === true;
    document.addEventListener("mousemove", function (e) {
      sound3.setPlaybackRate(mesh3.position.y / window.innerHeight * 100000 + 300);
    });


    sound3.setVolume(0.5);
    sound3.play();


  });

  mesh3.add(sound3);
  oscillators.push(sound3);

}

function Sound4() {
  // Listener
  mesh4.add(listener);

  sound4 = new THREE.Audio(listener);

  // load a sound and set it as the Audio object's buffer
  var audioLoader = new THREE.AudioLoader();
  audioLoader.load('../resources/drone2.mp3', function (buffer) {
    sound4.setBuffer(buffer);
    sound4.setLoop(true);
    sound4.hasPlaybackControl === true;
    document.addEventListener("mousemove", function (e) {
      sound4.setPlaybackRate(mesh4.position.y / window.innerHeight * 100000 + 300);
    });


    sound4.setVolume(0.5);
    sound4.play();


  });

  mesh4.add(sound4);
  oscillators.push(sound4);
}

function dragStartCallback(event) {
  startColor = event.object.material.emissive.getHex();
  event.object.material.emissive.setHex(0x000000);
}

function dragEndCallback(event) {
  event.object.material.emissive.setHex(startColor);
}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

function onKeyDown(event) {

  enableSelection = (event.keyCode === 16) ? true : false;

}

function onKeyUp() {

  enableSelection = false;

}

function onClick(event) {

  event.preventDefault();

  if (enableSelection === true) {

    var draggableObjects = controls.getObjects();
    draggableObjects.length = 0;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    var intersections = raycaster.intersectObjects(objects, true);

    if (intersections.length > 0) {

      var object = intersections[0].object;

      if (group.children.includes(object) === true) {

        object.material.emissive.set(0x000000);
        scene.attach(object);

      } else {

        object.material.emissive.set(0xaaaaaa);
        group.attach(object);

      }

      controls.transformGroup = true;
      draggableObjects.push(group);

    }

    if (group.children.length === 0) {

      controls.transformGroup = false;
      draggableObjects.push(...objects);

    }

  }

}


function animate() {

  requestAnimationFrame(animate);

  meshes.forEach(mesh => {

    //mesh.rotation.x += 0.005;
    mesh.rotation.y += 0.006;

  });

  //box.rotation.y -= 0.0001;
  box.rotation.z -= 0.002;

  render();
}

function render() {

  renderer.gammaFactor = 2.2;
  renderer.outputEncoding = THREE.sRGBEncoding;

  renderer.render(scene, camera);
}