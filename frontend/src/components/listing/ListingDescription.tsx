import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface RenderDescriptionProps {
  description: string;
}

export const RenderDescription = ({ description }: RenderDescriptionProps) => {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        // For Tailwind CSS styling.
        p: ({ children }) => <p className="mb-1">{children}</p>,
        ul: ({ children }) => <ul className="list-disc ml-4">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal ml-4">{children}</ol>,
        li: ({ children }) => <li className="mb-1">{children}</li>,
        table: ({ children }) => (
          <table className="table-auto w-full">{children}</table>
        ),
        thead: ({ children }) => (
          <thead className="bg-gray-50">{children}</thead>
        ),
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr>{children}</tr>,
        th: ({ children }) => (
          <th className="border px-4 py-2 text-left">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border px-4 py-2 text-left">{children}</td>
        ),
      }}
    >
      {description}
    </Markdown>
  );
};

interface Props {
  description: string | null;
  // TODO: If can edit, allow the user to update the description.
  edit: boolean;
}

const ListingDescription = (props: Props) => {
  const { description } = props;
  return (
    <div className="mb-3">
      {description && <RenderDescription description={description} />}
    </div>
  );
};

export default ListingDescription;
