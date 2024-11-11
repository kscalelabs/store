import { useNavigate } from "react-router-dom";

import AuthBlock from "@/components/auth/AuthBlock";

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="mx-8">
      <div className="flex justify-center items-center">
        <AuthBlock title="Welcome back!" onClosed={() => navigate(-1)} />
      </div>
    </div>
  );
};

export default Login;
