import React from "react";

interface ImageProps {
  url: string;
  caption?: string;
}

const ImageComponent: React.FC<ImageProps> = ({ url, caption }) => {
  return (
    <div style={{ width: "100%", paddingTop: "100%", position: "relative" }}>
      <img
        src={url}
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
