'use client';
import AgencyLayout from '@/components/shared/AgencyLayout';
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
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarOk,      setAvatarOk]      = useState(false);
  const [avatarErr,     setAvatarErr]     = useState('');
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

  function clearAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarErr('');
    if (fileRef.current) fileRef.current.value = '';
  }

  const avatarMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('avatar', avatarFile!);
      return api.post('/agency/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => {
      setAvatarOk(true); setAvatarErr('');
      clearAvatar();
      fetchMe();
      qc.invalidateQueries({ queryKey: ['agency-profile'] });
      setTimeout(() => setAvatarOk(false), 3000);
    },
    onError: () => setAvatarErr(ja ? 'アップロードに失敗しました。' : bn ? 'আপলোড ব্যর্থ হয়েছে।' : 'Upload failed.'),
  });

  // ── Phone ─────────────────────────────────────────────────
  const [phone,    setPhone]    = useState('');
  const [phoneOk,  setPhoneOk]  = useState(false);
  const [phoneErr, setPhoneErr] = useState('');

  // Sync phone from user when user loads/changes
  useEffect(() => { setPhone(user?.phone ?? ''); }, [user?.phone]);

  const phoneMutation = useMutation({
    mutationFn: () => api.patch('/agency/settings', { phone }),
    onSuccess: () => {
      setPhoneOk(true); setPhoneErr('');
      fetchMe();
      setTimeout(() => setPhoneOk(false), 3000);
    },
    onError: () => setPhoneErr(ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save.'),
  });

  // ── Password ───────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwOk,   setPwOk]   = useState(false);
  const [pwErr,  setPwErr]  = useState('');

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

  function handleChangePassword() {
    setPwErr('');
    if (pwForm.password !== pwForm.password_confirmation) {
      setPwErr(ja ? '新しいパスワードが一致しません。' : bn ? 'নতুন পাসওয়ার্ড মিলছে না।' : 'New passwords do not match.');
      return;
    }
    if (pwForm.password.length < 8) {
      setPwErr(ja ? 'パスワードは8文字以上必要です。' : bn ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।' : 'Password must be at least 8 characters.');
      return;
    }
    pwMutation.mutate();
  }

  if (!user || user.gateway_type !== 'agency') return null;

  return (
    <AgencyLayout title={ja ? 'アカウント設定' : bn ? 'অ্যাকাউন্ট সেটিংস' : 'Account Settings'}>
      <div className="max-w-xl space-y-5">

        {/* Page heading */}
        <div className="mb-2">
          <h1 className="text-2xl font-black text-slate-900">
            {ja ? 'アカウント設定' : bn ? 'অ্যাকাউন্ট সেটিংস' : 'Account Settings'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {ja ? 'プロフィール・セキュリティ設定' : bn ? 'প্রোফাইল ও নিরাপত্তা সেটিংস' : 'Manage your profile and security'}
          </p>
        </div>

        {/* Account Info (read-only) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            👤 {ja ? 'アカウント情報' : bn ? 'অ্যাকাউন্ট তথ্য' : 'Account Info'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-[11px] text-slate-400 mb-0.5">{ja ? '名前' : bn ? 'নাম' : 'Name'}</p>
              <p className="text-sm font-semibold text-slate-800">{user.name || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-[11px] text-slate-400 mb-0.5">{ja ? 'メールアドレス' : bn ? 'ইমেইল' : 'Email'}</p>
              <p className="text-sm font-semibold text-slate-800 truncate">{user.email || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-[11px] text-slate-400 mb-0.5">{ja ? 'ロール' : bn ? 'ভূমিকা' : 'Role'}</p>
              <p className="text-sm font-semibold text-slate-800 capitalize">{user.roles?.join(', ') || 'Agency'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50">
              <p className="text-[11px] text-slate-400 mb-0.5">{ja ? 'ステータス' : bn ? 'স্ট্যাটাস' : 'Status'}</p>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {ja ? 'アクティブ' : bn ? 'সক্রিয়' : 'Active'}
              </span>
            </div>
          </div>
        </div>

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
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => fileRef.current?.click()}
                  className="px-4 py-2 text-xs font-bold border border-slate-200 hover:border-slate-300 rounded-xl text-slate-600 hover:text-slate-800 transition-colors">
                  {ja ? '写真を選択' : bn ? 'ছবি বেছে নিন' : 'Choose Photo'}
                </button>
                {avatarFile && (
                  <>
                    <button onClick={() => avatarMutation.mutate()} disabled={avatarMutation.isPending}
                      className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                      {avatarMutation.isPending ? '...' : (ja ? 'アップロード' : bn ? 'আপলোড করুন' : 'Upload')}
                    </button>
                    <button onClick={clearAvatar}
                      className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                      {ja ? 'キャンセル' : bn ? 'বাতিল' : 'Cancel'}
                    </button>
                  </>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">JPG, PNG · {ja ? '最大2MB' : bn ? 'সর্বোচ্চ ২ MB' : 'Max 2 MB'}</p>
            </div>
          </div>
          {avatarOk  && <p className="text-xs text-emerald-600 font-semibold mt-2">✓ {ja ? '更新しました' : bn ? 'আপডেট হয়েছে' : 'Updated'}</p>}
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
          {phoneOk  && <p className="text-xs text-emerald-600 font-semibold mt-2">✓ {ja ? '保存しました' : bn ? 'সংরক্ষিত হয়েছে' : 'Saved'}</p>}
          {phoneErr && <p className="text-xs text-red-500 mt-2">{phoneErr}</p>}
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
            🔒 {ja ? 'パスワード変更' : bn ? 'পাসওয়ার্ড পরিবর্তন' : 'Change Password'}
          </h3>
          <div className="space-y-3">
            {[
              { k: 'current_password'      as const, label: ja ? '現在のパスワード'          : bn ? 'বর্তমান পাসওয়ার্ড'      : 'Current Password' },
              { k: 'password'              as const, label: ja ? '新しいパスワード'           : bn ? 'নতুন পাসওয়ার্ড'         : 'New Password' },
              { k: 'password_confirmation' as const, label: ja ? '新しいパスワード（確認）'   : bn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password' },
            ].map(({ k, label }) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
                <input type="password" className={inputCls} placeholder="••••••••"
                  value={pwForm[k]} onChange={e => setPw(k, e.target.value)} />
              </div>
            ))}
          </div>
          {/* Client-side match warning */}
          {pwForm.password && pwForm.password_confirmation && pwForm.password !== pwForm.password_confirmation && (
            <p className="text-xs text-amber-600 font-semibold mt-2">
              ⚠ {ja ? 'パスワードが一致しません' : bn ? 'পাসওয়ার্ড মিলছে না' : 'Passwords do not match'}
            </p>
          )}
          {pwOk  && <p className="text-xs text-emerald-600 font-semibold mt-3">✓ {ja ? 'パスワードを変更しました' : bn ? 'পাসওয়ার্ড পরিবর্তিত হয়েছে' : 'Password changed'}</p>}
          {pwErr && <p className="text-xs text-red-500 mt-3">{pwErr}</p>}
          <button
            onClick={handleChangePassword}
            disabled={
              pwMutation.isPending ||
              !pwForm.current_password ||
              !pwForm.password ||
              !pwForm.password_confirmation ||
              pwForm.password !== pwForm.password_confirmation
            }
            className="mt-4 w-full py-2.5 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {pwMutation.isPending
              ? (ja ? '変更中...' : bn ? 'পরিবর্তন হচ্ছে...' : 'Changing...')
              : (ja ? 'パスワードを変更する' : bn ? 'পাসওয়ার্ড পরিবর্তন করুন' : 'Change Password')}
          </button>
        </div>

      </div>
    </AgencyLayout>
  );
}
