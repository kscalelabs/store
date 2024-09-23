import * as THREE from "three";

import load_mujoco from "../dist/mujoco_wasm.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "../node_modules/three/examples/jsm/libs/lil-gui.module.min.js";
import {
  downloadExampleScenesFolder,
  getPosition,
  getQuaternion,
  loadSceneFromURL,
  setupGUI,
  standardNormal,
  toMujocoPos,
} from "./mujocoUtils.js";
import { DragStateManager } from "./utils/DragStateManager.js";

// Load the MuJoCo Module
const mujoco = await load_mujoco();

// Set up Emscripten's Virtual File System
var initialScene = "dora2.xml";
mujoco.FS.mkdir("/working");
mujoco.FS.mount(mujoco.MEMFS, { root: "." }, "/working");
mujoco.FS.writeFile(
  "/working/" + initialScene,
  await (await fetch("./examples/scenes/" + initialScene)).text(),
);

// Create meshes directory
mujoco.FS.mkdir("/working/meshes");

const meshFilesListStompyPro = [
  "buttock.stl",
  "calf.stl",
  "clav.stl",
  "farm.stl",
  "foot.stl",
  "leg.stl",
  "mcalf.stl",
  "mfoot.stl",
  "mthigh.stl",
  "scap.stl",
  "thigh.stl",
  "trunk.stl",
  "uarm.stl",
];

const meshFilesListDora2 = [
  "base_link.STL",
  "l_arm_elbow_Link.STL",
  "l_arm_shoulder_pitch_Link.STL",
  "l_arm_shoulder_roll_Link.STL",
  "l_arm_shoulder_yaw_Link.STL",
  "l_leg_ankle_pitch_Link.STL",
  "l_leg_ankle_roll_Link.STL",
  "l_leg_hip_pitch_Link.STL",
  "l_leg_hip_roll_Link.STL",
  "l_leg_hip_yaw_Link.STL",
  "l_leg_knee_Link.STL",
  "r_arm_elbow_Link.STL",
  "r_arm_shoulder_pitch_Link.STL",
  "r_arm_shoulder_roll_Link.STL",
  "r_arm_shoulder_yaw_Link.STL",
  "r_leg_ankle_pitch_Link.STL",
  "r_leg_ankle_roll_Link.STL",
  "r_leg_hip_pitch_Link.STL",
  "r_leg_hip_roll_Link.STL",
  "r_leg_hip_yaw_Link.STL",
  "r_leg_knee_Link.STL",
];

// const meshFilesList = meshFilesListStompyPro;
const meshFilesList = meshFilesListDora2;

for (const meshFile of meshFilesList) {
  const meshContent = await (
    await fetch(`./examples/meshes/${meshFile}`)
  ).arrayBuffer();
  mujoco.FS.writeFile(
    `/working/meshes/${meshFile}`,
    new Uint8Array(meshContent),
  );
}

export class MuJoCoDemo {
  constructor() {
    this.mujoco = mujoco;

    // Load in the state from XML
    this.model = new mujoco.Model("/working/" + initialScene);
    this.state = new mujoco.State(this.model);
    this.simulation = new mujoco.Simulation(this.model, this.state);

    // Define Random State Variables
    this.params = {
      scene: initialScene,
      paused: false,
      useModel: true,
      help: false,
      ctrlnoiserate: 0.0,
      ctrlnoisestd: 0.0,
      keyframeNumber: 0,
    };
    this.mujoco_time = 0.0;
    (this.bodies = {}), (this.lights = {});
    this.tmpVec = new THREE.Vector3();
    this.tmpQuat = new THREE.Quaternion();
    this.updateGUICallbacks = [];

    // Adds to bottom of page
    // this.container = document.createElement( 'div' );
    // document.body.appendChild( this.container );

    // get viewport
    this.container = document.getElementById("appbody");
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.name = "scene";

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.width / this.height,
      0.1,
      1000,
    );
    // this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.001, 100 );
    this.camera.name = "PerspectiveCamera";
    this.camera.position.set(2.0, 1.7, 1.7);
    this.scene.add(this.camera);

    this.scene.background = new THREE.Color(0.15, 0.25, 0.35);
    this.scene.fog = new THREE.Fog(this.scene.background, 15, 25.5);

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    this.ambientLight.name = "AmbientLight";
    this.scene.add(this.ambientLight);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    // this.renderer.setPixelRatio( window.devicePixelRatio );
    // this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    this.renderer.setAnimationLoop(this.render.bind(this));

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.7, 0);
    this.controls.panSpeed = 2;
    this.controls.zoomSpeed = 1;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.screenSpacePanning = true;
    this.controls.update();

    this.actuatorNames = [];
    this.actuatorRanges = [];
    this.loadPPOModel();
    this.isSimulationReady = false;

    window.addEventListener("resize", this.onWindowResize.bind(this));

    // Initialize the Drag State Manager.
    this.dragStateManager = new DragStateManager(
      this.scene,
      this.renderer,
      this.camera,
      this.container.parentElement,
      this.controls,
    );
    document.addEventListener("keydown", this.handleKeyPress.bind(this));
  }

  async init() {
    // Download the the examples to MuJoCo's virtual file system
    await downloadExampleScenesFolder(mujoco);

    // Initialize the three.js Scene using the .xml Model in initialScene
    [this.model, this.state, this.simulation, this.bodies, this.lights] =
      await loadSceneFromURL(mujoco, initialScene, this);

    this.gui = new GUI();
    setupGUI(this);
    this.isSimulationReady = true;

    // this.initializeActuators();
  }

  // does this ordering align with the ordering of the model output?
  initializeActuators() {
    const textDecoder = new TextDecoder();
    for (let i = 0; i < this.model.nu; i++) {
      if (!this.model.actuator_ctrllimited[i]) {
        continue;
      }
      let name = textDecoder
        .decode(this.model.names.subarray(this.model.name_actuatoradr[i]))
        .split("\0")[0];
      this.actuatorNames.push(name);
      this.actuatorRanges.push([
        this.model.actuator_ctrlrange[2 * i],
        this.model.actuator_ctrlrange[2 * i + 1],
      ]);
    }
  }

  // should re-get pawel-diff
  async loadPPOModel() {
    this.ppo_model = null;
    this.getObservation = null;

    // switch (this.params.scene) {
    //   case 'humanoid.xml':
    //     this.ppo_model = await tf.loadLayersModel('models/2_frame/model.json');
    //     this.getObservation = () => this.getObservationSkeleton(2, 10, 6);
    //     break;
    //   case 'blank':
    //     this.ppo_model = await tf.loadLayersModel('models/cvals+2_frames/model.json');
    //     break;
    //   case 'brax_humanoid.xml':
    //     this.ppo_model = await tf.loadLayersModel('models/brax_humanoid_cvalless_just_stand/model.json');
    //     this.getObservation = () => this.getObservationSkeleton(0, -1, -1);
    //     break;
    //   case 'brax_humanoidstandup.xml':
    //     this.ppo_model = await tf.loadLayersModel('models/brax_humanoid_standup/model.json');
    //     this.getObservation = () => this.getObservationSkeleton(0, 20, 12);
    //     break;
    //   case 'dora/dora2.xml':
    //     this.ppo_model = await tf.loadLayersModel('models/dora/model.json');
    //     this.getObservation = () => this.getObservationSkeleton(0, 100, 72); // 172 diff total
    //     break;
    //   default:
    //     throw new Error(`Unknown Tensorflow.js model for XML path: ${this.params.scene}`);
    // }
  }

  getObservationSkeleton(qpos_slice, cinert_slice, cvel_slice) {
    const qpos = this.simulation.qpos.slice(qpos_slice);
    const qvel = this.simulation.qvel;
    const cinert =
      cinert_slice !== -1 ? this.simulation.cinert.slice(cinert_slice) : [];
    const cvel =
      cvel_slice !== -1 ? this.simulation.cvel.slice(cvel_slice) : [];
    const qfrc_actuator = this.simulation.qfrc_actuator;

    // console.log('qpos length:', qpos.length);
    // console.log('qvel length:', qvel.length);
    // console.log('cinert length:', cinert.length);
    // console.log('cvel length:', cvel.length);
    // console.log('qfrc_actuator length:', qfrc_actuator.length);

    const obsComponents = [
      ...qpos,
      ...qvel,
      ...cinert,
      ...cvel,
      ...qfrc_actuator,
    ];

    return obsComponents;
  }

  handleKeyPress(event) {
    const key = event.key.toLowerCase();
    const stepSize = 0.1;

    switch (key) {
      case "q":
        this.moveActuator("hip_y", stepSize);
        break;
      case "a":
        this.moveActuator("hip_y_", -stepSize);
        break;
      case "w":
        this.moveActuator("hip_", stepSize);
        break;
      case "s":
        this.moveActuator("hip_", -stepSize);
        break;
      case "e":
        this.moveActuator("knee_", stepSize);
        break;
      case "d":
        this.moveActuator("knee_", -stepSize);
        break;
      case "r":
        this.moveActuator("abdomen_y", stepSize);
        break;
      case "f":
        this.moveActuator("abdomen_y", -stepSize);
        break;
      case "t":
        this.moveActuator("ankle_", stepSize);
        break;
      case "g":
        this.moveActuator("ankle_", -stepSize);
        break;
      case "y":
        this.moveActuator("shoulder1_", stepSize);
        this.moveActuator("shoulder2_", stepSize);
        break;
      case "h":
        this.moveActuator("shoulder1_", -stepSize);
        this.moveActuator("shoulder2_", -stepSize);
        break;
      case "u":
        this.moveActuator("elbow_", stepSize);
        break;
      case "j":
        this.moveActuator("elbow_", -stepSize);
        break;
    }
  }

  moveActuator(prefix, amount) {
    for (let i = 0; i < this.actuatorNames.length; i++) {
      if (this.actuatorNames[i].startsWith(prefix)) {
        let currentValue = this.simulation.ctrl[i];
        let [min, max] = this.actuatorRanges[i];
        let newValue = Math.max(min, Math.min(max, currentValue + amount));
        this.simulation.ctrl[i] = newValue;
        this.params[this.actuatorNames[i]] = newValue;
      }
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // render loop
  render(timeMS) {
    if (!this.isSimulationReady) {
      console.log("Simulation not ready yet, skipping render");
      return;
    }

    this.controls.update();

    if (!this.params["paused"]) {
      if (this.ppo_model && this.params["useModel"]) {
        const observationArray = this.getObservation();
        const inputTensor = tf.tensor2d([observationArray]);
        const resultTensor = this.ppo_model.predict(inputTensor);

        resultTensor.data().then((data) => {
          // console.log('Model output:', data);

          // Assuming the model output corresponds to actuator values
          for (let i = 0; i < data.length; i++) {
            // Ensure the actuator index is within bounds
            if (i < this.simulation.ctrl.length) {
              let clippedValue = Math.max(-1, Math.min(1, data[i]));

              let [min, max] = this.actuatorRanges[i];

              // Scale to fit between min and max
              let newValue = min + ((clippedValue + 1) * (max - min)) / 2;

              // Update the actuator value
              this.simulation.ctrl[i] = newValue;

              // Optionally, update the corresponding parameter
              this.params[this.actuatorNames[i]] = newValue;
            } else {
              console.error("Model output index out of bounds:", i);
            }
          }
        });
      }

      let timestep = this.model.getOptions().timestep;
      if (timeMS - this.mujoco_time > 35.0) {
        this.mujoco_time = timeMS;
      }
      while (this.mujoco_time < timeMS) {
        // updates states from dragging
        // Jitter the control state with gaussian random noise
        if (this.params["ctrlnoisestd"] > 0.0) {
          let rate = Math.exp(
            -timestep / Math.max(1e-10, this.params["ctrlnoiserate"]),
          );
          let scale = this.params["ctrlnoisestd"] * Math.sqrt(1 - rate * rate);
          let currentCtrl = this.simulation.ctrl;
          for (let i = 0; i < currentCtrl.length; i++) {
            currentCtrl[i] = rate * currentCtrl[i] + scale * standardNormal();
            this.params[this.actuatorNames[i]] = currentCtrl[i];
          }
        }

        // Clear old perturbations, apply new ones.
        for (let i = 0; i < this.simulation.qfrc_applied.length; i++) {
          this.simulation.qfrc_applied[i] = 0.0;
        }
        let dragged = this.dragStateManager.physicsObject;
        if (dragged && dragged.bodyID) {
          for (let b = 0; b < this.model.nbody; b++) {
            if (this.bodies[b]) {
              getPosition(this.simulation.xpos, b, this.bodies[b].position);
              getQuaternion(
                this.simulation.xquat,
                b,
                this.bodies[b].quaternion,
              );
              this.bodies[b].updateWorldMatrix();
            }
          }
          let bodyID = dragged.bodyID;
          this.dragStateManager.update(); // Update the world-space force origin
          let force = toMujocoPos(
            this.dragStateManager.currentWorld
              .clone()
              .sub(this.dragStateManager.worldHit)
              .multiplyScalar(this.model.body_mass[bodyID] * 250),
          );
          let point = toMujocoPos(this.dragStateManager.worldHit.clone());
          this.simulation.applyForce(
            force.x,
            force.y,
            force.z,
            0,
            0,
            0,
            point.x,
            point.y,
            point.z,
            bodyID,
          );

          // TODO: Apply pose perturbations (mocap bodies only).
        }

        this.simulation.step();

        this.mujoco_time += timestep * 1000.0;
      }
    } else if (this.params["paused"]) {
      // updates states from dragging
      this.dragStateManager.update(); // Update the world-space force origin
      let dragged = this.dragStateManager.physicsObject;
      if (dragged && dragged.bodyID) {
        let b = dragged.bodyID;
        getPosition(this.simulation.xpos, b, this.tmpVec, false); // Get raw coordinate from MuJoCo
        getQuaternion(this.simulation.xquat, b, this.tmpQuat, false); // Get raw coordinate from MuJoCo

        let offset = toMujocoPos(
          this.dragStateManager.currentWorld
            .clone()
            .sub(this.dragStateManager.worldHit)
            .multiplyScalar(0.3),
        );
        if (this.model.body_mocapid[b] >= 0) {
          // Set the root body's mocap position...
          console.log("Trying to move mocap body", b);
          let addr = this.model.body_mocapid[b] * 3;
          let pos = this.simulation.mocap_pos;
          pos[addr + 0] += offset.x;
          pos[addr + 1] += offset.y;
          pos[addr + 2] += offset.z;
        } else {
          // Set the root body's position directly...
          let root = this.model.body_rootid[b];
          let addr = this.model.jnt_qposadr[this.model.body_jntadr[root]];
          let pos = this.simulation.qpos;
          pos[addr + 0] += offset.x;
          pos[addr + 1] += offset.y;
          pos[addr + 2] += offset.z;

          //// Save the original root body position
          //let x  = pos[addr + 0], y  = pos[addr + 1], z  = pos[addr + 2];
          //let xq = pos[addr + 3], yq = pos[addr + 4], zq = pos[addr + 5], wq = pos[addr + 6];

          //// Clear old perturbations, apply new ones.
          //for (let i = 0; i < this.simulation.qfrc_applied().length; i++) { this.simulation.qfrc_applied()[i] = 0.0; }
          //for (let bi = 0; bi < this.model.nbody(); bi++) {
          //  if (this.bodies[b]) {
          //    getPosition  (this.simulation.xpos (), bi, this.bodies[bi].position);
          //    getQuaternion(this.simulation.xquat(), bi, this.bodies[bi].quaternion);
          //    this.bodies[bi].updateWorldMatrix();
          //  }
          //}
          ////dragStateManager.update(); // Update the world-space force origin
          //let force = toMujocoPos(this.dragStateManager.currentWorld.clone()
          //  .sub(this.dragStateManager.worldHit).multiplyScalar(this.model.body_mass()[b] * 0.01));
          //let point = toMujocoPos(this.dragStateManager.worldHit.clone());
          //// This force is dumped into xrfc_applied
          //this.simulation.applyForce(force.x, force.y, force.z, 0, 0, 0, point.x, point.y, point.z, b);
          //this.simulation.integratePos(this.simulation.qpos(), this.simulation.qfrc_applied(), 1);

          //// Add extra drag to the root body
          //pos[addr + 0] = x  + (pos[addr + 0] - x ) * 0.1;
          //pos[addr + 1] = y  + (pos[addr + 1] - y ) * 0.1;
          //pos[addr + 2] = z  + (pos[addr + 2] - z ) * 0.1;
          //pos[addr + 3] = xq + (pos[addr + 3] - xq) * 0.1;
          //pos[addr + 4] = yq + (pos[addr + 4] - yq) * 0.1;
          //pos[addr + 5] = zq + (pos[addr + 5] - zq) * 0.1;
          //pos[addr + 6] = wq + (pos[addr + 6] - wq) * 0.1;
        }
      }

      this.simulation.forward();
    }

    // Update body transforms.
    for (let b = 0; b < this.model.nbody; b++) {
      if (this.bodies[b]) {
        getPosition(this.simulation.xpos, b, this.bodies[b].position);
        getQuaternion(this.simulation.xquat, b, this.bodies[b].quaternion);
        this.bodies[b].updateWorldMatrix();
      }
    }

    // Update light transforms.
    for (let l = 0; l < this.model.nlight; l++) {
      if (this.lights[l]) {
        getPosition(this.simulation.light_xpos, l, this.lights[l].position);
        getPosition(this.simulation.light_xdir, l, this.tmpVec);
        this.lights[l].lookAt(this.tmpVec.add(this.lights[l].position));
      }
    }

    // Update tendon transforms.
    let numWraps = 0;
    if (this.mujocoRoot && this.mujocoRoot.cylinders) {
      let mat = new THREE.Matrix4();
      for (let t = 0; t < this.model.ntendon; t++) {
        let startW = this.simulation.ten_wrapadr[t];
        let r = this.model.tendon_width[t];
        for (
          let w = startW;
          w < startW + this.simulation.ten_wrapnum[t] - 1;
          w++
        ) {
          let tendonStart = getPosition(
            this.simulation.wrap_xpos,
            w,
            new THREE.Vector3(),
          );
          let tendonEnd = getPosition(
            this.simulation.wrap_xpos,
            w + 1,
            new THREE.Vector3(),
          );
          let tendonAvg = new THREE.Vector3()
            .addVectors(tendonStart, tendonEnd)
            .multiplyScalar(0.5);

          let validStart = tendonStart.length() > 0.01;
          let validEnd = tendonEnd.length() > 0.01;

          if (validStart) {
            this.mujocoRoot.spheres.setMatrixAt(
              numWraps,
              mat.compose(
                tendonStart,
                new THREE.Quaternion(),
                new THREE.Vector3(r, r, r),
              ),
            );
          }
          if (validEnd) {
            this.mujocoRoot.spheres.setMatrixAt(
              numWraps + 1,
              mat.compose(
                tendonEnd,
                new THREE.Quaternion(),
                new THREE.Vector3(r, r, r),
              ),
            );
          }
          if (validStart && validEnd) {
            mat.compose(
              tendonAvg,
              new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                tendonEnd.clone().sub(tendonStart).normalize(),
              ),
              new THREE.Vector3(r, tendonStart.distanceTo(tendonEnd), r),
            );
            this.mujocoRoot.cylinders.setMatrixAt(numWraps, mat);
            numWraps++;
          }
        }
      }
      this.mujocoRoot.cylinders.count = numWraps;
      this.mujocoRoot.spheres.count = numWraps > 0 ? numWraps + 1 : 0;
      this.mujocoRoot.cylinders.instanceMatrix.needsUpdate = true;
      this.mujocoRoot.spheres.instanceMatrix.needsUpdate = true;
    }

    // Render!
    this.renderer.render(this.scene, this.camera);
  }
}

let demo = new MuJoCoDemo();
await demo.init();
