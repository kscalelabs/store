import { Button } from "components/ui/Button/Button";
import Carousel from "components/ui/Carousel";
import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { useEffect, useState } from "react";
import EditListingModal from "./EditListingModal";

interface Props {
  listingId: string;
  // TODO: If can edit, allow the user to add and delete artifacts.
  edit: boolean;
}

const ListingArtifacts = (props: Props) => {
  const { listingId, edit } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [addingImages, setAddingImages] = useState(false);

  const [artifacts, setArtifacts] = useState<
    components["schemas"]["ListArtifactsResponse"] | null
  >(null);

  useEffect(() => {
    const fetchArtifacts = async () => {
      const { data, error } = await auth.client.GET("/artifacts/{listing_id}", {
        params: {
          path: { listing_id: listingId },
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        setArtifacts(data);
      }
    };
    fetchArtifacts();
  }, [listingId]);

  return artifacts === null ? (
    <></>
  ) : (
    <div className="my-4">
      {artifacts.artifacts.length > 0 ?? (
        <Carousel
          items={artifacts.artifacts.map((artifact) => {
            return {
              url: artifact.url,
              caption: artifact.name,
            };
          })}
        />
      )}
      {edit && (
        <>
          <Button
            className="btn btn-primary"
            onClick={() => setAddingImages(true)}
          >
            Add Images
          </Button>
          <EditListingModal
            open={addingImages}
            listingId={listingId}
            onClose={() => setAddingImages(false)}
          />
        </>
      )}
    </div>
  );
};

export default ListingArtifacts;
