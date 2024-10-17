import React from "react";

import MUJOCO from "../listing/mujoco";

const PlaygroundPage: React.FC = () => {
  return (
    <div className="">
      <MUJOCO url="/examples/scenes/stompypro.xml" />
    </div>
  );
};

export default PlaygroundPage;
