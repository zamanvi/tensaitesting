'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function InstitutionSettingsPage() {
  const { lang } = useLang();
  const { user, fetchMe } = useAuthStore();
  const router = useRouter();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  useEffect(() => {
    if (user && user.gateway_type !== 'institution') router.replace('/dashboard');
  }, [user, router]);

  // Avatar
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarErr, setAvatarErr] = useState('');
  const [avatarSaved, setAvatarSaved] = useState(false);

  // Phone
  const [phone, setPhone] = useState('');
  useEffect(() => { setPhone(user?.phone ?? ''); }, [user?.phone]);
  const [contactSaved, setContactSaved] = useState(false);
  const [contactErr, setContactErr] = useState('');

  // Password
  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwErr, setPwErr] = useState('');

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return api.post('/institution/account/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      fetchMe().catch(() => {});
      setAvatarSaved(true);
      setAvatarErr('');
      setTimeout(() => setAvatarSaved(false), 3000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setAvatarErr(err.response?.data?.message ?? (ja ? 'アップロードに失敗しました。' : bn ? 'আপলোড ব্যর্থ হয়েছে।' : 'Upload failed.'));
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAvatarErr(ja ? 'ファイルサイズは2MB以内にしてください。' : bn ? 'ফাইল ২ MB-এর বেশি হওয়া যাবে না।' : 'File must be under 2 MB.');
      return;
    }
    setAvatarErr('');
    setAvatarPreview(URL.createObjectURL(file));
    uploadAvatar.mutate(file);
  }

  const saveContact = useMutation({
    mutationFn: () => api.patch('/institution/account', { phone }),
    onSuccess: () => {
      fetchMe().catch(() => {});
      setContactSaved(true);
      setContactErr('');
      setTimeout(() => setContactSaved(false), 3000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setContactErr(err.response?.data?.message ?? (ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save.'));
    },
  });

  const savePassword = useMutation({
    mutationFn: () => api.patch('/institution/account', pw),
    onSuccess: () => {
      setPwSaved(true);
      setPwErr('');
      setPw({ current_password: '', password: '', password_confirmation: '' });
      setTimeout(() => setPwSaved(false), 3000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setPwErr(err.response?.data?.message ?? (ja ? 'パスワード変更に失敗しました。' : bn ? 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।' : 'Failed to update password.'));
    },
  });

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.password !== pw.password_confirmation) {
      setPwErr(ja ? 'パスワードが一致しません。' : bn ? 'পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.');
      return;
    }
    if (pw.password.length < 8) {
      setPwErr(ja ? 'パスワードは8文字以上必要です。' : bn ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।' : 'Password must be at least 8 characters.');
      return;
    }
    setPwErr('');
    savePassword.mutate();
  }

  const title = ja ? '設定' : bn ? 'সেটিংস' : 'Settings';
  const initials = (user?.name ?? '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarSrc = avatarPreview ?? user?.avatar_url ?? null;

  return (
    <DashboardLayout title={title}>
      <div className="max-w-xl space-y-5">

        {/* Profile picture */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? 'プロフィール写真' : bn ? 'প্রোফাইল ছবি' : 'Profile Picture'}
          </h2>
          <div className="flex items-center gap-5">
            <div className="shrink-0 relative">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-100" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold select-none">
                  {initials}
                </div>
              )}
              {uploadAvatar.isPending && (
                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">...</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {avatarSaved && (
                <div className="mb-2 p-2 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
                  ✅ {ja ? '写真を更新しました' : bn ? 'ছবি আপডেট হয়েছে' : 'Photo updated'}
                </div>
              )}
              {avatarErr && (
                <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {avatarErr}</div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {uploadAvatar.isPending
                  ? (ja ? 'アップロード中…' : bn ? 'আপলোড হচ্ছে…' : 'Uploading…')
                  : (ja ? '写真を変更する' : bn ? 'ছবি পরিবর্তন করুন' : 'Change Photo')}
              </button>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {ja ? 'JPG・PNG、最大2MB' : bn ? 'JPG বা PNG, সর্বোচ্চ ২ MB' : 'JPG or PNG, max 2 MB'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* Account info (read-only) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? 'アカウント情報' : bn ? 'অ্যাকাউন্টের তথ্য' : 'Account Info'}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '機関名' : bn ? 'প্রতিষ্ঠানের নাম' : 'Institution Name'}
              </label>
              <div className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600">
                {user?.name ?? '—'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? 'メールアドレス' : bn ? 'ইমেইল' : 'Email'}
              </label>
              <div className="px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-600">
                {user?.email ?? '—'}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {ja ? 'メール変更はサポートにお問い合わせください。' : bn ? 'ইমেইল পরিবর্তনের জন্য সাপোর্টে যোগাযোগ করুন।' : 'To change email, contact support.'}
              </p>
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
          </h2>
          {contactSaved && (
            <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
              ✅ {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Saved successfully'}
            </div>
          )}
          {contactErr && (
            <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {contactErr}</div>
          )}
          <form onSubmit={e => { e.preventDefault(); saveContact.mutate(); }} className="space-y-3">
            <input
              type="tel"
              className={inputCls}
              placeholder="+880 1XXX XXXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <button
              type="submit"
              disabled={saveContact.isPending}
              className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {saveContact.isPending
                ? (ja ? '保存中…' : bn ? 'সেভ হচ্ছে…' : 'Saving…')
                : (ja ? '電話番号を保存する' : bn ? 'ফোন সংরক্ষণ করুন' : 'Save Phone')}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? 'パスワード変更' : bn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
          </h2>
          {pwSaved && (
            <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
              ✅ {ja ? 'パスワードを更新しました' : bn ? 'পাসওয়ার্ড আপডেট হয়েছে' : 'Password updated successfully'}
            </div>
          )}
          {pwErr && (
            <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {pwErr}</div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '現在のパスワード' : bn ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
              </label>
              <input type="password" className={inputCls} value={pw.current_password}
                onChange={e => setPw(p => ({ ...p, current_password: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '新しいパスワード' : bn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              </label>
              <input type="password" className={inputCls} value={pw.password}
                onChange={e => setPw(p => ({ ...p, password: e.target.value }))} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? 'パスワード確認' : bn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                className={`${inputCls} ${pw.password_confirmation && pw.password !== pw.password_confirmation ? 'border-red-300 focus:ring-red-400' : ''}`}
                value={pw.password_confirmation}
                onChange={e => setPw(p => ({ ...p, password_confirmation: e.target.value }))} required
              />
              {pw.password_confirmation && pw.password !== pw.password_confirmation && (
                <p className="text-[11px] text-red-500 mt-1">
                  {ja ? 'パスワードが一致しません' : bn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={savePassword.isPending || !pw.current_password || !pw.password || !pw.password_confirmation || pw.password !== pw.password_confirmation}
              className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {savePassword.isPending
                ? (ja ? '更新中…' : bn ? 'আপডেট হচ্ছে…' : 'Updating…')
                : (ja ? 'パスワードを変更する' : bn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update Password')}
            </button>
          </form>
        </div>

      </div>
    </DashboardLayout>
  );
}
