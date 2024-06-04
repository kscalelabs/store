import rob from "hooks/rob";
import { useEffect, useState } from "react";
import { Breadcrumb, Card, Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

interface Bom {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

interface Image {
  caption: string;
  url: string;
}

interface Robot {
  robot_id: string;
  name: string;
  description: string;
  owner: string;
  bom: Bom[];
  images: Image[];
}

// interface RobotsResponse {
//   robots: Robot[];
// }

const Robots = () => {
  const [robotsData, setRobot] = useState<Robot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetch_robots = async () => {
      try {
        const robotsQuery = await rob.getRobots();
        setRobot(robotsQuery);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unexpected error occurred");
        }
      }
    };
    fetch_robots();
  }, []);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      navigate("/404"); // Redirect to a 404 page
    }
  }, [error, navigate]);

  if (!robotsData) {
    return <p>Loading</p>;
  }

  // const response: RobotsResponse = {
  //   // robots: [
  //   //   {
  //   //     name: "Stoopy",
  //   //     owner: "K-Scale Labs",
  //   //     description: "An open-source humanoid robot costing less than $10k",
  //   //     id: "1",
  //   //     photo: "https://media.robolist.xyz/stompy.png",
  //   //   },
  //   // ]
  //   robotReturn: []
  //   for (let i = 0; i < robots.length; i++) {
  //     robotReturn.push({
  //       name: robotsData[i].name,
  //       owner: robots[i].owner,
  //       description: robots[i].description,
  //       id: robots[i].id,
  //       photo: robots[i].photo,
  //     });
  //   }

  // };

  return (
    <>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate("/")}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Robots</Breadcrumb.Item>
      </Breadcrumb>

      <Row className="mt-5">
        {robotsData.map((robot) => (
          <Col key={robot.robot_id} md={3} sm={6} xs={12}>
            <Card onClick={() => navigate(`/robot/${robot.robot_id}`)}>
              {robot.images[0] && (
                <Card.Img
                  style={{ aspectRatio: "1/1" }}
                  variant="top"
                  src={robot.images[0].url}
                />
              )}
              <Card.Body>
                <Card.Title>{robot.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {robot.owner}
                </Card.Subtitle>
                {/* // <Card.Text>{robot.description}</Card.Text> */}
                This is a description
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default Robots;
