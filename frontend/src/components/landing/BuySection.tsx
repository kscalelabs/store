import { Button } from "@/components/ui/Buttons/Button";
import KScale_Garage from "@/images/KScale_Garage.jpeg";

export default function BuySection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">
              New Release
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              Meet K-1
            </h2>
            <p className="max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
              Exceptional build quality and all the capabilities of other
              humanoid robot platforms, with full customizability at a fraction
              of the price.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <img
            alt="Robot"
            className="mx-auto w-full max-w-md aspect-video overflow-hidden rounded-xl object-cover object-center lg:order-last"
            height="310"
            src={KScale_Garage}
            width="550"
          />
          <div className="flex flex-col justify-center space-y-4">
            <ul className="grid gap-6">
              <li>
                <div className="grid gap-1">
                  <h3 className="text-xl font-bold">Advanced AI</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Powered by the latest artificial intelligence algorithms.
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="w-full sm:w-auto inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300">
                Buy Now - $16,000
              </Button>
              <Button variant="outline" className="w-full sm:w-auto">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
