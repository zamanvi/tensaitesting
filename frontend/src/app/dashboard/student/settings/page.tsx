'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Section = 'profile' | 'account' | 'security';

const inputCls = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white';

export default function StudentSettingsPage() {
  const { lang } = useLang();
  const { user, fetchMe } = useAuthStore();
  const router = useRouter();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const [activeSection, setActiveSection] = useState<Section>('profile');

  useEffect(() => {
    if (user && user.gateway_type !== 'student') router.replace('/dashboard');
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
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return api.post('/student/account/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { fetchMe().catch(() => {}); setAvatarSaved(true); setAvatarErr(''); setTimeout(() => setAvatarSaved(false), 3000); },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setAvatarErr(err.response?.data?.message ?? 'Upload failed.');
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setAvatarErr('File must be under 2 MB.'); return; }
    setAvatarErr('');
    setAvatarPreview(URL.createObjectURL(file));
    uploadAvatar.mutate(file);
  }

  const saveContact = useMutation({
    mutationFn: () => api.patch('/student/account', { phone }),
    onSuccess: () => { fetchMe().catch(() => {}); setContactSaved(true); setContactErr(''); setTimeout(() => setContactSaved(false), 3000); },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setContactErr(err.response?.data?.message ?? 'Failed to save.');
    },
  });

  const savePassword = useMutation({
    mutationFn: () => api.patch('/student/account', pw),
    onSuccess: () => { setPwSaved(true); setPwErr(''); setPw({ current_password: '', password: '', password_confirmation: '' }); setTimeout(() => setPwSaved(false), 3000); },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setPwErr(err.response?.data?.message ?? 'Failed to update password.');
    },
  });

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.password !== pw.password_confirmation) { setPwErr('Passwords do not match.'); return; }
    if (pw.password.length < 8) { setPwErr('Password must be at least 8 characters.'); return; }
    setPwErr(''); savePassword.mutate();
  }

  const initials = (user?.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarSrc = avatarPreview ?? user?.avatar_url ?? null;

  const nav: { id: Section; label: string; icon: React.ReactNode }[] = [
    {
      id: 'profile',
      label: ja ? 'プロフィール' : bn ? 'প্রোফাইল' : 'Profile',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'account',
      label: ja ? 'アカウント' : bn ? 'অ্যাকাউন্ট' : 'Account',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'security',
      label: ja ? 'セキュリティ' : bn ? 'নিরাপত্তা' : 'Security',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
    },
  ];

  const EyeIcon = ({ open }: { open: boolean }) => open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  return (
    <DashboardLayout title={ja ? '設定' : bn ? 'সেটিংস' : 'Settings'}>
      <div className="max-w-5xl">

        {/* Page header */}
        <div className="mb-6">
          <p className="text-xs text-slate-500 uppercase tracking-[0.15em] font-semibold mb-1">
            {ja ? 'アカウント' : bn ? 'অ্যাকাউন্ট' : 'Account'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {ja ? '設定' : bn ? 'সেটিংস' : 'Settings'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {ja ? 'アカウントとセキュリティの設定を管理する' : bn ? 'আপনার অ্যাকাউন্ট এবং নিরাপত্তা সেটিংস পরিচালনা করুন' : 'Manage your account preferences and security settings.'}
          </p>
        </div>

        <div className="flex gap-6 items-start">

          {/* Sidebar */}
          <div className="hidden sm:block w-52 shrink-0">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-6">
              {/* User mini-card */}
              <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-3">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{user?.name ?? '—'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user?.email ?? '—'}</p>
                  </div>
                </div>
              </div>
              {/* Nav links */}
              <nav className="p-2">
                {nav.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors text-left ${
                      activeSection === item.id
                        ? 'bg-green-50 text-green-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className={activeSection === item.id ? 'text-green-600' : 'text-slate-400'}>
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Mobile tab bar */}
          <div className="sm:hidden w-full mb-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-1.5 flex gap-1">
              {nav.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                    activeSection === item.id ? 'bg-green-600 text-white' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── Profile section ── */}
            {activeSection === 'profile' && (
              <>
                {/* Avatar card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                    <h2 className="font-black text-slate-900 text-sm">
                      {ja ? 'プロフィール写真' : bn ? 'প্রোফাইল ছবি' : 'Profile Picture'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ja ? 'アバター画像を変更する' : bn ? 'আপনার অবতার ছবি পরিবর্তন করুন' : 'Update your avatar image'}
                    </p>
                  </div>
                  <div className="px-6 py-5">
                    {avatarSaved && (
                      <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        {ja ? '写真を更新しました' : bn ? 'ছবি আপডেট হয়েছে' : 'Photo updated successfully'}
                      </div>
                    )}
                    {avatarErr && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{avatarErr}</div>
                    )}
                    <div className="flex items-center gap-5">
                      <div className="shrink-0 relative">
                        {avatarSrc ? (
                          <img src={avatarSrc} alt="avatar" className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-100 shadow-sm" />
                        ) : (
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center text-white text-2xl font-black shadow-sm select-none">
                            {initials}
                          </div>
                        )}
                        {uploadAvatar.isPending && (
                          <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center">
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadAvatar.isPending}
                          className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {uploadAvatar.isPending
                            ? (ja ? 'アップロード中…' : bn ? 'আপলোড হচ্ছে…' : 'Uploading…')
                            : (ja ? '写真を変更する' : bn ? 'ছবি পরিবর্তন করুন' : 'Change Photo')}
                        </button>
                        <p className="text-[11px] text-slate-400 mt-2">
                          {ja ? 'JPG・PNG・WebP、最大2MB' : bn ? 'JPG, PNG বা WebP, সর্বোচ্চ ২ MB' : 'JPG, PNG or WebP · max 2 MB'}
                        </p>
                        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Name card (read-only) */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                    <h2 className="font-black text-slate-900 text-sm">
                      {ja ? '氏名' : bn ? 'নাম' : 'Display Name'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ja ? '表示名（変更は管理者に連絡）' : bn ? 'প্রদর্শন নাম (পরিবর্তনের জন্য সাপোর্টে যোগাযোগ করুন)' : 'Contact support to change your name'}
                    </p>
                  </div>
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">{user?.name ?? '—'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Account section ── */}
            {activeSection === 'account' && (
              <>
                {/* Email (read-only) */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                    <h2 className="font-black text-slate-900 text-sm">
                      {ja ? 'メールアドレス' : bn ? 'ইমেইল ঠিকানা' : 'Email Address'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ja ? 'メール変更はサポートにお問い合わせください。' : bn ? 'ইমেইল পরিবর্তনের জন্য সাপোর্টে যোগাযোগ করুন।' : 'Contact support to change your email address.'}
                    </p>
                  </div>
                  <div className="px-6 py-5">
                    <div className="flex items-center gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{user?.email ?? '—'}</p>
                        {user?.email_verified_at && (
                          <p className="text-[11px] text-green-600 font-medium mt-0.5">✓ {ja ? '確認済み' : bn ? 'যাচাই করা হয়েছে' : 'Verified'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                    <h2 className="font-black text-slate-900 text-sm">
                      {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {ja ? '連絡先の電話番号' : bn ? 'আপনার যোগাযোগের ফোন নম্বর' : 'Your contact phone number'}
                    </p>
                  </div>
                  <div className="px-6 py-5">
                    {contactSaved && (
                      <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Phone number saved'}
                      </div>
                    )}
                    {contactErr && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{contactErr}</div>
                    )}
                    <form onSubmit={e => { e.preventDefault(); saveContact.mutate(); }} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">
                          {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <input
                            type="tel"
                            className="w-full border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            placeholder="+880 1XXX XXXXXX"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={saveContact.isPending}
                        className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {saveContact.isPending
                          ? (ja ? '保存中…' : bn ? 'সেভ হচ্ছে…' : 'Saving…')
                          : (ja ? '電話番号を保存する' : bn ? 'ফোন সংরক্ষণ করুন' : 'Save Phone Number')}
                      </button>
                    </form>
                  </div>
                </div>
              </>
            )}

            {/* ── Security section ── */}
            {activeSection === 'security' && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/40">
                  <h2 className="font-black text-slate-900 text-sm">
                    {ja ? 'パスワード変更' : bn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {ja ? 'パスワードを安全に変更する' : bn ? 'আপনার পাসওয়ার্ড নিরাপদে পরিবর্তন করুন' : 'Keep your account secure with a strong password'}
                  </p>
                </div>
                <div className="px-6 py-5">
                  {pwSaved && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      {ja ? 'パスワードを更新しました' : bn ? 'পাসওয়ার্ড আপডেট হয়েছে' : 'Password updated successfully'}
                    </div>
                  )}
                  {pwErr && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{pwErr}</div>
                  )}
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {(
                      [
                        { key: 'current_password', label: ja ? '現在のパスワード' : bn ? 'বর্তমান পাসওয়ার্ড' : 'Current Password', show: showPw.current, toggle: () => setShowPw(s => ({ ...s, current: !s.current })) },
                        { key: 'password',          label: ja ? '新しいパスワード'   : bn ? 'নতুন পাসওয়ার্ড'       : 'New Password',      show: showPw.new,     toggle: () => setShowPw(s => ({ ...s, new: !s.new })) },
                        { key: 'password_confirmation', label: ja ? 'パスワード確認' : bn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password', show: showPw.confirm, toggle: () => setShowPw(s => ({ ...s, confirm: !s.confirm })) },
                      ] as { key: keyof typeof pw; label: string; show: boolean; toggle: () => void }[]
                    ).map(field => (
                      <div key={field.key}>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">{field.label}</label>
                        <div className="relative">
                          <input
                            type={field.show ? 'text' : 'password'}
                            className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white ${
                              field.key === 'password_confirmation' && pw.password_confirmation && pw.password !== pw.password_confirmation
                                ? 'border-red-300 focus:ring-red-400'
                                : 'border-slate-200'
                            }`}
                            value={pw[field.key]}
                            onChange={e => setPw(p => ({ ...p, [field.key]: e.target.value }))}
                            required
                          />
                          <button type="button" onClick={field.toggle}
                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors">
                            <EyeIcon open={field.show} />
                          </button>
                        </div>
                        {field.key === 'password_confirmation' && pw.password_confirmation && pw.password !== pw.password_confirmation && (
                          <p className="text-[11px] text-red-500 mt-1">
                            {ja ? 'パスワードが一致しません' : bn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}
                          </p>
                        )}
                        {field.key === 'password' && pw.password && pw.password.length < 8 && (
                          <p className="text-[11px] text-amber-500 mt-1">
                            {ja ? '8文字以上必要です' : bn ? 'কমপক্ষে ৮ অক্ষর প্রয়োজন' : 'At least 8 characters required'}
                          </p>
                        )}
                      </div>
                    ))}

                    {/* Password strength hint */}
                    {pw.password && pw.password.length >= 8 && (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex gap-1">
                          {[...Array(4)].map((_, i) => {
                            const strength = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw.password)).length + (pw.password.length >= 8 ? 1 : 0);
                            return <div key={i} className={`w-6 h-1.5 rounded-full ${i < strength ? (strength <= 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-200'}`} />;
                          })}
                        </div>
                        <span className="text-[11px] text-slate-500">{ja ? 'パスワード強度' : bn ? 'পাসওয়ার্ড শক্তি' : 'Password strength'}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={savePassword.isPending || !pw.current_password || !pw.password || !pw.password_confirmation || pw.password !== pw.password_confirmation || pw.password.length < 8}
                      className="px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {savePassword.isPending
                        ? (ja ? '更新中…' : bn ? 'আপডেট হচ্ছে…' : 'Updating…')
                        : (ja ? 'パスワードを変更する' : bn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update Password')}
                    </button>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
