import AuthBlock from "@/components/auth/AuthBlock";

const Login = () => {
  return (
    <div className="mx-8">
      <div className="flex justify-center items-center">
        <AuthBlock title={<span className="text-gray-2">Welcome back!</span>} />
      </div>
    </div>
  );
};

export default Login;
