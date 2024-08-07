import { useState } from "react";
import { FaCaretSquareDown, FaCaretSquareUp, FaTimes } from "react-icons/fa";

import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import ListingFileUpload from "components/listing/ListingFileUpload";
import { Button } from "components/ui/Button/Button";

interface Props {
  listingId: string;
  edit: boolean;
  allArtifacts: components["schemas"]["ListArtifactsResponse"]["artifacts"];
}

const ListingImages = (props: Props) => {
  const { listingId, edit, allArtifacts } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [images, setImages] = useState<
    components["schemas"]["ListArtifactsResponse"]["artifacts"]
  >(allArtifacts.filter((a) => a.artifact_type === "image"));
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const onDelete = async (imageId: string) => {
    setDeletingIds([...deletingIds, imageId]);

    const { error } = await auth.client.DELETE(
      "/artifacts/delete/{artifact_id}",
      {
        params: {
          path: { artifact_id: imageId },
        },
      },
    );

    if (error) {
      addErrorAlert(error);
    } else {
      setImages(images.filter((image) => image.artifact_id !== imageId));
      setDeletingIds(deletingIds.filter((id) => id !== imageId));
    }
  };

  return images.length > 0 || edit ? (
    <div className="flex flex-col items-center justify-center my-4 p-4 relative">
      {images.length > 0 && (
        <>
          <Button
            onClick={() => setCollapsed(!collapsed)}
            variant="outline"
            className="mt-2 mb-4 text-md p-4"
          >
            Images
            {collapsed ? (
              <FaCaretSquareUp className="ml-4 text-gray-700" />
            ) : (
              <FaCaretSquareDown className="ml-4 text-gray-700" />
            )}
          </Button>
          {!collapsed && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2 mx-auto">
              {images.map((image) => (
                <div
                  key={image.artifact_id}
                  className="bg-background rounded-lg p-2 relative"
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="rounded-lg w-full aspect-square"
                  />
                  {edit && (
                    <Button
                      onClick={() => onDelete(image.artifact_id)}
                      variant="destructive"
                      className="absolute top-5 right-5 rounded-full"
                      disabled={deletingIds.includes(image.artifact_id)}
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
          artifactType="image"
          fileExtensions={[".jpg", ".jpeg", ".png"]}
          maxSize={4 * 1024 * 1024}
          listingId={listingId}
          onUpload={(artifact) => {
            setImages([...images, artifact.artifact]);
          }}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default ListingImages;
