import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-primary-600">
            Vibe Message
          </Link>

          <nav className="flex items-center space-x-6">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Dashboard
                </Link>
                <Link
                  to="/apps"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Apps
                </Link>
                {user.role === "SUPER_ADMIN" && (
                  <Link
                    to="/super/users"
                    className="text-gray-700 hover:text-primary-600"
                  >
                    Users
                  </Link>
                )}
                <Link
                  to="/docs"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Docs
                </Link>

                <Link
                  to="/profile"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Profile
                </Link>
                <button onClick={logout} className="btn-secondary">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/docs"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Docs
                </Link>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600"
                >
                  Login
                </Link>
                <Link to="/signup" className="btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
