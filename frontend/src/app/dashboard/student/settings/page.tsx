'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

export default function StudentSettingsPage() {
  const { lang } = useLang();
  const { user, fetchMe } = useAuthStore();
  const router = useRouter();
  const ja = lang === 'ja'; const bn = lang === 'bn';

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

  const navItems = [
    { id: 'profile',  label: ja ? 'プロフィール' : bn ? 'প্রোফাইল' : 'Profile' },
    { id: 'account',  label: ja ? 'アカウント'   : bn ? 'অ্যাকাউন্ট' : 'Account' },
    { id: 'security', label: ja ? 'セキュリティ' : bn ? 'নিরাপত্তা'  : 'Security' },
  ];

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const SectionCard = ({ id, title, subtitle, children }: { id: string; title: string; subtitle: string; children: React.ReactNode }) => (
    <div id={id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden scroll-mt-6">
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="font-black text-slate-900 text-sm">{title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );

  const SaveBanner = ({ show, msg }: { show: boolean; msg: string }) => show ? (
    <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
      {msg}
    </div>
  ) : null;

  const ErrBanner = ({ msg }: { msg: string }) => msg ? (
    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{msg}</div>
  ) : null;

  if (!user) return null;

  return (
    <DashboardLayout title={ja ? '設定' : bn ? 'সেটিংস' : 'Settings'}>
      <div className="max-w-5xl flex gap-6 items-start">

        {/* ── Sidebar ── */}
        <div className="hidden sm:block w-52 shrink-0 sticky top-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

            {/* User card */}
            <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-3">
                {avatarSrc ? (
                  <img src={avatarSrc} alt="avatar" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="p-2 space-y-0.5">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-green-50 hover:text-green-700 transition-colors text-left"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* ── Main content — all sections visible ── */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* Profile Picture */}
          <SectionCard
            id="profile"
            title={ja ? 'プロフィール写真' : bn ? 'প্রোফাইল ছবি' : 'Profile Picture'}
            subtitle={ja ? 'アバター画像を変更する' : bn ? 'আপনার অবতার ছবি পরিবর্তন করুন' : 'Update your avatar image'}
          >
            <SaveBanner show={avatarSaved} msg={ja ? '写真を更新しました' : bn ? 'ছবি আপডেট হয়েছে' : 'Photo updated successfully'} />
            <ErrBanner msg={avatarErr} />
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
          </SectionCard>

          {/* Account — email + name (read-only) + phone */}
          <SectionCard
            id="account"
            title={ja ? 'アカウント情報' : bn ? 'অ্যাকাউন্টের তথ্য' : 'Account Info'}
            subtitle={ja ? '基本情報と連絡先を管理する' : bn ? 'আপনার মৌলিক তথ্য এবং যোগাযোগ পরিচালনা করুন' : 'Manage your basic info and contact details'}
          >
            <div className="space-y-4">
              {/* Name read-only */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  {ja ? '氏名' : bn ? 'নাম' : 'Name'}
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-sm text-slate-600">{user.name}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {ja ? '変更はサポートにお問い合わせください。' : bn ? 'নাম পরিবর্তনের জন্য সাপোর্টে যোগাযোগ করুন।' : 'Contact support to change your name.'}
                </p>
              </div>

              {/* Email read-only */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  {ja ? 'メールアドレス' : bn ? 'ইমেইল' : 'Email'}
                </label>
                <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                  <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-slate-600 flex-1 truncate">{user.email}</span>
                  {user.email_verified_at && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full shrink-0">
                      ✓ {ja ? '確認済み' : bn ? 'যাচাইকৃত' : 'Verified'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {ja ? 'メール変更はサポートにお問い合わせください。' : bn ? 'ইমেইল পরিবর্তনের জন্য সাপোর্টে যোগাযোগ করুন।' : 'Contact support to change your email.'}
                </p>
              </div>

              {/* Phone editable */}
              <div>
                <SaveBanner show={contactSaved} msg={ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Phone number saved'} />
                <ErrBanner msg={contactErr} />
                <form onSubmit={e => { e.preventDefault(); saveContact.mutate(); }}>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
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
                    <button
                      type="submit"
                      disabled={saveContact.isPending}
                      className="px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
                    >
                      {saveContact.isPending
                        ? (ja ? '保存中…' : bn ? 'সেভ হচ্ছে…' : 'Saving…')
                        : (ja ? '保存' : bn ? 'সংরক্ষণ' : 'Save')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </SectionCard>

          {/* Security — change password */}
          <SectionCard
            id="security"
            title={ja ? 'パスワード変更' : bn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
            subtitle={ja ? 'パスワードを安全に変更する' : bn ? 'আপনার পাসওয়ার্ড নিরাপদে পরিবর্তন করুন' : 'Keep your account secure with a strong password'}
          >
            <SaveBanner show={pwSaved} msg={ja ? 'パスワードを更新しました' : bn ? 'পাসওয়ার্ড আপডেট হয়েছে' : 'Password updated successfully'} />
            <ErrBanner msg={pwErr} />
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
                          ? 'border-red-300 focus:ring-red-400' : 'border-slate-200'
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
                    <p className="text-[11px] text-red-500 mt-1">{ja ? 'パスワードが一致しません' : bn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}</p>
                  )}
                  {field.key === 'password' && pw.password && pw.password.length < 8 && (
                    <p className="text-[11px] text-amber-500 mt-1">{ja ? '8文字以上必要です' : bn ? 'কমপক্ষে ৮ অক্ষর প্রয়োজন' : 'At least 8 characters required'}</p>
                  )}
                </div>
              ))}

              {pw.password && pw.password.length >= 8 && (
                <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="flex gap-1">
                    {(() => {
                      const strength = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw.password)).length + 1;
                      return [...Array(4)].map((_, i) => (
                        <div key={i} className={`w-6 h-1.5 rounded-full ${i < strength ? (strength <= 2 ? 'bg-amber-400' : 'bg-green-500') : 'bg-slate-200'}`} />
                      ));
                    })()}
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
          </SectionCard>

        </div>
      </div>
    </DashboardLayout>
  );
}
