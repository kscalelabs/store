import React, { useState } from 'react'
import { Col, Row, Button } from "react-bootstrap";

// const [darkMode, setDarkMode] = useState(false);

// const toggleDarkMode = () => {
//   setDarkMode(prevMode => !prevMode);
// };

// Conditional theme class
//const themeClass = darkMode ? 'dark' : 'light';
//bool darkMode = false;
// I want to output something in my logger whenever the button is clicked
const RobotDetails = () => {
  return (
    <div className="p-5 rounded-lg">
      <Row>
        <Col>
          <h1 className="display-4">robolist</h1>
          <p className="lead">
            Buy, sell and build robot hardware and software
          </p>
        </Col>
      </Row>
      {/* <Row>
      <Button onClick={toggleDarkMode}>
      {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </Button>
      </Row> */}
      <Row>
        <Button onClick={() => console.log('lala')}>
          {'lala button'}
        </Button>
      </Row>
    </div>
  );
};

export default RobotDetails;
