import useBoop from "hooks/useBoop";
import React from "react";
import { animated } from "react-spring";

interface BoopProps {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  timing?: number;
  children: React.ReactNode;
}

const Boop: React.FC<BoopProps> = ({
  x = 0,
  y = -0,
  rotation = 20,
  scale = 1,
  timing = 3000,
  children,
}) => {
  const [style, trigger] = useBoop({ x, y, rotation, scale, timing });

  return (
    <animated.span onMouseEnter={trigger} style={style}>
      {children}
    </animated.span>
  );
};

export default Boop;
