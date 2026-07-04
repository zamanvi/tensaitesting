'use client';
import StudentLayout from '@/components/shared/StudentLayout';
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

function Alert({ type, msg }: { type: 'success' | 'error'; msg: string }) {
  return (
    <div className={`mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border ${
      type === 'success'
        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
        : 'bg-rose-50 border-rose-200 text-rose-600'
    }`}>
      {type === 'success'
        ? <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
        : <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
      {msg}
    </div>
  );
}

const NAV_ITEMS = [
  {
    id: 'profile',
    labelEn: 'Profile', labelJa: 'プロフィール', labelBn: 'প্রোফাইল',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  },
  {
    id: 'account',
    labelEn: 'Account', labelJa: 'アカウント', labelBn: 'অ্যাকাউন্ট',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  },
  {
    id: 'security',
    labelEn: 'Security', labelJa: 'セキュリティ', labelBn: 'নিরাপত্তা',
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
  },
];

const inp = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 bg-white transition-shadow';
const lbl = 'block text-xs font-semibold text-slate-500 mb-1.5';

export default function StudentSettingsPage() {
  const { lang } = useLang();
  const { user, fetchMe } = useAuthStore();
  const router = useRouter();
  const ja = lang === 'ja'; const bn = lang === 'bn';
  const t = (en: string, ja_: string, bn_: string) => ja ? ja_ : bn ? bn_ : en;

  useEffect(() => {
    if (user && user.gateway_type !== 'student') router.replace('/dashboard');
  }, [user, router]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarErr, setAvatarErr]         = useState('');
  const [avatarSaved, setAvatarSaved]     = useState(false);

  const [phone, setPhone]           = useState('');
  const [contactSaved, setContactSaved] = useState(false);
  const [contactErr, setContactErr]     = useState('');
  useEffect(() => { setPhone(user?.phone ?? ''); }, [user?.phone]);

  const [pw, setPw]         = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwErr, setPwErr]     = useState('');
  const [showPw, setShowPw]   = useState({ current: false, next: false, confirm: false });

  const [activeSection, setActiveSection] = useState('profile');
  useEffect(() => {
    const obs = NAV_ITEMS.map(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const o = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActiveSection(id); },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      );
      o.observe(el);
      return o;
    });
    return () => obs.forEach(o => o?.disconnect());
  }, []);

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return api.post('/student/account/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { fetchMe().catch(() => {}); setAvatarSaved(true); setAvatarErr(''); setTimeout(() => setAvatarSaved(false), 3000); },
    onError:   (e: unknown) => { const ax = e as { response?: { data?: { message?: string } } }; setAvatarErr(ax.response?.data?.message ?? 'Upload failed.'); },
  });

  const saveContact = useMutation({
    mutationFn: () => api.patch('/student/account', { phone }),
    onSuccess: () => { fetchMe().catch(() => {}); setContactSaved(true); setContactErr(''); setTimeout(() => setContactSaved(false), 3000); },
    onError:   (e: unknown) => { const ax = e as { response?: { data?: { message?: string } } }; setContactErr(ax.response?.data?.message ?? 'Failed to save.'); },
  });

  const savePassword = useMutation({
    mutationFn: () => api.patch('/student/account', pw),
    onSuccess: () => { setPwSaved(true); setPwErr(''); setPw({ current_password: '', password: '', password_confirmation: '' }); setTimeout(() => setPwSaved(false), 3000); },
    onError:   (e: unknown) => { const ax = e as { response?: { data?: { message?: string } } }; setPwErr(ax.response?.data?.message ?? 'Failed to update password.'); },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setAvatarErr(t('File must be under 2 MB.', 'ファイルは2MB以内にしてください。', 'ফাইল ২ MB এর মধ্যে হতে হবে।')); return; }
    setAvatarErr('');
    setAvatarPreview(URL.createObjectURL(file));
    uploadAvatar.mutate(file);
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.password.length < 8) { setPwErr(t('Password must be at least 8 characters.', '8文字以上必要です。', 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।')); return; }
    if (pw.password !== pw.password_confirmation) { setPwErr(t('Passwords do not match.', 'パスワードが一致しません。', 'পাসওয়ার্ড মিলছে না।')); return; }
    setPwErr(''); savePassword.mutate();
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const initials  = (user?.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarSrc = avatarPreview ?? (user as unknown as { avatar_url?: string })?.avatar_url ?? null;

  // Password strength: 1–4
  const pwStrength = pw.password.length === 0 ? 0 :
    1 + [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw.password)).length +
    (pw.password.length >= 12 ? 1 : 0);
  const strengthClamped = Math.min(pwStrength, 4) as 0 | 1 | 2 | 3 | 4;
  const strengthLabel = ['', t('Weak','弱い','দুর্বল'), t('Fair','まあまあ','মাঝারি'), t('Good','良い','ভালো'), t('Strong','強い','শক্তিশালী')][strengthClamped];
  const strengthColor = [,'bg-rose-400','bg-amber-400','bg-green-400','bg-green-600'][strengthClamped];

  const pwValid = pw.current_password.length > 0 && pw.password.length >= 8 && pw.password === pw.password_confirmation;

  if (!user) return null;

  return (
    <StudentLayout title={t('Settings', '設定', 'সেটিংস')}>

      {/* Mobile tab bar */}
      <div className="sm:hidden flex gap-1 bg-white border border-slate-200 rounded-xl p-1 mb-4 shadow-sm">
        {NAV_ITEMS.map(item => {
          const active = activeSection === item.id;
          return (
            <button key={item.id} onClick={() => scrollTo(item.id)}
              className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-colors ${
                active ? 'bg-green-700 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}>
              {t(item.labelEn, item.labelJa, item.labelBn)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col sm:flex-row gap-5 items-start">

        {/* Sidebar */}
        <aside className="hidden sm:flex flex-col w-56 shrink-0 sticky top-6">
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {/* User card */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 bg-slate-50/60">
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center text-white text-sm font-black shrink-0 select-none">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
              </div>
            </div>
            {/* Nav */}
            <div className="py-1.5">
              <p className="px-4 pt-2 pb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {t('Settings', '設定', 'সেটিংস')}
              </p>
              {NAV_ITEMS.map(item => {
                const active = activeSection === item.id;
                return (
                  <button key={item.id} onClick={() => scrollTo(item.id)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors text-left relative ${
                      active ? 'bg-green-50 text-green-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}>
                    {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-green-600 rounded-r" />}
                    <svg className={`w-4 h-4 shrink-0 ${active ? 'text-green-600' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {item.icon}
                    </svg>
                    {t(item.labelEn, item.labelJa, item.labelBn)}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main sections */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── Profile Picture ── */}
          <section id="profile" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden scroll-mt-16">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-sm font-semibold text-slate-800">
                {t('Profile Picture', 'プロフィール写真', 'প্রোফাইল ছবি')}
              </h2>
            </div>
            <div className="px-4 sm:px-6 py-6">
              {avatarSaved && <Alert type="success" msg={t('Photo updated successfully', '写真を更新しました', 'ছবি আপডেট হয়েছে')} />}
              {avatarErr   && <Alert type="error"   msg={avatarErr} />}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt="avatar" className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-700 flex items-center justify-center text-white text-3xl font-black shadow-sm select-none">
                      {initials}
                    </div>
                  )}
                  {uploadAvatar.isPending && (
                    <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center">
                      <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                {/* Upload info */}
                <div>
                  <p className="text-sm font-bold text-slate-800 mb-0.5">{user.name}</p>
                  <p className="text-xs text-slate-400 mb-3">{user.email}</p>
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadAvatar.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shadow-sm min-h-[44px]">
                    {uploadAvatar.isPending ? (
                      <><span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('Uploading…','アップロード中…','আপলোড হচ্ছে…')}</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>{t('Change Photo','写真を変更','ছবি পরিবর্তন করুন')}</>
                    )}
                  </button>
                  <p className="text-[11px] text-slate-400 mt-2">JPG, PNG or WebP · max 2 MB</p>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
                </div>
              </div>
            </div>
          </section>

          {/* ── Account Info ── */}
          <section id="account" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden scroll-mt-16">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <h2 className="text-sm font-semibold text-slate-800">
                {t('Account Info', 'アカウント情報', 'অ্যাকাউন্টের তথ্য')}
              </h2>
            </div>
            <div className="px-4 sm:px-6 py-6 space-y-5">

              {/* Name + Email (read-only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={lbl}>{t('Name', '氏名', 'নাম')}</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="truncate flex-1">{user.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{t('Contact support to change','変更はサポートへ','পরিবর্তনের জন্য সাপোর্টে যোগাযোগ করুন')}</p>
                </div>
                <div>
                  <label className={lbl}>{t('Email Address', 'メールアドレス', 'ইমেইল')}</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                    <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate flex-1 text-xs">{user.email}</span>
                    {(user as unknown as { email_verified_at?: string })?.email_verified_at && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full shrink-0">
                        ✓ {t('Verified','認証済み','যাচাই হয়েছে')}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{t('Contact support to change','変更はサポートへ','পরিবর্তনের জন্য সাপোর্টে যোগাযোগ করুন')}</p>
                </div>
              </div>

              {/* Phone number */}
              <div>
                {contactSaved && <Alert type="success" msg={t('Phone number saved','保存しました','ফোন নম্বর সংরক্ষিত হয়েছে')} />}
                {contactErr   && <Alert type="error"   msg={contactErr} />}
                <label className={lbl}>{t('Phone Number','電話番号','ফোন নম্বর')}</label>
                <form onSubmit={e => { e.preventDefault(); saveContact.mutate(); }} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </span>
                    <input type="tel" className={`${inp} pl-9`} placeholder="+880 1XXX XXXXXX"
                      value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <button type="submit" disabled={saveContact.isPending}
                    className="min-h-[44px] px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 whitespace-nowrap shadow-sm">
                    {saveContact.isPending ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    ) : t('Save','保存','সংরক্ষণ')}
                  </button>
                </form>
              </div>
            </div>
          </section>

          {/* ── Security / Change Password ── */}
          <section id="security" className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden scroll-mt-16">
            <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <h2 className="text-sm font-semibold text-slate-800">{t('Security','セキュリティ','নিরাপত্তা')}</h2>
                <p className="text-[11px] text-slate-400">{t('Change your password','パスワードを変更','পাসওয়ার্ড পরিবর্তন করুন')}</p>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-6">
              {pwSaved && <Alert type="success" msg={t('Password updated successfully','パスワードを更新しました','পাসওয়ার্ড আপডেট হয়েছে')} />}
              {pwErr   && <Alert type="error"   msg={pwErr} />}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current + New on same row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={lbl}>{t('Current Password','現在のパスワード','বর্তমান পাসওয়ার্ড')}</label>
                    <div className="relative">
                      <input type={showPw.current ? 'text' : 'password'} className={`${inp} pr-10`}
                        placeholder="••••••••"
                        value={pw.current_password}
                        onChange={e => setPw(p => ({ ...p, current_password: e.target.value }))} required />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                        <EyeIcon open={showPw.current} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={lbl}>{t('New Password','新しいパスワード','নতুন পাসওয়ার্ড')}</label>
                    <div className="relative">
                      <input type={showPw.next ? 'text' : 'password'} className={`${inp} pr-10`}
                        placeholder="••••••••"
                        value={pw.password}
                        onChange={e => setPw(p => ({ ...p, password: e.target.value }))} required />
                      <button type="button" onClick={() => setShowPw(s => ({ ...s, next: !s.next }))}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                        <EyeIcon open={showPw.next} />
                      </button>
                    </div>
                    {pw.password.length > 0 && pw.password.length < 8 && (
                      <p className="text-[11px] text-amber-500 mt-1">
                        {t('At least 8 characters required','8文字以上必要です','কমপক্ষে ৮ অক্ষর প্রয়োজন')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Confirm — full width */}
                <div>
                  <label className={lbl}>{t('Confirm New Password','パスワード確認','পাসওয়ার্ড নিশ্চিত করুন')}</label>
                  <div className="relative">
                    <input type={showPw.confirm ? 'text' : 'password'}
                      className={`${inp} pr-10 ${
                        pw.password_confirmation && pw.password !== pw.password_confirmation
                          ? 'border-rose-300 focus:ring-rose-400/40'
                          : pw.password_confirmation && pw.password === pw.password_confirmation
                          ? 'border-emerald-300 focus:ring-emerald-400/40'
                          : ''
                      }`}
                      placeholder="••••••••"
                      value={pw.password_confirmation}
                      onChange={e => setPw(p => ({ ...p, password_confirmation: e.target.value }))} required />
                    <button type="button" onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                      <EyeIcon open={showPw.confirm} />
                    </button>
                  </div>
                  {pw.password_confirmation && pw.password !== pw.password_confirmation && (
                    <p className="text-[11px] text-rose-500 mt-1">
                      {t('Passwords do not match','パスワードが一致しません','পাসওয়ার্ড মিলছে না')}
                    </p>
                  )}
                  {pw.password_confirmation && pw.password === pw.password_confirmation && pw.password.length >= 8 && (
                    <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/></svg>
                      {t('Passwords match','パスワードが一致しています','পাসওয়ার্ড মিলেছে')}
                    </p>
                  )}
                </div>

                {/* Strength bar */}
                {pw.password.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i <= strengthClamped ? strengthColor : 'bg-slate-200'}`} />
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {t('Password strength','パスワード強度','পাসওয়ার্ড শক্তি')}: <span className="font-semibold text-slate-600">{strengthLabel}</span>
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 pt-1">
                  <button type="submit" disabled={savePassword.isPending || !pwValid}
                    className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-40 shadow-sm">
                    {savePassword.isPending ? (
                      <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('Updating…','更新中…','আপডেট হচ্ছে…')}</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('Update Password','パスワードを変更','পাসওয়ার্ড আপডেট করুন')}</>
                    )}
                  </button>
                  <button type="button" onClick={() => { setPw({ current_password: '', password: '', password_confirmation: '' }); setPwErr(''); }}
                    className="min-h-[44px] px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                    {t('Cancel','キャンセル','বাতিল')}
                  </button>
                </div>
              </form>
            </div>
          </section>

        </div>
      </div>
    </StudentLayout>
  );
}
