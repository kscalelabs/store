import React from "react";
import { useNavigate } from "react-router-dom";

import AuthBlock from "@/components/auth/AuthBlock";
import Container from "@/components/ui/container";
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
    <Container className="flex justify-center items-center max-w-xl">
      <div className="flex flex-col justify-center items-center my-6">
        <h2 className="text-gray-1 text-xl font-bold mb-4">
          You must be logged in to view this page
        </h2>
        <AuthBlock onClosed={onClosed} />
      </div>
    </Container>
  );
};

export default RequireAuthentication;
