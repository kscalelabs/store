import { useState } from "react";
import { FaCaretSquareDown, FaCaretSquareUp } from "react-icons/fa";

import { cx } from "class-variance-authority";
import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import ListingFileUpload from "components/listing/ListingFileUpload";
import UrdfRenderer from "components/listing/renderers/UrdfRenderer";
import { Button } from "components/ui/Button/Button";

interface Props {
  listingId: string;
  edit: boolean;
  allArtifacts: components["schemas"]["ListArtifactsResponse"]["artifacts"];
}

const ListingURDFs = (props: Props) => {
  const { listingId, edit, allArtifacts } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [urdfs, setUrdfs] = useState<
    components["schemas"]["ListArtifactsResponse"]["artifacts"]
  >(allArtifacts.filter((a) => a.artifact_type === "urdf"));
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const [currentIdUnchecked, setCurrentId] = useState<number>(0);
  const currentId = Math.min(Math.max(currentIdUnchecked, 0), urdfs.length - 1);
  const urdf = urdfs.length === 0 ? null : urdfs[currentId];

  const onDelete = async (urdfId: string) => {
    setDeletingIds([...deletingIds, urdfId]);

    const { error } = await auth.client.DELETE(
      "/artifacts/delete/{artifact_id}",
      {
        params: {
          path: { artifact_id: urdfId },
        },
      },
    );

    if (error) {
      addErrorAlert(error);
    } else {
      if (currentId >= urdfs.length) {
        setCurrentId(urdfs.length - 1);
      }
      setUrdfs(urdfs.filter((urdf) => urdf.artifact_id !== urdfId));
      setDeletingIds(deletingIds.filter((id) => id !== urdfId));
    }
  };

  return urdf !== null || edit ? (
    <div className="flex flex-col items-center justify-center my-4 p-4 relative">
      {urdf !== null ? (
        <>
          <Button
            onClick={() => setCollapsed(!collapsed)}
            variant="outline"
            className="mt-2 mb-4 text-md p-4"
          >
            URDFs
            {collapsed ? (
              <FaCaretSquareUp className="ml-4 text-gray-700" />
            ) : (
              <FaCaretSquareDown className="ml-4 text-gray-700" />
            )}
          </Button>
          {!collapsed && urdfs.length > 1 && (
            <div className="inline-flex rounded-md shadow-sm mb-2">
              {urdfs.map((urdf, idx) => (
                <button
                  type="button"
                  className={cx(
                    "py-1",
                    idx === currentId
                      ? "bg-gray-100 dark:bg-gray-600"
                      : "bg-white dark:bg-gray-800",
                    idx === 0 && "rounded-l-md border-l",
                    idx === urdfs.length - 1 && "rounded-r-md border-r",
                    "px-4 py-2 text-sm font-medium border-t border-b border-gray-200 hover:bg-gray-100",
                  )}
                  key={urdf.artifact_id}
                  onClick={() => setCurrentId(idx)}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          )}
          {!collapsed && (
            <div className="grid grid-cols-1 gap-2 mx-auto w-full aspect-square border-2 border-background rounded-lg p-2">
              <div
                key={urdf.artifact_id}
                className="bg-background rounded-lg p-2 relative"
              >
                <UrdfRenderer
                  url={urdf.url}
                  edit={edit}
                  onDelete={() => onDelete(urdf.artifact_id)}
                  disabled={deletingIds.includes(urdf.artifact_id)}
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <p>
          <strong>URDFs</strong>
        </p>
      )}
      {edit && (
        <ListingFileUpload
          artifactType="urdf"
          fileExtensions={[".urdf"]}
          maxSize={4 * 1024 * 1024}
          listingId={listingId}
          onUpload={(artifact) => {
            setUrdfs([...urdfs, artifact.artifact]);
          }}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default ListingURDFs;
