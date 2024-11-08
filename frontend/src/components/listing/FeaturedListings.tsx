import React, { createContext, useContext, useEffect, useState } from "react";

import { useAuthentication } from "@/hooks/useAuth";
import {
  getFeaturedListingsFromCookie,
  setFeaturedListingsCookie,
} from "@/lib/utils/FeaturedListingsCookies";

type FeaturedListing = {
  id: string;
  username: string;
  slug: string | null;
  name: string;
};

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
    getFeaturedListingsFromCookie(),
  );
  const auth = useAuthentication();

  const refreshFeaturedListings = async () => {
    try {
      const { data: featuredData } =
        await auth.client.GET("/listings/featured");

      if (!featuredData?.listing_ids?.length) {
        setFeaturedListings([]);
        setFeaturedListingsCookie([]);
        return;
      }

      const { data: batchData } = await auth.client.GET("/listings/batch", {
        params: {
          query: { ids: featuredData.listing_ids },
        },
      });

      if (batchData?.listings) {
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

        setFeaturedListings(orderedListings);
        setFeaturedListingsCookie(orderedListings);
      }
    } catch (error) {
      console.error("Error refreshing featured listings:", error);
    }
  };

  useEffect(() => {
    if (featuredListings.length === 0) {
      refreshFeaturedListings();
    } else {
      Promise.resolve()
        .then(refreshFeaturedListings)
        .catch((error) => {
          console.error("Background refresh failed:", error);
        });
    }
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
