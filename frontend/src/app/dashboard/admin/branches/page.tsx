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
  is_active: boolean;
  sort_order: number;
  admins: BranchAdmin[];
}

const EMPTY_FORM = { name: '', email: '', password: '' };

export default function AdminBranchesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const isAdmin = user?.roles?.some((r: string) => r === 'admin' || r === 'super_admin');

  useEffect(() => {
    if (user && !isAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isAdmin, router]);

  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErr, setFormErr] = useState('');
  const [created, setCreated] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ['admin-branches'],
    queryFn: () => api.get('/admin/branches').then(r => r.data),
    enabled: !!isAdmin,
  });

  const createAdmin = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) =>
      api.post(`/admin/branches/${selectedBranch!.id}/create-admin`, data).then(r => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin-branches'] });
      setCreated(data.admin);
      setForm(EMPTY_FORM);
      setFormErr('');
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = e.response?.data?.errors;
      setFormErr(errs ? Object.values(errs).flat().join(' ') : e.response?.data?.message || 'Failed to create admin.');
    },
  });

  function closeModal() {
    setSelectedBranch(null);
    setForm(EMPTY_FORM);
    setFormErr('');
    setCreated(null);
  }

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  if (!user || !isAdmin) return null;

  return (
    <DashboardLayout title="Branch Management">

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && branches.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏢</div>
          <p className="text-slate-500 text-sm font-medium">No branches found.</p>
          <p className="text-slate-400 text-xs mt-1">Add branches via the database or Filament admin panel.</p>
        </div>
      )}

      {!isLoading && branches.length > 0 && (
        <div className="space-y-3">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="font-bold text-slate-900">{branch.name}</h2>
                    {!branch.is_active && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">Inactive</span>
                    )}
                  </div>
                  {(branch.city || branch.country) && (
                    <p className="text-xs text-slate-500 mb-3">
                      📍 {[branch.city, branch.country].filter(Boolean).join(', ')}
                    </p>
                  )}

                  {/* Assigned admins */}
                  {branch.admins.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 inline-block">
                      ⚠️ No admin assigned yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {branch.admins.map(admin => (
                        <div key={admin.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold shrink-0">
                            {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{admin.name}</p>
                            <p className="text-xs text-slate-400 truncate">{admin.email}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {admin.plain_password && (
                              <button
                                onClick={() => copy(`Email: ${admin.email}\nPassword: ${admin.plain_password}`, `creds-${admin.id}`)}
                                className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                              >
                                {copiedField === `creds-${admin.id}` ? '✓ Copied' : '📋 Copy Creds'}
                              </button>
                            )}
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${admin.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {admin.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => { setSelectedBranch(branch); setCreated(null); setForm(EMPTY_FORM); setFormErr(''); }}
                  className="shrink-0 px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  + Create Admin
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Admin Modal */}
      {selectedBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-slate-900">Create Branch Admin</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                For: <span className="font-semibold text-slate-700">{selectedBranch.name}</span>
              </p>

              {created ? (
                /* ── Credentials handoff screen ── */
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-2xl">✅</div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">Admin account created!</p>
                      <p className="text-xs text-slate-500">Share these credentials with the branch admin.</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {[
                      { label: 'Name', value: created.name, field: 'name' },
                      { label: 'Email', value: created.email, field: 'email' },
                      { label: 'Password', value: created.password, field: 'pass' },
                    ].map(item => (
                      <div key={item.field} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{item.label}</p>
                          <p className="text-sm font-mono text-slate-800 truncate">{item.value}</p>
                        </div>
                        <button
                          onClick={() => copy(item.value, item.field)}
                          className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-green-300 hover:text-green-700 transition-colors"
                        >
                          {copiedField === item.field ? '✓' : 'Copy'}
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => copy(
                      `Branch Admin Credentials — ${selectedBranch.name}\n\nEmail: ${created.email}\nPassword: ${created.password}\n\nLogin at: ${window.location.origin}/auth/login`,
                      'all'
                    )}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors mb-2"
                  >
                    {copiedField === 'all' ? '✓ Copied all!' : '📋 Copy All Credentials'}
                  </button>

                  <p className="text-[11px] text-slate-400 text-center mb-4">
                    The password is also stored against the account for future reference.
                  </p>

                  <button onClick={closeModal} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                    Done
                  </button>
                </div>
              ) : (
                /* ── Create form ── */
                <>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                    This creates a login account with <strong>Branch Admin</strong> access. The plain-text password is stored so you can share it later.
                  </div>

                  {formErr && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {formErr}</div>
                  )}

                  <form
                    onSubmit={e => { e.preventDefault(); setFormErr(''); createAdmin.mutate(form); }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name <span className="text-red-400">*</span></label>
                      <input
                        type="text" required
                        placeholder="e.g. Rahim Uddin"
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Email Address <span className="text-red-400">*</span></label>
                      <input
                        type="email" required
                        placeholder="admin@branch.com"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Password <span className="text-slate-400 font-normal">(leave blank to auto-generate)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Min 6 characters, or leave blank"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">If left blank, a secure password is generated automatically.</p>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={createAdmin.isPending}
                        className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        {createAdmin.isPending ? 'Creating…' : 'Create & Get Credentials'}
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
