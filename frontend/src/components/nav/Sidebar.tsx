import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { Col, Offcanvas, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

interface Props {
  show: boolean;
  onHide: () => void;
}

const Sidebar = ({ show, onHide }: Props) => {
  const [needToCall, setNeedToCall] = useState<boolean>(true);
  const [email, setEmail] = useState<string>("");
  const [verified, setVerified] = useState<boolean>(false);
  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  const sendVerifyEmail = async () => {
    try {
      await auth_api.send_verify_email();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    (async () => {
      if (needToCall) {
        setNeedToCall(false);
        try {
          const res = await auth_api.me();
          setVerified(res.verified);
          setEmail(res.email);
        } catch (error) {
          console.error(error);
        }
      }
    })();
  }, []);
  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>Settings</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <Col
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
          }}
        >
          <Row>
            <p>
              <strong>Change Email</strong>
            </p>
            <p>Current email: {email}</p>
            {!verified && (
              <p>
                <a href="#" onClick={sendVerifyEmail}>
                  Resend verification email
                </a>
              </p>
            )}
          </Row>
          <Row style={{ marginTop: "auto" }} />
          <Row>
            <Link to="/about">About</Link>
          </Row>
          <Row>
            <a href="#">Privacy Policy</a>
          </Row>
          <Row>
            <a href="#">Terms of Service</a>
          </Row>
        </Col>
      </Offcanvas.Body>
    </Offcanvas>
  );
};

export default Sidebar;
