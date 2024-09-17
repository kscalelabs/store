import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";

const KLangPage: React.FC = () => {
  return (
    <div className="my-20">
      <PageHeader
        title="K-Lang"
        subheading="Our programming language for humanoid robots with neural network integration built in"
      />
      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-gray-12">
              What is K-Lang?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-12">
            <p>
              K-Lang is a next-generation programming language designed
              specifically for controlling and programming humanoid robots. With
              its intuitive syntax and powerful features, K-Lang empowers both
              beginners and experts to create sophisticated robot behaviors and
              interactions.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-gray-12">
              Key Features
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-12">
            <ul className="list-disc list-inside space-y-2">
              <li>Simple and intuitive syntax for rapid development</li>
              <li>
                Built-in neural network functionality for advanced AI
                capabilities
              </li>
              <li>
                Robust error handling and safety features for reliable robot
                control
              </li>
              <li>
                Extensive library of pre-built functions for common robot tasks
              </li>
              <li>
                Cross-platform compatibility for various humanoid robot models
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <section className="mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-gray-12">
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent className="text-gray-12">
            <p className="mb-4">
              Ready to start programming your humanoid robot with K-Lang? Follow
              these steps:
            </p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Download the K-Lang development kit from our website</li>
              <li>Install the K-Lang compiler and runtime environment</li>
              <li>Set up your robot&apos;s connection parameters</li>
              <li>
                Write your first K-Lang program using our documentation and
                tutorials
              </li>
              <li>Deploy and run your program on your humanoid robot</li>
            </ol>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-gray-12">Try K-Lang</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-12">
            <p className="mb-4">
              Want to experiment with K-Lang before setting up your development
              environment? Our interactive online code editor is coming soon!
              Stay tuned for updates.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default KLangPage;
