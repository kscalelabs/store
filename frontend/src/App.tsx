import React from "react";
import "./App.css";

import Listings from "components/Listings";
import Authentication from "components/Authentication";

const App = () => {
  return (
    <div className="container">
      <div className="content">
        <h1>robolist.xyz</h1>
        <p>Buy and sell robots</p>
        <Authentication />
        <Listings />
      </div>
    </div>
  );
};

export default App;
