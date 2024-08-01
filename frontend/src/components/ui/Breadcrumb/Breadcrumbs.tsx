import clsx from "clsx";

interface ItemProps {
  label: string;
  onClick?: () => void;
  logo?: React.ReactNode;
}

interface Props {
  items: ItemProps[];
}

const Breadcrumbs = ({ items }: Props) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        {items.map((item, index) => (
          <li
            key={index}
            className={clsx(
              index === items.length - 1 && "text-gray-500 dark:text-gray-400",
            )}
          >
            <button className="inline-flex items-center text-lg font-medium text-gray-700 dark:text-gray-400">
              <a
                onClick={item.onClick}
                className="inline-flex items-center text-lg font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
              >
                {index > 0 && (
                  <span className="mr-2" aria-hidden="true">
                    /
                  </span>
                )}
                {item.logo && (
                  <span className="mr-2" aria-hidden="true">
                    {item.logo}
                  </span>
                )}
                {item.label}
              </a>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
