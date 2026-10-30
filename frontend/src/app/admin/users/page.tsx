"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type UserRole = "ADMIN" | "ORGANIZER" | "RECEPTION";
type NewUserRole = "ORGANIZER" | "RECEPTION";

type User = {
  id: number;
  username: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  organizationId: number;
  createdAt: string;
  eventIds: number[];
};

type Event = {
  id: number;
  name: string;
};

type CreateUserForm = {
  username: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: NewUserRole;
  eventIds: number[];
};

type EditUserForm = {
  username: string;
  name: string;
  email: string;
  role: NewUserRole;
  isActive: boolean;
  eventIds: number[];
};

const initialForm: CreateUserForm = {
  username: "",
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  role: "ORGANIZER",
  eventIds: [],
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<CreateUserForm>(initialForm);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(
    null,
  );

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [resettingPassword, setResettingPassword] = useState(false);

  const [editForm, setEditForm] = useState<EditUserForm>({
    username: "",
    name: "",
    email: "",
    role: "ORGANIZER",
    isActive: true,
    eventIds: [],
  });

  const [editError, setEditError] = useState("");

  async function loadUsers() {
    const response = await fetch("/api/admin/users", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load users");
    }

    if (!Array.isArray(data)) {
      throw new Error("Unexpected users response");
    }

    setUsers([...data].sort((a: User, b: User) => a.id - b.id));
  }

  async function loadEvents() {
    const response = await fetch("/api/admin/events", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to load events");
    }

    if (!Array.isArray(data)) {
      throw new Error("Unexpected events response");
    }

    setEvents(data);
  }

  useEffect(() => {
    async function load() {
      try {
        await Promise.all([loadUsers(), loadEvents()]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  function toggleEvent(eventId: number) {
    setForm((current) => ({
      ...current,
      eventIds: current.eventIds.includes(eventId)
        ? current.eventIds.filter((id) => id !== eventId)
        : [...current.eventIds, eventId],
    }));
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (form.password !== form.confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    if (form.password.length < 12) {
      setFormError("Password must contain at least 12 characters");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: form.username.trim(),
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          eventIds: form.eventIds,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create user");
      }

      await loadUsers();

      setForm({ ...initialForm, eventIds: [] });
      setShowForm(false);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create user",
      );
    } finally {
      setSaving(false);
    }
  }

  function openEdit(user: User) {
    if (user.role === "ADMIN") return;

    setEditingUserId(user.id);
    setEditError("");

    setEditForm({
      username: user.username,
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role,
      isActive: user.isActive,
      eventIds: user.eventIds ?? [],
    });
  }

  function toggleEditEvent(eventId: number) {
    setEditForm((current) => ({
      ...current,
      eventIds: current.eventIds.includes(eventId)
        ? current.eventIds.filter((id) => id !== eventId)
        : [...current.eventIds, eventId],
    }));
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingUserId === null) return;

    setSaving(true);
    setEditError("");

    try {
      const response = await fetch(`/api/admin/users/${editingUserId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: editForm.username.trim(),
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          role: editForm.role,
          isActive: editForm.isActive,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update user");
      }

      const eventsResponse = await fetch(
        `/api/admin/users/${editingUserId}/events`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventIds: editForm.eventIds,
          }),
        },
      );

      const eventsData = await eventsResponse.json();

      if (!eventsResponse.ok) {
        throw new Error(
          eventsData.message || "Failed to update event assignments",
        );
      }

      await loadUsers();

      setEditingUserId(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update user",
      );
    } finally {
      setSaving(false);
    }
  }

  function openResetPassword(user: User) {
    if (user.role === "ADMIN") return;

    setResetPasswordUserId(user.id);
    setNewPassword("");
    setConfirmNewPassword("");
    setPasswordError("");
    setPasswordSuccess("");
  }

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (resetPasswordUserId === null) return;

    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 12 || newPassword.length > 128) {
      setPasswordError("Password must contain 12-128 characters");
      return;
    }

    setResettingPassword(true);

    try {
      const response = await fetch(
        `/api/admin/users/${resetPasswordUserId}/password`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: newPassword,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setNewPassword("");
      setConfirmNewPassword("");
      setPasswordSuccess("Password updated successfully");
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : "Failed to reset password",
      );
    } finally {
      setResettingPassword(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-8">
        <p>Loading users...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl space-y-8 p-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>

          <h1 className="mt-3 text-3xl font-bold">Users Management</h1>

          <p className="mt-2 text-sm text-gray-500">
            Create and manage organizer and reception accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError("");
            setShowForm(true);
          }}
          className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
        >
          + Add User
        </button>
      </header>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-700">{error}</div>
      )}

      <section className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">Username</th>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-gray-100">
                <td className="p-4 font-medium">{user.username}</td>
                <td className="p-4">{user.name || "—"}</td>
                <td className="p-4">{user.email || "—"}</td>
                <td className="p-4">{user.role}</td>
                <td className="p-4">
                  <span
                    className={
                      user.isActive ? "text-green-700" : "text-red-600"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4">
                  {user.role !== "ADMIN" && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="rounded-lg border border-blue-200 px-3 py-2 text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => openResetPassword(user)}
                        className="rounded-lg border border-orange-200 px-3 py-2 text-orange-600 hover:bg-orange-50"
                      >
                        Reset Password
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Add User</h2>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <label className="block text-sm">
                Username
                <input
                  required
                  minLength={3}
                  maxLength={50}
                  autoComplete="off"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>

              <label className="block text-sm">
                Name
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>

              <label className="block text-sm">
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>

              <label className="block text-sm">
                Password
                <input
                  required
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>

              <label className="block text-sm">
                Confirm Password
                <input
                  required
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>

              <label className="block text-sm">
                Role
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value as NewUserRole,
                    })
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                >
                  <option value="ORGANIZER">Organizer</option>
                  <option value="RECEPTION">Reception</option>
                </select>
              </label>

              <fieldset className="rounded-lg border p-4">
                <legend className="px-2 text-sm font-medium">
                  Assigned Events
                </legend>

                {events.length === 0 ? (
                  <p className="text-sm text-gray-500">No events available.</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <label
                        key={event.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={form.eventIds.includes(event.id)}
                          onChange={() => toggleEvent(event.id)}
                        />
                        {event.name}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              {formError && (
                <p role="alert" className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border px-5 py-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editingUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Edit User</h2>

              <button
                type="button"
                disabled={saving}
                onClick={() => setEditingUserId(null)}
                className="text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <label className="block text-sm">
                Username
                <input
                  required
                  minLength={3}
                  maxLength={50}
                  value={editForm.username}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      username: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>

              <label className="block text-sm">
                Name
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      name: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>

              <label className="block text-sm">
                Email
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      email: e.target.value,
                    })
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>

              <label className="block text-sm">
                Role
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value as NewUserRole,
                    })
                  }
                  className="mt-1 w-full rounded-lg border p-3"
                >
                  <option value="ORGANIZER">Organizer</option>
                  <option value="RECEPTION">Reception</option>
                </select>
              </label>

              <fieldset className="rounded-lg border p-4">
                <legend className="px-2 text-sm font-medium">
                  Assigned Events
                </legend>

                {events.length === 0 ? (
                  <p className="text-sm text-gray-500">No events available.</p>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <label
                        key={event.id}
                        className="flex items-center gap-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={editForm.eventIds.includes(event.id)}
                          onChange={() => toggleEditEvent(event.id)}
                        />

                        {event.name}
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              <label className="flex items-center gap-3 rounded-lg border p-4 text-sm">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      isActive: e.target.checked,
                    })
                  }
                />
                Active account
              </label>

              {editError && (
                <p role="alert" className="text-sm text-red-600">
                  {editError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditingUserId(null)}
                  className="rounded-lg border px-5 py-2"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPasswordUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Reset Password</h2>

              <button
                type="button"
                disabled={resettingPassword}
                onClick={() => setResetPasswordUserId(null)}
                className="text-gray-500 hover:text-gray-900"
              >
                ✕
              </button>
            </div>

            <p className="mb-5 text-sm text-gray-500">
              Set a new password for this user. The current password is not
              required.
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <label className="block text-sm">
                New Password
                <input
                  required
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>

              <label className="block text-sm">
                Confirm New Password
                <input
                  required
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete="new-password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </label>

              {passwordError && (
                <p role="alert" className="text-sm text-red-600">
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p role="status" className="text-sm text-green-700">
                  {passwordSuccess}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  disabled={resettingPassword}
                  onClick={() => setResetPasswordUserId(null)}
                  className="rounded-lg border px-5 py-2"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={resettingPassword}
                  className="rounded-lg bg-orange-600 px-5 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
                >
                  {resettingPassword ? "Updating..." : "Reset Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
