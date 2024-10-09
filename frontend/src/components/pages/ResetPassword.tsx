import React, { useState } from "react";
import { useParams } from "react-router-dom";

import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";

const ResetPassword = () => {
  const { token } = useParams<{ token: string }>();
  const [newPass, setNewPass] = useState<string>("");
  const [reNewPass, setReNewPass] = useState<string>("");

  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!token || newPass !== reNewPass) return;

    try {
      const { data: response, error } = await auth.client.POST(
        "/users/reset-password",
        {
          body: {
            token: token,
            new_password: newPass,
            re_enter_password: reNewPass,
          },
        },
      );

      if (error) {
        addErrorAlert(error);
      } else {
        console.log("response: ", response);
      }
    } catch {
      addErrorAlert("An unexpected error occurred during login.");
    }
  };

  return (
    <div className="border">
      <form onSubmit={onSubmit}>
        <p>New password</p>
        <input
          type="password"
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="border"
        />

        <p>Re-enter New password</p>
        <input
          type="password"
          value={reNewPass}
          onChange={(e) => setReNewPass(e.target.value)}
          className="border"
        />
        <div className="border">
          <button type="submit">Reset Password</button>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
