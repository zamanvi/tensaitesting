'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Lang = 'en' | 'ja' | 'bn';

interface FundTransfer {
  id: number;
  amount: string;
  currency: string;
  status: 'pending' | 'received';
  bank_reference: string | null;
  created_at: string;
  received_at: string | null;
}

interface FundTransfersResponse {
  payable_balance: number;
  transfers: FundTransfer[];
}

export default function BranchSettlementPage() {
  const { user } = useAuthStore();
  const { lang } = useLang();
  const router = useRouter();
  const qc = useQueryClient();
  const L: Lang = lang === 'ja' ? 'ja' : lang === 'bn' ? 'bn' : 'en';
  const t = (en: string, ja: string, bn: string) => L === 'ja' ? ja : L === 'bn' ? bn : en;

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [amount, setAmount]     = useState('');
  const [bankRef, setBankRef]   = useState('');
  const [notes, setNotes]       = useState('');
  const [formError, setFormError] = useState('');

  const queryKey = ['fund-transfers'];
  const { data, isLoading } = useQuery<FundTransfersResponse>({
    queryKey,
    queryFn: () => api.get('/branch-admin/fund-transfers').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const submitTransfer = useMutation({
    mutationFn: () => api.post('/branch-admin/fund-transfers', {
      amount, bank_reference: bankRef || undefined, notes: notes || undefined,
    }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      setAmount(''); setBankRef(''); setNotes(''); setFormError('');
    },
    onError: () => setFormError(t('Something went wrong. Please try again.', '問題が発生しました。もう一度お試しください。', 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।')),
  });

  if (!user || !isBranchAdmin) return null;

  const balance = data?.payable_balance ?? 0;
  const transfers = data?.transfers ?? [];

  return (
    <BranchLayout title={t('Settlement', '精算', 'সেটেলমেন্ট')}>
      <div className="max-w-3xl space-y-6">

        {/* ── Balance card ── */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">
            {t('Owed to Head Office', '本部への未払い残高', 'হেড অফিসের পাওনা')}
          </p>
          {isLoading ? (
            <div className="h-9 w-32 bg-indigo-100 rounded animate-pulse" />
          ) : (
            <p className="text-3xl font-black text-slate-900 tabular-nums">{balance.toLocaleString()} <span className="text-base font-bold text-slate-500">BDT</span></p>
          )}
          <p className="text-xs text-indigo-500 mt-2">
            {t('Collected on behalf of head office, minus what you\'ve already sent.', '本部の代わりに徴収した額から、すでに送金した額を差し引いたもの。', 'হেড অফিসের পক্ষে সংগ্রহ করা টাকা, বাদ দিয়ে যা ইতিমধ্যে পাঠানো হয়েছে।')}
          </p>
        </div>

        {/* ── Transfer entry ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <h3 className="font-black text-slate-900 text-sm mb-1">{t('Log a Fund Transfer', '送金を記録', 'ফান্ড ট্রান্সফার এন্ট্রি')}</h3>
          <p className="text-xs text-slate-400 mb-5">
            {t('Record this after you\'ve sent money to head office\'s bank account. They\'ll mark it received on their end.', '本部の銀行口座に送金した後に記録してください。本部側で受領確認が行われます。', 'হেড অফিসের ব্যাংক অ্যাকাউন্টে টাকা পাঠানোর পর এখানে এন্ট্রি দিন — হেড অফিস তাদের পাশ থেকে রিসিভড মার্ক করবে।')}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('Amount (BDT)', '金額 (BDT)', 'পরিমাণ (BDT)')}</label>
              <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('Bank Reference', '銀行参照番号', 'ব্যাংক রেফারেন্স')}</label>
              <input type="text" value={bankRef} onChange={e => setBankRef(e.target.value)}
                placeholder={t('Transaction / slip no.', '取引・伝票番号', 'ট্রানজেকশন/স্লিপ নম্বর')}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('Notes (optional)', 'メモ（任意）', 'নোট (ঐচ্ছিক)')}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all resize-none" />
            </div>
          </div>

          {formError && <p className="text-xs text-rose-600 mt-4">{formError}</p>}

          <div className="mt-5 flex justify-end">
            <button
              onClick={() => submitTransfer.mutate()}
              disabled={!(Number(amount) > 0) || submitTransfer.isPending}
              className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-sm shadow-md shadow-green-700/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitTransfer.isPending
                ? t('Saving…', '保存中…', 'সেভ হচ্ছে…')
                : t('Log Transfer', '送金を記録', 'ট্রান্সফার লগ করুন')}
            </button>
          </div>
        </div>

        {/* ── History ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-sm">{t('Transfer History', '送金履歴', 'ট্রান্সফার হিস্ট্রি')}</h3>
          </div>
          {isLoading ? (
            <div className="py-16 flex justify-center"><span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" /></div>
          ) : transfers.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm font-bold text-slate-500">{t('No transfers yet', 'まだ送金がありません', 'এখনো কোনো ট্রান্সফার নেই')}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {transfers.map(tr => (
                <div key={tr.id} className="px-5 sm:px-6 py-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800 tabular-nums">{tr.amount} {tr.currency}</p>
                    <p className="text-[11px] text-slate-400">{tr.bank_reference || '—'}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    tr.status === 'received' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {tr.status === 'received'
                      ? t('Received', '受領済み', 'রিসিভড')
                      : t('Pending', '保留中', 'পেন্ডিং')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BranchLayout>
  );
}
