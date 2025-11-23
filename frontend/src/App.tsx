import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Header } from "./components/layout/Header";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

// Public pages
import { Landing } from "./pages/public/Landing";
import { Login } from "./pages/public/Login";
import { Signup } from "./pages/public/Signup";
import { Docs } from "./pages/public/Docs";

// Admin pages
import { Dashboard } from "./pages/admin/Dashboard";
import { Apps } from "./pages/admin/Apps";
import { AppDetails } from "./pages/admin/AppDetails";
import Profile from "./pages/admin/Profile";
import { Pending } from "./pages/admin/Pending";

// Super admin pages
import { Users } from "./pages/super/Users";

const AppContent: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/docs" element={<Docs />} />

          {/* Protected routes */}
          <Route
            path="/pending"
            element={
              <ProtectedRoute>
                <Pending />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireApproved>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/apps"
            element={
              <ProtectedRoute requireApproved>
                <Apps />
              </ProtectedRoute>
            }
          />

          <Route
            path="/apps/:id"
            element={
              <ProtectedRoute requireApproved>
                <AppDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute requireApproved>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Super admin routes */}
          <Route
            path="/super/users"
            element={
              <ProtectedRoute requireApproved>
                <Users />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
