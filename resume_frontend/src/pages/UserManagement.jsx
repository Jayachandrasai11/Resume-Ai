import React, { useEffect, useMemo, useState } from 'react';
import { api, asList } from '../services/api';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'recruiter', label: 'Recruiter' },
];

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const username = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      return username.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [users, search]);

  async function load() {
    try {
      setLoading(true);
      setError('');
      const res = await api.adminListUsers();
      setUsers(asList(res.data));
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      const serverMsg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (typeof e?.response?.data === 'string' ? e.response.data : null);
      if (!e?.response) {
        setError('Unable to connect to the server. Please start the backend and try again.');
      } else {
        setError(
          `Failed to load users${status ? ` (HTTP ${status})` : ''}${serverMsg ? `: ${serverMsg}` : '.'}`
        );
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateUser(userId, patch) {
    try {
      setBusyId(userId);
      // Backend currently exposes a PUT route and handles partial updates.
      const res = await api.adminUpdateUser(userId, patch);
      const updated = res.data || {};
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      const serverMsg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (typeof e?.response?.data === 'string' ? e.response.data : null);
      alert(
        `Failed to update user${status ? ` (HTTP ${status})` : ''}${serverMsg ? `: ${serverMsg}` : '.'}`
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteUser(userId) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      setBusyId(userId);
      await api.adminDeleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      const serverMsg =
        e?.response?.data?.detail ||
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (typeof e?.response?.data === 'string' ? e.response.data : null);
      alert(
        `Failed to delete user${status ? ` (HTTP ${status})` : ''}${serverMsg ? `: ${serverMsg}` : '.'}`
      );
    } finally {
      setBusyId(null);
    }
  }

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">
            View users, change role, activate/deactivate, and delete accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username, email, role..."
            className="w-full md:w-72 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          <button
            onClick={load}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 flex items-start justify-between gap-4">
          <div>{error}</div>
          <button
            type="button"
            onClick={load}
            className="shrink-0 px-3 py-2 bg-white border border-red-200 rounded-lg text-xs font-bold text-red-700 hover:bg-red-100"
          >
            Retry
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">
            {loading ? 'Loading...' : `${filtered.length} users`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    Loading users...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                    No users found.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{u.username}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email || '—'}</td>
                    <td className="px-6 py-4">
                      <select
                        value={u.role || 'recruiter'}
                        disabled={busyId === u.id}
                        onChange={(e) => updateUser(u.id, { role: e.target.value })}
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => updateUser(u.id, { is_active: !u.is_active })}
                        className={`px-3 py-1 rounded-full text-xs font-bold border transition disabled:opacity-50 ${
                          u.is_active
                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(u.date_joined)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        disabled={busyId === u.id}
                        onClick={() => deleteUser(u.id)}
                        className="px-3 py-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

