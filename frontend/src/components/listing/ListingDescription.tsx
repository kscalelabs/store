import { Button } from "components/ui/Button/Button";
import { TextArea } from "components/ui/Input/Input";
import Spinner from "components/ui/Spinner";
import { useAlertQueue } from "hooks/useAlertQueue";
import { useAuthentication } from "hooks/useAuth";
import { useState } from "react";
import { FaFile, FaPen } from "react-icons/fa";
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
  listingId: string;
  description: string | null;
  // TODO: If can edit, allow the user to update the description.
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
          <RenderDescription description={newDescription} />
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
