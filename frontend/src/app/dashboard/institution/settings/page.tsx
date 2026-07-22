'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
    </svg>
  );
}

function PasswordInput({ value, onChange, placeholder, label, required: req }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  label: string; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={`${inputCls} pr-10`}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={req}
          autoComplete="new-password"
        />
        <button type="button" onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
          <EyeIcon open={show} />
        </button>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  active:    { label: { en: 'Verified', ja: '認証済み', bn: 'যাচাইকৃত' }, cls: 'bg-green-100 text-green-700' },
  pending:   { label: { en: 'Pending Verification', ja: '審査中', bn: 'যাচাই বাকি' }, cls: 'bg-amber-100 text-amber-700' },
  suspended: { label: { en: 'Suspended', ja: '停止中', bn: 'স্থগিত' }, cls: 'bg-red-100 text-red-700' },
} as const;

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

  // Contact
  const [phone, setPhone]       = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  useEffect(() => {
    setPhone(user?.phone ?? '');
    setWhatsapp(user?.whatsapp ?? '');
  }, [user?.phone, user?.whatsapp]);
  const [contactSaved, setContactSaved] = useState(false);
  const [contactErr,   setContactErr]   = useState('');

  // Password
  const [pw, setPw]     = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwErr,   setPwErr]   = useState('');

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return api.post('/institution/account/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { fetchMe().catch(() => {}); setAvatarSaved(true); setAvatarErr(''); setTimeout(() => setAvatarSaved(false), 3000); },
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
    mutationFn: () => api.patch('/institution/account', { phone: phone || null, whatsapp: whatsapp || null }),
    onSuccess: () => { fetchMe().catch(() => {}); setContactSaved(true); setContactErr(''); setTimeout(() => setContactSaved(false), 3000); },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setContactErr(err.response?.data?.message ?? (ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save.'));
    },
  });

  const savePassword = useMutation({
    mutationFn: () => api.patch('/institution/account', pw),
    onSuccess: () => {
      setPwSaved(true); setPwErr('');
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

  const initials  = (user?.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarSrc = avatarPreview ?? user?.avatar_url ?? null;
  const profileStatus = user?.institution_status ?? 'pending';
  const statusCfg = STATUS_CONFIG[profileStatus] ?? STATUS_CONFIG.pending;

  return (
    <DashboardLayout title={ja ? '設定' : bn ? 'সেটিংস' : 'Settings'}>
      <div className="max-w-xl space-y-5">

        {/* ── Account Avatar ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? 'アカウントアバター' : bn ? 'অ্যাকাউন্ট অবতার' : 'Account Avatar'}
          </h2>
          <div className="flex items-center gap-5">
            <div className="shrink-0 relative">
              {avatarSrc
                ? <img src={avatarSrc} alt="avatar" className="w-20 h-20 rounded-full object-cover border-2 border-slate-100" />
                : <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-2xl font-bold select-none">{initials}</div>
              }
              {uploadAvatar.isPending && (
                <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">…</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {avatarSaved && (
                <div className="mb-2 p-2 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
                  ✅ {ja ? '写真を更新しました' : bn ? 'ছবি আপডেট হয়েছে' : 'Photo updated'}
                </div>
              )}
              {avatarErr && <div className="mb-2 p-2 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {avatarErr}</div>}
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadAvatar.isPending}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
                {uploadAvatar.isPending
                  ? (ja ? 'アップロード中…' : bn ? 'আপলোড হচ্ছে…' : 'Uploading…')
                  : avatarSrc
                    ? (ja ? '写真を変更する' : bn ? 'ছবি পরিবর্তন করুন' : 'Change Photo')
                    : (ja ? '写真をアップロード' : bn ? 'ছবি আপলোড করুন' : 'Upload Photo')}
              </button>
              <p className="text-[11px] text-slate-400 mt-1.5">
                {ja ? 'JPG・PNG、最大2MB。機関ロゴはプロフィールページで設定できます。'
                  : bn ? 'JPG বা PNG, সর্বোচ্চ ২ MB। প্রতিষ্ঠানের লোগো প্রোফাইল পেজে আপলোড করুন।'
                  : 'JPG or PNG, max 2 MB. Institution logo is set on the Profile page.'}
              </p>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        </div>

        {/* ── Account Info ── */}
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
              <p className="text-[11px] text-slate-400 mt-1">
                {ja ? '名前の変更はサポートにお問い合わせください。' : bn ? 'নাম পরিবর্তনের জন্য সাপোর্টে যোগাযোগ করুন।' : 'To change your name, contact support.'}
              </p>
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
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? 'アカウントステータス' : bn ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}
              </label>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${statusCfg.cls}`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                  {ja ? statusCfg.label.ja : bn ? statusCfg.label.bn : statusCfg.label.en}
                </span>
                {profileStatus === 'pending' && (
                  <span className="text-[11px] text-slate-400">
                    {ja ? '— 管理者が審査中です' : bn ? '— অ্যাডমিন যাচাই করছেন' : '— Admin is reviewing your profile'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 text-sm mb-1">
            {ja ? '連絡先' : bn ? 'যোগাযোগ' : 'Contact'}
          </h2>
          <p className="text-xs text-slate-400 mb-4">
            {ja ? 'Tensaiマネージャーからの連絡に使用されます。' : bn ? 'Tensai ম্যানেজার আপনার সাথে এই নম্বরে যোগাযোগ করবে।' : 'Used by Tensai managers to reach you directly.'}
          </p>
          {contactSaved && (
            <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
              ✅ {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Saved successfully'}
            </div>
          )}
          {contactErr && <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {contactErr}</div>}
          <form onSubmit={e => { e.preventDefault(); saveContact.mutate(); }} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '電話番号' : bn ? 'ফোন নম্বর' : 'Phone Number'}
                {user?.phone && <span className="ml-2 font-normal text-slate-400 normal-case tracking-normal">{ja ? '現在：' : bn ? 'এখন: ' : 'Current: '}{user.phone}</span>}
              </label>
              <input type="tel" className={inputCls} placeholder="+880 1XXX XXXXXX"
                value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                WhatsApp
                {user?.whatsapp && (
                  <span className="ml-2 font-normal text-slate-400 normal-case tracking-normal">
                    {ja ? '現在：' : bn ? 'এখন: ' : 'Current: '}{user.whatsapp}
                  </span>
                )}
              </label>
              <input type="tel" className={inputCls} placeholder="+81 90-0000-0000"
                value={whatsapp} onChange={e => setWhatsapp(e.target.value)} />
              <p className="text-[11px] text-slate-400 mt-1">
                {ja ? 'Tensaiチームがこの番号にWhatsAppで連絡する場合があります。' : bn ? 'Tensai টিম এই নম্বরে WhatsApp করতে পারে।' : 'Tensai team may contact you via WhatsApp on this number.'}
              </p>
            </div>
            <button type="submit" disabled={saveContact.isPending}
              className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
              {saveContact.isPending
                ? (ja ? '保存中…' : bn ? 'সেভ হচ্ছে…' : 'Saving…')
                : (ja ? '連絡先を保存する' : bn ? 'যোগাযোগ সংরক্ষণ করুন' : 'Save Contact Info')}
            </button>
          </form>
        </div>

        {/* ── Password ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? 'パスワード変更' : bn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
          </h2>
          {pwSaved && (
            <div className="mb-3 p-3 bg-green-50 border border-green-100 rounded-xl text-xs text-green-700 font-medium">
              ✅ {ja ? 'パスワードを更新しました' : bn ? 'পাসওয়ার্ড আপডেট হয়েছে' : 'Password updated successfully'}
            </div>
          )}
          {pwErr && <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {pwErr}</div>}
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <PasswordInput
              label={ja ? '現在のパスワード' : bn ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
              value={pw.current_password}
              onChange={v => setPw(p => ({ ...p, current_password: v }))}
              required
            />
            <PasswordInput
              label={ja ? '新しいパスワード' : bn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              value={pw.password}
              onChange={v => setPw(p => ({ ...p, password: v }))}
              required
            />
            <div>
              <PasswordInput
                label={ja ? 'パスワード確認' : bn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                value={pw.password_confirmation}
                onChange={v => setPw(p => ({ ...p, password_confirmation: v }))}
                required
              />
              {pw.password_confirmation && pw.password !== pw.password_confirmation && (
                <p className="text-[11px] text-red-500 mt-1">
                  {ja ? 'パスワードが一致しません' : bn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}
                </p>
              )}
            </div>
            <button type="submit"
              disabled={savePassword.isPending || !pw.current_password || !pw.password || !pw.password_confirmation || pw.password !== pw.password_confirmation}
              className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50">
              {savePassword.isPending
                ? (ja ? '更新中…' : bn ? 'আপডেট হচ্ছে…' : 'Updating…')
                : (ja ? 'パスワードを変更する' : bn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Update Password')}
            </button>
          </form>
        </div>

        {/* ── Danger zone ── */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
          <h2 className="font-bold text-red-700 text-sm mb-1">
            {ja ? 'アカウント削除' : bn ? 'অ্যাকাউন্ট মুছুন' : 'Close Account'}
          </h2>
          <p className="text-xs text-slate-500 mb-3">
            {ja ? 'アカウントを削除する場合はサポートにご連絡ください。' : bn ? 'অ্যাকাউন্ট বন্ধ করতে সাপোর্টে যোগাযোগ করুন।' : 'To close your account, please contact our support team.'}
          </p>
          <a href="mailto:support@tensai.com"
            className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold transition-colors">
            ✉️ {ja ? 'サポートに連絡' : bn ? 'সাপোর্টে যোগাযোগ করুন' : 'Contact Support'}
          </a>
        </div>

      </div>
    </DashboardLayout>
  );
}
