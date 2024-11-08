export interface FeaturedListing {
  id: string;
  username: string;
  slug: string | null;
  name: string;
}

export const FEATURED_LISTINGS_KEY = "featured_listings";

export const getFeaturedListingsFromStorage = (): FeaturedListing[] => {
  try {
    const stored = localStorage.getItem(FEATURED_LISTINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error parsing featured listings from storage:", error);
    return [];
  }
};

export const setFeaturedListingsStorage = (listings: FeaturedListing[]) => {
  try {
    localStorage.setItem(FEATURED_LISTINGS_KEY, JSON.stringify(listings));
  } catch (error) {
    console.error("Error storing featured listings:", error);
  }
};
