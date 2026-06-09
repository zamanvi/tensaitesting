'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { STATUS_COLORS } from '@/lib/constants';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  target_country: string;
  target_course: string | null;
  is_published: boolean;
  forwarded_from_agency_id: number | null;
  referral_fee: number | null;
  student: { name: string };
  forwarded_from_agency?: { id: number; name: string } | null;
}

interface Agency {
  id: number;
  name: string;
}

export default function PrivateVault() {
  const queryClient = useQueryClient();
  const { t, lang } = useLang();
  const av = t.agencyVault;
  const statuses = t.statuses;
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const { user } = useAuthStore();
  const router = useRouter();
  const isAgency = user?.gateway_type === 'agency';

  const [forwardingLead, setForwardingLead] = useState<Lead | null>(null);
  const [targetAgencyId, setTargetAgencyId] = useState('');
  const [referralFee, setReferralFee] = useState('');
  const [forwardSuccess, setForwardSuccess] = useState(false);

  if (!isAgency) { router.replace(`/dashboard/${user?.gateway_type ?? ''}`); return null; }

  const { data, isLoading } = useQuery({
    queryKey: ['agency-vault'],
    queryFn: () => api.get('/agency/leads/private-vault').then((r) => r.data),
  });

  const { data: partnersData } = useQuery({
    queryKey: ['agency-partners'],
    queryFn: () => api.get('/agency/partners').then((r) => r.data),
    enabled: forwardingLead !== null,
  });

  const publish = useMutation({
    mutationFn: (leadId: number) => api.post(`/agency/leads/${leadId}/publish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agency-vault'] }),
  });

  const forward = useMutation({
    mutationFn: ({ leadId, target_agency_id, referral_fee }: { leadId: number; target_agency_id: number; referral_fee: number | null }) =>
      api.post(`/agency/leads/${leadId}/forward`, { target_agency_id, referral_fee }),
    onSuccess: () => {
      setForwardSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['agency-vault'] });
      setTimeout(() => {
        setForwardingLead(null);
        setTargetAgencyId('');
        setReferralFee('');
        setForwardSuccess(false);
      }, 1500);
    },
  });

  const leads: Lead[] = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const partners: Agency[] = Array.isArray(partnersData) ? partnersData : [];

  const openModal = (lead: Lead) => {
    setForwardingLead(lead);
    setTargetAgencyId('');
    setReferralFee('');
    setForwardSuccess(false);
  };

  const closeModal = () => {
    setForwardingLead(null);
    setTargetAgencyId('');
    setReferralFee('');
    setForwardSuccess(false);
  };

  const handleForwardSubmit = () => {
    if (!forwardingLead || !targetAgencyId) return;
    forward.mutate({
      leadId: forwardingLead.id,
      target_agency_id: Number(targetAgencyId),
      referral_fee: referralFee ? Number(referralFee) : null,
    });
  };

  return (
    <DashboardLayout title={av.title}>
      <div className="mb-4 p-3 sm:p-4 bg-green-50 border border-green-100 rounded-xl text-sm text-green-800">
        🔒 {av.banner}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-slate-400">{t.common.loading}</div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 sm:p-16 text-center text-slate-400">
          <div className="text-4xl mb-3">🔒</div>
          <div className="font-medium text-slate-600">{av.emptyTitle}</div>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const isForwardedToMe = !!lead.forwarded_from_agency_id;
            return (
              <div key={lead.id} className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs text-slate-400">{lead.lead_code}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status] ?? 'bg-slate-100 text-slate-600'}`}>
                    {statuses[lead.status as keyof typeof statuses] ?? lead.status.replace(/_/g, ' ')}
                  </span>
                  {lead.is_published && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{av.published}</span>
                  )}
                  {isForwardedToMe && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {av.forwarded}
                    </span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {lead.student?.name}{lead.target_country ? ` — ${lead.target_country}` : ''}
                      {lead.target_course ? ` (${lead.target_course})` : ''}
                    </div>
                    {isForwardedToMe && lead.forwarded_from_agency && (
                      <div className="text-xs text-purple-600 mt-0.5">
                        {av.forwardedBy}: {lead.forwarded_from_agency.name}
                        {lead.referral_fee ? ` · ${lead.referral_fee} BDT` : ''}
                      </div>
                    )}
                  </div>
                  {!isForwardedToMe && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => openModal(lead)}
                        className="px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-semibold transition-colors"
                      >
                        {av.forwardBtn}
                      </button>
                      {lead.is_published ? (
                        <span className="px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          🏫 {ja ? '公開済み' : bn ? 'প্রকাশিত' : 'Visible to Institutions'}
                        </span>
                      ) : (
                        <button
                          onClick={() => publish.mutate(lead.id)}
                          disabled={publish.isPending}
                          className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-slate-100 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                          {publish.isPending && publish.variables === lead.id ? '…' : (ja ? '学校に公開する' : bn ? 'প্রতিষ্ঠানে প্রকাশ করুন' : '🏫 Publish to Institutions')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Forward Modal */}
      {forwardingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold text-slate-900 text-base mb-4">{av.forwardModalTitle}</h3>

            {/* Lead summary */}
            <div className="bg-slate-50 rounded-xl p-3 mb-4 text-sm">
              <div className="font-mono text-xs text-slate-400 mb-0.5">{forwardingLead.lead_code}</div>
              <div className="font-semibold text-slate-800">{forwardingLead.student?.name}</div>
              {forwardingLead.target_country && (
                <div className="text-xs text-slate-500 mt-0.5">{forwardingLead.target_country}{forwardingLead.target_course ? ` · ${forwardingLead.target_course}` : ''}</div>
              )}
            </div>

            {forwardSuccess ? (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">✅</div>
                <div className="font-semibold text-green-700">{av.forwardSuccess}</div>
              </div>
            ) : (
              <>
                <div className="mb-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{av.forwardAgencyLabel}</label>
                  {partners.length === 0 ? (
                    <div className="text-sm text-slate-400 py-2">{av.noPartners}</div>
                  ) : (
                    <select
                      value={targetAgencyId}
                      onChange={(e) => setTargetAgencyId(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    >
                      <option value="">— {av.forwardAgencyLabel} —</option>
                      {partners.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="mb-5">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">{av.forwardFeeLabel}</label>
                  <input
                    type="number"
                    min="0"
                    value={referralFee}
                    onChange={(e) => setReferralFee(e.target.value)}
                    placeholder={av.forwardFeePlaceholder}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleForwardSubmit}
                    disabled={!targetAgencyId || forward.isPending}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                  >
                    {forward.isPending ? '…' : av.forwardSubmit}
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                  >
                    {t.common.cancel}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
