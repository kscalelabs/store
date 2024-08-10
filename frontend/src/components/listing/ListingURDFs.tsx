import { Suspense, useState } from "react";
import { FaCaretSquareDown, FaCaretSquareUp, FaTimes } from "react-icons/fa";

import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { cx } from "class-variance-authority";
import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { Object3D } from "three";

import Editor from "components/Editor";
import Loader from "components/Loader";
import { Panel } from "components/MultiLeva";
import ListingFileUpload from "components/listing/ListingFileUpload";
import { Button } from "components/ui/Button/Button";

interface SingleStlViewerProps {
  url: string;
}

const SingleStlViewer = (props: SingleStlViewerProps) => {
  const { url } = props;
  const [selected, setSelected] = useState<Object3D[]>();

  return (
    <>
      <Canvas>
        <Suspense fallback={<Loader />}>
          <PerspectiveCamera
            makeDefault
            fov={50}
            aspect={window.innerWidth / window.innerHeight}
            position={[10, 8, 25]}
            near={0.1}
            far={500}></PerspectiveCamera>
          <Editor setSelected={setSelected} url={url} />
          <directionalLight color={0xeb4634} position={[1, 0.75, 0.5]} />
          <directionalLight color={0xccccff} position={[-1, 0.75, -0.5]} />
        </Suspense>
        <OrbitControls />
      </Canvas>
      <Panel selected={selected} />
    </>
  );
};

interface Props {
  listingId: string;
  edit: boolean;
  allArtifacts: components["schemas"]["ListArtifactsResponse"]["artifacts"];
}

const ListingSTLs = (props: Props) => {
  const { listingId, edit, allArtifacts } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [stls, setStls] = useState<
    components["schemas"]["ListArtifactsResponse"]["artifacts"]
  >(allArtifacts.filter((a) => a.artifact_type === "stl"));
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const [currentIdUnchecked, setCurrentId] = useState<number>(0);
  const currentId = Math.min(Math.max(currentIdUnchecked, 0), stls.length - 1);
  const stl = stls.length === 0 ? null : stls[currentId];

  const onDelete = async (stlId: string) => {
    setDeletingIds([...deletingIds, stlId]);

    const { error } = await auth.client.DELETE(
      "/artifacts/delete/{artifact_id}",
      {
        params: {
          path: { artifact_id: stlId },
        },
      },
    );

    if (error) {
      addErrorAlert(error);
    } else {
      if (currentId >= stls.length) {
        setCurrentId(stls.length - 1);
      }
      setStls(stls.filter((stl) => stl.artifact_id !== stlId));
      setDeletingIds(deletingIds.filter((id) => id !== stlId));
    }
  };

  return stl !== null || edit ? (
    <div className="flex flex-col items-center justify-center my-4 p-4 relative">
      {stl !== null ? (
        <>
          <Button
            onClick={() => setCollapsed(!collapsed)}
            variant="outline"
            className="mt-2 mb-4 text-md p-4">
            STLs
            {collapsed ? (
              <FaCaretSquareUp className="ml-4 text-gray-700" />
            ) : (
              <FaCaretSquareDown className="ml-4 text-gray-700" />
            )}
          </Button>
          {!collapsed && stls.length > 1 && (
            <div className="inline-flex rounded-md shadow-sm mb-2">
              {stls.map((stl, idx) => (
                <button
                  type="button"
                  className={cx(
                    "py-1",
                    idx === currentId
                      ? "bg-gray-100 dark:bg-gray-600"
                      : "bg-white dark:bg-gray-800",
                    idx === 0 && "rounded-l-md border-l",
                    idx === stls.length - 1 && "rounded-r-md border-r",
                    "px-4 py-2 text-sm font-medium border-t border-b border-gray-200 hover:bg-gray-100",
                  )}
                  key={stl.artifact_id}
                  onClick={() => setCurrentId(idx)}>
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
          {!collapsed && (
            <div className="grid grid-cols-1 gap-2 mx-auto w-full aspect-square border-2 border-background rounded-lg p-2">
              <div
                key={stl.artifact_id}
                className="bg-background rounded-lg p-2 relative">
                <SingleStlViewer url={stl.url} />
                {edit && (
                  <Button
                    onClick={() => onDelete(stl.artifact_id)}
                    variant="destructive"
                    className="absolute top-5 right-5 rounded-full"
                    disabled={deletingIds.includes(stl.artifact_id)}>
                    <FaTimes />
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <p>
          <strong>STLs</strong>
        </p>
      )}
      {edit && (
        <ListingFileUpload
          artifactType="stl"
          fileExtensions={[".stl"]}
          maxSize={4 * 1024 * 1024}
          listingId={listingId}
          onUpload={(artifact) => {
            setStls([...stls, artifact.artifact]);
          }}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default ListingSTLs;
