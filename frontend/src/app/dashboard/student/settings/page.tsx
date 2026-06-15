'use client';
import DashboardLayout from '@/components/shared/DashboardLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

export default function StudentSettingsPage() {
  const { lang } = useLang();
  const { user, fetchMe } = useAuthStore();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const [contact, setContact] = useState({ phone: user?.phone ?? '' });
  const [contactSaved, setContactSaved] = useState(false);
  const [contactErr, setContactErr] = useState('');

  const [pw, setPw] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [pwSaved, setPwSaved] = useState(false);
  const [pwErr, setPwErr] = useState('');

  const saveContact = useMutation({
    mutationFn: () => api.patch('/student/account', { phone: contact.phone }),
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
    mutationFn: () => api.patch('/student/account', pw),
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

  const title = ja ? '設定' : bn ? 'সেটিংস' : 'Settings';

  return (
    <DashboardLayout title={title}>
      <div className="max-w-xl space-y-5">

        {/* Account info (read-only) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h2 className="font-bold text-slate-900 text-sm mb-4">
            {ja ? 'アカウント情報' : bn ? 'অ্যাকাউন্টের তথ্য' : 'Account Info'}
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '氏名' : bn ? 'নাম' : 'Name'}
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
              value={contact.phone}
              onChange={e => setContact({ phone: e.target.value })}
            />
            <button
              type="submit"
              disabled={saveContact.isPending}
              className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
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
          <form onSubmit={e => { e.preventDefault(); savePassword.mutate(); }} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '現在のパスワード' : bn ? 'বর্তমান পাসওয়ার্ড' : 'Current Password'}
              </label>
              <input
                type="password"
                className={inputCls}
                value={pw.current_password}
                onChange={e => setPw(p => ({ ...p, current_password: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? '新しいパスワード' : bn ? 'নতুন পাসওয়ার্ড' : 'New Password'}
              </label>
              <input
                type="password"
                className={inputCls}
                value={pw.password}
                onChange={e => setPw(p => ({ ...p, password: e.target.value }))}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {ja ? 'パスワード確認' : bn ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
              </label>
              <input
                type="password"
                className={inputCls}
                value={pw.password_confirmation}
                onChange={e => setPw(p => ({ ...p, password_confirmation: e.target.value }))}
                required
              />
            </div>
            <button
              type="submit"
              disabled={savePassword.isPending || !pw.current_password || !pw.password || !pw.password_confirmation}
              className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
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
