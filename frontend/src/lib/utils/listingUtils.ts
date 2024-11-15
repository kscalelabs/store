import { paths } from "@/gen/api";

type ListingDetails =
  paths["/listings/batch"]["get"]["responses"][200]["content"]["application/json"]["listings"][number];

export const createListingDetailsMap = (listings: ListingDetails[]) => {
  const detailsMap: Record<string, ListingDetails> = {};

  listings.forEach((listing) => {
    const firstImageArtifact = listing.artifacts?.find(
      (artifact) => artifact.artifact_type === "image",
    );

    if (firstImageArtifact) {
      listing.artifacts = [
        firstImageArtifact,
        ...listing.artifacts.filter((a) => a !== firstImageArtifact),
      ];
    }

    detailsMap[listing.id] = listing;
  });

  return detailsMap;
};
