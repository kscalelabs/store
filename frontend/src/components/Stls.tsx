/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/* eslint-disable react/no-unknown-property */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from "react";

import { Edges, useSelect } from "@react-three/drei";

import { useControls } from "components/MultiLeva";

interface Props {
  stl: any;
  organName: string;
  color: string;
  opacity: number;
}

const Stls: FC<Props> = ({ organName, color, opacity, stl }) => {
  const selected = useSelect().map((sel) => sel.userData.store);
  const [store, materialProps] = useControls(selected, {
    name: { value: organName },
    color: { value: color },
    opacity: { value: opacity, min: 0.2, max: 1, step: 0.1 },
    visible: { value: true },
  });
  const isSelected = !!selected.find((sel) => sel === store);

  return (
    <mesh userData={{ store }} scale={1.2} castShadow receiveShadow>
      <primitive attach="geometry" object={stl}></primitive>
      <meshStandardMaterial {...materialProps} transparent />
      <Edges visible={isSelected} scale={1.1} renderOrder={1000}>
        <meshBasicMaterial transparent color="#e0d984" depthTest={false} />
      </Edges>
    </mesh>
  );
};

export default Stls;
