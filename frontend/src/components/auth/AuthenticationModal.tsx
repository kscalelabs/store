import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { AuthBlockInner } from "./AuthBlock";

const LogInModal = () => {
  const navigate = useNavigate();

  const navigateToPreviousPage = () => {
    navigate(-1);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white w-[400px] shadow-md">
        <div className="flex justify-between items-center p-4 border-b mb-4">
          <h2 className="text-xl font-semibold">Log In</h2>
          <button onClick={navigateToPreviousPage}>
            <FaTimes />
          </button>
        </div>
        <AuthBlockInner />
      </div>
    </div>
  );
};

export default LogInModal;
