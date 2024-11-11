import { useState } from "react";
import { FaCheck, FaPen, FaTimes } from "react-icons/fa";
import Markdown from "react-markdown";

import { TextArea } from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import remarkGfm from "remark-gfm";

interface RenderDescriptionProps {
  description: string;
}

const transformUrl = (url: string) => {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `https://${url}`;
};

export const RenderDescription = ({ description }: RenderDescriptionProps) => {
  return (
    <div className="w-full">
      <Markdown
        remarkPlugins={[remarkGfm]}
        className="w-full flex flex-col gap-2"
        components={{
          p: ({ children }) => <p className="mb-1">{children}</p>,
          ul: ({ children }) => (
            <ul className="list-disc ml-4 w-full flex flex-col gap-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ml-4">{children}</ol>
          ),
          li: ({ children }) => <li className="w-full">{children}</li>,
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
              href={transformUrl(href || "")}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500"
            >
              {children}
            </a>
          ),
          h1: ({ children }) => (
            <h1 className="text-2xl mb-2 w-full">{children}</h1>
          ),
          h2: ({ children }) => <h2 className="text-xl mb-2">{children}</h2>,
          h3: ({ children }) => (
            <h3 className="text-lg mb-2 underline">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-md mb-2 font-bold">{children}</h4>
          ),
        }}
      >
        {description}
      </Markdown>
    </div>
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
      setNewDescription(newDescription);
      setHasChanged(false);
    }
    setSubmitting(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNewDescription(initialDescription ?? "");
    setHasChanged(false);
  };

  return (
    <div className="mb-3 relative">
      {submitting ? (
        <Spinner />
      ) : (
        <>
          {!isEditing && (
            <div className="pr-10">
              <RenderDescription description={newDescription} />
            </div>
          )}
          {edit && !isEditing && (
            <div className="absolute top-0 right-0">
              <Button
                onClick={() => setIsEditing(true)}
                variant="ghost"
                size="icon"
                disabled={submitting}
              >
                <FaPen />
              </Button>
            </div>
          )}
          {isEditing && (
            <>
              <TextArea
                placeholder="Description"
                value={newDescription}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleSave();
                  }
                }}
                onChange={(e) => {
                  setNewDescription(e.target.value);
                  setHasChanged(true);
                }}
                className="border-b border-gray-5 mb-2 font-mono min-h-[200px] h-auto resize-none bg-black text-white"
                style={{
                  height: `${Math.max(200, newDescription.split("\n").length * 24)}px`,
                }}
                autoFocus
              />
              <RenderDescription description={newDescription} />
              <div className="flex gap-2 justify-end mt-4">
                <Button
                  onClick={handleCancel}
                  variant="ghost"
                  size="icon"
                  disabled={submitting}
                  className="text-red-500 hover:text-red-700 hover:bg-transparent"
                >
                  <FaTimes />
                </Button>
                <Button
                  onClick={handleSave}
                  variant="ghost"
                  size="icon"
                  disabled={submitting || !hasChanged}
                  className="text-green-500 hover:text-green-700 hover:bg-transparent"
                >
                  <FaCheck />
                </Button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ListingDescription;
