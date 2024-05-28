import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { Route, Routes, BrowserRouter } from "react-router-dom";

import Listings from "components/Listings";
import RobotDetails from "pages/Robot";
import Authentication from "components/Authentication";
import { Container } from "react-bootstrap";

const App = () => {
  return (
    <BrowserRouter>
      <Container style={{ marginTop: 20 }}>
        <h1>robolist.xyz</h1>
        <p>Buy and sell robots</p>
        <Authentication />
        <Routes>
          <Route path="/" element={<Listings />} />
          <Route path="/robots/:id" element={<RobotDetails />} />
        </Routes>
      </Container>
    </BrowserRouter>
  );
};

export default App;
