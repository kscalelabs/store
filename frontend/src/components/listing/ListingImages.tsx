import { useState } from "react";
import { FaTimes } from "react-icons/fa";

import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import ListingFileUpload from "components/listing/ListingFileUpload";
import { Button } from "components/ui/Button/Button";

type AllArtifactsType =
  components["schemas"]["ListArtifactsResponse"]["artifacts"];

interface Props {
  listingId: string;
  edit: boolean;
  allArtifacts: AllArtifactsType;
}

const ListingImages = (props: Props) => {
  const { listingId, edit, allArtifacts } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [images, setImages] = useState<AllArtifactsType>(
    allArtifacts.filter((a) => a.artifact_type === "image"),
  );
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const [showImageModal, setShowImageModal] = useState<number | null>(null);

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
    <div className="flex flex-col items-center justify-center relative">
      {images.length > 0 ? (
        <>
          <div className="grid gap-2 md:gap-4 mx-auto w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mt-4">
            {images.map((image, idx) => (
              <div key={image.artifact_id} className="bg-background relative p">
                <div className="bg-white rounded-lg w-full">
                  <img
                    src={image.urls.small ?? image.urls.large}
                    alt={image.name}
                    className="aspect-square cursor-pointer rounded-lg w-full"
                    onClick={() => setShowImageModal(idx)}
                  />
                </div>
                {edit && (
                  <Button
                    onClick={() => onDelete(image.artifact_id)}
                    variant="destructive"
                    className="absolute top-2 right-2 rounded-full"
                    disabled={deletingIds.includes(image.artifact_id)}
                  >
                    <FaTimes />
                  </Button>
                )}
              </div>
            ))}
          </div>
          {showImageModal !== null && (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowImageModal(null)}
            >
              <div
                className="absolute bg-white rounded-lg p-4 max-w-4xl max-h-4xl m-4"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={images[showImageModal].urls.large}
                  alt={images[showImageModal].name}
                  className="max-h-full max-w-full"
                />
              </div>
            </div>
          )}
        </>
      ) : (
        <p>
          <strong>Images</strong>
        </p>
      )}
      {edit && (
        <ListingFileUpload
          description="Upload images"
          dropzoneOptions={{
            accept: {
              "image/*": [".jpg", ".jpeg", ".png", ".webp"],
            },
            maxSize: 4 * 1024 * 1024,
          }}
          listingId={listingId}
          onUpload={(artifact) => {
            setImages([
              ...images,
              ...artifact.artifacts.filter((a) => a.is_new === true),
            ]);
          }}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default ListingImages;
