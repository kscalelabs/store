import React from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

import Listings from "components/Listings";
import Authentication from "components/Authentication";
import { Container } from "react-bootstrap";

const App = () => {
    return (
        <Container style={{ marginTop: 20 }}>
            <h1>robolist.xyz</h1>
            <p>Buy and sell robots</p>
            <Authentication />
            <Listings />
        </Container>
    );
};

export default App;
