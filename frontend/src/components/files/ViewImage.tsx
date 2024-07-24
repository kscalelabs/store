import { S3_URL } from "constants/backend";
import React from "react";

interface ImageProps {
  imageId: string;
  caption: string;
}

const ImageComponent: React.FC<ImageProps> = ({ imageId, caption }) => {
  return (
    <div style={{ width: "100%", paddingTop: "100%", position: "relative" }}>
      <img
        src={new URL("images/" + imageId, S3_URL).toString()}
        alt={caption}
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
