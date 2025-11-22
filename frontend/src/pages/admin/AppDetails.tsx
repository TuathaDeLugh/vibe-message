import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "../../store/store";
import {
  fetchAppById,
  updateExistingApp,
  rotateSecret,
  removeApp,
  clearSelectedApp,
} from "../../store/slices/appsSlice";
import { CopyButton } from "../../components/common/CopyButton";

export const AppDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedApp: app, loading } = useAppSelector((state) => state.apps);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchAppById(parseInt(id)));
    }
    return () => {
      dispatch(clearSelectedApp());
    };
  }, [id, dispatch]);

  useEffect(() => {
    if (app) {
      setEditName(app.name);
      setEditDescription(app.description || "");
    }
  }, [app]);

  const handleRotateSecret = async () => {
    const confirmed = window.confirm(
      "Are you sure? This will invalidate the current secret key."
    );
    if (!confirmed || !id) return;

    const result = await dispatch(rotateSecret(parseInt(id)));
    if (rotateSecret.fulfilled.match(result)) {
      toast.success("Secret key rotated successfully");
    } else {
      toast.error("Failed to rotate secret");
    }
  };

  const handleSaveEdit = async () => {
    if (!id) return;
    const result = await dispatch(
      updateExistingApp({
        id: parseInt(id),
        data: {
          name: editName,
          description: editDescription || undefined,
        },
      })
    );
    if (updateExistingApp.fulfilled.match(result)) {
      setIsEditing(false);
      toast.success("App updated successfully");
    } else {
      toast.error("Failed to update app");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const result = await dispatch(removeApp(parseInt(id)));
    if (removeApp.fulfilled.match(result)) {
      toast.success("App deleted successfully");
      navigate("/apps");
    } else {
      toast.error("Failed to delete app");
    }
  };

  if (loading && !app) return <div className="p-8">Loading...</div>;
  if (!app) return <div className="p-8">App not found</div>;

  const integrationCode = `// 1. Include the SDK
import { initNotificationClient } from 'fcm-clone-sdk';

// 2. Initialize with publicKey
const client = initNotificationClient({
  baseUrl: 'https://your-server.com/api',
  appId: '${app.public_app_id}',
  publicKey: '${app.public_key}'
});

// 3. Register callbacks
client.onMessage((payload) => {
  console.log('Foreground:', payload);
});

client.onBackgroundMessage((payload) => {
  console.log('Clicked:', payload);
});

client.onSilentMessage((data) => {
  console.log('Silent:', data);
});

// 4. Register device
await client.registerDevice({
  externalUserId: 'user-123',
  serviceWorkerPath: '/push-sw.js'
});`;

  const backendCode = `// Send push notification from your backend
const response = await fetch('https://your-server.com/api/push/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    appId: '${app.public_app_id}',
    secretKey: '${app.secret_key}',
    notification: {
      title: 'Hello!',
      body: 'This is a push notification',
      icon: '/icon.png'
    },
    targets: {
      externalUserIds: ['user-123']
    }
  })
});`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="text-3xl font-bold border-b-2 border-primary-600 focus:outline-none w-full"
                placeholder="App Name"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="App Description (optional)"
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={handleSaveEdit} className="btn-primary">
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(app.name);
                    setEditDescription(app.description || "");
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold">{app.name}</h1>
              {app.description && (
                <p className="text-gray-600 mt-2">{app.description}</p>
              )}
            </>
          )}
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary"
            >
              Edit
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-semibold mb-2">Delete App?</h3>
          <p className="text-red-700 mb-4">
            This will permanently delete this app and all associated devices and
            notifications. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
            >
              {loading ? "Deleting..." : "Yes, Delete App"}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Devices</h3>
          <p className="text-3xl font-bold text-primary-600">
            {app.device_count}
          </p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 text-sm font-medium mb-2">
            Notifications Sent
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {app.notification_count}
          </p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 text-sm font-medium mb-2">Status</h3>
          <p className="text-xl font-semibold">
            {app.is_active ? "✅ Active" : "❌ Inactive"}
          </p>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Credentials</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              App ID (Public)
            </label>
            <div className="flex space-x-2">
              <input
                value={app.public_app_id}
                readOnly
                className="input flex-1"
              />
              <CopyButton text={app.public_app_id} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Public Key (For SDK)
            </label>
            <div className="flex space-x-2">
              <input value={app.public_key} readOnly className="input flex-1" />
              <CopyButton text={app.public_key} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Safe to use in client-side code
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Secret Key (For Server API)
            </label>
            <div className="flex space-x-2">
              <input
                value={app.secret_key}
                readOnly
                className="input flex-1"
                type="password"
              />
              <CopyButton text={app.secret_key} />
              <button
                onClick={handleRotateSecret}
                disabled={loading}
                className="btn-danger"
              >
                {loading ? "Rotating..." : "Rotate"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Keep this secret! Never expose it in client-side code.
            </p>
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Frontend Integration</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          {integrationCode}
        </pre>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Backend Integration</h2>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
          {backendCode}
        </pre>
      </div>
    </div>
  );
};
