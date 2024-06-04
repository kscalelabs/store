import { Container, Row } from "react-bootstrap";

const About = () => {
  return (
    <Container className="pt-5" style={{ textAlign: "center" }} fluid>
      <Row className="mb-5">
        <h1 className="display-4">about</h1>
        <p className="lead">
          This is a simple platform for aggregating robots, robot parts and
          build guides.
        </p>
        <p>
          It is maintained by <a href="https://kscale.dev/">K-Scale Labs</a>{" "}
          with source code freely available on{" "}
          <a href="https://github.com/kscalelabs/store">Github</a>.
        </p>
      </Row>
    </Container>
  );
};

export default About;
