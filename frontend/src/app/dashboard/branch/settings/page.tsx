'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BranchSettings {
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  google_maps_url: string | null;
  working_hours: Record<string, string> | null;
  social_links: Record<string, string> | null;
}

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

export default function BranchSettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [form, setForm] = useState({ address: '', phone: '', whatsapp: '', google_maps_url: '' });
  const [workingHours, setWorkingHours] = useState<Record<string, string>>({});
  const [socialLinks, setSocialLinks]   = useState<Record<string, string>>({});
  const [saved, setSaved]   = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const { data: settings, isLoading } = useQuery<BranchSettings>({
    queryKey: ['branch-settings'],
    queryFn: () => api.get('/branch-admin/settings').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        address:         settings.address         ?? '',
        phone:           settings.phone           ?? '',
        whatsapp:        settings.whatsapp        ?? '',
        google_maps_url: settings.google_maps_url ?? '',
      });
      setWorkingHours(settings.working_hours ?? { 'Mon – Fri': '9:00 AM – 6:00 PM', Saturday: '10:00 AM – 2:00 PM', Sunday: 'Closed' });
      setSocialLinks(settings.social_links ?? {});
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: () => api.patch('/branch-admin/settings', { ...form, working_hours: workingHours, social_links: socialLinks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-settings'] });
      qc.invalidateQueries({ queryKey: ['my-branch'] });
      setSaved(true); setSaveErr('');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setSaveErr(err.response?.data?.message ?? 'Failed to save settings.');
    },
  });

  function updateHourKey(old: string, nw: string) {
    setWorkingHours(p => { const n: Record<string,string> = {}; for (const [k,v] of Object.entries(p)) n[k===old?nw:k]=v; return n; });
  }
  function updateHourVal(key: string, val: string) { setWorkingHours(p => ({ ...p, [key]: val })); }
  function addHourRow()  { setWorkingHours(p => ({ ...p, '': '' })); }
  function removeHourRow(key: string) { setWorkingHours(p => { const n={...p}; delete n[key]; return n; }); }

  function updateSocialKey(old: string, nw: string) {
    setSocialLinks(p => { const n: Record<string,string> = {}; for (const [k,v] of Object.entries(p)) n[k===old?nw:k]=v; return n; });
  }
  function updateSocialVal(key: string, val: string) { setSocialLinks(p => ({ ...p, [key]: val })); }
  function addSocialRow()  { setSocialLinks(p => ({ ...p, '': '' })); }
  function removeSocialRow(key: string) { setSocialLinks(p => { const n={...p}; delete n[key]; return n; }); }

  if (!user || !isBranchAdmin) return null;

  return (
    <BranchLayout title="Settings">
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-sm">Loading…</div>
      ) : (
        <>
        {/* Page header */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-[0.12em] mb-1.5">Branch Portal</p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-500 mt-1.5">Manage your branch contact info, working hours and social links</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="max-w-2xl space-y-5">

          {saved && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-900 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Settings saved successfully
            </div>
          )}
          {saveErr && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {saveErr}
            </div>
          )}

          {/* Contact */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-[0.08em]">Contact</h2>
              <p className="text-xs text-slate-400 mt-1">Your branch&apos;s public-facing contact information</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Address</label>
                <textarea className={`${inp} resize-none`} rows={2}
                  value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Branch office address" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone</label>
                  <input className={inp} placeholder="+880 1XXX XXXXXX"
                    value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">WhatsApp</label>
                  <input className={inp} placeholder="8801XXXXXXXXX"
                    value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Google Maps URL</label>
                <input className={inp} type="url" placeholder="https://maps.google.com/…"
                  value={form.google_maps_url} onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-[0.08em]">Working Hours</h2>
                <p className="text-xs text-slate-400 mt-1">Days and hours your branch is open</p>
              </div>
              <button type="button" onClick={addHourRow}
                className="text-xs font-semibold text-green-700 hover:text-green-800 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                + Add row
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="flex gap-2 items-center">
                  <input className={`${inp} flex-1`} value={day} placeholder="Day"
                    onChange={e => updateHourKey(day, e.target.value)} />
                  <input className={`${inp} flex-1`} value={hours} placeholder="Hours"
                    onChange={e => updateHourVal(day, e.target.value)} />
                  <button type="button" onClick={() => removeHourRow(day)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 text-lg">×</button>
                </div>
              ))}
              {Object.keys(workingHours).length === 0 && (
                <p className="text-xs text-slate-500 py-1">No hours set. Click + Add row.</p>
              )}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-[0.08em]">Social Links</h2>
                <p className="text-xs text-slate-400 mt-1">Facebook, Instagram, LinkedIn, etc.</p>
              </div>
              <button type="button" onClick={addSocialRow}
                className="text-xs font-semibold text-green-700 hover:text-green-800 px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors">
                + Add link
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(socialLinks).map(([platform, url]) => (
                <div key={platform} className="flex gap-2 items-center">
                  <input className={`${inp} w-32 shrink-0`} value={platform} placeholder="Platform"
                    onChange={e => updateSocialKey(platform, e.target.value)} />
                  <input className={`${inp} flex-1`} value={url} placeholder="https://…"
                    onChange={e => updateSocialVal(platform, e.target.value)} />
                  <button type="button" onClick={() => removeSocialRow(platform)}
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 text-lg">×</button>
                </div>
              ))}
              {Object.keys(socialLinks).length === 0 && (
                <p className="text-xs text-slate-500 py-1">No social links yet. Click + Add link.</p>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={save.isPending}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm hover:shadow-md">
              {save.isPending ? 'Saving…' : 'Save Settings'}
            </button>
          </div>

        </form>
        </>
      )}
    </BranchLayout>
  );
}
