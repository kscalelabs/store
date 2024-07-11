import TCButton from "components/files/TCButton";
import { useAlertQueue } from "hooks/alerts";
import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { FormEvent, useState } from "react";
import { Col, Form, Offcanvas, Row } from "react-bootstrap";
import { Link } from "react-router-dom";

interface Props {
  show: boolean;
  onHide: () => void;
}

const Sidebar = ({ show, onHide }: Props) => {
  const { addAlert } = useAlertQueue();

  const auth = useAuthentication();
  const auth_api = new api(auth.api);

  const [newEmail, setNewEmail] = useState<string>("");
  const [changeEmailSuccess, setChangeEmailSuccess] = useState<boolean>(false);
  const [oldPassword, setOldPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [changePasswordSuccess, setChangePasswordSuccess] =
    useState<boolean>(false);

  const sendChangeEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await auth_api.send_change_email(newEmail);
      setChangeEmailSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        addAlert(error.message, "error");
      } else {
        addAlert("Unexpected error when trying to change email", "error");
      }
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await auth_api.change_password(oldPassword, newPassword);
      setChangePasswordSuccess(true);
    } catch (error) {
      if (error instanceof Error) {
        addAlert(error.message, "error");
      } else {
        addAlert("Unexpected error when trying to change password", "error");
      }
    }
  };

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
            {auth.email == "dummy@kscale.dev" ? (
              <p>
                No email address associated with this account. (This is because
                you registered via OAuth.)
              </p>
            ) : (
              <p>Current email: {auth.email}</p>
            )}
            {changeEmailSuccess ? (
              <p>An email has been sent to your new email address.</p>
            ) : (
              <Form onSubmit={sendChangeEmail}>
                <label htmlFor="new-email">New email</label>
                <Form.Control
                  id="new-email"
                  autoComplete="email"
                  className="mb-3"
                  type="text"
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                  }}
                  value={newEmail}
                  required
                />
                <TCButton type="submit">Change Email</TCButton>
              </Form>
            )}
          </Row>
          <Row>
            <p>
              <strong>Change Password</strong>
            </p>
            <p>
              You may only change your password if you have a previous password.
              If not, log out and reset your password.
            </p>
            {changePasswordSuccess ? (
              <p>Your password has been changed.</p>
            ) : (
              <Form onSubmit={changePassword}>
                <label htmlFor="old-password">Old password</label>
                <Form.Control
                  id="old-password"
                  autoComplete="current-password"
                  className="mb-3"
                  type="password"
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                  }}
                  value={oldPassword}
                  required
                />
                <label htmlFor="new-password">New password</label>
                <Form.Control
                  id="new-password"
                  autoComplete="new-password"
                  className="mb-3"
                  type="password"
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                  }}
                  value={newPassword}
                  required
                />
                <TCButton type="submit">Change Password</TCButton>
              </Form>
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
