import RequireAuthentication from "components/auth/RequireAuthentication";

const APIKeys = () => {
  return (
    <RequireAuthentication>
      <section>
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16">
          <h1 className="mb-8 text-4xl font-extrabold tracking-tight leading-none md:text-5xl lg:text-6xl">
            API Key
          </h1>
          <p className="mb-8 text-lg font-normal lg:text-xl sm:px-16 lg:px-48">
            This page is under construction. You will be able to generate API
            keys here.
          </p>
        </div>
      </section>
    </RequireAuthentication>
  );
};

export default APIKeys;
