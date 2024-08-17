import { useEffect, useState } from "react";
import { FaFile, FaPen } from "react-icons/fa";
import Markdown from "react-markdown";

import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import remarkGfm from "remark-gfm";

import { Button } from "components/ui/Button/Button";
import { TextArea } from "components/ui/Input/Input";
import Spinner from "components/ui/Spinner";

interface RenderDescriptionProps {
  description: string;
}

export const RenderDescription = ({ description }: RenderDescriptionProps) => {
  const [imageModal, setImageModal] = useState<[string, string] | null>(null);

  return (
    <>
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-1">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-4">{children}</ul>,
          ol: ({ children }) => (
            <ol className="list-decimal ml-4">{children}</ol>
          ),
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
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => <h1 className="text-2xl mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl mb-2">{children}</h2>,
          h3: ({ children }) => (
            <h3 className="text-lg mb-2 underline">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-md mb-2 font-bold">{children}</h4>
          ),
          img: ({ src, alt }) => (
            <div
              className="flex flex-col justify-center w-full mx-auto gap-2 my-4 md:w-2/3 lg:w-1/2 cursor-pointer"
              onClick={() => src && setImageModal([src, alt ?? ""])}
            >
              <img src={src} alt={alt} className="rounded-lg" />
              {alt && <p className="text-sm text-center">{alt}</p>}
            </div>
          ),
        }}
      >
        {description}
      </Markdown>

      {imageModal !== null && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setImageModal(null)}
        >
          <div
            className="absolute bg-white rounded-lg p-4 max-w-4xl max-h-4xl m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageModal[0]}
              alt={imageModal[1]}
              className="max-h-full max-w-full"
            />
          </div>
        </div>
      )}
    </>
  );
};

interface Props {
  listingId: string;
  description: string | null;
  edit: boolean;
}

const ListingDescription = (props: Props) => {
  const { listingId, description: initialDescription, edit } = props;

  const auth = useAuthentication();
  const { addAlert, addErrorAlert } = useAlertQueue();

  const [isEditing, setIsEditing] = useState(false);
  const [newDescription, setNewDescription] = useState(
    initialDescription ?? "",
  );
  const [hasChanged, setHasChanged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [debouncedDescription, setDebouncedDescription] = useState(
    initialDescription ?? "",
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedDescription(newDescription);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [newDescription]);

  const handleSave = async () => {
    if (!hasChanged) {
      setIsEditing(false);
      return;
    }
    if (newDescription.length < 6) {
      addErrorAlert("Description must be at least 6 characters long.");
      return;
    }
    setSubmitting(true);
    const { error } = await auth.client.PUT("/listings/edit/{id}", {
      params: {
        path: { id: listingId },
      },
      body: {
        description: newDescription,
      },
    });
    if (error) {
      addErrorAlert(error);
    } else {
      addAlert("Listing updated successfully", "success");
      setIsEditing(false);
    }
    setSubmitting(false);
  };

  return (
    <div className="mb-3">
      {submitting ? (
        <Spinner />
      ) : (
        <>
          {isEditing && (
            <TextArea
              placeholder="Description"
              rows={4}
              value={newDescription}
              onChange={(e) => {
                setNewDescription(e.target.value);
                setHasChanged(true);
              }}
              className="border-b border-gray-300 dark:border-gray-700 mb-2"
            />
          )}
          <RenderDescription description={debouncedDescription} />
          {edit && (
            <Button
              onClick={() => {
                if (isEditing) {
                  handleSave();
                } else {
                  setIsEditing(true);
                }
              }}
              variant="warning"
              className="mt-2"
              disabled={submitting}
            >
              {isEditing ? (
                <>
                  <FaFile className="mr-2" /> Save
                </>
              ) : (
                <>
                  <FaPen className="mr-2" /> Edit
                </>
              )}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default ListingDescription;
