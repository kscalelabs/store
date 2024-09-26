import React from "react";

import MUJOCO from "../listing/mujoco";

const MuJoCoTestPage: React.FC = () => {
  return (
    <div className="absolute top-0 left-0 w-1/2 h-full">
      <MUJOCO url="/examples/scenes/stompypro.xml" />
    </div>
  );
};

export default MuJoCoTestPage;
