import React from "react";
import { SpringConfig, useSpring } from "react-spring";

interface UseBoopProps {
  x?: number;
  y?: number;
  rotation?: number;
  scale?: number;
  timing?: number;
  springConfig?: SpringConfig;
}

function useBoop({
  x = 100,
  y = 100,
  rotation = 0,
  scale = 1,
  timing = 150,
  springConfig = {
    tension: 300,
    friction: 10,
  },
}: UseBoopProps) {
  const [isBooped, setIsBooped] = React.useState(false);

  const style = useSpring({
    transform: isBooped
      ? `translate(${x}px, ${y}px)
         rotate(${rotation}deg)
         scale(${scale})`
      : `translate(0px, 0px)
         rotate(0deg)
         scale(1)`,
    config: springConfig,
  });

  React.useEffect(() => {
    if (!isBooped) {
      return;
    }
    // const timeoutId2 = window.setTimeout(() => {
    //     setIsBoopable
    // }
    const timeoutId = window.setTimeout(() => {
      setIsBooped(false);
    }, timing);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isBooped, timing]);

  const trigger = React.useCallback(() => {
    setIsBooped(true);
  }, []);

  const appliedStyle = style;
  return [appliedStyle, trigger] as const;
}

export default useBoop;
