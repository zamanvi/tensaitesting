'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

type Lang = 'en' | 'ja' | 'bn';

interface PaymentCategory {
  id: number;
  key: string;
  label: string;
  fund_target: 'branch' | 'head_office';
}

interface ApplicationOption {
  id: number;
  application_code: string;
  student_name: string;
  student_email: string;
  student_phone: string;
}

interface Payment {
  id: number;
  receipt_no: string;
  amount: string;
  total_amount: string;
  due_amount: string;
  status: 'due' | 'partial' | 'paid';
  currency: string;
  method: 'cash' | 'bank';
  customer_name: string;
  fund_target: 'branch' | 'head_office';
  created_at: string;
  category: { id: number; label: string } | null;
  application: { id: number; application_code: string } | null;
}

const STATUS_BADGE: Record<Payment['status'], string> = {
  paid:    'bg-green-50 text-green-700',
  partial: 'bg-amber-50 text-amber-700',
  due:     'bg-rose-50 text-rose-700',
};

interface PaymentsPage {
  data: Payment[];
  total: number;
}

function timeAgo(dateStr: string, L: Lang): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return L === 'ja' ? 'たった今' : L === 'bn' ? 'এইমাত্র' : 'just now';
  if (m < 60) return L === 'ja' ? `${m}分前` : L === 'bn' ? `${m}মি আগে` : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return L === 'ja' ? `${h}時間前` : L === 'bn' ? `${h}ঘ আগে` : `${h}h ago`;
  const d = Math.floor(h / 24);
  return d < 30
    ? (L === 'ja' ? `${d}日前` : L === 'bn' ? `${d}দিন আগে` : `${d}d ago`)
    : new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: '2-digit' });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BranchPaymentsPage() {
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

  // ── Form state ──────────────────────────────────────────────────────────────
  const [appSearch, setAppSearch]         = useState('');
  const [appPickerOpen, setAppPickerOpen] = useState(false);
  const [selectedApp, setSelectedApp]     = useState<ApplicationOption | null>(null);
  const [categoryId, setCategoryId]       = useState<number | ''>('');
  const [totalAmount, setTotalAmount]     = useState('');
  const [paidNow, setPaidNow]             = useState('');
  const [method, setMethod]               = useState<'cash' | 'bank'>('cash');
  const [customerName, setCustomerName]   = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes]                 = useState('');
  const [justReceipt, setJustReceipt]     = useState<Payment | null>(null);
  const [formError, setFormError]         = useState('');
  const [collectingId, setCollectingId]   = useState<number | null>(null);
  const [collectAmount, setCollectAmount] = useState('');
  const appPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (appPickerRef.current && !appPickerRef.current.contains(e.target as Node)) setAppPickerOpen(false);
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  const { data: categories } = useQuery<PaymentCategory[]>({
    queryKey: ['payment-categories'],
    queryFn: () => api.get('/branch-admin/payment-categories').then(r => r.data),
    enabled: !!isBranchAdmin,
    staleTime: 300_000,
  });

  const { data: appsData } = useQuery<{ data: ApplicationOption[] }>({
    queryKey: ['branch-applications'],
    queryFn: () => api.get('/applications').then(r => r.data),
    enabled: !!isBranchAdmin,
    staleTime: 300_000,
  });
  const apps = appsData?.data ?? [];

  // Policy: one memo per invoice — collections update the existing memo
  // rather than a second one being created for the same due balance. This
  // surfaces that existing memo (if any) so staff use Collect instead.
  const { data: dueMemo } = useQuery<{ id: number; receipt_no: string; due_amount: string; currency: string } | null>({
    queryKey: ['application-due-memo', selectedApp?.id],
    queryFn: () => api.get(`/branch-admin/applications/${selectedApp!.id}/due-memo`).then(r => r.data),
    enabled: !!selectedApp,
  });

  const filteredApps = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    if (!q) return apps.slice(0, 8);
    return apps.filter(a =>
      a.student_name?.toLowerCase().includes(q) ||
      a.application_code?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [apps, appSearch]);

  const paymentsKey = ['branch-payments'];
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery<PaymentsPage>({
    queryKey: paymentsKey,
    queryFn: () => api.get('/branch-admin/payments').then(r => r.data),
    enabled: !!isBranchAdmin,
  });
  const payments = paymentsData?.data ?? [];

  const createPayment = useMutation({
    mutationFn: () => api.post('/branch-admin/payments', {
      application_id: selectedApp?.id ?? null,
      payment_category_id: categoryId,
      total_amount: totalAmount,
      amount: paidNow || undefined, // blank -> backend defaults to total (fully paid)
      method,
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      customer_email: customerEmail || undefined,
      notes: notes || undefined,
    }).then(r => r.data),
    onSuccess: (payment: Payment) => {
      qc.invalidateQueries({ queryKey: paymentsKey });
      setJustReceipt(payment);
      setSelectedApp(null); setAppSearch(''); setCategoryId(''); setTotalAmount(''); setPaidNow('');
      setMethod('cash'); setCustomerName(''); setCustomerPhone(''); setCustomerEmail(''); setNotes('');
      setFormError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setFormError(msg || t('Something went wrong. Please try again.', '問題が発生しました。もう一度お試しください。', 'কিছু ভুল হয়েছে। আবার চেষ্টা করুন।'));
    },
  });

  const collectPayment = useMutation({
    mutationFn: (vars: { id: number; amount: string }) =>
      api.post(`/branch-admin/payments/${vars.id}/collect`, { amount: vars.amount }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: paymentsKey }),
  });

  // Opens the printable receipt (browser's own Print > Save as PDF handles
  // the "download") in a new tab. A signed URL, not the API's Bearer token,
  // is what authorizes it — that token can't ride along into a plain tab.
  async function openReceipt(id: number) {
    const w = window.open('', '_blank');
    try {
      const { data } = await api.get<{ url: string }>(`/branch-admin/payments/${id}/receipt-url`);
      if (w) w.location.href = data.url; else window.open(data.url, '_blank');
    } catch {
      w?.close();
    }
  }

  if (!user || !isBranchAdmin) return null;

  const selectedCategory = categories?.find(c => c.id === categoryId) ?? null;
  const dueOnCreate = Math.max(Number(totalAmount || 0) - Number(paidNow || totalAmount || 0), 0);
  const canSubmit = !!categoryId && Number(totalAmount) > 0 && (!!selectedApp || customerName.trim().length > 0);

  return (
    <BranchLayout title={t('Memos', '伝票', 'মেমো')}>
      <div className="max-w-4xl space-y-6">

        {/* ── Just-completed receipt confirmation ── */}
        {justReceipt && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-green-900 text-sm">
                {t('Receipt sent ✓', '受領書を送信しました ✓', 'রিসিপ্ট পাঠানো হয়েছে ✓')}
              </p>
              <p className="text-xs text-green-700 mt-0.5">
                {t('Receipt no.', '受領書番号', 'রিসিপ্ট নং')} <span className="font-mono font-bold">{justReceipt.receipt_no}</span>
                {' · '}{justReceipt.amount} {justReceipt.currency}
                {justReceipt.status !== 'paid' && (
                  <span className="text-amber-700 font-semibold">
                    {' · '}{t(`${justReceipt.due_amount} due`, `残高 ${justReceipt.due_amount}`, `${justReceipt.due_amount} বাকি`)}
                  </span>
                )}
              </p>
            </div>
            <button onClick={() => setJustReceipt(null)} className="text-green-600 hover:text-green-800 shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Entry form ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 sm:p-6">
          <h3 className="font-black text-slate-900 text-sm mb-1">{t('Create Memo', '伝票作成', 'নতুন মেমো তৈরি করুন')}</h3>
          <p className="text-xs text-slate-400 mb-5">
            {t('Recorded instantly — no approval step. A receipt is emailed to the customer right away.', '即座に記録されます — 承認は不要です。領収書は直ちにメールで送信されます。', 'সাথে সাথেই এন্ট্রি হয়ে যাবে — কোনো অ্যাপ্রুভাল লাগবে না। রিসিপ্ট সাথে সাথেই ইমেইলে চলে যাবে।')}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Application picker (optional) */}
            <div className="sm:col-span-2 relative" ref={appPickerRef}>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                {t('Link to Application (optional)', '申請にリンク（任意）', 'অ্যাপ্লিকেশনের সাথে যুক্ত করুন (ঐচ্ছিক)')}
              </label>
              {selectedApp ? (
                <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-green-50 border border-green-200">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{selectedApp.student_name}</p>
                    <p className="text-[11px] font-mono text-green-700">{selectedApp.application_code}</p>
                  </div>
                  <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600 shrink-0 ml-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={appSearch}
                    onChange={e => { setAppSearch(e.target.value); setAppPickerOpen(true); }}
                    onFocus={() => setAppPickerOpen(true)}
                    placeholder={t('Search by name or application code…', '名前または申請コードで検索…', 'নাম বা অ্যাপ্লিকেশন কোড দিয়ে খুঁজুন…')}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all"
                  />
                  {appPickerOpen && filteredApps.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-100 rounded-xl shadow-lg max-h-56 overflow-y-auto">
                      {filteredApps.map(a => (
                        <button
                          key={a.id}
                          onClick={() => { setSelectedApp(a); setAppPickerOpen(false); setAppSearch(''); }}
                          className="w-full text-left px-3.5 py-2.5 hover:bg-green-50 transition-colors border-b border-slate-50 last:border-0"
                        >
                          <p className="text-xs font-semibold text-slate-800">{a.student_name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{a.application_code}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <p className="text-[11px] text-slate-400 mt-1">
                {t('Leave empty for a walk-in memo not tied to an application.', 'アプリケーションに関連しない場合は空欄のままにしてください。', 'কোনো অ্যাপ্লিকেশন ছাড়া ওয়াক-ইন মেমো হলে খালি রাখুন।')}
              </p>

              {dueMemo && (
                <div className="mt-2 flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {t(
                      `This application already has a due memo (${dueMemo.receipt_no}, ${dueMemo.due_amount} ${dueMemo.currency} due). Use Collect on that memo below instead of creating a new one.`,
                      `この申請にはすでに未払いの伝票があります（${dueMemo.receipt_no}、残高 ${dueMemo.due_amount} ${dueMemo.currency}）。新しい伝票を作らず、下の「入金する」を使ってください。`,
                      `এই অ্যাপ্লিকেশনের একটা বাকি মেমো আগে থেকেই আছে (${dueMemo.receipt_no}, ${dueMemo.due_amount} ${dueMemo.currency} বাকি)। নতুন মেমো না বানিয়ে নিচে সেই মেমোতে "Collect" ব্যবহার করুন।`
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('Category', 'カテゴリ', 'ক্যাটাগরি')}</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all"
              >
                <option value="">{t('Select category…', 'カテゴリを選択…', 'ক্যাটাগরি বাছুন…')}</option>
                {(categories ?? []).map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
              {selectedCategory && (
                <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  selectedCategory.fund_target === 'branch' ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'
                }`}>
                  {selectedCategory.fund_target === 'branch'
                    ? t('→ Branch Fund', '→ 支店ファンド', '→ ব্রাঞ্চ ফান্ড')
                    : t('→ Head Office Fund', '→ 本部ファンド', '→ হেড অফিস ফান্ড')}
                </span>
              )}
            </div>

            {/* Total / Collected Now / Method */}
            <div className="sm:col-span-2 grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('Total Amount (BDT)', '合計金額 (BDT)', 'মোট পরিমাণ (BDT)')}</label>
                <input
                  type="number" min="1" value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('Collected Now', '今回の入金', 'এখন সংগ্রহ')}</label>
                <input
                  type="number" min="0" value={paidNow} onChange={e => setPaidNow(e.target.value)}
                  placeholder={totalAmount || '0.00'}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all"
                />
                <p className="text-[11px] mt-1 text-slate-400">
                  {dueOnCreate > 0
                    ? t(`Leaves ${dueOnCreate} due`, `${dueOnCreate} が未払いになります`, `${dueOnCreate} বাকি থাকবে`)
                    : t('Leave blank for fully paid', '空欄で全額支払い扱い', 'পুরো টাকা পেলে খালি রাখুন')}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('Method', '方法', 'পদ্ধতি')}</label>
                <select
                  value={method} onChange={e => setMethod(e.target.value as 'cash' | 'bank')}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all"
                >
                  <option value="cash">{t('Cash', '現金', 'ক্যাশ')}</option>
                  <option value="bank">{t('Bank', '銀行', 'ব্যাংক')}</option>
                </select>
              </div>
            </div>

            {/* Customer info — required unless an application is linked */}
            {!selectedApp && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('Customer Name', '顧客名', 'কাস্টমারের নাম')}</label>
                  <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1.5 block">{t('Phone', '電話', 'ফোন')}</label>
                  <input type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all" />
                </div>
              </>
            )}

            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-slate-500 mb-1.5 block">
                {t('Email (for receipt)', 'メール（受領書送付先）', 'ইমেইল (রিসিপ্টের জন্য)')}
              </label>
              <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)}
                placeholder={selectedApp?.student_email || ''}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-400 transition-all" />
              {!customerEmail && !selectedApp?.student_email && (
                <p className="text-[11px] text-amber-600 mt-1">
                  {t('No receipt will be emailed without an address — the memo is still created.', 'メールアドレスがない場合、受領書は送信されません（伝票は作成されます）。', 'ইমেইল না দিলে রিসিপ্ট পাঠানো হবে না — তবে মেমো ঠিকই তৈরি হবে।')}
                </p>
              )}
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
              onClick={() => createPayment.mutate()}
              disabled={!canSubmit || createPayment.isPending}
              className="px-6 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-sm shadow-md shadow-green-700/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {createPayment.isPending
                ? t('Recording…', '記録中…', 'এন্ট্রি হচ্ছে…')
                : t('Create Memo & Send Receipt', '伝票を作成して受領書を送信', 'মেমো তৈরি করুন ও রিসিপ্ট পাঠান')}
            </button>
          </div>
        </div>

        {/* ── History ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-6 py-4 border-b border-slate-100">
            <h3 className="font-black text-slate-900 text-sm">{t('Memo History', '伝票履歴', 'মেমো হিস্ট্রি')}</h3>
          </div>

          {paymentsLoading ? (
            <div className="py-16 flex flex-col items-center gap-3">
              <span className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin" />
            </div>
          ) : payments.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-2">
              <p className="text-sm font-bold text-slate-500">{t('No memos yet', 'まだ伝票がありません', 'এখনো কোনো মেমো নেই')}</p>
              <p className="text-xs text-slate-400">{t('New memos will show up here.', '新しい伝票はここに表示されます。', 'নতুন মেমো এখানে দেখা যাবে।')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="text-left px-5 py-3">{t('Receipt', '受領書', 'রিসিপ্ট')}</th>
                    <th className="text-left px-4 py-3">{t('Customer', '顧客', 'কাস্টমার')}</th>
                    <th className="text-left px-4 py-3">{t('Category', 'カテゴリ', 'ক্যাটাগরি')}</th>
                    <th className="text-left px-4 py-3">{t('Amount', '金額', 'পরিমাণ')}</th>
                    <th className="text-left px-4 py-3">{t('Status', 'ステータス', 'অবস্থা')}</th>
                    <th className="text-left px-4 py-3">{t('Date', '日付', 'তারিখ')}</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payments.map(p => (
                    <Fragment key={p.id}>
                    <tr>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-[11px] text-slate-700">{p.receipt_no}</span>
                        {p.application && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{p.application.application_code}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-slate-700">{p.customer_name}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.fund_target === 'branch' ? 'bg-green-50 text-green-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {p.category?.label ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-bold text-slate-800 tabular-nums">
                        {p.amount} {p.currency}
                        {p.status !== 'paid' && (
                          <p className="text-[10px] font-normal text-slate-400 mt-0.5">
                            {t('of', '合計', 'মোটের')} {p.total_amount}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[p.status]}`}>
                          {t(
                            p.status === 'paid' ? 'Paid' : p.status === 'partial' ? 'Partial' : 'Due',
                            p.status === 'paid' ? '支払済' : p.status === 'partial' ? '一部' : '未払い',
                            p.status === 'paid' ? 'পরিশোধিত' : p.status === 'partial' ? 'আংশিক' : 'বাকি'
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[11px] text-slate-400 whitespace-nowrap">{timeAgo(p.created_at, L)}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => openReceipt(p.id)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-500 transition-all"
                          >
                            {t('Receipt', '受領書', 'রিসিপ্ট')}
                          </button>
                          {p.status !== 'paid' && (
                            <button
                              onClick={() => { setCollectingId(collectingId === p.id ? null : p.id); setCollectAmount(p.due_amount); }}
                              className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 hover:bg-green-700 hover:text-white text-slate-500 transition-all"
                            >
                              {t('Collect', '入金する', 'সংগ্রহ করুন')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {collectingId === p.id && (
                      <tr className="bg-slate-50/70">
                        <td colSpan={7} className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-slate-500">
                              {t('Balance due:', '未払い残高:', 'বাকি আছে:')} <b>{p.due_amount} {p.currency}</b>
                            </span>
                            <input
                              type="number" min="0.01" max={p.due_amount} value={collectAmount}
                              onChange={e => setCollectAmount(e.target.value)}
                              className="w-32 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-green-500/40"
                            />
                            <button
                              onClick={() => collectPayment.mutate({ id: p.id, amount: collectAmount }, { onSuccess: () => setCollectingId(null) })}
                              disabled={collectPayment.isPending || Number(collectAmount) <= 0}
                              className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white rounded-lg text-xs font-bold disabled:opacity-40"
                            >
                              {t('Record', '記録', 'রেকর্ড করুন')}
                            </button>
                            <button onClick={() => setCollectingId(null)} className="text-xs text-slate-400 hover:text-slate-600">
                              {t('Cancel', 'キャンセル', 'বাতিল')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </BranchLayout>
  );
}
