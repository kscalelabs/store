/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
// @ts-nocheck

/* eslint-disable react/no-unknown-property */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Dispatch, FC, SetStateAction, Suspense, useRef } from "react";

import { Center, Select } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { Object3D } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";

import Loader from "./Loader";
import Stls from "./Stls";

const files = ["bone", "heart", "LLL"];
const color = ["#9c9ea1", "#781e14", "#d66154"];
const opacity = [1, 1, 1];

interface Props {
  setSelected: Dispatch<SetStateAction<Object3D[] | undefined>>;
  url: string;
}

const Editor: FC<Props> = ({ setSelected, url }) => {
  const stl = useLoader(STLLoader, [url]);
  const group = useRef<any>(null!);

  return (
    <Suspense fallback={<Loader />}>
      <Center>
        <Select onChange={setSelected}>
          <group rotation={[-Math.PI / 2, 0, 0]} dispose={null} ref={group}>
            {stl.map((stl, idx) => (
              <Stls
                key={idx}
                opacity={opacity[idx]}
                organName={files[idx]}
                stl={stl}
                color={color[idx]}
              />
            ))}
          </group>
        </Select>
      </Center>
    </Suspense>
  );
};

export default Editor;
