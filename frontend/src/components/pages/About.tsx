import PageHeader from "../ui/PageHeader";

const About = () => {
  return (
    <section className="my-12">
      <PageHeader
        title="About Us"
        subheading="Simplifying the world of robotics for everyone"
      />

      <div className="text-center bg-gray-12 text-gray-1 rounded-lg p-8">
        <div className="max-w-3xl mx-auto">
          <p className=" mb-6 text-lg">
            We&apos;re on a mission to make it easy for anyone to buy, sell, and
            build robots. Our platform connects enthusiasts, professionals, and
            businesses in the exciting world of robotics.
          </p>

          <p className="mb-8 text-lg">
            Whether you&apos;re looking for cutting-edge components or
            ready-to-use robots, we&apos;ve got you covered with our extensive
            marketplace and supportive community.
          </p>

          <div className="text-lg">
            <p className="mb-2">
              Maintained with ❤️ by{" "}
              <a
                href="https://kscale.dev"
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                K-Scale Labs
              </a>
            </p>
            <p>
              Open-source code available on{" "}
              <a
                href="https://github.com/kscalelabs/store"
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
