'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Lead { id: number; status: string; is_published: boolean }

const EMPTY_FORM = {
  student_name: '', student_email: '', student_phone: '',
  target_country: '', target_course: '', target_intake: '',
};

export default function AgencyDashboard() {
  const { t } = useLang();
  const a = t.agencyDash;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const router = useRouter();
  const isAgency = user?.gateway_type === 'agency';

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  const [vaultQ, poolQ] = useQueries({
    queries: [
      { queryKey: ['agency-vault'], queryFn: () => api.get('/agency/leads/private-vault').then(r => r.data), staleTime: 30_000, enabled: isAgency },
      { queryKey: ['open-pool'], queryFn: () => api.get('/agency/leads/open-pool').then(r => r.data), staleTime: 30_000, enabled: isAgency },
    ],
  });

  if (!isAgency) { router.replace(`/dashboard/${user?.gateway_type ?? ''}`); return null; }

  const vaultLeads: Lead[] = Array.isArray(vaultQ.data?.data) ? vaultQ.data.data : Array.isArray(vaultQ.data) ? vaultQ.data : [];
  const poolLeads: Lead[] = Array.isArray(poolQ.data?.data) ? poolQ.data.data : Array.isArray(poolQ.data) ? poolQ.data : [];
  const activeCount = vaultLeads.filter(l => !['closed', 'enrolled'].includes(l.status)).length;
  const loading = vaultQ.isLoading || poolQ.isLoading;

  const addLead = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) => api.post('/agency/leads', data),
    onSuccess: () => {
      setSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['agency-vault'] });
      setTimeout(() => {
        setShowModal(false);
        setForm(EMPTY_FORM);
        setFormError('');
        setSuccess(false);
      }, 2000);
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = e.response?.data?.errors;
      setFormError(errs ? Object.values(errs).flat().join(' ') : e.response?.data?.message || 'Failed to create lead.');
    },
  });

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError('');
    addLead.mutate(form);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm(EMPTY_FORM);
    setFormError('');
    setSuccess(false);
  };

  const STATS = [
    { label: a.privateVault, value: loading ? '…' : String(vaultLeads.length), icon: '🔒', href: '/dashboard/agency/vault' },
    { label: a.openPool, value: loading ? '…' : String(poolLeads.length), icon: '🌐', href: '/dashboard/agency/pool' },
    { label: a.activeLeads, value: loading ? '…' : String(activeCount), icon: '👥', href: '/dashboard/agency/vault' },
    { label: a.commissionsDue, value: '৳0', icon: '💰', href: '#' },
  ];

  const B2B_ITEMS = [
    { title: a.publishTitle, desc: a.publishDesc },
    { title: a.forwardTitle, desc: a.forwardDesc },
    { title: a.referralTitle, desc: a.referralDesc },
  ];

  return (
    <DashboardLayout>
      {/* Header row with Add Lead CTA */}
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <div />
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {a.addLeadBtn}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {STATS.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-green-200 transition-all">
            <div className="text-xl mb-2">{s.icon}</div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-1 leading-tight">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-5 sm:mb-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">🔒 {a.privateVault}</h2>
            <Link href="/dashboard/agency/vault" className="text-xs text-green-700 hover:underline">{t.common.viewAll}</Link>
          </div>
          <p className="text-sm text-slate-500 mb-4">{a.vaultDesc}</p>
          <div className="text-center py-6 text-slate-300 text-sm">{a.vaultEmpty}</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-slate-900">🌐 {a.openPool}</h2>
            <Link href="/dashboard/agency/pool" className="text-xs text-green-700 hover:underline">{t.common.browse}</Link>
          </div>
          <p className="text-sm text-slate-500 mb-4">{a.poolDesc}</p>
          <div className="text-center py-6 text-slate-300 text-sm">{a.poolEmpty}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
        <h2 className="font-bold text-slate-900 mb-1">🤝 {a.b2bTitle}</h2>
        <p className="text-sm text-slate-500 mb-4">{a.b2bDesc}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {B2B_ITEMS.map((item) => (
            <div key={item.title} className="p-3 sm:p-4 bg-slate-50 rounded-xl text-sm">
              <div className="font-semibold text-slate-700 mb-1">{item.title}</div>
              <div className="text-slate-500 text-xs">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-slate-900 text-base">{a.addLeadTitle}</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">✅</div>
                  <div className="font-semibold text-green-700 text-sm">{a.addLeadSuccess}</div>
                </div>
              ) : (
                <>
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                    {a.addLeadNote}
                  </div>

                  {formError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{formError}</div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="text" required
                      placeholder={a.addLeadStudentName}
                      value={form.student_name}
                      onChange={e => setForm(f => ({ ...f, student_name: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="email" required
                      placeholder={a.addLeadStudentEmail}
                      value={form.student_email}
                      onChange={e => setForm(f => ({ ...f, student_email: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="tel"
                      placeholder={a.addLeadStudentPhone}
                      value={form.student_phone}
                      onChange={e => setForm(f => ({ ...f, student_phone: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text" required
                      placeholder={a.addLeadCountry}
                      value={form.target_country}
                      onChange={e => setForm(f => ({ ...f, target_country: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                      type="text"
                      placeholder={a.addLeadCourse}
                      value={form.target_course}
                      onChange={e => setForm(f => ({ ...f, target_course: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">{a.addLeadIntake}</label>
                      <input
                        type="date"
                        value={form.target_intake}
                        onChange={e => setForm(f => ({ ...f, target_intake: e.target.value }))}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="submit"
                        disabled={addLead.isPending}
                        className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {addLead.isPending ? '…' : a.addLeadSubmit}
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                      >
                        {t.common.cancel}
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
