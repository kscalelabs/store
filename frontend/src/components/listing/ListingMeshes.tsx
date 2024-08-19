import { useEffect, useState } from "react";
import { FaCaretSquareDown, FaCaretSquareUp } from "react-icons/fa";

import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import RequireAuthentication from "components/auth/RequireAuthentication";
import ListingFileUpload from "components/listing/ListingFileUpload";
import MeshRenderer from "components/listing/MeshRenderer";
import { Button } from "components/ui/Button/Button";
import { Tooltip } from "components/ui/ToolTip";

type MeshType = "obj";
type AllArtifactsType =
  components["schemas"]["ListArtifactsResponse"]["artifacts"];
type ArtifactType = AllArtifactsType[0];
type MeshAndArtifactType = [MeshType, ArtifactType];

interface Props {
  listingId: string;
  edit: boolean;
  allArtifacts: AllArtifactsType;
}

const getMeshType = (artifactType: ArtifactType["artifact_type"]): MeshType => {
  switch (artifactType) {
    case "obj":
      return artifactType;
    default:
      throw new Error(`Unknown artifact type: ${artifactType}`);
  }
};

const ListingMeshes = (props: Props) => {
  const { listingId, edit, allArtifacts } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [meshes, setMeshes] = useState<AllArtifactsType>(
    allArtifacts.filter((a) => ["obj"].includes(a.artifact_type)),
  );
  const [mesh, setMesh] = useState<MeshAndArtifactType | null>(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [currentId, setCurrentId] = useState<number>(0);
  const [changeMeshDisabled, setChangeMeshDisabled] = useState<boolean>(false);

  useEffect(() => {
    if (mesh !== null || meshes === null) {
      return;
    }

    if (currentId >= meshes.length || currentId < 0) {
      setCurrentId(Math.min(Math.max(currentId, 0), meshes.length - 1));
    } else {
      const currentMesh = meshes[currentId];
      setMesh([getMeshType(currentMesh.artifact_type), currentMesh]);
    }
  }, [mesh, meshes, currentId]);

  if (meshes === null) return null;

  const onDelete = async (meshId: string) => {
    setDeletingIds([...deletingIds, meshId]);

    const { error } = await auth.client.DELETE(
      "/artifacts/delete/{artifact_id}",
      {
        params: {
          path: { artifact_id: meshId },
        },
      },
    );

    if (error) {
      addErrorAlert(error);
    } else {
      setMeshes(meshes.filter((mesh) => mesh.artifact_id !== meshId));
      setMesh(null);
      setDeletingIds(deletingIds.filter((id) => id !== meshId));
    }
  };

  return mesh !== null || edit ? (
    <div className="flex flex-col items-center justify-center relative">
      {mesh !== null ? (
        <>
          <Button
            onClick={() => setCollapsed(!collapsed)}
            variant="primary"
            className="text-md p-4 w-full"
          >
            {collapsed ? (
              <FaCaretSquareUp className="mr-2" />
            ) : (
              <FaCaretSquareDown className="mr-2" />
            )}
            Meshes
          </Button>
          {!collapsed && (
            <RequireAuthentication onClosed={() => setCollapsed(true)}>
              <div className="grid gap-2 md:gap-4 mx-auto w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 mt-4 max-h-96 overflow-y-auto">
                {meshes.map((mesh, idx) => (
                  <Tooltip key={idx} content={mesh.name}>
                    <Button
                      onClick={() => {
                        if (idx === currentId) return;

                        setChangeMeshDisabled(true);
                        setCurrentId(idx);
                        setMesh(null);

                        setTimeout(() => {
                          setChangeMeshDisabled(false);
                        }, 300);
                      }}
                      variant={idx === currentId ? "primary" : "secondary"}
                      className="rounded-full w-full"
                      disabled={changeMeshDisabled}
                    >
                      <div className="overflow-hidden">
                        <code>{mesh.name}</code>
                      </div>
                    </Button>
                  </Tooltip>
                ))}
              </div>
              <MeshRenderer
                url={mesh[1].urls.large}
                name={mesh[1].name}
                kind={mesh[0]}
                edit={edit}
                onDelete={() => onDelete(mesh[1].artifact_id)}
                disabled={deletingIds.includes(mesh[1].artifact_id)}
              />
            </RequireAuthentication>
          )}
        </>
      ) : (
        <p>
          <strong>Meshes</strong>
        </p>
      )}
      {edit && (
        <ListingFileUpload
          description="Upload meshes"
          dropzoneOptions={{
            accept: {
              "application/sla": [".stl"],
              "application/octet-stream": [".obj"],
              "model/vnd.collada+xml": [".dae"],
            },
            maxSize: 4 * 1024 * 1024,
          }}
          listingId={listingId}
          onUpload={(artifact) => {
            setMeshes([
              ...meshes,
              ...artifact.artifacts.filter((a) => a.is_new === true),
            ]);
          }}
        />
      )}
    </div>
  ) : null;
};

export default ListingMeshes;
