"use client";

import { useEffect, useMemo, useState } from "react";
import { backendFetch, getStoredAuthUser } from "@/lib/backend-client";

type PermissionGroup = { group: string; permissions: [string, string][] };
type AdminRole = { id: string; role: string; display_name?: string; description?: string; permissions?: unknown; is_system?: boolean };
type AdminUser = { id: string; name?: string; email?: string; mobile?: string; role?: string; is_active?: boolean; custom_permissions_enabled?: boolean; custom_permissions?: unknown };
type StaffForm = {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: string;
  is_active: boolean;
  custom_permissions_enabled: boolean;
  custom_permissions: string[];
};

function normalizePermissions(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>).filter(([, allowed]) => Boolean(allowed)).map(([key]) => key);
  return [];
}

function blankRole(): AdminRole {
  return { id: "", role: "", display_name: "", description: "", permissions: [], is_system: false };
}

export function AdminRolesPermissions() {
  const [catalog, setCatalog] = useState<PermissionGroup[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedRole, setSelectedRole] = useState<AdminRole>(blankRole());
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [customUserId, setCustomUserId] = useState("");
  const [customPermissions, setCustomPermissions] = useState<string[]>([]);
  const [customMode, setCustomMode] = useState(false);
  const [staffForm, setStaffForm] = useState<StaffForm>({
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "admin",
    is_active: true,
    custom_permissions_enabled: false,
    custom_permissions: []
  });
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("Loading roles...");
  const authRole = getStoredAuthUser()?.role;
  const isSuperAdmin = authRole === "super_admin" || authRole === "super-admin";

  useEffect(() => {
    void load();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => `${user.name || ""} ${user.email || ""} ${user.mobile || ""} ${user.role || ""}`.toLowerCase().includes(q));
  }, [query, users]);

  async function load() {
    setMessage("Loading roles...");
    try {
      const response = await backendFetch("/admin/roles-permissions");
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to load roles.");
      setCatalog(data.catalog ?? []);
      setRoles(data.roles ?? []);
      setUsers(data.users ?? []);
      setSelectedRole((data.roles ?? [])[0] ?? blankRole());
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load roles.");
    }
  }

  function rolePermissions(role = selectedRole) {
    return normalizePermissions(role.permissions);
  }

  function setRolePermission(permission: string, checked: boolean) {
    const current = new Set(rolePermissions());
    if (checked) current.add(permission);
    else current.delete(permission);
    setSelectedRole({ ...selectedRole, permissions: Array.from(current) });
  }

  function setCustomPermission(permission: string, checked: boolean) {
    const current = new Set(customPermissions);
    if (checked) current.add(permission);
    else current.delete(permission);
    setCustomPermissions(Array.from(current));
  }

  function setStaffPermission(permission: string, checked: boolean) {
    const current = new Set(staffForm.custom_permissions);
    if (checked) current.add(permission);
    else current.delete(permission);
    setStaffForm({ ...staffForm, custom_permissions: Array.from(current) });
  }

  function selectRole(role: AdminRole) {
    setSelectedRole({ ...role, permissions: rolePermissions(role) });
    setSelectedUsers([]);
  }

  async function saveRole() {
    if (!isSuperAdmin) return setMessage("Only Super Admin can change permissions.");
    const payload = {
      role: selectedRole.role,
      display_name: selectedRole.display_name || selectedRole.role,
      description: selectedRole.description || "",
      permissions: rolePermissions(),
      is_system: selectedRole.is_system ?? false
    };
    const isNew = !selectedRole.id;
    const response = await backendFetch(isNew ? "/admin/roles-permissions" : `/admin/roles-permissions/${selectedRole.id}`, {
      method: isNew ? "POST" : "PATCH",
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.message || "Unable to save role.");
    setMessage(isNew ? "Role created." : "Role updated.");
    await load();
  }

  async function cloneRole(role: AdminRole) {
    if (!isSuperAdmin) return setMessage("Only Super Admin can clone roles.");
    const roleCode = window.prompt("New role code, e.g. senior_booking_manager");
    if (!roleCode) return;
    const displayName = window.prompt("Display name", `${role.display_name || role.role} Copy`) || `${role.display_name || role.role} Copy`;
    const response = await backendFetch(`/admin/roles-permissions/${role.id}/clone`, { method: "POST", body: JSON.stringify({ role: roleCode, display_name: displayName }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.message || "Unable to clone role.");
    setMessage("Role cloned.");
    await load();
  }

  async function deleteRole(role: AdminRole) {
    if (!isSuperAdmin) return setMessage("Only Super Admin can delete roles.");
    if (!window.confirm(`Delete role ${role.display_name || role.role}?`)) return;
    const response = await backendFetch(`/admin/roles-permissions/${role.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.message || "Unable to delete role.");
    setMessage("Role deleted.");
    await load();
  }

  async function assignUsersToRole() {
    if (!selectedRole.role || !selectedUsers.length) return setMessage("Select a role and at least one user.");
    const response = await backendFetch("/admin/roles-permissions/assign-users", { method: "POST", body: JSON.stringify({ adminIds: selectedUsers, role: selectedRole.role }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.message || "Unable to assign users.");
    setSelectedUsers([]);
    setMessage("Role assigned.");
    await load();
  }

  function openCustomUser(user: AdminUser) {
    setCustomUserId(user.id);
    setCustomMode(Boolean(user.custom_permissions_enabled));
    setCustomPermissions(normalizePermissions(user.custom_permissions));
  }

  async function saveCustomUser() {
    if (!customUserId) return setMessage("Select a user first.");
    const response = await backendFetch(`/admin/admin-users/${customUserId}`, {
      method: "PATCH",
      body: JSON.stringify({ custom_permissions_enabled: customMode, custom_permissions: customPermissions })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.message || "Unable to save custom permissions.");
    setMessage("Custom permissions saved.");
    await load();
  }

  async function createStaffUser() {
    if (!isSuperAdmin) return setMessage("Only Super Admin can create admin users.");
    if (!staffForm.email || !staffForm.password || !staffForm.role) return setMessage("Email, password, and role are required.");
    const response = await backendFetch("/admin/admin-users", {
      method: "POST",
      body: JSON.stringify(staffForm)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return setMessage(data.message || "Unable to create admin user.");
    setMessage("Admin user created.");
    setStaffForm({
      name: "",
      email: "",
      mobile: "",
      password: "",
      role: "admin",
      is_active: true,
      custom_permissions_enabled: false,
      custom_permissions: []
    });
    await load();
  }

  const selectedRolePermissions = new Set(rolePermissions());
  const customSet = new Set(customPermissions);
  const staffSet = new Set(staffForm.custom_permissions);

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">Admin - Roles & Permissions</p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#102a2d] md:text-4xl">Dynamic permissions</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5a7273] md:text-base">Create roles, clone defaults, assign permissions, and customize individual admin access.</p>
          </div>
          <button type="button" onClick={() => setSelectedRole(blankRole())} className="cta-btn">Create New Role</button>
        </div>
        {message ? <p className="mt-4 rounded-2xl bg-[#eef8f5] p-3 text-sm font-bold text-[#0f8f7c]">{message}</p> : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-[28px] border border-[#deece9] bg-white p-5 shadow-[0_16px_36px_rgba(16,24,40,0.06)]">
          <h2 className="text-xl font-black text-[#102a2d]">Roles</h2>
          <div className="mt-4 space-y-3">
            {roles.map((role) => (
              <button key={role.id} type="button" onClick={() => selectRole(role)} className={`w-full rounded-2xl border p-4 text-left transition ${selectedRole.id === role.id ? "border-[#0f8f7c] bg-[#eef8f5]" : "border-[#deece9] bg-[#f7fbfa] hover:border-[#0f8f7c]"}`}>
                <span className="block font-black text-[#102a2d]">{role.display_name || role.role}</span>
                <span className="mt-1 block text-xs font-bold uppercase tracking-[0.12em] text-[#0f8f7c]">{role.role} {role.is_system ? "- System" : "- Custom"}</span>
                <span className="mt-2 block text-sm text-[#5a7273]">{rolePermissions(role).includes("*") ? "Full access" : `${rolePermissions(role).length} permissions`}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
          <div className="grid gap-3 md:grid-cols-2">
            <input className="form-field" value={selectedRole.display_name || ""} onChange={(event) => setSelectedRole({ ...selectedRole, display_name: event.target.value })} placeholder="Role display name" />
            <input className="form-field" value={selectedRole.role || ""} onChange={(event) => setSelectedRole({ ...selectedRole, role: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "_") })} placeholder="role_code" disabled={Boolean(selectedRole.id && selectedRole.is_system)} />
            <textarea className="form-field md:col-span-2" value={selectedRole.description || ""} onChange={(event) => setSelectedRole({ ...selectedRole, description: event.target.value })} placeholder="Role description" />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {catalog.map((group) => (
              <div key={group.group} className="rounded-2xl border border-[#deece9] bg-[#f7fbfa] p-4">
                <h3 className="font-black uppercase tracking-[0.14em] text-[#0f8f7c]">{group.group}</h3>
                <div className="mt-3 grid gap-2">
                  {group.permissions.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-bold text-[#102a2d]">
                      <input type="checkbox" checked={selectedRolePermissions.has("*") || selectedRolePermissions.has(key)} disabled={selectedRolePermissions.has("*") || !isSuperAdmin} onChange={(event) => setRolePermission(key, event.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={saveRole} className="cta-btn">Save Role</button>
            {selectedRole.id ? <button type="button" onClick={() => cloneRole(selectedRole)} className="secondary-btn">Clone Existing Role</button> : null}
            {selectedRole.id && !selectedRole.is_system ? <button type="button" onClick={() => deleteRole(selectedRole)} className="rounded-full border border-[#ffd6bf] px-6 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#f37021]">Delete Role</button> : null}
          </div>
        </section>
      </div>

      <section className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f8f7c]">User Creation Form</p>
            <h2 className="mt-2 text-2xl font-black text-[#102a2d]">Create admin user</h2>
            <p className="mt-2 text-sm text-[#5a7273]">Assign a default role, or enable custom permissions for this user from day one.</p>
          </div>
          <button type="button" onClick={createStaffUser} className="cta-btn">Create User</button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <input className="form-field" value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} placeholder="Name" />
          <input className="form-field" value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} placeholder="Email" type="email" />
          <input className="form-field" value={staffForm.mobile} onChange={(event) => setStaffForm({ ...staffForm, mobile: event.target.value })} placeholder="Mobile" />
          <input className="form-field" value={staffForm.password} onChange={(event) => setStaffForm({ ...staffForm, password: event.target.value })} placeholder="Password" type="password" />
          <select className="form-field" value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}>
            {roles.map((role) => <option key={role.role} value={role.role}>{role.display_name || role.role}</option>)}
          </select>
          <select className="form-field" value={staffForm.is_active ? "active" : "inactive"} onChange={(event) => setStaffForm({ ...staffForm, is_active: event.target.value === "active" })}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-2xl bg-[#eef8f5] p-4 font-bold text-[#102a2d]">
          <input type="checkbox" checked={staffForm.custom_permissions_enabled} disabled={!isSuperAdmin} onChange={(event) => setStaffForm({ ...staffForm, custom_permissions_enabled: event.target.checked })} />
          Enable Custom Permissions
        </label>

        {staffForm.custom_permissions_enabled ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {catalog.map((group) => (
              <div key={group.group} className="rounded-2xl border border-[#deece9] bg-[#f7fbfa] p-4">
                <h3 className="font-black uppercase tracking-[0.14em] text-[#0f8f7c]">{group.group}</h3>
                <div className="mt-3 grid gap-2">
                  {group.permissions.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-bold text-[#102a2d]">
                      <input type="checkbox" checked={staffSet.has(key)} disabled={!isSuperAdmin} onChange={(event) => setStaffPermission(key, event.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
          <h2 className="text-2xl font-black text-[#102a2d]">Assign users to role</h2>
          <p className="mt-2 text-sm text-[#5a7273]">Select one or more admin users and assign the currently selected role.</p>
          <input className="form-field mt-5" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search admin users" />
          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-2">
            {filteredUsers.map((user) => (
              <label key={user.id} className="flex items-start gap-3 rounded-2xl border border-[#deece9] bg-[#f7fbfa] p-4">
                <input type="checkbox" checked={selectedUsers.includes(user.id)} onChange={(event) => setSelectedUsers((current) => event.target.checked ? [...current, user.id] : current.filter((id) => id !== user.id))} />
                <span>
                  <span className="block font-black text-[#102a2d]">{user.name || user.email}</span>
                  <span className="text-sm text-[#5a7273]">{user.email} - {user.role} {user.custom_permissions_enabled ? "- Custom permissions" : ""}</span>
                </span>
              </label>
            ))}
          </div>
          <button type="button" onClick={assignUsersToRole} className="cta-btn mt-5">Assign Selected Users</button>
        </section>

        <section className="rounded-[28px] border border-[#deece9] bg-white p-6 shadow-[0_16px_36px_rgba(16,24,40,0.06)] md:p-8">
          <h2 className="text-2xl font-black text-[#102a2d]">Custom permission mode</h2>
          <p className="mt-2 text-sm text-[#5a7273]">Override role permissions for one user. Useful for examples like view/edit bookings without delete rights.</p>
          <select className="form-field mt-5" value={customUserId} onChange={(event) => { const user = users.find((item) => item.id === event.target.value); if (user) openCustomUser(user); else setCustomUserId(""); }}>
            <option value="">Select admin user</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name || user.email} - {user.role}</option>)}
          </select>
          <label className="mt-4 flex items-center gap-3 rounded-2xl bg-[#eef8f5] p-4 font-bold text-[#102a2d]">
            <input type="checkbox" checked={customMode} onChange={(event) => setCustomMode(event.target.checked)} />
            Enable Custom Permissions
          </label>
          <div className="mt-4 max-h-[420px] space-y-4 overflow-y-auto pr-2">
            {catalog.map((group) => (
              <div key={group.group} className="rounded-2xl border border-[#deece9] bg-[#f7fbfa] p-4">
                <h3 className="font-black uppercase tracking-[0.14em] text-[#0f8f7c]">{group.group}</h3>
                <div className="mt-3 grid gap-2">
                  {group.permissions.map(([key, label]) => (
                    <label key={key} className="flex items-center gap-3 rounded-xl bg-white p-3 text-sm font-bold text-[#102a2d]">
                      <input type="checkbox" checked={customSet.has(key)} disabled={!customMode || !isSuperAdmin} onChange={(event) => setCustomPermission(key, event.target.checked)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={saveCustomUser} className="cta-btn mt-5">Save Custom Permissions</button>
        </section>
      </div>
    </div>
  );
}
