'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-slate-400';

export default function AgencySettingsPage() {
  const { lang } = useLang();
  const { user, fetchMe } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  useEffect(() => {
    if (user && user.gateway_type !== 'agency') router.replace(`/dashboard/${user.gateway_type}`);
  }, [user, router]);

  // ── Avatar ────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [avatarOk, setAvatarOk]           = useState(false);
  const [avatarErr, setAvatarErr]         = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const currentAvatar = user?.avatar_url ?? null;

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAvatarErr(ja ? '2MB以下の画像を選択してください。' : bn ? '২ MB-এর নিচে ছবি বেছে নিন।' : 'Image must be under 2 MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarErr('');
  }

  const avatarMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('avatar', avatarFile!);
      return api.post('/agency/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      setAvatarOk(true); setAvatarErr('');
      setAvatarFile(null);
      fetchMe();
      qc.invalidateQueries({ queryKey: ['agency-profile'] });
      setTimeout(() => setAvatarOk(false), 3000);
    },
    onError: () => setAvatarErr(ja ? 'アップロードに失敗しました。' : bn ? 'আপলোড ব্যর্থ হয়েছে।' : 'Upload failed.'),
  });

  // ── Phone ─────────────────────────────────────────────────
  const [phone, setPhone]       = useState(user?.phone ?? '');
  const [phoneOk, setPhoneOk]   = useState(false);
  const [phoneErr, setPhoneErr] = useState('');

  const phoneMutation = useMutation({
    mutationFn: () => api.patch('/agency/settings', { phone }),
    onSuccess: () => {
      setPhoneOk(true); setPhoneErr('');
      setTimeout(() => setPhoneOk(false), 3000);
    },
    onError: () => setPhoneErr(ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save.'),
  });

  // ── Password ───────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwOk, setPwOk]     = useState(false);
  const [pwErr, setPwErr]   = useState('');

  const pwMutation = useMutation({
    mutationFn: () => api.post('/agency/change-password', pwForm),
    onSuccess: () => {
      setPwOk(true); setPwErr('');
      setPwForm({ current_password: '', password: '', password_confirmation: '' });
      setTimeout(() => setPwOk(false), 3000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const errs = err.response?.data?.errors;
      setPwErr(errs ? Object.values(errs).flat().join(' ') : err.response?.data?.message ?? (ja ? 'パスワード変更に失敗しました。' : bn ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ।' : 'Failed to change password.'));
    },
  });

  function setPw(k: keyof typeof pwForm, v: string) { setPwForm(f => ({ ...f, [k]: v })); }

  if (!user || user.gateway_type !== 'agency') return null;

  return (
    <DashboardLayout title={ja ? 'アカウント設定' : bn ? 'অ্যাকাউন্ট সেটিংস' : 'Account Settings'}>
      <div className="max-w-xl space-y-5">

        {/* Avatar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            🖼️ {ja ? 'プロフィール写真' : bn ? 'প্রোফাইল ছবি' : 'Profile Photo'}
          </h3>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
              {(avatarPreview ?? currentAvatar)
                ? <img src={avatarPreview ?? currentAvatar!} alt="Avatar" className="w-full h-full object-cover" />
                : <span className="text-3xl font-bold text-slate-300">{user.name?.charAt(0).toUpperCase() ?? '?'}</span>
              }
            </div>
            <div className="flex-1">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              <button onClick={() => fileRef.current?.click()}
                className="px-4 py-2 text-xs font-bold border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-800 transition-colors">
                {ja ? '写真を選択' : bn ? 'ছবি বেছে নিন' : 'Choose Photo'}
              </button>
              <p className="text-[11px] text-slate-400 mt-1.5">JPG, PNG · {ja ? '最大2MB' : bn ? 'সর্বোচ্চ ২ MB' : 'Max 2 MB'}</p>
              {avatarFile && (
                <button onClick={() => avatarMutation.mutate()} disabled={avatarMutation.isPending}
                  className="mt-2 px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                  {avatarMutation.isPending ? '...' : (ja ? 'アップロード' : bn ? 'আপলোড করুন' : 'Upload')}
                </button>
              )}
            </div>
          </div>
          {avatarOk && <p className="text-xs text-emerald-600 font-semibold mt-2">✓ {ja ? '更新しました' : bn ? 'আপডেট হয়েছে' : 'Updated'}</p>}
          {avatarErr && <p className="text-xs text-red-500 mt-2">{avatarErr}</p>}
        </div>

        {/* Phone */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            📱 {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
          </h3>
          <div className="flex gap-2">
            <input type="tel" className={inputCls} placeholder="+8801XXXXXXXXX"
              value={phone} onChange={e => setPhone(e.target.value)} />
            <button onClick={() => phoneMutation.mutate()} disabled={phoneMutation.isPending || !phone.trim()}
              className="shrink-0 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
              {phoneMutation.isPending ? '...' : (ja ? '保存' : bn ? 'সেভ' : 'Save')}
            </button>
          </div>
          {phoneOk && <p className="text-xs text-emerald-600 font-semibold mt-2">✓ {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Saved'}</p>}
          {phoneErr && <p className="text-xs text-red-500 mt-2">{phoneErr}</p>}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            🔒 {ja ? 'パスワード変更' : bn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
          </h3>
          <div className="space-y-3">
            {[
              { k: 'current_password' as const, label: ja ? '現在のパスワード' : bn ? 'বর্তমান পাসওয়ার্ড' : 'Current Password' },
              { k: 'password' as const,         label: ja ? '新しいパスワード' : bn ? 'নতুন পাসওয়ার্ড' : 'New Password' },
              { k: 'password_confirmation' as const, label: ja ? '新しいパスワード（確認）' : bn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password' },
            ].map(({ k, label }) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
                <input type="password" className={inputCls} placeholder="••••••••" value={pwForm[k]} onChange={e => setPw(k, e.target.value)} />
              </div>
            ))}
          </div>
          {pwOk && <p className="text-xs text-emerald-600 font-semibold mt-3">✓ {ja ? 'パスワードを変更しました' : bn ? 'পাসওয়ার্ড পরিবর্তিত হয়েছে' : 'Password changed'}</p>}
          {pwErr && <p className="text-xs text-red-500 mt-3">{pwErr}</p>}
          <button
            onClick={() => { setPwErr(''); pwMutation.mutate(); }}
            disabled={pwMutation.isPending || !pwForm.current_password || !pwForm.password || !pwForm.password_confirmation}
            className="mt-4 w-full py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {pwMutation.isPending
              ? (ja ? '変更中...' : bn ? 'পরিবর্তন হচ্ছে...' : 'Changing...')
              : (ja ? 'パスワードを変更する' : bn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password')}
          </button>
        </div>

      </div>
    </DashboardLayout>
  );
}
