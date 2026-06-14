'use client';
import { useState } from 'react';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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

export default function BranchAdminDashboard() {
  const { lang } = useLang();
  const ja = lang === 'ja';
  const bn = lang === 'bn';
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const isBranchAdmin = user?.roles?.includes('branch_admin') || user?.roles?.includes('branch_manager');

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
      setSaved(true);
      setSaveErr('');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['my-branch'] });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setSaveErr(err.response?.data?.message ?? 'Failed to save.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(form);
  };

  const cancelEdit = () => {
    setForm({
      phone:    branch?.phone    ?? '',
      whatsapp: branch?.whatsapp ?? '',
      address:  branch?.address  ?? '',
    });
    setEditing(false);
  };

  if (!user || !isBranchAdmin) return null;

  return (
    <DashboardLayout>
      <div className="max-w-xl">
        {/* Branch name header */}
        <div className="mb-6">
          <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
            {ja ? '管理中の支局' : bn ? 'আপনার শাখা' : 'Your Branch'}
          </p>
          <h1 className="text-xl font-bold text-slate-900">
            {isLoading ? '…' : branch?.name ?? '—'}
          </h1>
          {branch?.city && (
            <p className="text-sm text-slate-500 mt-0.5">
              📍 {branch.city}{branch.country ? `, ${branch.country}` : ''}
            </p>
          )}
        </div>

        {/* Contact info card */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-900 text-sm">
              {ja ? '連絡先情報' : bn ? 'যোগাযোগের তথ্য' : 'Contact Information'}
            </h2>
            {!editing && !isLoading && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-semibold text-green-700 hover:text-green-800 transition-colors"
              >
                {ja ? '編集' : bn ? 'সম্পাদনা' : 'Edit'}
              </button>
            )}
          </div>

          {saved && (
            <div className="mb-4 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
              ✅ {ja ? '連絡先情報を保存しました' : bn ? 'যোগাযোগের তথ্য সংরক্ষিত হয়েছে' : 'Contact info saved successfully'}
            </div>
          )}
          {saveErr && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
              ⚠️ {saveErr}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-slate-300 text-sm">…</div>
          ) : editing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="+880 1XXX XXXXXX"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  {ja ? 'WhatsApp番号' : bn ? 'হোয়াটসঅ্যাপ নম্বর' : 'WhatsApp Number'}
                </label>
                <input
                  type="tel"
                  value={form.whatsapp}
                  onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                  placeholder="+880 1XXX XXXXXX"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">
                  {ja ? '住所' : bn ? 'ঠিকানা' : 'Office Address'}
                </label>
                <textarea
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  rows={3}
                  placeholder={ja ? '支局の住所を入力してください' : bn ? 'শাখার ঠিকানা লিখুন' : 'Enter branch office address'}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={update.isPending}
                  className="flex-1 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {update.isPending ? '…' : (ja ? '保存する' : bn ? 'সংরক্ষণ করুন' : 'Save Changes')}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
                >
                  {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {[
                { label: ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone', value: branch?.phone, icon: '📞' },
                { label: 'WhatsApp', value: branch?.whatsapp, icon: '💬' },
                { label: ja ? '住所' : bn ? 'ঠিকানা' : 'Address', value: branch?.address, icon: '📍' },
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

              {branch?.email && (
                <div className="flex gap-3">
                  <span className="text-base shrink-0 mt-0.5">✉️</span>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">{ja ? 'メール' : bn ? 'ইমেইল' : 'Email'}</p>
                    <p className="text-sm text-slate-800 font-medium">{branch.email}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ja ? 'メールはシステム管理者のみ変更可能です' : bn ? 'ইমেইল শুধু সিস্টেম অ্যাডমিন পরিবর্তন করতে পারবেন' : 'Email can only be changed by system admin'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Read-only note */}
        <p className="text-xs text-slate-400 mt-4 text-center">
          {ja ? 'ロゴ・カバー画像・その他の情報はシステム管理者にお問い合わせください。' : bn ? 'লোগো, কভার ইমেজ ও অন্যান্য তথ্য পরিবর্তনের জন্য সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'To update logo, cover image, or other details — contact system admin.'}
        </p>
      </div>
    </DashboardLayout>
  );
}
