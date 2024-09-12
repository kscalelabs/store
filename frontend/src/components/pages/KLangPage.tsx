import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

const KLangPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-5xl font-bold text-grat-12 mb-6">K-Lang</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-3xl text-gray-12">
            Introducing K-Lang
          </CardTitle>
          <CardDescription className="text-gray-11">
            The next-generation programming language for humanoid robots
          </CardDescription>
        </CardHeader>
        <CardContent className="text-gray-12">
          <p>
            K-Lang is a powerful and intuitive programming language designed
            specifically for controlling and programming humanoid robots. With
            its simple syntax and built in neural network functionality, K-Lang
            is the best way for beginners and experts to program and fine tune
            their robot.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-gray-12">Try K-Lang</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-11 mb-4">
            Ready to start programming your humanoid robot? Our interactive code
            editor is coming soon!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default KLangPage;
