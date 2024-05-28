import React from "react";

interface ListingLink {
  name: string;
  url: string;
}

interface ListingsResponseItem {
  name: string;
  owner: string;
  links: ListingLink[];
}

interface ListingsResponse {
  listings: ListingsResponseItem[];
}

const Listing = ({ name, owner, links }: ListingsResponseItem) => {
  return (
    <>
      <h3>{name}</h3>
      <p>{owner}</p>
      {links && (
        <ul>
          {links.map((link, key) => (
            <li>
              <a key={key} href={link.url}>
                {link.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
};

const Listings = () => {
  const response: ListingsResponse = {
    listings: [
      {
        name: "Stompy",
        owner: "K-Scale Labs",
        links: [
          {
            name: "URDF (with STLs)",
            url: "https://media.kscale.dev/stompy/latest_stl_urdf.tar.gz",
          },
          {
            name: "URDF (with OBJs)",
            url: "https://media.kscale.dev/stompy/latest_obj_urdf.tar.gz",
          },
          {
            name: "MJCF",
            url: "https://media.kscale.dev/stompy/latest_mjcf.tar.gz",
          },
        ],
      },
    ],
  };

  return (
    <div>
      <h2>Listings</h2>
      {response.listings.map((item, key) => (
        <Listing key={key} {...item} />
      ))}
    </div>
  );
};

export default Listings;
