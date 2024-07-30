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
  loginWithGoogle?: () => void;
  loginWithGithub?: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showProvider,
  loginWithGithub,
}: CardWrapperProps) => {
  return (
    <Card className="w-[400px] shadow-md h-full mb-40">
      <CardHeader>
        <Header label={headerLabel} />
      </CardHeader>
      <CardContent>{children}</CardContent>
      {showProvider && (
        <CardFooter>
          <AuthProvider handleGithubSubmit={loginWithGithub} />
        </CardFooter>
      )}
      <CardFooter>
        <BackButton href={backButtonHref} label={backButtonLabel} />
      </CardFooter>
    </Card>
  );
};

export default CardWrapper;
