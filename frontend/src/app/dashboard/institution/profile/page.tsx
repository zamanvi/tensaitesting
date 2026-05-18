'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface InstitutionProfile {
  institution_name: string | null;
  institution_name_local: string | null;
  institution_type: string | null;
  country: string | null;
  city: string | null;
  address: string | null;
  website: string | null;
  description: string | null;
  tuition_fee_min: number | null;
  tuition_fee_max: number | null;
  currency: string | null;
  status: string;
}

const EMPTY: Partial<InstitutionProfile> = {
  institution_name: '', institution_name_local: '', institution_type: '',
  country: '', city: '', address: '', website: '', description: '',
  tuition_fee_min: undefined, tuition_fee_max: undefined, currency: 'JPY',
};

export default function InstitutionProfilePage() {
  const { t } = useLang();
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['institution-profile'],
    queryFn: () => api.get('/institution/profile').then(r => r.data),
  });

  useEffect(() => {
    if (data?.profile) setForm(data.profile);
  }, [data]);

  const save = useMutation({
    mutationFn: (payload: typeof form) => api.put('/institution/profile', payload),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['institution-profile'] });
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const f = (field: keyof typeof form, val: string | number) =>
    setForm(p => ({ ...p, [field]: val }));

  if (isLoading) return <DashboardLayout><div className="text-center py-16 text-slate-400">{t.common.loading}</div></DashboardLayout>;

  return (
    <DashboardLayout title={t.nav.institutionProfile}>
      {saved && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
          Profile saved successfully.
        </div>
      )}

      <div className="space-y-5">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <h2 className="font-bold text-slate-900 mb-4">Institution Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Institution Name (English)</label>
              <input value={form.institution_name ?? ''} onChange={e => f('institution_name', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Institution Name (Local)</label>
              <input value={form.institution_name_local ?? ''} onChange={e => f('institution_name_local', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Institution Type</label>
              <select value={form.institution_type ?? ''} onChange={e => f('institution_type', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="">— Select —</option>
                <option value="university">University</option>
                <option value="college">College</option>
                <option value="language_school">Language School</option>
                <option value="vocational">Vocational School</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Country</label>
              <input value={form.country ?? ''} onChange={e => f('country', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">City</label>
              <input value={form.city ?? ''} onChange={e => f('city', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Website</label>
              <input type="url" value={form.website ?? ''} onChange={e => f('website', e.target.value)}
                placeholder="https://"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
              <input value={form.address ?? ''} onChange={e => f('address', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Description</label>
              <textarea rows={3} value={form.description ?? ''} onChange={e => f('description', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
            </div>
          </div>
        </div>

        {/* Fees */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <h2 className="font-bold text-slate-900 mb-4">Tuition Fees</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Min Fee</label>
              <input type="number" min="0" value={form.tuition_fee_min ?? ''} onChange={e => f('tuition_fee_min', Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Max Fee</label>
              <input type="number" min="0" value={form.tuition_fee_max ?? ''} onChange={e => f('tuition_fee_max', Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Currency</label>
              <select value={form.currency ?? 'JPY'} onChange={e => f('currency', e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                <option value="JPY">JPY</option>
                <option value="USD">USD</option>
                <option value="BDT">BDT</option>
                <option value="KRW">KRW</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={() => save.mutate(form)}
          disabled={save.isPending}
          className="w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          {save.isPending ? 'Saving…' : 'Save Profile'}
        </button>
      </div>
    </DashboardLayout>
  );
}
