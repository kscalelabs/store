import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  CodeIcon,
  DownloadIcon,
  LayersIcon,
  MagnifyingGlassIcon,
} from "@radix-ui/react-icons";

import { Button } from "../ui/Buttons/Button";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center">
        <a className="flex items-center justify-center" href="#">
          <span className="sr-only">K-Scale Labs</span>
        </a>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <a
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            Features
          </a>
          <a
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            Pricing
          </a>
          <a
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            About
          </a>
          <a
            className="text-sm font-medium hover:underline underline-offset-4"
            href="#"
          >
            Contact
          </a>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Welcome to the Future of Robotics
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Experience cutting-edge technology with our advanced robotic
                  solutions.
                </p>
              </div>
              <div className="w-full max-w-4xl aspect-video overflow-hidden rounded-xl border bg-gray-200 dark:bg-gray-800">
                <video
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/placeholder.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
              K-Lang
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-row space-x-4">
                <Button variant="outline">Manipulation</Button>
                <Button variant="outline">Turning</Button>
                <Button variant="outline">Talking</Button>
              </div>
              <div
                className="rounded-lg border bg-card text-card-foreground shadow-sm"
                data-v0-t="card"
              >
                <div className="p-6">
                  <pre className="text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-900 p-4 rounded-md overflow-x-auto">
                    <code>{`function initializeRobot() {
  // Robot initialization code
  console.log("Robot initialized");
}

function performAction(action) {
  switch(action) {
    case "manipulate":
      // Manipulation code
      break;
    case "turn":
      // Turning code
      break;
    case "talk":
      // Talking code
      break;
    default:
      console.log("Unknown action");
  }
}

// Main execution
initializeRobot();
performAction("manipulate");`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
                  New Release
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Meet Our Latest Robot
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Revolutionize your workflow with our state-of-the-art robotic
                  assistant.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <img
                alt="Robot"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                height="310"
                src="/placeholder.svg"
                width="550"
              />
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Advanced AI</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Powered by the latest artificial intelligence
                        algorithms.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Precision Control</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Unparalleled accuracy in movement and manipulation.
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">24/7 Operation</h3>
                      <p className="text-gray-500 dark:text-gray-400">
                        Designed for continuous operation without downtime.
                      </p>
                    </div>
                  </li>
                </ul>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300">
                    Buy Now - $16,000
                  </Button>
                  <Button variant="outline">Learn More</Button>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
          <div className="container px-4 md:px-6">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-8">
              Explore More
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>K-Lang</CardTitle>
                  <CardDescription>
                    Write, run, find, and upload Klang programs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeIcon className="w-12 h-12 mb-4" />
                  <a
                    className="inline-flex items-center text-sm font-medium"
                    href="/k-lang"
                  >
                    Explore K-Lang
                    <CodeIcon className="ml-1 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Kernel Images</CardTitle>
                  <CardDescription>
                    View and download official K-Scale and community uploaded
                    kernel images
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DownloadIcon className="w-12 h-12 mb-4" />
                  <a
                    className="inline-flex items-center text-sm font-medium"
                    href="/kernel-images"
                  >
                    Browse Images
                    <DownloadIcon className="ml-1 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Browse Builds</CardTitle>
                  <CardDescription>
                    Browse completed/published robot builds which include CAD
                    files, part lists, and various related downloads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MagnifyingGlassIcon className="w-12 h-12 mb-4" />
                  <a
                    className="inline-flex items-center text-sm font-medium"
                    href="/builds"
                  >
                    View Builds
                    <MagnifyingGlassIcon className="ml-1 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>K-Sim</CardTitle>
                  <CardDescription>Run simulations</CardDescription>
                </CardHeader>
                <CardContent>
                  <LayersIcon className="w-12 h-12 mb-4" />
                  <a
                    className="inline-flex items-center text-sm font-medium"
                    href="/k-sim"
                  >
                    Start Simulation
                    <LayersIcon className="ml-1 h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2023 Acme Robotics. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <a className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </a>
          <a className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </a>
        </nav>
      </footer>
    </div>
  );
}
