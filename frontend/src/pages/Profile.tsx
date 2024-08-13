import { useEffect, useState } from "react";

import { paths } from "gen/api";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";

import RequireAuthentication from "components/auth/RequireAuthentication";

type UserResponse =
  paths["/users/me"]["get"]["responses"][200]["content"]["application/json"];

const Profile = () => {
  const [user, setUser] = useState<UserResponse | undefined>(undefined);
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  useEffect(() => {
    (async () => {
      const { data, error } = await auth.client.GET("/users/me");
      if (error) {
        addErrorAlert(error);
      } else {
        setUser(data);
      }
    })();
  }, []);
  return (
    <RequireAuthentication>
      <section>
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 text-lg lg:text-xl">
          <h1 className="mb-8 text-4xl font-extrabold tracking-tight leading-none md:text-5xl lg:text-6xl">
            Profile
          </h1>
          {user ? (
            <>
              <p>User ID: {user.user_id}</p>
              <p>
                Current email:{" "}
                <a className="link" href={user.email}>
                  {user.email}
                </a>
              </p>
              {user.github_id ? (
                <p>
                  This account is linked to the GitHub user{" "}
                  <a className="link" href={user.github_id.substring(7)}>
                    {user.github_id.substring(7)}
                  </a>
                  .
                </p>
              ) : (
                <p>This account is not linked to GitHub OAuth.</p>
              )}
              {user.google_id ? (
                <p>
                  This account is linked to the Google account{" "}
                  <a className="link" href={user.google_id.substring(7)}>
                    {user.google_id.substring(7)}
                  </a>
                  .
                </p>
              ) : (
                <p>This account is not linked to Google OAuth.</p>
              )}
            </>
          ) : (
            <p>Loading user information...</p>
          )}
        </div>
      </section>
    </RequireAuthentication>
  );
};

export default Profile;
