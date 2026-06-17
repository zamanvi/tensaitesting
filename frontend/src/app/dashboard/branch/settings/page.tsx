'use client';
import BranchLayout from '@/components/shared/BranchLayout';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useLang } from '@/context/LanguageContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface BranchSettings {
  name: string;
  tagline: string | null;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  google_maps_url: string | null;
  working_hours: Record<string, string> | null;
  social_links: Record<string, string> | null;
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500';

export default function BranchSettingsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const { lang } = useLang();
  const ja = lang === 'ja'; const bn = lang === 'bn';

  const isBranchAdmin = user?.roles?.some(r => r === 'branch_admin' || r === 'branch_manager');
  useEffect(() => {
    if (user && !isBranchAdmin) router.replace(`/dashboard/${user.gateway_type ?? ''}`);
  }, [user, isBranchAdmin, router]);

  const [form, setForm] = useState({
    tagline: '', description: '', address: '', phone: '', whatsapp: '', google_maps_url: '',
  });
  const [workingHours, setWorkingHours] = useState<Record<string, string>>({});
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState('');

  const { data: settings, isLoading } = useQuery<BranchSettings>({
    queryKey: ['branch-settings'],
    queryFn: () => api.get('/branch-admin/settings').then(r => r.data),
    enabled: !!isBranchAdmin,
  });

  useEffect(() => {
    if (settings) {
      setForm({
        tagline:         settings.tagline         ?? '',
        description:     settings.description     ?? '',
        address:         settings.address         ?? '',
        phone:           settings.phone           ?? '',
        whatsapp:        settings.whatsapp        ?? '',
        google_maps_url: settings.google_maps_url ?? '',
      });
      setWorkingHours(settings.working_hours ?? { 'Mon - Fri': '9:00 AM – 6:00 PM', Saturday: '10:00 AM – 2:00 PM', Sunday: 'Closed' });
      setSocialLinks(settings.social_links ?? {});
    }
  }, [settings]);

  const save = useMutation({
    mutationFn: () => api.patch('/branch-admin/settings', { ...form, working_hours: workingHours, social_links: socialLinks }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branch-settings'] });
      qc.invalidateQueries({ queryKey: ['my-branch'] });
      setSaved(true);
      setSaveErr('');
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { message?: string } } };
      setSaveErr(err.response?.data?.message ?? (ja ? '保存に失敗しました。' : bn ? 'সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save settings.'));
    },
  });

  // Working hours helpers
  function updateHourKey(oldKey: string, newKey: string) {
    setWorkingHours(prev => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) next[k === oldKey ? newKey : k] = v;
      return next;
    });
  }
  function updateHourVal(key: string, val: string) { setWorkingHours(prev => ({ ...prev, [key]: val })); }
  function addHourRow() { setWorkingHours(prev => ({ ...prev, '': '' })); }
  function removeHourRow(key: string) { setWorkingHours(prev => { const n = { ...prev }; delete n[key]; return n; }); }

  // Social links helpers
  function updateSocialKey(oldKey: string, newKey: string) {
    setSocialLinks(prev => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) next[k === oldKey ? newKey : k] = v;
      return next;
    });
  }
  function updateSocialVal(key: string, val: string) { setSocialLinks(prev => ({ ...prev, [key]: val })); }
  function addSocialRow() { setSocialLinks(prev => ({ ...prev, '': '' })); }
  function removeSocialRow(key: string) { setSocialLinks(prev => { const n = { ...prev }; delete n[key]; return n; }); }

  if (!user || !isBranchAdmin) return null;

  const title = ja ? '支局設定' : bn ? 'শাখা সেটিংস' : 'Branch Settings';

  return (
    <BranchLayout title={title}>
      {isLoading ? (
        <div className="text-center py-12 text-slate-400 text-sm">{ja ? '読み込み中...' : bn ? 'লোড হচ্ছে...' : 'Loading...'}</div>
      ) : (
        <form onSubmit={e => { e.preventDefault(); save.mutate(); }} className="space-y-6 max-w-2xl">

          {saved && (
            <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 font-medium">
              ✅ {ja ? '設定を保存しました' : bn ? 'সেটিংস সংরক্ষিত হয়েছে' : 'Settings saved successfully'}
            </div>
          )}
          {saveErr && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
              ⚠️ {saveErr}
            </div>
          )}

          {/* Branch name (read-only) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 text-sm mb-4">{ja ? '支局情報' : bn ? 'শাখার তথ্য' : 'Branch Info'}</h2>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '支局名' : bn ? 'শাখার নাম' : 'Branch Name'}</label>
              <div className="px-3 py-2.5 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100">{settings?.name ?? '—'}</div>
              <p className="text-[11px] text-slate-400 mt-1">{ja ? '支局名の変更はシステム管理者にお問い合わせください。' : bn ? 'শাখার নাম পরিবর্তনের জন্য সিস্টেম অ্যাডমিনের সাথে যোগাযোগ করুন।' : 'Contact system admin to change the branch name.'}</p>
            </div>
            <div className="mb-3">
              <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? 'キャッチフレーズ' : bn ? 'ট্যাগলাইন' : 'Tagline'}</label>
              <input className={inputCls} placeholder="e.g. Your gateway to Japan from Dhaka" value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '支局の説明' : bn ? 'বিবরণ' : 'Description'}</label>
              <textarea className={`${inputCls} resize-none`} rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="font-bold text-slate-900 text-sm mb-4">{ja ? '連絡先' : bn ? 'যোগাযোগ' : 'Contact'}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '住所' : bn ? 'ঠিকানা' : 'Address'}</label>
                <textarea className={`${inputCls} resize-none`} rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">{ja ? '電話番号' : bn ? 'ফোন' : 'Phone'}</label>
                  <input className={inputCls} placeholder="+880 1XXX XXXXXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">WhatsApp</label>
                  <input className={inputCls} placeholder="8801XXXXXXXXX" value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Google Maps URL</label>
                <input className={inputCls} type="url" placeholder="https://maps.google.com/..." value={form.google_maps_url} onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))} />
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-sm">{ja ? '営業時間' : bn ? 'কার্যসময়' : 'Working Hours'}</h2>
              <button type="button" onClick={addHourRow} className="text-xs font-semibold text-green-700 hover:text-green-800">+ Add row</button>
            </div>
            <div className="space-y-2">
              {Object.entries(workingHours).map(([day, hours]) => (
                <div key={day} className="flex gap-2 items-center min-w-0">
                  <input className={`${inputCls} flex-1 min-w-0`} value={day} placeholder="Day / Period" onChange={e => updateHourKey(day, e.target.value)} />
                  <input className={`${inputCls} flex-1 min-w-0`} value={hours} placeholder="Hours" onChange={e => updateHourVal(day, e.target.value)} />
                  <button type="button" onClick={() => removeHourRow(day)} className="text-slate-300 hover:text-red-400 text-lg leading-none shrink-0">×</button>
                </div>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-sm">{ja ? 'SNSリンク' : bn ? 'সোশ্যাল লিংক' : 'Social Links'}</h2>
              <button type="button" onClick={addSocialRow} className="text-xs font-semibold text-green-700 hover:text-green-800">+ Add link</button>
            </div>
            <div className="space-y-2">
              {Object.entries(socialLinks).map(([platform, url]) => (
                <div key={platform} className="flex gap-2 items-center min-w-0">
                  <input className={`${inputCls} w-28 min-w-0`} value={platform} placeholder="Platform" onChange={e => updateSocialKey(platform, e.target.value)} />
                  <input className={`${inputCls} flex-1 min-w-0`} value={url} placeholder="https://..." onChange={e => updateSocialVal(platform, e.target.value)} />
                  <button type="button" onClick={() => removeSocialRow(platform)} className="text-slate-300 hover:text-red-400 text-lg leading-none shrink-0">×</button>
                </div>
              ))}
              {Object.keys(socialLinks).length === 0 && (
                <p className="text-xs text-slate-400">{ja ? 'SNSリンクがまだありません。' : bn ? 'কোনো সোশ্যাল লিংক নেই।' : 'No social links yet. Click + Add link.'}</p>
              )}
            </div>
          </div>

          <button type="submit" disabled={save.isPending} className="w-full py-3 bg-green-700 hover:bg-green-800 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
            {save.isPending ? (ja ? '保存中…' : bn ? 'সেভ হচ্ছে…' : 'Saving…') : (ja ? '設定を保存する' : bn ? 'সেটিংস সংরক্ষণ করুন' : 'Save Settings')}
          </button>

        </form>
      )}
    </BranchLayout>
  );
}
