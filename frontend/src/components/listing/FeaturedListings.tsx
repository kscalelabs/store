import React, { createContext, useContext, useEffect, useState } from "react";

import { useAuthentication } from "@/hooks/useAuth";
import {
  FeaturedListing,
  getFeaturedListingsFromStorage,
  setFeaturedListingsStorage,
} from "@/lib/utils/featuredListingsStorage";

type FeaturedListingsContextType = {
  featuredListings: FeaturedListing[];
  refreshFeaturedListings: () => Promise<void>;
};

const FeaturedListingsContext =
  createContext<FeaturedListingsContextType | null>(null);

export const FeaturedListingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [featuredListings, setFeaturedListings] = useState<FeaturedListing[]>(
    getFeaturedListingsFromStorage(),
  );
  const auth = useAuthentication();

  const refreshFeaturedListings = async () => {
    try {
      const { data: featuredData } =
        await auth.client.GET("/listings/featured");

      if (!featuredData?.listing_ids?.length) {
        setFeaturedListings([]);
        setFeaturedListingsStorage([]);
        return;
      }

      const { data: batchData } = await auth.client.GET("/listings/batch", {
        params: {
          query: { ids: featuredData.listing_ids },
        },
      });

      if (!batchData?.listings?.length) {
        setFeaturedListings([]);
        setFeaturedListingsStorage([]);
        return;
      }

      const orderedListings = featuredData.listing_ids
        .map((id) => batchData.listings.find((listing) => listing.id === id))
        .filter(
          (listing): listing is NonNullable<typeof listing> =>
            listing !== undefined,
        )
        .map((listing) => ({
          id: listing.id,
          username: listing.username ?? "",
          slug: listing.slug,
          name: listing.name,
        }));

      if (orderedListings.length > 0) {
        setFeaturedListings(orderedListings);
        setFeaturedListingsStorage(orderedListings);
      } else {
        setFeaturedListings([]);
        setFeaturedListingsStorage([]);
      }
    } catch (error) {
      console.error("Error refreshing featured listings:", error);
    }
  };

  useEffect(() => {
    Promise.resolve()
      .then(refreshFeaturedListings)
      .catch((error) => {
        console.error("Background refresh failed:", error);
      });
  }, []);

  return (
    <FeaturedListingsContext.Provider
      value={{ featuredListings, refreshFeaturedListings }}
    >
      {children}
    </FeaturedListingsContext.Provider>
  );
};

export const useFeaturedListings = () => {
  const context = useContext(FeaturedListingsContext);
  if (!context) {
    throw new Error(
      "useFeaturedListings must be used within a FeaturedListingsProvider",
    );
  }
  return context;
};
