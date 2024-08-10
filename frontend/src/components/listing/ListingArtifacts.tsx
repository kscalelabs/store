import { useEffect, useState } from "react";

import { components } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import Spinner from "components/ui/Spinner";

import ListingImages from "./ListingImages";
import ListingSTLs from "./ListingSTLs";
import ListingURDFs from "./ListingURDFs";

interface Props {
  listingId: string;
  edit: boolean;
}

const ListingArtifacts = (props: Props) => {
  const { listingId, edit } = props;

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const [artifacts, setArtifacts] = useState<
    components["schemas"]["ListArtifactsResponse"]["artifacts"] | null
  >(null);

  useEffect(() => {
    if (artifacts !== null) {
      return;
    }

    const fetchArtifacts = async () => {
      const { data, error } = await auth.client.GET(
        "/artifacts/list/{listing_id}",
        {
          params: {
            path: { listing_id: listingId },
          },
        },
      );

      if (error) {
        addErrorAlert(error);
      } else {
        setArtifacts(data.artifacts);
      }
    };
    fetchArtifacts();
  }, [listingId, artifacts]);

  return artifacts === null ? (
    <div className="my-4 w-full flex justify-center">
      <Spinner />
    </div>
  ) : (
    <div className="flex flex-col">
      <ListingImages
        listingId={listingId}
        edit={edit}
        allArtifacts={artifacts}
      />
      <ListingURDFs
        listingId={listingId}
        edit={edit}
        allArtifacts={artifacts}
      />
      <ListingSTLs listingId={listingId} edit={edit} allArtifacts={artifacts} />
    </div>
  );
};

export default ListingArtifacts;
