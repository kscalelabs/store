import { Button } from "components/ui/Button/Button";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

interface AuthProvider {
  handleGoogleSubmit?: () => void;
  handleGithubSubmit?: (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => Promise<void>;
}

const AuthProvider = ({
  handleGoogleSubmit,
  handleGithubSubmit,
}: AuthProvider) => {
  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-center items-center mb-4">
        <div className="border-t border-gray-300 flex-grow mr-3"></div>
        <span className="flex-shrink">OR</span>
        <div className="border-t border-gray-300 flex-grow ml-3"></div>
      </div>
      <div className="flex items-center w-full gap-x-2">
        {/* Google */}
        <Button
          variant={"outline"}
          size={"lg"}
          className="w-full hover:bg-gray-100 dark:hover:bg-gray-600"
          onClick={handleGoogleSubmit}
        >
          <FcGoogle className="w-5 h-5" />
        </Button>

        {/* Github */}
        <Button
          variant="outline"
          size="lg"
          className="w-full hover:bg-gray-100 dark:hover:bg-gray-600"
          onClick={handleGithubSubmit}
        >
          <FaGithub className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
};

export default AuthProvider;
