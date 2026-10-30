"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

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
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white md:px-8">
      {/* HEADER */}
      <header className="mb-9 flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="mb-2 text-sm font-semibold tracking-widest text-blue-400">
            EVENTFLOW
          </p>

          <Link
            href="/admin"
            className="mb-3 inline-block text-sm text-blue-400 hover:text-blue-300"
          >
            &larr; Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-white">Users Management</h1>

          <p className="mt-2 text-sm text-slate-400">
            Create and manage organizer and reception accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-semibold text-blue-400">
              A
            </span>

            <span className="text-sm font-medium text-slate-300">admin</span>
          </div>

          <LogoutButton />

          <button
            type="button"
            onClick={() => {
              setFormError("");
              setShowForm(true);
            }}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-500"
          >
            + Add User
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-900 bg-red-950/50 p-4 text-red-400">
          {error}
        </div>
      )}

      <section className="overflow-x-auto rounded-2xl border border-slate-700/70 bg-slate-900 text-white shadow-lg shadow-black/10">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead className="border-b border-slate-700 bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-5">Username</th>
              <th className="px-5 py-5">Name</th>
              <th className="px-5 py-5">Email</th>
              <th className="px-5 py-5">Role</th>
              <th className="px-5 py-5">Status</th>
              <th className="px-5 py-5">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t border-slate-800 transition-colors hover:bg-slate-800/70"
              >
                <td className="px-5 py-5 font-semibold text-white">
                  {user.username}
                </td>
                <td className="px-5 py-5 text-slate-200">{user.name || "—"}</td>
                <td className="px-5 py-5 text-slate-400">
                  {user.email || "—"}
                </td>
                <td className="px-5 py-5">
                  <span className="inline-flex rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-300">
                    {user.role}
                  </span>
                </td>
                <td className="px-5 py-5">
                  <span
                    className={
                      user.isActive
                        ? "inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400"
                        : "inline-flex rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400"
                    }
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-5 py-5">
                  {user.role !== "ADMIN" && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="rounded-lg border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 transition hover:border-blue-400 hover:bg-blue-500/20"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => openResetPassword(user)}
                        className="rounded-lg border border-orange-500/40 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-300 transition hover:border-orange-400 hover:bg-orange-500/20"
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
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-user-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl md:p-8"
          >
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <h2 id="add-user-title" className="text-2xl font-bold">
                  Add User
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Create a new EventFlow account.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setShowForm(false)}
                disabled={saving}
                className="text-2xl text-slate-400 hover:text-white disabled:opacity-50"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                <label className="block text-sm font-medium">
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
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Name
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Role
                  <select
                    value={form.role}
                    onChange={(e) =>
                      setForm({ ...form, role: e.target.value as NewUserRole })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  >
                    <option value="ORGANIZER">Organizer</option>
                    <option value="RECEPTION">Reception</option>
                  </select>
                </label>
                <label className="block text-sm font-medium">
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
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Confirm Password
                  <input
                    required
                    type="password"
                    minLength={12}
                    maxLength={128}
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </label>
              </div>
              <fieldset className="rounded-xl border border-slate-700 bg-slate-950/40 p-5">
                <legend className="px-2 text-sm font-semibold text-slate-200">
                  Assigned Events
                </legend>
                {events.length === 0 ? (
                  <p className="text-sm text-slate-400">No events available.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {events.map((event) => (
                      <label
                        key={event.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm hover:bg-slate-800"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-blue-500"
                          checked={form.eventIds.includes(event.id)}
                          onChange={() => toggleEvent(event.id)}
                        />
                        <span>{event.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
              {formError && (
                <p role="alert" className="text-sm text-red-400">
                  {formError}
                </p>
              )}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-title"
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl md:p-8"
          >
            <div className="mb-7 flex items-start justify-between gap-4">
              <div>
                <h2 id="edit-user-title" className="text-2xl font-bold">
                  Edit User
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Update account details and event access.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                disabled={saving}
                onClick={() => setEditingUserId(null)}
                className="text-2xl text-slate-400 hover:text-white disabled:opacity-50"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">
                <label className="block text-sm font-medium">
                  Username
                  <input
                    required
                    minLength={3}
                    maxLength={50}
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({ ...editForm, username: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Name
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Email
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </label>
                <label className="block text-sm font-medium">
                  Role
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        role: e.target.value as NewUserRole,
                      })
                    }
                    className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  >
                    <option value="ORGANIZER">Organizer</option>
                    <option value="RECEPTION">Reception</option>
                  </select>
                </label>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/40 p-4 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-500"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isActive: e.target.checked })
                  }
                />
                <span className="font-medium">Active account</span>
              </label>
              <fieldset className="rounded-xl border border-slate-700 bg-slate-950/40 p-5">
                <legend className="px-2 text-sm font-semibold text-slate-200">
                  Assigned Events
                </legend>
                {events.length === 0 ? (
                  <p className="text-sm text-slate-400">No events available.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {events.map((event) => (
                      <label
                        key={event.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-4 py-3 text-sm hover:bg-slate-800"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-blue-500"
                          checked={editForm.eventIds.includes(event.id)}
                          onChange={() => toggleEditEvent(event.id)}
                        />
                        <span>{event.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>
              {editError && (
                <p role="alert" className="text-sm text-red-400">
                  {editError}
                </p>
              )}
              <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setEditingUserId(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2.5 text-slate-200 hover:bg-slate-700 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPasswordUserId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Reset Password</h2>

              <button
                type="button"
                disabled={resettingPassword}
                onClick={() => setResetPasswordUserId(null)}
                className="text-slate-400 transition hover:text-white"
              >
                &times;
              </button>
            </div>

            <p className="mb-5 text-sm text-slate-400">
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
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500"
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
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-white placeholder:text-slate-500 outline-none transition focus:border-blue-500"
                />
              </label>

              {passwordError && (
                <p role="alert" className="text-sm text-red-400">
                  {passwordError}
                </p>
              )}

              {passwordSuccess && (
                <p role="status" className="text-sm text-emerald-400">
                  {passwordSuccess}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  disabled={resettingPassword}
                  onClick={() => setResetPasswordUserId(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-5 py-2 text-slate-200 transition hover:bg-slate-700"
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
