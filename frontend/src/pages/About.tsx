const About = () => {
  return (
    <section>
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16">
        <h1 className="mb-8 text-4xl font-extrabold tracking-tight leading-none md:text-5xl lg:text-6xl">
          About
        </h1>
        <p className="mb-8 text-lg font-normal lg:text-xl sm:px-16 lg:px-48">
          This is a simple store to help make it easy to buy, sell and build
          robots. It is maintained by{" "}
          <button
            onClick={() => window.open("https://kscale.io")}
            className="text-blue-700 underline"
          >
            K-Scale Labs
          </button>{" "}
          with open-source code freely available on{" "}
          <button
            onClick={() => window.open("https://github.com/kscalelabs/store")}
            className="text-blue-700 underline"
          >
            Github
          </button>
          .
        </p>
      </div>
    </section>
  );
};

export default About;
