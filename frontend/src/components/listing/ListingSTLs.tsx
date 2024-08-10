import { startTransition, useEffect, useState } from "react";
import { FaCaretSquareDown, FaCaretSquareUp, FaTimes } from "react-icons/fa";

import { cx } from "class-variance-authority";
import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import ListingFileUpload from "components/listing/ListingFileUpload";
import StlRenderer from "components/listing/renderers/StlRenderer";
import { Button } from "components/ui/Button/Button";

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
  const [stl, setStl] = useState<
    components["schemas"]["ListArtifactsResponse"]["artifacts"][0] | null
  >(null);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [currentId, setCurrentId] = useState<number>(0);

  useEffect(() => {
    if (stl !== null) {
      return;
    }

    if (currentId >= stls.length || currentId < 0) {
      setCurrentId(Math.min(Math.max(currentId, 0), stls.length - 1));
    } else {
      setStl(stls[currentId]);
    }
  }, [stl, stls, currentId]);

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
      setStl(null);
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
                  onClick={() => {
                    setCurrentId(idx);
                    setStl(null);
                  }}>
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
                <StlRenderer
                  url={stl.url}
                  edit={edit}
                  onDelete={() => onDelete(stl.artifact_id)}
                  disabled={deletingIds.includes(stl.artifact_id)}
                />
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
