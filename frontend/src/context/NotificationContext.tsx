import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { initNotificationClient } from "vibe-message";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../store/store";
import { fetchApps } from "../store/slices/appsSlice";

const NOTIFICATION_STORAGE_KEY = "admin-notification-registered";

interface NotificationContextType {
  permissionStatus: NotificationPermission;
  isRegistered: boolean;
  requestPermission: () => Promise<void>;
  initializeNotifications: () => Promise<void>;
  unregisterNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [permissionStatus, setPermissionStatus] =
    useState<NotificationPermission>("default");
  const [isRegistered, setIsRegistered] = useState(false);
  const initializingRef = useRef(false);
  const clientRef = useRef<any>(null);
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const { apps } = useAppSelector((state) => state.apps);

  // Load registration state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored === "true") {
        setIsRegistered(true);
      }
    }
  }, []);

  // Update permission status on mount and when it changes
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Fetch apps when user logs in
  useEffect(() => {
    if (user && apps.length === 0) {
      dispatch(fetchApps());
    }
  }, [user, apps.length, dispatch]);

  const initializeNotifications = async () => {
    if (!user || initializingRef.current) return;

    initializingRef.current = true;
    console.log("🔄 Initializing notifications...");

    let appId = "";
    let publicKey = "";

    if (apps.length > 0) {
      appId = apps[0].public_app_id;
      publicKey = apps[0].public_key;
    } else {
      // Fetch system app credentials for users without apps
      try {
        const response = await fetch("/api/apps/system/public", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          appId = data.data.public_app_id;
          publicKey = data.data.public_key;
        }
      } catch (error) {
        console.error("Failed to fetch system app credentials:", error);
        initializingRef.current = false;
        return;
      }
    }

    if (appId && publicKey) {
      try {
        const client = initNotificationClient({
          baseUrl: window.location.origin + "/api",
          appId: appId,
          publicKey: publicKey,
        });

        // Store client in ref for later use (unregister)
        clientRef.current = client;

        // Register callbacks
        client.onMessage((payload: any) => {
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? "animate-enter" : "animate-leave"
                } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
              >
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {payload.title}
                      </p>
                      {payload.body && (
                        <p className="mt-1 text-sm text-gray-500">
                          {payload.body}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Close
                  </button>
                </div>
              </div>
            ),
            {
              duration: 5000,
              position: "top-right",
            }
          );
        });

        client.onBackgroundMessage((payload: any) => {
          console.log("Background notification clicked:", payload);
        });

        client.onSilentMessage((data: any) => {
          console.log("Silent notification received:", data);
        });

        // Register device
        await client.registerDevice({
          externalUserId: user.email,
          serviceWorkerPath: "/push-sw.js",
        });

        setIsRegistered(true);
        setPermissionStatus(Notification.permission);

        // Save registration state to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(NOTIFICATION_STORAGE_KEY, "true");
        }

        console.log("✅ Notifications enabled for admin panel");
        toast.success("Notifications enabled!");
      } catch (error: any) {
        console.error("Failed to initialize notification client:", error);
        setPermissionStatus(Notification.permission);
        if (error.message !== "Notification permission denied") {
          toast.error("Failed to enable notifications");
        }
      }
    }

    initializingRef.current = false;
  };

  const unregisterNotifications = async () => {
    if (!clientRef.current || !user) return;

    try {
      console.log("🔄 Unregistering device...");
      await clientRef.current.unregisterDevice(user.email);

      setIsRegistered(false);
      clientRef.current = null;

      // Remove from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem(NOTIFICATION_STORAGE_KEY);
      }

      console.log("✅ Device unregistered successfully");
    } catch (error: any) {
      console.error("Failed to unregister device:", error);
    }
  };

  // Auto-initialize when permission is granted and user is logged in
  useEffect(() => {
    if (
      user &&
      permissionStatus === "granted" &&
      !isRegistered &&
      (apps.length > 0 || token)
    ) {
      initializeNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, permissionStatus, apps.length, token, isRegistered]);

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);

      if (permission === "granted") {
        await initializeNotifications();
      } else {
        toast.error("Notification permission denied");
      }
    } catch (error) {
      console.error("Failed to request permission:", error);
      toast.error("Failed to request permission");
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        permissionStatus,
        isRegistered,
        requestPermission,
        initializeNotifications,
        unregisterNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};
