export interface FeaturedListing {
  id: string;
  name: string;
  slug: string;
  description: string;
  stripe_link?: string;
  price?: number;
}

export const FEATURED_LISTINGS_COOKIES = "featured_listings";

export const getFeaturedListingsFromCookie = (): FeaturedListing[] => {
  try {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${FEATURED_LISTINGS_COOKIES}=`));
    if (cookie) {
      return JSON.parse(decodeURIComponent(cookie.split("=")[1]));
    }
  } catch (error) {
    console.error("Error parsing featured listings cookie:", error);
  }
  return [];
};

export const setFeaturedListingsCookie = (listings: FeaturedListing[]) => {
  const value = encodeURIComponent(JSON.stringify(listings));
  document.cookie = `${FEATURED_LISTINGS_COOKIES}=${value}; path=/; max-age=86400`;
};
