import React from "react";
import { CardFooter, CardHeader } from "react-bootstrap";
import AuthProvider from "../AuthProvider";
import BackButton from "../Button/BackButton";
import { Card, CardContent } from "./Card";

interface CardWrapperProps {
  children: React.ReactNode;
  title: string;
  backButtonLabel: string;
  backButtonHref: string;
  showProvider?: boolean;
}

const CardWrapper = ({
  children,
  title,
  backButtonHref,
  backButtonLabel,
  showProvider,
}: CardWrapperProps) => {
  return (
    <Card className="w-[400px] shadow-md">
      <CardHeader>
        <p>{title}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {showProvider && (
        <CardFooter>
          <AuthProvider />
        </CardFooter>
      )}
      <CardFooter>
        <BackButton href={backButtonHref} label={backButtonLabel} />
      </CardFooter>
    </Card>
  );
};

export default CardWrapper;
