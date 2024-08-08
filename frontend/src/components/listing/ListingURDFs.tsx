import { useState } from "react";
import { FaCaretSquareDown, FaCaretSquareUp, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";

import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import ListingFileUpload from "components/listing/ListingFileUpload";
import { Button } from "components/ui/Button/Button";

interface SingleURDFViewerProps {
  url: string;
  name: string;
}

const SingleURDFViewer = (props: SingleURDFViewerProps) => {
  const { url, name } = props;

  return (
    <Link to={url} className="link">
      {name}
    </Link>
  );
};

interface Props {
  listingId: string;
  edit: boolean;
  allArtifacts: components["schemas"]["ListArtifactsResponse"]["artifacts"];
}

const ListingURDFs = (props: Props) => {
  const { listingId, edit, allArtifacts } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [URDFs, setURDFs] = useState<
    components["schemas"]["ListArtifactsResponse"]["artifacts"]
  >(allArtifacts.filter((a) => a.artifact_type === "urdf"));
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<boolean>(true);

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
      setURDFs(URDFs.filter((urdf) => urdf.artifact_id !== urdfId));
      setDeletingIds(deletingIds.filter((id) => id !== urdfId));
    }
  };

  return URDFs.length > 0 || edit ? (
    <div className="flex flex-col items-center justify-center my-4 p-4 relative">
      {URDFs.length > 0 ? (
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
          {!collapsed && (
            <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 justify-between w-full">
              {URDFs.map((urdf) => (
                <div key={urdf.artifact_id} className="bg-background p-2">
                  <SingleURDFViewer url={urdf.url} name={urdf.name} />
                  {edit && (
                    <Button
                      onClick={() => onDelete(urdf.artifact_id)}
                      variant="destructive"
                      className="ml-2"
                      disabled={deletingIds.includes(urdf.artifact_id)}
                    >
                      <FaTimes />
                    </Button>
                  )}
                </div>
              ))}
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
          fileExtensions={[".tar.gz"]}
          maxSize={100 * 1024 * 1024}
          listingId={listingId}
          onUpload={(artifact) => {
            setURDFs([...URDFs, artifact.artifact]);
          }}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default ListingURDFs;
