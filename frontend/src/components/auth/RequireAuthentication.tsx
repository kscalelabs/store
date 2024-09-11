import React from "react";
import { useNavigate } from "react-router-dom";

import AuthBlock from "@/components/auth/AuthBlock";
import { useAuthentication } from "@/hooks/useAuth";

interface Props {
  children: React.ReactNode;
  onClosed?: () => void;
}

const RequireAuthentication = (props: Props) => {
  const { children, onClosed: onClosedDefault } = props;
  const { isAuthenticated } = useAuthentication();

  const navigate = useNavigate();

  const onClosed =
    onClosedDefault ||
    (() => {
      navigate(-1);
    });

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <>
      <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
        <div className="relative w-auto my-6 mx-auto max-w-3xl">
          <div className="border-0 rounded-lg shadow-lg relative flex flex-col w-full bg-white outline-none focus:outline-none">
            <AuthBlock onClosed={onClosed} />
          </div>
        </div>
      </div>
      <div className="opacity-25 fixed inset-0 z-40 bg-black"></div>
    </>
  );
};

export default RequireAuthentication;
