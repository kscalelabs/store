import { Button } from "components/ui/Button/Button";
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
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-y-0 space-x-2">
          <Button
            onClick={() => navigate(`/browse`)}
            variant="primary"
            size="lg"
          >
            Browse
            <FaArrowRight className="ml-2" />
          </Button>
          <Button
            onClick={() => navigate(`/create`)}
            variant="secondary"
            size="lg"
          >
            Create
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Home;
