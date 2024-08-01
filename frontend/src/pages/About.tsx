const About = () => {
  return (
    <section>
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16">
        <h1 className="mb-8 text-4xl font-extrabold tracking-tight leading-none md:text-5xl lg:text-6xl">
          About
        </h1>
        <p className="mb-4 text-lg font-normal lg:text-xl sm:px-16 lg:px-48">
          This is a simple store to help make it easy to buy, sell and build
          robots.
        </p>
        <p className="text-lg font-normal lg:text-xl sm:px-16 lg:px-48">
          It is maintained by{" "}
          <a
            href="https://kscale.dev"
            className="text-blue-700 underline hover:text-blue-900"
          >
            K-Scale Labs
          </a>{" "}
          with open-source code freely available on{" "}
          <a
            href="https://github.com/kscalelabs/store"
            className="text-blue-700 underline"
          >
            Github
          </a>
          .
        </p>
      </div>
    </section>
  );
};

export default About;
