import { FaCaretLeft, FaCaretRight } from "react-icons/fa";

interface Props {
  items: {
    url: string;
    caption?: string;
  }[];
}

const Carousel = ({ items }: Props) => {
  if (items.length === 0) {
    return <></>;
  }

  return (
    <div className="relative w-full">
      {/* Carousel wrapper */}
      <div className="relative h-56 overflow-hidden rounded-lg md:h-96">
        {items.map(({ url, caption }, key) => (
          <div
            className="hidden duration-700 ease-in-out"
            data-carousel-item
            key={key}
          >
            <img
              src={url}
              className="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
              alt={caption}
            />
          </div>
        ))}
      </div>

      {/* Slider indicators */}
      <div className="absolute z-30 flex -translate-x-1/2 bottom-5 left-1/2 space-x-3 rtl:space-x-reverse">
        {items.map((_, key) => (
          <button
            type="button"
            className="w-3 h-3 rounded-full"
            aria-current={key === 0}
            aria-label={`Slide ${key + 1}`}
            data-carousel-slide-to={key}
            key={key}
          ></button>
        ))}
      </div>

      {/* Slider controls */}
      <button
        type="button"
        className="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
        data-carousel-prev
      >
        <FaCaretLeft className="w-4 h-4 text-gray-2 rtl:rotate-180" />
        <span className="sr-only">Previous</span>
      </button>
      <button
        type="button"
        className="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
        data-carousel-next
      >
        <FaCaretRight className="w-4 h-4 text-gray-2 rtl:rotate-180" />
        <span className="sr-only">Next</span>
      </button>
    </div>
  );
};

export default Carousel;
