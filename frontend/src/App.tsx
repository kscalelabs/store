import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import "./App.css";

import Authentication from "components/Authentication";
import Listings from "components/Listings";
import Home from "pages/Home";
import RobotDetails from "pages/Robot";
import { Container } from "react-bootstrap";

const App = () => {
  return (
    <BrowserRouter>
      <Container style={{ marginTop: 20 }}>
        <h1>
          <Link to="/">robolist.xyz</Link>
        </h1>
        <p>Buy and sell robots</p>
        <Authentication />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/robots/" element={<Listings />} />
          <Route path="/robots/:id" element={<RobotDetails />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
};

export default App;
