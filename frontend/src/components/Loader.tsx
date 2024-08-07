import { Html, useProgress } from "@react-three/drei";

const Loader = () => {
  const { progress } = useProgress();

  return (
    <Html center>
      <span style={{ color: "white" }}>{Math.floor(progress)} % loaded</span>
    </Html>
  );
};

export default Loader;
