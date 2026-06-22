'use client';
import { useState, useEffect } from 'react';
import BranchLayout from '@/components/shared/BranchLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Branch {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  email: string | null;
}

interface Lead {
  id: number;
  lead_code: string;
  status: string;
  submission_status: string | null;
  target_country: string | null;
  created_at: string;
  student: { id: number; name: string; email: string } | null;
}

export default function BranchAdminDashboard() {
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');

  const [form, setForm] = useState({ phone: '', whatsapp: '', address: '' });
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const { data: branch, isLoading } = useQuery<Branch>({
    queryKey: ['my-branch'],
    queryFn: () => api.get('/branch-admin/my-branch').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  const { data: leads = [] } = useQuery<Lead[]>({
    queryKey: ['branch-leads-summary'],
    queryFn: () => api.get('/branch-admin/leads').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  useEffect(() => {
    if (branch) {
      setForm({
        phone:    branch.phone    ?? '',
        whatsapp: branch.whatsapp ?? '',
        address:  branch.address  ?? '',
      });
    }
  }, [branch]);

  const update = useMutation({
    mutationFn: (data: typeof form) => api.patch('/branch-admin/contact', data),
    onSuccess: () => {
      setSaved(true); setSaveErr(''); setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['my-branch'] });
      queryClient.invalidateQueries({ queryKey: ['branch-settings'] });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setSaveErr(err.response?.data?.message ?? 'Failed to save.');
    },
  });

  if (!user || !isBranchAdmin) return null;

  // Stats
  const total     = leads.length;
  const draft     = leads.filter(l => l.submission_status === 'draft').length;
  const submitted = leads.filter(l => l.submission_status === 'submitted').length;
  const accepted  = leads.filter(l => l.submission_status === 'accepted').length;

  const stats = [
    { label: ja ? '合計' : bn ? 'মোট' : 'Total',         value: total,     color: 'bg-slate-100 text-slate-700',   icon: '👥' },
    { label: ja ? '下書き' : bn ? 'ড্রাফট' : 'Draft',     value: draft,     color: 'bg-amber-50 text-amber-700',    icon: '📝' },
    { label: ja ? '選択済' : bn ? 'সাবমিট' : 'Submitted', value: submitted, color: 'bg-blue-50 text-blue-700',      icon: '📌' },
    { label: ja ? '承認済' : bn ? 'অনুমোদিত' : 'Accepted', value: accepted,  color: 'bg-green-50 text-green-700',    icon: '✅' },
  ];

  const quickLinks = [
    { label: ja ? '申請を見る' : bn ? 'আবেদন দেখুন' : 'View Applications', href: '/dashboard/branch/applicants', icon: '📋', desc: ja ? '申請者を管理' : bn ? 'আবেদনকারী পরিচালনা' : 'Manage student applications and submit to admin' },
    { label: ja ? 'チームを管理' : bn ? 'টিম পরিচালনা' : 'Manage Team',      href: '/dashboard/branch/team',       icon: '👤', desc: ja ? 'スタッフを追加・編集' : bn ? 'স্টাফ যোগ ও সম্পাদনা' : 'Add team members and manage roles' },
    { label: ja ? 'ギャラリー' : bn ? 'গ্যালারি' : 'Gallery',                href: '/dashboard/branch/gallery',    icon: '🖼️', desc: ja ? '写真を管理' : bn ? 'ছবি পরিচালনা' : 'Upload and manage branch gallery images' },
    { label: ja ? '設定' : bn ? 'সেটিংস' : 'Settings',                       href: '/dashboard/branch/settings',   icon: '⚙️', desc: ja ? '支局情報を更新' : bn ? 'শাখার তথ্য আপডেট' : 'Update contact details, hours and social links' },
  ];

  return (
    <BranchLayout>
      <div className="max-w-4xl space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">
              {ja ? '管理中の支局' : bn ? 'আপনার শাখা' : 'Your Branch'}
            </p>
            <h1 className="text-2xl font-black text-slate-900">
              {isLoading ? <span className="text-slate-300">…</span> : branch?.name ?? '—'}
            </h1>
            {branch?.city && (
              <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
                <span>📍</span>
                {branch.city}{branch.country ? `, ${branch.country}` : ''}
              </p>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-100 text-xs font-semibold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            {ja ? 'アクティブ' : bn ? 'সক্রিয়' : 'Active'}
          </span>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className={`rounded-2xl border border-slate-100 p-4 ${s.color} bg-opacity-60`}>
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-black">{s.value}</div>
              <div className="text-xs font-medium mt-0.5 opacity-70">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Quick links ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map(q => (
            <Link key={q.href} href={q.href}
              className="bg-white rounded-2xl border border-slate-100 p-4 hover:border-green-200 hover:shadow-sm transition-all group">
              <div className="text-2xl mb-2">{q.icon}</div>
              <div className="text-sm font-bold text-slate-800 group-hover:text-green-700 transition-colors">{q.label}</div>
              <div className="text-xs text-slate-400 mt-0.5">{q.desc}</div>
            </Link>
          ))}
        </div>

        {/* ── Contact info card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900 text-sm">
              {ja ? '連絡先情報' : bn ? 'যোগাযোগের তথ্য' : 'Contact Information'}
            </h2>
            {!editing && !isLoading && (
              <button onClick={() => setEditing(true)}
                className="text-xs font-semibold text-green-700 hover:text-green-800 transition-colors px-3 py-1 rounded-lg hover:bg-green-50">
                ✏️ {ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}
              </button>
            )}
          </div>

          {saved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
              ✅ {ja ? '連絡先情報を保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Contact info saved successfully'}
            </div>
          )}
          {saveErr && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {saveErr}</div>
          )}

          {isLoading ? (
            <div className="text-center py-6 text-slate-300 text-sm">…</div>
          ) : editing ? (
            <form onSubmit={e => { e.preventDefault(); update.mutate(form); }} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
                  </label>
                  <input type="tel" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+880 1XXX XXXXXX"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">WhatsApp</label>
                  <input type="tel" value={form.whatsapp}
                    onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                    placeholder="+880 1XXX XXXXXX"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  {ja ? '住所' : bn ? 'ঠিকানা' : 'Office Address'}
                </label>
                <textarea value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  rows={3} placeholder={ja ? '支局の住所を入力してください' : bn ? 'শাখার ঠিকানা লিখুন' : 'Enter branch office address'}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={update.isPending}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                  {update.isPending ? '…' : (ja ? '保存する' : bn ? 'সংরক্ষণ করুন' : 'Save Changes')}
                </button>
                <button type="button" onClick={() => { setForm({ phone: branch?.phone ?? '', whatsapp: branch?.whatsapp ?? '', address: branch?.address ?? '' }); setEditing(false); }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors">
                  {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: ja ? '電話番号' : bn ? 'ফোন' : 'Phone',     value: branch?.phone,    icon: '📞' },
                { label: 'WhatsApp',                                   value: branch?.whatsapp, icon: '💬' },
                { label: ja ? '住所' : bn ? 'ঠিকানা' : 'Address',    value: branch?.address,  icon: '📍' },
              ].map(item => (
                <div key={item.label} className="flex gap-3">
                  <span className="text-base shrink-0 mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                    <p className="text-sm text-slate-800 font-medium">
                      {item.value || <span className="text-slate-300 font-normal">{ja ? '未設定' : bn ? 'সেট করা হয়নি' : 'Not set'}</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400 text-center">
          {ja ? 'ロゴ・カバー画像・その他はシステム管理者にお問い合わせください。'
            : bn ? 'লোগো, কভার ইমেজ ও অন্যান্য তথ্যের জন্য সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।'
            : 'To update logo, cover image, or other details — contact system admin.'}
        </p>

      </div>
    </BranchLayout>
  );
}
