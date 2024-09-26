import * as THREE from "three";

import { MuJoCoDemo } from "./main.js";
import { Reflector } from "./utils/Reflector.js";

export async function reloadFunc() {
  // Delete the old scene and load the new scene
  this.scene.remove(this.scene.getObjectByName("MuJoCo Root"));
  [this.model, this.state, this.simulation, this.bodies, this.lights] =
    await loadSceneFromURL(this.mujoco, this.params.scene, this);

  // console.log(this.model, this.state, this.simulation, this.bodies, this.lights);

  this.simulation.forward();
  for (let i = 0; i < this.updateGUICallbacks.length; i++) {
    this.updateGUICallbacks[i](this.model, this.simulation, this.params);
  }
}

/** @param {MuJoCoDemo} parentContext*/
export function setupGUI(parentContext) {
  // Make sure we reset the camera when the scene is changed or reloaded.
  parentContext.updateGUICallbacks.length = 0;
  parentContext.updateGUICallbacks.push((model, simulation, params) => {
    // TODO: Use free camera parameters from MuJoCo
    parentContext.camera.position.set(2.0, 1.7, 1.7);
    parentContext.controls.target.set(0, 0.7, 0);
    parentContext.controls.update();
  });

  parentContext.allScenes = {
    Humanoid: "humanoid.xml",
  };

  // Add scene selection dropdown.
  let reload = reloadFunc.bind(parentContext);
  let sceneDropdown = parentContext.gui
    .add(parentContext.params, "scene", parentContext.allScenes)
    .name("Example Scene")
    .onChange(reload);

  // Add upload button
  let uploadButton = {
    upload: function () {
      let input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept = ".xml,.obj,.stl";
      input.onchange = async function (event) {
        let files = event.target.files;
        let xmlFile = null;
        let meshFiles = [];
        let newSceneName = "";

        for (let file of files) {
          if (file.name.endsWith(".xml")) {
            xmlFile = file;
            newSceneName = file.name.split(".")[0];
          } else {
            meshFiles.push(file);
          }
        }

        if (!xmlFile) {
          alert("Please include an XML file.");
          return;
        }

        // Create 'working' directory if it doesn't exist
        if (!parentContext.mujoco.FS.analyzePath("/working").exists) {
          parentContext.mujoco.FS.mkdir("/working");
        }

        // Write XML file
        let xmlContent = await xmlFile.arrayBuffer();
        parentContext.mujoco.FS.writeFile(
          `/working/${xmlFile.name}`,
          new Uint8Array(xmlContent),
        );

        // Write mesh files
        for (let meshFile of meshFiles) {
          let meshContent = await meshFile.arrayBuffer();
          parentContext.mujoco.FS.writeFile(
            `/working/${meshFile.name}`,
            new Uint8Array(meshContent),
          );
        }

        // Update scene dropdown
        parentContext.allScenes[newSceneName] = xmlFile.name;
        updateSceneDropdown(sceneDropdown, parentContext.allScenes);

        parentContext.params.scene = xmlFile.name;

        console.log(
          `Uploaded ${xmlFile.name} and ${meshFiles.length} mesh file(s)`,
        );
        // alert(`Uploaded ${xmlFile.name} and ${meshFiles.length} mesh file(s)`);

        // Trigger a reload of the scene
        reload();
      };
      input.click();
    },
  };

  parentContext.gui.add(uploadButton, "upload").name("Upload Scene");

  // Add a help menu.
  // Parameters:
  //  Name: "Help".
  //  When pressed, a help menu is displayed in the top left corner. When pressed again
  //  the help menu is removed.
  //  Can also be triggered by pressing F1.
  // Has a dark transparent background.
  // Has two columns: one for putting the action description, and one for the action key trigger.keyframeNumber
  let keyInnerHTML = "";
  let actionInnerHTML = "";
  const displayHelpMenu = () => {
    if (parentContext.params.help) {
      const helpMenu = document.createElement("div");
      helpMenu.style.position = "absolute";
      helpMenu.style.top = "10px";
      helpMenu.style.left = "10px";
      helpMenu.style.color = "white";
      helpMenu.style.font = "normal 18px Arial";
      helpMenu.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
      helpMenu.style.padding = "10px";
      helpMenu.style.borderRadius = "10px";
      helpMenu.style.display = "flex";
      helpMenu.style.flexDirection = "column";
      helpMenu.style.alignItems = "center";
      helpMenu.style.justifyContent = "center";
      helpMenu.style.width = "400px";
      helpMenu.style.height = "400px";
      helpMenu.style.overflow = "auto";
      helpMenu.style.zIndex = "1000";

      const helpMenuTitle = document.createElement("div");
      helpMenuTitle.style.font = "bold 24px Arial";
      helpMenuTitle.innerHTML = "";
      helpMenu.appendChild(helpMenuTitle);

      const helpMenuTable = document.createElement("table");
      helpMenuTable.style.width = "100%";
      helpMenuTable.style.marginTop = "10px";
      helpMenu.appendChild(helpMenuTable);

      const helpMenuTableBody = document.createElement("tbody");
      helpMenuTable.appendChild(helpMenuTableBody);

      const helpMenuRow = document.createElement("tr");
      helpMenuTableBody.appendChild(helpMenuRow);

      const helpMenuActionColumn = document.createElement("td");
      helpMenuActionColumn.style.width = "50%";
      helpMenuActionColumn.style.textAlign = "right";
      helpMenuActionColumn.style.paddingRight = "10px";
      helpMenuRow.appendChild(helpMenuActionColumn);

      const helpMenuKeyColumn = document.createElement("td");
      helpMenuKeyColumn.style.width = "50%";
      helpMenuKeyColumn.style.textAlign = "left";
      helpMenuKeyColumn.style.paddingLeft = "10px";
      helpMenuRow.appendChild(helpMenuKeyColumn);

      const helpMenuActionText = document.createElement("div");
      helpMenuActionText.innerHTML = actionInnerHTML;
      helpMenuActionColumn.appendChild(helpMenuActionText);

      const helpMenuKeyText = document.createElement("div");
      helpMenuKeyText.innerHTML = keyInnerHTML;
      helpMenuKeyColumn.appendChild(helpMenuKeyText);

      // Close buttom in the top.
      const helpMenuCloseButton = document.createElement("button");
      helpMenuCloseButton.innerHTML = "Close";
      helpMenuCloseButton.style.position = "absolute";
      helpMenuCloseButton.style.top = "10px";
      helpMenuCloseButton.style.right = "10px";
      helpMenuCloseButton.style.zIndex = "1001";
      helpMenuCloseButton.onclick = () => {
        helpMenu.remove();
      };
      helpMenu.appendChild(helpMenuCloseButton);

      document.body.appendChild(helpMenu);
    } else {
      document.body.removeChild(document.body.lastChild);
    }
  };

  document.addEventListener("keydown", (event) => {
    if (event.key === "F1") {
      parentContext.params.help = !parentContext.params.help;
      displayHelpMenu();
      event.preventDefault();
    }
  });
  keyInnerHTML += "F1<br>";
  actionInnerHTML += "Help<br>";

  let simulationFolder = parentContext.gui.addFolder("Simulation");

  // Add pause simulation checkbox.
  // Parameters:
  //  Under "Simulation" folder.
  //  Name: "Pause Simulation".
  //  When paused, a "pause" text in white is displayed in the top left corner.
  //  Can also be triggered by pressing the spacebar.
  const pauseSimulation = simulationFolder
    .add(parentContext.params, "paused")
    .name("Pause Simulation");
  pauseSimulation.onChange((value) => {
    if (value) {
      const pausedText = document.createElement("div");
      pausedText.style.position = "absolute";
      pausedText.style.top = "10px";
      pausedText.style.left = "10px";
      pausedText.style.color = "white";
      pausedText.style.font = "normal 18px Arial";
      pausedText.innerHTML = "pause";
      parentContext.container.appendChild(pausedText);
    } else {
      parentContext.container.removeChild(parentContext.container.lastChild);
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      parentContext.params.paused = !parentContext.params.paused;
      pauseSimulation.setValue(parentContext.params.paused);
      event.preventDefault();
    }
  });
  actionInnerHTML += "Play / Pause<br>";
  keyInnerHTML += "Space<br>";

  // Add enable / disable model checkbox.
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.code === "KeyM") {
      parentContext.params.useModel = !parentContext.params.useModel;
      event.preventDefault();
    }
  });
  actionInnerHTML += "Enable / Disable Model<br>";
  keyInnerHTML += "Ctrl M<br>";

  // Add reload model button.
  // Parameters:
  //  Under "Simulation" folder.
  //  Name: "Reload".
  //  When pressed, calls the reload function.
  //  Can also be triggered by pressing ctrl + L.
  simulationFolder
    .add(
      {
        reload: () => {
          reload();
        },
      },
      "reload",
    )
    .name("Reload");
  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.code === "KeyL") {
      reload();
      event.preventDefault();
    }
  });
  actionInnerHTML += "Reload XML<br>";
  keyInnerHTML += "Ctrl L<br>";

  // Add reset simulation button.
  // Parameters:
  //  Under "Simulation" folder.
  //  Name: "Reset".
  //  When pressed, resets the simulation to the initial state.
  //  Can also be triggered by pressing backspace.
  const resetSimulation = () => {
    parentContext.simulation.resetData();
    parentContext.simulation.forward();
  };
  simulationFolder
    .add(
      {
        reset: () => {
          resetSimulation();
        },
      },
      "reset",
    )
    .name("Reset");
  document.addEventListener("keydown", (event) => {
    if (event.code === "Backspace") {
      resetSimulation();
      event.preventDefault();
    }
  });
  actionInnerHTML += "Reset simulation<br>";
  keyInnerHTML += "Backspace<br>";

  // Add keyframe slider.
  let nkeys = parentContext.model.nkey;
  let keyframeGUI = simulationFolder
    .add(parentContext.params, "keyframeNumber", 0, nkeys - 1, 1)
    .name("Load Keyframe")
    .listen();
  keyframeGUI.onChange((value) => {
    if (value < parentContext.model.nkey) {
      parentContext.simulation.qpos.set(
        parentContext.model.key_qpos.slice(
          value * parentContext.model.nq,
          (value + 1) * parentContext.model.nq,
        ),
      );
    }
  });
  parentContext.updateGUICallbacks.push((model, simulation, params) => {
    let nkeys = parentContext.model.nkey;
    console.log("new model loaded. has " + nkeys + " keyframes.");
    if (nkeys > 0) {
      keyframeGUI.max(nkeys - 1);
      keyframeGUI.domElement.style.opacity = 1.0;
    } else {
      // Disable keyframe slider if no keyframes are available.
      keyframeGUI.max(0);
      keyframeGUI.domElement.style.opacity = 0.5;
    }
  });

  // Add sliders for ctrlnoiserate and ctrlnoisestd; min = 0, max = 2, step = 0.01.
  simulationFolder
    .add(parentContext.params, "ctrlnoiserate", 0.0, 2.0, 0.01)
    .name("Noise rate");
  simulationFolder
    .add(parentContext.params, "ctrlnoisestd", 0.0, 2.0, 0.01)
    .name("Noise scale");

  let textDecoder = new TextDecoder("utf-8");
  let nullChar = textDecoder.decode(new ArrayBuffer(1));

  // Add actuator sliders.
  let actuatorFolder = simulationFolder.addFolder("Actuators");
  const addActuators = (model, simulation, params) => {
    let act_range = model.actuator_ctrlrange;
    let actuatorGUIs = [];
    for (let i = 0; i < model.nu; i++) {
      if (!model.actuator_ctrllimited[i]) {
        continue;
      }
      let name = textDecoder
        .decode(
          parentContext.model.names.subarray(
            parentContext.model.name_actuatoradr[i],
          ),
        )
        .split(nullChar)[0];

      parentContext.params[name] = 0.0;
      let actuatorGUI = actuatorFolder
        .add(
          parentContext.params,
          name,
          act_range[2 * i],
          act_range[2 * i + 1],
          0.01,
        )
        .name(name)
        .listen();
      actuatorGUIs.push(actuatorGUI);
      actuatorGUI.onChange((value) => {
        console.log("value", value);
        simulation.ctrl[i] = value;
      });
    }
    return actuatorGUIs;
  };
  let actuatorGUIs = addActuators(
    parentContext.model,
    parentContext.simulation,
    parentContext.params,
  );
  parentContext.updateGUICallbacks.push((model, simulation, params) => {
    for (let i = 0; i < actuatorGUIs.length; i++) {
      actuatorGUIs[i].destroy();
    }
    actuatorGUIs = addActuators(model, simulation, parentContext.params);
  });
  actuatorFolder.close();

  // Add function that resets the camera to the default position.
  // Can be triggered by pressing ctrl + A.
  document.addEventListener("keydown", (event) => {
    console.log("event", event);
    if (event.ctrlKey && event.code === "KeyA") {
      // TODO: Use free camera parameters from MuJoCo
      parentContext.camera.position.set(2.0, 1.7, 1.7);
      parentContext.controls.target.set(0, 0.7, 0);
      parentContext.controls.update();
      event.preventDefault();
    }
  });
  actionInnerHTML += "Reset free camera<br>";
  keyInnerHTML += "Ctrl A<br>";

  // Adjust the style of the GUI
  const uiContainer = document.getElementById("mujoco-ui-container");
  if (uiContainer) {
    uiContainer.appendChild(parentContext.gui.domElement);
    parentContext.gui.domElement.style.position = "relative";
    parentContext.gui.domElement.style.top = "10px";
    parentContext.gui.domElement.style.right = "10px";
  } else {
    console.warn(
      "mujoco-ui-container not found. Falling back to fixed positioning.",
    );
    parentContext.gui.domElement.style.position = "fixed";
    parentContext.gui.domElement.style.top = "10px";
    parentContext.gui.domElement.style.right = "10px";
  }

  // Add this at the end of the setupGUI function
  const appBody = document.getElementById("appbody");
  if (appBody) {
    const urdfUrl = appBody.getAttribute("data-urdf-url");
    if (urdfUrl) {
      autoUploadURDFTar(parentContext, urdfUrl, reload);
    }
  }

  parentContext.gui.open();
}

function updateSceneDropdown(dropdown, scenes) {
  // Store the current onChange function
  let onChangeFunc = dropdown.__onChange;

  // Remove all options
  if (dropdown.__elect && dropdown.__select.options) {
    dropdown.__select.options.length = 0;
  }

  console.log(scenes);
  dropdown.__select = document.createElement("select");

  // Add new options
  for (let [name, file] of Object.entries(scenes)) {
    let option = document.createElement("option");
    option.text = name;
    option.value = file;
    dropdown.__select.add(option);
  }

  // Restore the onChange function
  dropdown.__onChange = onChangeFunc;
}

/** Loads a scene for MuJoCo
 * @param {mujoco} mujoco This is a reference to the mujoco namespace object
 * @param {string} filename This is the name of the .xml file in the /working/ directory of the MuJoCo/Emscripten Virtual File System
 * @param {MuJoCoDemo} parent The three.js Scene Object to add the MuJoCo model elements to
 */
export async function loadSceneFromURL(mujoco, filename, parent) {
  // Free the old simulation.
  if (parent.simulation != null) {
    parent.simulation.free();
    parent.model = null;
    parent.state = null;
    parent.simulation = null;
    parent.ppo_model = null;
  }

  // Function to capture and log errors
  mujoco.mj_error = function (msg) {
    console.error("MuJoCo Error: " + msg);
  };

  // Function to capture and log warnings
  mujoco.mj_warning = function (msg) {
    console.warn("MuJoCo Warning: " + msg);
  };

  // Load in the state from XML.
  try {
    console.log("loading model from", "/working/" + filename);
    parent.model = mujoco.Model.load_from_xml("/working/" + filename);
  } catch (error) {
    console.error("Failed to load model:", error);
  }
  parent.state = new mujoco.State(parent.model);
  parent.simulation = new mujoco.Simulation(parent.model, parent.state);

  parent.actuatorNames = [];
  parent.actuatorRanges = [];
  parent.loadPPOModel();
  parent.initializeActuators();

  let model = parent.model;
  let state = parent.state;
  let simulation = parent.simulation;

  // Decode the null-terminated string names.
  let textDecoder = new TextDecoder("utf-8");
  let fullString = textDecoder.decode(model.names);
  let names = fullString.split(textDecoder.decode(new ArrayBuffer(1)));

  // Create the root object.
  let mujocoRoot = new THREE.Group();
  mujocoRoot.name = "MuJoCo Root";
  parent.scene.add(mujocoRoot);

  /** @type {Object.<number, THREE.Group>} */
  let bodies = {};
  /** @type {Object.<number, THREE.BufferGeometry>} */
  let meshes = {};
  /** @type {THREE.Light[]} */
  let lights = [];

  // Default material definition.
  let material = new THREE.MeshPhysicalMaterial();
  material.color = new THREE.Color(1, 1, 1);

  // Loop through the MuJoCo geoms and recreate them in three.js.
  for (let g = 0; g < model.ngeom; g++) {
    // Only visualize geom groups up to 2 (same default behavior as simulate).
    if (!(model.geom_group[g] < 3)) {
      continue;
    }

    // Get the body ID and type of the geom.
    let b = model.geom_bodyid[g];
    let type = model.geom_type[g];
    let size = [
      model.geom_size[g * 3 + 0],
      model.geom_size[g * 3 + 1],
      model.geom_size[g * 3 + 2],
    ];

    // Create the body if it doesn't exist.
    if (!(b in bodies)) {
      bodies[b] = new THREE.Group();
      bodies[b].name = names[model.name_bodyadr[b]];
      bodies[b].bodyID = b;
      bodies[b].has_custom_mesh = false;
    }

    // Set the default geometry. In MuJoCo, this is a sphere.
    let geometry = new THREE.SphereGeometry(size[0] * 0.5);
    if (type == mujoco.mjtGeom.mjGEOM_PLANE.value) {
      // Special handling for plane later.
    } else if (type == mujoco.mjtGeom.mjGEOM_HFIELD.value) {
      // TODO: Implement this.
    } else if (type == mujoco.mjtGeom.mjGEOM_SPHERE.value) {
      geometry = new THREE.SphereGeometry(size[0]);
    } else if (type == mujoco.mjtGeom.mjGEOM_CAPSULE.value) {
      geometry = new THREE.CapsuleGeometry(size[0], size[1] * 2.0, 20, 20);
    } else if (type == mujoco.mjtGeom.mjGEOM_ELLIPSOID.value) {
      geometry = new THREE.SphereGeometry(1); // Stretch this below
    } else if (type == mujoco.mjtGeom.mjGEOM_CYLINDER.value) {
      geometry = new THREE.CylinderGeometry(size[0], size[0], size[1] * 2.0);
    } else if (type == mujoco.mjtGeom.mjGEOM_BOX.value) {
      geometry = new THREE.BoxGeometry(
        size[0] * 2.0,
        size[2] * 2.0,
        size[1] * 2.0,
      );
    } else if (type == mujoco.mjtGeom.mjGEOM_MESH.value) {
      let meshID = model.geom_dataid[g];

      if (!(meshID in meshes)) {
        geometry = new THREE.BufferGeometry(); // TODO: Populate the Buffer Geometry with Generic Mesh Data

        let vertex_buffer = model.mesh_vert.subarray(
          model.mesh_vertadr[meshID] * 3,
          (model.mesh_vertadr[meshID] + model.mesh_vertnum[meshID]) * 3,
        );
        for (let v = 0; v < vertex_buffer.length; v += 3) {
          //vertex_buffer[v + 0] =  vertex_buffer[v + 0];
          let temp = vertex_buffer[v + 1];
          vertex_buffer[v + 1] = vertex_buffer[v + 2];
          vertex_buffer[v + 2] = -temp;
        }

        let normal_buffer = model.mesh_normal.subarray(
          model.mesh_vertadr[meshID] * 3,
          (model.mesh_vertadr[meshID] + model.mesh_vertnum[meshID]) * 3,
        );
        for (let v = 0; v < normal_buffer.length; v += 3) {
          //normal_buffer[v + 0] =  normal_buffer[v + 0];
          let temp = normal_buffer[v + 1];
          normal_buffer[v + 1] = normal_buffer[v + 2];
          normal_buffer[v + 2] = -temp;
        }

        let uv_buffer = model.mesh_texcoord.subarray(
          model.mesh_texcoordadr[meshID] * 2,
          (model.mesh_texcoordadr[meshID] + model.mesh_vertnum[meshID]) * 2,
        );
        let triangle_buffer = model.mesh_face.subarray(
          model.mesh_faceadr[meshID] * 3,
          (model.mesh_faceadr[meshID] + model.mesh_facenum[meshID]) * 3,
        );
        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertex_buffer, 3),
        );
        geometry.setAttribute(
          "normal",
          new THREE.BufferAttribute(normal_buffer, 3),
        );
        geometry.setAttribute("uv", new THREE.BufferAttribute(uv_buffer, 2));
        geometry.setIndex(Array.from(triangle_buffer));
        meshes[meshID] = geometry;
      } else {
        geometry = meshes[meshID];
      }

      bodies[b].has_custom_mesh = true;
    }
    // Done with geometry creation.

    // Set the Material Properties of incoming bodies
    let texture = undefined;
    let color = [
      model.geom_rgba[g * 4 + 0],
      model.geom_rgba[g * 4 + 1],
      model.geom_rgba[g * 4 + 2],
      model.geom_rgba[g * 4 + 3],
    ];
    if (model.geom_matid[g] != -1) {
      let matId = model.geom_matid[g];
      color = [
        model.mat_rgba[matId * 4 + 0],
        model.mat_rgba[matId * 4 + 1],
        model.mat_rgba[matId * 4 + 2],
        model.mat_rgba[matId * 4 + 3],
      ];

      // Construct Texture from model.tex_rgb
      texture = undefined;
      let texId = model.mat_texid[matId];
      if (texId != -1) {
        let width = model.tex_width[texId];
        let height = model.tex_height[texId];
        let offset = model.tex_adr[texId];
        let rgbArray = model.tex_rgb;
        let rgbaArray = new Uint8Array(width * height * 4);
        for (let p = 0; p < width * height; p++) {
          rgbaArray[p * 4 + 0] = rgbArray[offset + (p * 3 + 0)];
          rgbaArray[p * 4 + 1] = rgbArray[offset + (p * 3 + 1)];
          rgbaArray[p * 4 + 2] = rgbArray[offset + (p * 3 + 2)];
          rgbaArray[p * 4 + 3] = 1.0;
        }
        texture = new THREE.DataTexture(
          rgbaArray,
          width,
          height,
          THREE.RGBAFormat,
          THREE.UnsignedByteType,
        );
        if (texId == 2) {
          texture.repeat = new THREE.Vector2(50, 50);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
        } else {
          texture.repeat = new THREE.Vector2(1, 1);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
        }

        texture.needsUpdate = true;
      }
    }

    if (
      material.color.r != color[0] ||
      material.color.g != color[1] ||
      material.color.b != color[2] ||
      material.opacity != color[3] ||
      material.map != texture
    ) {
      material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(color[0], color[1], color[2]),
        transparent: color[3] < 1.0,
        opacity: color[3],
        specularIntensity:
          model.geom_matid[g] != -1
            ? model.mat_specular[model.geom_matid[g]] * 0.5
            : undefined,
        reflectivity:
          model.geom_matid[g] != -1
            ? model.mat_reflectance[model.geom_matid[g]]
            : undefined,
        roughness:
          model.geom_matid[g] != -1
            ? 1.0 - model.mat_shininess[model.geom_matid[g]]
            : undefined,
        metalness: model.geom_matid[g] != -1 ? 0.1 : undefined,
        map: texture,
      });
    }

    let mesh = new THREE.Mesh();
    if (type == 0) {
      mesh = new Reflector(new THREE.PlaneGeometry(100, 100), {
        clipBias: 0.003,
        texture: texture,
      });
      mesh.rotateX(-Math.PI / 2);
    } else {
      mesh = new THREE.Mesh(geometry, material);
    }

    mesh.castShadow = g == 0 ? false : true;
    mesh.receiveShadow = type != 7;
    mesh.bodyID = b;
    bodies[b].add(mesh);
    getPosition(model.geom_pos, g, mesh.position);
    if (type != 0) {
      getQuaternion(model.geom_quat, g, mesh.quaternion);
    }
    if (type == 4) {
      mesh.scale.set(size[0], size[2], size[1]);
    } // Stretch the Ellipsoid
  }

  // Parse tendons.
  let tendonMat = new THREE.MeshPhongMaterial();
  tendonMat.color = new THREE.Color(0.8, 0.3, 0.3);
  mujocoRoot.cylinders = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(1, 1, 1),
    tendonMat,
    1023,
  );
  mujocoRoot.cylinders.receiveShadow = true;
  mujocoRoot.cylinders.castShadow = true;
  mujocoRoot.add(mujocoRoot.cylinders);
  mujocoRoot.spheres = new THREE.InstancedMesh(
    new THREE.SphereGeometry(1, 10, 10),
    tendonMat,
    1023,
  );
  mujocoRoot.spheres.receiveShadow = true;
  mujocoRoot.spheres.castShadow = true;
  mujocoRoot.add(mujocoRoot.spheres);

  // Parse lights.
  for (let l = 0; l < model.nlight; l++) {
    let light = new THREE.SpotLight();
    if (model.light_directional[l]) {
      light = new THREE.DirectionalLight();
    } else {
      light = new THREE.SpotLight();
    }
    light.decay = model.light_attenuation[l] * 100;
    light.penumbra = 0.5;
    light.castShadow = true; // default false

    light.shadow.mapSize.width = 1024; // default
    light.shadow.mapSize.height = 1024; // default
    light.shadow.camera.near = 1; // default
    light.shadow.camera.far = 10; // default
    //bodies[model.light_bodyid()].add(light);
    if (bodies[0]) {
      bodies[0].add(light);
    } else {
      mujocoRoot.add(light);
    }
    lights.push(light);
  }
  if (model.nlight == 0) {
    let light = new THREE.DirectionalLight();
    mujocoRoot.add(light);
  }

  for (let b = 0; b < model.nbody; b++) {
    //let parent_body = model.body_parentid()[b];
    if (b == 0 || !bodies[0]) {
      mujocoRoot.add(bodies[b]);
    } else if (bodies[b]) {
      bodies[0].add(bodies[b]);
    } else {
      console.log(
        "Body without Geometry detected; adding to bodies",
        b,
        bodies[b],
      );
      bodies[b] = new THREE.Group();
      bodies[b].name = names[b + 1];
      bodies[b].bodyID = b;
      bodies[b].has_custom_mesh = false;
      bodies[0].add(bodies[b]);
    }
  }

  parent.mujocoRoot = mujocoRoot;

  return [model, state, simulation, bodies, lights];
}

/** Downloads the scenes/examples folder to MuJoCo's virtual filesystem
 * @param {mujoco} mujoco */
export async function downloadExampleScenesFolder(mujoco) {

  let allFiles = ["humanoid.xml", "scene.xml", "dora2.xml", "stompypro.xml"];

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

  allFiles = allFiles.concat(

    meshFilesListDora2.map((mesh) => "/dora_meshes/" + mesh),
  );

  allFiles = allFiles.concat(

    meshFilesListStompyPro.map((mesh) => "/stompypro_meshes/" + mesh),
  );

  let requests = allFiles.map((url) => fetch("/examples/scenes/" + url));
  let responses = await Promise.all(requests);

  for (let i = 0; i < responses.length; i++) {
    let split = allFiles[i].split("/");
    let working = "/working/";
    for (let f = 0; f < split.length - 1; f++) {
      working += split[f];
      if (!mujoco.FS.analyzePath(working).exists) {
        mujoco.FS.mkdir(working);
      }
      working += "/";
    }

    let filePath = "/working/" + allFiles[i];

    if (
      allFiles[i].endsWith(".png") ||
      allFiles[i].endsWith(".stl") ||
      allFiles[i].endsWith(".skn") ||
      allFiles[i].endsWith(".STL")
    ) {
      mujoco.FS.writeFile(
        filePath,
        new Uint8Array(await responses[i].arrayBuffer()),
      );
    } else {
      mujoco.FS.writeFile(filePath, await responses[i].text());
    }

    // Check if the file exists in the Mujoco filesystem after writing
    if (mujoco.FS.analyzePath(filePath).exists) {
      // console.log(mujoco.FS.readFile(filePath, { encoding: 'utf8' }));
      console.log(`File ${filePath} written successfully.`);
    } else {
      console.error(`Failed to write file ${filePath}.`);
    }
  }
}

/** Access the vector at index, swizzle for three.js, and apply to the target THREE.Vector3
 * @param {Float32Array|Float64Array} buffer
 * @param {number} index
 * @param {THREE.Vector3} target */
export function getPosition(buffer, index, target, swizzle = true) {
  if (swizzle) {
    return target.set(
      buffer[index * 3 + 0],
      buffer[index * 3 + 2],
      -buffer[index * 3 + 1],
    );
  } else {
    return target.set(
      buffer[index * 3 + 0],
      buffer[index * 3 + 1],
      buffer[index * 3 + 2],
    );
  }
}

/** Access the quaternion at index, swizzle for three.js, and apply to the target THREE.Quaternion
 * @param {Float32Array|Float64Array} buffer
 * @param {number} index
 * @param {THREE.Quaternion} target */
export function getQuaternion(buffer, index, target, swizzle = true) {
  if (swizzle) {
    return target.set(
      -buffer[index * 4 + 1],
      -buffer[index * 4 + 3],
      buffer[index * 4 + 2],
      -buffer[index * 4 + 0],
    );
  } else {
    return target.set(
      buffer[index * 4 + 0],
      buffer[index * 4 + 1],
      buffer[index * 4 + 2],
      buffer[index * 4 + 3],
    );
  }
}

/** Converts this Vector3's Handedness to MuJoCo's Coordinate Handedness
 * @param {THREE.Vector3} target */
export function toMujocoPos(target) {
  return target.set(target.x, -target.z, target.y);
}

/** Standard normal random number generator using Box-Muller transform */
export function standardNormal() {
  return (
    Math.sqrt(-2.0 * Math.log(Math.random())) *
    Math.cos(2.0 * Math.PI * Math.random())
  );
}

/* For external interaction */

// Simple tar extraction function
function untar(arrayBuffer) {
  const uint8Array = new Uint8Array(arrayBuffer);
  const files = [];
  let offset = 0;

  while (offset < uint8Array.length - 512) {
    const header = uint8Array.slice(offset, offset + 512);
    const fileName = new TextDecoder()
      .decode(header.slice(0, 100))
      .replace(/\0/g, "")
      .trim();

    if (fileName.length === 0) {
      break; // End of archive
    }

    const fileSize = parseInt(
      new TextDecoder().decode(header.slice(124, 136)).trim(),
      8,
    );
    const contentStartIndex = offset + 512;
    const contentEndIndex = contentStartIndex + fileSize;
    const content = uint8Array.slice(contentStartIndex, contentEndIndex);

    files.push({ name: fileName, buffer: content.buffer });

    offset = Math.ceil(contentEndIndex / 512) * 512;
  }

  return files;
}

export async function autoUploadURDFTar(parentContext, urdfTarUrl, reload) {
  try {
    console.log("Attempting to fetch:", urdfTarUrl);

    const response = await fetch(urdfTarUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const compressedData = await response.arrayBuffer();

    // Decompress the gzip data
    const inflatedData = pako.inflate(new Uint8Array(compressedData));

    // Extract the tar data
    const files = untar(inflatedData.buffer);

    let xmlFile = null;
    let meshFiles = [];
    let newSceneName = "";

    // Process extracted files
    for (const file of files) {
      if (file.name.endsWith(".xml")) {
        console.log("Found XML file:", file.name);
        xmlFile = {
          name: file.name,
          content: file.buffer,
        };
        newSceneName = file.name.split(".")[0];

        // Log the content of the XML file
        const xmlContent = new TextDecoder().decode(
          new Uint8Array(file.buffer),
        );
        console.log("XML file content:", xmlContent);
      } else if (
        file.name.endsWith(".stl") ||
        file.name.endsWith(".obj") ||
        file.name.endsWith(".STL") ||
        file.name.endsWith(".OBJ")
      ) {
        meshFiles.push({
          name: file.name,
          content: file.buffer,
        });
      } else {
        console.log("Skipping file:", file.name);
      }
    }

    if (!xmlFile) {
      throw new Error("No XML file found in the URDF tar");
    }

    // Create 'working' directory if it doesn't exist
    if (!parentContext.mujoco.FS.analyzePath("/working").exists) {
      parentContext.mujoco.FS.mkdir("/working");
    }

    // Write XML file
    parentContext.mujoco.FS.writeFile(
      `/working/${xmlFile.name}`,
      new Uint8Array(xmlFile.content),
    );

    // Write mesh files
    for (let meshFile of meshFiles) {
      parentContext.mujoco.FS.writeFile(
        `/working/${meshFile.name}`,
        new Uint8Array(meshFile.content),
      );
      console.log(meshFile.name);
    }

    // Update scene dropdown
    parentContext.allScenes[newSceneName] = xmlFile.name;
    console.log(parentContext.allScenes);
    if (parentContext.updateSceneDropdown) {
      parentContext.updateSceneDropdown(
        parentContext.sceneDropdown,
        parentContext.allScenes,
      );
    }

    parentContext.params.scene = xmlFile.name;
    reload();

    console.log(
      `Uploaded ${xmlFile.name} and ${meshFiles.length} mesh file(s)`,
    );
  } catch (error) {
    console.error("Error auto-uploading URDF tar:", error);
  }
}
