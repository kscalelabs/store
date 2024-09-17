import React, { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface ImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  quality?: number;
}

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  width,
  height,
  className = "",
  quality = 75,
}) => {
  const [imageSrc, setImageSrc] = useState<string>("");
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: "200px 0px",
  });

  useEffect(() => {
    if (inView) {
      // Simulate image optimization service (e.g., Cloudinary, Imgix)
      const optimizedSrc = `${src}?w=${width}&q=${quality}`;
      setImageSrc(optimizedSrc);
    }
  }, [inView, src, width, quality]);

  return (
    <div ref={ref} className={className} style={{ width, height }}>
      {inView && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          className={`w-full h-full object-cover ${className}`}
        />
      )}
    </div>
  );
};
