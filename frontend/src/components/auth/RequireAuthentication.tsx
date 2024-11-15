import React from "react";
import { useNavigate } from "react-router-dom";

import AuthBlock from "@/components/auth/AuthBlock";
import Container from "@/components/ui/container";
import { useAuthentication } from "@/hooks/useAuth";
import { FEATURE_FLAGS } from "@/lib/utils/featureFlags";

interface Props {
  children: React.ReactNode;
  onClosed?: () => void;
  allowDemo?: boolean;
}

const RequireAuthentication = (props: Props) => {
  const { children, onClosed: onClosedDefault, allowDemo = false } = props;
  const { isAuthenticated } = useAuthentication();

  const navigate = useNavigate();

  const onClosed =
    onClosedDefault ||
    (() => {
      navigate(-1);
    });

  const hasAccess =
    isAuthenticated || (allowDemo && FEATURE_FLAGS.DEMO_ROBOT_ENABLED);

  return hasAccess ? (
    <>{children}</>
  ) : (
    <Container className="flex justify-center items-center max-w-xl">
      <div className="flex flex-col justify-center items-center my-6">
        <h2 className="text-gray-1 text-xl font-bold mb-4">
          You must be logged in to view this page
        </h2>
        <div className="border-0 rounded-lg">
          <AuthBlock onClosed={onClosed} />
        </div>
      </div>
    </Container>
  );
};

export default RequireAuthentication;
