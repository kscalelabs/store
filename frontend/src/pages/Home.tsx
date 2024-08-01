import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <section>
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16">
        <h1 className="mb-8 text-4xl font-extrabold tracking-tight leading-none md:text-5xl lg:text-6xl">
          Robolist
        </h1>
        <p className="mb-8 text-lg font-normal lg:text-xl sm:px-16 lg:px-48">
          Buy and sell robots and robot parts, share hardware and software, and
          connect with other robot enthusiasts, all in one place.
        </p>
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0">
          <button
            onClick={() => navigate(`/listings`)}
            className="inline-flex justify-center items-center py-3 px-5 text-base font-medium text-center text-white rounded-lg bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
          >
            Browse
            <FaArrowRight className="ml-2" />
          </button>
          <button
            onClick={() => navigate(`/listings/add`)}
            className="inline-flex justify-center items-center py-3 px-5 ml-5 text-base font-medium text-center text-blue-700 bg-white rounded-lg hover:bg-gray-50 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
          >
            Create
          </button>
        </div>
      </div>
    </section>
  );
};

export default Home;
