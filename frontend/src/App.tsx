import React from "react";
import "./App.css";

function App() {
  return (
    <div className="container">
      <div className="content">
        <h1>K-Scale Store</h1>
        <h2>Stompy</h2>
        <p>Stompy artifact downloads</p>
        <p>
          <small>
            Warning: these will change periodically as we update the model
          </small>
        </p>
        <ul>
          <li>
            <a href="https://media.kscale.dev/stompy/latest_stl_urdf.tar.gz">
              URDF (with STLs)
            </a>
          </li>
          <li>
            <a href="https://media.kscale.dev/stompy/latest_obj_urdf.tar.gz">
              URDF (with OBJs)
            </a>
          </li>
          <li>
            <a href="https://media.kscale.dev/stompy/latest_mjcf.tar.gz">
              MJCF
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

export default App;
