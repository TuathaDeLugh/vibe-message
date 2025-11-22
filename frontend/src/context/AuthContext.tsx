import React, { createContext, useContext, useEffect, ReactNode } from "react";
import { User } from "../types";
import { useAppDispatch, useAppSelector } from "../store/store";
import { getCurrentUser, logoutUser } from "../store/slices/authSlice";
import { fetchApps } from "../store/slices/appsSlice";
import { initNotificationClient } from "../lib/notification-sdk";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const dispatch = useAppDispatch();
  const { user, loading, token } = useAppSelector((state) => state.auth);
  const { apps } = useAppSelector((state) => state.apps);

  useEffect(() => {
    if (token && !user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, user]);

  // Initialize notifications when user logs in
  useEffect(() => {
    if (user && apps.length === 0) {
      // Fetch apps to get credentials
      dispatch(fetchApps());
    }
  }, [user, apps.length, dispatch]);

  // Register notification client when we have apps
  useEffect(() => {
    if (user && apps.length > 0) {
      const firstApp = apps[0];

      try {
        const client = initNotificationClient({
          baseUrl: window.location.origin + "/api",
          appId: firstApp.public_app_id,
          publicKey: firstApp.public_key,
        });

        // Register callbacks
        client.onMessage((payload) => {
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

        client.onBackgroundMessage((payload) => {
          console.log("Background notification clicked:", payload);
        });

        client.onSilentMessage((data) => {
          console.log("Silent notification received:", data);
        });

        // Register device
        client
          .registerDevice({
            externalUserId: user.email,
            serviceWorkerPath: "/push-sw.js",
          })
          .then(() => {
            console.log("✅ Notifications enabled for admin panel");
          })
          .catch((error) => {
            console.error("Failed to register notifications:", error);
          });
      } catch (error) {
        console.error("Failed to initialize notification client:", error);
      }
    }
  }, [user, apps]);

  const logout = () => {
    dispatch(logoutUser());
    window.location.href = "/";
  };

  const refreshUser = async () => {
    await dispatch(getCurrentUser());
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
