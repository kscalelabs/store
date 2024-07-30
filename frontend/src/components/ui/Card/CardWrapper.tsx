import BackButton from "../Button/BackButton";
import { Card, CardContent, CardFooter, CardHeader } from "../Card/Card";
// import Header from
import AuthProvider from "../AuthProvider";
import Header from "../Header";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showProvider?: boolean;
}

const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showProvider,
}: CardWrapperProps) => {
  return (
    <Card className="w-[400px] shadow-md h-full mb-40">
      <CardHeader>
        <Header label={headerLabel} />
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
