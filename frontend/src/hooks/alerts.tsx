import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { Toast, ToastContainer } from "react-bootstrap";

const DELAY = 5000;
const MAX_ERRORS = 10;

type AlertType = "error" | "success" | "primary" | "info";

const alertTypeToBg = (kind: AlertType) => {
  switch (kind) {
    case "error":
      return "danger";
    case "success":
      return "success";
    case "primary":
      return "primary";
    case "info":
      return "secondary";
  }
};

interface AlertQueueContextProps {
  alerts: Map<string, [string | ReactNode, AlertType]>;
  removeAlert: (alertId: string) => void;
  addAlert: (alert: string | ReactNode, kind: AlertType) => void;
}

const AlertQueueContext = createContext<AlertQueueContextProps | undefined>(
  undefined,
);

interface AlertQueueProviderProps {
  children: React.ReactNode;
}

export const AlertQueueProvider = (props: AlertQueueProviderProps) => {
  const { children } = props;

  const [alerts, setAlerts] = useState<
    Map<string, [string | ReactNode, AlertType]>
  >(new Map());

  const generateAlertId = useCallback(() => {
    return Math.random().toString(36).substring(2);
  }, []);

  const addAlert = useCallback(
    (alert: string | ReactNode, kind: AlertType) => {
      setAlerts((prev) => {
        const newAlerts = new Map(prev);
        const alertId = generateAlertId();
        newAlerts.set(alertId, [alert, kind]);

        // Ensure the map doesn't exceed MAX_ERRORS
        while (newAlerts.size > MAX_ERRORS) {
          const firstKey = Array.from(newAlerts.keys())[0];
          newAlerts.delete(firstKey);
        }

        return newAlerts;
      });
    },
    [generateAlertId],
  );

  const removeAlert = useCallback((alertId: string) => {
    setAlerts((prev) => {
      const newAlerts = new Map(prev);
      newAlerts.delete(alertId);
      return newAlerts;
    });
  }, []);

  return (
    <AlertQueueContext.Provider
      value={{
        alerts,
        removeAlert,
        addAlert,
      }}
    >
      {children}
    </AlertQueueContext.Provider>
  );
};

export const useAlertQueue = () => {
  const context = useContext(AlertQueueContext);
  if (context === undefined) {
    throw new Error("useAlertQueue must be used within a ErrorQueueProvider");
  }
  return context;
};

interface AlertQueueProps {
  children: ReactNode;
}

export const AlertQueue = (props: AlertQueueProps) => {
  const { children } = props;
  const { alerts, removeAlert } = useAlertQueue();

  return (
    <>
      {children}
      <ToastContainer
        className="p-3"
        position="bottom-center"
        style={{ zIndex: 1000, position: "fixed", marginBottom: 50 }}
      >
        {Array.from(alerts).map(([alertId, [alert, kind]]) => {
          return (
            <Toast
              key={alertId}
              bg={alertTypeToBg(kind)}
              autohide
              delay={DELAY}
              onClose={() => removeAlert(alertId)}
              animation={true}
            >
              <Toast.Header>
                <strong className="me-auto">
                  {kind.charAt(0).toUpperCase() + kind.slice(1)}
                </strong>
              </Toast.Header>
              <Toast.Body>{alert}</Toast.Body>
            </Toast>
          );
        })}
      </ToastContainer>
    </>
  );
};
