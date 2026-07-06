'use client';
import StudentLayout from '@/components/shared/StudentLayout';
import { useLang } from '@/context/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import { useRef, useState, useEffect } from 'react';

type PostType = 'post' | 'photo' | 'video';

interface DraftPost {
  type: PostType;
  text: string;
  mediaUrl: string;
  videoUrl: string;
}

const TABS: { id: PostType; en: string; bn: string; ja: string; icon: React.ReactNode }[] = [
  {
    id: 'post',
    en: 'Write Post', bn: 'পোস্ট লিখুন', ja: '投稿',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  },
  {
    id: 'photo',
    en: 'Share Photo', bn: 'ছবি শেয়ার', ja: '写真',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  },
  {
    id: 'video',
    en: 'Share Video', bn: 'ভিডিও শেয়ার', ja: '動画',
    icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  },
];

export default function StudentExperiencePage() {
  const { lang } = useLang();
  const { user } = useAuthStore();
  const ja = lang === 'ja'; const bn = lang === 'bn';
  const t = (en: string, ja_: string, bn_: string) => ja ? ja_ : bn ? bn_ : en;

  const [activeTab, setActiveTab] = useState<PostType>('post');
  const [draft, setDraft] = useState<DraftPost>({ type: 'post', text: '', mediaUrl: '', videoUrl: '' });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [postNotice, setPostNotice] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!postNotice) return;
    const timer = setTimeout(() => setPostNotice(false), 3500);
    return () => clearTimeout(timer);
  }, [postNotice]);

  const initials = (user?.name ?? '?').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setDraft(d => ({ ...d, mediaUrl: file.name }));
  }

  return (
    <StudentLayout title={t('My Experience', '私の体験', 'আমার অভিজ্ঞতা')}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Hero ── */}
        <div className="bg-gradient-to-br from-green-700 to-emerald-600 rounded-2xl px-6 py-6 flex items-center gap-5">
          <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-black text-white leading-tight">
              {t('Share Your Journey', '旅を共有', 'আপনার যাত্রা শেয়ার করুন')}
            </h2>
            <p className="text-green-100 text-sm mt-0.5">
              {t('Post photos, videos and stories from your study abroad experience', '留学体験を投稿しよう', 'বিদেশে পড়াশোনার অভিজ্ঞতা শেয়ার করুন')}
            </p>
          </div>
        </div>

        {/* ── Create Post Card ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
            <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
            <span className="text-sm font-semibold text-slate-800">
              {t('Create Post', '投稿を作成', 'পোস্ট তৈরি করুন')}
            </span>
          </div>

          <div className="px-5 py-4">
            {/* Avatar + type tabs */}
            <div className="flex items-center gap-3 mb-4">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={`${user?.name ?? 'User'} profile photo`} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex gap-1 flex-wrap">
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPhotoPreview(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      activeTab === tab.id ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}>
                    {tab.icon}
                    {ja ? tab.ja : bn ? tab.bn : tab.en}
                  </button>
                ))}
              </div>
            </div>

            {/* Text area */}
            <textarea
              rows={3}
              value={draft.text}
              onChange={e => setDraft(d => ({ ...d, text: e.target.value }))}
              placeholder={
                activeTab === 'post'
                  ? t("What's on your mind? Share your study abroad experience...", '留学体験をシェアしよう...', 'আপনার মনে কী আছে? আপনার অভিজ্ঞতা শেয়ার করুন...')
                  : activeTab === 'photo'
                  ? t('Add a caption for your photo...', '写真のキャプションを追加...', 'ছবির জন্য ক্যাপশন লিখুন...')
                  : t('Add a description for your video...', '動画の説明を追加...', 'ভিডিওর বিবরণ লিখুন...')
              }
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-500/40 placeholder:text-slate-400"
            />

            {/* Photo upload */}
            {activeTab === 'photo' && (
              <div className="mt-3">
                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200">
                    <img src={photoPreview} alt="preview" className="w-full max-h-64 object-cover" />
                    <button onClick={() => { setPhotoPreview(null); setDraft(d => ({ ...d, mediaUrl: '' })); if (fileRef.current) fileRef.current.value = ''; }}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-slate-200 hover:border-green-400 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:text-green-600 transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-sm font-semibold">{t('Click to upload photo', '写真をアップロード', 'ছবি আপলোড করুন')}</span>
                    <span className="text-xs">{t('JPG, PNG, WEBP up to 10MB', 'JPG, PNG, WEBP 10MBまで', 'JPG, PNG, WEBP সর্বোচ্চ ১০MB')}</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>
            )}

            {/* Video URL */}
            {activeTab === 'video' && (
              <div className="mt-3 space-y-2">
                <input
                  type="url"
                  value={draft.videoUrl}
                  onChange={e => setDraft(d => ({ ...d, videoUrl: e.target.value }))}
                  placeholder={t('Paste YouTube or video URL...', 'YouTubeのURLを貼り付け...', 'YouTube বা ভিডিও URL পেস্ট করুন...')}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 placeholder:text-slate-400"
                />
                <div className="border-2 border-dashed border-slate-200 hover:border-green-400 rounded-xl py-6 flex flex-col items-center gap-2 text-slate-400 hover:text-green-600 transition-colors cursor-pointer" onClick={() => fileRef.current?.click()}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <span className="text-sm font-semibold">{t('Or upload video file', 'またはファイルをアップロード', 'অথবা ভিডিও ফাইল আপলোড করুন')}</span>
                  <span className="text-xs">{t('MP4, MOV up to 100MB', 'MP4, MOV 100MBまで', 'MP4, MOV সর্বোচ্চ ১০০MB')}</span>
                </div>
                <input ref={fileRef} type="file" accept="video/*" className="hidden" />
              </div>
            )}

            {/* Submit */}
            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              {postNotice ? (
                <p className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {t('Community feed coming soon!', 'コミュニティフィードは近日公開!', 'কমিউনিটি ফিড শীঘ্রই আসছে!')}
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  {t('Your post will be visible to Tensai community', 'Tensaiコミュニティに表示されます', 'পোস্টটি Tensai কমিউনিটিতে দেখা যাবে')}
                </p>
              )}
              <button
                onClick={() => setPostNotice(true)}
                disabled={!draft.text.trim() && !draft.mediaUrl && !draft.videoUrl}
                className="px-5 py-2 bg-green-700 hover:bg-green-800 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('Post', '投稿する', 'পোস্ট করুন')}
              </button>
            </div>
          </div>
        </div>

        {/* ── Feed placeholder ── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
            <span className="w-0.5 h-4 bg-green-600 rounded-full shrink-0" />
            <span className="text-sm font-semibold text-slate-800">
              {t('My Posts', '私の投稿', 'আমার পোস্টসমূহ')}
            </span>
          </div>
          <div className="py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-500">
              {t('No posts yet', 'まだ投稿がありません', 'এখনো কোনো পোস্ট নেই')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t('Share your first experience above', '上から最初の体験を投稿しよう', 'উপরে থেকে প্রথম অভিজ্ঞতা শেয়ার করুন')}
            </p>
          </div>
        </div>

      </div>
    </StudentLayout>
  );
}
