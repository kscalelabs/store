import { api } from "hooks/api";
import { useAuthentication } from "hooks/auth";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const VerifyEmail = () => {
  const auth = useAuthentication();
  const auth_api = new api(auth.api);
  const { token } = useParams();
  const [needToSend, setNeedToSend] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  useEffect(() => {
    (async () => {
      if (needToSend) {
      setNeedToSend(false);
      if (token !== undefined) {
        try {
          await auth_api.verify_email(token);
          setMessage("Successfully verified email.");
        } catch (error) {
          setMessage("Verification token invalid.");
        }
      } else {
        setMessage("No token provided");
      }
    }
    })();
  }, [auth_api]);
  return (
    <>
      <h1>Email Verification</h1>
      <p>{message}</p>
    </>
  );
};
export default VerifyEmail;
