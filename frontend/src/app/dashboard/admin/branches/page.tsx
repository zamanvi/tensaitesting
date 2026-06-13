'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BranchAdmin {
  id: number;
  name: string;
  email: string;
  status: string;
  plain_password: string | null;
  created_at: string;
}

interface Branch {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  is_active: boolean;
  sort_order: number;
  admins: BranchAdmin[];
}

const EMPTY_CREATE = { branch_name: '', manager_name: '', password: '', phone: '', whatsapp: '' };
const EMPTY_EDIT   = { branch_name: '', manager_name: '', username: '', password: '', phone: '', whatsapp: '' };

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

export default function AdminBranchesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const isAdmin = user?.roles?.some((r: string) => r === 'admin' || r === 'super_admin');

  useEffect(() => {
    if (user && !isAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAdmin, router]);

  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createErr, setCreateErr]   = useState('');
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [editForm, setEditForm]     = useState(EMPTY_EDIT);
  const [editErr, setEditErr]       = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassFor, setShowPassFor] = useState<number | null>(null);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ['admin-branches'],
    queryFn: () => api.get('/admin/branches').then(r => r.data),
    enabled: !!isAdmin,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_CREATE) => api.post('/admin/branches', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      setCreateForm(EMPTY_CREATE);
      setCreateErr('');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = e.response?.data?.errors;
      setCreateErr(errs ? Object.values(errs).flat().join(' ') : e.response?.data?.message || 'Failed to create branch.');
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: typeof EMPTY_EDIT) => api.patch(`/admin/branches/${editBranch!.id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      setEditBranch(null);
      setEditErr('');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = e.response?.data?.errors;
      setEditErr(errs ? Object.values(errs).flat().join(' ') : e.response?.data?.message || 'Failed to update.');
    },
  });

  function openEdit(branch: Branch) {
    const admin = branch.admins[0] ?? null;
    setEditForm({
      branch_name:  branch.name,
      manager_name: admin?.name ?? '',
      username:     admin?.email ?? '',
      password:     '',
      phone:        branch.phone ?? '',
      whatsapp:     branch.whatsapp ?? '',
    });
    setEditErr('');
    setEditBranch(branch);
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/auth/login` : '/auth/login';

  if (!user || !isAdmin) return null;

  return (
    <DashboardLayout title="Branch Management">

      {/* ── Branches table ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 text-sm">All Branches</h2>
            <p className="text-xs text-slate-400 mt-0.5">Click Edit to change any branch or admin details.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2.5 py-1 rounded-full">
            {branches.length} {branches.length === 1 ? 'branch' : 'branches'}
          </span>
        </div>

        {isLoading ? (
          <div className="divide-y divide-slate-50">
            {[1, 2, 3].map(i => (
              <div key={i} className="px-5 py-4 flex gap-4 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-32" />
                <div className="h-4 bg-slate-100 rounded w-28" />
                <div className="h-4 bg-slate-100 rounded w-40" />
                <div className="h-4 bg-slate-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">🏢</div>
            <p className="text-slate-400 text-sm">No branches yet. Add one below.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <th className="text-left px-5 py-3">Branch</th>
                  <th className="text-left px-4 py-3">Manager</th>
                  <th className="text-left px-4 py-3">Username</th>
                  <th className="text-left px-4 py-3">Password</th>
                  <th className="text-left px-4 py-3">Phone</th>
                  <th className="text-left px-4 py-3">WhatsApp</th>
                  <th className="text-left px-4 py-3">Access Link</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {branches.map(branch => {
                  const admin = branch.admins[0] ?? null;
                  return (
                    <tr key={branch.id} className="hover:bg-slate-50 transition-colors">

                      {/* Branch name */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">
                            {branch.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-xs leading-tight">{branch.name}</p>
                            {!branch.is_active && (
                              <span className="text-[10px] text-slate-400">Inactive</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Manager */}
                      <td className="px-4 py-3">
                        {admin
                          ? <span className="text-slate-700 text-xs font-medium">{admin.name}</span>
                          : <span className="text-amber-600 text-xs bg-amber-50 px-2 py-0.5 rounded-full">⚠ No admin</span>}
                      </td>

                      {/* Username */}
                      <td className="px-4 py-3">
                        {admin ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-500 text-xs font-mono truncate max-w-[140px]">{admin.email}</span>
                            <button onClick={() => copy(admin.email, `email-${admin.id}`)} className="text-slate-300 hover:text-slate-500 shrink-0">
                              {copiedField === `email-${admin.id}` ? '✓' : '📋'}
                            </button>
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>

                      {/* Password */}
                      <td className="px-4 py-3">
                        {admin?.plain_password ? (
                          <div className="flex items-center gap-1">
                            <span className="text-slate-700 text-xs font-mono bg-slate-100 px-2 py-0.5 rounded">
                              {showPassFor === admin.id ? admin.plain_password : '••••••••'}
                            </span>
                            <button onClick={() => setShowPassFor(showPassFor === admin.id ? null : admin.id)} className="text-slate-300 hover:text-slate-500 text-[10px]">
                              {showPassFor === admin.id ? '🙈' : '👁'}
                            </button>
                            <button onClick={() => copy(admin.plain_password!, `pass-${admin.id}`)} className="text-slate-300 hover:text-slate-500">
                              {copiedField === `pass-${admin.id}` ? '✓' : '📋'}
                            </button>
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3 text-xs text-slate-500">{branch.phone || <span className="text-slate-300">—</span>}</td>

                      {/* WhatsApp */}
                      <td className="px-4 py-3 text-xs text-slate-500">{branch.whatsapp || <span className="text-slate-300">—</span>}</td>

                      {/* Access link */}
                      <td className="px-4 py-3">
                        {admin ? (
                          <div className="flex items-center gap-1">
                            <a href={loginUrl} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-green-700 hover:underline">🔗 Login</a>
                            <button onClick={() => copy(loginUrl, `link-${branch.id}`)} className="text-slate-300 hover:text-slate-500">
                              {copiedField === `link-${branch.id}` ? '✓' : '📋'}
                            </button>
                          </div>
                        ) : <span className="text-slate-300 text-xs">—</span>}
                      </td>

                      {/* Edit action */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openEdit(branch)}
                          className="text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add New Branch ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h2 className="font-bold text-slate-900 text-sm mb-1">Add New Branch</h2>
        <p className="text-xs text-slate-400 mb-4">Creates the branch and manager account in one step. Login username is auto-generated from the branch name.</p>

        {createErr && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {createErr}</div>
        )}

        <form
          onSubmit={e => { e.preventDefault(); setCreateErr(''); createMutation.mutate(createForm); }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Branch Name <span className="text-red-400">*</span></label>
            <input className={inputCls} required placeholder="e.g. Dhaka" value={createForm.branch_name}
              onChange={e => setCreateForm(f => ({ ...f, branch_name: e.target.value }))} />
            <p className="text-[11px] text-slate-400 mt-1">Username auto: <span className="font-mono">{createForm.branch_name ? `${createForm.branch_name.toLowerCase().replace(/\s+/g, '-')}@branch.tensai.jp` : 'dhaka@branch.tensai.jp'}</span></p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Manager Name <span className="text-red-400">*</span></label>
            <input className={inputCls} required placeholder="e.g. Rahim Uddin" value={createForm.manager_name}
              onChange={e => setCreateForm(f => ({ ...f, manager_name: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Password <span className="text-red-400">*</span></label>
            <input className={`${inputCls} font-mono`} required placeholder="Min 6 characters" value={createForm.password}
              onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className={inputCls} placeholder="+880 1XXX XXXXXX" value={createForm.phone}
              onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">WhatsApp <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className={inputCls} placeholder="8801XXXXXXXXX" value={createForm.whatsapp}
              onChange={e => setCreateForm(f => ({ ...f, whatsapp: e.target.value }))} />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating…' : '+ Create Branch'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Edit Modal ── */}
      {editBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-900">Edit Branch</h3>
                <button onClick={() => setEditBranch(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>
              <p className="text-xs text-slate-400 mb-5">Leave password blank to keep existing. Username change takes effect on next login.</p>

              {editErr && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {editErr}</div>
              )}

              <form onSubmit={e => { e.preventDefault(); setEditErr(''); editMutation.mutate(editForm); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Branch Name <span className="text-red-400">*</span></label>
                    <input className={inputCls} required value={editForm.branch_name}
                      onChange={e => setEditForm(f => ({ ...f, branch_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Manager Name</label>
                    <input className={inputCls} placeholder="Keep existing" value={editForm.manager_name}
                      onChange={e => setEditForm(f => ({ ...f, manager_name: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Username</label>
                    <input className={`${inputCls} font-mono`} type="email" placeholder="Keep existing" value={editForm.username}
                      onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">New Password</label>
                    <input className={`${inputCls} font-mono`} placeholder="Leave blank to keep" value={editForm.password}
                      onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                    <input className={inputCls} placeholder="+880 1XXX XXXXXX" value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">WhatsApp</label>
                    <input className={inputCls} placeholder="8801XXXXXXXXX" value={editForm.whatsapp}
                      onChange={e => setEditForm(f => ({ ...f, whatsapp: e.target.value }))} />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={editMutation.isPending}
                    className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
                    {editMutation.isPending ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => setEditBranch(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
