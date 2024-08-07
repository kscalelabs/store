import { useLoader } from "@react-three/fiber";
import ListingFileUpload from "components/listing/ListingFileUpload";
import { Button } from "components/ui/Button/Button";
import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { useState } from "react";
import { FaCaretSquareDown, FaCaretSquareUp, FaTimes } from "react-icons/fa";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader";
import { OBJLoader } from 'three/addons/loaders/OBJLoader';

const Model = ({ url }: { url: string }) => {
  const stl = useLoader(STLLoader, url);
  return <primitive object={stl} />;
};

interface SingleStlViewerProps {
  url: string;
}

const SingleStlViewer = (props: SingleStlViewerProps) => {
  const { url } = props;

  // return (
  //   <Canvas onError={(error) => console.log(error)}>
  //     <ambientLight />
  //     <pointLight position={[10, 10, 10]} />
  //     <Model url={url} />
  //   </Canvas>
  // );

  return <div>{url}</div>;
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
      setStls(stls.filter((stl) => stl.artifact_id !== stlId));
      setDeletingIds(deletingIds.filter((id) => id !== stlId));
    }
  };

  return stls.length > 0 || edit ? (
    <div className="flex flex-col items-center justify-center my-4 p-4 relative">
      {stls.length > 0 && (
        <>
          <Button
            onClick={() => setCollapsed(!collapsed)}
            variant="outline"
            className="mt-2 mb-4 text-md p-4"
          >
            STLs
            {collapsed ? (
              <FaCaretSquareUp className="ml-4 text-gray-700" />
            ) : (
              <FaCaretSquareDown className="ml-4 text-gray-700" />
            )}
          </Button>
          {!collapsed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2 mx-auto">
              {stls.map((stl) => (
                <div
                  key={stl.artifact_id}
                  className="bg-background rounded-lg p-2 relative"
                >
                  <SingleStlViewer url={stl.url} />
                  {edit && (
                    <Button
                      onClick={() => onDelete(stl.artifact_id)}
                      variant="destructive"
                      className="absolute top-5 right-5 rounded-full"
                      disabled={deletingIds.includes(stl.artifact_id)}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
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
