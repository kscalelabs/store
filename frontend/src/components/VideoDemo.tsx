import React from "react";

interface VideoDemoProps {
  src: string;
  type: "youtube" | "s3" | "local";
  title?: string;
  autoplay?: boolean;
}

export const VideoDemo: React.FC<VideoDemoProps> = ({
  src,
  type,
  title,
  autoplay = false,
}) => {
  if (type === "youtube") {
    const youtubeParams = new URLSearchParams({
      autoplay: autoplay ? "1" : "0",
      controls: "0",
      showinfo: "0",
      rel: "0",
      loop: "1",
      playlist: src.split("/").pop() || "",
    }).toString();

    const embedUrl = `${src}?${youtubeParams}`;

    return (
      <iframe
        className="w-full h-full"
        src={embedUrl}
        title={title || "YouTube video player"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    );
  } else {
    return (
      <video
        className="w-full h-full object-cover"
        autoPlay={autoplay}
        loop
        muted
        playsInline
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }
};
