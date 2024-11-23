import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

import Toast from "@/components/ui/Toast";

const DELAY = 5000;
const MAX_ALERTS = 5;

// eslint-disable-next-line
export const humanReadableError = (error: any | undefined) => {
  if (typeof error === "string") {
    return error;
  }
  if (error?.message) {
    return `${error.message}`;
  }
  if (error?.detail) {
    return `${error.detail}`;
  }
  return "An unknown error occurred";
};

type AlertType = "error" | "success" | "info";

interface AlertQueueContextProps {
  alerts: Map<string, [string | ReactNode, AlertType]>;
  removeAlert: (alertId: string) => void;
  addAlert: (alert: string | ReactNode, kind: AlertType) => void;
  // eslint-disable-next-line
  addErrorAlert: (alert: any) => void;
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
        while (newAlerts.size > MAX_ALERTS) {
          const firstKey = Array.from(newAlerts.keys())[0];
          newAlerts.delete(firstKey);
        }

        return newAlerts;
      });
    },
    [generateAlertId],
  );

  const addErrorAlert = useCallback(
    // eslint-disable-next-line
    (alert: any | undefined) => {
      addAlert(humanReadableError(alert), "error");
    },
    [addAlert],
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
        addErrorAlert,
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
      {/* Render the alerts coming up from the bottom-left corner. */}
      <div className="fixed bottom-0 left-0 p-4 space-y-4 z-[9999]">
        {Array.from(alerts).map(([alertId, [alert, kind]]) => {
          return (
            <Toast
              key={alertId}
              kind={kind}
              message={alert}
              timeout={DELAY}
              onClose={() => removeAlert(alertId)}
            />
          );
        })}
      </div>
    </>
  );
};
