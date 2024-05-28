import React from "react";
import { useParams } from "react-router-dom";

const RobotDetails = () => {
  const { id } = useParams();
  return (
    <div>
      <h1>Robot Details</h1>
      <p>Robot ID: {id}</p>
    </div>
  );
};

export default RobotDetails;
