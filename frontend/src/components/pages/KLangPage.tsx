import React from "react";
import { FiArrowUpRight } from "react-icons/fi";

import { ExampleContent, TextParallaxContent } from "@/components/TextParallax";

const KLangPage: React.FC = () => {
  return (
    <div>
      <section className="mb-12">
        <TextParallaxContent
          imgUrl="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          subheading="Easy to learn"
          heading="Built for beginners and experts."
        >
          <div className="mx-auto max-w-3xl text-gray-12"></div>
        </TextParallaxContent>
        <TextParallaxContent
          imgUrl="https://images.unsplash.com/photo-1530893609608-32a9af3aa95c?q=80&w=2564&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          subheading="Program robots with positive and negative reinforcement learning models"
          heading="Neural network integration."
        >
          <NeuralNetworkContent />
        </TextParallaxContent>
        <TextParallaxContent
          imgUrl="https://images.unsplash.com/photo-1504610926078-a1611febcad3?q=80&w=2416&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          subheading="Know how your robot is running under the hood"
          heading="K-Lang is fully open-source."
        >
          <ExampleContent />
        </TextParallaxContent>
      </section>
    </div>
  );
};

const NeuralNetworkContent: React.FC = () => (
  <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 pb-24 pt-12 md:grid-cols-12">
    <h2 className="col-span-1 text-3xl font-bold md:col-span-4 text-gray-12">
      Neural Network Integration
    </h2>
    <div className="col-span-1 md:col-span-8">
      <p className="mb-4 text-xl text-gray-11 md:text-2xl">
        When compiling a Klang program, we choose a frame rate which will match
        the frame rate for the model that we will ultimately want to run (for
        example 50 Hz). The “program supervisor” runs at this frequency, keeping
        track of scoped values, running functions, and any control flow. The
        equivalent of a program counter taking a step is the program supervisor
        incrementing by one time step.
      </p>
      <p className="mb-8 text-xl text-gray-12 md:text-2xl">
        K-Lang is a WIP programming language.
      </p>
      <button className="w-full rounded bg-primary-9 px-9 py-4 text-xl text-gray-1 transition-colors hover:bg-gray-12 md:w-fit">
        Learn more <FiArrowUpRight className="inline" />
      </button>
    </div>
  </div>
);

export default KLangPage;
