import { BACKEND_URL } from "constants/backend";
import React from "react";

interface ImageProps {
  imageId: string;
}

const ImageComponent: React.FC<ImageProps> = ({ imageId }) => {
  return (
    <div style={{ width: "100%", paddingTop: "100%", position: "relative" }}>
      <img
        src={new URL("image/" + imageId, BACKEND_URL).toString()}
        alt="Robot"
        className="d-block rounded-lg"
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    </div>
  );
};

export default ImageComponent;
