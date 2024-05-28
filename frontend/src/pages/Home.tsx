import React from "react";
import { Link } from "react-router-dom";

const RobotDetails = () => {
  return (
    <div>
      <h2>Home</h2>
      <p>Welcome to RoboList!</p>
      <ul>
        <li>
          <Link to="/robots/">Robots</Link>
        </li>
        <li>
          <Link to="/robots/1">Robot 1</Link>
        </li>
      </ul>
    </div>
  );
};

export default RobotDetails;
