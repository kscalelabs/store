import { useEffect, useState } from "react";
import Masonry from "react-masonry-css";

import ListingChildren from "@/components/listing/ListingChildren";
import ListingDescription from "@/components/listing/ListingDescription";
import ListingOnshape from "@/components/listing/onshape/ListingOnshape";
import { components, paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

import ArtifactCard from "./artifacts/ArtifactCard";
import LoadingArtifactCard from "./artifacts/LoadingArtifactCard";

type ListingResponse =
  paths["/listings/{id}"]["get"]["responses"][200]["content"]["application/json"];

interface ListingBodyProps {
  listing: ListingResponse;
}

const ListingBody = (props: ListingBodyProps) => {
  const { listing } = props;
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const [artifacts, setArtifacts] = useState<
    components["schemas"]["ListArtifactsResponse"]["artifacts"] | null
  >(null);

  const addArtifactId = async (newArtifactId: string) => {
    const { data, error } = await auth.client.GET(
      "/artifacts/info/{artifact_id}",
      {
        params: { path: { artifact_id: newArtifactId } },
      },
    );

    if (error) {
      addErrorAlert(error);
    } else {
      setArtifacts((prev) => {
        if (prev === null) return prev;
        return [...prev, data];
      });
    }
  };

  const handleDeleteArtifact = (artifactId: string) => {
    setArtifacts((prevArtifacts) =>
      prevArtifacts
        ? prevArtifacts.filter(
            (artifact) => artifact.artifact_id !== artifactId,
          )
        : null,
    );
  };

  const breakpointColumnsObj = {
    default: 3,
    1024: 2,
    640: 1,
  };

  useEffect(() => {
    if (artifacts !== null) return;

    const fetchArtifacts = async () => {
      const { data, error } = await auth.client.GET(
        "/artifacts/list/{listing_id}",
        {
          params: { path: { listing_id: listing.id } },
        },
      );

      if (error) {
        addErrorAlert(error);
      } else {
        setArtifacts(data.artifacts);
      }
    };
    fetchArtifacts();
  }, [listing.id, artifacts, auth.client, addErrorAlert]);

  return (
    <div className="px-4">
      <ListingDescription
        listingId={listing.id}
        description={listing.description}
        edit={listing.can_edit}
      />
      <ListingChildren child_ids={listing.child_ids} edit={listing.can_edit} />
      <ListingOnshape
        listingId={listing.id}
        onshapeUrl={listing.onshape_url}
        addArtifactId={addArtifactId}
        edit={listing.can_edit}
      />
      <div className="mt-4">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className="flex w-auto -ml-4"
          columnClassName="pl-4 bg-clip-padding"
        >
          {artifacts === null ? (
            <LoadingArtifactCard />
          ) : (
            artifacts
              .slice()
              .reverse()
              .map((artifact) => (
                <div key={artifact.artifact_id} className="mb-4">
                  <ArtifactCard
                    artifact={artifact}
                    onDelete={() => handleDeleteArtifact(artifact.artifact_id)}
                    canEdit={listing.can_edit}
                  />
                </div>
              ))
          )}
        </Masonry>
      </div>
    </div>
  );
};

export default ListingBody;
