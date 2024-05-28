import { Carousel } from "react-bootstrap";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";

interface ListingsResponseItem {
  name: string;
  owner: string;
  links: { name: string; url: string }[];
  images: { url: string; caption: string }[];
}

interface ListingsResponse {
  listings: ListingsResponseItem[];
}

const Listing = ({ name, owner, links, images }: ListingsResponseItem) => {
  return (
    <Col>
      <Row>
        <h3>{name}</h3>
        <p>{owner}</p>
      </Row>
      {links && (
        <Row>
          <ul>
            {links.map((link, key) => (
              <li key={key}>
                <a href={link.url}>{link.name}</a>
              </li>
            ))}
          </ul>
        </Row>
      )}
      {images && (
        <Carousel indicators data-bs-theme="dark">
          {images.map((image, key) => (
            <Carousel.Item key={key}>
              <img src={image.url} alt={image.caption} />
              <Carousel.Caption>
                <h3>{image.caption}</h3>
              </Carousel.Caption>
            </Carousel.Item>
          ))}
        </Carousel>
      )}
    </Col>
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
        images: [
          {
            url: "https://media.robolist.xyz/logo.png",
            caption: "Image 1",
          },
          {
            url: "https://media.robolist.xyz/logo.png",
            caption: "Image 2",
          },
          {
            url: "https://media.robolist.xyz/logo.png",
            caption: "Image 3",
          },
        ],
      },
    ],
  };

  return (
    <Container>
      <h2>Listings</h2>
      {response.listings.map((item, key) => (
        <Listing key={key} {...item} />
      ))}
    </Container>
  );
};

export default Listings;
