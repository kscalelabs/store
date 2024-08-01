import { Card, CardContent, CardHeader, CardTitle } from "components/ui/Card";
import Header from "components/ui/Header";
import { Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-column pt-5 gap-4" style={{ display: "flex" }}>
      <Row className="mb-4">
        <h1 className="display-4">robolist</h1>
        <p className="lead">Buy and sell robots and robot parts</p>
      </Row>
      <Row className="row-two">
        <Card
          onClick={() => navigate(`/listings`)}
          className="w-[400px] shadow-md h-full mb-40"
        >
          <CardHeader>
            <Header title="Browse Listings" />
          </CardHeader>
          <CardContent>
            <CardTitle>Browse existing Robolist listings</CardTitle>
          </CardContent>
        </Card>
      </Row>
    </div>
  );
};

export default Home;
