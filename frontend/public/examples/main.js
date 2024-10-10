import load_mujoco from "https://cdn.jsdelivr.net/gh/kscalelabs/store-deps@master/dist/mujoco_wasm.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/gh/kscalelabs/store-deps@master/dist/three/examples/jsm/controls/OrbitControls.js";
import { GUI } from "https://cdn.jsdelivr.net/gh/kscalelabs/store-deps@master/dist/three/examples/jsm/libs/lil-gui.module.min.js";
import * as THREE from "three";

import {
  downloadExampleScenesFolder,
  getPosition,
  getQuaternion,
  loadSceneFromURL,
  setupGUI,
  standardNormal,
  toMujocoPos,
} from "./mujocoUtils.js";
import PPOModel from "./ppo.js";
import { DragStateManager } from "./utils/DragStateManager.js";

// Load the MuJoCo Module
const mujoco = await load_mujoco();

// Set up Emscripten's Virtual File System
var initialScene = "stompypro.xml";

mujoco.FS.mkdir("/working");
mujoco.FS.mount(mujoco.MEMFS, { root: "." }, "/working");
mujoco.FS.writeFile(
  "/working/" + initialScene,
  await (await fetch("./examples/scenes/" + initialScene)).text(),
);

window.addEventListener("customCommand", (event) => {
  const command = event.detail;

  if (command === "right_leg,up") {
    demo.customActions = [0, 0, 0, 0, 0, 0, 0, 0, -1000, 2000];
    demo.customCommandActive = true;
  }
});

export class MuJoCoDemo {
  constructor() {
    this.mujoco = mujoco;

    // Load in the state from XML
    this.model = new mujoco.Model("/working/" + initialScene);
    this.state = new mujoco.State(this.model);
    this.simulation = new mujoco.Simulation(this.model, this.state);
    this.customCommandActive = false;
    this.customActions = [];

    // Define Random State Variables
    this.params = {
      scene: initialScene,
      paused: false,
      useModel: true,
      help: false,
      ctrlnoiserate: 0.0,
      ctrlnoisestd: 0.0,
      keyframeNumber: 0,
      dragStrength: 50.0,
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

    // this.camera = new THREE.PerspectiveCamera(
    //   75,
    //   this.width / this.height,
    //   0.1,
    //   1000,
    // );
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.001,
      100,
    );
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

    this.ppoModel = new PPOModel();
    this.loadPPOModel();

    this.cfg = {
      num_actions: 10, // Adjust this based on your robot
      env: {
        num_single_obs: 11 + 10 * 3, // Adjust based on your observation space
        frame_stack: 15,
      },
      normalization: {
        obs_scales: {
          lin_vel: 2.0,
          ang_vel: 1.0,
          dof_pos: 1.0,
          dof_vel: 0.05,
        },
        clip_observations: 18.0,
        clip_actions: 18.0,
      },
      control: {
        action_scale: 0.25,
      },
      sim_config: {
        dt: 0.002,
        decimation: 10,
      },
    };

    this.cmd = { vx: 0, vy: 0, dyaw: 0 };
    this.defaultPos = new Array(this.cfg.num_actions).fill(0); // You might want to set this to actual default positions
    this.lastAction = new Array(this.cfg.num_actions).fill(0);

    // Initialize the observation buffer with zeros
    this.obsBuffer = new Array(this.cfg.env.frame_stack)
      .fill()
      .map(() => new Array(this.cfg.env.num_single_obs).fill(0));
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

    // Define stiffness and damping values
    this.stiffness = {
      hip_y: 120,
      hip_x: 60,
      hip_z: 60,
      knee: 120,
      ankle_y: 17,
    };

    this.damping = {
      hip_y: 10,
      hip_x: 10,
      hip_z: 10,
      knee: 10,
      ankle_y: 5,
    };

    const jointOrder = [
      "hip_y",
      "hip_x",
      "hip_z",
      "knee",
      "ankle_y",
      "hip_y",
      "hip_x",
      "hip_z",
      "knee",
      "ankle_y",
    ];

    // Calculate kps and kds
    const tau_factor = 0.85;

    this.kds = jointOrder.map((joint) => this.damping[joint]);
    this.kps = jointOrder.map((joint) => this.stiffness[joint] * tau_factor);

    // Calculate tau_limit
    this.tauLimit = this.kps.map((kp) => kp);

    // Define default standing position
    this.defaultStanding = {
      left_hip_pitch: -0.157,
      left_hip_yaw: 0.0394,
      left_hip_roll: 0.0628,
      left_knee_pitch: 0.441,
      left_ankle_pitch: -0.258,
      right_hip_pitch: -0.22,
      right_hip_yaw: 0.026,
      right_hip_roll: 0.0314,
      right_knee_pitch: 0.441,
      right_ankle_pitch: -0.223,
    };

    // Convert defaultStanding to an array matching the order of joints in the simulation
    this.defaultPos = [
      this.defaultStanding.left_hip_pitch,
      this.defaultStanding.left_hip_yaw,
      this.defaultStanding.left_hip_roll,
      this.defaultStanding.left_knee_pitch,
      this.defaultStanding.left_ankle_pitch,
      this.defaultStanding.right_hip_pitch,
      this.defaultStanding.right_hip_yaw,
      this.defaultStanding.right_hip_roll,
      this.defaultStanding.right_knee_pitch,
      this.defaultStanding.right_ankle_pitch,
    ];

    // Ensure defaultPos has the correct length
    if (this.defaultPos.length !== this.cfg.num_actions) {
      console.error(
        `Default position length (${this.defaultPos.length}) does not match num_actions (${this.cfg.num_actions}). Padding with zeros.`,
      );
    }

    this.targetQ = new Array(this.cfg.num_actions).fill(0); // Initialize target position to 0
    this.targetDQ = new Array(this.cfg.num_actions).fill(0); // Target velocity

    this.count_lowlevel = 0;
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

  // Add logic for different models
  async loadPPOModel() {
    await this.ppoModel.loadModel("/examples/models/standing.onnx");
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

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // render loop
  async render(timeMS) {
    if (!this.isSimulationReady) {
      console.log("Simulation not ready yet, skipping render");
      return;
    }

    this.controls.update();

    if (!this.params["paused"]) {
      // 1000hz -> 100hz
      if (
        this.count_lowlevel % this.cfg.sim_config.decimation === 0 &&
        !this.customCommandActive
      ) {
        // Prepare the current observation
        const observation = this.getCurrentObservation();

        // Update the observation buffer
        this.updateObservationBuffer(observation);

        // Use PPO model to get actions for initial stand-up
        const flattenedObservation = this.obsBuffer.flat();
        const actions = await this.ppoModel.predict(flattenedObservation);

        if (actions) {
          // Apply actions to the simulation for standing up straight
          for (let i = 0; i < actions.length; i++) {
            this.targetQ[i] = actions[i] * this.cfg.control.action_scale;
          }
          this.lastAction = actions;
        }
      }

      if (this.customCommandActive) {
        this.targetQ = this.customActions;
        this.customCommandActive = false;
      }

      // Get current joint positions and velocities
      const q = Array.from(this.simulation.qpos.slice(-this.cfg.num_actions));
      const dq = Array.from(this.simulation.qvel.slice(-this.cfg.num_actions));

      // Calculate PD control
      const tau = this.pdControl(
        this.targetQ,
        q,
        this.kps,
        this.targetDQ,
        dq,
        this.kds,
        this.defaultPos,
      );

      // Apply torques to the simulation
      for (let i = 0; i < tau.length; i++) {
        this.simulation.ctrl[i] = tau[i];
      }

      // Clear old perturbations, apply new ones.
      for (let i = 0; i < this.simulation.qfrc_applied.length; i++) {
        this.simulation.qfrc_applied[i] = 0.0;
      }

      // Handle dragging logic
      let dragged = this.dragStateManager.physicsObject;
      if (dragged && dragged.bodyID !== undefined) {
        let bodyID = dragged.bodyID;
        this.dragStateManager.update(); // Update the world-space force origin
        let force = toMujocoPos(
          this.dragStateManager.currentWorld
            .clone()
            .sub(this.dragStateManager.worldHit)
            .multiplyScalar(
              this.model.body_mass[bodyID] * this.params.dragStrength,
            ),
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
      }

      // Step the simulation
      this.simulation.step();
      this.mujoco_time += this.model.getOptions().timestep * 1000.0;
      this.count_lowlevel++;
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

  quatToEuler(quat) {
    let euler = new THREE.Euler();
    let three_quat = new THREE.Quaternion(quat[0], quat[1], quat[2], quat[3]);
    euler.setFromQuaternion(three_quat);
    return euler;
  }

  quaternionToEuler(quat) {
    const euler = new THREE.Euler();
    const threeQuat = new THREE.Quaternion(quat[1], quat[2], quat[3], quat[0]);
    euler.setFromQuaternion(threeQuat);
    return [euler.x, euler.y, euler.z];
  }

  getCurrentObservation() {
    const q = Array.from(this.simulation.qpos.slice(-this.cfg.num_actions));
    const dq = Array.from(this.simulation.qvel.slice(-this.cfg.num_actions));
    const quat = Array.from(this.simulation.sensordata.slice(-7, -3));
    const omega = Array.from(this.simulation.sensordata.slice(-3));

    // Convert quaternion to Euler angles
    const eulerAngles = this.quaternionToEuler(quat);

    // Get gravity vector in base frame
    const r = new THREE.Quaternion(quat[1], quat[2], quat[3], quat[0]);
    const gvec = new THREE.Vector3(0, 0, -1).applyQuaternion(r.invert());

    // Get velocity in base frame
    const v = new THREE.Vector3(
      ...this.simulation.qvel.slice(0, 3),
    ).applyQuaternion(r.invert());

    const obs = new Array(this.cfg.env.num_single_obs);
    let index = 0;

    // Add sinusoidal time component
    obs[index++] = Math.sin(
      (2 * Math.PI * this.mujoco_time * this.cfg.sim_config.dt) / 0.64,
    );
    obs[index++] = Math.cos(
      (2 * Math.PI * this.mujoco_time * this.cfg.sim_config.dt) / 0.64,
    );

    // Add command velocities (assuming you have these)
    obs[index++] = this.cmd.vx * this.cfg.normalization.obs_scales.lin_vel;
    obs[index++] = this.cmd.vy * this.cfg.normalization.obs_scales.lin_vel;
    obs[index++] = this.cmd.dyaw * this.cfg.normalization.obs_scales.ang_vel;

    // Add scaled joint positions
    for (let i = 0; i < this.cfg.num_actions; i++) {
      obs[index++] =
        (q[i] - this.defaultPos[i]) * this.cfg.normalization.obs_scales.dof_pos;
    }

    // Add scaled joint velocities
    for (let i = 0; i < this.cfg.num_actions; i++) {
      obs[index++] = dq[i] * this.cfg.normalization.obs_scales.dof_vel;
    }

    // Add last actions
    for (let i = 0; i < this.cfg.num_actions; i++) {
      obs[index++] = this.lastAction[i];
    }

    // Add angular velocity
    obs[index++] = omega[0];
    obs[index++] = omega[1];
    obs[index++] = omega[2];

    // Add Euler angles
    obs[index++] = eulerAngles[0];
    obs[index++] = eulerAngles[1];
    obs[index++] = eulerAngles[2];

    // Clip observations
    for (let i = 0; i < obs.length; i++) {
      obs[i] = Math.max(
        Math.min(obs[i], this.cfg.normalization.clip_observations),
        -this.cfg.normalization.clip_observations,
      );
    }

    return obs;
  }

  createZeroObservation() {
    return {
      q: Array(10).fill(0),
      dq: Array(10).fill(0),
      quat: Array(4).fill(0),
      omega: Array(3).fill(0),
    };
  }

  updateObservationBuffer(observation) {
    // shift the buffer and add the new observation
    this.obsBuffer.shift();
    this.obsBuffer.push(observation);
  }

  pdControl(targetQ, q, kps, targetDQ, dq, kds, defaultPos) {
    const tau = new Array(this.cfg.num_actions);
    for (let i = 0; i < this.cfg.num_actions; i++) {
      tau[i] = kps[i] * (targetQ[i] + defaultPos[i] - q[i]) - kds[i] * dq[i];
      // Clamp torques
      tau[i] = Math.max(-this.tauLimit[i], Math.min(this.tauLimit[i], tau[i]));
    }
    return tau;
  }
}

let demo = new MuJoCoDemo();
await demo.init();
