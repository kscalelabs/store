import React from "react";

import { useAuthentication } from "hooks/useAuth";

import AuthBlock from "./AuthBlock";

interface Props {
  children: React.ReactNode;
}

const RequireAuthentication = (props: Props) => {
  const { children } = props;
  const { isAuthenticated } = useAuthentication();

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <div className="flex justify-center items-center">
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <AuthBlock />
      </div>
    </div>
  );
};

export default RequireAuthentication;
