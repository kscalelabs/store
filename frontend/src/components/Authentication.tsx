import React, { useState } from "react";

const Authentication = () => {
  const [email, setEmail] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState<boolean>(false);

  return (
    <div>
      {authenticated ? (
        <>
          <span>{email ?? ""}</span>
          <button
            style={{ marginLeft: 10 }}
            onClick={() => setAuthenticated(false)}
          >
            Log Out
          </button>
        </>
      ) : (
        <>
          <input
            type="text"
            value={email ?? ""}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            style={{ marginLeft: 10 }}
            onClick={() => setAuthenticated(true)}
          >
            Log In
          </button>
        </>
      )}
    </div>
  );
};

export default Authentication;
