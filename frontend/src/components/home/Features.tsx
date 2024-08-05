import { FaGear, FaMessage, FaRobot } from "react-icons/fa6";

const Features = () => {
  const features = [
    {
      name: "Buy and sell robots",
      description: "Buy and sell completed robots, parts, and designs.",
      icon: <FaRobot />,
    },
    {
      name: "Find parts",
      description:
        "Actuators, motors, and more! Buy, sell, and read about any part. Get recommendations and suggestions to help you with your project.",
      icon: <FaGear />,
    },
    {
      name: "Join the converstation",
      description:
        "Join the K-Scale discord for Q&A and to see what other people are building.",
      icon: <FaMessage />,
    },
    // {
    //   name: "Another feature item",
    //   description: "Description tbd",
    //   // icon: <Icon />, // tbd
    // },
  ];

  return (
    <div className="my-20 mx-auto max-w-7xl px-6 lg:px-8">
      <div className="mx-auto max-w-2xl lg:text-center">
        <h2 className="text-lg font-semibold leading-6 text-blue-700 dark:text-blue-300">
          Robots made here.
        </h2>
        <p className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Everything you need to build your next robot
        </p>
        <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Talk with professionals, researchers, and hobbyists.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
        <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
          {features.map((feature) => (
            <div key={feature.name} className="relative pl-16">
              <dt className="text-base font-semibold leading-7">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-700">
                  <div aria-hidden="true" className="text-xl text-white">
                    {feature.icon}
                  </div>
                </div>
                {feature.name}
              </dt>
              <dd className="mt-2 text-base leading-7 text-gray-600 dark:text-gray-300">
                {feature.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default Features;
