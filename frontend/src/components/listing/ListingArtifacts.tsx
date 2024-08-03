import Carousel from "components/ui/Carousel";
import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { useEffect, useState } from "react";

interface Props {
  listing_id: string;
  // TODO: If can edit, allow the user to add and delete artifacts.
  edit: boolean;
}

const ListingArtifacts = (props: Props) => {
  const { listing_id } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [artifacts, setArtifacts] = useState<
    components["schemas"]["ListArtifactsResponse"] | null
  >(null);

  useEffect(() => {
    const fetchArtifacts = async () => {
      const { data, error } = await auth.client.GET("/artifacts/{listing_id}", {
        params: {
          path: { listing_id },
        },
      });

      if (error) {
        addErrorAlert(error);
      } else {
        setArtifacts(data);
      }
    };
    fetchArtifacts();
  }, [listing_id]);

  if (artifacts != null && artifacts.artifacts.length > 0) {
    return (
      <Carousel
        items={artifacts.artifacts.map((artifact) => {
          return {
            url: artifact.url,
            caption: artifact.name,
          };
        })}
      />
    );
  } else {
    return <></>;
  }
};

export default ListingArtifacts;
