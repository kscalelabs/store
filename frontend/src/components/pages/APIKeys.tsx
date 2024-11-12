import { useEffect, useState } from "react";

import RequireAuthentication from "@/components/auth/RequireAuthentication";
import Spinner from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { paths } from "@/gen/api";
import { useAlertQueue } from "@/hooks/useAlertQueue";
import { useAuthentication } from "@/hooks/useAuth";
import { cx } from "class-variance-authority";

type KeysResponse =
  paths["/keys/list"]["get"]["responses"][200]["content"]["application/json"]["keys"];

interface SingleKeyProps {
  token: string;
  permissions: ("read" | "write" | "admin")[] | null;
  onDelete: () => void;
}

const SingleKey = ({ token, permissions, onDelete }: SingleKeyProps) => {
  const auth = useAuthentication();
  const { addErrorAlert } = useAlertQueue();
  const [deleting, setDeleting] = useState(false);
  const [clickedCopyButton, setClickedCopyButton] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false); // State for key visibility

  const isActiveKey = auth.apiKeyId === token;

  const onClickCopyButton = async () => {
    setClickedCopyButton(true);
    navigator.clipboard.writeText(token);

    setTimeout(() => {
      setClickedCopyButton(false);
    }, 1000);
  };

  const deleteKey = async (key: string) => {
    setDeleting(true);

    const { error } = await auth.client.DELETE("/keys/delete/{key}", {
      params: {
        path: {
          key,
        },
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      onDelete();
    }

    setDeleting(false);
  };

  const censoredToken = `${token.slice(0, 4)}****${token.slice(-4)}`;

  return (
    <>
      {/* Key value */}
      <p>
        <span className="font-bold">Key:</span>{" "}
        <Button
          onClick={onClickCopyButton}
          variant="ghost"
          className="rounded-full"
          disabled={clickedCopyButton}
        >
          <code>
            {clickedCopyButton
              ? "copied!"
              : isKeyVisible
                ? token
                : censoredToken}
          </code>
        </Button>
        <Button
          onClick={() => setIsKeyVisible(!isKeyVisible)}
          variant="outline"
        >
          {isKeyVisible ? "Hide" : "Show Key"}
        </Button>
      </p>

      {/* Permissions */}
      <p>
        <span className="font-bold">Permissions:</span>{" "}
        {permissions?.join(", ") || "None"}
      </p>
      {isActiveKey && (
        <p className="text-sm text-orange-500">
          This is your active key. You cannot delete it.
        </p>
      )}

      {/* Delete button */}
      <Button
        onClick={() => deleteKey(token)}
        variant="destructive"
        disabled={deleting || isActiveKey}
        className="mt-2"
      >
        Delete
      </Button>
    </>
  );
};

const APIKeys = () => {
  const { addErrorAlert } = useAlertQueue();
  const auth = useAuthentication();
  const [apiKeys, setApiKeys] = useState<KeysResponse | null>(null);
  const [readonly, setReadonly] = useState(true);
  const [creatingKey, setCreatingKey] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data, error } = await auth.client.GET("/keys/list");

        if (error) {
          addErrorAlert(error);
        } else {
          setApiKeys(data.keys);
        }
      } catch (err) {
        addErrorAlert(err);
      }
    };
    fetchUser();
  }, [auth]);

  const createKey = async () => {
    setCreatingKey(true);
    const { data, error } = await auth.client.POST("/keys/new", {
      body: {
        readonly,
      },
    });

    if (error) {
      addErrorAlert(error);
    } else {
      setApiKeys(apiKeys ? [...apiKeys, data.key] : null);
    }
    setCreatingKey(false);
  };

  return (
    <RequireAuthentication>
      <div className="container mx-auto max-w-4xl shadow-md rounded-lg bg-gray-12 text-gray-2 border relative">
        <div className="p-6">
          <h1 className="text-3xl font-extrabold mb-4">API Keys</h1>
          {apiKeys === null ? (
            <Spinner />
          ) : (
            <>
              {apiKeys
                .sort((a, b) => a.token.localeCompare(b.token))
                .map((key) => (
                  <div key={key.token} className="py-4">
                    <SingleKey
                      token={key.token}
                      permissions={key.permissions}
                      onDelete={() => {
                        setApiKeys(
                          apiKeys ? apiKeys.filter((k) => k !== key) : null,
                        );
                      }}
                    />
                  </div>
                ))}
              <div className="pt-4">
                <label className="inline-flex items-center cursor-pointer align-middle pr-4">
                  <input
                    type="checkbox"
                    value={readonly ? "true" : "false"}
                    onChange={() => setReadonly(!readonly)}
                    className="sr-only peer"
                  />
                  <div
                    className={cx(
                      "relative w-11 h-6 bg-gray-3 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-9",
                      "rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full",
                      "peer-checked:after:border-gray-12 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-12",
                      "after:border-gray-6 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-9",
                    )}
                  ></div>
                </label>
                <Button
                  onClick={createKey}
                  variant="outline"
                  disabled={creatingKey}
                >
                  Create {readonly ? "Read-only " : "Read-write "}Key
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </RequireAuthentication>
  );
};

export default APIKeys;
